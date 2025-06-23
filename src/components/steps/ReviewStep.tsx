import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FileJson, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';
import type { IEATask43Schema } from '../../types/schema';
import {
  validateBasicInfo,
  validateLocations,
  validateLoggers,
  validateMeasurements,
  validateSensors,
  type ValidationResult,
} from '../../utils/validation';

export function ReviewStep() {
  const { watch } = useFormContext<IEATask43Schema>();
  const formData = watch();

  const validateData = (): Record<string, ValidationResult> => {
    const data = formData;
    return {
      basicInfo: validateBasicInfo(data),
      locations: validateLocations(data),
      loggers: validateLoggers(data),
      measurements: validateMeasurements(data),
      sensors: validateSensors(data),
    };
  };


  const validationResults = validateData();
  const isValid = Object.values(validationResults).every(result => result.valid);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary mb-2">Review & Export</h2>
        <Button 
          type="submit"
          className="bg-primary hover:bg-primary/90"
          disabled={!isValid}
        >
          <FileJson className="w-4 h-4 mr-2" />
          Export JSON
        </Button>
      </div>

      {/* Validation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(validationResults).map(([section, result]) => (
          <div 
            key={section}
            className={cn(
              "p-4 rounded-lg border",
              result.valid 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.valid ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <h3 className="text-base font-medium capitalize">
                {section.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
            </div>
            {!result.valid && result.issues.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {result.issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="select-none">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Data Preview */}
      <div className="mt-8">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileJson className="w-5 h-5 text-primary" />
            <h3 className="text-base font-medium">Data Preview</h3>
          </div>
          <pre className="text-sm font-mono bg-background p-4 rounded-md overflow-x-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
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
              Review your data above. When you're ready, click the "Export JSON" button to download your IEA Task 43 data model file.
              Make sure to address any validation issues before exporting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}