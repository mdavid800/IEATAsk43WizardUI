import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { JSONSchema7 } from 'json-schema';
import { schemaService } from './schema-service';

export interface ValidationResult {
    isValid: boolean;
    errors: SchemaValidationError[];
    warnings: SchemaValidationWarning[];
}

export interface SchemaValidationError {
    schemaPath: string;
    dataPath: string;
    message: string;
    schemaRule: string;
    severity: 'error' | 'warning';
    suggestedFix?: string;
    allowedValues?: any[];
}

export interface SchemaValidationWarning {
    schemaPath: string;
    dataPath: string;
    message: string;
    suggestion?: string;
}

export interface FieldValidationResult {
    isValid: boolean;
    errors: SchemaValidationError[];
    value?: any;
}

export interface ExportValidationResult {
    canExport: boolean;
    blockingErrors: SchemaValidationError[];
    warnings: SchemaValidationWarning[];
    cleanedData?: any;
}

export class SchemaValidator {
    private ajv: Ajv;
    private mainValidator: ValidateFunction;
    private pathValidators: Map<string, ValidateFunction> = new Map();

    constructor() {
        this.ajv = new Ajv({
            allErrors: true,
            verbose: true,
            strict: false,
            removeAdditional: false,
            useDefaults: true,
            coerceTypes: true
        });

        // Add format validation
        addFormats(this.ajv);

        // Load and compile the main schema
        const schema = schemaService.loadSchema();
        this.mainValidator = this.ajv.compile(schema);
    }

    /**
     * Validate complete data against the full IEA schema
     */
    validate(data: any): ValidationResult {
        const isValid = this.mainValidator(data);

        return {
            isValid,
            errors: this.mapAjvErrors(this.mainValidator.errors || []),
            warnings: this.extractWarnings(data)
        };
    }

    /**
     * Validate data at a specific schema path
     */
    validatePath(data: any, schemaPath: string): FieldValidationResult {
        try {
            const validator = this.getPathValidator(schemaPath);
            const value = this.getValueAtPath(data, schemaPath);
            const isValid = validator(value);

            return {
                isValid,
                errors: this.mapAjvErrors(validator.errors || [], schemaPath),
                value
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [{
                    schemaPath,
                    dataPath: schemaPath,
                    message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    schemaRule: 'validation',
                    severity: 'error' as const
                }]
            };
        }
    }

