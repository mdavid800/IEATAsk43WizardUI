# Design Document

## Overview

This design implements a robust state management solution using Zustand to replace the current React Hook Form-only approach. The solution addresses inconsistent state updates across form steps, preview JSON generation, and export functionality by centralizing all form state in a Zustand store while maintaining React Hook Form for form validation and UI interactions.

The key insight is that React Hook Form's `watch()` method creates reactive subscriptions that may not always trigger re-renders consistently, especially with deeply nested objects. By using Zustand as the single source of truth and syncing it bidirectionally with React Hook Form, we ensure consistent state updates across all components.

## Architecture

### State Management Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Store                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Form Data     │  │   UI State      │  │  Validation │ │
│  │   (IEATask43)   │  │   (current step,│  │   Status    │ │
│  │                 │  │   visited steps)│  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                React Hook Form                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Form Methods  │  │   Validation    │  │   UI Binding│ │
│  │   (setValue,    │  │   (validation   │  │   (register,│ │
│  │    getValues)   │  │    rules)       │  │    control) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Components                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Form Steps    │  │   Preview JSON  │  │   Export    │ │
│  │                 │  │                 │  │   Function  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┐
```

### Data Flow

1. **User Input** → React Hook Form → Zustand Store → All Subscribed Components
2. **Navigation** → Zustand Store → Form Wizard State → Step Components
3. **Validation** → Zustand Store → Validation Status → UI Indicators
4. **Export** → Zustand Store → JSON Generation → File Download

## Components and Interfaces

### Core Store Interface

```typescript
interface FormStore {
  // Form Data
  formData: IEATask43Schema;
  
  // UI State
  currentStep: number;
  visitedSteps: Set<number>;
  
  // Validation State
  validationResults: Record<number, ValidationResult>;
  isFormValid: boolean;
  
  // Actions
  updateFormData: (data: Partial<IEATask43Schema>) => void;
  updateNestedField: (path: string, value: any) => void;
  setCurrentStep: (step: number) => void;
  markStepVisited: (step: number) => void;
  updateValidation: (step: number, result: ValidationResult) => void;
  resetForm: () => void;
  
  // Computed Values
  getStepValidation: (step: number) => ValidationResult;
  getExportData: () => IEATask43Schema;
}
```

### Validation Result Interface

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  path: string;
}
```

### Store Implementation Structure

```typescript
// stores/form-store.ts
export const useFormStore = create<FormStore>((set, get) => ({
  // Initial state
  formData: getDefaultFormData(),
  currentStep: 0,
  visitedSteps: new Set([0]),
  validationResults: {},
  isFormValid: false,
  
  // Actions implementation
  updateFormData: (data) => {
    // Immutable update with validation trigger
  },
  
  updateNestedField: (path, value) => {
    // Deep update using immer or similar
  },
  
  // ... other actions
}));
```

### React Hook Form Integration

```typescript
// hooks/use-form-sync.ts
export const useFormSync = () => {
  const { formData, updateFormData } = useFormStore();
  const methods = useForm<IEATask43Schema>({
    defaultValues: formData,
    mode: 'onChange'
  });
  
  // Bidirectional sync between Zustand and RHF
  useEffect(() => {
    const subscription = methods.watch((data) => {
      updateFormData(data);
    });
    return () => subscription.unsubscribe();
  }, [methods.watch, updateFormData]);
  
  // Sync Zustand changes back to RHF
  useEffect(() => {
    methods.reset(formData);
  }, [formData, methods.reset]);
  
  return methods;
};
```

## Data Models

### Enhanced Form Data Structure

The existing `IEATask43Schema` interface will be used as-is, but the store will add metadata:

```typescript
interface EnhancedFormData {
  data: IEATask43Schema;
  metadata: {
    lastUpdated: string;
    version: string;
    isDirty: boolean;
    touchedFields: Set<string>;
  };
}
```

### Validation State Model

```typescript
interface ValidationState {
  stepValidations: Record<number, StepValidation>;
  globalValidation: GlobalValidation;
  lastValidated: string;
}

interface StepValidation {
  stepIndex: number;
  isValid: boolean;
  errors: FieldError[];
  warnings: FieldWarning[];
  requiredFields: string[];
  completedFields: string[];
}
```

