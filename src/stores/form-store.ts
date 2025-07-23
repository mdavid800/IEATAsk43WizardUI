import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { schemaValidator, type ValidationResult, type FieldValidationResult, type ExportValidationResult } from '../services/schema-validator';
import { schemaService } from '../services/schema-service';
import type { IEATask43Schema, MeasurementLocation, MeasurementPoint } from '../types/schema';

export interface FormHelperData {
  // Campaign information (form-only)
  campaignStatus?: 'live' | 'historical';
  startDate?: string;
  endDate?: string;
  
  // UI helpers
  measurementPointHelpers: Record<string, {
    statistic_type_id?: string;
    unit?: string;
  }>;
  
  // Validation helpers
  validationCache: Record<string, CachedValidationResult>;
  lastValidated: string;
}

export interface CachedValidationResult {
  result: FieldValidationResult;
  timestamp: number;
  dataFingerprint: string;
}

export interface SchemaValidationResults {
  isValid: boolean;
  errors: any[];
  warnings: any[];
  fieldValidations: Record<string, FieldValidationResult>;
  stepValidations: Record<number, StepValidationResult>;
}

export interface StepValidationResult {
  isValid: boolean;
  errors: any[];
  warnings: any[];
  canProceed: boolean;
}

export interface SchemaFormStore {
  // Schema-compliant data
  formData: IEATask43Schema;
  
  // Form-only data (not exported)
  formHelpers: FormHelperData;
  
  // Validation state
  validationResults: SchemaValidationResults;
  exportValidation: ExportValidationResult | null;
  
  // UI state
  currentStep: number;
  visitedSteps: Set<number>;
  isDirty: boolean;
  isValidating: boolean;
  
  // Schema-driven actions
  updateField: (path: string, value: any) => Promise<void>;
  updateFieldSync: (path: string, value: any) => void;
  validateField: (path: string) => Promise<FieldValidationResult>;
  validateStep: (step: number) => Promise<StepValidationResult>;
  validateForExport: () => Promise<ExportValidationResult>;
  
  // Array management (schema-aware)
  addArrayItem: (path: string, template?: any) => void;
  removeArrayItem: (path: string, index: number) => void;
  moveArrayItem: (path: string, fromIndex: number, toIndex: number) => void;
  
  // Navigation actions
  setCurrentStep: (step: number) => void;
  markStepVisited: (step: number) => void;
  
  // Export functionality
  generateExportData: () => IEATask43Schema;
  exportToJSON: () => string;
  
  // Reset and initialization
  resetForm: () => void;
  initializeFormData: (data?: Partial<IEATask43Schema>) => void;
}

const createInitialFormData = (): IEATask43Schema => ({
  author: '',
  organisation: '',
  date: new Date().toISOString().split('T')[0],
  version: '1.4.0-2025.06',
  license: null,
  plant_name: null,
  plant_type: null,
  campaignStatus: 'live',
  startDate: new Date().toISOString().split('T')[0],
  endDate: undefined,
  measurement_location: []
});

const createInitialFormHelpers = (): FormHelperData => ({
  campaignStatus: 'live',
  startDate: new Date().toISOString().split('T')[0],
  endDate: undefined,
  measurementPointHelpers: {},
  validationCache: {},
  lastValidated: new Date().toISOString()
});

const createInitialValidationResults = (): SchemaValidationResults => ({
  isValid: false,
  errors: [],
  warnings: [],
  fieldValidations: {},
  stepValidations: {
    0: { isValid: false, errors: [], warnings: [], canProceed: false },
    1: { isValid: false, errors: [], warnings: [], canProceed: false },
    2: { isValid: false, errors: [], warnings: [], canProceed: false },
    3: { isValid: false, errors: [], warnings: [], canProceed: false },
    4: { isValid: false, errors: [], warnings: [], canProceed: false },
    5: { isValid: true, errors: [], warnings: [], canProceed: true }
  }
});

// Helper to get value at path
const getValueAtPath = (obj: any, path: string): any => {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    
    // Handle array notation like 'measurement_location[0]'
    if (part.includes('[') && part.includes(']')) {
      const [arrayName, indexStr] = part.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      current = current[arrayName]?.[index];
    } else {
      current = current[part];
    }
  }
  
  return current;
};

