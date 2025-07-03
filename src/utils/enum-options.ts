import { MeasurementType, MeasurementUnits, SensorType, HeightReference, OrientationReference, StatisticType } from '../types/schema';
import { SearchableSelectOption } from '../components/ui/searchable-select';

// Helper function to format enum values into human-readable labels
function formatLabel(value: string): string {
    return value
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Helper function to add descriptions for common measurement types
function getMeasurementTypeDescription(type: MeasurementType): string | undefined {
    const descriptions: Record<string, string> = {
        'wind_speed': 'Horizontal component of wind speed',
        'wind_direction': 'Direction from which the wind is coming',
        'air_temperature': 'Outdoor ambient temperature of the air',
        'water_temperature': 'In situ temperature of the water',
        'air_pressure': 'Outdoor pressure of the air',
        'relative_humidity': 'Outdoor relative humidity of the air',
        'voltage': 'Electrical voltage, typically logger battery voltage',
        'current': 'Electrical current, typically logger battery current',
        'vertical_wind_speed': 'Vertical component of wind speed',
        'precipitation': 'Water falling from atmosphere (rain, snow, sleet, etc.)',
        'wave_significant_height': 'Average height of the highest one third of waves',
        'wave_maximum_height': 'Greatest trough to crest distance measured',
        'motion_corrected_wind_speed': 'Wind speed corrected for sensor motion (floating systems)',
        'global_horizontal_irradiance': 'Total solar power received by horizontal surface',
        'direct_normal_irradiance': 'Direct solar power perpendicular to sun',
        'pitch': 'Rotation about axis perpendicular to vertical and forward motion',
        'roll': 'Rotation about axis perpendicular to vertical, coplanar with forward motion',
        'heading': 'Rotation about local vertical axis (yaw)',
        'salinity': 'Salt content of water',
        'turbidity': 'Measure of water clarity',
        'echo_intensity': 'Brightness of acoustic echo (ADCP measurement)',
        'carrier_to_noise_ratio': 'Signal strength measure for lidar devices'
    };
    return descriptions[type];
}

// Helper function to add descriptions for measurement units
function getMeasurementUnitsDescription(unit: MeasurementUnits): string | undefined {
    const descriptions: Record<string, string> = {
        'm/s': 'Meters per second',
        'mph': 'Miles per hour',
        'knots': 'Nautical miles per hour',
        'deg': 'Degrees',
        'deg_C': 'Degrees Celsius',
        'deg_F': 'Degrees Fahrenheit',
        '%': 'Percentage',
        'mbar': 'Millibar',
        'hPa': 'Hectopascal',
        'Pa': 'Pascal',
        'V': 'Volts',
        'mV': 'Millivolts',
        'mA': 'Milliamperes',
        'A': 'Amperes',
        'W/m^2': 'Watts per square meter',
        'lux': 'Illuminance unit',
        'ppt': 'Parts per thousand',
        'ppm': 'Parts per million',
        'ntu': 'Nephelometric Turbidity Units',
        '(m/s)/V': 'Meters per second per volt (calibration slope)',
        'mbar/V': 'Millibar per volt (calibration slope)',
        'deg_C/V': 'Degrees Celsius per volt (calibration slope)',
        'm^2/Hz': 'Square meters per hertz (wave energy spectrum)',
        'null': 'No units / dimensionless'
    };
    return descriptions[unit as string];
}

// Helper function to add descriptions for sensor types
function getSensorTypeDescription(type: SensorType): string | undefined {
    const descriptions: Record<string, string> = {
        'anemometer': 'Wind speed measurement device',
        'wind_vane': 'Wind direction measurement device',
        'thermometer': 'Temperature measurement device',
        'barometer': 'Atmospheric pressure measurement device',
        'hygrometer': 'Humidity measurement device',
        'thermohygrometer': 'Combined temperature and humidity sensor',
        'pyranometer': 'Solar irradiance measurement device',
        'pyrheliometer': 'Direct solar irradiance measurement device',
        '2d_ultrasonic': '2D ultrasonic wind sensor',
        '3d_ultrasonic': '3D ultrasonic wind sensor',
        'rain_gauge': 'Precipitation measurement device',
        'gps': 'Global Positioning System device',
        'adcp': 'Acoustic Doppler Current Profiler',
        'lidar': 'Light Detection and Ranging device',
        'sodar': 'Sound Detection and Ranging device',
        'wave_buoy': 'Wave measurement buoy',
        'inertial_measurement_unit': 'Motion and orientation sensor',
        'ice_detection_sensor': 'Sensor for detecting ice formation',
        'fog_sensor': 'Visibility and fog detection sensor',
        'compass': 'Magnetic direction sensor',
        'solar_compass': 'True north direction sensor using sun position',
        'fuel_gauge': 'Fuel level measurement sensor',
        'ctd': 'Conductivity, Temperature, Depth sensor',
        'pth': 'Pressure, Temperature, Humidity sensor'
    };
    return descriptions[type as string];
}

// Generate measurement type options
export const measurementTypeOptions: SearchableSelectOption[] = [
    'wind_speed', 'wind_direction', 'air_temperature', 'water_temperature', 'temperature',
    'air_pressure', 'air_density', 'relative_humidity', 'voltage', 'current', 'resistance',
    'power', 'energy', 'vertical_wind_speed', 'wind_speed_turbulence', 'precipitation',
    'ice_detection', 'global_horizontal_irradiance', 'direct_normal_irradiance',
    'diffuse_horizontal_irradiance', 'global_tilted_irradiance', 'global_normal_irradiance',
    'albedo', 'soiling_loss_index', 'illuminance', 'fog', 'salinity', 'conductivity',
    'pressure', 'gps_coordinates', 'status', 'flag', 'counter', 'availability', 'quality',
    'carrier_to_noise_ratio', 'doppler_spectral_broadening', 'echo_intensity',
    'signal_to_noise_ratio', 'motion_corrected_wind_speed', 'motion_corrected_wind_direction',
    'motion_corrected_vertical_wind_speed', 'wave_height', 'wave_significant_height',
    'wave_maximum_height', 'wave_direction', 'wave_directional_spread', 'wave_period',
    'wave_peak_period', 'wave_period_first_frequency', 'wave_period_second_frequency',
    'wave_period_zero_crossing', 'wave_energy_spectrum', 'wave_energy_spectrum_maximum',
    'water_speed', 'vertical_water_speed', 'water_direction', 'orientation',
    'compass_direction', 'true_north_offset', 'tilt', 'tilt_x', 'tilt_y', 'tilt_z',
    'pitch', 'roll', 'heading', 'u', 'v', 'w', 'elevation', 'altitude', 'height',
    'azimuth', 'water_level', 'depth', 'fuel_level', 'turbidity', 'visibility_in_air',
    'mass_concentration', 'timestamp', 'obukhov_length', 'other'
].map(type => ({
    value: type,
    label: formatLabel(type),
    description: getMeasurementTypeDescription(type as MeasurementType)
}));

// Generate measurement units options
export const measurementUnitsOptions: SearchableSelectOption[] = [
    'm/s', 'cm/s', 'mm/s', 'mph', 'knots', 'deg', 'deg_C', 'deg_F', 'K', '%',
    'mbar', 'dbar', 'hPa', 'Pa', 'atm', 'mmHg', 'inHg', 'kg/m^2', 'kg/m^3',
    'V', 'mV', 'mA', 'A', 'ohm', 'Hz', 'mm', 'm', 's', 'W/m^2', 'W', 'kW',
    'MW', 'kWh', 'MWh', 'm/s^2', 'lux', 'dB', 'L', 'g/L', 'ug/L', 'g/kg',
    'ppt', 'ppm', 'psu', 'ntu', 'fnu', 'ftu', 'S/m', 'km/h', '(m/s)/V',
    '(m/s)/mV', '(m/s)/mA', '(m/s)/Hz', '(m/s)/-', '(m/s)/(cm/s)',
    '(m/s)/(km/h)', '(m/s)/mph', '(m/s)/knots', '(m/s)/(m/s)', 'mbar/V',
    'mbar/mV', 'hPa/V', 'hPa/mV', 'deg_C/V', 'deg_C/mV', '%/V', '%/mV',
    'm^2/Hz', 'm^2_s', '1', '-', 'null'
].map(unit => ({
    value: unit,
    label: unit === 'null' ? 'No units' : unit,
    description: getMeasurementUnitsDescription(unit as MeasurementUnits)
}));

// Generate sensor type options
export const sensorTypeOptions: SearchableSelectOption[] = [
    'anemometer', 'wind_vane', 'thermometer', 'barometer', 'hygrometer',
    'thermohygrometer', 'voltmeter', 'ammeter', 'pyranometer', 'pyrheliometer',
    'albedometer', '2d_ultrasonic', '3d_ultrasonic', 'vertical_anemometer',
    'propeller_anemometer', 'gill_propeller', 'rain_gauge', 'ice_detection_sensor',
    'fog_sensor', 'gps', 'illuminance_sensor', 'compass', 'solar_compass',
    'wave_buoy', 'inertial_measurement_unit', 'gps_motion_unit', 'adcp',
    'altimeter', 'ctd', 'pth', 'lidar', 'sodar', 'fuel_gauge',
    'microwave_temperature_profiler', 'nephelometer', 'transmissometer',
    'fluorometer', 'calc', 'other', 'null'
].map(type => ({
    value: type,
    label: type === 'null' ? 'Not specified' : formatLabel(type),
    description: getSensorTypeDescription(type as SensorType)
}));

// Generate height reference options
export const heightReferenceOptions: SearchableSelectOption[] = [
    'ground_level', 'mean_sea_level', 'sea_level', 'lowest_astronomical_tide',
    'sea_floor', 'other', 'null'
].map(ref => ({
    value: ref,
    label: ref === 'null' ? 'Not specified' : formatLabel(ref),
    description: ref === 'ground_level' ? 'Height above ground level' :
        ref === 'mean_sea_level' ? 'Height above mean sea level' :
            ref === 'sea_level' ? 'Height above sea level' :
                ref === 'lowest_astronomical_tide' ? 'Height above lowest astronomical tide' :
                    ref === 'sea_floor' ? 'Height above sea floor' : undefined
}));

// Generate orientation reference options
export const orientationReferenceOptions: SearchableSelectOption[] = [
    'magnetic_north', 'true_north', 'grid_north'
].map(ref => ({
    value: ref,
    label: formatLabel(ref),
    description: ref === 'magnetic_north' ? 'Referenced to magnetic north' :
        ref === 'true_north' ? 'Referenced to true north' :
            ref === 'grid_north' ? 'Referenced to grid north' : undefined
}));

// Generate statistic type options
export const statisticTypeOptions: SearchableSelectOption[] = [
    'avg', 'sd', 'max', 'min', 'count', 'availability', 'quality', 'sum',
    'median', 'mode', 'range', 'gust', 'ti', 'ti30sec', 'text'
].map(stat => ({
    value: stat,
    label: stat === 'avg' ? 'Average' :
        stat === 'sd' ? 'Standard Deviation' :
            stat === 'max' ? 'Maximum' :
                stat === 'min' ? 'Minimum' :
                    stat === 'ti' ? 'Turbulence Intensity' :
                        stat === 'ti30sec' ? 'Turbulence Intensity (30s)' :
                            formatLabel(stat),
    description: stat === 'ti30sec' ? '10 min average of turbulence intensity calculated every 30 seconds' :
        stat === 'availability' ? 'Data availability percentage' :
            stat === 'gust' ? 'Maximum wind speed in period' : undefined
})); 