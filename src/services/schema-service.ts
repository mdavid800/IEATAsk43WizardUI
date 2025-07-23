import { JSONSchema7 } from 'json-schema';
import ieaSchema from '../utils/schema/iea43-schema.json';

export interface SchemaProperty {
    type: string | string[];
    title?: string;
    description?: string;
    enum?: any[];
    format?: string;
    minimum?: number;
    maximum?: number;
    pattern?: string;
    examples?: any[];
    properties?: Record<string, JSONSchema7>;
    items?: JSONSchema7;
    required?: string[];
    $ref?: string;
}

export interface ValidationRule {
    required: boolean;
    type: string | string[];
    enum?: any[];
    format?: string;
    minimum?: number;
    maximum?: number;
    pattern?: string;
}

export class SchemaService {
    private schema: JSONSchema7;
    private schemaCache: Map<string, JSONSchema7> = new Map();

    constructor() {
        this.schema = ieaSchema as JSONSchema7;
    }

    /**
     * Load the complete IEA Task 43 schema
     */
    loadSchema(): JSONSchema7 {
        return this.schema;
    }

    /**
     * Get a specific property from the schema using a path
     * @param path - JSONPath-like string (e.g., 'measurement_location.items.properties.name')
     */
    getSchemaProperty(path: string): JSONSchema7 {
        // Check cache first
        if (this.schemaCache.has(path)) {
            return this.schemaCache.get(path)!;
        }

        let current: any = this.schema;
        const parts = path.split('.');

        for (const part of parts) {
            if (!current) break;

            // Handle array items
            if (part === 'items' && current.items) {
                current = current.items;
                continue;
            }

            // Handle properties
            if (part === 'properties' && current.properties) {
                current = current.properties;
                continue;
            }

            // Handle definitions references
            if (current.$ref) {
                const refPath = current.$ref.replace('#/definitions/', '');
                current = this.schema.definitions?.[refPath];
                continue;
            }

            // Navigate to specific property
            if (current.properties && current.properties[part]) {
                current = current.properties[part];
            } else if (current[part]) {
                current = current[part];
            } else {
                current = null;
                break;
            }
        }

        // Cache the result
        if (current) {
            this.schemaCache.set(path, current);
        }

        return current || {};
    }

    /**
     * Get required fields for a specific schema path
     */
    getRequiredFields(path: string): string[] {
        const schemaProperty = this.getSchemaProperty(path);
        return schemaProperty.required || [];
    }

    /**
     * Get enum values for a specific field
     */
    getEnumValues(path: string): any[] {
        const schemaProperty = this.getSchemaProperty(path);

        // Handle $ref to definitions
        if (schemaProperty.$ref) {
            const refPath = schemaProperty.$ref.replace('#/definitions/', '');
            const refProperty = this.schema.definitions?.[refPath] as JSONSchema7;
            return refProperty?.enum || [];
        }

        return schemaProperty.enum || [];
    }

    /**
     * Get validation rules for a specific field
     */
    getValidationRules(path: string): ValidationRule {
        const schemaProperty = this.getSchemaProperty(path);

        // Handle $ref to definitions
        let resolvedProperty = schemaProperty;
        if (schemaProperty.$ref) {
            const refPath = schemaProperty.$ref.replace('#/definitions/', '');
            resolvedProperty = this.schema.definitions?.[refPath] as JSONSchema7 || schemaProperty;
        }

        return {
            required: this.isFieldRequired(path),
            type: resolvedProperty.type || 'string',
            enum: resolvedProperty.enum,
            format: resolvedProperty.format,
            minimum: resolvedProperty.minimum,
            maximum: resolvedProperty.maximum,
            pattern: resolvedProperty.pattern
        };
    }

    /**
     * Check if a field is required based on its parent schema
     */
    private isFieldRequired(path: string): boolean {
        const pathParts = path.split('.');
        const fieldName = pathParts[pathParts.length - 1];
        const parentPath = pathParts.slice(0, -1).join('.');

        if (!parentPath) {
            // Root level field
            return this.schema.required?.includes(fieldName) || false;
        }

        const parentSchema = this.getSchemaProperty(parentPath);
        return parentSchema.required?.includes(fieldName) || false;
    }

    /**
     * Get all measurement station types from the schema
     */
    getMeasurementStationTypes(): string[] {
        return this.getEnumValues('measurement_location.items.properties.measurement_station_type_id');
    }

    /**
     * Get all measurement types from the schema
     */
    getMeasurementTypes(): string[] {
        return this.getEnumValues('definitions.measurement_type');
    }

    /**
     * Get all measurement units from the schema
     */
    getMeasurementUnits(): (string | null)[] {
        return this.getEnumValues('definitions.measurement_units');
    }

    /**
     * Get schema version information
     */
    getSchemaVersion(): string {
        return this.schema.$version || 'unknown';
    }

    /**
     * Get schema title and description
     */
    getSchemaInfo(): { title: string; description: string; version: string } {
        return {
            title: this.schema.title || 'IEA Task 43 Schema',
            description: this.schema.description || '',
            version: this.getSchemaVersion()
        };
    }

    /**
     * Create a default object structure based on schema path
     */
    createDefaultObject(path: string): any {
        const schemaProperty = this.getSchemaProperty(path);

        if (schemaProperty.type === 'object' && schemaProperty.properties) {
            const defaultObj: any = {};
            const required = schemaProperty.required || [];

            Object.entries(schemaProperty.properties).forEach(([key, prop]) => {
                if (required.includes(key)) {
                    defaultObj[key] = this.getDefaultValue(prop as JSONSchema7);
                }
            });

            return defaultObj;
        }

        return this.getDefaultValue(schemaProperty);
    }

    /**
     * Get default value for a schema property
     */
    private getDefaultValue(property: JSONSchema7): any {
        // Handle $ref to definitions
        if (property.$ref) {
            const refPath = property.$ref.replace('#/definitions/', '');
            const refProperty = this.schema.definitions?.[refPath] as JSONSchema7;
            if (refProperty) {
                return this.getDefaultValue(refProperty);
            }
        }

        if (property.default !== undefined) {
            return property.default;
        }

        if (property.enum && property.enum.length > 0) {
            return property.enum[0];
        }

        if (Array.isArray(property.type)) {
            // Handle union types - prefer non-null types
            const nonNullType = property.type.find(t => t !== 'null');
            if (nonNullType) {
                return this.getDefaultValueForType(nonNullType);
            }
            return null;
        }

        return this.getDefaultValueForType(property.type as string);
    }

    /**
     * Get default value for a specific type
     */
    private getDefaultValueForType(type: string): any {
        switch (type) {
            case 'string':
                return '';
            case 'number':
            case 'integer':
                return 0;
            case 'boolean':
                return false;
            case 'array':
                return [];
            case 'object':
                return {};
            default:
                return null;
        }
    }
}

// Export singleton instance
export const schemaService = new SchemaService();