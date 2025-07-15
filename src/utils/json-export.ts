import { IEATask43Schema } from '../types/schema';

/**
 * Generate export-ready JSON data by filtering out form-only fields and applying formatting
 * This ensures the preview in ReviewStep matches exactly what gets exported
 */
export const generateExportJson = (data: IEATask43Schema) => {
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

        return cleanedLogger;
    };

    // Exclude campaign dates and status from JSON export (they're for form validation only)
    const { startDate, endDate, campaignStatus, ...exportData } = data;

    const formattedData = {
        ...exportData,
        license: exportData.license || null, // Ensure license field exists
        measurement_location: [{
            ...data.measurement_location[0],
            update_at: new Date().toISOString(),
            logger_main_config: data.measurement_location[0].logger_main_config?.map(logger => cleanOptionalLoggerFields({
                ...logger,
                update_at: new Date().toISOString(),
                date_to: logger.date_to || null,
                clock_is_auto_synced: true
            })),
            measurement_point: data.measurement_location[0].measurement_point.map(point => ({
                ...point,
                update_at: new Date().toISOString(),
                sensor: point.sensor?.map(sensor => ({
                    ...sensor,
                    update_at: new Date().toISOString(),
                    calibration: sensor.calibration?.map(cal => ({
                        ...cal,
                        update_at: new Date().toISOString(),
                        calibration_uncertainty: cal.calibration_uncertainty?.map(unc => ({
                            ...unc
                        }))
                    }))
                })),
                logger_measurement_config: point.logger_measurement_config.map(config => ({
                    ...config,
                    update_at: new Date().toISOString(),
                    column_name: config.column_name.map(col => ({
                        ...col,
                        update_at: new Date().toISOString()
                    }))
                })),
                mounting_arrangement: point.mounting_arrangement?.map(mount => ({
                    ...mount,
                    update_at: new Date().toISOString()
                })),
                interference_structures: point.interference_structures?.map(structure => ({
                    ...structure,
                    update_at: new Date().toISOString()
                }))
            }))
        }]
    };

    return formattedData;
};

/**
 * Download JSON file with the formatted data
 */
export const downloadJsonFile = (data: IEATask43Schema, filename: string = 'iea-task43-data.json') => {
    const formattedData = generateExportJson(data);
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
}; 