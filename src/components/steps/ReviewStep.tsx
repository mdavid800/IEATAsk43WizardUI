import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { FileJson, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateExportJson } from '../../utils/json-export';
import type { IEATask43Schema, Sensor } from '../../types/schema';

export function ReviewStep() {
  const { watch } = useFormContext<IEATask43Schema>();
  const formData = watch();
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(true);
  const [previewJson, setPreviewJson] = useState<string>('');
  const isGeneratingRef = useRef(false);
  const lastDataHashRef = useRef<string>('');

  // Simplified validation - just check if basic required sections exist
  const hasBasicInfo = !!(formData.author && formData.organisation && formData.plant_name && formData.plant_type && formData.version && formData.startDate);
  const hasLocations = !!(formData.measurement_location?.length);
  const hasLoggers = formData.measurement_location?.some(loc => loc.logger_main_config?.length > 0);
  const hasMeasurements = formData.measurement_location?.some(loc => loc.measurement_point?.length > 0);
  const hasSensors = formData.measurement_location?.some(loc =>
    Array.isArray(loc.sensors) && loc.sensors.filter(Boolean).length > 0
  );

  const sections = [
    { name: 'Basic Information', valid: hasBasicInfo },
    { name: 'Locations', valid: hasLocations },
    { name: 'Loggers', valid: hasLoggers },
    { name: 'Measurements', valid: hasMeasurements },
    { name: 'Sensors', valid: hasSensors }
  ];

  const isValid = sections.every(section => section.valid);
  const completedSections = sections.filter(section => section.valid).length;

  // Generate preview JSON asynchronously to prevent UI blocking
  useEffect(() => {
    // Create a hash of the form data to detect actual changes
    const dataHash = JSON.stringify(formData);
    
    // Only regenerate if data actually changed
    if (dataHash === lastDataHashRef.current || isGeneratingRef.current) {
      return;
    }

    const generatePreview = () => {
      isGeneratingRef.current = true;
      setIsGeneratingPreview(true);
      
      // Use setTimeout to allow the UI to render first
      setTimeout(() => {
        try {
          const exportData = generateExportJson(formData);
          const jsonString = JSON.stringify(exportData, null, 2);
          setPreviewJson(jsonString);
          lastDataHashRef.current = dataHash;
        } catch (error) {
          console.error('Error generating preview:', error);
          setPreviewJson('Error generating preview. Please check your data.');
          lastDataHashRef.current = dataHash;
        } finally {
          setIsGeneratingPreview(false);
          isGeneratingRef.current = false;
        }
      }, 100); // Small delay to allow UI to render
    };

    // Debounce rapid changes
    const timeoutId = setTimeout(generatePreview, 200);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [formData]);

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
              total + (Array.isArray(loc.sensors) ? loc.sensors.filter(Boolean).length : 0), 0) || 0}
          </div>
          <div className="text-sm text-muted-foreground">Sensor{(formData.measurement_location?.reduce((total, loc) =>
            total + (Array.isArray(loc.sensors) ? loc.sensors.filter(Boolean).length : 0), 0) || 0) !== 1 ? 's' : ''}</div>
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
    </div>
  );
}