import React from 'react';
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { cn } from '../utils/cn';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { LocationStep } from './steps/LocationStep';
import { LoggerStep } from './steps/LoggerStep';
import { MeasurementStep } from './steps/MeasurementStep';
import { SensorsStep } from './steps/SensorStep';
import { ReviewStep } from './steps/ReviewStep';
import { Button } from './ui/button';
import type { IEATask43Schema } from '../types/schema';

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

  const CurrentStepComponent = steps[currentStep].component;

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  const onSubmit = (data: IEATask43Schema) => {
    if (currentStep === steps.length - 1) {
      // Use custom plant type if selected
      // If plant_type is 'custom', use the value from the input field (which will be set to plant_type).
      // No need to reference plant_type_custom anymore.
      const formattedData = {
        ...data,
        measurement_location: [{
          ...data.measurement_location[0],
          update_at: new Date().toISOString(),
          logger_main_config: data.measurement_location[0].logger_main_config?.map(logger => ({
            ...logger,
            update_at: new Date().toISOString(),
            date_to: logger.date_to || null,
            clock_is_auto_synced: true
          })),
          measurement_point: data.measurement_location[0].measurement_point.map(point => ({
            ...point,
            update_at: new Date().toISOString(),
            sensor: point.sensor?.map(sensor => ({
              ...sensor,
              update_at: new Date().toISOString(),
              calibration: sensor.calibration?.map(cal => ({
                ...cal,
                update_at: new Date().toISOString(),
                calibration_uncertainty: cal.calibration_uncertainty?.map(unc => ({
                  ...unc
                }))
              }))
            })),
            logger_measurement_config: point.logger_measurement_config.map(config => ({
              ...config,
              update_at: new Date().toISOString(),
              column_name: config.column_name.map(col => ({
                ...col,
                update_at: new Date().toISOString()
              }))
            })),
            mounting_arrangement: point.mounting_arrangement?.map(mount => ({
              ...mount,
              update_at: new Date().toISOString()
            })),
            interference_structures: point.interference_structures?.map(structure => ({
              ...structure,
              update_at: new Date().toISOString()
            }))
          }))
        }]
      };

      // Export as JSON file
      const jsonString = JSON.stringify(formattedData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'iea-task43-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(index)}
                className={cn(
                  "group relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30",
                  index === currentStep && "bg-primary/10 ring-1 ring-primary/20",
                  index < currentStep && "opacity-75 hover:opacity-100"
                )}
                aria-label={`Go to step ${index + 1}: ${step.name}`}
                tabIndex={0}
              >
                {/* Step Number/Check */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-all duration-200",
                  index < currentStep && "bg-primary text-white shadow-sm",
                  index === currentStep && "bg-primary text-white shadow-md ring-2 ring-primary/30",
                  index > currentStep && "bg-border/40 text-muted-foreground group-hover:bg-primary/20"
                )}>
                  {index < currentStep ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step Label */}
                <span className={cn(
                  "text-xs font-medium text-center leading-tight transition-colors duration-200",
                  index <= currentStep ? "text-primary" : "text-muted-foreground",
                  index === currentStep && "font-semibold"
                )}>
                  {step.name}
                </span>

                {/* Current Step Indicator */}
                {index === currentStep && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" />
                )}
              </button>
            ))}
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