import { schemaValidator } from '../schema-validator';

describe('SchemaValidator', () => {
    const validData = {
        author: 'Test Author',
        organisation: 'Test Organisation',
        date: '2025-01-22',
        version: '1.4.0-2025.06',
        measurement_location: [
            {
                name: 'Test Location',
                latitude_ddeg: 52.973,
                longitude_ddeg: -9.431,
                measurement_station_type_id: 'mast',
                measurement_point: [
                    {
                        name: 'Test Point',
                        measurement_type_id: 'wind_speed',
                        height_m: 80,
                        logger_measurement_config: [
                            {
                                column_name: [
                                    {
                                        column_name: 'WS_80m_Avg',
                                        statistic_type_id: 'avg'
                                    }
                                ],
                                date_from: '2020-01-01T00:00:00',
                                date_to: '2021-01-01T00:00:00'
                            }
                        ],
                        sensor: []
                    }
                ]
            }
        ]
    };

    test('validates correct data successfully', () => {
        const result = schemaValidator.validate(validData);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('detects missing required fields', () => {
        const invalidData = {
            author: 'Test Author'
            // Missing other required fields
        };

        const result = schemaValidator.validate(invalidData);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.message.includes('organisation'))).toBe(true);
    });

    test('validates field with correct value', () => {
        const result = schemaValidator.validateField('author', 'Test Author');

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.value).toBe('Test Author');
    });

    test('validates field with invalid enum value', () => {
        const result = schemaValidator.validateField('plant_type', 'invalid_type');

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].schemaRule).toBe('enum');
        expect(result.errors[0].allowedValues).toContain('onshore_wind');
    });

    test('validates numeric field with range constraints', () => {
        const result = schemaValidator.validateField('measurement_location.items.properties.latitude_ddeg', 100);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain('90');
    });

    test('validates for export readiness', () => {
        const result = schemaValidator.validateForExport(validData);

        expect(result.canExport).toBe(true);
        expect(result.blockingErrors).toHaveLength(0);
        expect(result.cleanedData).toBeDefined();
    });

    test('blocks export with validation errors', () => {
        const invalidData = { author: 'Test' }; // Missing required fields

        const result = schemaValidator.validateForExport(invalidData);

        expect(result.canExport).toBe(false);
        expect(result.blockingErrors.length).toBeGreaterThan(0);
        expect(result.cleanedData).toBeUndefined();
    });

    test('provides helpful error messages', () => {
        const result = schemaValidator.validateField('measurement_location.items.properties.measurement_station_type_id', 'invalid');

        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain('Must be one of');
        expect(result.errors[0].suggestedFix).toContain('mast');
    });
});