# Schema Validation Fix Plan

## Overview
Fix mismatches between `src/types/schema.ts` and the floating lidar JSON example to ensure full compatibility.

## Issues Identified & Tasks

### ✅ 1. Root Schema Field Mismatches
- [ ] **1.1** Handle `date` vs `startDate` field inconsistency
  - Current: JSON uses `"date"`, schema expects `startDate`
  - Action: Update schema to accept both or standardize on one
- [ ] **1.2** Add missing `campaignStatus` field to JSON or make it optional
  - Current: Required in schema but missing from JSON
  - Action: Determine if this should be required or optional
- [ ] **1.3** Handle `endDate` field for historical campaigns
  - Current: Optional in schema, missing from JSON
  - Action: Ensure proper handling based on campaign status

### ✅ 2. Measurement Type Expansions
- [ ] **2.1** Add missing marine/offshore measurement types to `MeasurementType`:
  - [ ] `vertical_wind_speed`
  - [ ] `motion_corrected_wind_speed`
  - [ ] `motion_corrected_wind_direction`
  - [ ] `motion_corrected_vertical_wind_speed`
  - [ ] `water_temperature`
  - [ ] `wave_significant_height`
  - [ ] `wave_maximum_height`
  - [ ] `wave_directional_spread`
  - [ ] `wave_peak_period`
  - [ ] `water_speed`
  - [ ] `vertical_water_speed`
  - [ ] `water_direction`
  - [ ] `echo_intensity`
  - [ ] `signal_to_noise_ratio`
  - [ ] `salinity`
  - [ ] `conductivity`
  - [ ] `water_level`

### ✅ 3. Sensor Type Expansions
- [ ] **3.1** Add missing sensor types to `SensorType`:
  - [ ] `thermometer`
  - [ ] `inertial_measurement_unit`

### ✅ 4. Logger Configuration Updates
- [ ] **4.1** Add `lidar_config` property to `LoggerMainConfig` interface
  - Define proper interface for lidar configuration
  - Include all properties found in JSON example

### ✅ 5. Frontend Component Updates
- [ ] **5.1** Review and update components that use measurement types
  - [ ] Check `MeasurementStep.tsx` and related components
  - [ ] Update dropdowns/selects to include new measurement types
- [ ] **5.2** Review and update components that use sensor types
  - [ ] Check `SensorStep.tsx` and related components
  - [ ] Update dropdowns/selects to include new sensor types
- [ ] **5.3** Update logger-related components for lidar config
  - [ ] Check `LoggerStep.tsx` and related components
  - [ ] Add UI for lidar configuration if needed

### ✅ 6. Validation & Testing
- [ ] **6.1** Test JSON generation with updated schema
- [ ] **6.2** Verify frontend forms work with new field types
- [ ] **6.3** Validate that generated JSON matches example structure
- [ ] **6.4** Test import/export functionality

### ✅ 7. Documentation & Cleanup
- [ ] **7.1** Update comments in schema file
- [ ] **7.2** Verify all TypeScript compilation passes
- [ ] **7.3** Test end-to-end user flow

## Dependencies & Considerations
- Need to decide on `date` vs `startDate` standardization
- Need to determine if `campaignStatus` should be required or optional
- Frontend changes may require UI/UX review
- Consider backward compatibility with existing data

## Questions for Clarification
1. Should we standardize on `date` or `startDate` for the root schema?
2. Should `campaignStatus` be required or optional?
3. Do we need UI components for the new measurement/sensor types, or just schema support?
4. Should the lidar configuration have a dedicated UI section?

---
**Progress**: 0/7 sections completed 