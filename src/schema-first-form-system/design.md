# Design Document

## Overview

This design implements a schema-first form system where the official IEA Task 43 JSON schema drives all aspects of the application - from form generation to validation to export. The system uses the provided JSON schema as the single source of truth, ensuring 100% compliance with the IEA standard while providing a robust state management solution using Zustand and comprehensive validation using AJV and Zod.

The key architectural principle is that the JSON schema defines the data structure, validation rules, and form behavior, while the application code adapts to the schema rather than the schema adapting to the code.

## Architecture

### Schema-First Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    IEA Task 43 JSON Schema                     │
│                    (Single Source of Truth)                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Schema Processing Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   AJV Validator │  │   Zod Schema    │  │   Form Schema   │ │
│  │   (Runtime)     │  │   Generator     │  │   Generator     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Zustand Store                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Schema Data   │  │   Validation    │  │   UI State      │ │
│  │   (IEA Format)  │  │   Results       │  │   (Form State)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                React Hook Form + Components                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Dynamic Forms │  │   Validation    │  │   shadcn/ui     │ │
│  │   (Generated)   │  │   Feedback      │  │   Components    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Schema Loading** → Parse IEA JSON Schema → Generate validation functions
2. **Form Generation** → Create dynamic form structure from schema
3. **User Input** → Validate against schema → Update Zustand store
4. **State Sync** → Bidirectional sync between store and React Hook Form
5. **Export** → Schema validation → Clean data → Generate compliant JSON

## Components and Interfaces

### Core Schema Service

```typescript
interface SchemaService {
  // Schema Management
  loadSchema: () => Promise<JSONSchema7>;
  getSchemaProperty: (path: string) => JSONSchema7;
  getRequiredFields: (path: string) => string[];
  getEnumValues: (path: string) => string[];
  
  // Validation
  validateData: (data: any, schemaPath?: string) => ValidationResult;
  validateForExport: (data: IEATask43Schema) => ExportValidationResult;
  
  // Form Generation
  generateFormSchema: (schemaPath: string) => FormSchema;
  getConditionalFields: (data: any, schemaPath: string) => string[];
}
```

### Enhanced Store Interface

```typescript
interface SchemaFormStore {
  // Schema-compliant data
  formData: IEATask43Schema;
  
  // Form-only data (not exported)
  formHelpers: FormHelperData;
  
  // Validation state
  validationResults: SchemaValidationResults;
  exportValidation: ExportValidationResult;
  
  // UI state
  currentStep: number;
  visitedSteps: Set<number>;
  isDirty: boolean;
  
  // Schema-driven actions
  updateField: (path: string, value: any) => void;
  validateField: (path: string) => Promise<FieldValidationResult>;
  validateStep: (step: number) => Promise<StepValidationResult>;
  validateForExport: () => Promise<ExportValidationResult>;
  
  // Array management (schema-aware)
  addArrayItem: (path: string, template?: any) => void;
  removeArrayItem: (path: string, index: number) => void;
  moveArrayItem: (path: string, fromIndex: number, toIndex: number) => void;
  
  // Export functionality
  generateExportData: () => IEATask43Schema;
  exportToJSON: () => string;
}
```

### Schema Validation Results

```typescript
interface SchemaValidationResults {
  isValid: boolean;
  errors: SchemaValidationError[];
  warnings: SchemaValidationWarning[];
  fieldValidations: Record<string, FieldValidationResult>;
  stepValidations: Record<number, StepValidationResult>;
}

interface SchemaValidationError {
  schemaPath: string;
  dataPath: string;
  message: string;
  schemaRule: string;
  severity: 'error' | 'warning';
  suggestedFix?: string;
}

interface ExportValidationResult {
  canExport: boolean;
  blockingErrors: SchemaValidationError[];
  warnings: SchemaValidationWarning[];
  cleanedData: IEATask43Schema;
}
```

## Data Models

### Schema-Driven Form Configuration

