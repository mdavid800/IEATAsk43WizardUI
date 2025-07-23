import { schemaService } from './schema-service';
import type { MeasurementType, StatisticType, HeightReference } from '@/types/schema';

export interface CSVTemplateColumn {
    name: string;
    description: string;
    type: string;
    required: boolean;
    example: string;
    measurementType?: MeasurementType;
    statisticType?: StatisticType;
    height?: number;
    unit?: string;
}

export interface CSVTemplate {
    headers: string[];
    exampleRow: string[];
    columns: CSVTemplateColumn[];
    instructions: string[];
}

export class CSVTemplateService {
    private measurementTypes: string[];
    private statisticTypes: string[];
    private heightReferences: string[];

    constructor() {
        // Cache schema enum values
        this.measurementTypes = schemaService.getEnumValues('definitions.measurement_type');
        this.statisticTypes = schemaService.getEnumValues('definitions.statistic_type');
        this.heightReferences = schemaService.getEnumValues('definitions.height_reference');
    }

    /**
     * Generate a comprehensive CSV template based on the measurement_point schema
     */
    generateTemplate(includeAllMeasurementTypes: boolean = false): CSVTemplate {
        const columns: CSVTemplateColumn[] = [];
        const headers: string[] = [];
        const exampleRow: string[] = [];

        // Always include timestamp column first
        const timestampColumn: CSVTemplateColumn = {
            name: 'Timestamp',
            description: 'ISO 8601 formatted timestamp for measurements',
            type: 'datetime',
            required: true,
            example: '2024-01-01T00:00:00Z'
        };
        columns.push(timestampColumn);
        headers.push('Timestamp');
        exampleRow.push('2024-01-01T00:00:00Z');

        if (includeAllMeasurementTypes) {
            // Generate examples for all measurement types
            this.generateAllMeasurementTypeColumns(columns, headers, exampleRow);
        } else {
            // Generate common measurement columns
            this.generateCommonMeasurementColumns(columns, headers, exampleRow);
        }

        const instructions = this.generateInstructions();

        return {
            headers,
            exampleRow,
            columns,
            instructions
        };
    }

    /**
     * Generate template for specific measurement types and heights
     */
    generateCustomTemplate(measurements: Array<{
        type: MeasurementType;
        heights: number[];
        statistics: StatisticType[];
        unit?: string;
    }>): CSVTemplate {
        const columns: CSVTemplateColumn[] = [];
        const headers: string[] = [];
        const exampleRow: string[] = [];

        // Timestamp column
        columns.push({
            name: 'Timestamp',
            description: 'ISO 8601 formatted timestamp for measurements',
            type: 'datetime',
            required: true,
            example: '2024-01-01T00:00:00Z'
        });
        headers.push('Timestamp');
        exampleRow.push('2024-01-01T00:00:00Z');

        // Generate columns for each measurement specification
        for (const measurement of measurements) {
            for (const height of measurement.heights) {
                for (const statistic of measurement.statistics) {
                    const columnName = this.generateColumnName(
                        measurement.type, 
                        height, 
                        statistic, 
                        measurement.unit
                    );
                    
                    const column: CSVTemplateColumn = {
                        name: columnName,
                        description: `${this.getMeasurementTypeDescription(measurement.type)} at ${height}m (${statistic})`,
                        type: 'number',
                        required: false,
                        example: this.getExampleValue(measurement.type, statistic),
                        measurementType: measurement.type,
                        statisticType: statistic,
                        height,
                        unit: measurement.unit
                    };

                    columns.push(column);
                    headers.push(columnName);
                    exampleRow.push(column.example);
                }
            }
        }

        const instructions = this.generateInstructions();

        return {
            headers,
            exampleRow,
            columns,
            instructions
        };
    }

    /**
     * Generate CSV template as downloadable string
     */
    generateCSVString(template: CSVTemplate): string {
        const csvLines = [
            template.headers.join(','),
            template.exampleRow.join(',')
        ];

        return csvLines.join('\n');
    }

