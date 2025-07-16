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
            strict: false // Allow additional properties not in schema
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