```typescript
interface FormSchema {
  fields: FormField[];
  conditionalLogic: ConditionalRule[];
  validationRules: ValidationRule[];
  layout: FormLayout;
}

interface FormField {
  name: string;
  schemaPath: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  required: boolean;
  validation: FieldValidation;
  ui: FieldUIConfig;
  conditional?: ConditionalRule;
}

interface ConditionalRule {
  condition: string; // JSONPath expression
  action: 'show' | 'hide' | 'require' | 'disable';
  target: string; // Field path
}
```

### Form Helper Data Structure

```typescript
interface FormHelperData {
  // Campaign information (form-only)
  campaignStatus?: 'live' | 'historical';
  startDate?: string;
  endDate?: string;
  
  // UI helpers
  measurementPointHelpers: Record<string, {
    statistic_type_id?: StatisticType;
    unit?: string;
  }>;
  
  // Validation helpers
  validationCache: Record<string, CachedValidationResult>;
  lastValidated: string;
}
```

## Schema Processing Implementation

### AJV Integration

```typescript
// services/schema-validator.ts
class SchemaValidator {
  private ajv: Ajv;
  private schema: JSONSchema7;
  private validator: ValidateFunction;
  
  constructor(schema: JSONSchema7) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      formats: addFormats.formats
    });
    
    this.schema = schema;
    this.validator = this.ajv.compile(schema);
  }
  
  validate(data: any): ValidationResult {
    const isValid = this.validator(data);
    return {
      isValid,
      errors: this.validator.errors?.map(this.mapAjvError) || [],
      warnings: this.extractWarnings(data)
    };
  }
  
  validatePath(data: any, schemaPath: string): FieldValidationResult {
    const subSchema = this.getSchemaAtPath(schemaPath);
    const subValidator = this.ajv.compile(subSchema);
    const value = this.getValueAtPath(data, schemaPath);
    
    return {
      isValid: subValidator(value),
      errors: subValidator.errors?.map(this.mapAjvError) || []
    };
  }
}
```

### Zod Schema Generation

```typescript
// services/zod-generator.ts
class ZodSchemaGenerator {
  generateFromJsonSchema(jsonSchema: JSONSchema7): z.ZodSchema {
    return this.processSchema(jsonSchema);
  }
  
  private processSchema(schema: JSONSchema7): z.ZodSchema {
    switch (schema.type) {
      case 'string':
        return this.createStringSchema(schema);
      case 'number':
        return this.createNumberSchema(schema);
      case 'array':
        return this.createArraySchema(schema);
      case 'object':
        return this.createObjectSchema(schema);
      default:
        return z.any();
    }
  }
  
  private createStringSchema(schema: JSONSchema7): z.ZodString {
    let zodSchema = z.string();
    
    if (schema.enum) {
      return z.enum(schema.enum as [string, ...string[]]);
    }
    
    if (schema.format === 'date-time') {
      zodSchema = zodSchema.datetime();
    }
    
    if (schema.format === 'date') {
      zodSchema = zodSchema.date();
    }
    
    if (schema.pattern) {
      zodSchema = zodSchema.regex(new RegExp(schema.pattern));
    }
    
    return zodSchema;
  }
}
```

## Dynamic Form Generation

### Form Builder Service

```typescript
// services/form-builder.ts
class FormBuilder {
  constructor(
    private schemaService: SchemaService,
    private validator: SchemaValidator
  ) {}
  
  buildFormForStep(step: number, data: any): FormConfiguration {
    const schemaPath = this.getSchemaPathForStep(step);
    const schema = this.schemaService.getSchemaProperty(schemaPath);
    
    return {
      fields: this.generateFields(schema, schemaPath, data),
      layout: this.generateLayout(schema),
      validation: this.generateValidation(schema),
      conditionalLogic: this.generateConditionalLogic(schema, data)
    };
  }
  
  private generateFields(
    schema: JSONSchema7, 
    basePath: string, 
    data: any
  ): FormField[] {
    const fields: FormField[] = [];
    
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, propSchema]) => {
        const fieldPath = `${basePath}.${key}`;
        const field = this.createFormField(key, propSchema, fieldPath, data);
        
        if (this.shouldShowField(field, data)) {
          fields.push(field);
        }
      });
    }
    
    return fields;
  }
  
  private shouldShowField(field: FormField, data: any): boolean {
    // Implement conditional logic based on measurement_station_type_id
    if (field.conditional) {
      return this.evaluateCondition(field.conditional, data);
    }
    return true;
  }
}
```

