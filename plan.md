# IEA Task 43 Schema Alignment Plan - Phase 2 Updated

## Overview
After completing Phase 1 (enum expansions and basic field fixes), this updated plan focuses on the remaining critical gaps identified by comparing our current `schema.ts` with the official `iea43_wra_data_model.schema.json`.

## Current Status: Phase 2A ✅ COMPLETED
- ✅ Root level fields aligned with IEA spec
- ✅ All critical enums expanded (70+ measurement types, 60+ units, 40+ sensor types)
- ✅ Searchable dropdown UX implemented
- ✅ JSON export compliance achieved
- ✅ **ModelConfig implementation complete** - Full reanalysis data support
- ✅ **Critical nullability fixes** - uuid and height_m now properly nullable
- ✅ **LocationStep UI enhanced** - Dynamic ModelConfig section for reanalysis stations

## Phase 2B: Remaining Structures 🎯 CURRENT FOCUS

### 1. ✅ **COMPLETED: `model_config` Array** - HIGH PRIORITY
**Status**: ✅ **FULLY IMPLEMENTED**
- ✅ ModelConfig interface added to schema.ts
- ✅ Added to MeasurementLocation interface
- ✅ UI section in LocationStep.tsx (appears when 'reanalysis' selected)
- ✅ Full form functionality with add/remove/expand capabilities
- ✅ All IEA-required fields: reanalysis, date_from, optional fields

### 2. ❌ **SKIPPING: `lidar_config` Array** - OUTDATED
**Status**: ❌ **INTENTIONALLY SKIPPED**
**Reason**: This is outdated in the official schema and has been replaced by `vertical_profiler_properties` which is already fully implemented in our system.

**Current Implementation**: 
- ✅ `vertical_profiler_properties` array is complete and covers all lidar functionality
- ✅ UI fully functional for lidar/sodar/floating_lidar station types
- ✅ Covers all necessary lidar configuration fields

### 3. **MISSING: `mast_section_geometry` Array** - MEDIUM PRIORITY
**Location**: `MastProperties` interface
**Purpose**: Detailed mast section specifications for advanced IEC compliance

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

## Phase 3: Final Type Fixes 🔧 MEDIUM PRIORITY

### 1. ✅ **COMPLETED: NULLABILITY MISMATCHES**
```typescript
// ✅ FIXED
uuid: string | null  // in MeasurementLocation
height_m: number | null  // in MeasurementPoint
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

### ✅ COMPLETED (Phase 2A)
1. ✅ Add `ModelConfig` interface and array to `MeasurementLocation`
2. ✅ Fix `uuid` and `height_m` nullability
3. ✅ Complete LocationStep UI for ModelConfig

### 🎯 NEXT (Phase 2B)  
4. Add missing calibration unit fields
5. Add `MastSectionGeometry` interface (optional - advanced IEC compliance)
6. Fix `OrientationReference` nullability

### 📝 LATER (Phase 3)
7. Add mutual exclusivity validation
8. Add comprehensive schema validation
9. Consider date format validation

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

## Architecture Decision: Vertical Profiler vs LidarConfig

**Decision**: Use `vertical_profiler_properties` instead of `lidar_config`

**Rationale**: 
- `vertical_profiler_properties` is the current standard in IEA Task 43
- `lidar_config` appears in schema but is legacy/deprecated
- `vertical_profiler_properties` covers all lidar, sodar, and floating lidar configurations
- Our implementation already supports this comprehensively
- UI already functional for all vertical profiler types

---

## Current Phase 2B Action Items

1. ✅ **Update plan.md** to reflect ModelConfig completion and remove LidarConfig
2. 🎯 **Add calibration unit fields** (slope_unit, offset_unit, sensitivity_unit)
3. 📋 **Add MastSectionGeometry interface** (optional - for advanced users)
4. 🔧 **Fix OrientationReference nullability**

**Estimated Completion**: 2-3 hours for Phase 2B

## Summary: Major Progress Achieved

**✅ Phase 2A Complete:**
- **ModelConfig**: Full reanalysis data support with comprehensive UI
- **Nullability**: Critical type fixes for schema compliance
- **UI Enhancement**: Dynamic sections based on station type selection

**🎯 Next Focus:**
- Calibration unit fields (practical necessity)
- Optional advanced mast geometry (IEC compliance)
- Final type alignment touches