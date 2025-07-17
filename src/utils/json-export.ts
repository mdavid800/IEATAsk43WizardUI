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
        // Extract location-level sensors (if any) - sensors should now be at measurement_point level
        // This is for backward compatibility in case old data still has sensors at location level
        const locationData = location as any;
        const locationSensors = locationData.sensors || [];

        // Create a copy of the location without the sensors field (if it exists)
        // Use spread to create a new object without modifying the original
        const locationWithoutSensors = { ...location };

        // Delete the sensors property if it exists
        if ('sensors' in locationWithoutSensors) {
            delete (locationWithoutSensors as any).sensors;
        }

        // Process measurement points and distribute sensors
        const updatedMeasurementPoints = location.measurement_point.map(point => {
            // Start with existing point sensors
            const pointSensors = [...(point.sensor || [])];

            // Add location sensors to the first measurement point
            // In a real implementation, you would need logic to determine which measurement point
            // each sensor belongs to based on measurement type, height, etc.
            if (locationSensors.length > 0) {
                pointSensors.push(...locationSensors);
            }

            return {
                ...point,
                update_at: new Date().toISOString(),
                sensor: pointSensors.map(sensor => ({
                    ...sensor,
                    date_from: formatDateToISO(sensor.date_from),
                    date_to: formatDateToISO(sensor.date_to),
                    update_at: new Date().toISOString(),
                    calibration: sensor.calibration?.map(cal => ({
                        ...cal,
                        date_of_calibration: formatDateToISO(cal.date_of_calibration),
                        update_at: new Date().toISOString(),
                        calibration_uncertainty: cal.calibration_uncertainty?.map(unc => ({
                            ...unc
                        }))
                    }))
                })),
                logger_measurement_config: point.logger_measurement_config.map(config => ({
                    ...config,
                    date_from: formatDateToISO(config.date_from),
                    date_to: formatDateToISO(config.date_to),
                    update_at: new Date().toISOString(),
                    column_name: config.column_name.map(col => ({
                        ...col,
                        update_at: new Date().toISOString()
                    }))
                })),
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

        return {
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
export const downloadJsonFile = (
    data: IEATask43Schema,
    filename: string = 'iea-task43-data.json',
    validateBeforeExport: boolean = true
): { requiredFieldsValidation: any; schemaValidation: any } | null => {
    // Generate export data
    const formattedData = generateExportJson(data);

    // Validate data before export if requested
    if (validateBeforeExport) {
        // Import validation functions
        const { validateIEACompliance, validateRequiredFields } = require('./schema-validation');

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