### Component Generation

```typescript
// components/DynamicFormField.tsx
interface DynamicFormFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  field,
  value,
  onChange,
  error
}) => {
  const renderField = () => {
    switch (field.type) {
      case 'enum':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {field.validation.enumValues?.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatEnumLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'string':
        if (field.validation.format === 'date-time') {
          return (
            <Input
              type="datetime-local"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
            />
          );
        }
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.ui.placeholder}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            min={field.validation.minimum}
            max={field.validation.maximum}
          />
        );
      
      case 'array':
        return <DynamicArrayField field={field} value={value} onChange={onChange} />;
      
      default:
        return <Input value={value || ''} onChange={(e) => onChange(e.target.value)} />;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.ui.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      {field.ui.description && (
        <p className="text-sm text-muted-foreground">{field.ui.description}</p>
      )}
    </div>
  );
};
```

## Conditional Logic Implementation

### Measurement Station Type Logic

```typescript
// services/conditional-logic.ts
class ConditionalLogicService {
  getVisibleFields(data: IEATask43Schema, locationIndex: number): string[] {
    const location = data.measurement_location[locationIndex];
    const stationType = location?.measurement_station_type_id;
    
    const baseFields = ['name', 'latitude_ddeg', 'longitude_ddeg', 'measurement_station_type_id'];
    
    switch (stationType) {
      case 'mast':
        return [...baseFields, 'mast_properties', 'logger_main_config'];
      
      case 'lidar':
      case 'sodar':
      case 'floating_lidar':
        return [...baseFields, 'vertical_profiler_properties', 'logger_main_config'];
      
      case 'reanalysis':
      case 'virtual_met_mast':
        return [...baseFields, 'model_config'];
      
      case 'wave_buoy':
      case 'adcp':
        return [...baseFields, 'vertical_profiler_properties', 'logger_main_config'];
      
      default:
        return baseFields;
    }
  }
  
  getRequiredFields(data: IEATask43Schema, locationIndex: number): string[] {
    // Based on schema allOf conditions
    const location = data.measurement_location[locationIndex];
    const stationType = location?.measurement_station_type_id;
    
    if (stationType === 'reanalysis' || stationType === 'virtual_met_mast') {
      return ['model_config']; // model_config required, logger_main_config not allowed
    } else {
      return ['logger_main_config']; // logger_main_config required, model_config not allowed
    }
  }
}
```

## Export and Validation Strategy

### Export Data Cleaning

```typescript
// services/export-service.ts
class ExportService {
  constructor(
    private validator: SchemaValidator,
    private schemaService: SchemaService
  ) {}
  
  async prepareExportData(formData: IEATask43Schema, formHelpers: FormHelperData): Promise<ExportResult> {
    // Remove form-only fields
    const cleanedData = this.removeFormOnlyFields(formData, formHelpers);
    
    // Validate against schema
    const validation = this.validator.validateForExport(cleanedData);
    
    if (!validation.canExport) {
      return {
        success: false,
        errors: validation.blockingErrors,
        warnings: validation.warnings
      };
    }
    
    // Final cleanup and formatting
    const exportData = this.formatForExport(cleanedData);
    
    return {
      success: true,
      data: exportData,
      warnings: validation.warnings
    };
  }
  
  private removeFormOnlyFields(data: IEATask43Schema, helpers: FormHelperData): IEATask43Schema {
    const cleaned = { ...data };
    
    // Remove form-only fields from root
    delete (cleaned as any).campaignStatus;
    delete (cleaned as any).startDate;
    delete (cleaned as any).endDate;
    
    // Remove form-only fields from measurement points
    cleaned.measurement_location = cleaned.measurement_location.map(location => ({
      ...location,
      measurement_point: location.measurement_point.map(point => {
        const cleanedPoint = { ...point };
        delete (cleanedPoint as any).statistic_type_id;
        delete (cleanedPoint as any).unit;
        return cleanedPoint;
      })
    }));
    
    return cleaned;
  }
}
```

## Testing Strategy

### Schema Compliance Testing

