// IEA Task 43 Data Model Schema Types
export interface IEATask43Schema {
  author: string;
  organisation: string;
  date: string; // Date the JSON file was created (YYYY-MM-DD format)
  version: string;
  license?: string | null; // Legal permissions field (IEA compliant)

  // 🔹 FORM-ONLY FIELDS (NOT exported to JSON)
  campaignStatus?: 'live' | 'historical'; // Form validation only
  startDate?: string; // Campaign start date (form only, not exported to JSON)
  endDate?: string; // Campaign end date (form only, not exported to JSON)

  // ✅ IEA-COMPLIANT FIELDS
  /** Name of the plant */
  plant_name?: string | null;
  /** Type of plant: onshore wind, offshore wind, solar, or null */
  plant_type: 'onshore_wind' | 'offshore_wind' | 'solar' | null;
  measurement_location: MeasurementLocation[];
}

export interface ModelConfig {
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

export interface MeasurementLocation {
  uuid?: string | null;
  name: string; // Required
  latitude_ddeg: number; // Required
  longitude_ddeg: number; // Required
  measurement_station_type_id: 'mast' | 'lidar' | 'sodar' | 'floating_lidar' | 'wave_buoy' | 'adcp' | 'solar' | 'virtual_met_mast' | 'reanalysis'; // Required
  notes?: string;
  update_at: string;
  mast_properties?: MastProperties;
  vertical_profiler_properties?: VerticalProfilerProperty[];
  logger_main_config?: LoggerMainConfig[];
  model_config?: ModelConfig[];
  measurement_point: MeasurementPoint[]; // Required
}

export interface MastSectionGeometry {
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

export interface MastProperties {
  mast_geometry_id?: 'lattice_triangle' | 'lattice_square_round_edges' | 'lattice_square_sharp_edges' | 'pole' | null;
  mast_oem?: string;
  mast_serial_number?: string;
  mast_model?: string;
  mast_height_m?: number;
  date_from: string;
  date_to: string | null;
  notes?: string;
  update_at: string;
  mast_section_geometry?: MastSectionGeometry[] | null;
}

export interface VerticalProfilerProperty {
  device_datum_plane_height_m?: number;
  height_reference_id?: HeightReference;
  device_orientation_deg?: number;
  orientation_reference_id?: OrientationReference;
  device_vertical_orientation?: 'upward' | 'downward' | null;
  date_from: string;
  date_to?: string | null;
  notes?: string;
  update_at: string;
}

export interface LoggerMainConfig {
  logger_oem_id: LoggerOEM;
  logger_model_name?: string;
  logger_serial_number: string;
  logger_firmware_version?: string;
  logger_id?: string;
  logger_name?: string;
  date_from: string;
  date_to: string | null;
  encryption_pin_or_key?: string;
  enclosure_lock_details?: string;
  data_transfer_details?: string;
  offset_from_utc_hrs?: number;
  sampling_rate_sec?: number;
  averaging_period_minutes?: number;
  timestamp_is_end_of_period?: boolean;
  clock_is_auto_synced?: boolean;
  logger_acquisition_uncertainty?: number;
  uncertainty_k_factor?: number;
  notes?: string;
  update_at: string;
}

export interface MeasurementPoint {
  name: string;
  measurement_type_id: MeasurementType;
  height_m: number | null;
  height_reference_id: HeightReference;
  notes?: string;
  update_at: string;
  logger_measurement_config: LoggerMeasurementConfig[];
  sensor: Sensor[];
  mounting_arrangement?: MountingArrangement[];
  interference_structures?: InterferenceStructure[];

