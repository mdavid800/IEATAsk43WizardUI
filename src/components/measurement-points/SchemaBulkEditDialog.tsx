import React, { useState, useMemo, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import { schemaService } from '@/services/schema-service';
import { schemaValidator, type ValidationResult } from '@/services/schema-validator';
import { measurementTypeOptions, heightReferenceOptions, statisticTypeOptions } from '@/utils/enum-options';
import type { 
    MeasurementPoint, 
    MeasurementType, 
    HeightReference, 
    StatisticType,
    Sensor
} from '@/types/schema';

interface SchemaBulkEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRows: MeasurementPoint[];
    selectedIndices: number[];
    onBulkEdit: (updatedRows: MeasurementPoint[]) => void;
    availableSensors?: Sensor[];
}

interface EditableField {
    key: string;
    label: string;
    type: 'string' | 'number' | 'enum' | 'boolean' | 'array';
    required: boolean;
    description?: string;
    enumOptions?: Array<{ value: string; label: string }>;
    schemaPath: string;
    isFormHelper?: boolean;
}

interface BulkEditState {
    [key: string]: {
        enabled: boolean;
        value: any;
        validation?: ValidationResult;
    };
}

export const SchemaBulkEditDialog: React.FC<SchemaBulkEditDialogProps> = ({
    isOpen,
    onClose,
    selectedRows,
    selectedIndices,
    onBulkEdit,
    availableSensors = []
}) => {
    const [bulkEditState, setBulkEditState] = useState<BulkEditState>({});
    const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
    const [previewMode, setPreviewMode] = useState(false);
    const [previewRows, setPreviewRows] = useState<MeasurementPoint[]>([]);

    // Get editable fields from schema
    const editableFields = useMemo((): EditableField[] => {
        const measurementPointSchema = schemaService.getSchemaProperty(
            'measurement_location.items.properties.measurement_point.items'
        );

        const fields: EditableField[] = [];

        if (measurementPointSchema.properties) {
            // Core measurement point fields
            const coreFields = [
                {
                    key: 'name',
                    label: 'Name',
                    type: 'string' as const,
                    required: true,
                    description: 'The name the measurement point is commonly referred to',
                    schemaPath: 'measurement_location.items.properties.measurement_point.items.properties.name'
                },
                {
                    key: 'measurement_type_id',
                    label: 'Measurement Type',
                    type: 'enum' as const,
                    required: true,
                    description: 'The type of measurement being made',
                    enumOptions: measurementTypeOptions,
                    schemaPath: 'measurement_location.items.properties.measurement_point.items.properties.measurement_type_id'
                },
                {
                    key: 'height_m',
                    label: 'Height (m)',
                    type: 'number' as const,
                    required: false,
                    description: 'The height in meters above ground level',
                    schemaPath: 'measurement_location.items.properties.measurement_point.items.properties.height_m'
                },
                {
                    key: 'height_reference_id',
                    label: 'Height Reference',
                    type: 'enum' as const,
                    required: true,
                    description: 'The reference point for the height measurement',
                    enumOptions: heightReferenceOptions,
                    schemaPath: 'measurement_location.items.properties.measurement_point.items.properties.height_reference_id'
                },
                {
                    key: 'notes',
                    label: 'Notes',
                    type: 'string' as const,
                    required: false,
                    description: 'Notes relating to this measurement point',
                    schemaPath: 'measurement_location.items.properties.measurement_point.items.properties.notes'
                }
            ];

            fields.push(...coreFields);

            // Form helper fields (not in schema but used in forms)
            const helperFields = [
                {
                    key: 'statistic_type_id',
                    label: 'Statistic Type',
                    type: 'enum' as const,
                    required: false,
                    description: 'Statistical processing type (form helper - applies to column configuration)',
                    enumOptions: statisticTypeOptions,
                    schemaPath: 'definitions.statistic_type',
                    isFormHelper: true
                },
                {
                    key: 'unit',
                    label: 'Unit',
                    type: 'string' as const,
                    required: false,
                    description: 'Measurement unit (form helper - not in IEA schema)',
                    schemaPath: '',
                    isFormHelper: true
                }
            ];

            fields.push(...helperFields);

            // Sensor array field if sensors are available
            if (availableSensors.length > 0) {
                const sensorOptions = availableSensors.map(sensor => ({
                    value: sensor,
                    label: `${sensor.oem} (${sensor.serial_number})`
                }));

                fields.push({
                    key: 'sensor',
                    label: 'Sensors',
                    type: 'array' as const,
                    required: false,
                    description: 'Associated sensors for this measurement point',
                    enumOptions: sensorOptions,
                    schemaPath: 'measurement_location.items.properties.measurement_point.items.properties.sensor'
                });
            }
        }

        return fields;
    }, [availableSensors]);

    // Initialize bulk edit state
    useEffect(() => {
        if (isOpen && selectedRows.length > 0) {
            const initialState: BulkEditState = {};
            
            editableFields.forEach(field => {
                initialState[field.key] = {
                    enabled: false,
                    value: field.type === 'array' ? [] : ''
                };
            });

            setBulkEditState(initialState);
            setValidationResults({});
            setPreviewMode(false);
            setPreviewRows([]);
        }
    }, [isOpen, selectedRows, editableFields]);

    // Validate field when it's enabled or value changes
    const validateField = async (fieldKey: string, value: any) => {
        const field = editableFields.find(f => f.key === fieldKey);
        if (!field || !field.schemaPath || field.isFormHelper) {
            return;
        }

        try {
            const validation = await schemaValidator.validateField(field.schemaPath, value);
            setValidationResults(prev => ({
                ...prev,
                [fieldKey]: validation
            }));
        } catch (error) {
            setValidationResults(prev => ({
                ...prev,
                [fieldKey]: {
                    isValid: false,
                    errors: [{
                        schemaPath: field.schemaPath,
                        dataPath: fieldKey,
                        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        schemaRule: 'validation',
                        severity: 'error' as const
                    }]
                }
            }));
        }
    };

    const handleFieldToggle = (fieldKey: string, enabled: boolean) => {
        setBulkEditState(prev => ({
            ...prev,
            [fieldKey]: {
                ...prev[fieldKey],
                enabled
            }
        }));

        if (enabled) {
            validateField(fieldKey, bulkEditState[fieldKey]?.value);
        } else {
            // Remove validation when field is disabled
            setValidationResults(prev => {
                const newResults = { ...prev };
                delete newResults[fieldKey];
                return newResults;
            });
        }
    };

    const handleFieldValueChange = (fieldKey: string, value: any) => {
        setBulkEditState(prev => ({
            ...prev,
            [fieldKey]: {
                ...prev[fieldKey],
                value
            }
        }));

        if (bulkEditState[fieldKey]?.enabled) {
            validateField(fieldKey, value);
        }
    };

    const generatePreview = () => {
        const updatedRows = selectedRows.map(row => {
            const updatedRow = { ...row };
            
            Object.entries(bulkEditState).forEach(([fieldKey, fieldState]) => {
                if (fieldState.enabled) {
                    (updatedRow as any)[fieldKey] = fieldState.value;
                    
                    // Update timestamp for changes
                    updatedRow.update_at = new Date().toISOString();
                }
            });

            return updatedRow;
        });

        setPreviewRows(updatedRows);
        setPreviewMode(true);
    };

    const handleApplyChanges = () => {
        if (previewMode && previewRows.length > 0) {
            onBulkEdit(previewRows);
            onClose();
        } else {
            generatePreview();
        }
    };

    const hasEnabledFields = Object.values(bulkEditState).some(field => field.enabled);
    const hasValidationErrors = Object.values(validationResults).some(result => !result.isValid);

    const renderField = (field: EditableField) => {
        const fieldState = bulkEditState[field.key];
        const validation = validationResults[field.key];

        return (
            <Card key={field.key} className={fieldState?.enabled ? 'border-primary' : ''}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={fieldState?.enabled || false}
                                onCheckedChange={(checked) => handleFieldToggle(field.key, checked as boolean)}
                            />
                            <div>
                                <CardTitle className="text-sm font-medium">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                    {field.isFormHelper && (
                                        <Badge variant="secondary" className="ml-2 text-xs">Helper</Badge>
                                    )}
                                </CardTitle>
                                {field.description && (
                                    <CardDescription className="text-xs mt-1">
                                        {field.description}
                                    </CardDescription>
                                )}
                            </div>
                        </div>
                        {validation && (
                            <div className="flex items-center gap-1">
                                {validation.isValid ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>
                
                {fieldState?.enabled && (
                    <CardContent className="pt-0">
                        <div className="space-y-2">
                            {field.type === 'string' && (
                                field.key === 'notes' ? (
                                    <Textarea
                                        value={fieldState.value || ''}
                                        onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                        rows={3}
                                    />
                                ) : (
                                    <Input
                                        value={fieldState.value || ''}
                                        onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                    />
                                )
                            )}
                            
                            {field.type === 'number' && (
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={fieldState.value || ''}
                                    onChange={(e) => handleFieldValueChange(field.key, parseFloat(e.target.value) || 0)}
                                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                                />
                            )}
                            
                            {field.type === 'enum' && field.enumOptions && (
                                <SearchableSelect
                                    options={field.enumOptions}
                                    value={fieldState.value}
                                    onValueChange={(value) => handleFieldValueChange(field.key, value)}
                                    placeholder={`Select ${field.label.toLowerCase()}...`}
                                />
                            )}
                            
                            {field.type === 'array' && field.enumOptions && (
                                <MultiSelect
                                    options={field.enumOptions}
                                    selected={fieldState.value || []}
                                    onChange={(selected) => handleFieldValueChange(field.key, selected)}
                                    placeholder={`Select ${field.label.toLowerCase()}...`}
                                />
                            )}

                            {validation && !validation.isValid && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {validation.errors.map((error, index) => (
                                            <div key={index} className="text-sm">
                                                {error.message}
                                                {error.suggestedFix && (
                                                    <div className="mt-1 font-medium">
                                                        Suggestion: {error.suggestedFix}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Bulk Edit {selectedRows.length} Measurement Points
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={previewMode ? 'preview' : 'edit'} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="edit" onClick={() => setPreviewMode(false)}>
                            Edit Fields
                        </TabsTrigger>
                        <TabsTrigger 
                            value="preview" 
                            disabled={!hasEnabledFields}
                            onClick={() => !previewMode && generatePreview()}
                        >
                            Preview Changes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="edit" className="space-y-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Select the fields you want to update for all {selectedRows.length} selected measurement points.
                                Only enabled fields will be modified.
                            </AlertDescription>
                        </Alert>

                        <div className="grid gap-4">
                            {editableFields.map(renderField)}
                        </div>

                        {hasValidationErrors && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Some fields have validation errors. Please fix them before proceeding.
                                </AlertDescription>
                            </Alert>
                        )}
                    </TabsContent>

                    <TabsContent value="preview" className="space-y-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Preview of changes that will be applied to {selectedRows.length} measurement points.
                                Review the changes before applying.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <h4 className="font-medium">Changes Summary</h4>
                            <div className="bg-muted/30 p-3 rounded-lg">
                                {Object.entries(bulkEditState)
                                    .filter(([_, fieldState]) => fieldState.enabled)
                                    .map(([fieldKey, fieldState]) => {
                                        const field = editableFields.find(f => f.key === fieldKey);
                                        return (
                                            <div key={fieldKey} className="flex items-center justify-between py-1">
                                                <span className="font-medium text-sm">{field?.label}:</span>
                                                <span className="text-sm">
                                                    {Array.isArray(fieldState.value) 
                                                        ? `${fieldState.value.length} selected`
                                                        : fieldState.value || 'Empty'
                                                    }
                                                </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            These changes will be applied to measurement points: {selectedIndices.map(i => i + 1).join(', ')}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    {!previewMode ? (
                        <Button 
                            onClick={generatePreview}
                            disabled={!hasEnabledFields || hasValidationErrors}
                        >
                            Preview Changes
                        </Button>
                    ) : (
                        <Button onClick={handleApplyChanges}>
                            Apply Changes
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};