```typescript
// tests/schema-compliance.test.ts
describe('Schema Compliance', () => {
  test('exported data validates against official schema', async () => {
    const formData = createTestFormData();
    const exportService = new ExportService(validator, schemaService);
    
    const result = await exportService.prepareExportData(formData, {});
    
    expect(result.success).toBe(true);
    expect(validator.validate(result.data).isValid).toBe(true);
  });
  
  test('all required fields are enforced', () => {
    const schema = schemaService.loadSchema();
    const requiredFields = schema.required;
    
    requiredFields.forEach(field => {
      const formField = formBuilder.getFieldConfig(field);
      expect(formField.required).toBe(true);
    });
  });
  
  test('enum constraints are enforced', () => {
    const plantTypeField = formBuilder.getFieldConfig('plant_type');
    expect(plantTypeField.validation.enumValues).toEqual([
      'onshore_wind', 'offshore_wind', 'solar', null
    ]);
  });
});
```

### Integration Testing

```typescript
// tests/form-integration.test.ts
describe('Form Integration', () => {
  test('measurement station type controls field visibility', () => {
    const { getByLabelText, queryByLabelText } = render(<FormWizard />);
    
    // Select mast type
    fireEvent.change(getByLabelText('Measurement Station Type'), {
      target: { value: 'mast' }
    });
    
    expect(queryByLabelText('Mast Properties')).toBeInTheDocument();
    expect(queryByLabelText('Vertical Profiler Properties')).not.toBeInTheDocument();
    
    // Switch to lidar
    fireEvent.change(getByLabelText('Measurement Station Type'), {
      target: { value: 'lidar' }
    });
    
    expect(queryByLabelText('Mast Properties')).not.toBeInTheDocument();
    expect(queryByLabelText('Vertical Profiler Properties')).toBeInTheDocument();
  });
});
```

## Enhanced Measurement Points Management

### Schema-Aware CSV Import

```typescript
// services/csv-import-service.ts
class SchemaAwareCSVImportService {
  constructor(
    private schemaService: SchemaService,
    private validator: SchemaValidator
  ) {}
  
  async importCSV(csvData: string, locationIndex: number): Promise<ImportResult> {
    // Parse CSV data
    const parsedData = this.parseCSV(csvData);
    
    // Get measurement_point schema
    const measurementPointSchema = this.schemaService.getSchemaProperty(
      'measurement_location.items.properties.measurement_point.items'
    );
    
    // Validate each row against schema
    const validationResults = parsedData.map((row, index) => {
      const mappedData = this.mapCSVRowToSchema(row, measurementPointSchema);
      return {
        rowIndex: index,
        data: mappedData,
        validation: this.validator.validatePath(mappedData, 'measurement_point')
      };
    });
    
    return {
      validRows: validationResults.filter(r => r.validation.isValid),
      invalidRows: validationResults.filter(r => !r.validation.isValid),
      warnings: this.generateImportWarnings(validationResults)
    };
  }
  
  private mapCSVRowToSchema(csvRow: any, schema: JSONSchema7): MeasurementPoint {
    // Map CSV columns to schema properties
    return {
      name: csvRow.name || '',
      measurement_type_id: this.validateEnum(csvRow.measurement_type, schema.properties.measurement_type_id),
      height_m: this.parseNumber(csvRow.height),
      height_reference_id: this.validateEnum(csvRow.height_reference, schema.properties.height_reference_id),
      // ... map other fields according to schema
      logger_measurement_config: [],
      sensor: [],
      update_at: new Date().toISOString()
    };
  }
}
```

### Enhanced Data Grid with Schema Validation

