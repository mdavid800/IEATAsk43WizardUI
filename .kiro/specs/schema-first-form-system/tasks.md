# Implementation Plan

## Phase 1: Schema Foundation and Services

- [ ] 1. Set up schema infrastructure and validation services
  - Create schema service to load and parse the IEA Task 43 JSON schema
  - Implement AJV validator with comprehensive error handling
  - Add schema file to project and create loading utilities
  - _Requirements: 1.1, 1.3, 6.1, 6.2_

- [ ] 1.1 Create core schema service class
  - Write SchemaService class with methods to load and query the JSON schema
  - Implement schema path resolution for nested properties
  - Add methods to extract required fields, enum values, and validation rules
  - _Requirements: 1.1, 6.1_

- [ ] 1.2 Implement AJV validation wrapper
  - Create SchemaValidator class that wraps AJV with custom error formatting
  - Add support for validating specific schema paths and nested objects
  - Implement validation result mapping with clear error messages
  - _Requirements: 1.1, 1.2, 5.1_

- [ ] 1.3 Add official IEA schema file and utilities
  - Add the provided IEA Task 43 JSON schema file to src/utils/schema/
  - Create schema parsing utilities and helper functions
  - Implement schema caching for performance optimization
  - _Requirements: 1.1, 6.1_

## Phase 2: Enhanced State Management

- [ ] 2. Enhance Zustand store with schema validation
  - Integrate schema validation into the existing form store
  - Add schema-aware field update methods with real-time validation
  - Implement validation result caching and state management
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 2.1 Extend form store with schema validation
  - Add SchemaValidator instance to the existing Zustand store
  - Implement schema-aware updateField method with validation
  - Add validation results state and management methods
  - _Requirements: 4.1, 4.2_

- [ ] 2.2 Implement schema-aware array operations
  - Create addArrayItem method that uses schema templates for new items
  - Implement removeArrayItem and moveArrayItem with validation
  - Add nested object update methods for complex data structures
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 2.3 Add export validation and data cleaning
  - Implement validateForExport method with comprehensive schema checking
  - Create data cleaning service to remove form-only fields
  - Add export readiness checking with blocking error identification
  - _Requirements: 1.3, 8.1, 8.2, 8.3_

## Phase 3: Dynamic Form Generation

- [ ] 3. Create schema-driven form components
  - Build dynamic form field components that adapt to schema definitions
  - Implement conditional field visibility based on schema rules
  - Create form step generator that maps schema sections to UI components
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3.1 Build DynamicFormField component
  - Create form field component that renders based on schema property types
  - Implement enum dropdowns, number inputs, date fields from schema definitions
  - Add validation feedback display with schema-specific error messages
  - _Requirements: 2.1, 2.2, 5.1, 5.2_

- [ ] 3.2 Implement conditional field logic
  - Create ConditionalLogicService to handle measurement station type visibility
  - Implement field visibility rules based on measurement_station_type_id selection
  - Add dynamic required field validation based on schema allOf conditions
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 3.3 Create DynamicFormStep component
  - Build step component that generates form sections from schema paths
  - Implement step-level validation with schema compliance checking
  - Add progress tracking and validation status indicators
  - _Requirements: 2.1, 2.2, 4.1, 4.2_

## Phase 4: Form Wizard Integration

- [ ] 4. Integrate schema-driven components with existing FormWizard
  - Update FormWizard to use schema-driven step configuration
  - Replace existing form steps with dynamic schema-based components
  - Maintain existing navigation and progress indication functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4.1 Enhance FormWizard with schema step mapping
  - Update FormWizard component to use schema-driven step configuration
  - Implement step mapping that connects form steps to schema sections
  - Add schema validation to step navigation and progress tracking
  - _Requirements: 4.1, 4.2_

- [ ] 4.2 Replace basic information step with schema validation
  - Convert BasicInfoStep to use DynamicFormStep with schema validation
  - Implement real-time validation for author, organisation, date, version fields
  - Add enum validation for plant_type with schema-defined options
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 4.3 Implement measurement location step with conditional logic
  - Create measurement location form with schema-driven field visibility
  - Implement measurement station type selection with conditional field display
  - Add coordinate validation with schema-defined min/max constraints
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

## Phase 5: Enhanced Measurement Points Management

- [ ] 5. Enhance measurement points with schema-aware CSV and data grid
  - Upgrade existing CSV import functionality with schema validation
  - Enhance data grid with schema-driven column generation and validation
  - Implement bulk edit operations with schema constraint enforcement
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 5.1 Create schema-aware CSV import service
  - Build CSVImportService that validates imported data against measurement_point schema
  - Implement CSV column mapping to schema properties with validation
  - Add import error reporting with specific schema violation messages
  - _Requirements: 3.1, 3.2, 1.1, 1.2_

- [ ] 5.2 Enhance data grid with schema validation
  - Update DataGrid component to generate columns from measurement_point schema
  - Implement real-time cell validation with schema constraint checking
  - Add validation status indicators and error highlighting in grid cells
  - _Requirements: 3.3, 3.4, 5.1, 5.2_