    /**
     * Generate template with instructions as downloadable string
     */
    generateFullTemplate(template: CSVTemplate): string {
        const lines = [
            '# CSV Import Template for IEA Task 43 Measurement Points',
            '# Instructions:',
            ...template.instructions.map(instruction => `# ${instruction}`),
            '#',
            '# Column Descriptions:',
            ...template.columns.map(col => `# ${col.name}: ${col.description} (${col.type}${col.required ? ', required' : ''})`),
            '#',
            '# Template Data:',
            template.headers.join(','),
            template.exampleRow.join(',')
        ];

        return lines.join('\n');
    }

    /**
     * Generate common measurement columns for typical wind measurements
     */
    private generateCommonMeasurementColumns(
        columns: CSVTemplateColumn[], 
        headers: string[], 
        exampleRow: string[]
    ): void {
        // Common wind measurement configurations
        const commonMeasurements = [
            { type: 'wind_speed', heights: [40, 60, 80, 100], statistics: ['avg', 'max', 'min', 'sd'], unit: 'm/s' },
            { type: 'wind_direction', heights: [40, 60, 80, 100], statistics: ['avg', 'sd'], unit: 'deg' },
            { type: 'air_temperature', heights: [2], statistics: ['avg', 'max', 'min'], unit: '°C' },
            { type: 'air_pressure', heights: [2], statistics: ['avg'], unit: 'hPa' },
            { type: 'relative_humidity', heights: [2], statistics: ['avg'], unit: '%' }
        ];

        for (const measurement of commonMeasurements) {
            // Only generate a few key heights and statistics for common template
            const selectedHeights = measurement.heights.slice(0, 2); // First 2 heights
            const selectedStats = measurement.statistics.slice(0, 2); // First 2 statistics

            for (const height of selectedHeights) {
                for (const statistic of selectedStats) {
                    const columnName = this.generateColumnName(
                        measurement.type as MeasurementType,
                        height,
                        statistic as StatisticType,
                        measurement.unit
                    );

                    const column: CSVTemplateColumn = {
                        name: columnName,
                        description: `${this.getMeasurementTypeDescription(measurement.type as MeasurementType)} at ${height}m (${statistic})`,
                        type: 'number',
                        required: false,
                        example: this.getExampleValue(measurement.type as MeasurementType, statistic as StatisticType),
                        measurementType: measurement.type as MeasurementType,
                        statisticType: statistic as StatisticType,
                        height,
                        unit: measurement.unit
                    };

                    columns.push(column);
                    headers.push(columnName);
                    exampleRow.push(column.example);
                }
            }
        }
    }

    /**
     * Generate columns for all measurement types (comprehensive template)
     */
    private generateAllMeasurementTypeColumns(
        columns: CSVTemplateColumn[], 
        headers: string[], 
        exampleRow: string[]
    ): void {
        const measurementConfigs = [
            { type: 'wind_speed', height: 80, statistic: 'avg', unit: 'm/s' },
            { type: 'wind_direction', height: 80, statistic: 'avg', unit: 'deg' },
            { type: 'air_temperature', height: 2, statistic: 'avg', unit: '°C' },
            { type: 'water_temperature', height: 0, statistic: 'avg', unit: '°C' },
            { type: 'air_pressure', height: 2, statistic: 'avg', unit: 'hPa' },
            { type: 'relative_humidity', height: 2, statistic: 'avg', unit: '%' },
            { type: 'wave_height', height: 0, statistic: 'avg', unit: 'm' },
            { type: 'wave_period', height: 0, statistic: 'avg', unit: 's' },
            { type: 'wave_direction', height: 0, statistic: 'avg', unit: 'deg' },
            { type: 'precipitation', height: 2, statistic: 'sum', unit: 'mm' },
            { type: 'solar_irradiance', height: 2, statistic: 'avg', unit: 'W/m²' }
        ];

        for (const config of measurementConfigs) {
            if (this.measurementTypes.includes(config.type)) {
                const columnName = this.generateColumnName(
                    config.type as MeasurementType,
                    config.height,
                    config.statistic as StatisticType,
                    config.unit
                );

                const column: CSVTemplateColumn = {
                    name: columnName,
                    description: `${this.getMeasurementTypeDescription(config.type as MeasurementType)} at ${config.height}m (${config.statistic})`,
                    type: 'number',
                    required: false,
                    example: this.getExampleValue(config.type as MeasurementType, config.statistic as StatisticType),
                    measurementType: config.type as MeasurementType,
                    statisticType: config.statistic as StatisticType,
                    height: config.height,
                    unit: config.unit
                };

                columns.push(column);
                headers.push(columnName);
                exampleRow.push(column.example);
            }
        }
    }

