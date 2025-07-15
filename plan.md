# IEA Task 43 Schema Alignment Plan - Phase 2

## Overview
After completing Phase 1 (enum expansions and basic field fixes), this updated plan focuses on the remaining critical gaps identified by comparing our current `schema.ts` with the official `iea43_wra_data_model.schema.json`.

## Current Status: Phase 1 ✅ COMPLETED
- ✅ Root level fields aligned with IEA spec
- ✅ All critical enums expanded (70+ measurement types, 60+ units, 40+ sensor types)
- ✅ Searchable dropdown UX implemented
- ✅ JSON export compliance achieved

## Phase 2: Critical Missing Structures 🎯 CURRENT FOCUS

### 1. **MISSING: `model_config` Array** - HIGH PRIORITY
**Location**: `MeasurementLocation` interface
**Purpose**: Support for reanalysis/simulation data sources

**Required Interface**:
```typescript
interface ModelConfig {
  reanalysis: 'CFSR' | 'ERA-Interim' | 'ERA5' | 'JRA-55' | 'MERRA-2' | 'NCAR' | 'Other';
  horizontal_grid_resolution_m?: number | null;
  model_used?: string | null;
  date_from: string;
  date_to: string | null;
  offset_from_utc_hrs?: number | null;
  averaging_period_minutes?: number | null;
  timestamp_is_end_of_period?: boolean | null;
  notes?: string | null;
  update_at: string | null;
}
```

**Add to MeasurementLocation**:
```typescript
model_config?: ModelConfig[];
```

### 2. **MISSING: `lidar_config` Array** - HIGH PRIORITY
**Location**: `LoggerMainConfig` interface
**Purpose**: Lidar-specific configuration settings

**Required Interface**:
```typescript
interface LidarConfig {
  flow_corrections_applied?: boolean | null;
  logger_stated_device_datum_plane_height_m?: number | null;
  logger_stated_device_orientation_deg?: number | null;
  date_from: string | null;
  date_to: string | null;
  notes?: string | null;
  update_at: string | null;
}
```

**Add to LoggerMainConfig**:
```typescript
lidar_config?: LidarConfig[] | null;
```

### 3. **MISSING: `mast_section_geometry` Array** - MEDIUM PRIORITY
**Location**: `MastProperties` interface
**Purpose**: Detailed mast section specifications

**Required Interface**:
```typescript
interface MastSectionGeometry {
  uuid?: string | null;
  mast_section_height_mm?: number | null;
  pole_diameter_mm?: number | null;
  lattice_face_width_at_bottom_mm?: number | null;
  lattice_face_width_at_top_mm?: number | null;
  lattice_leg_width_mm?: number | null;
  lattice_leg_is_round_cross_section?: boolean | null;
  lattice_bracing_member_diameter_mm?: number | null;
  lattice_bracing_member_diameter_horizontal_mm?: number | null;
  lattice_bracing_member_diameter_diagonal_mm?: number | null;
  lattice_number_of_diagonal_bracing_members?: number | null;
  lattice_bracing_member_length_diagonal_mm?: number | null;
  number_of_repetitive_patterns_on_face?: number | null;
  lattice_bracing_member_height_mm?: number | null;
  lattice_has_horizontal_member?: boolean | null;
  notes?: string | null;
  update_at: string | null;
}
```

**Add to MastProperties**:
```typescript
mast_section_geometry?: MastSectionGeometry[] | null;
```

## Phase 3: Critical Type Fixes 🔧 MEDIUM PRIORITY

### 1. **NULLABILITY MISMATCHES**
```typescript
// Current → Should be
uuid: string → uuid: string | null  // in MeasurementLocation
height_m: number → height_m: number | null  // in MeasurementPoint
```

### 2. **MISSING CALIBRATION UNIT FIELDS**
**Location**: `Calibration` interface
**Add missing unit fields**:
```typescript
slope_unit?: MeasurementUnits | null;
offset_unit?: MeasurementUnits | null;  
sensitivity_unit?: MeasurementUnits | null;
```

### 3. **ORIENTATION REFERENCE NULLABILITY**
**Current**: `OrientationReference` doesn't allow `null`
**Fix**: Add `| null` to enum

## Phase 4: Schema Validation 📋 LOW PRIORITY

### 1. **Mutual Exclusivity Constraint**
The official schema has a constraint that `logger_main_config` and `model_config` are mutually exclusive in `MeasurementLocation`.

**Add validation logic**:
- If `logger_main_config` exists, `model_config` should not exist
- If `model_config` exists, `logger_main_config` should not exist

### 2. **Date Field Type Alignment**
**Current**: Most date fields are `string`
**Official**: Uses `format: "date-time"` for most dates, `format: "date"` for creation date
**Action**: Consider adding date format validation

## Implementation Priority

### 🔥 IMMEDIATE (Phase 2A)
1. Add `ModelConfig` interface and array to `MeasurementLocation`
2. Add `LidarConfig` interface and array to `LoggerMainConfig` 
3. Fix `uuid` and `height_m` nullability

### 🎯 NEXT (Phase 2B)  
4. Add missing calibration unit fields
5. Add `MastSectionGeometry` interface
6. Fix `OrientationReference` nullability

### 📝 LATER (Phase 3)
7. Add mutual exclusivity validation
8. Update form components for new optional fields
9. Add comprehensive schema validation

## Breaking Changes Impact
- **Minimal**: Most additions are optional arrays/fields
- **Safe**: Existing JSON exports will remain valid
- **Progressive**: Can implement incrementally without breaking existing functionality

## Custom Field Status 
**Keeping as extensions** (not in official IEA spec):
- ✅ `campaignStatus` & campaign dates (form-only, excluded from JSON)
- ✅ `sensors` array under `MeasurementLocation` (UI convenience)
- ✅ `statistic_type_id` & `unit` in `MeasurementPoint` (form helpers)
- ✅ `logger_id` in `LoggerMeasurementConfig` (practical necessity)

These provide UI/UX benefits without compromising IEA compliance in final JSON export.

---

## Next Action Items

1. ✅ **Update plan.md** with current gaps analysis
2. 🎯 **Implement ModelConfig interface** and integration
3. 🎯 **Implement LidarConfig interface** and integration  
4. 🎯 **Fix critical nullability issues**
5. 📋 **Update form validation** for new optional structures

**Estimated Completion**: 3-4 hours for Phase 2A, 2-3 hours for Phase 2B