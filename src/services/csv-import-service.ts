import Papa from 'papaparse';
import { schemaService } from './schema-service';
import { schemaValidator, ValidationResult, SchemaValidationError } from './schema-validator';
import type { MeasurementPoint, MeasurementType, HeightReference, StatisticType } from '@/types/schema';

export interface CSVValidationError {
    type: 'error' | 'warning';
    message: string;
    row?: number;
    column?: string;
    suggestedFix?: string;
}

export interface CSVValidationResult {
    isValid: boolean;
    errors: CSVValidationError[];
    data: { headers: string[]; headerRowIndex: number; timeColIndex: number } | null;
}

export interface ImportResult {
    success: boolean;
    validRows: MeasurementPointImportRow[];
    invalidRows: MeasurementPointImportRow[];
    warnings: CSVValidationError[];
    summary: {
        totalRows: number;
        validRows: number;
        invalidRows: number;
        skippedRows: number;
    };
}

export interface MeasurementPointImportRow {
    rawData: any;
    mappedData: Partial<MeasurementPoint>;
    validation: ValidationResult;
    rowIndex: number;
}

export interface ColumnMappingResult {
    name: string;
    measurementType: MeasurementType;
    height: number | null;
    unit?: string;
    statisticType: StatisticType;
    confidence: number; // 0-1 confidence in the mapping
}

export class SchemaAwareCSVImportService {
    private measurementPointSchema: any;
    private validMeasurementTypes: string[];
    private validStatisticTypes: string[];
    private validHeightReferences: string[];

    constructor() {
        // Get the measurement_point schema
        this.measurementPointSchema = schemaService.getSchemaProperty(
            'measurement_location.items.properties.measurement_point.items'
        );
        
        // Cache valid enum values from schema
        this.validMeasurementTypes = schemaService.getEnumValues('definitions.measurement_type');
        this.validStatisticTypes = schemaService.getEnumValues('definitions.statistic_type');
        this.validHeightReferences = schemaService.getEnumValues('definitions.height_reference');
    }

