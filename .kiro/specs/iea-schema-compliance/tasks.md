# Implementation Plan

- [x] 1. Set up schema validation infrastructure
  - Install JSON schema validation library (ajv)
  - Copy official IEA schema file to project utilities
  - Create schema validation service with proper error handling
  - _Requirements: 8.1, 8.2, 8.3, 8.4_



- [x] 2. Fix TypeScript schema interface compliance


- [x] 2.1 Update MeasurementLocation interface



  - Remove non-compliant `sensors?: Sensor[]` field from MeasurementLocation
  - Ensure all required fields are properly marked as non-optional
  - Fix measurement_station_type_id enum to match official schema exactly
  - _Requirements: 1.2, 3.1, 7.3_

- [x] 2.2 Update MeasurementPoint interface


  - ✅ Add missing `statistic_type_id?: StatisticType` field to MeasurementPoint (already done)
  - Remove non-compliant `unit?: string` field from MeasurementPoint
  - Update `measurement_type_id` enum to match official schema values exactly
  - Fix `height_reference_id` enum to use official values (ground_level, mean_sea_level, sea_level, lowest_astronomical_tide, sea_floor, other)
  - _Requirements: 2.3, 3.2, 5.1, 5.3_

- [x] 2.3 Update Sensor interface compliance


  - Ensure `date_from` and `date_to` are required fields in Sensor interface
  - Validate sensor_type_id enum matches official schema values
  - Fix calibration structure to match official schema requirements
  - update front end to indicate required fields (using red astrix)
  - _Requirements: 4.3, 4.4_

- [x] 2.4 Update Logger configuration interfaces


  - Ensure LoggerMainConfig has all required fields (date_from, date_to, logger_oem_id, logger_serial_number)
  - Fix LoggerOEM enum to match official schema values exactly
  - Update measurement_units enum to match official schema
  - Fix StatisticType enum to match official values (avg, sd, max, min, count, availability, quality, sum, median, mode, range, gust, ti, ti30sec, text)
  - _Requirements: 6.1, 6.2, 5.2, 5.4_

- [x] 3. Enhance JSON export utility for full compliance

- [x] 3.1 Implement sensor data restructuring


  - Modify generateExportJson to move sensors from location level to measurement_point level
  - Ensure sensors array is properly distributed to correct measurement points
  - Remove sensors field from measurement_location in export output
  - _Requirements: 4.1, 7.3_

- [x] 3.2 Fix form-only field exclusion


  - Ensure campaignStatus field is completely excluded from JSON export
  - Ensure startDate and endDate fields are completely excluded from JSON export
  - Verify preview JSON matches exactly what gets exported
  - _Requirements: 7.1, 7.2, 7.4_


- [x] 3.3 Implement required field validation


  - Add validation to ensure all measurement_location required fields are present
  - Add validation to ensure all measurement_point required fields are present
  - Add validation to ensure all logger_measurement_config required fields are present
  - Add validation to ensure all column_name required fields are present
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3.4 Fix date and numeric field formatting


  - Ensure all date fields use ISO 8601 format with 'T' separator
  - Implement proper null handling for optional fields (null vs undefined vs omitted)
  - Add numeric constraint validation (min/max values)
  - _Requirements: 2.1, 2.2, 6.3_

- [x] 4. Integrate schema validation into export process

- [x] 4.1 Add real-time validation to ReviewStep




  - Integrate schema validation service into ReviewStep component
  - Display validation status indicators in the UI
  - Show specific validation errors with field paths
  - Add validation confirmation when schema compliance is achieved

  - _Requirements: 8.1, 8.2, 8.3_

- [x] 4.2 Implement export-time validation

  - Add schema validation before JSON file download
  - Prevent export if validation fails with clear error messages
  - Provide detailed validation report for troubleshooting
  - _Requirements: 8.1, 8.2_
<!-- 
- [ ] 5. Create comprehensive test suite
- [ ] 5.1 Write unit tests for schema validation
  - Test schema validation service with valid and invalid data
  - Test error message generation and formatting
  - Test edge cases (null values, empty arrays, missing fields)
  - _Requirements: 8.1, 8.2_

- [ ] 5.2 Write integration tests for JSON export
  - Test complete JSON generation and validation workflow
  - Test sensor data restructuring functionality
  - Test form-only field exclusion
  - Validate against official IEA schema with real data
  - _Requirements: 1.4, 7.4, 4.1_

- [ ] 5.3 Add validation tests with official schema
  - Test exported JSON against official IEA Task 43 schema file
  - Test with various measurement station types (mast, lidar, floating_lidar, etc.)
  - Test with different sensor configurations and calibration data
  - Verify compliance with example data from official schema
  - _Requirements: 1.4, 8.4_ -->

- [ ] 6. Update UI components for better validation feedback
- [x] 6.1 Enhance ReviewStep validation display





  - Add schema compliance indicator to progress summary
  - Show detailed validation errors in user-friendly format
  - Add field-specific error highlighting and guidance
  - Update export button to show validation status
  - _Requirements: 8.2, 8.3_

- [x] 6.2 Add validation warnings throughout form




  - Add real-time validation hints in form steps
  - Show enum value suggestions for dropdown fields
  - Add format validation for date and numeric inputs
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 7. Documentation and final validation
- [ ] 7.1 Update schema documentation
  - Document all schema compliance changes
  - Create migration guide for existing data
  - Add troubleshooting guide for common validation errors
  - _Requirements: 8.2_

- [ ] 7.2 Perform final compliance verification
  - Test complete application workflow with official schema validation
  - Verify exported JSON validates successfully against official IEA schema
  - Test with multiple realistic data scenarios
  - Confirm all requirements are met and working correctly
  - _Requirements: 1.4, 8.4_