## Error Handling

### Validation Error Management

1. **Field-Level Errors**: Captured by React Hook Form and synced to Zustand
2. **Step-Level Errors**: Aggregated validation results stored in Zustand
3. **Schema-Level Errors**: JSON schema validation results for export compliance
4. **Network Errors**: Error states for any future API integrations

### Error Recovery Strategies

```typescript
interface ErrorRecovery {
  retryValidation: (step?: number) => void;
  clearErrors: (field?: string) => void;
  resetToLastValid: () => void;
  exportWithWarnings: () => boolean;
}
```

### Error Display Strategy

- **Inline Errors**: Field-level validation errors shown immediately
- **Step Errors**: Aggregated errors shown in step navigation
- **Global Errors**: Export-blocking errors shown in review step
- **Toast Notifications**: For system-level errors and confirmations

## Testing Strategy

### Unit Testing

1. **Store Actions**: Test all Zustand store actions in isolation
2. **Validation Logic**: Test validation functions with various data scenarios
3. **Data Transformations**: Test nested field updates and immutability
4. **Computed Values**: Test derived state calculations

### Integration Testing

1. **Form Sync**: Test bidirectional sync between Zustand and React Hook Form
2. **Step Navigation**: Test state persistence across step changes
3. **Validation Flow**: Test validation triggering and result propagation
4. **Export Process**: Test JSON generation from store state

### Component Testing

1. **Form Steps**: Test individual step components with mocked store
2. **Preview Component**: Test JSON preview updates with state changes
3. **Export Component**: Test export functionality with various validation states
4. **Navigation**: Test step navigation with validation constraints

### Performance Testing

1. **Large Datasets**: Test performance with maximum expected data volumes
2. **Rapid Updates**: Test store performance with rapid successive updates
3. **Memory Usage**: Monitor memory usage during extended form sessions
4. **Re-render Optimization**: Verify selective re-rendering with store subscriptions

## Implementation Phases

### Phase 1: Core Store Setup
- Install Zustand and configure basic store structure
- Implement core form data management actions
- Create store persistence layer for form recovery

### Phase 2: Form Integration
- Create React Hook Form sync hook
- Update FormWizard to use Zustand store
- Implement bidirectional data synchronization

### Phase 3: Validation Integration
- Move validation logic to store actions
- Update step validation to use store state
- Implement real-time validation updates

### Phase 4: UI State Management
- Move step navigation state to store
- Update progress indicators to use store state
- Implement consistent error display

### Phase 5: Export Enhancement
- Update JSON generation to use store state
- Implement export validation using store data
- Add export state management (loading, errors)

### Phase 6: Performance Optimization
- Implement selective subscriptions for components
- Add memoization for expensive computations
- Optimize re-render patterns

## Migration Strategy

### Backward Compatibility
- Maintain existing component interfaces during transition
- Gradual migration of components to use store
- Fallback mechanisms for any integration issues

### Data Migration
- No data migration needed (same data structures)
- Form state will be reset on first load with new system
- Consider adding form recovery from localStorage

### Testing During Migration
- Parallel testing of old and new state management
- Feature flags for gradual rollout
- Comprehensive regression testing

## Performance Considerations

### Store Optimization
- Use immer for immutable updates to prevent unnecessary re-renders
- Implement selective subscriptions using Zustand's selector pattern
- Debounce validation updates to prevent excessive computation

### Component Optimization
- Memoize expensive validation computations
- Use React.memo for components that don't need frequent updates
- Implement virtual scrolling for large sensor/measurement lists

### Memory Management
- Clear validation results for unvisited steps
- Implement cleanup for removed form sections
- Monitor store size and implement cleanup strategies

## Security Considerations

### Data Validation
- Client-side validation for UX (existing)
- Schema validation before export (existing)
- Input sanitization for all form fields

### State Protection
- Immutable state updates to prevent accidental mutations
- Type safety throughout the store implementation
- Validation of all store actions

This design provides a robust foundation for consistent state management while maintaining the existing user experience and adding reliability to the form system.