# Requirements Document

## Introduction

This feature addresses critical schema compliance issues between the IEA Task 43 WRA Data Model application and the official IEA Task 43 JSON schema. The application currently produces JSON output that may not fully validate against the official schema, potentially causing integration issues for users who need compliant data exports.

## Requirements

### Requirement 1: Schema Structure Compliance

**User Story:** As a wind resource assessment professional, I want the exported JSON to strictly comply with the IEA Task 43 schema structure, so that my data can be validated and integrated with other IEA-compliant systems.

#### Acceptance Criteria

1. WHEN the application exports JSON THEN the root-level structure SHALL match the official IEA schema exactly
2. WHEN measurement_location arrays are exported THEN they SHALL contain all required fields as specified in the schema
3. WHEN optional fields are null or undefined THEN they SHALL be handled according to schema specifications
4. WHEN the JSON is validated against the official schema THEN it SHALL pass without errors

### Requirement 2: Field Type and Format Compliance

**User Story:** As a data analyst, I want all field types and formats to match the IEA schema specifications, so that automated processing tools can correctly interpret the data.

#### Acceptance Criteria

1. WHEN date fields are exported THEN they SHALL use ISO 8601 format with 'T' separator as required
2. WHEN numeric fields are exported THEN they SHALL respect min/max constraints defined in the schema
3. WHEN enum fields are exported THEN they SHALL only contain values from the official enum lists
4. WHEN measurement_type_id fields are used THEN they SHALL match the official measurement type enumeration

### Requirement 3: Required Field Validation

**User Story:** As a system integrator, I want all required fields to be present in the exported JSON, so that downstream systems can process the data without errors.

#### Acceptance Criteria

1. WHEN exporting measurement_location THEN all required fields (name, latitude_ddeg, longitude_ddeg, measurement_station_type_id, measurement_point) SHALL be present
2. WHEN exporting measurement_point THEN all required fields (name, measurement_type_id, height_m, logger_measurement_config) SHALL be present
3. WHEN exporting logger_measurement_config THEN all required fields (column_name, date_from, date_to) SHALL be present
4. WHEN exporting column_name THEN all required fields (column_name, statistic_type_id) SHALL be present

### Requirement 4: Sensor Data Structure Compliance

**User Story:** As a meteorological equipment specialist, I want sensor data to be structured according to IEA specifications, so that sensor information is properly documented and traceable.

#### Acceptance Criteria

1. WHEN sensor arrays are exported THEN they SHALL be nested under measurement_point as per schema
2. WHEN sensor calibration data is present THEN it SHALL follow the official calibration structure
3. WHEN sensor date_from and date_to fields are used THEN they SHALL be required as per schema
4. WHEN sensor type enumerations are used THEN they SHALL match the official sensor_type_id values

### Requirement 5: Height Reference and Measurement Units Compliance

**User Story:** As a wind measurement technician, I want height references and measurement units to use standard IEA enumerations, so that measurements are consistently interpreted across different systems.

#### Acceptance Criteria

1. WHEN height_reference_id is specified THEN it SHALL use only values from the official enum (ground_level, mean_sea_level, sea_level, lowest_astronomical_tide, sea_floor, other)
2. WHEN measurement_units_id is specified THEN it SHALL use only values from the official measurement_units enum
3. WHEN height_m is null THEN it SHALL be explicitly set to null rather than undefined
4. WHEN statistic_type_id is used THEN it SHALL match official values (avg, sd, max, min, count, availability, quality, sum, median, mode, range, gust, ti, ti30sec, text)

### Requirement 6: Logger Configuration Compliance

**User Story:** As a data logger technician, I want logger configuration data to match IEA specifications exactly, so that logger setup information is properly documented and validated.

#### Acceptance Criteria

1. WHEN logger_main_config is exported THEN required fields (date_from, date_to, logger_oem_id, logger_serial_number) SHALL be present
2. WHEN logger_oem_id is specified THEN it SHALL use only values from the official LoggerOEM enum
3. WHEN optional logger fields are empty THEN they SHALL be handled consistently (null vs undefined vs omitted)
4. WHEN lidar_config is present THEN it SHALL follow the nested structure defined in the schema

### Requirement 7: Form-Only Field Exclusion

**User Story:** As a data compliance officer, I want form-only fields to be properly excluded from JSON exports, so that only IEA-compliant data is included in the final output.

#### Acceptance Criteria

1. WHEN JSON is exported THEN campaignStatus field SHALL be excluded
2. WHEN JSON is exported THEN startDate and endDate fields SHALL be excluded
3. WHEN JSON is exported THEN sensors field at location level SHALL be properly handled (moved to measurement_point level)
4. WHEN preview is generated THEN it SHALL match exactly what gets exported

### Requirement 8: Schema Validation Integration

**User Story:** As a quality assurance engineer, I want the application to validate exported JSON against the official schema, so that compliance issues are caught before data export.

#### Acceptance Criteria

1. WHEN JSON is generated THEN it SHALL be validated against the official IEA schema
2. WHEN validation fails THEN specific error messages SHALL be provided to the user
3. WHEN validation passes THEN a confirmation indicator SHALL be shown
4. WHEN schema validation is performed THEN it SHALL use the exact official schema file