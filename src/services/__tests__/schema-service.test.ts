import { schemaService } from '../schema-service';

describe('SchemaService', () => {
    test('loads IEA schema successfully', () => {
        const schema = schemaService.loadSchema();

        expect(schema).toBeDefined();
        expect(schema.title).toBe('IEA Wind Resource Assessment - Data Model');
        expect(schema.$version).toBe('1.4.0-2025.06');
    });

    test('gets required fields for root schema', () => {
        const requiredFields = schemaService.getRequiredFields('');

        expect(requiredFields).toContain('author');
        expect(requiredFields).toContain('organisation');
        expect(requiredFields).toContain('date');
        expect(requiredFields).toContain('version');
        expect(requiredFields).toContain('measurement_location');
    });

    test('gets measurement station types', () => {
        const stationTypes = schemaService.getMeasurementStationTypes();

        expect(stationTypes).toContain('mast');
        expect(stationTypes).toContain('lidar');
        expect(stationTypes).toContain('sodar');
        expect(stationTypes).toContain('reanalysis');
    });

    test('gets measurement types', () => {
        const measurementTypes = schemaService.getMeasurementTypes();

        expect(measurementTypes).toContain('wind_speed');
        expect(measurementTypes).toContain('wind_direction');
        expect(measurementTypes).toContain('air_temperature');
    });

    test('gets schema property by path', () => {
        const authorProperty = schemaService.getSchemaProperty('author');

        expect(authorProperty.type).toBe('string');
        expect(authorProperty.title).toBe('Author');
    });

    test('gets validation rules for field', () => {
        const rules = schemaService.getValidationRules('author');

        expect(rules.required).toBe(true);
        expect(rules.type).toBe('string');
    });

    test('creates default object for measurement location', () => {
        const defaultLocation = schemaService.createDefaultObject('measurement_location.items');

        expect(defaultLocation).toHaveProperty('name');
        expect(defaultLocation).toHaveProperty('latitude_ddeg');
        expect(defaultLocation).toHaveProperty('longitude_ddeg');
        expect(defaultLocation).toHaveProperty('measurement_station_type_id');
        expect(defaultLocation).toHaveProperty('measurement_point');
    });

    test('gets schema version info', () => {
        const info = schemaService.getSchemaInfo();

        expect(info.title).toBe('IEA Wind Resource Assessment - Data Model');
        expect(info.version).toBe('1.4.0-2025.06');
        expect(info.description).toContain('meteorological mast');
    });
});