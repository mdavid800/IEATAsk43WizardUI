import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { DynamicFormField, createFormFieldFromSchema, type FormField } from './DynamicFormField';
import { schemaService } from '../../services/schema-service';
import { useSchemaForm } from '../../hooks/use-schema-form';
import type { IEATask43Schema } from '../../types/schema';

export interface StepConfiguration {
  title: string;
  description: string;
  schemaPath: string;
  fields: string[];
  sections?: FormSection[];
  conditionalLogic?: ConditionalLogic[];
}

export interface FormSection {
  title: string;
  description?: string;
  fields: string[];
  conditional?: ConditionalLogic;
}

export interface ConditionalLogic {
  dependsOn: string; // Field path that this depends on
  values: any[]; // Values that trigger this condition
  action: 'show' | 'hide' | 'require' | 'disable';
}

export interface DynamicFormStepProps {
  step: number;
  config: StepConfiguration;
  className?: string;
}

// Predefined step configurations based on IEA schema
export const STEP_CONFIGURATIONS: Record<number, StepConfiguration> = {
  0: {
    title: 'Basic Information',
    description: 'General information about the dataset and organization',
    schemaPath: 'properties',
    fields: [
      'author',
      'organisation',
      'date',
      'version',
      'license',
      'plant_name',
      'plant_type'
    ],
    sections: [
      {
        title: 'Dataset Information',
        description: 'Required information about who created this dataset',
        fields: ['author', 'organisation', 'date', 'version', 'license']
      },
      {
        title: 'Plant Information',
        description: 'Information about the wind farm or solar plant',
        fields: ['plant_name', 'plant_type']
      }
    ]
  },
  1: {
    title: 'Measurement Locations',
    description: 'Configure measurement stations and their properties',
    schemaPath: 'measurement_location.items.properties',
    fields: [
      'name',
      'latitude_ddeg',
      'longitude_ddeg',
      'measurement_station_type_id'
    ],
    sections: [
      {
        title: 'Basic Location Properties',
        fields: ['name', 'latitude_ddeg', 'longitude_ddeg', 'measurement_station_type_id']
      }
    ]
  },
  2: {
    title: 'Station Configuration',
    description: 'Configure station-specific properties based on measurement station type',
    schemaPath: 'measurement_location.items.properties',
    fields: [], // Dynamic based on station type
    conditionalLogic: [
      {
        dependsOn: 'measurement_station_type_id',
        values: ['mast'],
        action: 'show'
      }
    ]
  },
  3: {
    title: 'Logger Configuration',
    description: 'Configure data loggers for each measurement station',
    schemaPath: 'measurement_location.items.properties.logger_main_config.items.properties',
    fields: [
      'logger_oem_id',
      'logger_model_name',
      'logger_serial_number',
      'date_from',
      'date_to'
    ]
  },
  4: {
    title: 'Measurement Points',
    description: 'Define measurement points and their properties',
    schemaPath: 'measurement_location.items.properties.measurement_point.items.properties',
    fields: [
      'name',
      'measurement_type_id',
      'height_m',
      'height_reference_id'
    ]
  },
  5: {
    title: 'Review & Export',
    description: 'Review your data and export to JSON format',
    schemaPath: 'properties',
    fields: []
  }
};