// Helper to set value at path
const setValueAtPath = (obj: any, path: string, value: any): any => {
  const parts = path.split('.');
  const result = { ...obj };
  let current = result;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    if (part.includes('[') && part.includes(']')) {
      const [arrayName, indexStr] = part.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      
      if (!current[arrayName]) current[arrayName] = [];
      if (!current[arrayName][index]) current[arrayName][index] = {};
      current = current[arrayName][index];
    } else {
      if (!current[part]) current[part] = {};
      current = current[part];
    }
  }
  
  const lastPart = parts[parts.length - 1];
  if (lastPart.includes('[') && lastPart.includes(']')) {
    const [arrayName, indexStr] = lastPart.split('[');
    const index = parseInt(indexStr.replace(']', ''));
    if (!current[arrayName]) current[arrayName] = [];
    current[arrayName][index] = value;
  } else {
    current[lastPart] = value;
  }
  
  return result;
};

// Create data fingerprint for caching
const createDataFingerprint = (data: any): string => {
  return JSON.stringify(data).slice(0, 100); // Simple fingerprint
};

export const useFormStore = create<SchemaFormStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      formData: createInitialFormData(),
      formHelpers: createInitialFormHelpers(),
      validationResults: createInitialValidationResults(),
      exportValidation: null,
      currentStep: 0,
      visitedSteps: new Set([0]),
      isDirty: false,
      isValidating: false,

      // Schema-driven actions
      updateField: async (path: string, value: any) => {
        set({ isValidating: true });
        
        try {
          const currentData = get().formData;
          const updatedData = setValueAtPath(currentData, path, value);
          
          set({ 
            formData: updatedData,
            isDirty: true
          });
          
          // Validate the updated field
          const fieldValidation = await get().validateField(path);
          
          set(state => ({
            validationResults: {
              ...state.validationResults,
              fieldValidations: {
                ...state.validationResults.fieldValidations,
                [path]: fieldValidation
              }
            }
          }));
          
        } finally {
          set({ isValidating: false });
        }
      },

      updateFieldSync: (path: string, value: any) => {
        const currentData = get().formData;
        const updatedData = setValueAtPath(currentData, path, value);
        
        set({ 
          formData: updatedData,
          isDirty: true
        });
      },

      validateField: async (path: string): Promise<FieldValidationResult> => {
        const { formData, formHelpers } = get();
        const value = getValueAtPath(formData, path);
        
        // Check cache first
        const cacheKey = `${path}`;
        const cached = formHelpers.validationCache[cacheKey];
        const dataFingerprint = createDataFingerprint(value);
        
        if (cached && cached.dataFingerprint === dataFingerprint) {
          // Cache hit - return cached result
          return cached.result;
        }
        
        // Perform validation
        const result = await schemaValidator.validateField(path, value, formData);
        
        // Update cache
        set(state => ({
          formHelpers: {
            ...state.formHelpers,
            validationCache: {
              ...state.formHelpers.validationCache,
              [cacheKey]: {
                result,
                timestamp: Date.now(),
                dataFingerprint
              }
            }
          }
        }));
        
        return result;
      },

      validateStep: async (step: number): Promise<StepValidationResult> => {
        const { formData } = get();
        
        // Get the schema path for this step
        const stepSchemaPaths = getStepSchemaPaths(step);
        let allErrors: any[] = [];
        let allWarnings: any[] = [];
        
        // Validate all fields in this step
        for (const path of stepSchemaPaths) {
          const fieldResult = await get().validateField(path);
          if (!fieldResult.isValid) {
            allErrors.push(...fieldResult.errors);
          }
        }
        
        const isValid = allErrors.length === 0;
        const canProceed = isValid; // Could be more nuanced based on business rules
        
        const result: StepValidationResult = {
          isValid,
          errors: allErrors,
          warnings: allWarnings,
          canProceed
        };
        
        // Update step validation results
        set(state => ({
          validationResults: {
            ...state.validationResults,
            stepValidations: {
              ...state.validationResults.stepValidations,
              [step]: result
            }
          }
        }));
        
        return result;
      },

      validateForExport: async (): Promise<ExportValidationResult> => {
        const { formData } = get();
        const exportData = get().generateExportData();
        
        const result = await schemaValidator.validateForExport(exportData);
        
        set({ exportValidation: result });
        
        return result;
      },

      // Array management
      addArrayItem: (path: string, template?: any) => {
        const currentData = get().formData;
        const currentArray = getValueAtPath(currentData, path) || [];
        
        // Use schema template if not provided
        const newItem = template || schemaService.createDefaultObject(`${path}.items`);
        
        // Add unique identifiers if needed
        if (path.includes('measurement_location')) {
          newItem.uuid = crypto.randomUUID();
          newItem.update_at = new Date().toISOString();
          newItem.measurement_point = [];
        }
        
        if (path.includes('measurement_point')) {
          newItem.update_at = new Date().toISOString();
          newItem.logger_measurement_config = [];
          newItem.sensor = [];
        }
        
        const updatedArray = [...currentArray, newItem];
        const updatedData = setValueAtPath(currentData, path, updatedArray);
        
        set({ 
          formData: updatedData,
          isDirty: true
        });
      },

      removeArrayItem: (path: string, index: number) => {
        const currentData = get().formData;
        const currentArray = getValueAtPath(currentData, path) || [];
        
        if (index >= 0 && index < currentArray.length) {
          const updatedArray = currentArray.filter((_: any, i: number) => i !== index);
          const updatedData = setValueAtPath(currentData, path, updatedArray);
          
          set({ 
            formData: updatedData,
            isDirty: true
          });
        }
      },

      moveArrayItem: (path: string, fromIndex: number, toIndex: number) => {
        const currentData = get().formData;
        const currentArray = getValueAtPath(currentData, path) || [];
        
        if (fromIndex >= 0 && fromIndex < currentArray.length && 
            toIndex >= 0 && toIndex < currentArray.length) {
          const updatedArray = [...currentArray];
          const item = updatedArray[fromIndex];
          updatedArray.splice(fromIndex, 1);
          updatedArray.splice(toIndex, 0, item);
          
          const updatedData = setValueAtPath(currentData, path, updatedArray);
          
          set({ 
            formData: updatedData,
            isDirty: true
          });
        }
      },

      // Navigation
      setCurrentStep: (step: number) => {
        set({ currentStep: step });
        get().markStepVisited(step);
      },

      markStepVisited: (step: number) => {
        set(state => ({
          visitedSteps: new Set([...state.visitedSteps, step])
        }));
      },

      // Export functionality
      generateExportData: (): IEATask43Schema => {
        const { formData, formHelpers } = get();
        
        // Create a clean copy without form-only fields
        const cleanedData = { ...formData };
        
        // Remove form-only fields from root
        delete (cleanedData as any).campaignStatus;
        delete (cleanedData as any).startDate;
        delete (cleanedData as any).endDate;
        
        // Remove form-only fields from measurement points
        if (cleanedData.measurement_location) {
          cleanedData.measurement_location = cleanedData.measurement_location.map(location => ({
            ...location,
            measurement_point: location.measurement_point.map(point => {
              const cleanedPoint = { ...point };
              delete (cleanedPoint as any).statistic_type_id;
              delete (cleanedPoint as any).unit;
              return cleanedPoint;
            })
          }));
        }
        
        return cleanedData;
      },

      exportToJSON: (): string => {
        const exportData = get().generateExportData();
        return JSON.stringify(exportData, null, 2);
      },

      // Reset and initialization
      resetForm: () => {
        set({
          formData: createInitialFormData(),
          formHelpers: createInitialFormHelpers(),
          validationResults: createInitialValidationResults(),
          exportValidation: null,
          currentStep: 0,
          visitedSteps: new Set([0]),
          isDirty: false,
          isValidating: false
        });
      },

      initializeFormData: (data?: Partial<IEATask43Schema>) => {
        const initialData = data ? { ...createInitialFormData(), ...data } : createInitialFormData();
        
        set({
          formData: initialData,
          formHelpers: createInitialFormHelpers(),
          validationResults: createInitialValidationResults(),
          isDirty: false
        });
      }
    })),
    {
      name: 'iea-form-store',
      partialize: (state) => ({
        formData: state.formData,
        formHelpers: state.formHelpers,
        currentStep: state.currentStep,
        visitedSteps: Array.from(state.visitedSteps)
      })
    }
  )
);

// Helper function to get schema paths for each step
const getStepSchemaPaths = (step: number): string[] => {
  switch (step) {
    case 0: // Basic Information
      return [
        'author',
        'organisation', 
        'date',
        'version',
        'plant_name',
        'plant_type'
      ];
    case 1: // Measurement Locations
      return [
        'measurement_location'
      ];
    case 2: // Logger Configuration
      return [
        'measurement_location.items.properties.logger_main_config'
      ];
    case 3: // Sensors
      return [
        'measurement_location.items.properties.sensors'
      ];
    case 4: // Measurement Points
      return [
        'measurement_location.items.properties.measurement_point'
      ];
    case 5: // Review & Export
      return [];
    default:
      return [];
  }
};

// Export store instance for direct access
export const formStore = useFormStore.getState();