import React from 'react';
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Save, X, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { LocationStep } from './steps/LocationStep';
import { LoggerStep } from './steps/LoggerStep';
import { MeasurementStep } from './steps/MeasurementStep';
import { SensorsStep } from './steps/SensorStep';
import { ReviewStep } from './steps/ReviewStep';
import { Button } from './ui/button';
import { downloadJsonFile } from '../utils/json-export';
import type { IEATask43Schema, Sensor } from '../types/schema';

const steps = [
  { id: 'basic-info', name: 'Basic Information', component: BasicInfoStep },
  { id: 'location', name: 'Location & Properties', component: LocationStep },
  { id: 'loggers', name: 'Loggers', component: LoggerStep },
  { id: 'sensors', name: 'Sensors', component: SensorsStep },
  { id: 'measurements', name: 'Measurement Points', component: MeasurementStep },
  { id: 'review', name: 'Review & Export', component: ReviewStep },
];

export function FormWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0])); // Track visited steps
  const methods = useForm<IEATask43Schema>({
    defaultValues: {
      author: '',
      organisation: '',
      startDate: new Date().toISOString().split('T')[0], // Renamed from date
      version: '1.3.0-2024.03',
      campaignStatus: 'live', // Added for issue #5
      endDate: undefined, // Optional: Added for historical campaigns
      // Plant information
      plant_name: '',
      plant_type: null,
      measurement_location: [{
        uuid: crypto.randomUUID(),
        name: '',
        latitude_ddeg: 0,
        longitude_ddeg: 0,
        measurement_station_type_id: 'mast',
        update_at: new Date().toISOString(),
        measurement_point: []
      }]
    }
  });

  // Validation functions for each step
  const validateBasicInfo = () => {
    const formData = methods.watch();
    const { author, organisation, plant_type, version, date, startDate, campaignStatus, endDate } = formData;
    const issues: string[] = [];

    if (!author) issues.push('Author is required');
    if (!organisation) issues.push('Organisation is required');
    if (!plant_type) issues.push('Plant type is required');
    if (!version) issues.push('Version is required');
    if (!date) issues.push('Date is required');
    if (!startDate) issues.push('Campaign start date is required');
    if (campaignStatus === 'historical' && !endDate) issues.push('Campaign end date is required');

    return {
      valid: issues.length === 0,
      issues
    };
  };

  const validateLocations = () => {
    const formData = methods.watch();
    const issues: string[] = [];

    if (!formData.measurement_location?.length) {
      issues.push('At least one measurement location is required');
      return { valid: false, issues };
    }

    formData.measurement_location.forEach((location, index) => {
      if (!location.name) issues.push(`Location ${index + 1}: Name is required`);
      if (!location.latitude_ddeg) issues.push(`Location ${index + 1}: Latitude is required`);
      if (!location.longitude_ddeg) issues.push(`Location ${index + 1}: Longitude is required`);
      if (!location.measurement_station_type_id) issues.push(`Location ${index + 1}: Station Type is required`);
    });

    return {
      valid: issues.length === 0,
      issues
    };
  };

  const validateLoggers = () => {
    const formData = methods.watch();
    const issues: string[] = [];

    if (!formData.measurement_location?.length) {
      issues.push('At least one measurement location is required');
      return { valid: false, issues };
    }

    let hasLoggers = false;
    formData.measurement_location.forEach((location, locIndex) => {
      if (location.logger_main_config && location.logger_main_config.length > 0) {
        hasLoggers = true;
        location.logger_main_config.forEach((logger, loggerIndex) => {
          if (!logger.logger_model_name) {
            issues.push(`Location ${locIndex + 1}, Logger ${loggerIndex + 1}: Model Name is required`);
          }
          if (!logger.logger_serial_number) {
            issues.push(`Location ${locIndex + 1}, Logger ${loggerIndex + 1}: Serial Number is required`);
          }
          if (!logger.date_from) {
            issues.push(`Location ${locIndex + 1}, Logger ${loggerIndex + 1}: Date From is required`);
          }
        });
      }
    });

    if (!hasLoggers) {
      issues.push('At least one logger is required');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  };

  const validateSensors = () => {
    const formData = methods.watch();
    const issues: string[] = [];

    formData.measurement_location?.forEach((location, locIndex) => {
      // Require at least one sensor per location (skip undefined/null entries)
      const validSensors = Array.isArray(location.sensors)
        ? location.sensors.filter(Boolean)
        : [];
      if (validSensors.length === 0) {
        issues.push(`Location ${locIndex + 1}: At least one sensor is required`);
        return;
      }
      validSensors.forEach((sensor: Sensor, sensorIndex: number) => {
        if (!sensor.oem) {
          issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: OEM is required`);
        }
        if (!sensor.model) {
          issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: Model is required`);
        }
        if (!sensor.serial_number) {
          issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: Serial Number is required`);
        }
        if (!sensor.sensor_type_id) {
          issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: Sensor Type is required`);
        }
        if (!sensor.date_from) {
          issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: Date From is required`);
        }
        if (!sensor.date_to) {
          issues.push(`Location ${locIndex + 1}, Sensor ${sensorIndex + 1}: Date To is required`);
        }
      });
    });

    return {
      valid: issues.length === 0,
      issues
    };
  };

  const validateMeasurements = () => {
    const formData = methods.watch();
    const issues: string[] = [];

    formData.measurement_location?.forEach((location, locIndex) => {
      if (!location.measurement_point?.length) {
        issues.push(`Location ${locIndex + 1}: At least one measurement point is required`);
        return;
      }

      location.measurement_point.forEach((point, pointIndex) => {
        if (!point.name) {
          issues.push(`Location ${locIndex + 1}, Measurement Point ${pointIndex + 1}: Name is required`);
        }
        if (typeof point.height_m !== 'number' || point.height_m < 0) {
          issues.push(`Location ${locIndex + 1}, Measurement Point ${pointIndex + 1}: Valid height is required`);
        }
      });
    });

    return {
      valid: issues.length === 0,
      issues
    };
  };

  // Get validation status for each step
  const getStepValidation = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: return validateBasicInfo();
      case 1: return validateLocations();
      case 2: return validateLoggers();
      case 3: return validateSensors();
      case 4: return validateMeasurements();
      case 5: return { valid: true, issues: [] }; // Review step doesn't need validation
      default: return { valid: false, issues: [] };
    }
  };

  // Get step status for display
  const getStepStatus = (stepIndex: number) => {
    const isVisited = visitedSteps.has(stepIndex);
    const isCurrent = stepIndex === currentStep;

    if (isCurrent) {
      return 'current';
    }

    if (!isVisited) {
      return 'unvisited';
    }

    const validation = getStepValidation(stepIndex);
    return validation.valid ? 'complete' : 'incomplete';
  };

  const CurrentStepComponent = steps[currentStep].component;

  const next = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps(prev => new Set([...prev, nextStep]));
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setVisitedSteps(prev => new Set([...prev, prevStep]));
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      setVisitedSteps(prev => new Set([...prev, stepIndex]));
    }
  };

  const [exportError, setExportError] = useState<{ requiredFieldsValidation: any; schemaValidation: any } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const onSubmit = (data: IEATask43Schema) => {
    if (currentStep === steps.length - 1) {
      // Reset any previous export errors
      setExportError(null);
      setIsExporting(true);

      try {
        // Use shared utility function for consistent JSON export with validation
        const validationResult = downloadJsonFile(data, 'iea-task43-data.json', true);

        // If validation failed, show error message
        if (validationResult) {
          setExportError(validationResult);
        }
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setIsExporting(false);
      }
    } else {
      next();
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <nav className="mb-8" role="navigation" aria-label="Form progress">
        <div className="professional-card p-6 mb-8">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Progress</span>
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} of {steps.length} steps
              </span>
            </div>
            <div className="w-full bg-border/30 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={cn(
                    "group relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30",
                    status === 'current' && "bg-primary/10 ring-1 ring-primary/20",
                    status === 'complete' && "opacity-100 hover:opacity-100",
                    status === 'incomplete' && "opacity-75 hover:opacity-100",
                    status === 'unvisited' && "opacity-50 hover:opacity-75"
                  )}
                  aria-label={`Go to step ${index + 1}: ${step.name}`}
                  tabIndex={0}
                >
                  {/* Step Number/Check/Error */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-all duration-200",
                    status === 'complete' && "bg-green-500 text-white shadow-sm",
                    status === 'current' && "bg-primary text-white shadow-md ring-2 ring-primary/30",
                    status === 'incomplete' && "bg-red-500 text-white shadow-sm",
                    status === 'unvisited' && "bg-border/40 text-muted-foreground group-hover:bg-primary/20"
                  )}>
                    {status === 'complete' ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : status === 'incomplete' ? (
                      <X className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Step Label */}
                  <span className={cn(
                    "text-xs font-medium text-center leading-tight transition-colors duration-200",
                    status === 'complete' && "text-green-600",
                    status === 'current' && "text-primary font-semibold",
                    status === 'incomplete' && "text-red-600",
                    status === 'unvisited' && "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>

                  {/* Current Step Indicator */}
                  {status === 'current' && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" />
                  )}

                  {/* Incomplete Step Warning */}
                  {status === 'incomplete' && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500/20 border border-red-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-2 h-2 text-red-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Top Navigation */}
      <div className="professional-card p-6 mb-8">
        <div className="flex justify-between items-center">
          <Button
            type="button"
            onClick={prev}
            disabled={currentStep === 0}
            variant="outline"
            className="border-primary/20 hover:border-primary hover:bg-primary/5 shadow-sm"
            aria-label={`Go to previous step: ${currentStep > 0 ? steps[currentStep - 1].name : 'None'}`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-xs">•</span>
            <span>{steps[currentStep].name}</span>
          </div>

          <Button
            type="button"
            onClick={() => onSubmit(methods.getValues())}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-professional hover:shadow-professional-hover transition-all duration-300 hover:-translate-y-0.5"
            aria-label={currentStep === steps.length - 1 ? 'Export JSON file' : `Go to next step: ${currentStep < steps.length - 1 ? steps[currentStep + 1].name : 'Review'}`}
          >
            {currentStep === steps.length - 1 ? (
              <>
                <Save className="w-4 h-4 mr-1" />
                Export JSON
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>

      </div>

      {/* Export Validation Error Message */}
      {exportError && currentStep === steps.length - 1 && (
        <div className="professional-card p-6 bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-red-800">Export Failed - Schema Validation Issues</h3>
              <p className="text-sm text-red-700">
                Your data could not be exported because it doesn't meet the IEA Task 43 schema requirements.
                Please fix the following issues:
              </p>
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                {exportError.requiredFieldsValidation?.errors?.slice(0, 5).map((error: any, index: number) => (
                  <div key={`req-${index}`} className="text-sm text-red-700 bg-red-100/50 p-2 rounded">
                    <span className="font-medium">{error.path}:</span> {error.message}
                  </div>
                ))}
                {exportError.schemaValidation?.errors?.slice(0, 5).map((error: any, index: number) => (
                  <div key={`schema-${index}`} className="text-sm text-orange-700 bg-orange-100/50 p-2 rounded">
                    <span className="font-medium">{error.path}:</span> {error.message}
                  </div>
                ))}
                {((exportError.requiredFieldsValidation?.errors?.length || 0) > 5 ||
                  (exportError.schemaValidation?.errors?.length || 0) > 5) && (
                    <div className="text-sm text-gray-600 italic">
                      ... and {((exportError.requiredFieldsValidation?.errors?.length || 0) +
                        (exportError.schemaValidation?.errors?.length || 0) - 10)} more issues
                    </div>
                  )}
              </div>
              <p className="text-sm text-red-700 mt-2">
                Please review the validation section in the form for more details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Export Loading State */}
      {isExporting && currentStep === steps.length - 1 && (
        <div className="professional-card p-6 bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <div>
              <h3 className="font-medium text-blue-800">Validating and Exporting Data</h3>
              <p className="text-sm text-blue-700">
                Please wait while we validate your data against the IEA Task 43 schema...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
          <div className="professional-card p-8 shadow-professional">
            <CurrentStepComponent />
          </div>

          {/* Bottom Navigation */}
          <div className="professional-card p-6">
            <div className="flex justify-between items-center">
              <Button
                type="button"
                onClick={prev}
                disabled={currentStep === 0}
                variant="outline"
                className="border-primary/20 hover:border-primary hover:bg-primary/5 shadow-sm"
                aria-label={`Go to previous step: ${currentStep > 0 ? steps[currentStep - 1].name : 'None'}`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-professional hover:shadow-professional-hover transition-all duration-300 hover:-translate-y-0.5"
                aria-label={currentStep === steps.length - 1 ? 'Export JSON file' : `Go to next step: ${currentStep < steps.length - 1 ? steps[currentStep + 1].name : 'Review'}`}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Export JSON
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}