export const DynamicFormStep: React.FC<DynamicFormStepProps> = ({
  step,
  config,
  className = ''
}) => {
  const {
    storeData,
    updateStoreField,
    isFieldValid,
    getFieldError
  } = useSchemaForm({ step });

  // Generate form fields from schema
  const generateFormFields = (fieldNames: string[], basePath: string): FormField[] => {
    return fieldNames.map(fieldName => {
      const fullSchemaPath = basePath ? `${basePath}.${fieldName}` : fieldName;
      return createFormFieldFromSchema(fieldName, fullSchemaPath);
    });
  };

  // Check if a section should be visible based on conditional logic
  const isSectionVisible = (section: FormSection): boolean => {
    if (!section.conditional) return true;

    const dependentValue = getValueAtPath(storeData, section.conditional.dependsOn);
    const shouldShow = section.conditional.values.includes(dependentValue);

    return section.conditional.action === 'show' ? shouldShow : !shouldShow;
  };

  // Helper to get value at path
  const getValueAtPath = (obj: any, path: string): any => {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  };

  // Handle field value changes
  const handleFieldChange = async (fieldName: string, value: any) => {
    const fieldPath = config.schemaPath === 'properties' ? fieldName : `${config.schemaPath}.${fieldName}`;
    await updateStoreField(fieldPath, value);
  };

  // Get field value from store data
  const getFieldValue = (fieldName: string): any => {
    if (config.schemaPath === 'properties') {
      return storeData[fieldName as keyof IEATask43Schema];
    }
    return getValueAtPath(storeData, `${config.schemaPath}.${fieldName}`);
  };

  // Render a form field
  const renderFormField = (field: FormField) => {
    const value = getFieldValue(field.name);
    const error = getFieldError(field.name);
    
    return (
      <DynamicFormField
        key={field.name}
        field={field}
        value={value}
        onChange={(newValue) => handleFieldChange(field.name, newValue)}
        error={error}
      />
    );
  };

  // Render a form section
  const renderSection = (section: FormSection) => {
    if (!isSectionVisible(section)) return null;

    const sectionFields = generateFormFields(section.fields, config.schemaPath);

    return (
      <Card key={section.title} className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{section.title}</CardTitle>
          {section.description && (
            <CardDescription>{section.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionFields.map(renderFormField)}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{config.title}</h2>
        <p className="text-muted-foreground">{config.description}</p>
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {config.sections ? (
          config.sections.map(renderSection)
        ) : (
          // Render all fields in a single section if no sections defined
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generateFormFields(config.fields, config.schemaPath).map(renderFormField)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Conditional station configuration component
export const ConditionalStationConfig: React.FC<{ locationIndex: number }> = ({
  locationIndex
}) => {
  const { storeData } = useSchemaForm();
  
  const location = storeData.measurement_location[locationIndex];
  const stationType = location?.measurement_station_type_id;

  // Configuration for different station types
  const getStationConfig = (): StepConfiguration | null => {
    switch (stationType) {
      case 'mast':
        return {
          title: 'Mast Properties',
          description: 'Configure properties specific to mast stations',
          schemaPath: `measurement_location[${locationIndex}].mast_properties`,
          fields: [
            'mast_geometry_id',
            'mast_oem',
            'mast_model',
            'mast_height_m',
            'date_from',
            'date_to'
          ]
        };
      
      case 'lidar':
      case 'sodar':
      case 'floating_lidar':
        return {
          title: 'Vertical Profiler Properties',
          description: 'Configure properties for LiDAR, SODAR, or floating LiDAR stations',
          schemaPath: `measurement_location[${locationIndex}].vertical_profiler_properties.items.properties`,
          fields: [
            'device_datum_plane_height_m',
            'height_reference_id',
            'device_orientation_deg',
            'orientation_reference_id',
            'device_vertical_orientation',
            'date_from',
            'date_to'
          ]
        };
      
      case 'reanalysis':
      case 'virtual_met_mast':
        return {
          title: 'Model Configuration',
          description: 'Configure model properties for reanalysis or virtual stations',
          schemaPath: `measurement_location[${locationIndex}].model_config.items.properties`,
          fields: [
            'reanalysis',
            'horizontal_grid_resolution_m',
            'model_used',
            'date_from',
            'date_to',
            'offset_from_utc_hrs'
          ]
        };
      
      default:
        return null;
    }
  };

  const config = getStationConfig();
  
  if (!config) {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Please select a measurement station type to configure station-specific properties.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <DynamicFormStep step={2} config={config} />;
};