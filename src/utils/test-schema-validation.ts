// Test utility to verify schema validation is working
import { schemaValidator, validateIEACompliance } from './schema-validation';
import { generateExportJson } from './json-export';

export function testSchemaValidation() {
    console.log('Testing IEA Schema Validation Service...');

    // Test 1: Valid minimal data
    const validData = {
        author: "Test Author",
        organisation: "Test Organization",
        date: "2024-01-01",
        version: "1.0.0-2024.01",
        measurement_location: []
    };

    const validResult = validateIEACompliance(validData);
    console.log('Test 1 - Valid data:', validResult.isValid ? 'PASS' : 'FAIL');
    if (!validResult.isValid) {
        console.log('Errors:', validResult.errors);
    }

    // Test 2: Invalid data (missing required fields)
    const invalidData = {
        author: "Test Author"
        // Missing required fields
    };

    const invalidResult = validateIEACompliance(invalidData);
    console.log('Test 2 - Invalid data:', !invalidResult.isValid ? 'PASS' : 'FAIL');
    if (!invalidResult.isValid) {
        console.log('Expected errors found:', invalidResult.errors.length, 'errors');
    }

    // Test 3: Date format validation
    const dateFormatTest = schemaValidator.validateDateTimeFormat("2024-01-01T00:00:00");
    console.log('Test 3 - Date format validation:', dateFormatTest ? 'PASS' : 'FAIL');

    // Test 4: UUID format validation
    const uuidTest = schemaValidator.validateUUIDFormat("123e4567-e89b-12d3-a456-426614174000");
    console.log('Test 4 - UUID format validation:', uuidTest ? 'PASS' : 'FAIL');

    console.log('Schema validation tests completed.');

    // Test 5: Sensor distribution fix - ensure only selected sensors are exported
    const sensorDistributionTest = testSensorDistribution();
    console.log('Test 5 - Sensor distribution fix:', sensorDistributionTest ? 'PASS' : 'FAIL');

    // Test 6: Conditional device properties - ensure properties are included based on device type
    const devicePropertiesTest = testConditionalDeviceProperties();
    console.log('Test 6 - Conditional device properties:', devicePropertiesTest ? 'PASS' : 'FAIL');

    return {
        validDataTest: validResult.isValid,
        invalidDataTest: !invalidResult.isValid,
        dateFormatTest,
        uuidTest,
        sensorDistributionTest,
        devicePropertiesTest
    };
}

function testSensorDistribution(): boolean {
    console.log('Testing sensor distribution in JSON export...');
    
    const mockData: any = {
        author: 'Test Author',
        organisation: 'Test Org',
        date: '2024-01-01',
        version: '1.3.0-2024.03',
        plant_name: 'Test Plant',
        plant_type: 'onshore_wind',
        measurement_location: [{
            uuid: 'loc-1',
            name: 'Test Location',
            latitude_ddeg: 40.0,
            longitude_ddeg: -100.0,
            measurement_station_type_id: 'mast',
            update_at: '2023-07-30T13:53:01.000Z',
            
            // Location has multiple sensors
            sensors: [
                {
                    oem: 'Sensor1OEM',
                    model: 'z300',
                    serial_number: '1234',
                    sensor_type_id: 'lidar',
                    date_from: '2023-07-30T13:53:01.000Z',
                    date_to: '2023-07-30T13:53:01.000Z'
                },
                {
                    oem: 'Sensor2OEM',
                    model: 'z300',
                    serial_number: '1235',
                    sensor_type_id: 'lidar',
                    date_from: '2023-07-30T13:53:01.000Z',
                    date_to: '2023-07-30T13:53:01.000Z'
                }
            ],
            
            measurement_point: [{
                name: 'Test Point',
                measurement_type_id: 'wind_speed',
                height_m: 40,
                height_reference_id: 'ground_level',
                update_at: '2023-07-30T13:53:01.000Z',
                logger_measurement_config: [{
                    logger_id: 'logger1',
                    date_from: '2023-07-30T13:53:01.000Z',
                    date_to: '2023-07-30T13:53:01.000Z',
                    update_at: '2023-07-30T13:53:01.000Z',
                    column_name: [{
                        column_name: 'Test Column',
                        statistic_type_id: 'avg',
                        is_ignored: false,
                        update_at: '2023-07-30T13:53:01.000Z'
                    }]
                }],
                
                // This measurement point should ONLY have one specific sensor
                sensor: [{
                    oem: 'Sensor1OEM',
                    model: 'z300',
                    serial_number: '1234',
                    sensor_type_id: 'lidar',
                    date_from: '2023-07-30T13:53:01.000Z',
                    date_to: '2023-07-30T13:53:01.000Z'
                }]
            }]
        }]
    };
    
    try {
        const exportedData = generateExportJson(mockData);
        const exportedMeasurementPoint = exportedData.measurement_location[0].measurement_point[0];
        const exportedSensorSerials = exportedMeasurementPoint.sensor.map((s: any) => s.serial_number);
        
        // Should only contain the sensor that was selected for this measurement point
        const expectedSensorSerials = ['1234'];
        const isCorrect = JSON.stringify(expectedSensorSerials.sort()) === JSON.stringify(exportedSensorSerials.sort()) &&
                         exportedSensorSerials.length === 1;
        
        if (isCorrect) {
            console.log('✅ Sensor distribution test passed: measurement point contains only selected sensors');
        } else {
            console.log('❌ Sensor distribution test failed:');
            console.log('  Expected sensors:', expectedSensorSerials);
            console.log('  Actual sensors:', exportedSensorSerials);
        }
        
        return isCorrect;
    } catch (error) {
        console.log('❌ Sensor distribution test failed with error:', error);
        return false;
    }
}