  // 🔹 FORM-ONLY FIELDS (NOT exported to JSON)
  statistic_type_id?: StatisticType; // Form helper - should be in column_name objects
  unit?: string; // Form helper - not in IEA schema, use measurement_units_id in logger config
}

export interface LoggerMeasurementConfig {
  logger_id?: string;
  slope?: number;
  offset?: number;
  sensitivity?: number;
  measurement_units_id?: MeasurementUnits;
  height_m?: number;
  serial_number?: string;
  connection_channel?: string;
  logger_stated_boom_orientation_deg?: number;
  date_from: string;
  date_to: string | null;
  notes?: string;
  update_at: string;
  column_name: ColumnName[];
}

export interface ColumnName {
  column_name: string;
  statistic_type_id: StatisticType;
  is_ignored: boolean;
  notes?: string;
  update_at: string;
}

export interface Sensor {
  oem?: string;
  model?: string;
  serial_number?: string;
  sensor_type_id?: SensorType;
  classification?: string;
  instrument_poi_height_mm?: number;
  is_heated?: boolean;
  sensor_body_size_mm?: number;
  date_from: string;
  date_to: string | null;
  notes?: string;
  update_at: string;
  calibration?: Calibration[];
}

export interface Calibration {
  measurement_type_id: MeasurementType;
  slope?: number;
  slope_unit?: MeasurementUnits | null;
  offset?: number;
  offset_unit?: MeasurementUnits | null;
  sensitivity?: number;
  sensitivity_unit?: MeasurementUnits | null;
  report_file_name?: string;
  report_link?: string;
  calibration_id?: string;
  date_of_calibration?: string;
  revision?: string;
  calibration_organisation?: string;
  place_of_calibration?: string;
  uncertainty_k_factor?: number;
  notes?: string;
  update_at: string;
  calibration_uncertainty?: CalibrationUncertainty[];
}

export interface CalibrationUncertainty {
  reference_bin?: number;
  reference_unit?: string;
  combined_uncertainty?: number;
}

export interface MountingArrangement {
  mast_section_geometry_uuid?: string;
  mounting_type_id?: MountingType;
  boom_orientation_deg?: number;
  vane_dead_band_orientation_deg?: number;
  orientation_reference_id?: OrientationReference;
  tilt_angle_deg?: number;
  boom_oem?: string;
  boom_model?: string;
  upstand_height_mm?: number;
  upstand_diameter_mm?: number;
  boom_diameter_mm?: number;
  boom_length_mm?: number;
  distance_from_mast_to_sensor_mm?: number;
  date_from: string;
  date_to: string | null;
  notes?: string;
  update_at: string;
}

export interface InterferenceStructure {
  structure_type_id: 'lightning_finial' | 'aviation_light' | 'guy_wires' | 'other';
  orientation_from_mast_centre_deg?: number;
  orientation_reference_id?: OrientationReference;
  distance_from_mast_centre_mm?: number;
  diameter_of_interference_structure_mm?: number;
  date_from: string;
  date_to: string | null;
  notes?: string;
  update_at: string;
}

export type LoggerOEM =
  | 'NRG Systems'
  | 'Ammonit'
  | 'Campbell Scientific'
  | 'Vaisala'
  | 'SecondWind'
  | 'Kintech'
  | 'Wilmers'
  | 'Unidata'
  | 'WindLogger'
  | 'Leosphere'
  | 'ZX Lidars'
  | 'AXYS Technologies'
  | 'AQSystem'
  | 'Pentaluum'
  | 'Nortek'
  | 'Teledyne RDI'
  | 'Aanderaa'
  | 'Other';

export type MeasurementType =
  | 'wind_speed'
  | 'wind_direction'
  | 'air_temperature'
  | 'water_temperature'
  | 'temperature'
  | 'air_pressure'
  | 'air_density'
  | 'relative_humidity'
  | 'voltage'
  | 'current'
  | 'resistance'
  | 'power'
  | 'energy'
  | 'vertical_wind_speed'
  | 'wind_speed_turbulence'
  | 'precipitation'
  | 'ice_detection'
  | 'global_horizontal_irradiance'
  | 'direct_normal_irradiance'
  | 'diffuse_horizontal_irradiance'
  | 'global_tilted_irradiance'
  | 'global_normal_irradiance'
  | 'albedo'
  | 'soiling_loss_index'
  | 'illuminance'
  | 'fog'
  | 'salinity'
  | 'conductivity'
  | 'pressure'
  | 'gps_coordinates'
  | 'status'
  | 'flag'
  | 'counter'
  | 'availability'
  | 'quality'
  | 'carrier_to_noise_ratio'
  | 'doppler_spectral_broadening'
  | 'echo_intensity'
  | 'signal_to_noise_ratio'
  | 'motion_corrected_wind_speed'
  | 'motion_corrected_wind_direction'
  | 'motion_corrected_vertical_wind_speed'
  | 'wave_height'
  | 'wave_significant_height'
  | 'wave_maximum_height'
  | 'wave_direction'
  | 'wave_directional_spread'
  | 'wave_period'
  | 'wave_peak_period'
  | 'wave_period_first_frequency'
  | 'wave_period_second_frequency'
  | 'wave_period_zero_crossing'
  | 'wave_energy_spectrum'
  | 'wave_energy_spectrum_maximum'
  | 'water_speed'
  | 'vertical_water_speed'
  | 'water_direction'
  | 'orientation'
  | 'compass_direction'
  | 'true_north_offset'
  | 'tilt'
  | 'tilt_x'
  | 'tilt_y'
  | 'tilt_z'
  | 'pitch'
  | 'roll'
  | 'heading'
  | 'u'
  | 'v'
  | 'w'
  | 'elevation'
  | 'altitude'
  | 'height'
  | 'azimuth'
  | 'water_level'
  | 'depth'
  | 'fuel_level'
  | 'turbidity'
  | 'visibility_in_air'
  | 'mass_concentration'
  | 'timestamp'
  | 'obukhov_length'
  | 'other';

export type MeasurementUnits =
  | 'm/s'
  | 'cm/s'
  | 'mm/s'
  | 'mph'
  | 'knots'
  | 'deg'
  | 'deg_C'
  | 'deg_F'
  | 'K'
  | '%'
  | 'mbar'
  | 'dbar'
  | 'hPa'
  | 'Pa'
  | 'atm'
  | 'mmHg'
  | 'inHg'
  | 'kg/m^2'
  | 'kg/m^3'
  | 'V'
  | 'mV'
  | 'mA'
  | 'A'
  | 'ohm'
  | 'Hz'
  | 'mm'
  | 'm'
  | 's'
  | 'W/m^2'
  | 'W'
  | 'kW'
  | 'MW'
  | 'kWh'
  | 'MWh'
  | 'm/s^2'
  | 'lux'
  | 'dB'
  | 'L'
  | 'g/L'
  | 'ug/L'
  | 'g/kg'
  | 'ppt'
  | 'ppm'
  | 'psu'
  | 'ntu'
  | 'fnu'
  | 'ftu'
  | 'S/m'
  | 'km/h'
  | '(m/s)/V'
  | '(m/s)/mV'
  | '(m/s)/mA'
  | '(m/s)/Hz'
  | '(m/s)/-'
  | '(m/s)/(cm/s)'
  | '(m/s)/(km/h)'
  | '(m/s)/mph'
  | '(m/s)/knots'
  | '(m/s)/(m/s)'
  | 'mbar/V'
  | 'mbar/mV'
  | 'hPa/V'
  | 'hPa/mV'
  | 'deg_C/V'
  | 'deg_C/mV'
  | '%/V'
  | '%/mV'
  | 'm^2/Hz'
  | 'm^2_s'
  | '1'
  | '-'
  | null;

export type HeightReference =
  | 'ground_level'
  | 'mean_sea_level'
  | 'sea_level'
  | 'lowest_astronomical_tide'
  | 'sea_floor'
  | 'other'
  | null;

export type OrientationReference =
  | 'magnetic_north'
  | 'true_north'
  | 'grid_north'
  | null;

export type SensorType =
  | 'anemometer'
  | 'wind_vane'
  | 'thermometer'
  | 'barometer'
  | 'hygrometer'
  | 'thermohygrometer'
  | 'voltmeter'
  | 'ammeter'
  | 'pyranometer'
  | 'pyrheliometer'
  | 'albedometer'
  | '2d_ultrasonic'
  | '3d_ultrasonic'
  | 'vertical_anemometer'
  | 'propeller_anemometer'
  | 'gill_propeller'
  | 'rain_gauge'
  | 'ice_detection_sensor'
  | 'fog_sensor'
  | 'gps'
  | 'illuminance_sensor'
  | 'compass'
  | 'solar_compass'
  | 'wave_buoy'
  | 'inertial_measurement_unit'
  | 'gps_motion_unit'
  | 'adcp'
  | 'altimeter'
  | 'ctd'
  | 'pth'
  | 'lidar'
  | 'sodar'
  | 'fuel_gauge'
  | 'microwave_temperature_profiler'
  | 'nephelometer'
  | 'transmissometer'
  | 'fluorometer'
  | 'calc'
  | 'other'
  | null;

export type MountingType =
  | 'side'
  | 'goal_post'
  | 'top';

export type StatisticType =
  | 'avg'
  | 'sd'
  | 'max'
  | 'min'
  | 'count'
  | 'availability'
  | 'quality'
  | 'sum'
  | 'median'
  | 'mode'
  | 'range'
  | 'gust'
  | 'ti'
  | 'ti30sec'
  | 'text';