```typescript
// components/measurement-points/SchemaAwareDataGrid.tsx
interface SchemaAwareDataGridProps {
  data: MeasurementPoint[];
  locationIndex: number;
  onUpdate: (data: MeasurementPoint[]) => void;
}

export const SchemaAwareDataGrid: React.FC<SchemaAwareDataGridProps> = ({
  data,
  locationIndex,
  onUpdate
}) => {
  const { schemaService, validator } = useSchemaServices();
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  
  // Generate columns from schema
  const columns = useMemo(() => {
    const schema = schemaService.getSchemaProperty('measurement_location.items.properties.measurement_point.items');
    return generateColumnsFromSchema(schema);
  }, [schemaService]);
  
  // Validate data in real-time
  useEffect(() => {
    const validateData = async () => {
      const results = await Promise.all(
        data.map(row => validator.validatePath(row, 'measurement_point'))
      );
      setValidationResults(results);
    };
    validateData();
  }, [data, validator]);
  
  const handleCellEdit = async (rowIndex: number, field: string, value: any) => {
    const updatedData = [...data];
    updatedData[rowIndex] = { ...updatedData[rowIndex], [field]: value };
    
    // Validate the updated row
    const validation = await validator.validatePath(updatedData[rowIndex], 'measurement_point');
    
    // Update validation results
    const newValidationResults = [...validationResults];
    newValidationResults[rowIndex] = validation;
    setValidationResults(newValidationResults);
    
    onUpdate(updatedData);
  };
  
  return (
    <div className="space-y-4">
      {/* CSV Import Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Measurement Points</h3>
        <div className="flex gap-2">
          <CSVImportButton onImport={handleCSVImport} />
          <BulkEditButton selectedRows={selectedRows} onBulkEdit={handleBulkEdit} />
        </div>
      </div>
      
      {/* Data Grid with validation indicators */}
      <DataTable
        columns={columns}
        data={data}
        validationResults={validationResults}
        onCellEdit={handleCellEdit}
        onRowSelect={setSelectedRows}
      />
      
      {/* Validation Summary */}
      <ValidationSummary validationResults={validationResults} />
    </div>
  );
};
```

### Schema-Driven Column Generation

```typescript
// utils/column-generator.ts
export const generateColumnsFromSchema = (schema: JSONSchema7): ColumnDef<MeasurementPoint>[] => {
  const columns: ColumnDef<MeasurementPoint>[] = [];
  
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      const column: ColumnDef<MeasurementPoint> = {
        accessorKey: key,
        header: formatFieldLabel(key),
        cell: ({ row, getValue }) => {
          const value = getValue();
          const validation = getFieldValidation(row.index, key);
          
          return (
            <EditableCell
              value={value}
              schema={propSchema}
              validation={validation}
              onChange={(newValue) => handleCellEdit(row.index, key, newValue)}
            />
          );
        }
      };
      
      // Add schema-specific cell renderers
      if (propSchema.enum) {
        column.cell = ({ row, getValue }) => (
          <EnumCell
            value={getValue()}
            options={propSchema.enum}
            onChange={(value) => handleCellEdit(row.index, key, value)}
          />
        );
      } else if (propSchema.type === 'number') {
        column.cell = ({ row, getValue }) => (
          <NumberCell
            value={getValue()}
            min={propSchema.minimum}
            max={propSchema.maximum}
            onChange={(value) => handleCellEdit(row.index, key, value)}
          />
        );
      }
      
      columns.push(column);
    });
  }
  
  return columns;
};
```

### Enhanced Bulk Edit with Schema Constraints

```typescript
// components/measurement-points/SchemaBulkEditDialog.tsx
export const SchemaBulkEditDialog: React.FC<BulkEditDialogProps> = ({
  selectedRows,
  onBulkEdit,
  open,
  onClose
}) => {
  const { schemaService } = useSchemaServices();
  const [bulkEditData, setBulkEditData] = useState<Partial<MeasurementPoint>>({});
  
  // Get editable fields from schema
  const editableFields = useMemo(() => {
    const schema = schemaService.getSchemaProperty('measurement_location.items.properties.measurement_point.items');
    return Object.entries(schema.properties || {}).map(([key, propSchema]) => ({
      key,
      label: formatFieldLabel(key),
      type: propSchema.type,
      enum: propSchema.enum,
      required: schema.required?.includes(key) || false
    }));
  }, [schemaService]);
  
  const handleBulkUpdate = () => {
    // Apply bulk changes with schema validation
    const updatedRows = selectedRows.map(row => ({
      ...row,
      ...bulkEditData,
      update_at: new Date().toISOString() // Schema requires update_at
    }));
    
    onBulkEdit(updatedRows);
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Edit {selectedRows.length} Measurement Points</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {editableFields.map(field => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              {field.enum ? (
                <Select
                  value={bulkEditData[field.key] || ''}
                  onValueChange={(value) => setBulkEditData(prev => ({ ...prev, [field.key]: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.enum.map(option => (
                      <SelectItem key={option} value={option}>
                        {formatEnumLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={bulkEditData[field.key] || ''}
                  onChange={(e) => setBulkEditData(prev => ({ 
                    ...prev, 
                    [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value 
                  }))}
                />
              )}
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleBulkUpdate}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### CSV Template Generation

```typescript
// services/csv-template-service.ts
class CSVTemplateService {
  constructor(private schemaService: SchemaService) {}
  