    /**
     * Import and validate CSV data against the measurement point schema
     */
    async importCSV(csvData: string, locationIndex: number, loggerId: string): Promise<ImportResult> {
        try {
            // Parse CSV data
            const parseResult = await this.parseCSV(csvData);
            
            if (!parseResult.isValid || !parseResult.data) {
                return {
                    success: false,
                    validRows: [],
                    invalidRows: [],
                    warnings: parseResult.errors,
                    summary: {
                        totalRows: 0,
                        validRows: 0,
                        invalidRows: 0,
                        skippedRows: 0
                    }
                };
            }

            const { headers, headerRowIndex, timeColIndex } = parseResult.data;
            
            // Get data columns (exclude timestamp column)
            const dataColumns = headers.filter((_, index) => index !== timeColIndex);
            
            // Map each column to a measurement point
            const importRows: MeasurementPointImportRow[] = [];
            let skippedRows = 0;

            for (let i = 0; i < dataColumns.length; i++) {
                const columnHeader = dataColumns[i];
                
                // Skip empty or invalid headers
                if (!columnHeader || columnHeader.trim() === '') {
                    skippedRows++;
                    continue;
                }

                try {
                    const mappingResult = this.mapColumnHeaderToSchema(columnHeader);
                    const mappedData = this.createMeasurementPointFromMapping(
                        mappingResult, 
                        loggerId,
                        columnHeader
                    );
                    
                    // Validate against schema
                    const validation = schemaValidator.validatePath(
                        mappedData, 
                        'measurement_location.items.properties.measurement_point.items'
                    );

                    importRows.push({
                        rawData: { columnHeader, columnIndex: i },
                        mappedData,
                        validation,
                        rowIndex: i
                    });
                } catch (error) {
                    // Handle mapping errors
                    importRows.push({
                        rawData: { columnHeader, columnIndex: i },
                        mappedData: {},
                        validation: {
                            isValid: false,
                            errors: [{
                                schemaPath: 'measurement_point',
                                dataPath: `column_${i}`,
                                message: `Failed to process column "${columnHeader}": ${error instanceof Error ? error.message : 'Unknown error'}`,
                                schemaRule: 'import',
                                severity: 'error' as const
                            }],
                            warnings: []
                        },
                        rowIndex: i
                    });
                }
            }

            // Separate valid and invalid rows
            const validRows = importRows.filter(row => row.validation.isValid);
            const invalidRows = importRows.filter(row => !row.validation.isValid);

            // Generate warnings
            const warnings: CSVValidationError[] = [];
            
            if (skippedRows > 0) {
                warnings.push({
                    type: 'warning',
                    message: `Skipped ${skippedRows} empty or invalid column headers`
                });
            }

            if (validRows.length === 0 && dataColumns.length > 0) {
                warnings.push({
                    type: 'error',
                    message: 'No valid measurement points could be created from the CSV columns',
                    suggestedFix: 'Check that column headers contain measurement information like wind speed, temperature, etc.'
                });
            }

            return {
                success: validRows.length > 0,
                validRows,
                invalidRows,
                warnings,
                summary: {
                    totalRows: dataColumns.length,
                    validRows: validRows.length,
                    invalidRows: invalidRows.length,
                    skippedRows
                }
            };

        } catch (error) {
            return {
                success: false,
                validRows: [],
                invalidRows: [],
                warnings: [{
                    type: 'error',
                    message: `CSV import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    suggestedFix: 'Check that the file is a valid CSV format'
                }],
                summary: {
                    totalRows: 0,
                    validRows: 0,
                    invalidRows: 0,
                    skippedRows: 0
                }
            };
        }
    }

    /**
     * Parse CSV structure and validate format
     */
    private async parseCSV(csvData: string): Promise<CSVValidationResult> {
        return new Promise((resolve) => {
            Papa.parse(csvData, {
                complete: (results) => {
                    const validation = this.validateCSVStructure(results.data);
                    resolve(validation);
                },
                error: (error) => {
                    resolve({
                        isValid: false,
                        errors: [{
                            type: 'error',
                            message: `CSV parsing error: ${error.message}`
                        }],
                        data: null
                    });
                }
            });
        });
    }

    /**
     * Validate CSV structure (similar to existing logic but schema-aware)
     */
    private validateCSVStructure(data: any[]): CSVValidationResult {
        const errors: CSVValidationError[] = [];

        // Remove empty rows
        const nonEmptyRows = data.filter(row => {
            if (!Array.isArray(row)) return false;
            return row.some((cell: any) => cell !== null && cell !== undefined && cell !== '');
        });

        if (nonEmptyRows.length < 2) {
            errors.push({
                type: 'error',
                message: 'CSV file must contain at least 2 rows (header and data)',
                suggestedFix: 'Ensure the CSV has both header row and data rows'
            });
            return { isValid: false, errors, data: null };
        }

        // Find header row
        let headerRowIndex = 0;
        let headers: string[] = [];

        // Check first few rows to find header
        for (let i = 0; i < Math.min(5, nonEmptyRows.length); i++) {
            const potentialHeaders = nonEmptyRows[i] as string[];
            if (potentialHeaders && potentialHeaders.length > 1) {
                const nonEmptyCells = potentialHeaders.filter(cell => 
                    cell !== null && cell !== undefined && cell !== ''
                );
                
                if (nonEmptyCells.length > Math.max(2, potentialHeaders.length * 0.2)) {
                    // Check if this looks like a header row
                    const headerKeywords = [
                        'time', 'date', 'wind', 'speed', 'dir', 'temp', 'temperature',
                        'humidity', 'pressure', 'wave', 'height', 'period'
                    ];
                    
                    const lowerCaseCells = potentialHeaders.map(cell => 
                        (cell || '').toString().toLowerCase()
                    );

                    const keywordMatches = headerKeywords.some(keyword =>
                        lowerCaseCells.some(cell => cell.includes(keyword))
                    );

                    if (keywordMatches) {
                        headerRowIndex = i;
                        headers = potentialHeaders;
                        break;
                    }
                }
            }
        }

        // If no proper header found, use first row
        if (headers.length === 0) {
            headers = nonEmptyRows[0] as string[];
            headerRowIndex = 0;
        }

        if (!headers || headers.length === 0) {
            errors.push({
                type: 'error',
                message: 'CSV file must contain valid headers',
                suggestedFix: 'Ensure the first row contains column names'
            });
            return { isValid: false, errors, data: null };
        }

        // Find timestamp column
        const timestampColumnIndex = headers.findIndex((header, index) => {
            if (index > 5) return false; // Only check first few columns
            
            const headerStr = (header || '').toString().toLowerCase();
            return headerStr.includes('timestamp') ||
                   headerStr.includes('date') ||
                   headerStr.includes('time') ||
                   headerStr === 'iso' ||
                   headerStr.includes('utc');
        });

        if (timestampColumnIndex === -1) {
            errors.push({
                type: 'warning',
                message: 'No timestamp column detected. First column will be treated as timestamp.',
                suggestedFix: 'Include a column with "timestamp", "date", or "time" in the header'
            });
        }

        const timeColIndex = timestampColumnIndex !== -1 ? timestampColumnIndex : 0;

        // Check for measurement columns
        const dataColumns = headers.filter((name, i) => 
            i !== timeColIndex && name && name.trim() !== ''
        );
        
        if (dataColumns.length === 0) {
            errors.push({
                type: 'error',
                message: 'No valid measurement columns found',
                suggestedFix: 'Ensure there are columns containing measurement data (wind speed, temperature, etc.)'
            });
            return { isValid: false, errors, data: null };
        }

        // Schema-specific validation: check if columns can be mapped to valid measurements
        let mappableColumns = 0;
        for (const columnHeader of dataColumns) {
            try {
                const mapping = this.mapColumnHeaderToSchema(columnHeader);
                if (mapping.confidence > 0.3) { // Reasonable confidence threshold
                    mappableColumns++;
                }
            } catch {
                // Column not mappable, continue
            }
        }

        if (mappableColumns === 0) {
            errors.push({
                type: 'warning',
                message: 'No columns could be automatically mapped to known measurement types',
                suggestedFix: 'Ensure column headers contain measurement information (e.g., "WindSpeed_80m", "Temperature_2m")'
            });
        }

        const hasErrors = errors.some(error => error.type === 'error');

        return {
            isValid: !hasErrors,
            errors,
            data: hasErrors ? null : { headers, headerRowIndex, timeColIndex }
        };
    }

    /**
     * Map a CSV column header to schema properties using enhanced pattern matching
     */
    private mapColumnHeaderToSchema(header: string): ColumnMappingResult {
        const result: ColumnMappingResult = {
            name: header, // Preserve original header name
            measurementType: 'other',
            height: null,
            unit: undefined,
            statisticType: 'avg',
            confidence: 0
        };

        const lowerHeader = header.toLowerCase();
        let confidence = 0;

        // Extract height using various patterns
        const heightPatterns = [
            /(?:^|[^0-9])(\d+)m\b/i,
            /_(\d+)m/i,
            /(\d+)\s+m\b/i,
            /height(\d+)/i,
            /_(\d+)m\b/i
        ];

        for (const pattern of heightPatterns) {
            const match = pattern.exec(lowerHeader);
            if (match) {
                result.height = parseInt(match[1], 10);
                confidence += 0.2;
                break;
            }
        }

        // Enhanced measurement type detection with confidence scoring
        const measurementPatterns = [
            // Wind speed patterns
            { patterns: [/windspeed|wind_speed|wind[._]?s|w[._]?s/i], type: 'wind_speed', confidence: 0.8 },
            { patterns: [/verticalwindspeed|vertical_wind_speed|vert[._]?w[._]?s|vertical[._]?speed/i], type: 'wind_speed', confidence: 0.9 },
            
            // Wind direction patterns
            { patterns: [/winddir|wind_dir|wind[._]?d|w[._]?d|wind[._]?direction|direction/i], type: 'wind_direction', confidence: 0.8 },
            { patterns: [/azimuth|heading|bearing/i], type: 'wind_direction', confidence: 0.6 },
            
            // Temperature patterns
            { patterns: [/temp|temperature/i], type: 'temperature', confidence: 0.8 },
            { patterns: [/air[._]?temp|airtemp/i], type: 'air_temperature', confidence: 0.9 },
            { patterns: [/water[._]?temp|watertemp/i], type: 'water_temperature', confidence: 0.9 },
            
            // Pressure patterns
            { patterns: [/press|pressure|baro/i], type: 'air_pressure', confidence: 0.8 },
            
            // Humidity patterns
            { patterns: [/humid|humidity|rh\b/i], type: 'relative_humidity', confidence: 0.8 },
            
            // Wave measurements
            { patterns: [/significantwaveheight|significant[._]?wave|hsig|hs\b/i], type: 'wave_height', confidence: 0.9 },
            { patterns: [/maximumwaveheight|maximum[._]?wave|hmax/i], type: 'wave_height', confidence: 0.8 },
            { patterns: [/peakperiod|peak[._]?period|tp\b/i], type: 'wave_period', confidence: 0.9 },
            { patterns: [/wavedirection|wave[._]?direction|mwd\b/i], type: 'wave_direction', confidence: 0.9 }
        ];

        for (const { patterns, type, confidence: patternConfidence } of measurementPatterns) {
            if (patterns.some(pattern => pattern.test(lowerHeader))) {
                result.measurementType = type as MeasurementType;
                confidence += patternConfidence;
                break;
            }
        }

        // Statistic type detection with confidence
        const statisticPatterns = [
            { patterns: [/\bavg\b|\baverage\b|\bmean\b/i], type: 'avg', confidence: 0.6 },
            { patterns: [/\bstd\b|\bstdev\b|\bstandarddeviation\b/i], type: 'sd', confidence: 0.8 },
            { patterns: [/\bmax\b|\bmaximum\b|\bpeak\b/i], type: 'max', confidence: 0.7 },
            { patterns: [/\bmin\b|\bminimum\b/i], type: 'min', confidence: 0.7 },
            { patterns: [/\bti\b|\bturbulence\b|\bintensity\b/i], type: 'ti', confidence: 0.8 },
            { patterns: [/\bgust\b|\bgusting\b/i], type: 'gust', confidence: 0.8 }
        ];

        for (const { patterns, type, confidence: patternConfidence } of statisticPatterns) {
            if (patterns.some(pattern => pattern.test(lowerHeader))) {
                result.statisticType = type as StatisticType;
                confidence += patternConfidence;
                break;
            }
        }

        // Unit detection
        const unitPatterns = [
            { pattern: /m\/s/i, unit: 'm/s', confidence: 0.3 },
            { pattern: /deg/i, unit: 'deg', confidence: 0.3 },
            { pattern: /%/i, unit: '%', confidence: 0.3 },
            { pattern: /hpa/i, unit: 'hPa', confidence: 0.3 },
            { pattern: /mbar/i, unit: 'mbar', confidence: 0.3 }
        ];

        for (const { pattern, unit, confidence: patternConfidence } of unitPatterns) {
            if (pattern.test(lowerHeader)) {
                result.unit = unit;
                confidence += patternConfidence;
                break;
            }
        }

        // Additional confidence for having height information
        if (result.height !== null) {
            confidence += 0.2;
        }

        // Validate against schema enums and adjust confidence
        if (this.validMeasurementTypes.includes(result.measurementType)) {
            confidence += 0.1;
        } else {
            confidence -= 0.2;
        }

        if (this.validStatisticTypes.includes(result.statisticType)) {
            confidence += 0.1;
        } else {
            confidence -= 0.1;
        }

        result.confidence = Math.max(0, Math.min(1, confidence));

        return result;
    }

    /**
     * Create a measurement point object from mapping result
     */
    private createMeasurementPointFromMapping(
        mapping: ColumnMappingResult,
        loggerId: string,
        originalColumnName: string
    ): Partial<MeasurementPoint> {
        const now = new Date().toISOString();

        return {
            name: mapping.name,
            measurement_type_id: mapping.measurementType,
            height_m: mapping.height || 0,
            height_reference_id: 'ground_level' as HeightReference,
            update_at: now,
            logger_measurement_config: [{
                logger_id: loggerId,
                date_from: now,
                date_to: null,
                update_at: now,
                column_name: [{
                    column_name: originalColumnName,
                    statistic_type_id: mapping.statisticType,
                    is_ignored: false,
                    update_at: now
                }]
            }],
            sensor: []
        };
    }

    /**
     * Get suggested column mappings for user review
     */
    getSuggestedMappings(csvData: string): Promise<ColumnMappingResult[]> {
        return new Promise((resolve) => {
            Papa.parse(csvData, {
                complete: (results) => {
                    const validation = this.validateCSVStructure(results.data);
                    
                    if (!validation.isValid || !validation.data) {
                        resolve([]);
                        return;
                    }

                    const { headers, timeColIndex } = validation.data;
                    const dataColumns = headers.filter((_, index) => index !== timeColIndex);
                    
                    const mappings = dataColumns.map(header => {
                        try {
                            return this.mapColumnHeaderToSchema(header);
                        } catch {
                            return {
                                name: header,
                                measurementType: 'other' as MeasurementType,
                                height: null,
                                statisticType: 'avg' as StatisticType,
                                confidence: 0
                            };
                        }
                    });

                    resolve(mappings);
                },
                error: () => {
                    resolve([]);
                }
            });
        });
    }
}

// Export singleton instance
export const csvImportService = new SchemaAwareCSVImportService();