import { SchemaValidationError, ValidationResult } from '../../services/schema-validator';

/**
 * Format field labels from schema property names
 */
export function formatFieldLabel(fieldName: string): string {
    return fieldName
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/Id$/, 'ID')
        .replace(/Uuid/g, 'UUID')
        .replace(/Ddeg/g, '(decimal degrees)')
        .replace(/\[.*?\]/g, match => ` ${match}`);
}

/**
 * Format enum values for display
 */
export function formatEnumLabel(enumValue: any): string {
    if (enumValue === null) return 'None';
    if (typeof enumValue !== 'string') return String(enumValue);

    return enumValue
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get field placeholder text from schema
 */
export function getFieldPlaceholder(fieldName: string, schemaProperty: any): string {
    if (schemaProperty.examples && schemaProperty.examples.length > 0) {
        return `e.g., ${schemaProperty.examples[0]}`;
    }

    if (schemaProperty.format === 'date') {
        return 'YYYY-MM-DD';
    }

    if (schemaProperty.format === 'date-time') {
        return 'YYYY-MM-DDTHH:mm:ss';
    }

    if (schemaProperty.type === 'number') {
        if (schemaProperty.minimum !== undefined && schemaProperty.maximum !== undefined) {
            return `${schemaProperty.minimum} - ${schemaProperty.maximum}`;
        }
        if (schemaProperty.minimum !== undefined) {
            return `Min: ${schemaProperty.minimum}`;
        }
        if (schemaProperty.maximum !== undefined) {
            return `Max: ${schemaProperty.maximum}`;
        }
    }

    return `Enter ${formatFieldLabel(fieldName).toLowerCase()}`;
}

/**
 * Check if a field is conditionally required
 */
export function isConditionallyRequired(
    fieldPath: string,
    parentData: any,
    measurementStationType?: string
): boolean {
    // Handle measurement station type dependencies
    if (fieldPath.includes('mast_properties') && measurementStationType === 'mast') {
        return true;
    }

    if (fieldPath.includes('vertical_profiler_properties') &&
        ['lidar', 'sodar', 'floating_lidar', 'wave_buoy', 'adcp'].includes(measurementStationType || '')) {
        return true;
    }

    if (fieldPath.includes('model_config') &&
        ['reanalysis', 'virtual_met_mast'].includes(measurementStationType || '')) {
        return true;
    }

    if (fieldPath.includes('logger_main_config') &&
        !['reanalysis', 'virtual_met_mast'].includes(measurementStationType || '')) {
        return true;
    }

    return false;
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(validationResults: ValidationResult[]): {
    totalErrors: number;
    totalWarnings: number;
    isValid: boolean;
    summary: string;
} {
    const totalErrors = validationResults.reduce((sum, result) => sum + result.errors.length, 0);
    const totalWarnings = validationResults.reduce((sum, result) => sum + result.warnings.length, 0);
    const isValid = validationResults.every(result => result.isValid);

    let summary = '';
    if (isValid) {
        summary = 'All validation checks passed';
        if (totalWarnings > 0) {
            summary += ` (${totalWarnings} warning${totalWarnings > 1 ? 's' : ''})`;
        }
    } else {
        summary = `${totalErrors} error${totalErrors > 1 ? 's' : ''}`;
        if (totalWarnings > 0) {
            summary += `, ${totalWarnings} warning${totalWarnings > 1 ? 's' : ''}`;
        }
    }

    return {
        totalErrors,
        totalWarnings,
        isValid,
        summary
    };
}

/**
 * Group validation errors by field
 */
export function groupErrorsByField(errors: SchemaValidationError[]): Record<string, SchemaValidationError[]> {
    return errors.reduce((groups, error) => {
        const fieldName = error.dataPath.split('.').pop() || error.schemaPath;
        if (!groups[fieldName]) {
            groups[fieldName] = [];
        }
        groups[fieldName].push(error);
        return groups;
    }, {} as Record<string, SchemaValidationError[]>);
}

/**
 * Get the most severe error for a field
 */
export function getMostSevereError(errors: SchemaValidationError[]): SchemaValidationError | null {
    if (errors.length === 0) return null;

    // Prioritize errors over warnings
    const errorSeverity = errors.find(e => e.severity === 'error');
    return errorSeverity || errors[0];
}

/**
 * Create a user-friendly error message
 */
export function createUserFriendlyErrorMessage(error: SchemaValidationError): string {
    const fieldLabel = formatFieldLabel(error.dataPath.split('.').pop() || '');

    if (error.suggestedFix) {
        return `${fieldLabel}: ${error.suggestedFix}`;
    }

    return `${fieldLabel}: ${error.message}`;
}

/**
 * Check if validation errors contain blocking issues
 */
export function hasBlockingErrors(errors: SchemaValidationError[]): boolean {
    return errors.some(error => error.severity === 'error');
}

/**
 * Filter errors by severity
 */
export function filterErrorsBySeverity(
    errors: SchemaValidationError[],
    severity: 'error' | 'warning'
): SchemaValidationError[] {
    return errors.filter(error => error.severity === severity);
}

/**
 * Create validation context for form fields
 */
export interface ValidationContext {
    hasError: boolean;
    hasWarning: boolean;
    errorMessage?: string;
    warningMessage?: string;
    isRequired: boolean;
    allowedValues?: any[];
}

export function createValidationContext(
    fieldPath: string,
    errors: SchemaValidationError[],
    isRequired: boolean = false
): ValidationContext {
    const fieldErrors = errors.filter(e =>
        e.dataPath === fieldPath || e.schemaPath === fieldPath
    );

    const errorSeverityErrors = fieldErrors.filter(e => e.severity === 'error');
    const warnings = fieldErrors.filter(e => e.severity === 'warning');

    const context: ValidationContext = {
        hasError: errorSeverityErrors.length > 0,
        hasWarning: warnings.length > 0,
        isRequired
    };

    if (context.hasError) {
        const primaryError = errorSeverityErrors[0];
        context.errorMessage = createUserFriendlyErrorMessage(primaryError);
        context.allowedValues = primaryError.allowedValues;
    }

    if (context.hasWarning && !context.hasError) {
        context.warningMessage = createUserFriendlyErrorMessage(warnings[0]);
    }

    return context;
}