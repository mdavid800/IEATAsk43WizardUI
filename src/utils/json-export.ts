import { IEATask43Schema } from '../types/schema';

/**
 * Generate export-ready JSON data by filtering out form-only fields and applying formatting
 * This ensures the preview in ReviewStep matches exactly what gets exported
 */
export const generateExportJson = (data: IEATask43Schema) => {
    // Helper function to format dates to ISO 8601 with 'T' separator
    const formatDateToISO = (dateString: string | null | undefined): string | null => {
        if (!dateString) return null;

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;

            // Ensure ISO 8601 format with 'T' separator
            return date.toISOString();
        } catch (error) {
            console.warn('Invalid date format:', dateString);
            return null;
        }
    };

    // Helper function to clean optional vertical profiler properties
    const cleanVerticalProfilerProperties = (props: any[]) => {
        if (!props || props.length === 0) return null;
        
        return props.map(prop => {
            const cleanedProp: any = {};
            
            // Only include fields that have meaningful values
            if (typeof prop.device_datum_plane_height_m === 'number') {
                cleanedProp.device_datum_plane_height_m = prop.device_datum_plane_height_m;
            }
            if (prop.height_reference_id) {
                cleanedProp.height_reference_id = prop.height_reference_id;
            }
            if (typeof prop.device_orientation_deg === 'number') {
                cleanedProp.device_orientation_deg = prop.device_orientation_deg;
            }
            if (prop.orientation_reference_id) {
                cleanedProp.orientation_reference_id = prop.orientation_reference_id;
            }
            if (prop.device_vertical_orientation) {
                cleanedProp.device_vertical_orientation = prop.device_vertical_orientation;
            }
            if (prop.date_from) {
                cleanedProp.date_from = formatDateToISO(prop.date_from);
            }
            if (prop.date_to) {
                cleanedProp.date_to = formatDateToISO(prop.date_to);
            }
            if (prop.notes && prop.notes.trim() !== '') {
                cleanedProp.notes = prop.notes;
            }
            
            // Always set update_at if any field has a value, otherwise omit the entire property
            if (Object.keys(cleanedProp).length > 0) {
                cleanedProp.update_at = new Date().toISOString();
                return cleanedProp;
            }
            
            return null;
        }).filter(Boolean); // Remove null entries
    };

    // Helper function to clean optional logger fields
    const cleanOptionalLoggerFields = (logger: any) => {
        const optionalFields = [
            'encryption_pin_or_key',
            'enclosure_lock_details',
            'offset_from_utc_hrs',
            'sampling_rate_sec',
            'averaging_period_minutes',
            'timestamp_is_end_of_period',
            'clock_is_auto_synced',
            'logger_acquisition_uncertainty',
            'uncertainty_k_factor'
        ];

        const cleanedLogger = { ...logger };

        optionalFields.forEach(field => {
            const value = cleanedLogger[field];
            // Remove field if it's undefined, null, empty string, or NaN
            if (value === undefined || value === null || value === '' ||
                (typeof value === 'number' && isNaN(value))) {
                delete cleanedLogger[field];
            }
        });

        // Format date fields
        if (cleanedLogger.date_from) {
            cleanedLogger.date_from = formatDateToISO(cleanedLogger.date_from);
        }
        if (cleanedLogger.date_to !== undefined) {
            cleanedLogger.date_to = formatDateToISO(cleanedLogger.date_to);
        }

        return cleanedLogger;
    };

    // Exclude campaign dates and status from JSON export (they're for form validation only)
    const { startDate, endDate, campaignStatus, ...exportData } = data;

    // Process each location to restructure sensors
    const formattedLocations = data.measurement_location.map(location => {
        // Create a copy of the location without the sensors field (if it exists)
        // Use spread to create a new object without modifying the original
        const locationWithoutSensors = { ...location };

        // Delete the sensors property if it exists - sensors should be at measurement point level
        if ('sensors' in locationWithoutSensors) {
            delete (locationWithoutSensors as any).sensors;
        }
        
        // Remove ALL optional properties first, then add back only the appropriate ones based on device type
        delete (locationWithoutSensors as any).mast_properties;
        delete (locationWithoutSensors as any).vertical_profiler_properties;

        // Process measurement points - only use sensors specifically selected for each point
        const updatedMeasurementPoints = location.measurement_point.map(point => {
            // Only use sensors that were specifically selected for this measurement point
            // These are the sensors selected in the measurement point table UI
            const pointSensors = [...(point.sensor || [])];

            // Remove form-only fields from measurement point
            const { statistic_type_id, unit, ...cleanPoint } = point;

            return {
                ...cleanPoint,
                update_at: new Date().toISOString(),
                sensor: pointSensors.map(sensor => {
                    // Only include fields that are allowed by the official IEA schema
                    const compliantSensor: any = {
                        date_from: formatDateToISO(sensor.date_from),
                        date_to: formatDateToISO(sensor.date_to),
                        update_at: new Date().toISOString()
                    };

                    // Add optional fields only if they have values
                    if (sensor.oem) compliantSensor.oem = sensor.oem;
                    if (sensor.model) compliantSensor.model = sensor.model;
                    if (sensor.serial_number) compliantSensor.serial_number = sensor.serial_number;
                    if (sensor.sensor_type_id) compliantSensor.sensor_type_id = sensor.sensor_type_id;

                    // Only include classification if it matches the required pattern: ^([0-9]{1,2})[.]([0-9]{1,2})[ABCDS]$
                    if (sensor.classification && /^([0-9]{1,2})[.]([0-9]{1,2})[ABCDS]$/.test(sensor.classification)) {
                        compliantSensor.classification = sensor.classification;
                    }

                    if (typeof sensor.instrument_poi_height_mm === 'number') compliantSensor.instrument_poi_height_mm = sensor.instrument_poi_height_mm;
                    if (typeof sensor.is_heated === 'boolean') compliantSensor.is_heated = sensor.is_heated;
                    if (typeof sensor.sensor_body_size_mm === 'number') compliantSensor.sensor_body_size_mm = sensor.sensor_body_size_mm;
                    if (sensor.notes) compliantSensor.notes = sensor.notes;

                    // Handle calibration array
                    if (sensor.calibration && sensor.calibration.length > 0) {
                        compliantSensor.calibration = sensor.calibration.map(cal => ({
                            ...cal,
                            date_of_calibration: formatDateToISO(cal.date_of_calibration),
                            update_at: new Date().toISOString(),
                            calibration_uncertainty: cal.calibration_uncertainty?.map(unc => ({
                                ...unc
                            }))
                        }));
                    }

                    return compliantSensor;
                }),
                logger_measurement_config: point.logger_measurement_config.map(config => {
                    // Only include fields that are allowed by the official IEA schema
                    const compliantConfig: any = {
                        date_from: formatDateToISO(config.date_from),
                        date_to: formatDateToISO(config.date_to),
                        update_at: new Date().toISOString(),
                        column_name: config.column_name.map(col => ({
                            column_name: col.column_name,
                            statistic_type_id: col.statistic_type_id,
                            is_ignored: col.is_ignored || false,
                            notes: col.notes || null,
                            update_at: new Date().toISOString()
                        }))
                    };

                    // Add optional fields only if they have values
                    if (typeof config.slope === 'number') compliantConfig.slope = config.slope;
                    if (typeof config.offset === 'number') compliantConfig.offset = config.offset;
                    if (typeof config.sensitivity === 'number') compliantConfig.sensitivity = config.sensitivity;
                    if (config.measurement_units_id) compliantConfig.measurement_units_id = config.measurement_units_id;
                    if (typeof config.height_m === 'number') compliantConfig.height_m = config.height_m;
                    if (config.serial_number) compliantConfig.serial_number = config.serial_number;
                    if (config.connection_channel) compliantConfig.connection_channel = config.connection_channel;
                    if (typeof config.logger_stated_boom_orientation_deg === 'number') compliantConfig.logger_stated_boom_orientation_deg = config.logger_stated_boom_orientation_deg;
                    if (config.notes) compliantConfig.notes = config.notes;

                    return compliantConfig;
                }),
                mounting_arrangement: point.mounting_arrangement?.map(mount => ({
                    ...mount,
                    date_from: formatDateToISO(mount.date_from),
                    date_to: formatDateToISO(mount.date_to),
                    update_at: new Date().toISOString()
                })),
                interference_structures: point.interference_structures?.map(structure => ({
                    ...structure,
                    date_from: formatDateToISO(structure.date_from),
                    date_to: formatDateToISO(structure.date_to),
                    update_at: new Date().toISOString()
                }))
            };
        });

        // Build the location object with conditional properties based on station type
        const locationData: any = {
            ...locationWithoutSensors,
            update_at: new Date().toISOString(),
            logger_main_config: location.logger_main_config?.map(logger => cleanOptionalLoggerFields({
                ...logger,
                update_at: new Date().toISOString(),
                date_to: logger.date_to || null,
                clock_is_auto_synced: true
            })),
            measurement_point: updatedMeasurementPoints
        };

        // Only include mast_properties for mast devices
        if (location.measurement_station_type_id === 'mast' && location.mast_properties) {
            locationData.mast_properties = {
                ...location.mast_properties,
                date_from: formatDateToISO(location.mast_properties.date_from),
                date_to: formatDateToISO(location.mast_properties.date_to),
                update_at: new Date().toISOString()
            };
        }

        // Only include vertical_profiler_properties for devices that use vertical profiling
        const verticalProfilingDevices = ['lidar', 'sodar', 'floating_lidar'];
        if (verticalProfilingDevices.includes(location.measurement_station_type_id)) {
            locationData.vertical_profiler_properties = cleanVerticalProfilerProperties(location.vertical_profiler_properties);
        }

        return locationData;
    });

    const formattedData = {
        ...exportData,
        license: exportData.license || null, // Ensure license field exists
        measurement_location: formattedLocations
    };

    return formattedData;
};

/**
 * Download JSON file with the formatted data
 * Returns validation results if validation fails, or null if successful
 */
export const downloadJsonFile = async (
    data: IEATask43Schema,
    filename: string = 'iea-task43-data.json',
    validateBeforeExport: boolean = true
): Promise<{ requiredFieldsValidation: any; schemaValidation: any } | null> => {
    // Generate export data
    const formattedData = generateExportJson(data);

    // Validate data before export if requested
    if (validateBeforeExport) {
        // Import validation functions
        const { validateIEACompliance, validateRequiredFields } = await import('./schema-validation');

        // Run validations
        const requiredFieldsValidation = validateRequiredFields(formattedData);
        const schemaValidation = validateIEACompliance(formattedData);

        // Check if validation failed
        if (!requiredFieldsValidation.isValid || !schemaValidation.isValid) {
            // Return validation results without exporting
            return { requiredFieldsValidation, schemaValidation };
        }
    }

    // If validation passed or was skipped, proceed with export
    const jsonString = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Return null to indicate success
    return null;
}; 