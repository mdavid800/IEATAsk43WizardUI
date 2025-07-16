# Design Document

## Overview

This design addresses critical schema compliance issues between the current IEA Task 43 WRA Data Model application and the official IEA Task 43 JSON schema. The analysis reveals several structural and data type mismatches that prevent the exported JSON from validating against the official schema.

## Architecture

The solution involves a multi-layered approach:

1. **Schema Validation Layer**: Integrate JSON schema validation using the official IEA schema
2. **Data Transformation Layer**: Enhance the existing `json-export.ts` utility to ensure full compliance
3. **Type System Updates**: Align TypeScript interfaces with the official schema requirements
4. **Validation Feedback System**: Provide real-time validation feedback in the UI

## Components and Interfaces

### 1. Schema Validation Service

```typescript
interface SchemaValidationService {
  validateAgainstIEASchema(data: any): ValidationResult;
  getValidationErrors(): ValidationError[];
  isCompliant(): boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  path: string;
  message: string;
  expectedType?: string;
  actualValue?: any;
}
```

### 2. Enhanced JSON Export Utility

The current `generateExportJson` function needs significant enhancements:

```typescript
interface IEACompliantExporter {
  generateCompliantJson(data: IEATask43Schema): IEACompliantData;
  validateStructure(data: any): boolean;
  transformSensorData(data: IEATask43Schema): IEATask43Schema;
  ensureRequiredFields(data: any): any;
}
```

### 3. Type System Corrections

Several TypeScript interface updates are required:

#### MeasurementLocation Interface Issues:
- Remove `sensors?: Sensor[]` field (not in official schema)
- Ensure all required fields are properly marked
- Fix optional field handling

#### MeasurementPoint Interface Issues:
- Update `measurement_type_id` enum to match official schema exactly
- Fix `height_reference_id` enum values
- Ensure `sensor` array is properly structured

#### Field Type Corrections:
- `statistic_type_id` field missing from MeasurementPoint
- `unit` field should be removed (not in official schema)
- Date fields need proper ISO 8601 formatting

## Data Models

### Current vs Required Schema Differences

#### 1. Root Level Structure
**Current Issues:**
- Form-only fields (`campaignStatus`, `startDate`, `endDate`) need proper exclusion
- `license` field handling inconsistent

**Required Changes:**
- Ensure `license` is always present (null if not specified)
- Completely exclude form-only fields from export

#### 2. MeasurementLocation Structure
**Current Issues:**
- `sensors` field exists at location level (not in official schema)
- Missing proper handling of `measurement_station_type_id` enum validation

**Required Changes:**
- Remove `sensors` field from MeasurementLocation
- Ensure all sensors are properly nested under `measurement_point.sensor`

#### 3. MeasurementPoint Structure
**Current Issues:**
- `measurement_type_id` enum doesn't match official schema exactly
- Missing `statistic_type_id` field
- `unit` field present but not in official schema
- `height_reference_id` enum values don't match

**Required Changes:**
```typescript
interface MeasurementPoint {
  name: string;
  measurement_type_id: MeasurementType; // Use official enum
  statistic_type_id?: StatisticType; // Add missing field
  height_m: number | null;
  height_reference_id: HeightReference; // Fix enum values
  notes?: string;
  update_at: string;
  logger_measurement_config: LoggerMeasurementConfig[];
  sensor: Sensor[];
  mounting_arrangement?: MountingArrangement[];
  interference_structures?: InterferenceStructure[];
}
```

#### 4. Sensor Structure
**Current Issues:**
- Sensor `date_from` and `date_to` are required in official schema
- Calibration structure needs validation

**Required Changes:**
- Ensure all sensors have required `date_from` and `date_to` fields
- Validate calibration structure against schema

#### 5. Logger Configuration
**Current Issues:**
- Optional field handling inconsistent
- Some required fields may be missing

**Required Changes:**
- Ensure `logger_oem_id`, `logger_serial_number`, `date_from`, `date_to` are always present
- Proper handling of optional fields (null vs undefined vs omitted)

## Error Handling

### Validation Error Categories

1. **Structural Errors**: Missing required fields, incorrect nesting
2. **Type Errors**: Wrong data types, invalid enum values
3. **Format Errors**: Date format issues, numeric constraint violations
4. **Reference Errors**: Invalid UUID references, broken relationships

### Error Reporting Strategy

```typescript
interface ValidationErrorReporter {
  reportStructuralErrors(errors: StructuralError[]): void;
  reportTypeErrors(errors: TypeError[]): void;
  reportFormatErrors(errors: FormatError[]): void;
  generateUserFriendlyMessage(error: ValidationError): string;
}
```

## Testing Strategy

### Unit Tests
- Schema validation service tests
- JSON export transformation tests
- Type conversion tests
- Error handling tests

### Integration Tests
- End-to-end JSON generation and validation
- Schema compliance verification
- Real-world data export scenarios

### Validation Tests
- Test against official IEA schema using JSON Schema validator
- Test with various data configurations
- Edge case handling (null values, empty arrays, etc.)

## Implementation Phases

### Phase 1: Schema Integration
- Add official IEA schema file to project
- Implement JSON schema validation service
- Create validation error reporting system

### Phase 2: Type System Corrections
- Update TypeScript interfaces to match official schema
- Fix enum definitions and field types
- Remove non-compliant fields

### Phase 3: Export Utility Enhancement
- Enhance `generateExportJson` function
- Implement proper field transformation
- Add sensor data restructuring

### Phase 4: UI Integration
- Add validation feedback to ReviewStep
- Show compliance status indicators
- Provide detailed error messages

### Phase 5: Testing and Validation
- Comprehensive testing against official schema
- Real-world data validation
- Performance optimization

## Key Design Decisions

### 1. Sensor Data Restructuring
**Decision**: Move sensors from location level to measurement_point level during export
**Rationale**: Official schema only supports sensors under measurement_point

### 2. Form Field Exclusion Strategy
**Decision**: Exclude form-only fields at export time rather than storage time
**Rationale**: Maintains form functionality while ensuring export compliance

### 3. Validation Timing
**Decision**: Validate during preview generation and before export
**Rationale**: Provides immediate feedback without blocking form usage

### 4. Error Handling Approach
**Decision**: Provide detailed, actionable error messages with field paths
**Rationale**: Enables users to quickly identify and fix compliance issues

## Dependencies

- JSON Schema validation library (e.g., ajv)
- Official IEA Task 43 schema file
- Enhanced error reporting utilities
- Updated TypeScript type definitions