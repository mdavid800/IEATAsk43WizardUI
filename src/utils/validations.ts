import type { IEATask43Schema, Sensor } from '../types/schema';

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

export function validateBasicInfo(formData: IEATask43Schema): ValidationResult {
  const { author, organisation, plant_name, plant_type, version, startDate, campaignStatus, endDate } = formData;
  const issues: string[] = [];
  if (!author) issues.push('Author is required');
  if (!organisation) issues.push('Organisation is required');
  if (!plant_name) issues.push('Plant name is required');
  if (!plant_type) issues.push('Plant type is required');
  if (!version) issues.push('Version is required');
  if (!startDate) issues.push('Start date is required');
  if (campaignStatus === 'historical' && !endDate) issues.push('End date is required');
  return { valid: issues.length === 0, issues };
}

export function validateLocations(formData: IEATask43Schema): ValidationResult {
  const issues: string[] = [];
  if (!formData.measurement_location?.length) {
    issues.push('At least one measurement location is required');
    return { valid: false, issues };
  }
  formData.measurement_location.forEach((location, index) => {
    if (!location.name) issues.push(`Location ${index + 1}: Name is required`);
    if (!location.latitude_ddeg) issues.push(`Location ${index + 1}: Latitude is required`);
    if (!location.longitude_ddeg) issues.push(`Location ${index + 1}: Longitude is required`);
    if (!location.measurement_station_type_id) issues.push(`Location ${index + 1}: Station Type is required`);
  });
  return { valid: issues.length === 0, issues };
}

export function validateLoggers(formData: IEATask43Schema): ValidationResult {
  const issues: string[] = [];
  formData.measurement_location?.forEach((location, locIndex) => {
    if (!location.logger_main_config?.length) {
      issues.push(`Location ${locIndex + 1}: At least one logger is required`);
      return;
    }
    location.logger_main_config.forEach((logger, logIndex) => {
      if (!logger.logger_oem_id) {
        issues.push(`Location ${locIndex + 1}, Logger ${logIndex + 1}: Logger Manufacturer is required`);
      }
      if (!logger.logger_model_name) {
        issues.push(`Location ${locIndex + 1}, Logger ${logIndex + 1}: Model Name is required`);
      }
      if (!logger.logger_serial_number) {
        issues.push(`Location ${locIndex + 1}, Logger ${logIndex + 1}: Serial number is required`);
      }
      if (!logger.date_from) {
        issues.push(`Location ${locIndex + 1}, Logger ${logIndex + 1}: Date From is required`);
      }
      if (!logger.date_to) {
        issues.push(`Location ${locIndex + 1}, Logger ${logIndex + 1}: Date To is required`);
      }
    });
  });
  return { valid: issues.length === 0, issues };
}

export function validateMeasurements(formData: IEATask43Schema): ValidationResult {
  const issues: string[] = [];
  formData.measurement_location?.forEach((location, locIndex) => {
    if (!location.measurement_point?.length) {
      issues.push(`Location ${locIndex + 1}: At least one measurement point is required`);
      return;
    }
    location.measurement_point.forEach((point, pointIndex) => {
      if (!point.name) {
        issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}: Name is required`);
      }
      if (!point.measurement_type_id) {
        issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}: Measurement type is required`);
      }
    });
  });
  return { valid: issues.length === 0, issues };
}

export function validateSensors(formData: IEATask43Schema): ValidationResult {
  const issues: string[] = [];
  formData.measurement_location?.forEach((location, locIndex) => {
    const validSensors = Array.isArray(location.sensors) ? location.sensors.filter(Boolean) : [];
    if (validSensors.length === 0) {
      issues.push(`Location ${locIndex + 1}: At least one sensor is required`);
      return;
    }
    validSensors.forEach((sensor: Sensor, sensorIndex: number) => {
      if (!sensor.oem) {
        issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: OEM is required`);
      }
      if (!sensor.model) {
        issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: Model is required`);
      }
      if (!sensor.serial_number) {
        issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: Serial Number is required`);
      }
      if (!sensor.sensor_type_id) {
        issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: Sensor Type is required`);
      }
      if (!sensor.date_from) {
        issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: Date From is required`);
      }
      if (!sensor.date_to) {
        issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: Date To is required`);
      }
    });
  });
  return { valid: issues.length === 0, issues };
}
