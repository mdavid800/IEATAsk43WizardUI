import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useController, FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { schemaService, type ValidationRule } from '../../services/schema-service';
import type { JSONSchema7 } from 'json-schema';

export interface FormField {
  name: string;
  schemaPath: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  required: boolean;
  validation: ValidationRule;
  ui: FieldUIConfig;
  conditional?: ConditionalRule;
}

export interface FieldUIConfig {
  label: string;
  placeholder?: string;
  description?: string;
  helpText?: string;
  className?: string;
}

export interface ConditionalRule {
  condition: string; // JSONPath expression
  action: 'show' | 'hide' | 'require' | 'disable';
  target: string; // Field path
}

export interface DynamicFormFieldProps {
  field: FormField;
  value?: any;
  onChange?: (value: any) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// Format enum labels for display
const formatEnumLabel = (value: string | null): string => {
  if (value === null) return 'None';
  if (typeof value !== 'string') return String(value);
  
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format field names to readable labels
const formatFieldLabel = (fieldName: string): string => {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
  className = ''
}) => {
  const renderFieldInput = () => {
    switch (field.type) {
      case 'enum':
        return (
          <Select 
            value={value === null ? 'null' : (value === '' ? 'empty' : String(value || ''))} 
            onValueChange={(selectedValue) => {
              // Convert back to original values
              const actualValue = selectedValue === 'null' ? null : (selectedValue === 'empty' ? '' : selectedValue);
              onChange?.(actualValue);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.ui.placeholder || `Select ${field.ui.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.validation.enum?.map((option) => {
                // Handle empty string and null values properly for Radix UI
                const optionValue = option === null ? 'null' : (option === '' ? 'empty' : String(option));
                return (
                  <SelectItem key={String(option)} value={optionValue}>
                    {formatEnumLabel(option)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
      
      case 'string':
        if (field.validation.format === 'date-time') {
          return (
            <Input
              type="datetime-local"
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={field.ui.placeholder}
              disabled={disabled}
            />
          );
        }
        if (field.validation.format === 'date') {
          return (
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={field.ui.placeholder}
              disabled={disabled}
            />
          );
        }
        if (field.validation.format === 'email') {
          return (
            <Input
              type="email"
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={field.ui.placeholder}
              disabled={disabled}
            />
          );
        }
        // Multi-line text for description/notes fields
        if (field.name.includes('notes') || field.name.includes('description')) {
          return (
            <Textarea
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={field.ui.placeholder}
              disabled={disabled}
              rows={3}
            />
          );
        }
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={field.ui.placeholder}
            disabled={disabled}
            pattern={field.validation.pattern}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value ? parseFloat(e.target.value) : null)}
            min={field.validation.minimum}
            max={field.validation.maximum}
            step="any"
            placeholder={field.ui.placeholder}
            disabled={disabled}
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true}
              onCheckedChange={(checked) => onChange?.(checked === true)}
              disabled={disabled}
            />
            <Label className="text-sm font-normal">
              {field.ui.helpText || 'Enable this option'}
            </Label>
          </div>
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={field.ui.placeholder}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={field.name} className="text-sm font-medium">
        {field.ui.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {renderFieldInput()}
      
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </p>
      )}
      
      {field.ui.description && !error && (
        <p className="text-sm text-muted-foreground mt-1">
          {field.ui.description}
        </p>
      )}
    </div>
  );
};

// Hook-based wrapper that integrates with React Hook Form
export interface DynamicFormFieldHookProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  schemaPath: string;
  label?: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function DynamicFormFieldHook<TFieldValues extends FieldValues>({
  name,
  schemaPath,
  label,
  placeholder,
  description,
  disabled = false,
  className = ''
}: DynamicFormFieldHookProps<TFieldValues>) {
  const {
    field: controllerField,
    fieldState: { error }
  } = useController<TFieldValues>({
    name,
    defaultValue: '' as any
  });

  // Get schema information for this field
  const schemaProperty = schemaService.getSchemaProperty(schemaPath);
  const validationRules = schemaService.getValidationRules(schemaPath);
  const enumValues = schemaService.getEnumValues(schemaPath);

  // Determine field type from schema
  const getFieldType = (): FormField['type'] => {
    if (enumValues.length > 0) return 'enum';
    if (Array.isArray(schemaProperty.type)) {
      // Handle union types - prefer non-null types
      const nonNullType = schemaProperty.type.find(t => t !== 'null');
      return (nonNullType as any) || 'string';
    }
    return (schemaProperty.type as any) || 'string';
  };

  const formField: FormField = {
    name,
    schemaPath,
    type: getFieldType(),
    required: validationRules.required,
    validation: {
      ...validationRules,
      enum: enumValues.length > 0 ? enumValues : undefined
    },
    ui: {
      label: label || formatFieldLabel(name),
      placeholder: placeholder || schemaProperty.examples?.[0],
      description: description || schemaProperty.description
    }
  };

  return (
    <DynamicFormField
      field={formField}
      value={controllerField.value}
      onChange={controllerField.onChange}
      error={error?.message}
      disabled={disabled}
      className={className}
    />
  );
}

// Factory function to create form fields from schema paths
export const createFormFieldFromSchema = (
  fieldName: string,
  schemaPath: string,
  overrides: Partial<FormField> = {}
): FormField => {
  const schemaProperty = schemaService.getSchemaProperty(schemaPath);
  const validationRules = schemaService.getValidationRules(schemaPath);
  const enumValues = schemaService.getEnumValues(schemaPath);

  const getFieldType = (): FormField['type'] => {
    if (enumValues.length > 0) return 'enum';
    if (Array.isArray(schemaProperty.type)) {
      const nonNullType = schemaProperty.type.find(t => t !== 'null');
      return (nonNullType as any) || 'string';
    }
    return (schemaProperty.type as any) || 'string';
  };

  const baseField: FormField = {
    name: fieldName,
    schemaPath,
    type: getFieldType(),
    required: validationRules.required,
    validation: {
      ...validationRules,
      enum: enumValues.length > 0 ? enumValues : undefined
    },
    ui: {
      label: formatFieldLabel(fieldName),
      placeholder: schemaProperty.examples?.[0],
      description: schemaProperty.description
    }
  };

  return { ...baseField, ...overrides };
};