- [ ] 5.3 Implement schema-constrained bulk edit
  - Create BulkEditDialog that shows only schema-valid fields for editing
  - Implement bulk validation before applying changes to selected rows
  - Add bulk edit templates based on schema property definitions
  - _Requirements: 3.1, 3.2, 5.1, 5.2_

- [ ] 5.4 Add CSV template generation from schema
  - Create CSVTemplateService that generates templates from measurement_point schema
  - Implement example value generation based on schema examples and constraints
  - Add downloadable CSV template with schema-compliant headers and sample data
  - _Requirements: 2.1, 2.2, 6.1, 6.2_

## Phase 6: Station Configuration and Logger Management

- [ ] 6. Implement conditional station configuration with schema validation
  - Create station-specific configuration forms based on measurement_station_type_id
  - Implement logger configuration with schema-driven field validation
  - Add model configuration for reanalysis and virtual met mast types
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 6.1 Build conditional station configuration component
  - Create ConditionalStationConfig that shows mast_properties for mast stations
  - Implement vertical_profiler_properties display for lidar/sodar stations
  - Add model_config form for reanalysis and virtual_met_mast stations
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 6.2 Implement logger configuration with schema validation
  - Create logger configuration form with schema-driven field validation
  - Implement logger OEM enum validation and required field enforcement
  - Add date range validation and timezone offset constraints
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 6.3 Add sensor management with schema compliance
  - Create sensor array management with schema-based templates
  - Implement sensor type validation and calibration data structure
  - Add mounting arrangement configuration with schema constraints
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

## Phase 7: Export Enhancement and Validation

- [ ] 7. Create comprehensive export system with schema validation
  - Implement export service that ensures 100% schema compliance
  - Add pre-export validation with detailed error reporting
  - Create export preview with schema validation status
  - _Requirements: 1.3, 1.4, 8.1, 8.2, 8.3, 8.4_

- [ ] 7.1 Build schema-compliant export service
  - Create ExportService that removes form-only fields before export
  - Implement comprehensive schema validation before JSON generation
  - Add export data cleaning and formatting for IEA compliance
  - _Requirements: 1.3, 1.4, 8.1, 8.2_

- [ ] 7.2 Implement export validation and error reporting
  - Create detailed validation reporting with schema path references
  - Implement blocking error identification that prevents invalid exports
  - Add warning system for non-critical schema compliance issues
  - _Requirements: 1.3, 5.1, 5.2, 5.3_

- [ ] 7.3 Create schema-validated preview component
  - Build preview component that shows export data with validation status
  - Implement real-time validation feedback in JSON preview
  - Add export readiness indicator with validation summary
  - _Requirements: 4.1, 4.2, 5.1, 5.2_

## Phase 8: Testing and Quality Assurance

- [ ] 8. Implement comprehensive testing for schema compliance
  - Create unit tests for all schema validation services
  - Implement integration tests for form-to-export data flow
  - Add end-to-end tests that validate against the official IEA schema
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 8.1 Create schema validation unit tests
  - Write tests for SchemaService methods with various schema queries
  - Implement SchemaValidator tests with valid and invalid data scenarios
  - Add tests for conditional logic service with all measurement station types
  - _Requirements: 1.1, 1.2, 7.1, 7.2, 7.3, 7.4_

- [ ] 8.2 Implement form integration tests
  - Create tests for dynamic form generation from schema definitions
  - Test conditional field visibility with measurement station type changes
  - Validate form-to-store data synchronization with schema compliance
  - _Requirements: 2.1, 2.2, 4.1, 4.2, 7.1, 7.2_

- [ ] 8.3 Add export compliance testing
  - Write tests that validate exported JSON against the official IEA schema
  - Test form-only field removal and data cleaning processes
  - Validate export blocking for schema-non-compliant data
  - _Requirements: 1.3, 1.4, 8.1, 8.2, 8.3, 8.4_

- [ ] 8.4 Create end-to-end workflow tests
  - Test complete user workflows from form entry to valid export
  - Validate CSV import to export pipeline with schema compliance
  - Test bulk edit operations with schema constraint enforcement
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2_

## Phase 9: Performance Optimization and Polish

- [ ] 9. Optimize performance and add user experience enhancements
  - Implement validation caching and debouncing for better performance
  - Add loading states and progress indicators for validation operations
  - Create comprehensive error messaging with schema documentation links
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9.1 Implement validation performance optimizations
  - Add validation result caching with data fingerprinting
  - Implement debounced validation for real-time form updates
  - Add memoization for expensive schema parsing operations
  - _Requirements: 5.4, 4.1, 4.2_

- [ ] 9.2 Add comprehensive error messaging and help
  - Create error messages that reference specific schema requirements
  - Implement contextual help tooltips with schema documentation
  - Add suggested fixes for common validation errors
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9.3 Implement loading states and progress indicators
  - Add loading indicators for schema validation operations
  - Implement progress tracking for bulk operations like CSV import
  - Create validation status indicators throughout the form interface
  - _Requirements: 4.1, 4.2, 5.1, 5.2_