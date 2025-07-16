// Test utility to verify schema validation is working
import { schemaValidator, validateIEACompliance } from './schema-validation';

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

    return {
        validDataTest: validResult.isValid,
        invalidDataTest: !invalidResult.isValid,
        dateFormatTest,
        uuidTest
    };
}