    /**
     * Validate a single field value against its schema definition
     */
    validateField(fieldPath: string, value: any, parentData?: any): FieldValidationResult {
        try {
            const validator = this.getPathValidator(fieldPath);
            const isValid = validator(value);

            const errors = this.mapAjvErrors(validator.errors || [], fieldPath);

            // Add contextual validation for specific fields
            const contextualErrors = this.getContextualValidationErrors(fieldPath, value, parentData);

            return {
                isValid: isValid && contextualErrors.length === 0,
                errors: [...errors, ...contextualErrors],
                value
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [{
                    schemaPath: fieldPath,
                    dataPath: fieldPath,
                    message: `Field validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    schemaRule: 'validation',
                    severity: 'error' as const
                }],
                value
            };
        }
    }

    /**
     * Validate data for export compliance
     */
    validateForExport(data: any): ExportValidationResult {
        const validation = this.validate(data);

        // Separate blocking errors from warnings
        const blockingErrors = validation.errors.filter(error => error.severity === 'error');
        const canExport = blockingErrors.length === 0;

        return {
            canExport,
            blockingErrors,
            warnings: validation.warnings,
            cleanedData: canExport ? data : undefined
        };
    }

    /**
     * Get or create a validator for a specific schema path
     */
    private getPathValidator(schemaPath: string): ValidateFunction {
        if (this.pathValidators.has(schemaPath)) {
            return this.pathValidators.get(schemaPath)!;
        }

        const schemaProperty = schemaService.getSchemaProperty(schemaPath);
        const validator = this.ajv.compile(schemaProperty);
        this.pathValidators.set(schemaPath, validator);

        return validator;
    }

    /**
     * Extract value from data using a path
     */
    private getValueAtPath(data: any, path: string): any {
        const parts = path.split('.');
        let current = data;

        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }

            // Handle array notation like 'measurement_location[0]'
            if (part.includes('[') && part.includes(']')) {
                const [arrayName, indexStr] = part.split('[');
                const index = parseInt(indexStr.replace(']', ''));
                current = current[arrayName]?.[index];
            } else {
                current = current[part];
            }
        }

        return current;
    }

    /**
     * Map AJV errors to our custom error format
     */
    private mapAjvErrors(errors: ErrorObject[], schemaPath?: string): SchemaValidationError[] {
        return errors.map(error => {
            const mappedError: SchemaValidationError = {
                schemaPath: schemaPath || error.schemaPath || '',
                dataPath: error.instancePath || error.dataPath || '',
                message: this.formatErrorMessage(error),
                schemaRule: error.keyword || 'validation',
                severity: this.getErrorSeverity(error)
            };

            // Add suggested fixes and allowed values
            if (error.keyword === 'enum' && error.params?.allowedValues) {
                mappedError.allowedValues = error.params.allowedValues;
                mappedError.suggestedFix = `Must be one of: ${error.params.allowedValues.join(', ')}`;
            }

            if (error.keyword === 'required' && error.params?.missingProperty) {
                mappedError.suggestedFix = `The field '${error.params.missingProperty}' is required`;
            }

            if (error.keyword === 'format') {
                mappedError.suggestedFix = `Must be in ${error.params?.format} format`;
            }

            if (error.keyword === 'minimum' || error.keyword === 'maximum') {
                const limit = error.params?.limit;
                mappedError.suggestedFix = `Value must be ${error.keyword === 'minimum' ? 'at least' : 'at most'} ${limit}`;
            }

            return mappedError;
        });
    }

    /**
     * Format error message for better readability
     */
    private formatErrorMessage(error: ErrorObject): string {
        const fieldName = error.instancePath?.split('/').pop() || 'field';

        switch (error.keyword) {
            case 'required':
                return `Required field '${error.params?.missingProperty}' is missing`;
            case 'enum':
                return `Invalid value for ${fieldName}. Must be one of: ${error.params?.allowedValues?.join(', ')}`;
            case 'format':
                return `Invalid ${error.params?.format} format for ${fieldName}`;
            case 'minimum':
                return `Value must be at least ${error.params?.limit}`;
            case 'maximum':
                return `Value must be at most ${error.params?.limit}`;
            case 'type':
                return `Expected ${error.params?.type} but received ${typeof error.data}`;
            case 'pattern':
                return `Value does not match required pattern`;
            default:
                return error.message || 'Validation error';
        }
    }

    /**
     * Determine error severity
     */
    private getErrorSeverity(error: ErrorObject): 'error' | 'warning' {
        // Most validation errors are blocking
        const blockingKeywords = ['required', 'type', 'enum', 'minimum', 'maximum'];

        if (blockingKeywords.includes(error.keyword || '')) {
            return 'error';
        }

        // Format and pattern errors could be warnings in some cases
        return 'warning';
    }

    /**
     * Extract warnings from data (non-blocking issues)
     */
    private extractWarnings(data: any): SchemaValidationWarning[] {
        const warnings: SchemaValidationWarning[] = [];

        // Check for missing optional but recommended fields
        if (data.license === null || data.license === undefined) {
            warnings.push({
                schemaPath: 'license',
                dataPath: 'license',
                message: 'License field is recommended for data sharing compliance',
                suggestion: 'Consider adding a license such as "BSD-3-Clause" or a URL to your license'
            });
        }

        if (data.plant_name === null || data.plant_name === undefined) {
            warnings.push({
                schemaPath: 'plant_name',
                dataPath: 'plant_name',
                message: 'Plant name is recommended for better data identification',
                suggestion: 'Add the name of the wind farm or project'
            });
        }

        return warnings;
    }

    /**
     * Get contextual validation errors based on business rules
     */
    private getContextualValidationErrors(fieldPath: string, value: any, parentData?: any): SchemaValidationError[] {
        const errors: SchemaValidationError[] = [];

        // Validate measurement station type dependencies
        if (fieldPath.includes('measurement_station_type_id') && parentData) {
            const stationType = value;

            // Check for conflicting configurations
            if ((stationType === 'reanalysis' || stationType === 'virtual_met_mast') && parentData.logger_main_config) {
                errors.push({
                    schemaPath: fieldPath,
                    dataPath: fieldPath,
                    message: 'Reanalysis and virtual met mast stations should not have logger configuration',
                    schemaRule: 'conditional',
                    severity: 'error',
                    suggestedFix: 'Remove logger configuration or change station type'
                });
            }

            if (stationType !== 'reanalysis' && stationType !== 'virtual_met_mast' && parentData.model_config) {
                errors.push({
                    schemaPath: fieldPath,
                    dataPath: fieldPath,
                    message: 'Physical measurement stations should not have model configuration',
                    schemaRule: 'conditional',
                    severity: 'error',
                    suggestedFix: 'Remove model configuration or change station type'
                });
            }
        }

        return errors;
    }
}

// Export singleton instance
export const schemaValidator = new SchemaValidator();