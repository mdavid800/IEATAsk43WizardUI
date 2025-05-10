// IEA Task 43 Data Model Schema Types
export interface IEATask43Schema {
  author: string;
  organisation: string;
  date: string;
  version: string;
  plant_name: string;
  plant_type: 'onshore_wind' | 'offshore_wind' | 'solar' | null;
  measurement_location: MeasurementLocation[];
}

export interface MeasurementLocation {
  uuid: string;
  name: string;
  latitude_ddeg: number;
  longitude_ddeg: number;
  measurement_station_type_id: 'mast' | 'lidar' | 'sodar' | 'floating_lidar' | 'wave_buoy' | 'adcp' | 'solar' | 'virtual_met_mast' | 'reanalysis';
  notes?: string;
  update_at: string;
  mast_properties?: MastProperties;
  vertical_profiler_properties?: VerticalProfilerProperty[];
  logger_main_config?: LoggerMainConfig[];
  measurement_point: MeasurementPoint[];
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
  height_m: number;
  height_reference_id: HeightReference;
  notes?: string;
  update_at: string;
  logger_measurement_config: LoggerMeasurementConfig[];
  sensor: Sensor[];
  mounting_arrangement?: MountingArrangement[];
  interference_structures?: InterferenceStructure[];
}

export interface LoggerMeasurementConfig {
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
  offset?: number;
  sensitivity?: number;
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
  | 'relative_humidity'
  | 'voltage'
  | 'current'
  | 'resistance'
  | 'power'
  | 'energy'
  | 'vertical_wind_speed'
  | 'wind_speed_turbulence'
  | 'precipitation'
  | 'salinity'
  | 'conductivity'
  | 'pressure'
  | 'gps_coordinates'
  | 'status'
  | 'flag'
  | 'counter'
  | 'carrier_to_noise_ratio'
  | 'wave_height'
  | 'wave_significant_height'
  | 'wave_maximum_height'
  | 'wave_direction'
  | 'wave_directional_spread'
  | 'wave_period'
  | 'wave_peak_period'
  | 'water_speed'
  | 'vertical_water_speed'
  | 'water_direction'
  | 'orientation'
  | 'compass_direction'
  | 'tilt'
  | 'tilt_x'
  | 'tilt_y'
  | 'tilt_z'
  | 'u'
  | 'v'
  | 'w'
  | 'water_level'
  | 'timestamp'
  | 'other';

export type MeasurementUnits =
  | 'm/s'
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
  | 'atm'
  | 'mmHg'
  | 'kg/m^3'
  | 'V'
  | 'mA'
  | 'ohm'
  | 'Hz'
  | 'mm'
  | 'm'
  | 's'
  | 'W/m^2'
  | 'kW'
  | 'MW'
  | 'm/s^2'
  | 'dB'
  | 'ppt'
  | 'psu'
  | 'S/m'
  | '-';

export type HeightReference =
  | 'ground_level'
  | 'mean_sea_level'
  | 'sea_level'
  | 'lowest_astronomical_tide'
  | 'sea_floor'
  | 'other';

export type OrientationReference =
  | 'magnetic_north'
  | 'true_north'
  | 'grid_north';

export type SensorType =
  | 'anemometer'
  | 'wind_vane'
  | 'barometer'
  | 'hygrometer'
  | 'pyranometer'
  | '2d_ultrasonic'
  | '3d_ultrasonic'
  | 'rain_gauge'
  | 'gps'
  | 'compass'
  | 'adcp'
  | 'altimeter'
  | 'ctd'
  | 'lidar'
  | 'sodar'
  | 'other';

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