function testConditionalDeviceProperties(): boolean {
    console.log('Testing conditional device properties in JSON export...');
    
    const mastData: any = {
        author: 'Test Author',
        organisation: 'Test Org',
        date: '2024-01-01',
        version: '1.3.0-2024.03',
        plant_name: 'Test Plant',
        plant_type: 'onshore_wind',
        measurement_location: [{
            uuid: 'mast-1',
            name: 'Test Mast',
            latitude_ddeg: 40.0,
            longitude_ddeg: -100.0,
            measurement_station_type_id: 'mast',
            update_at: '2023-07-30T13:53:01.000Z',
            
            // Should be included for mast devices
            mast_properties: {
                mast_geometry_id: 'lattice_triangle',
                mast_height_m: 80,
                date_from: '2023-07-30T13:53:01.000Z',
                date_to: null
            },
            
            // Should NOT be included for mast devices
            vertical_profiler_properties: [{
                device_datum_plane_height_m: 1.5,
                height_reference_id: 'ground_level',
                date_from: '2023-07-30T13:53:01.000Z'
            }],
            
            logger_main_config: [{
                logger_oem_id: 'NRG Systems',
                logger_serial_number: '12345',
                date_from: '2023-07-30T13:53:01.000Z'
            }],
            
            measurement_point: [{
                name: 'Test Point',
                measurement_type_id: 'wind_speed',
                height_m: 40,
                height_reference_id: 'ground_level',
                update_at: '2023-07-30T13:53:01.000Z',
                logger_measurement_config: [{
                    date_from: '2023-07-30T13:53:01.000Z',
                    column_name: [{
                        column_name: 'Test Column',
                        statistic_type_id: 'avg',
                        is_ignored: false,
                        update_at: '2023-07-30T13:53:01.000Z'
                    }]
                }],
                sensor: []
            }]
        }]
    };
    
    const lidarData: any = {
        author: 'Test Author',
        organisation: 'Test Org',
        date: '2024-01-01',
        version: '1.3.0-2024.03',
        plant_name: 'Test Plant',
        plant_type: 'onshore_wind',
        measurement_location: [{
            uuid: 'lidar-1',
            name: 'Test Lidar',
            latitude_ddeg: 40.0,
            longitude_ddeg: -100.0,
            measurement_station_type_id: 'lidar',
            update_at: '2023-07-30T13:53:01.000Z',
            
            // Should NOT be included for lidar devices
            mast_properties: {
                mast_geometry_id: 'lattice_triangle',
                mast_height_m: 80,
                date_from: '2023-07-30T13:53:01.000Z',
                date_to: null
            },
            
            // Should be included for lidar devices
            vertical_profiler_properties: [{
                device_datum_plane_height_m: 1.5,
                height_reference_id: 'ground_level',
                date_from: '2023-07-30T13:53:01.000Z'
            }],
            
            logger_main_config: [{
                logger_oem_id: 'ZX Lidars',
                logger_serial_number: '12345',
                date_from: '2023-07-30T13:53:01.000Z'
            }],
            
            measurement_point: [{
                name: 'Test Point',
                measurement_type_id: 'wind_speed',
                height_m: 40,
                height_reference_id: 'ground_level',
                update_at: '2023-07-30T13:53:01.000Z',
                logger_measurement_config: [{
                    date_from: '2023-07-30T13:53:01.000Z',
                    column_name: [{
                        column_name: 'Test Column',
                        statistic_type_id: 'avg',
                        is_ignored: false,
                        update_at: '2023-07-30T13:53:01.000Z'
                    }]
                }],
                sensor: []
            }]
        }]
    };
    
    try {
        // Test mast data
        const exportedMastData = generateExportJson(mastData);
        const mastLocation = exportedMastData.measurement_location[0];
        
        const hasMastProperties = 'mast_properties' in mastLocation && mastLocation.mast_properties;
        const hasVerticalProfilerProperties = 'vertical_profiler_properties' in mastLocation && mastLocation.vertical_profiler_properties;
        
        const mastTestPassed = hasMastProperties && !hasVerticalProfilerProperties;
        
        if (mastTestPassed) {
            console.log('✅ Mast device test passed: includes mast_properties, excludes vertical_profiler_properties');
        } else {
            console.log('❌ Mast device test failed:');
            console.log('  Has mast_properties:', hasMastProperties);
            console.log('  Has vertical_profiler_properties:', hasVerticalProfilerProperties);
        }
        
        // Test lidar data
        const exportedLidarData = generateExportJson(lidarData);
        const lidarLocation = exportedLidarData.measurement_location[0];
        
        const lidarHasMastProperties = 'mast_properties' in lidarLocation && lidarLocation.mast_properties;
        const lidarHasVerticalProfilerProperties = 'vertical_profiler_properties' in lidarLocation && lidarLocation.vertical_profiler_properties;
        
        const lidarTestPassed = !lidarHasMastProperties && lidarHasVerticalProfilerProperties;
        
        if (lidarTestPassed) {
            console.log('✅ Lidar device test passed: excludes mast_properties, includes vertical_profiler_properties');
        } else {
            console.log('❌ Lidar device test failed:');
            console.log('  Has mast_properties:', lidarHasMastProperties);
            console.log('  Has vertical_profiler_properties:', lidarHasVerticalProfilerProperties);
        }
        
        return mastTestPassed && lidarTestPassed;
    } catch (error) {
        console.log('❌ Conditional device properties test failed with error:', error);
        return false;
    }
}