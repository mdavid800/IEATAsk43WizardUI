import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Save, X, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import { useFormStore } from '../stores/form-store';
import { DynamicFormStep, STEP_CONFIGURATIONS } from './schema/DynamicFormStep';
import { SchemaValidationFeedback, StepValidationSummary } from './schema/SchemaValidationFeedback';
import { SchemaBasicInfoStep } from './steps/SchemaBasicInfoStep';
import { SchemaMeasurementLocationStep } from './steps/SchemaMeasurementLocationStep';
import { useSchemaForm } from '../hooks/use-schema-form';
import type { StepConfiguration } from './schema/DynamicFormStep';

export interface SchemaFormWizardProps {
  onExport?: (data: any) => void;
  className?: string;
}

// Enhanced step configurations with schema validation
const ENHANCED_STEP_CONFIGURATIONS: Record<number, StepConfiguration> = {
  ...STEP_CONFIGURATIONS,
  // Override configurations with enhanced validation and UI
  0: {
    ...STEP_CONFIGURATIONS[0],
    sections: [
      {
        title: 'Dataset Information',
        description: 'Required information about who created this dataset and when',
        fields: ['author', 'organisation', 'date', 'version']
      },
      {
        title: 'License Information',
        description: 'Legal permissions for data sharing (recommended)',
        fields: ['license']
      },
      {
        title: 'Plant Information',
        description: 'Information about the wind farm or solar plant being measured',
        fields: ['plant_name', 'plant_type']
      }
    ]
  }
};