  generateTemplate(): string {
    const schema = this.schemaService.getSchemaProperty(
      'measurement_location.items.properties.measurement_point.items'
    );
    
    const headers = Object.keys(schema.properties || {})
      .filter(key => !['logger_measurement_config', 'sensor', 'mounting_arrangement', 'interference_structures'].includes(key))
      .map(key => this.formatHeaderName(key));
    
    // Add example row with schema-compliant values
    const exampleRow = headers.map(header => this.getExampleValue(header, schema));
    
    return [headers.join(','), exampleRow.join(',')].join('\n');
  }
  
  private getExampleValue(header: string, schema: JSONSchema7): string {
    const propSchema = schema.properties?.[header];
    
    if (propSchema?.enum) {
      return propSchema.enum[0] as string;
    }
    
    if (propSchema?.type === 'number') {
      return propSchema.examples?.[0] || '0';
    }
    
    return propSchema?.examples?.[0] || `example_${header}`;
  }
}
```

## Performance Considerations

### Schema Caching

- Cache parsed schema and validation functions
- Memoize form field generation
- Debounce validation calls
- Use React.memo for dynamic components

### Validation Optimization

- Validate only changed fields during input
- Batch validation updates
- Use web workers for complex validation
- Cache validation results with data fingerprints

### Data Grid Performance

- Virtualize large datasets in the data grid
- Debounce cell edit validation
- Use React.memo for cell components
- Batch bulk edit operations

## Current Application Integration

### Existing Components Analysis

#### **Components to KEEP and ENHANCE**
```typescript
// These existing components will be enhanced with schema validation
src/App.tsx                    // ✅ Keep - add schema provider
src/components/LandingPage.tsx // ✅ Keep - no changes needed
src/components/ui/*            // ✅ Keep - all shadcn components reused
src/components/FormWizard.tsx  // ✅ Keep - enhance with schema-driven steps
```

#### **Components to REPLACE**
```typescript
// These will be replaced with schema-driven versions
src/components/FormStep*.tsx   // ❌ Replace with DynamicFormStep (except MeasurementPoints)
src/components/form-fields/*   // ❌ Replace with DynamicFormField
src/components/PreviewJSON.tsx // ❌ Replace with SchemaValidatedPreview
```

#### **Components to ENHANCE (Keep + Add Schema Validation)**
```typescript
// These components have valuable functionality that should be preserved
src/components/MeasurementPointsStep.tsx    // ✅ Enhance with schema validation
src/components/DataGrid.tsx                 // ✅ Enhance with schema-aware columns
src/components/CSVImport.tsx                // ✅ Enhance with schema validation
src/components/BulkEditDialog.tsx           // ✅ Enhance with schema constraints
```

#### **New Components to CREATE**
```typescript
src/components/schema/
├── DynamicFormStep.tsx        // Schema-driven form steps
├── DynamicFormField.tsx       // Schema-aware field components
├── SchemaValidationFeedback.tsx
├── ConditionalFieldGroup.tsx
└── SchemaValidatedPreview.tsx

src/services/
├── schema-service.ts          // Schema loading and processing
├── schema-validator.ts        // AJV validation wrapper
├── form-builder.ts           // Dynamic form generation
└── export-service.ts         // Schema-compliant export
```

### Current Form Wizard Integration

#### **Enhanced FormWizard Structure**
```typescript
// src/components/FormWizard.tsx (ENHANCED)
export const FormWizard = () => {
  const { formData, updateField, validateStep } = useSchemaFormStore();
  const { currentStep, totalSteps } = useFormNavigation();
  
  // Schema-driven step configuration
  const stepConfig = useSchemaSteps();
  
  return (
    <div className="form-wizard">
      {/* Keep existing progress indicator */}
      <FormProgress currentStep={currentStep} totalSteps={totalSteps} />
      
      {/* Replace step content with schema-driven version */}
      <DynamicFormStep 
        step={currentStep}
        schema={stepConfig[currentStep]}
        data={formData}
        onUpdate={updateField}
        onValidate={validateStep}
      />
      
      {/* Keep existing navigation */}
      <FormNavigation 
        onNext={handleNext}
        onPrevious={handlePrevious}
        canProceed={stepConfig[currentStep].isValid}
      />
    </div>
  );
};
```

#### **Step Mapping to Schema Sections**
```typescript
// Current steps mapped to schema paths
const STEP_SCHEMA_MAPPING = {
  0: { // Basic Information
    schemaPath: 'root',
    fields: ['author', 'organisation', 'date', 'version', 'license', 'plant_name', 'plant_type'],
    component: 'BasicInfoStep' // Enhanced with schema validation
  },
  1: { // Measurement Locations
    schemaPath: 'measurement_location',
    fields: ['name', 'latitude_ddeg', 'longitude_ddeg', 'measurement_station_type_id'],
    component: 'DynamicFormStep', // New schema-driven component
    conditional: true // Show different fields based on station type
  },
  2: { // Station Configuration
    schemaPath: 'measurement_location[].{mast_properties|vertical_profiler_properties|model_config}',
    component: 'ConditionalStationConfig', // New conditional component
    dependsOn: 'measurement_station_type_id'
  },
  3: { // Logger Configuration
    schemaPath: 'measurement_location[].logger_main_config',
    component: 'DynamicFormStep',
    conditional: true // Only for non-reanalysis stations
  },
  4: { // Measurement Points
    schemaPath: 'measurement_location[].measurement_point',
    component: 'MeasurementPointsManager', // Enhanced with CSV + schema validation
    features: ['csv_import', 'data_grid', 'bulk_edit', 'schema_validation'],
    nested: true
 
  5: { // Sensors
    schemaPath: 'measurement_location[].measurement_point[].sensor',
    component: 'DynamicArrayStep',
    nested: true
  },
  6: { // Review & Export
    schemaPath: 'root',
    component: 'SchemaValidatedReview', // New validation-focused review
    validation: 'full'
  }
};
```

### shadcn/ui Component Reuse Strategy

#### **Direct Reuse (No Changes)**
```typescript
// All these existing shadcn components are reused as-is
import { Button } from '@/components/ui/button';           // ✅ Navigation buttons
import { Input } from '@/components/ui/input';             // ✅ Text inputs
import { Label } from '@/components/ui/label';             // ✅ Field labels
import { Select } from '@/components/ui/select';           // ✅ Enum dropdowns
import { Checkbox } from '@/components/ui/checkbox';       // ✅ Boolean fields
import { Card } from '@/components/ui/card';               // ✅ Form sections
import { Badge } from '@/components/ui/badge';             // ✅ Validation status
import { Alert } from '@/components/ui/alert';             // ✅ Error messages
```

#### **Enhanced shadcn Components**
```typescript
// src/components/form/EnhancedFormField.tsx
// Wrapper around shadcn components with schema validation
export const EnhancedFormField = ({ field, value, onChange, error }) => {
  const baseComponent = getBaseComponent(field.type); // Returns shadcn component
  
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </Label>
      
      {/* Render appropriate shadcn component */}
      {baseComponent}
      
      {/* Schema-driven validation feedback */}
      <SchemaValidationFeedback error={error} field={field} />
    </div>
  );
};
```

### State Management Migration

#### **Current Zustand Store Enhancement**
```typescript
// src/stores/form-store.ts (ENHANCED)
interface EnhancedFormStore extends CurrentFormStore {
  // Add schema validation
  schemaValidator: SchemaValidator;
  validationResults: SchemaValidationResults;
  
