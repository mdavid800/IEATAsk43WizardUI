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
  { id: 'measurements', name: 'Measurement Points', component: MeasurementStep },
  { id: 'sensors', name: 'Sensors', component: SensorStep },
  { id: 'review', name: 'Review & Export', component: ReviewStep },
];

export function FormWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const methods = useForm<IEATask43Schema>({
    defaultValues: {
      author: '',
      organisation: '',
      date: new Date().toISOString().split('T')[0],
      version: '1.3.0-2024.03',
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

  const onSubmit = (data: IEATask43Schema) => {
    if (currentStep === steps.length - 1) {
      // Format the data according to the schema
      const formattedData = {
        ...data,
        measurement_location: data.measurement_location.map(location => ({
          ...location,
          update_at: new Date().toISOString(),
          logger_main_config: location.logger_main_config?.map(logger => ({
            ...logger,
            update_at: new Date().toISOString(),
            date_to: logger.date_to || null,
            clock_is_auto_synced: true
          })),
          measurement_point: location.measurement_point.map(point => ({
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
        }))
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
      <nav className="mb-8">
        <div className="flex items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div className={cn(
                  "step-indicator",
                  index <= currentStep && "active"
                )}>
                  <div className={cn(
                    "step-number",
                    index <= currentStep && "text-primary",
                    index === currentStep && "shadow-lg shadow-primary/20",
                    index < currentStep && "bg-primary text-white"
                  )}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                </div>
                <span className={cn(
                  "step-text",
                  index <= currentStep ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.name}
                </span>
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

      {/* Form Content */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
          <div className="glass-card p-6 shadow-xl shadow-primary/5">
            <CurrentStepComponent />
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              onClick={prev}
              disabled={currentStep === 0}
              variant="outline"
              className="border-primary/20 hover:border-primary/50 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
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