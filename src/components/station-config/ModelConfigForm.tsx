import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Plus, Trash2, Database, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { schemaValidator, type ValidationResult } from '@/services/schema-validator';
import type { 
    IEATask43Schema, 
    ModelConfig
} from '@/types/schema';

interface ModelConfigFormProps {
    locationIndex: number;
}

const reanalysisOptions = [
    { value: 'CFSR', label: 'CFSR (Climate Forecast System Reanalysis)' },
    { value: 'ERA-Interim', label: 'ERA-Interim (ECMWF)' },
    { value: 'ERA5', label: 'ERA5 (ECMWF)' },
    { value: 'JRA-55', label: 'JRA-55 (Japanese Reanalysis)' },
    { value: 'MERRA-2', label: 'MERRA-2 (NASA)' },
    { value: 'NCAR', label: 'NCAR (National Center for Atmospheric Research)' },
    { value: 'Other', label: 'Other (specify in notes)' }
];

export const ModelConfigForm: React.FC<ModelConfigFormProps> = ({
    locationIndex
}) => {
    const { setValue, watch } = useFormContext<IEATask43Schema>();
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    
    const modelConfig = watch(`measurement_location.${locationIndex}.model_config`) as ModelConfig[] | undefined;
    const locationName = watch(`measurement_location.${locationIndex}.name`) || `Location ${locationIndex + 1}`;
    const stationType = watch(`measurement_location.${locationIndex}.measurement_station_type_id`);

    // Initialize model config if not present
    useEffect(() => {
        if (!modelConfig || modelConfig.length === 0) {
            const now = new Date().toISOString();
            const defaultConfig: ModelConfig[] = [{
                reanalysis: 'ERA5',
                horizontal_grid_resolution_m: null,
                model_used: '',
                date_from: now,
                date_to: null,
                offset_from_utc_hrs: 0,
                averaging_period_minutes: 60,
                timestamp_is_end_of_period: true,
                notes: '',
                update_at: now
            }];
            setValue(`measurement_location.${locationIndex}.model_config`, defaultConfig);
        }
    }, [modelConfig, setValue, locationIndex]);

    // Validate model config
    useEffect(() => {
        if (modelConfig && modelConfig.length > 0) {
            const validateData = async () => {
                try {
                    const errors = [];
                    
                    modelConfig.forEach((config, index) => {
                        if (!config.date_from) {
                            errors.push({
                                schemaPath: `model_config[${index}].date_from`,
                                dataPath: `model_config[${index}].date_from`,
                                message: `Configuration ${index + 1}: Date from is required`,
                                schemaRule: 'required',
                                severity: 'error' as const
                            });
                        }

                        if (!config.reanalysis) {
                            errors.push({
                                schemaPath: `model_config[${index}].reanalysis`,
                                dataPath: `model_config[${index}].reanalysis`,
                                message: `Configuration ${index + 1}: Reanalysis type is required`,
                                schemaRule: 'required',
                                severity: 'error' as const
                            });
                        }

                        if (config.horizontal_grid_resolution_m !== null && 
                            config.horizontal_grid_resolution_m !== undefined &&
                            config.horizontal_grid_resolution_m <= 0) {
                            errors.push({
                                schemaPath: `model_config[${index}].horizontal_grid_resolution_m`,
                                dataPath: `model_config[${index}].horizontal_grid_resolution_m`,
                                message: `Configuration ${index + 1}: Grid resolution must be greater than 0`,
                                schemaRule: 'minimum',
                                severity: 'error' as const
                            });
                        }

                        if (config.averaging_period_minutes !== null && 
                            config.averaging_period_minutes !== undefined &&
                            config.averaging_period_minutes <= 0) {
                            errors.push({
                                schemaPath: `model_config[${index}].averaging_period_minutes`,
                                dataPath: `model_config[${index}].averaging_period_minutes`,
                                message: `Configuration ${index + 1}: Averaging period must be greater than 0`,
                                schemaRule: 'minimum',
                                severity: 'error' as const
                            });
                        }
                    });

                    setValidation({
                        isValid: errors.length === 0,
                        errors,
                        warnings: []
                    });
                } catch (error) {
                    setValidation({
                        isValid: false,
                        errors: [{
                            schemaPath: 'model_config',
                            dataPath: 'model_config',
                            message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            schemaRule: 'validation',
                            severity: 'error' as const
                        }],
                        warnings: []
                    });
                }
            };
            validateData();
        }
    }, [modelConfig]);

    const addConfig = () => {
        const now = new Date().toISOString();
        const newConfig: ModelConfig = {
            reanalysis: 'ERA5',
            horizontal_grid_resolution_m: null,
            model_used: '',
            date_from: now,
            date_to: null,
            offset_from_utc_hrs: 0,
            averaging_period_minutes: 60,
            timestamp_is_end_of_period: true,
            notes: '',
            update_at: now
        };

        const updatedConfigs = [...(modelConfig || []), newConfig];
        setValue(`measurement_location.${locationIndex}.model_config`, updatedConfigs);
    };

    const removeConfig = (configIndex: number) => {
        if (!modelConfig) return;

        const updatedConfigs = modelConfig.filter((_, index) => index !== configIndex);
        setValue(`measurement_location.${locationIndex}.model_config`, updatedConfigs);
    };

    const updateConfig = (configIndex: number, field: string, value: any) => {
        if (!modelConfig) return;

        const updatedConfigs = [...modelConfig];
        (updatedConfigs[configIndex] as any)[field] = value;
        updatedConfigs[configIndex].update_at = new Date().toISOString();

        setValue(`measurement_location.${locationIndex}.model_config`, updatedConfigs);
    };

    const getStationTypeDescription = () => {
        const descriptions = {
            'reanalysis': 'Reanalysis data provides gridded meteorological data from atmospheric models',
            'virtual_met_mast': 'Virtual met mast uses model data to simulate measurements at a specific location'
        };
        return descriptions[stationType as keyof typeof descriptions] || 'Model-based data source';
    };

    if (!modelConfig) {
        return null; // Will be initialized by useEffect
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Database className="w-5 h-5" />
                    <div>
                        <div>Model Configuration</div>
                        <div className="text-sm font-normal text-muted-foreground">
                            {getStationTypeDescription()} for {locationName}
                        </div>
                    </div>
                    <div className="ml-auto">
                        {validation && (
                            <Badge variant={validation.isValid ? "default" : "destructive"}>
                                {validation.isValid ? (
                                    <>
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Valid
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Invalid
                                    </>
                                )}
                            </Badge>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Validation Errors */}
                {validation && !validation.isValid && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-1">
                                {validation.errors.map((error, index) => (
                                    <div key={index} className="text-sm">• {error.message}</div>
                                ))}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Station Type Information */}
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <div className="font-medium">Station Type: {stationType?.toUpperCase()}</div>
                            <div className="text-sm">
                                {stationType === 'reanalysis' && (
                                    <>Reanalysis stations use gridded atmospheric model data. No physical logger configuration is required.</>
                                )}
                                {stationType === 'virtual_met_mast' && (
                                    <>Virtual met masts use model data to simulate measurements at specific coordinates. No physical equipment is involved.</>
                                )}
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>

                {/* Add Configuration Button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium">Model Configurations</h4>
                        <p className="text-sm text-muted-foreground">
                            Define the model settings for different time periods
                        </p>
                    </div>
                    <Button onClick={addConfig} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Configuration
                    </Button>
                </div>

                {/* Configurations List */}
                <div className="space-y-4">
                    {modelConfig.map((config, configIndex) => (
                        <Card key={configIndex} className="bg-muted/20">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">
                                        Configuration {configIndex + 1}
                                    </CardTitle>
                                    {modelConfig.length > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeConfig(configIndex)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Model Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>
                                            Reanalysis Type <span className="text-red-500">*</span>
                                        </Label>
                                        <SearchableSelect
                                            options={reanalysisOptions}
                                            value={config.reanalysis}
                                            onValueChange={(value) => updateConfig(
                                                configIndex,
                                                'reanalysis',
                                                value
                                            )}
                                            placeholder="Select reanalysis type..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Model Used</Label>
                                        <Input
                                            value={config.model_used || ''}
                                            onChange={(e) => updateConfig(
                                                configIndex,
                                                'model_used',
                                                e.target.value || null
                                            )}
                                            placeholder="Specify model name or version..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Horizontal Grid Resolution (m)</Label>
                                        <Input
                                            type="number"
                                            step="1"
                                            min="1"
                                            value={config.horizontal_grid_resolution_m || ''}
                                            onChange={(e) => updateConfig(
                                                configIndex,
                                                'horizontal_grid_resolution_m',
                                                e.target.value ? parseInt(e.target.value) : null
                                            )}
                                            placeholder="Grid resolution in meters..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>UTC Offset (hours)</Label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            min="-12"
                                            max="14"
                                            value={config.offset_from_utc_hrs || ''}
                                            onChange={(e) => updateConfig(
                                                configIndex,
                                                'offset_from_utc_hrs',
                                                e.target.value ? parseFloat(e.target.value) : null
                                            )}
                                            placeholder="Hours from UTC..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Averaging Period (minutes)</Label>
                                        <Input
                                            type="number"
                                            step="1"
                                            min="1"
                                            value={config.averaging_period_minutes || ''}
                                            onChange={(e) => updateConfig(
                                                configIndex,
                                                'averaging_period_minutes',
                                                e.target.value ? parseInt(e.target.value) : null
                                            )}
                                            placeholder="Minutes (e.g., 60 for hourly)..."
                                        />
                                    </div>
                                </div>

                                {/* Timestamp Configuration */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`timestamp-end-${locationIndex}-${configIndex}`}
                                        checked={config.timestamp_is_end_of_period || false}
                                        onCheckedChange={(checked) => updateConfig(
                                            configIndex,
                                            'timestamp_is_end_of_period',
                                            checked as boolean
                                        )}
                                    />
                                    <Label htmlFor={`timestamp-end-${locationIndex}-${configIndex}`}>
                                        Timestamp represents end of averaging period
                                    </Label>
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>
                                            Date From <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            value={config.date_from ? config.date_from.slice(0, 16) : ''}
                                            onChange={(e) => updateConfig(
                                                configIndex,
                                                'date_from',
                                                e.target.value ? new Date(e.target.value).toISOString() : ''
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Date To</Label>
                                        <Input
                                            type="datetime-local"
                                            value={config.date_to ? config.date_to.slice(0, 16) : ''}
                                            onChange={(e) => updateConfig(
                                                configIndex,
                                                'date_to',
                                                e.target.value ? new Date(e.target.value).toISOString() : null
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={config.notes || ''}
                                        onChange={(e) => updateConfig(
                                            configIndex,
                                            'notes',
                                            e.target.value || null
                                        )}
                                        placeholder="Enter any additional notes about this model configuration..."
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Model-Specific Guidelines */}
                <Alert>
                    <Database className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <div className="font-medium">Model Configuration Guidelines:</div>
                            <ul className="text-sm space-y-1">
                                <li>• Choose the reanalysis dataset that best matches your study period</li>
                                <li>• Grid resolution should reflect the spatial accuracy of the model</li>
                                <li>• UTC offset should match the timezone of your measurement location</li>
                                <li>• Averaging period typically matches the model output frequency (e.g., 60 min for hourly data)</li>
                                <li>• For "Other" reanalysis types, provide details in the notes field</li>
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
};