  // Enhanced actions with schema validation
  updateField: (path: string, value: any) => Promise<void>;
  validateField: (path: string) => Promise<ValidationResult>;
  validateForExport: () => Promise<ExportValidationResult>;
  
  // Keep existing actions but enhance them
  setCurrentStep: (step: number) => void; // Add validation check
  addMeasurementLocation: () => void;     // Use schema template
  removeMeasurementLocation: (index: number) => void;
}
```

#### **React Hook Form Integration**
```typescript
// src/hooks/use-schema-form.ts (NEW)
export const useSchemaForm = (step: number) => {
  const store = useSchemaFormStore();
  const stepSchema = useStepSchema(step);
  
  const methods = useForm({
    defaultValues: store.getStepData(step),
    resolver: zodResolver(stepSchema.zodSchema), // Generated from JSON schema
    mode: 'onChange'
  });
  
  // Bidirectional sync with enhanced validation
  useEffect(() => {
    const subscription = methods.watch(async (data) => {
      await store.updateStepData(step, data);
    });
    return () => subscription.unsubscribe();
  }, [methods.watch, store.updateStepData, step]);
  
  return methods;
};
```

### File Structure Changes

#### **Current Structure → New Structure**
```
src/
├── components/
│   ├── FormWizard.tsx          // ✅ Enhanced
│   ├── LandingPage.tsx         // ✅ Keep as-is
│   ├── ui/                     // ✅ Keep all shadcn components
│   ├── form/                   // 🆕 NEW - Schema-driven components
│   │   ├── DynamicFormStep.tsx
│   │   ├── DynamicFormField.tsx
│   │   ├── ConditionalFieldGroup.tsx
│   │   └── SchemaValidationFeedback.tsx
│   └── steps/                  // ❌ DELETE - Replace with dynamic
│       ├── BasicInfoStep.tsx   // ❌ Delete
│       ├── LocationStep.tsx    // ❌ Delete
│       └── ...                 // ❌ Delete all step components
├── services/                   // 🆕 NEW - Schema services
│   ├── schema-service.ts
│   ├── schema-validator.ts
│   ├── form-builder.ts
│   └── export-service.ts
├── stores/
│   └── form-store.ts          // ✅ Enhanced with schema validation
├── hooks/
│   ├── use-form-sync.ts       // ✅ Enhanced
│   └── use-schema-form.ts     // 🆕 NEW
├── utils/
│   ├── schema/                // 🆕 NEW - Schema utilities
│   │   ├── iea43-schema.json  // 🆕 The official schema file
│   │   ├── schema-parser.ts
│   │   └── validation-helpers.ts
│   └── example_data/          // ✅ Keep for testing
└── types/
    └── schema.ts              // ✅ Enhanced with schema-generated types
