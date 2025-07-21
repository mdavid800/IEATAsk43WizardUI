import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { FileJson, Check, AlertCircle, Loader2, Shield, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateExportJson } from '../../utils/json-export';
import { validateIEACompliance, validateRequiredFields, ValidationResult } from '../../utils/schema-validation';
import { validateAllSections } from '../../utils/step-validation';
import type { IEATask43Schema, Sensor } from '../../types/schema';

export function ReviewStep() {
  const { watch } = useFormContext<IEATask43Schema>();
  const formData = watch();
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(true);
  const [previewJson, setPreviewJson] = useState<string>('');
  const [schemaValidation, setSchemaValidation] = useState<ValidationResult | null>(null);
  const [requiredFieldsValidation, setRequiredFieldsValidation] = useState<ValidationResult | null>(null);
  const isGeneratingRef = useRef(false);
  const lastDataHashRef = useRef<string>('');

  // Use shared validation utility for consistent validation across all steps
  const { sections, isValid, completedSections } = validateAllSections(formData);

  // Generate preview JSON and run validation asynchronously to prevent UI blocking
  useEffect(() => {
    // Create a hash of the form data to detect actual changes
    const dataHash = JSON.stringify(formData);

    // Force validation on first render or when data changes
    const shouldValidate = !lastDataHashRef.current || dataHash !== lastDataHashRef.current;

    if (!shouldValidate || isGeneratingRef.current) {
      return;
    }

    const generatePreviewAndValidate = () => {
      isGeneratingRef.current = true;
      setIsGeneratingPreview(true);

      // Use setTimeout to allow the UI to render first
      setTimeout(() => {
        try {
          // Generate export data (even if form is empty)
          const exportData = generateExportJson(formData);
          const jsonString = JSON.stringify(exportData, null, 2);
          setPreviewJson(jsonString);

          // Always run schema validation (even on empty data)
          const schemaResult = validateIEACompliance(exportData);
          setSchemaValidation(schemaResult);

          // Run required fields validation against the raw form data to catch all issues
          // This ensures we see validation issues from all steps, not just what's in the exported JSON
          const requiredFieldsResult = validateRequiredFields(formData);
          setRequiredFieldsValidation(requiredFieldsResult);

          lastDataHashRef.current = dataHash;
        } catch (error) {
          console.error('Error generating preview:', error);
          setPreviewJson('Error generating preview. Please check your data.');

          // Set validation errors even if preview generation fails
          setSchemaValidation({
            isValid: false,
            errors: [{ path: 'root', message: 'Schema validation failed due to error' }],
            warnings: []
          });
          setRequiredFieldsValidation({
            isValid: false,
            errors: [{ path: 'root', message: 'Required fields validation failed due to error' }],
            warnings: []
          });

          lastDataHashRef.current = dataHash;
        } finally {
          setIsGeneratingPreview(false);
          isGeneratingRef.current = false;
        }
      }, 100); // Small delay to allow UI to render
    };

    // Run validation immediately on first render
    generatePreviewAndValidate();

    return () => {
      // No need for timeout cleanup since we're not using setTimeout for debouncing anymore
    };
  }, [formData]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary mb-2">Review & Export</h2>
        <Button
          type="submit"
          className={cn(
            "flex items-center gap-2",
            (requiredFieldsValidation?.isValid && schemaValidation?.isValid)
              ? "bg-green-600 hover:bg-green-700"
              : "bg-primary hover:bg-primary/90"
          )}
          disabled={!isValid}
        >
          {(requiredFieldsValidation?.isValid && schemaValidation?.isValid) ? (
            <ShieldCheck className="w-4 h-4" />
          ) : (
            <FileJson className="w-4 h-4" />
          )}
          {(requiredFieldsValidation?.isValid && schemaValidation?.isValid)
            ? "Export Compliant JSON"
            : "Export JSON"}
        </Button>
      </div>

      {/* Progress Summary */}
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Configuration Progress</h3>
          <span className="text-sm font-medium text-muted-foreground">
            {completedSections} of {sections.length} sections complete
          </span>
        </div>

        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedSections / sections.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <div
              key={section.name}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                section.valid
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              {section.valid ? (
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{section.name}</span>
            </div>
          ))}
        </div>
      </div>

      {!isValid && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Please complete all required sections before exporting. Navigate back to incomplete sections to see specific validation messages and complete the required fields.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schema Validation Status */}
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">IEA Schema Compliance</h3>
          </div>

          {/* Overall compliance status indicator */}
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            (requiredFieldsValidation?.isValid && schemaValidation?.isValid)
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          )}>
            {(requiredFieldsValidation?.isValid && schemaValidation?.isValid)
              ? "Compliant"
              : "Non-Compliant"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Required Fields Validation */}
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg border",
            requiredFieldsValidation?.isValid
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          )}>
            {requiredFieldsValidation?.isValid ? (
              <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            )}
            <div>
              <div className="font-medium">Required Fields</div>
              <div className="text-sm">
                {requiredFieldsValidation?.isValid
                  ? "All required fields are present"
                  : `${requiredFieldsValidation?.errors?.length ?? 0} missing required fields`}
              </div>
            </div>
          </div>

          {/* Schema Validation */}
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg border",
            schemaValidation?.isValid
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-orange-50 text-orange-700 border-orange-200"
          )}>
            {schemaValidation?.isValid ? (
              <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
            )}
            <div>
              <div className="font-medium">Schema Compliance</div>
              <div className="text-sm">
                {schemaValidation?.isValid
                  ? "Fully compliant with IEA Task 43 schema"
                  : `${schemaValidation?.errors?.length ?? 0} schema validation issues`}
              </div>
            </div>
          </div>
        </div>

        {/* Validation Errors - Fixed type safety */}
        {((requiredFieldsValidation?.errors?.length ?? 0) > 0 || (schemaValidation?.errors?.length ?? 0) > 0) && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Validation Issues:</h4>

            {/* Required Fields Errors - Categorized by form step */}
            {(requiredFieldsValidation?.errors?.length ?? 0) > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-red-800 mb-2">Missing Required Fields:</div>
                <div className="max-h-60 overflow-y-auto p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="space-y-4">
                    {/* Map errors to form steps */}
                    {(() => {
                      // Define step mapping for paths - order matters, more specific paths first
                      const stepMapping = [
                        {
                          step: 'Basic Information',
                          paths: ['author', 'organisation', 'date', 'version', 'plant_name', 'plant_type'],
                          stepIndex: 0
                        },
                        {
                          step: 'Sensors',
                          paths: ['sensors', 'sensor[', '.sensor[', 'oem', 'model', 'serial_number', 'sensor_type_id'],
                          stepIndex: 3
                        },
                        {
                          step: 'Loggers',
                          paths: ['logger_main_config', 'logger_oem_id', 'logger_serial_number', 'date_from'],
                          stepIndex: 2
                        },
                        {
                          step: 'Measurement Points',
                          paths: ['measurement_point', 'height_m', 'height_reference_id', 'measurement_type_id', 'logger_measurement_config', 'column_name', 'statistic_type_id'],
                          stepIndex: 4
                        },
                        {
                          step: 'Location & Properties',
                          paths: ['measurement_location', 'latitude_ddeg', 'longitude_ddeg', 'measurement_station_type_id', 'name'],
                          stepIndex: 1
                        }
                      ];

                      // Group errors by step
                      const errorsByStep = (requiredFieldsValidation && requiredFieldsValidation.errors)
                        ? requiredFieldsValidation.errors.reduce((acc: Record<string, any[]>, error) => {
                          // Find which step this error belongs to
                          let foundStep = 'Other';
                          let foundStepIndex = -1;

                          for (const mapping of stepMapping) {
                            for (const path of mapping.paths) {
                              if (error.path.includes(path)) {
                                foundStep = mapping.step;
                                foundStepIndex = mapping.stepIndex;
                                break;
                              }
                            }
                            if (foundStep !== 'Other') break;
                          }

                          if (!acc[foundStep]) {
                            acc[foundStep] = [];
                          }
                          acc[foundStep].push({ ...error, stepIndex: foundStepIndex });
                          return acc;
                        }, {})
                        : {};

                      // Sort steps by their index
                      return Object.entries(errorsByStep)
                        .sort(([stepA, errorsA], [stepB, errorsB]) => {
                          const indexA = errorsA[0]?.stepIndex ?? 999;
                          const indexB = errorsB[0]?.stepIndex ?? 999;
                          return indexA - indexB;
                        })
                        .map(([step, errors]) => (
                          <div key={`step-${step}`} className="mb-3 p-3 bg-red-100/50 rounded-lg">
                            <div className="flex items-center gap-2 font-medium text-red-800 mb-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>{step} Step:</span>
                              {errors[0]?.stepIndex >= 0 && (
                                <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                                  Go to Step {errors[0].stepIndex + 1} to fix
                                </span>
                              )}
                            </div>
                            <ul className="list-disc pl-5 space-y-1">
                              {errors.map((error, idx) => (
                                <li key={`req-${step}-${idx}`} className="text-sm text-red-700">
                                  <span className="font-medium">{error.path}:</span> {error.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Schema Validation Errors - With improved categorization */}
            {(schemaValidation?.errors?.length ?? 0) > 0 && (
              <div>
                <div className="text-sm font-medium text-orange-800 mb-2">Schema Compliance Issues:</div>
                <div className="max-h-60 overflow-y-auto p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="space-y-2">
                    {/* Map schema errors to form steps */}
                    {(() => {
                      // Define step mapping for paths - order matters, more specific paths first
                      const stepMapping = [
                        {
                          step: 'Basic Information',
                          paths: ['author', 'organisation', 'date', 'version', 'plant_name', 'plant_type'],
                          stepIndex: 0
                        },
                        {
                          step: 'Sensors',
                          paths: ['sensors', 'sensor[', '.sensor[', 'oem', 'model', 'serial_number', 'sensor_type_id'],
                          stepIndex: 3
                        },
                        {
                          step: 'Loggers',
                          paths: ['logger_main_config', 'logger_oem_id', 'logger_serial_number', 'date_from'],
                          stepIndex: 2
                        },
                        {
                          step: 'Measurement Points',
                          paths: ['measurement_point', 'height_m', 'height_reference_id', 'measurement_type_id', 'logger_measurement_config', 'column_name', 'statistic_type_id'],
                          stepIndex: 4
                        },
                        {
                          step: 'Location & Properties',
                          paths: ['measurement_location', 'latitude_ddeg', 'longitude_ddeg', 'measurement_station_type_id', 'name'],
                          stepIndex: 1
                        }
                      ];

                      // First, categorize errors by step
                      const errorsByStep = (schemaValidation && schemaValidation.errors)
                        ? schemaValidation.errors.reduce((acc: Record<string, any[]>, error) => {
                          // Find which step this error belongs to
                          let foundStep = 'Other';
                          let foundStepIndex = -1;

                          for (const mapping of stepMapping) {
                            for (const path of mapping.paths) {
                              if (error.path.includes(path)) {
                                foundStep = mapping.step;
                                foundStepIndex = mapping.stepIndex;
                                break;
                              }
                            }
                            if (foundStep !== 'Other') break;
                          }

                          if (!acc[foundStep]) {
                            acc[foundStep] = [];
                          }
                          acc[foundStep].push({ ...error, stepIndex: foundStepIndex });
                          return acc;
                        }, {})
                        : {};

                      // Then, for each step, categorize errors by type
                      return Object.entries(errorsByStep)
                        .sort(([stepA, errorsA], [stepB, errorsB]) => {
                          const indexA = errorsA[0]?.stepIndex ?? 999;
                          const indexB = errorsB[0]?.stepIndex ?? 999;
                          return indexA - indexB;
                        })
                        .map(([step, errors]) => {
                          // Group errors by type within each step
                          const errorsByType = errors.reduce((acc: Record<string, any[]>, error) => {
                            const errorType = error.keyword || 'other';
                            if (!acc[errorType]) acc[errorType] = [];
                            acc[errorType].push(error);
                            return acc;
                          }, {});

                          return (
                            <div key={`step-${step}`} className="mb-4 p-3 bg-orange-100/50 rounded-lg">
                              <div className="flex items-center gap-2 font-medium text-orange-800 mb-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>{step} Step:</span>
                                {errors[0]?.stepIndex >= 0 && (
                                  <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                                    Go to Step {errors[0].stepIndex + 1} to fix
                                  </span>
                                )}
                              </div>

                              {Object.entries(errorsByType).map(([errorType, typeErrors]) => (
                                <div key={`${step}-${errorType}`} className="mb-2">
                                  <div className="text-sm font-medium text-orange-700 ml-4 mb-1">
                                    {errorType === 'type' ? 'Type Errors' :
                                      errorType === 'enum' ? 'Invalid Enum Values' :
                                        errorType === 'required' ? 'Missing Required Properties' :
                                          errorType === 'format' ? 'Format Errors' :
                                            'Other Issues'}:
                                  </div>
                                  <ul className="list-disc pl-8 space-y-1">
                                    {typeErrors.slice(0, 5).map((error, idx) => (
                                      <li key={`schema-${step}-${errorType}-${idx}`} className="text-sm text-orange-700">
                                        <span className="font-medium">{error.path}:</span> {error.message}
                                        {error.expectedType && error.actualValue &&
                                          ` (Expected: ${error.expectedType}, Got: ${typeof error.actualValue})`}
                                      </li>
                                    ))}
                                    {typeErrors.length > 5 && (
                                      <li className="text-sm text-orange-600">
                                        ... and {typeErrors.length - 5} more {errorType} issues
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          );
                        });
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compliance Success Message */}
        {requiredFieldsValidation?.isValid && schemaValidation?.isValid && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <ShieldCheck className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-sm text-green-700">
                Your data is fully compliant with the IEA Task 43 schema and contains all required fields.
                The exported JSON will be valid according to the official schema specification.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-primary">
            {formData.measurement_location?.length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Location{(formData.measurement_location?.length || 0) !== 1 ? 's' : ''}</div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-primary">
            {formData.measurement_location?.reduce((total, loc) =>
              total + (loc.logger_main_config?.length || 0), 0) || 0}
          </div>
          <div className="text-sm text-muted-foreground">Logger{(formData.measurement_location?.reduce((total, loc) =>
            total + (loc.logger_main_config?.length || 0), 0) || 0) !== 1 ? 's' : ''}</div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-primary">
            {formData.measurement_location?.reduce((total, loc) =>
              total + (loc.measurement_point?.length || 0), 0) || 0}
          </div>
          <div className="text-sm text-muted-foreground">Measurement Point{(formData.measurement_location?.reduce((total, loc) =>
            total + (loc.measurement_point?.length || 0), 0) || 0) !== 1 ? 's' : ''}</div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-primary">
            {formData.measurement_location?.reduce((total, loc) =>
              total + (loc.measurement_point?.reduce((pointTotal, point) =>
                pointTotal + (Array.isArray(point.sensor) ? point.sensor.filter(Boolean).length : 0), 0) || 0), 0) || 0}
          </div>
          <div className="text-sm text-muted-foreground">Sensor{(formData.measurement_location?.reduce((total, loc) =>
            total + (loc.measurement_point?.reduce((pointTotal, point) =>
              pointTotal + (Array.isArray(point.sensor) ? point.sensor.filter(Boolean).length : 0), 0) || 0), 0) || 0) !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Data Preview */}
      <div className="mt-8">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileJson className="w-5 h-5 text-primary" />
            <h3 className="text-base font-medium">Export Preview</h3>
            <span className="text-sm text-muted-foreground">
              (IEA-compliant JSON - excludes form-only fields)
            </span>
          </div>
          <div className="rounded-md overflow-hidden border border-border">
            {isGeneratingPreview ? (
              <div className="flex items-center justify-center p-8 bg-white">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Generating JSON preview...</p>
                </div>
              </div>
            ) : (
              <SyntaxHighlighter
                language="json"
                style={oneLight}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  background: '#ffffff',
                  color: '#24292e',
                  border: 'none',
                }}
                wrapLines={true}
                wrapLongLines={true}
              >
                {previewJson}
              </SyntaxHighlighter>
            )}
          </div>
        </div>
      </div>

      {/* Export Instructions */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Review your configuration summary and export preview above. The exported JSON will be IEA Task 43 compliant and exclude form-only fields like campaign status and dates.
              When ready, click "Export JSON" to download your data model file.
              {!isValid && " Make sure to complete all required sections first."}
            </p>
          </div>
        </div>
      </div>
    </div >
  );
}