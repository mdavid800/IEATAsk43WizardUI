import React from 'react';
import { AlertCircle, Check, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { DynamicFormFieldHook } from '../schema/DynamicFormField';
import { FieldValidationFeedback } from '../schema/SchemaValidationFeedback';
import { useSchemaForm } from '../../hooks/use-schema-form';
import { schemaService } from '../../services/schema-service';
import type { IEATask43Schema } from '../../types/schema';

export function SchemaBasicInfoStep() {
  const {
    storeData,
    validationResults,
    isFieldValid,
    getFieldError,
    validateCurrentStep
  } = useSchemaForm({ step: 0 });

  // Get validation results for this step
  const stepValidation = validationResults?.stepValidations?.[0];
  const isStepValid = stepValidation?.isValid ?? false;
  const stepErrors = stepValidation?.errors ?? [];

  // Get enum values for plant types
  const plantTypeOptions = schemaService.getEnumValues('properties.plant_type');

  return (
    <div className="space-y-8">
      {/* Step Header */}
      <div className="border-b border-border/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">Basic Information</h2>
            <p className="text-muted-foreground">
              Provide essential details about your measurement campaign and organization according to IEA Task 43 requirements.
            </p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
            isStepValid
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          )}>
            {isStepValid ? (
              <>
                <Check className="w-4 h-4" />
                <span>Schema Compliant</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>{stepErrors.length} schema issue{stepErrors.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>

        {/* Step-level validation errors */}
        {!isStepValid && stepErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">Schema Validation Issues</h4>
                <ul className="space-y-1 text-sm text-red-700">
                  {stepErrors.slice(0, 3).map((error, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      <span>{error.message}</span>
                    </li>
                  ))}
                  {stepErrors.length > 3 && (
                    <li className="text-red-600 italic">
                      ... and {stepErrors.length - 3} more issues
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Information Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            Dataset Information
            <div className="w-2 h-2 rounded-full bg-red-500" title="Required fields" />
          </CardTitle>
          <CardDescription>
            Required information about who created this dataset and when. These fields are mandatory for IEA Task 43 compliance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DynamicFormFieldHook
              name="author"
              schemaPath="properties.author"
              label="Author"
              placeholder="Enter author name"
              description="The person who created this dataset"
            />
            
            <DynamicFormFieldHook
              name="organisation"
              schemaPath="properties.organisation"
              label="Organisation"
              placeholder="Enter organisation name"
              description="The organization responsible for this data"
            />
            
            <DynamicFormFieldHook
              name="date"
              schemaPath="properties.date"
              label="Creation Date"
              description="Date when this JSON file was created (YYYY-MM-DD format)"
            />
            
            <DynamicFormFieldHook
              name="version"
              schemaPath="properties.version"
              label="Schema Version"
              placeholder="e.g., 1.4.0-2025.06"
              description="IEA Task 43 schema version used"
            />
          </div>
        </CardContent>
      </Card>

      {/* License Information Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            License Information
            <div className="w-2 h-2 rounded-full bg-yellow-500" title="Recommended field" />
          </CardTitle>
          <CardDescription>
            Legal permissions for data sharing. While optional, providing license information is strongly recommended for data sharing compliance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicFormFieldHook
            name="license"
            schemaPath="properties.license"
            label="License"
            placeholder="e.g., BSD-3-Clause or https://example.com/license"
            description="License or URL to license for data sharing permissions"
          />
          
          {!storeData.license && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium">License Recommended</p>
                  <p className="text-yellow-700">
                    Consider adding a license such as "BSD-3-Clause" or a URL to your license for better data sharing compliance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plant Information Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            Plant Information
            <div className="w-2 h-2 rounded-full bg-blue-500" title="Plant-specific fields" />
          </CardTitle>
          <CardDescription>
            Information about the wind farm, solar plant, or other renewable energy installation being measured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DynamicFormFieldHook
              name="plant_name"
              schemaPath="properties.plant_name"
              label="Plant Name"
              placeholder="Enter wind farm or plant name"
              description="Name of the wind farm, solar plant, or project"
            />
            
            <DynamicFormFieldHook
              name="plant_type"
              schemaPath="properties.plant_type"
              label="Plant Type"
              description="Type of renewable energy installation being measured"
            />
          </div>

          {/* Plant type information */}
          {storeData.plant_type && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-800 font-medium">
                    {storeData.plant_type === 'onshore_wind' && 'Onshore Wind Farm'}
                    {storeData.plant_type === 'offshore_wind' && 'Offshore Wind Farm'}
                    {storeData.plant_type === 'solar' && 'Solar Installation'}
                  </p>
                  <p className="text-blue-700">
                    {storeData.plant_type === 'onshore_wind' && 'Land-based wind energy installation with measurement requirements for wind resource assessment.'}
                    {storeData.plant_type === 'offshore_wind' && 'Offshore wind energy installation with specialized marine and atmospheric measurement requirements.'}
                    {storeData.plant_type === 'solar' && 'Solar energy installation with irradiance and meteorological measurement requirements.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schema Compliance Information */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-600" />
            IEA Task 43 Schema Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          <p>
            This form validates your input against the official IEA Task 43 WRA Data Model Schema (version 1.4.0-2025.06).
            Required fields are marked with a red dot, recommended fields with yellow, and plant-specific fields with blue.
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Required</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Recommended</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Contextual</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}