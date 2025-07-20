import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Import the IEA schema
import ieaSchemaData from './iea43-schema.json';

const ieaSchema = ieaSchemaData;

// Types for validation results
export interface ValidationError {
    path: string;
    message: string;
    expectedType?: string;
    actualValue?: any;
    keyword?: string;
}

export interface ValidationWarning {
    path: string;
    message: string;
    suggestion?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

// Schema validation service class
export class SchemaValidationService {
    private ajv: Ajv;
    private validator: any;

    constructor() {
        // Initialize AJV with formats support
        this.ajv = new Ajv({
            allErrors: true,
            verbose: true,
            strict: false, // Allow additional properties not in schema
            strictSchema: false, // Allow custom keywords like $version
            strictTypes: false, // Don't validate types strictly to handle schema inconsistencies
            strictRequired: false // Don't strictly require properties to handle schema inconsistencies
        });

        // Add format validation (date-time, uuid, etc.)
        addFormats(this.ajv);

        // Compile the IEA schema
        try {
            this.validator = this.ajv.compile(ieaSchema);
        } catch (error) {
            console.error('Failed to compile IEA schema:', error);
            throw new Error('Schema compilation failed');
        }
    }

    /**
     * Validate data against the official IEA Task 43 schema
     */
    validateAgainstIEASchema(data: any): ValidationResult {
        try {
            const isValid = this.validator(data);

            const errors: ValidationError[] = [];
            const warnings: ValidationWarning[] = [];

            if (!isValid && this.validator.errors) {
                // Transform AJV errors into our ValidationError format
                for (const error of this.validator.errors) {
                    const validationError: ValidationError = {
                        path: this.formatErrorPath(error.instancePath, error.schemaPath),
                        message: this.formatErrorMessage(error),
                        expectedType: error.schema?.type || error.schema?.enum ? 'enum' : undefined,
                        actualValue: error.data,
                        keyword: error.keyword
                    };

                    errors.push(validationError);
                }
            }

            return {
                isValid,
                errors,
                warnings
            };
        } catch (error) {
            // Handle validation errors gracefully
            return {
                isValid: false,
                errors: [{
                    path: 'root',
                    message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                }],
                warnings: []
            };
        }
    }

    /**
     * Get validation errors from the last validation
     */
    getValidationErrors(): ValidationError[] {
        if (!this.validator.errors) return [];

        return this.validator.errors.map((error: any) => ({
            path: this.formatErrorPath(error.instancePath, error.schemaPath),
            message: this.formatErrorMessage(error),
            expectedType: error.schema?.type || error.schema?.enum ? 'enum' : undefined,
            actualValue: error.data,
            keyword: error.keyword
        }));
    }

    /**
     * Check if the last validation was compliant
     */
    isCompliant(): boolean {
        return this.validator.errors === null || this.validator.errors.length === 0;
    }

    /**
     * Validate specific field types commonly used in IEA schema
     */
    validateDateTimeFormat(dateString: string): boolean {
        // ISO 8601 format with 'T' separator as required by IEA schema
        const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/;
        return iso8601Regex.test(dateString);
    }

