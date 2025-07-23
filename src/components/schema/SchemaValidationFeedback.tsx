import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { SchemaValidationResults, ExportValidationResult } from '../../stores/form-store';

export interface ValidationFeedbackProps {
  validationResults: SchemaValidationResults;
  exportValidation?: ExportValidationResult | null;
  showDetails?: boolean;
  className?: string;
}

export interface FieldValidationFeedbackProps {
  fieldPath: string;
  validation: any;
  className?: string;
}

export interface StepValidationSummaryProps {
  step: number;
  validationResults: SchemaValidationResults;
  className?: string;
}

export const SchemaValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  validationResults,
  exportValidation,
  showDetails = true,
  className = ''
}) => {
  const { isValid, errors, warnings } = validationResults;

  const getValidationIcon = () => {
    if (isValid && errors.length === 0) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (errors.length > 0) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (warnings.length > 0) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  const getValidationStatus = () => {
    if (isValid && errors.length === 0) return 'Valid';
    if (errors.length > 0) return 'Validation Errors';
    if (warnings.length > 0) return 'Warnings';
    return 'Unknown';
  };

  const getStatusColor = () => {
    if (isValid && errors.length === 0) return 'text-green-700 bg-green-50 border-green-200';
    if (errors.length > 0) return 'text-red-700 bg-red-50 border-red-200';
    if (warnings.length > 0) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-blue-700 bg-blue-50 border-blue-200';
  };

  if (!showDetails && isValid && errors.length === 0 && warnings.length === 0) {
    return null; // Don't show anything if everything is valid and details are hidden
  }

  return (
    <Card className={`${getStatusColor()} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {getValidationIcon()}
          <CardTitle className="text-lg">{getValidationStatus()}</CardTitle>
          <Badge variant={isValid && errors.length === 0 ? "default" : "destructive"}>
            {errors.length} errors, {warnings.length} warnings
          </Badge>
        </div>
        <CardDescription>
          Schema validation results for IEA Task 43 compliance
        </CardDescription>
      </CardHeader>

      {showDetails && (errors.length > 0 || warnings.length > 0) && (
        <CardContent className="space-y-4">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Validation Errors
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-sm bg-red-100/50 p-2 rounded border border-red-200">
                    <div className="font-medium text-red-800">
                      {error.schemaPath || error.dataPath}
                    </div>
                    <div className="text-red-700">{error.message}</div>
                    {error.suggestedFix && (
                      <div className="text-red-600 text-xs mt-1 italic">
                        Suggestion: {error.suggestedFix}
                      </div>
                    )}
                  </div>
                ))}
                {errors.length > 10 && (
                  <div className="text-sm text-red-600 italic">
                    ... and {errors.length - 10} more errors
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Warnings
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {warnings.slice(0, 5).map((warning, index) => (
                  <div key={index} className="text-sm bg-yellow-100/50 p-2 rounded border border-yellow-200">
                    <div className="font-medium text-yellow-800">
                      {warning.schemaPath || warning.dataPath}
                    </div>
                    <div className="text-yellow-700">{warning.message}</div>
                    {warning.suggestion && (
                      <div className="text-yellow-600 text-xs mt-1 italic">
                        {warning.suggestion}
                      </div>
                    )}
                  </div>
                ))}
                {warnings.length > 5 && (
                  <div className="text-sm text-yellow-600 italic">
                    ... and {warnings.length - 5} more warnings
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export validation status */}
          {exportValidation && (
            <div className="border-t pt-3">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {exportValidation.canExport ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                Export Status
              </h4>
              <p className="text-sm">
                {exportValidation.canExport 
                  ? 'Data is ready for export and complies with IEA Task 43 schema'
                  : `Export blocked by ${exportValidation.blockingErrors.length} critical errors`
                }
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export const FieldValidationFeedback: React.FC<FieldValidationFeedbackProps> = ({
  fieldPath,
  validation,
  className = ''
}) => {
  if (!validation || validation.isValid) return null;

  return (
    <div className={`text-sm text-red-600 flex items-start gap-1 mt-1 ${className}`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>
        {validation.errors?.[0]?.message || 'Validation error'}
        {validation.errors?.[0]?.suggestedFix && (
          <div className="text-xs text-red-500 mt-1 italic">
            {validation.errors[0].suggestedFix}
          </div>
        )}
      </div>
    </div>
  );
};

export const StepValidationSummary: React.FC<StepValidationSummaryProps> = ({
  step,
  validationResults,
  className = ''
}) => {
  const stepValidation = validationResults.stepValidations[step];
  
  if (!stepValidation) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Step validation not available
      </div>
    );
  }

  const { isValid, errors, warnings } = stepValidation;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {isValid ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-500" />
      )}
      <span className={isValid ? 'text-green-700' : 'text-red-700'}>
        {isValid ? 'Valid' : `${errors.length} errors`}
      </span>
      {warnings.length > 0 && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-yellow-600">{warnings.length} warnings</span>
        </>
      )}
    </div>
  );
};