    /**
     * Generate standardized column name
     */
    private generateColumnName(
        type: MeasurementType, 
        height: number, 
        statistic: StatisticType, 
        unit?: string
    ): string {
        const typeMap: Record<string, string> = {
            'wind_speed': 'WindSpeed',
            'wind_direction': 'WindDir',
            'air_temperature': 'AirTemp',
            'water_temperature': 'WaterTemp',
            'air_pressure': 'Pressure',
            'relative_humidity': 'Humidity',
            'wave_height': 'WaveHeight',
            'wave_period': 'WavePeriod',
            'wave_direction': 'WaveDir',
            'precipitation': 'Precip',
            'solar_irradiance': 'Solar'
        };

        const statisticMap: Record<string, string> = {
            'avg': 'Avg',
            'max': 'Max',
            'min': 'Min',
            'sd': 'Std',
            'ti': 'TI',
            'gust': 'Gust',
            'sum': 'Sum'
        };

        const typeName = typeMap[type] || type;
        const statName = statisticMap[statistic] || statistic;
        
        if (height > 0) {
            return `${typeName}_${height}m_${statName}`;
        } else {
            return `${typeName}_${statName}`;
        }
    }

    /**
     * Get example value for measurement type and statistic
     */
    private getExampleValue(type: MeasurementType, statistic: StatisticType): string {
        const examples: Record<string, Record<string, string>> = {
            'wind_speed': {
                'avg': '8.5',
                'max': '12.3',
                'min': '4.2',
                'sd': '2.1',
                'gust': '15.8'
            },
            'wind_direction': {
                'avg': '245',
                'sd': '15'
            },
            'air_temperature': {
                'avg': '15.2',
                'max': '18.7',
                'min': '12.1'
            },
            'water_temperature': {
                'avg': '12.5'
            },
            'air_pressure': {
                'avg': '1013.2'
            },
            'relative_humidity': {
                'avg': '65'
            },
            'wave_height': {
                'avg': '2.1',
                'max': '3.8'
            },
            'wave_period': {
                'avg': '7.2'
            },
            'wave_direction': {
                'avg': '180'
            },
            'precipitation': {
                'sum': '0.5'
            },
            'solar_irradiance': {
                'avg': '450'
            }
        };

        return examples[type]?.[statistic] || '0';
    }

    /**
     * Get human-readable description for measurement type
     */
    private getMeasurementTypeDescription(type: MeasurementType): string {
        const descriptions: Record<string, string> = {
            'wind_speed': 'Wind Speed',
            'wind_direction': 'Wind Direction',
            'air_temperature': 'Air Temperature',
            'water_temperature': 'Water Temperature',
            'air_pressure': 'Air Pressure',
            'relative_humidity': 'Relative Humidity',
            'wave_height': 'Wave Height',
            'wave_period': 'Wave Period',
            'wave_direction': 'Wave Direction',
            'precipitation': 'Precipitation',
            'solar_irradiance': 'Solar Irradiance',
            'other': 'Other Measurement'
        };

        return descriptions[type] || type.replace('_', ' ');
    }

    /**
     * Generate usage instructions
     */
    private generateInstructions(): string[] {
        return [
            '1. Keep the timestamp column as the first column with ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)',
            '2. Column names should include measurement type, height, and statistic (e.g., WindSpeed_80m_Avg)',
            '3. Use consistent units: m/s for wind speed, deg for directions, °C for temperature',
            '4. Heights should be in meters above ground level',
            '5. Common statistics: Avg (average), Max (maximum), Min (minimum), Std (standard deviation)',
            '6. Remove or modify columns as needed for your specific measurements',
            '7. Ensure data rows contain numeric values (use empty cells for missing data)',
            '8. The first data row is treated as example - replace with your actual data'
        ];
    }
}

// Export singleton instance
export const csvTemplateService = new CSVTemplateService();