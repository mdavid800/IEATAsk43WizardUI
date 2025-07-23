import { useEffect, useCallback } from 'react';
import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { useFormStore } from '../stores/form-store';
import { schemaService } from '../services/schema-service';
import type { IEATask43Schema } from '../types/schema';

export interface UseSchemaFormOptions {
  step?: number;
  enableAutoSave?: boolean;
  debounceMs?: number;
}

export interface UseSchemaFormReturn extends UseFormReturn<IEATask43Schema> {
  // Store integration
  storeData: IEATask43Schema;
  updateStoreField: (path: string, value: any) => Promise<void>;
  validateStoreField: (path: string) => Promise<any>;
  
  // Validation helpers
  isFieldValid: (fieldName: string) => boolean;
  getFieldError: (fieldName: string) => string | undefined;
  
  // Step management
  validateCurrentStep: () => Promise<boolean>;
  canProceedToNextStep: () => boolean;
  
  // Array helpers
  addArrayItem: (path: string, template?: any) => void;
  removeArrayItem: (path: string, index: number) => void;
}

export const useSchemaForm = (options: UseSchemaFormOptions = {}): UseSchemaFormReturn => {
  const {
    step = 0,
    enableAutoSave = true,
    debounceMs = 300
  } = options;

  // Get store state and actions
  const {
    formData,
    validationResults,
    updateField,
    validateField,
    validateStep,
    addArrayItem,
    removeArrayItem,
    setCurrentStep
  } = useFormStore();

  // Initialize React Hook Form with store data
  const methods = useForm<IEATask43Schema>({
    defaultValues: formData,
    mode: 'onChange'
  });

  // Sync store data to form when store changes
  useEffect(() => {
    methods.reset(formData);
  }, [formData, methods]);

  // Auto-save form changes to store (with debouncing)
  useEffect(() => {
    if (!enableAutoSave) return;

    const subscription = methods.watch((data, { name, type }) => {
      if (name && type === 'change') {
        const value = methods.getValues(name as any);
        
        // Debounce updates
        const timeoutId = setTimeout(() => {
          updateField(name, value);
        }, debounceMs);

        return () => clearTimeout(timeoutId);
      }
    });

    return () => subscription.unsubscribe();
  }, [methods, updateField, enableAutoSave, debounceMs]);

  // Update current step in store when step changes
  useEffect(() => {
    setCurrentStep(step);
  }, [step, setCurrentStep]);

  // Validation helpers
  const isFieldValid = useCallback((fieldName: string): boolean => {
    const fieldValidation = validationResults?.fieldValidations?.[fieldName];
    return fieldValidation?.isValid ?? true;
  }, [validationResults]);

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    const fieldValidation = validationResults?.fieldValidations?.[fieldName];
    return fieldValidation?.errors?.[0]?.message;
  }, [validationResults]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const stepValidation = await validateStep(step);
    return stepValidation.isValid;
  }, [validateStep, step]);

  const canProceedToNextStep = useCallback((): boolean => {
    const stepValidation = validationResults?.stepValidations?.[step];
    return stepValidation?.canProceed ?? false;
  }, [validationResults, step]);

  // Store integration methods
  const updateStoreField = useCallback(async (path: string, value: any) => {
    await updateField(path, value);
  }, [updateField]);

  const validateStoreField = useCallback(async (path: string) => {
    return await validateField(path);
  }, [validateField]);

  return {
    ...methods,
    storeData: formData,
    updateStoreField,
    validateStoreField,
    isFieldValid,
    getFieldError,
    validateCurrentStep,
    canProceedToNextStep,
    addArrayItem,
    removeArrayItem
  };
};

// Step-specific form hooks
export const useBasicInfoForm = () => {
  return useSchemaForm({ step: 0 });
};

export const useLocationForm = () => {
  return useSchemaForm({ step: 1 });
};

export const useLoggerForm = () => {
  return useSchemaForm({ step: 2 });
};

export const useSensorForm = () => {
  return useSchemaForm({ step: 3 });
};

export const useMeasurementForm = () => {
  return useSchemaForm({ step: 4 });
};

export const useReviewForm = () => {
  return useSchemaForm({ step: 5, enableAutoSave: false });
};

// Hook for schema-driven form field generation
export const useSchemaField = (fieldPath: string) => {
  const { getFieldError, isFieldValid, updateStoreField } = useSchemaForm();
  
  // Get field schema information
  const fieldSchema = schemaService.getSchemaProperty(fieldPath);
  const validationRules = schemaService.getValidationRules(fieldPath);
  const enumValues = schemaService.getEnumValues(fieldPath);
  
  return {
    schema: fieldSchema,
    validation: validationRules,
    enumValues,
    isValid: isFieldValid(fieldPath),
    error: getFieldError(fieldPath),
    updateField: (value: any) => updateStoreField(fieldPath, value)
  };
};