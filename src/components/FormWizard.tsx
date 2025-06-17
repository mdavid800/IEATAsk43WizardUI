import React from 'react';
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { cn } from '../utils/cn';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { LocationStep } from './steps/LocationStep';
import { LoggerStep } from './steps/LoggerStep';
import { MeasurementStep } from './steps/MeasurementStep';
import { SensorStep } from './steps/SensorStep';
import { ReviewStep } from './steps/ReviewStep';
import { Button } from './ui/button';
import type { IEATask43Schema } from '../types/schema';

const steps = [
  { id: 'basic-info', name: 'Basic Information', component: BasicInfoStep },
  { id: 'location', name: 'Location & Properties', component: LocationStep },
  { id: 'loggers', name: 'Loggers', component: LoggerStep },
  { id: 'sensors', name: 'Sensors', component: SensorStep },
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
        <div className="flex items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => goToStep(index)}
                  className={cn(
                    "step-indicator group cursor-pointer transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full",
                    index <= currentStep && "active"
                  )}
                  aria-label={`Go to step ${index + 1}: ${step.name}`}
                  tabIndex={0}
                >
                  <div className={cn(
                    "step-number group-hover:border-primary/70 group-hover:shadow-md transition-all duration-200",
                    index <= currentStep && "active",
                    index < currentStep && "bg-primary text-white",
                    index === currentStep && "ring-2 ring-primary/30"
                  )}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(index)}
                  className={cn(
                    "step-text cursor-pointer transition-all duration-200 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1",
                    index <= currentStep ? "text-primary" : "text-muted-foreground",
                    index === currentStep && "font-semibold"
                  )}
                  aria-label={`Go to step ${index + 1}: ${step.name}`}
                  tabIndex={0}
                >
                  {step.name}
                </button>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "step-line flex-1 mx-4",
                  index < currentStep && "active"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Top Navigation */}
      <div className="flex justify-between items-center pt-4 pb-6 border-b border-border">
        <Button
          type="button"
          onClick={prev}
          disabled={currentStep === 0}
          variant="outline"
          className="border-border hover:border-primary/50 shadow-sm"
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
          className="bg-primary hover:bg-primary/90 shadow-sm"
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

      {/* Form Content */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
          <div className="glass-card p-6 shadow-sm">
            <CurrentStepComponent />
          </div>

          {/* Bottom Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              onClick={prev}
              disabled={currentStep === 0}
              variant="outline"
              className="border-border hover:border-primary/50 shadow-sm"
              aria-label={`Go to previous step: ${currentStep > 0 ? steps[currentStep - 1].name : 'None'}`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 shadow-sm"
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
        </form>
      </FormProvider>
    </div>
  );
}