export const SchemaFormWizard: React.FC<SchemaFormWizardProps> = ({
  onExport,
  className = ''
}) => {
  // Initialize React Hook Form
  const methods = useForm({
    defaultValues: {
      author: '',
      organisation: '',
      date: new Date().toISOString().split('T')[0],
      version: '1.4.0-2025.06',
      plant_type: null,
      measurement_location: []
    }
  });

  // Use schema form store
  const {
    formData,
    currentStep,
    visitedSteps,
    validationResults,
    exportValidation,
    isValidating,
    setCurrentStep,
    markStepVisited,
    validateStep,
    validateForExport,
    exportToJSON,
    initializeFormData
  } = useFormStore();

  // Initialize form data on mount
  React.useEffect(() => {
    if (!formData.author && !formData.organisation) {
      initializeFormData({
        author: '',
        organisation: '',
        date: new Date().toISOString().split('T')[0],
        version: '1.4.0-2025.06',
        plant_type: null,
        measurement_location: []
      });
    }
  }, [formData, initializeFormData]);

  // Use schema form hook for the current step
  const {
    validateCurrentStep,
    canProceedToNextStep
  } = useSchemaForm({ step: currentStep });

  const totalSteps = Object.keys(ENHANCED_STEP_CONFIGURATIONS).length;

  // Navigation functions
  const nextStep = async () => {
    if (currentStep < totalSteps - 1) {
      // Validate current step before proceeding
      const isValid = await validateCurrentStep();
      if (isValid || currentStep === totalSteps - 2) { // Allow proceeding to review step
        const next = currentStep + 1;
        setCurrentStep(next);
        markStepVisited(next);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      markStepVisited(prev);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStep(stepIndex);
      markStepVisited(stepIndex);
    }
  };

  // Export functionality
  const handleExport = async () => {
    const exportResult = await validateForExport();
    
    if (exportResult.canExport) {
      const jsonData = exportToJSON();
      
      if (onExport) {
        onExport(JSON.parse(jsonData));
      } else {
        // Default download behavior
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'iea-task43-data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
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

    const stepValidation = validationResults.stepValidations[stepIndex];
    if (!stepValidation) {
      return 'incomplete';
    }

    return stepValidation.isValid ? 'complete' : 'incomplete';
  };

  const stepConfigs = Object.entries(ENHANCED_STEP_CONFIGURATIONS);

  return (
    <FormProvider {...methods}>
      <div className={`space-y-8 ${className}`}>
        {/* Progress Steps */}
      <nav className="mb-8" role="navigation" aria-label="Form progress">
        <div className="professional-card p-6 mb-8">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Progress</span>
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} of {totalSteps} steps
              </span>
            </div>
            <div className="w-full bg-border/30 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stepConfigs.map(([stepIndexStr, config], index) => {
              const stepIndex = parseInt(stepIndexStr);
              const status = getStepStatus(stepIndex);
              
              return (
                <button
                  key={stepIndex}
                  type="button"
                  onClick={() => goToStep(stepIndex)}
                  className={cn(
                    "group relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30",
                    status === 'current' && "bg-primary/10 ring-1 ring-primary/20",
                    status === 'complete' && "opacity-100 hover:opacity-100",
                    status === 'incomplete' && "opacity-75 hover:opacity-100",
                    status === 'unvisited' && "opacity-50 hover:opacity-75"
                  )}
                  aria-label={`Go to step ${stepIndex + 1}: ${config.title}`}
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
                      stepIndex + 1
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
                    {config.title}
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
            onClick={prevStep}
            disabled={currentStep === 0}
            variant="outline"
            className="border-primary/20 hover:border-primary hover:bg-primary/5 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Step {currentStep + 1} of {totalSteps}</span>
              <span className="text-xs mx-2">•</span>
              <span>{ENHANCED_STEP_CONFIGURATIONS[currentStep]?.title}</span>
            </div>
            
            {/* Step validation status */}
            <StepValidationSummary 
              step={currentStep}
              validationResults={validationResults}
            />
          </div>

          <Button
            type="button"
            onClick={currentStep === totalSteps - 1 ? handleExport : nextStep}
            disabled={isValidating || (currentStep < totalSteps - 1 && !canProceedToNextStep())}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-professional hover:shadow-professional-hover transition-all duration-300 hover:-translate-y-0.5"
          >
            {currentStep === totalSteps - 1 ? (
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

      {/* Validation Loading State */}
      {isValidating && (
        <div className="professional-card p-6 bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <div>
              <h3 className="font-medium text-blue-800">Validating Against Schema</h3>
              <p className="text-sm text-blue-700">
                Checking compliance with IEA Task 43 requirements...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Export Validation Error */}
      {exportValidation && !exportValidation.canExport && currentStep === totalSteps - 1 && (
        <div className="professional-card p-6 bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-red-800">Export Blocked - Schema Validation Issues</h3>
              <p className="text-sm text-red-700">
                Your data cannot be exported because it doesn't meet IEA Task 43 schema requirements.
                Please fix the following issues:
              </p>
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                {exportValidation.blockingErrors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm text-red-700 bg-red-100/50 p-2 rounded">
                    <span className="font-medium">{error.schemaPath}:</span> {error.message}
                    {error.suggestedFix && (
                      <div className="text-xs text-red-600 mt-1 italic">
                        Suggestion: {error.suggestedFix}
                      </div>
                    )}
                  </div>
                ))}
                {exportValidation.blockingErrors.length > 5 && (
                  <div className="text-sm text-gray-600 italic">
                    ... and {exportValidation.blockingErrors.length - 5} more issues
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="space-y-8">
        {/* Current Step Content */}
        {currentStep < totalSteps - 1 ? (
          currentStep === 0 ? (
            <SchemaBasicInfoStep />
          ) : currentStep === 1 ? (
            <SchemaMeasurementLocationStep />
          ) : (
            <DynamicFormStep
              step={currentStep}
              config={ENHANCED_STEP_CONFIGURATIONS[currentStep]}
            />
          )
        ) : (
          /* Review Step */
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Review & Export</h2>
              <p className="text-muted-foreground">
                Review your data and export to IEA Task 43 compliant JSON format
              </p>
            </div>
            
            <SchemaValidationFeedback
              validationResults={validationResults}
              exportValidation={exportValidation}
              showDetails={true}
            />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="professional-card p-6">
        <div className="flex justify-between items-center">
          <Button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            variant="outline"
            className="border-primary/20 hover:border-primary hover:bg-primary/5 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <Button
            type="button"
            onClick={currentStep === totalSteps - 1 ? handleExport : nextStep}
            disabled={isValidating || (currentStep < totalSteps - 1 && !canProceedToNextStep())}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-professional hover:shadow-professional-hover transition-all duration-300 hover:-translate-y-0.5"
          >
            {currentStep === totalSteps - 1 ? (
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
      </div>
    </FormProvider>
  );
};