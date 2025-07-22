# Requirements Document

## Introduction

The IEA Task 43 form application must generate JSON output that perfectly aligns with the official IEA Task 43 WRA Data Model Schema (version 1.4.0-2025.06). The current application suffers from schema compliance issues, inconsistent state management, and validation problems that prevent reliable export of compliant data. This feature will implement a schema-first approach where the official JSON schema drives all form validation, state management, and export functionality to ensure 100% compliance with the IEA standard.

## Requirements

### Requirement 1

**User Story:** As a user creating IEA Task 43 compliant data files, I want the form to enforce the official schema validation rules, so that my exported JSON is guaranteed to be compliant with the IEA standard.

#### Acceptance Criteria

1. WHEN a user enters data THEN the form SHALL validate against the official IEA Task 43 JSON schema
2. WHEN validation fails THEN the user SHALL see specific error messages referencing the schema requirements
3. WHEN a user attempts to export THEN the system SHALL perform final schema validation before allowing export
4. WHEN the export is generated THEN it SHALL pass validation against the official IEA Task 43 JSON schema

### Requirement 2

**User Story:** As a user working with complex nested form data, I want the form structure to exactly match the schema requirements, so that I understand what data is required and optional according to the IEA standard.

#### Acceptance Criteria

1. WHEN the form loads THEN it SHALL display fields that correspond exactly to the schema structure
2. WHEN a field is required by the schema THEN it SHALL be marked as required in the form
3. WHEN a field has enum constraints THEN the form SHALL provide only valid options
4. WHEN a field has format constraints THEN the form SHALL enforce those formats during input

### Requirement 3

**User Story:** As a user filling out measurement locations and points, I want the form to handle the complex nested arrays correctly, so that my data structure matches the schema requirements exactly.

#### Acceptance Criteria

1. WHEN a user adds measurement locations THEN the form SHALL create objects matching the measurement_location schema
2. WHEN a user adds measurement points THEN they SHALL be nested correctly within their parent location
3. WHEN a user adds sensors or loggers THEN they SHALL be associated with the correct measurement points
4. WHEN nested data is updated THEN the parent-child relationships SHALL be maintained according to the schema

### Requirement 4

**User Story:** As a user, I want consistent state management that keeps form data synchronized across all components, so that preview and export functionality always reflects my current input.

#### Acceptance Criteria

1. WHEN form data changes THEN all components consuming that data SHALL update immediately
2. WHEN I navigate between form steps THEN my data SHALL persist consistently
3. WHEN I view the JSON preview THEN it SHALL show the current state formatted according to the schema
4. WHEN validation occurs THEN the results SHALL be immediately reflected in the UI

### Requirement 5

**User Story:** As a user correcting validation errors, I want real-time feedback that shows exactly which schema requirements are not met, so that I can fix issues efficiently.

#### Acceptance Criteria

1. WHEN validation errors occur THEN they SHALL reference specific schema paths and requirements
2. WHEN I correct an error THEN the validation status SHALL update immediately
3. WHEN multiple errors exist THEN they SHALL be prioritized by severity and schema importance
4. WHEN I hover over error messages THEN I SHALL see detailed schema documentation

### Requirement 6

**User Story:** As a developer maintaining the application, I want the form structure to be automatically generated from the schema, so that updates to the IEA standard can be easily incorporated.

#### Acceptance Criteria

1. WHEN the schema is updated THEN form fields SHALL be automatically updated to match
2. WHEN new schema properties are added THEN they SHALL appear in the form without code changes
3. WHEN schema validation rules change THEN form validation SHALL automatically reflect the changes
4. WHEN debugging issues THEN developers SHALL have clear traceability between form fields and schema properties

### Requirement 7

**User Story:** As a user working with different measurement station types, I want the form to show only relevant fields based on my selections, so that I'm not confused by irrelevant options.

#### Acceptance Criteria

1. WHEN I select a measurement station type THEN only relevant configuration options SHALL be displayed
2. WHEN I choose "mast" THEN mast-specific properties SHALL be available
3. WHEN I choose "lidar" or "sodar" THEN vertical profiler properties SHALL be available
4. WHEN I choose "reanalysis" THEN model configuration SHALL be required instead of logger configuration

### Requirement 8

**User Story:** As a user, I want the application to handle form-only fields separately from export data, so that my working data doesn't interfere with schema compliance.

#### Acceptance Criteria

1. WHEN I use form-helper fields THEN they SHALL not appear in the exported JSON
2. WHEN I export data THEN only schema-compliant fields SHALL be included
3. WHEN I save my work THEN form-helper fields SHALL be preserved for my convenience
4. WHEN validation occurs THEN form-helper fields SHALL not cause schema validation errors