```

### Migration Implementation Plan

#### **Phase 1: Schema Foundation (Week 1)**
1. Add IEA JSON schema file to `src/utils/schema/`
2. Create `SchemaService` and `SchemaValidator` classes
3. Enhance existing Zustand store with schema validation
4. Keep all existing components working

#### **Phase 2: Dynamic Form Components (Week 2)**
1. Create `DynamicFormField` component using existing shadcn components
2. Create `DynamicFormStep` component
3. Replace one form step at a time (start with Basic Info)
4. Test each step replacement thoroughly

#### **Phase 3: Conditional Logic (Week 3)**
1. Implement measurement station type conditional logic
2. Replace Location and Configuration steps
3. Add schema-driven field visibility
4. Test all measurement station types

#### **Phase 4: Array Management (Week 4)**
1. Create dynamic array components for measurement points and sensors
2. Replace existing array management
3. Add schema-compliant add/remove functionality
4. Test complex nested data scenarios

#### **Phase 5: Export Enhancement (Week 5)**
1. Create schema-validated export service
2. Replace existing export functionality
3. Add comprehensive validation feedback
4. Test export compliance with official schema

### Component Reuse Benefits

1. **shadcn/ui Components**: 100% reused - no UI changes needed
2. **Existing Layouts**: Form wizard structure and navigation kept
3. **Styling**: All Tailwind classes and design system preserved
4. **User Experience**: Same look and feel, enhanced functionality
5. **Type Safety**: Enhanced with schema-generated types

This approach ensures minimal disruption to your existing UI while adding comprehensive schema validation and dynamic form generation capabilities.