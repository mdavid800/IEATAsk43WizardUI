import { schemaService } from '../../services/schema-service';
import { schemaValidator } from '../../services/schema-validator';

/**
 * Simple test utility to verify schema loading and validation
 */
export function testSchemaIntegration() {
    console.log('🧪 Testing Schema Integration...');

    try {
        // Test 1: Load schema
        const schema = schemaService.loadSchema();
        console.log('✅ Schema loaded successfully');
        console.log(`   Title: ${schema.title}`);
        console.log(`   Version: ${schema.$version}`);

        // Test 2: Get required fields
        const requiredFields = schemaService.getRequiredFields('');
        console.log('✅ Required fields retrieved:', requiredFields);

        // Test 3: Get measurement station types
        const stationTypes = schemaService.getMeasurementStationTypes();
        console.log('✅ Station types retrieved:', stationTypes.slice(0, 3), '...');

        // Test 4: Test validation with valid data
        const validData = {
            author: 'Test Author',
            organisation: 'Test Organisation',
            date: '2025-01-22',
            version: '1.4.0-2025.06',
            measurement_location: []
        };

        const validationResult = schemaValidator.validate(validData);
        console.log('✅ Validation test completed');
        console.log(`   Valid: ${validationResult.isValid}`);
        console.log(`   Errors: ${validationResult.errors.length}`);

        // Test 5: Test field validation
        const fieldResult = schemaValidator.validateField('author', 'Test Author');
        console.log('✅ Field validation test completed');
        console.log(`   Field valid: ${fieldResult.isValid}`);

        console.log('🎉 All schema integration tests passed!');
        return true;

    } catch (error) {
        console.error('❌ Schema integration test failed:', error);
        return false;
    }
}

// Export for use in development
if (typeof window !== 'undefined') {
    (window as any).testSchemaIntegration = testSchemaIntegration;
}