    /**
     * Validate UUID format
     */
    validateUUIDFormat(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Get enum values for a specific field from the schema
     */
    getEnumValues(fieldPath: string): string[] | null {
        try {
            // Navigate through the schema to find enum values
            const pathParts = fieldPath.split('.');
            let current: any = ieaSchema;

            for (const part of pathParts) {
                if (current.properties && current.properties[part]) {
                    current = current.properties[part];
                } else if (current.items && current.items.properties && current.items.properties[part]) {
                    current = current.items.properties[part];
                } else if (current.definitions && current.definitions[part]) {
                    current = current.definitions[part];
                } else {
                    return null;
                }
            }

            return current.enum || null;
        } catch (error) {
            console.warn(`Could not retrieve enum values for ${fieldPath}:`, error);
            return null;
        }
    }

    /**
     * Format error path for better readability
     */
    private formatErrorPath(instancePath: string, schemaPath: string): string {
        if (instancePath) {
            return instancePath.replace(/^\//, '').replace(/\//g, '.');
        }

        // Fallback to schema path if instance path is empty
        return schemaPath.replace(/^#\//, '').replace(/\//g, '.');
    }

    /**
     * Format error message for better user understanding
     */
    private formatErrorMessage(error: any): string {
        const { keyword, message, params } = error;

        switch (keyword) {
            case 'required':
                return `Missing required field: ${params.missingProperty}`;
            case 'enum':
                return `Invalid value. Must be one of: ${params.allowedValues?.join(', ') || 'allowed values'}`;
            case 'type':
                return `Invalid type. Expected ${params.type}, got ${typeof error.data}`;
            case 'format':
                return `Invalid format. Expected ${params.format} format`;
            case 'minimum':
                return `Value must be at least ${params.limit}`;
            case 'maximum':
                return `Value must be at most ${params.limit}`;
            case 'minLength':
                return `Value must be at least ${params.limit} characters long`;
            case 'maxLength':
                return `Value must be at most ${params.limit} characters long`;
            default:
                return message || 'Validation error';
        }
    }
}

// Export a singleton instance for easy use
export const schemaValidator = new SchemaValidationService();

// Export utility functions
export const validateIEACompliance = (data: any): ValidationResult => {
    return schemaValidator.validateAgainstIEASchema(data);
};

export const isIEACompliant = (data: any): boolean => {
    const result = schemaValidator.validateAgainstIEASchema(data);
    return result.isValid;
};

/**
 * Validate required fields for IEA Task 43 schema compliance
 * This function checks that all required fields are present in the data
 * It now works with both raw form data and exported JSON data
 */
export const validateRequiredFields = (data: any): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Always add basic required fields for an empty form
    // This ensures we show validation errors even when the form is completely empty
    if (!data || Object.keys(data).length === 0) {
        const basicRequiredFields = ['author', 'organisation', 'date', 'version', 'measurement_location'];
        basicRequiredFields.forEach(field => {
            errors.push({
                path: field,
                message: `Missing required field: ${field}`
            });
        });
        return {
            isValid: false,
            errors,
            warnings
        };
    }

    // Validate top-level required fields
    const requiredTopLevelFields = ['author', 'organisation', 'date', 'version', 'measurement_location'];
    requiredTopLevelFields.forEach(field => {
        // Check for undefined, null, empty string, empty array
        if (!data[field] ||
            (typeof data[field] === 'string' && data[field].trim() === '') ||
            (Array.isArray(data[field]) && data[field].length === 0)) {
            errors.push({
                path: field,
                message: `Missing required field: ${field}`
            });
        }
    });

    // Validate measurement_location required fields
    if (Array.isArray(data.measurement_location)) {
        data.measurement_location.forEach((location: any, locationIndex: number) => {
            const requiredLocationFields = ['name', 'latitude_ddeg', 'longitude_ddeg', 'measurement_station_type_id'];
            requiredLocationFields.forEach(field => {
                if (!location[field]) {
                    errors.push({
                        path: `measurement_location[${locationIndex}].${field}`,
                        message: `Missing required field: ${field}`
                    });
                }
            });

            // Validate logger_main_config required fields if present
            if (Array.isArray(location.logger_main_config)) {
                location.logger_main_config.forEach((logger: any, loggerIndex: number) => {
                    const requiredLoggerFields = ['logger_oem_id', 'logger_serial_number', 'date_from'];
                    requiredLoggerFields.forEach(field => {
                        if (!logger[field]) {
                            errors.push({
                                path: `measurement_location[${locationIndex}].logger_main_config[${loggerIndex}].${field}`,
                                message: `Missing required field: ${field}`
                            });
                        }
                    });
                });
            } else {
                // At least one logger is required
                errors.push({
                    path: `measurement_location[${locationIndex}].logger_main_config`,
                    message: `At least one logger is required`
                });
            }

            // Validate sensors - check both location-level sensors (legacy) and measurement_point sensors (correct schema)
            let hasSensors = false;

            // Check for sensors at location level (legacy structure)
            if (Array.isArray((location as any).sensors)) {
                (location as any).sensors.forEach((sensor: any, sensorIndex: number) => {
                    if (sensor) {
                        hasSensors = true;
                        const requiredSensorFields = ['oem', 'model', 'serial_number', 'sensor_type_id', 'date_from'];
                        requiredSensorFields.forEach(field => {
                            if (!sensor[field]) {
                                errors.push({
                                    path: `measurement_location[${locationIndex}].sensors[${sensorIndex}].${field}`,
                                    message: `Missing required field: ${field}`
                                });
                            }
                        });
                    }
                });
            }

            // Check for sensors in measurement points (correct schema structure)
            if (Array.isArray(location.measurement_point)) {
                location.measurement_point.forEach((point: any, pointIndex: number) => {
                    const requiredPointFields = ['name', 'measurement_type_id', 'height_reference_id'];
                    requiredPointFields.forEach(field => {
                        if (!point[field]) {
                            errors.push({
                                path: `measurement_location[${locationIndex}].measurement_point[${pointIndex}].${field}`,
                                message: `Missing required field: ${field}`
                            });
                        }
                    });

                    // Check height_m specifically (can be 0 but not null/undefined)
                    if (typeof point.height_m !== 'number') {
                        errors.push({
                            path: `measurement_location[${locationIndex}].measurement_point[${pointIndex}].height_m`,
                            message: `Missing required field: height_m`
                        });
                    }

                    // Validate sensors in measurement points
                    if (Array.isArray(point.sensor)) {
                        point.sensor.forEach((sensor: any, sensorIndex: number) => {
                            if (sensor) {
                                hasSensors = true;
                                const requiredSensorFields = ['oem', 'model', 'serial_number', 'sensor_type_id', 'date_from'];
                                requiredSensorFields.forEach(field => {
                                    if (!sensor[field]) {
                                        errors.push({
                                            path: `measurement_location[${locationIndex}].measurement_point[${pointIndex}].sensor[${sensorIndex}].${field}`,
                                            message: `Missing required field: ${field}`
                                        });
                                    }
                                });
                            }
                        });
                    }

                    // Validate logger_measurement_config required fields
                    if (Array.isArray(point.logger_measurement_config)) {
                        point.logger_measurement_config.forEach((config: any, configIndex: number) => {
                            const requiredConfigFields = ['date_from'];
                            requiredConfigFields.forEach(field => {
                                if (!config[field]) {
                                    errors.push({
                                        path: `measurement_location[${locationIndex}].measurement_point[${pointIndex}].logger_measurement_config[${configIndex}].${field}`,
                                        message: `Missing required field: ${field}`
                                    });
                                }
                            });

                            // Validate column_name required fields
                            if (Array.isArray(config.column_name)) {
                                config.column_name.forEach((column: any, columnIndex: number) => {
                                    const requiredColumnFields = ['column_name', 'statistic_type_id'];
                                    requiredColumnFields.forEach(field => {
                                        if (!column[field]) {
                                            errors.push({
                                                path: `measurement_location[${locationIndex}].measurement_point[${pointIndex}].logger_measurement_config[${configIndex}].column_name[${columnIndex}].${field}`,
                                                message: `Missing required field: ${field}`
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            }

            // Require at least one sensor per location
            if (!hasSensors) {
                errors.push({
                    path: `measurement_location[${locationIndex}].sensors`,
                    message: `At least one sensor is required`
                });
            }

            // Require at least one measurement point per location
            if (!Array.isArray(location.measurement_point) || location.measurement_point.length === 0) {
                errors.push({
                    path: `measurement_location[${locationIndex}].measurement_point`,
                    message: `At least one measurement point is required`
                });
            }
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};