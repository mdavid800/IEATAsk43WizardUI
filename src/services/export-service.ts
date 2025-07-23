import { schemaValidator, type ValidationResult } from './schema-validator';
import type { IEATask43Schema } from '@/types/schema';

export interface ExportOptions {
    includeFormHelperFields?: boolean;
    validateBeforeExport?: boolean;
    formatForReadability?: boolean;
}

export interface ExportResult {
    success: boolean;
    data?: string;
    validation?: ValidationResult;
    errors?: string[];
    warnings?: string[];
    cleanedData?: IEATask43Schema;
}

export interface DataCleaningResult {
    cleaned: IEATask43Schema;
    removedFields: string[];
    warnings: string[];
}

export class ExportService {
    private formOnlyFields = [
        'update_at',
        'temp_id',
        'form_helper_fields',
        'ui_state',
        'validation_state',
        'is_dirty',
        'last_modified_by'
    ];

    /**
     * Main export method that handles complete export pipeline
     */
    async exportToJSON(
        data: IEATask43Schema,
        options: ExportOptions = {}
    ): Promise<ExportResult> {
        const {
            includeFormHelperFields = false,
            validateBeforeExport = true,
            formatForReadability = true
        } = options;

        try {
            // Step 1: Clean the data by removing form-only fields
            const cleaningResult = this.cleanFormData(data, includeFormHelperFields);
            
            // Step 2: Validate cleaned data against schema
            let validation: ValidationResult | null = null;
            if (validateBeforeExport) {
                validation = await schemaValidator.validateComplete(cleaningResult.cleaned);
                
                // If validation fails with errors, block export
                if (!validation.isValid && validation.errors.length > 0) {
                    return {
                        success: false,
                        validation,
                        errors: ['Export blocked due to schema validation errors'],
                        warnings: cleaningResult.warnings,
                        cleanedData: cleaningResult.cleaned
                    };
                }
            }

            // Step 3: Generate JSON output
            const jsonString = this.generateJSONString(
                cleaningResult.cleaned,
                formatForReadability
            );

            return {
                success: true,
                data: jsonString,
                validation: validation || undefined,
                warnings: cleaningResult.warnings,
                cleanedData: cleaningResult.cleaned
            };

        } catch (error) {
            return {
                success: false,
                errors: [`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }

    /**
     * Clean form data by removing form-only fields and empty arrays/objects
     */
    cleanFormData(
        data: IEATask43Schema,
        includeFormHelperFields: boolean = false
    ): DataCleaningResult {
        const cleaned = JSON.parse(JSON.stringify(data)); // Deep clone
        const removedFields: string[] = [];
        const warnings: string[] = [];

        // Remove form-only fields recursively
        this.removeFormOnlyFields(cleaned, '', removedFields, includeFormHelperFields);

        // Clean empty arrays and null values
        this.cleanEmptyValues(cleaned, warnings);

        // Ensure required structure exists
        this.ensureRequiredStructure(cleaned, warnings);

        return {
            cleaned,
            removedFields,
            warnings
        };
    }

    /**
     * Generate JSON string with optional formatting
     */
    private generateJSONString(data: IEATask43Schema, formatForReadability: boolean): string {
        if (formatForReadability) {
            return JSON.stringify(data, null, 2);
        }
        return JSON.stringify(data);
    }

    /**
     * Recursively remove form-only fields from the data object
     */
    private removeFormOnlyFields(
        obj: any,
        path: string,
        removedFields: string[],
        includeFormHelperFields: boolean
    ): void {
        if (obj === null || typeof obj !== 'object') {
            return;
        }

        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                this.removeFormOnlyFields(
                    item,
                    `${path}[${index}]`,
                    removedFields,
                    includeFormHelperFields
                );
            });
            return;
        }

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const currentPath = path ? `${path}.${key}` : key;

                // Check if this is a form-only field
                if (!includeFormHelperFields && this.isFormOnlyField(key)) {
                    delete obj[key];
                    removedFields.push(currentPath);
                    continue;
                }

                // Recursively process nested objects and arrays
                if (obj[key] !== null && typeof obj[key] === 'object') {
                    this.removeFormOnlyFields(
                        obj[key],
                        currentPath,
                        removedFields,
                        includeFormHelperFields
                    );
                }
            }
        }
    }

    /**
     * Check if a field is form-only and should be removed from export
     */
    private isFormOnlyField(fieldName: string): boolean {
        return this.formOnlyFields.some(formField => {
            if (formField.endsWith('*')) {
                return fieldName.startsWith(formField.slice(0, -1));
            }
            return fieldName === formField;
        });
    }

    /**
     * Clean empty arrays, null values, and undefined values
     */
    private cleanEmptyValues(obj: any, warnings: string[]): void {
        if (obj === null || typeof obj !== 'object') {
            return;
        }

        if (Array.isArray(obj)) {
            // Remove null/undefined items from arrays
            for (let i = obj.length - 1; i >= 0; i--) {
                if (obj[i] === null || obj[i] === undefined) {
                    obj.splice(i, 1);
                } else if (typeof obj[i] === 'object') {
                    this.cleanEmptyValues(obj[i], warnings);
                }
            }
            return;
        }

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];

                if (value === null || value === undefined) {
                    delete obj[key];
                } else if (Array.isArray(value)) {
                    this.cleanEmptyValues(value, warnings);
                    // Remove empty arrays unless they're required by schema
                    if (value.length === 0) {
                        delete obj[key];
                    }
                } else if (typeof value === 'object') {
                    this.cleanEmptyValues(value, warnings);
                    // Remove empty objects unless they're required by schema
                    if (Object.keys(value).length === 0) {
                        delete obj[key];
                    }
                } else if (typeof value === 'string' && value.trim() === '') {
                    // Convert empty strings to null for optional fields
                    delete obj[key];
                }
            }
        }
    }

    /**
     * Ensure required structure exists in the cleaned data
     */
    private ensureRequiredStructure(obj: IEATask43Schema, warnings: string[]): void {
        // Ensure measurement_location array exists
        if (!obj.measurement_location || !Array.isArray(obj.measurement_location)) {
            obj.measurement_location = [];
            warnings.push('Added empty measurement_location array');
        }

        // Ensure each measurement location has required structure
        obj.measurement_location.forEach((location, index) => {
            if (!location.measurement_point || !Array.isArray(location.measurement_point)) {
                location.measurement_point = [];
                warnings.push(`Added empty measurement_point array for location ${index + 1}`);
            }
        });
    }

    /**
     * Validate export readiness - checks if data can be exported without errors
     */
    async validateExportReadiness(data: IEATask43Schema): Promise<ValidationResult> {
        const cleaningResult = this.cleanFormData(data, false);
        return await schemaValidator.validateComplete(cleaningResult.cleaned);
    }

    /**
     * Get export preview with validation status
     */
    async getExportPreview(
        data: IEATask43Schema,
        options: ExportOptions = {}
    ): Promise<{
        preview: string;
        validation: ValidationResult;
        cleaningInfo: {
            removedFields: string[];
            warnings: string[];
        };
    }> {
        const cleaningResult = this.cleanFormData(data, options.includeFormHelperFields);
        const validation = await schemaValidator.validateComplete(cleaningResult.cleaned);
        
        const preview = this.generateJSONString(
            cleaningResult.cleaned,
            options.formatForReadability !== false
        );

        return {
            preview,
            validation,
            cleaningInfo: {
                removedFields: cleaningResult.removedFields,
                warnings: cleaningResult.warnings
            }
        };
    }

    /**
     * Export with specific format and compression options
     */
    async exportWithOptions(
        data: IEATask43Schema,
        filename: string = 'iea-task43-export.json',
        options: ExportOptions = {}
    ): Promise<void> {
        const result = await this.exportToJSON(data, options);
        
        if (!result.success || !result.data) {
            throw new Error(`Export failed: ${result.errors?.join(', ') || 'Unknown error'}`);
        }

        // Create and trigger download
        const blob = new Blob([result.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get comprehensive export statistics
     */
    getExportStatistics(data: IEATask43Schema): {
        totalLocations: number;
        totalMeasurementPoints: number;
        stationTypes: Record<string, number>;
        dataCompleteness: number;
        requiredFieldsComplete: boolean;
    } {
        const stats = {
            totalLocations: data.measurement_location?.length || 0,
            totalMeasurementPoints: 0,
            stationTypes: {} as Record<string, number>,
            dataCompleteness: 0,
            requiredFieldsComplete: false
        };

        if (data.measurement_location) {
            data.measurement_location.forEach(location => {
                // Count measurement points
                stats.totalMeasurementPoints += location.measurement_point?.length || 0;
                
                // Count station types
                const stationType = location.measurement_station_type_id || 'unknown';
                stats.stationTypes[stationType] = (stats.stationTypes[stationType] || 0) + 1;
            });
        }

        // Calculate data completeness (simplified)
        const requiredFields = ['author', 'organisation', 'measurement_location'];
        const completedFields = requiredFields.filter(field => {
            const value = (data as any)[field];
            return value !== null && value !== undefined && value !== '';
        });
        
        stats.dataCompleteness = (completedFields.length / requiredFields.length) * 100;
        stats.requiredFieldsComplete = stats.dataCompleteness === 100;

        return stats;
    }
}

// Export singleton instance
export const exportService = new ExportService();