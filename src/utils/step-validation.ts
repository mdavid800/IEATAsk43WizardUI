import { IEATask43Schema } from '../types/schema';
import { validateFormOnlyFields } from './form-validation';

/**
 * Shared validation functions for form steps to ensure consistency with ReviewStep
 */

/**
 * Validate Basic Information step
 */
export const validateBasicInfo = (formData: IEATask43Schema) => {
    const issues: string[] = [];

    // Validate required IEA fields
    if (!formData.author) issues.push('Author is required');
    if (!formData.organisation) issues.push('Organisation is required');
    if (!formData.plant_type) issues.push('Plant type is required');
    if (!formData.version) issues.push('Version is required');
    if (!formData.date) issues.push('Date is required');

    // Validate form-only fields using dedicated utility
    const formValidation = validateFormOnlyFields(formData);
    if (!formValidation.valid) {
        issues.push(...formValidation.issues);
    }

    return {
        valid: issues.length === 0,
        issues
    };
};

/**
 * Validate Location step
 */
export const validateLocations = (formData: IEATask43Schema) => {
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

    return {
        valid: issues.length === 0,
        issues
    };
};

/**
 * Validate Loggers step
 */
export const validateLoggers = (formData: IEATask43Schema) => {
    const issues: string[] = [];

    if (!formData.measurement_location?.length) {
        issues.push('At least one measurement location is required');
        return { valid: false, issues };
    }

    let hasLoggers = false;
    formData.measurement_location.forEach((location, locIndex) => {
        if (location.logger_main_config && location.logger_main_config.length > 0) {
            hasLoggers = true;
            location.logger_main_config.forEach((logger, loggerIndex) => {
                if (!logger.logger_model_name) {
                    issues.push(`Location ${locIndex + 1}, Logger ${loggerIndex + 1}: Model Name is required`);
                }
                if (!logger.logger_serial_number) {
                    issues.push(`Location ${locIndex + 1}, Logger ${loggerIndex + 1}: Serial Number is required`);
                }
                if (!logger.date_from) {
                    issues.push(`Location ${locIndex + 1}, Logger ${loggerIndex + 1}: Date From is required`);
                }
                if (!logger.logger_oem_id) {
                    issues.push(`Location ${locIndex + 1}, Logger ${loggerIndex + 1}: Logger OEM is required`);
                }
            });
        }
    });

    if (!hasLoggers) {
        issues.push('At least one logger is required');
    }

    return {
        valid: issues.length === 0,
        issues
    };
};

/**
 * Validate Sensors step
 */
export const validateSensors = (formData: IEATask43Schema) => {
    const issues: string[] = [];

    formData.measurement_location?.forEach((location, locIndex) => {
        // Check for sensors in measurement points (correct schema structure)
        const hasSensorsInPoints = location.measurement_point?.some(point =>
            Array.isArray(point.sensor) && point.sensor.filter(Boolean).length > 0
        );

        // Also check for sensors at location level (legacy structure)
        const hasSensorsAtLocation = Array.isArray((location as any).sensors) &&
            (location as any).sensors.filter(Boolean).length > 0;

        if (!hasSensorsInPoints && !hasSensorsAtLocation) {
            issues.push(`Location ${locIndex + 1}: At least one sensor is required`);
            return;
        }

        // Validate sensors in measurement points (correct schema structure)
        location.measurement_point?.forEach((point, pointIndex) => {
            if (Array.isArray(point.sensor)) {
                point.sensor.forEach((sensor, sensorIndex) => {
                    if (!sensor) return;

                    if (!sensor.oem) {
                        issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}, Sensor ${sensorIndex + 1}: OEM is required`);
                    }
                    if (!sensor.model) {
                        issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}, Sensor ${sensorIndex + 1}: Model is required`);
                    }
                    if (!sensor.serial_number) {
                        issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}, Sensor ${sensorIndex + 1}: Serial Number is required`);
                    }
                    if (!sensor.sensor_type_id) {
                        issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}, Sensor ${sensorIndex + 1}: Sensor Type is required`);
                    }
                    if (!sensor.date_from) {
                        issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}, Sensor ${sensorIndex + 1}: Date From is required`);
                    }
                });
            }
        });

        // Also validate sensors at location level (legacy structure)
        if (Array.isArray((location as any).sensors)) {
            (location as any).sensors.forEach((sensor: any, sensorIndex: number) => {
                if (!sensor) return;

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
            });
        }
    });

    return {
        valid: issues.length === 0,
        issues
    };
};

/**
 * Validate Measurements step
 */
export const validateMeasurements = (formData: IEATask43Schema) => {
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
            if (typeof point.height_m !== 'number' && point.height_m !== null) {
                issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}: Height is required`);
            }
            if (!point.height_reference_id) {
                issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}: Height reference is required`);
            }
            if (!Array.isArray(point.logger_measurement_config) || point.logger_measurement_config.length === 0) {
                issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}: Logger measurement config is required`);
            } else {
                point.logger_measurement_config.forEach((config, configIndex) => {
                    if (!config.date_from) {
                        issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}, Config ${configIndex + 1}: Date from is required`);
                    }
                    if (!Array.isArray(config.column_name) || config.column_name.length === 0) {
                        issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}, Config ${configIndex + 1}: Column name is required`);
                    }
                });
            }
        });
    });

    return {
        valid: issues.length === 0,
        issues
    };
};

/**
 * Check if all sections are valid for the Review step
 */
export const validateAllSections = (formData: IEATask43Schema) => {
    const basicInfoValidation = validateBasicInfo(formData);
    const locationsValidation = validateLocations(formData);
    const loggersValidation = validateLoggers(formData);
    const sensorsValidation = validateSensors(formData);
    const measurementsValidation = validateMeasurements(formData);

    const sections = [
        { name: 'Basic Information', valid: basicInfoValidation.valid },
        { name: 'Locations', valid: locationsValidation.valid },
        { name: 'Loggers', valid: loggersValidation.valid },
        { name: 'Sensors', valid: sensorsValidation.valid },
        { name: 'Measurements', valid: measurementsValidation.valid }
    ];

    return {
        sections,
        isValid: sections.every(section => section.valid),
        completedSections: sections.filter(section => section.valid).length
    };
};