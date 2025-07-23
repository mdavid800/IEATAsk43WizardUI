import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Plus, Trash2, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { schemaValidator, type ValidationResult } from '@/services/schema-validator';
import { heightReferenceOptions } from '@/utils/enum-options';
import type { 
    IEATask43Schema, 
    VerticalProfilerProperty,
    HeightReference,
    OrientationReference
} from '@/types/schema';

interface VerticalProfilerPropertiesFormProps {
    locationIndex: number;
}

const orientationReferenceOptions = [
    { value: 'magnetic_north', label: 'Magnetic North' },
    { value: 'true_north', label: 'True North' },
    { value: 'grid_north', label: 'Grid North' }
];

const verticalOrientationOptions = [
    { value: 'upward', label: 'Upward' },
    { value: 'downward', label: 'Downward' }
];

export const VerticalProfilerPropertiesForm: React.FC<VerticalProfilerPropertiesFormProps> = ({
    locationIndex
}) => {
    const { setValue, watch } = useFormContext<IEATask43Schema>();
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    
    const verticalProfilerProperties = watch(`measurement_location.${locationIndex}.vertical_profiler_properties`) as VerticalProfilerProperty[] | undefined;
    const locationName = watch(`measurement_location.${locationIndex}.name`) || `Location ${locationIndex + 1}`;
    const stationType = watch(`measurement_location.${locationIndex}.measurement_station_type_id`);

    // Initialize vertical profiler properties if not present
    useEffect(() => {
        if (!verticalProfilerProperties || verticalProfilerProperties.length === 0) {
            const now = new Date().toISOString();
            const defaultProperties: VerticalProfilerProperty[] = [{
                device_datum_plane_height_m: 0,
                height_reference_id: 'ground_level',
                device_orientation_deg: 0,
                orientation_reference_id: 'true_north',
                device_vertical_orientation: 'upward',
                date_from: now,
                date_to: null,
                notes: '',
                update_at: now
            }];
            setValue(`measurement_location.${locationIndex}.vertical_profiler_properties`, defaultProperties);
        }
    }, [verticalProfilerProperties, setValue, locationIndex]);

    // Validate vertical profiler properties
    useEffect(() => {
        if (verticalProfilerProperties && verticalProfilerProperties.length > 0) {
            const validateData = async () => {
                try {
                    const errors = [];
                    
                    verticalProfilerProperties.forEach((property, index) => {
                        if (!property.date_from) {
                            errors.push({
                                schemaPath: `vertical_profiler_properties[${index}].date_from`,
                                dataPath: `vertical_profiler_properties[${index}].date_from`,
                                message: `Property ${index + 1}: Date from is required`,
                                schemaRule: 'required',
                                severity: 'error' as const
                            });
                        }

                        if (property.device_orientation_deg !== undefined && 
                            (property.device_orientation_deg < 0 || property.device_orientation_deg >= 360)) {
                            errors.push({
                                schemaPath: `vertical_profiler_properties[${index}].device_orientation_deg`,
                                dataPath: `vertical_profiler_properties[${index}].device_orientation_deg`,
                                message: `Property ${index + 1}: Device orientation must be between 0 and 359.99 degrees`,
                                schemaRule: 'range',
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
                            schemaPath: 'vertical_profiler_properties',
                            dataPath: 'vertical_profiler_properties',
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
    }, [verticalProfilerProperties]);

    const addProperty = () => {
        const now = new Date().toISOString();
        const newProperty: VerticalProfilerProperty = {
            device_datum_plane_height_m: 0,
            height_reference_id: 'ground_level',
            device_orientation_deg: 0,
            orientation_reference_id: 'true_north',
            device_vertical_orientation: 'upward',
            date_from: now,
            date_to: null,
            notes: '',
            update_at: now
        };

        const updatedProperties = [...(verticalProfilerProperties || []), newProperty];
        setValue(`measurement_location.${locationIndex}.vertical_profiler_properties`, updatedProperties);
    };

    const removeProperty = (propertyIndex: number) => {
        if (!verticalProfilerProperties) return;

        const updatedProperties = verticalProfilerProperties.filter((_, index) => index !== propertyIndex);
        setValue(`measurement_location.${locationIndex}.vertical_profiler_properties`, updatedProperties);
    };

    const updateProperty = (propertyIndex: number, field: string, value: any) => {
        if (!verticalProfilerProperties) return;

        const updatedProperties = [...verticalProfilerProperties];
        (updatedProperties[propertyIndex] as any)[field] = value;
        updatedProperties[propertyIndex].update_at = new Date().toISOString();

        setValue(`measurement_location.${locationIndex}.vertical_profiler_properties`, updatedProperties);
    };

    const getStationTypeDescription = () => {
        const descriptions = {
            'lidar': 'Light Detection and Ranging system for remote wind profiling',
            'sodar': 'Sonic Detection and Ranging system for acoustic wind profiling',
            'floating_lidar': 'Marine-deployed LiDAR system for offshore measurements',
            'wave_buoy': 'Marine buoy system for wave and meteorological measurements',
            'adcp': 'Acoustic Doppler Current Profiler for water current measurements'
        };
        return descriptions[stationType as keyof typeof descriptions] || 'Vertical profiling system';
    };

    if (!verticalProfilerProperties) {
        return null; // Will be initialized by useEffect
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    <div>
                        <div>Vertical Profiler Properties</div>
                        <div className="text-sm font-normal text-muted-foreground">
                            {getStationTypeDescription()} configuration for {locationName}
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

                {/* Add Property Button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium">Device Configurations</h4>
                        <p className="text-sm text-muted-foreground">
                            Define the properties for each device configuration period
                        </p>
                    </div>
                    <Button onClick={addProperty} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Configuration
                    </Button>
                </div>

                {/* Properties List */}
                <div className="space-y-4">
                    {verticalProfilerProperties.map((property, propertyIndex) => (
                        <Card key={propertyIndex} className="bg-muted/20">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">
                                        Configuration {propertyIndex + 1}
                                    </CardTitle>
                                    {verticalProfilerProperties.length > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeProperty(propertyIndex)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Device Position and Orientation */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Device Datum Plane Height (m)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={property.device_datum_plane_height_m || ''}
                                            onChange={(e) => updateProperty(
                                                propertyIndex,
                                                'device_datum_plane_height_m',
                                                parseFloat(e.target.value) || 0
                                            )}
                                            placeholder="Height in meters..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Height Reference</Label>
                                        <SearchableSelect
                                            options={heightReferenceOptions}
                                            value={property.height_reference_id}
                                            onValueChange={(value) => updateProperty(
                                                propertyIndex,
                                                'height_reference_id',
                                                value as HeightReference
                                            )}
                                            placeholder="Select height reference..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Device Orientation (degrees)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="359.99"
                                            value={property.device_orientation_deg || ''}
                                            onChange={(e) => updateProperty(
                                                propertyIndex,
                                                'device_orientation_deg',
                                                parseFloat(e.target.value) || 0
                                            )}
                                            placeholder="0-359.99 degrees..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Orientation Reference</Label>
                                        <SearchableSelect
                                            options={orientationReferenceOptions}
                                            value={property.orientation_reference_id}
                                            onValueChange={(value) => updateProperty(
                                                propertyIndex,
                                                'orientation_reference_id',
                                                value as OrientationReference
                                            )}
                                            placeholder="Select orientation reference..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Vertical Orientation</Label>
                                        <SearchableSelect
                                            options={verticalOrientationOptions}
                                            value={property.device_vertical_orientation || undefined}
                                            onValueChange={(value) => updateProperty(
                                                propertyIndex,
                                                'device_vertical_orientation',
                                                value
                                            )}
                                            placeholder="Select vertical orientation..."
                                        />
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>
                                            Date From <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            value={property.date_from ? property.date_from.slice(0, 16) : ''}
                                            onChange={(e) => updateProperty(
                                                propertyIndex,
                                                'date_from',
                                                e.target.value ? new Date(e.target.value).toISOString() : ''
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Date To</Label>
                                        <Input
                                            type="datetime-local"
                                            value={property.date_to ? property.date_to.slice(0, 16) : ''}
                                            onChange={(e) => updateProperty(
                                                propertyIndex,
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
                                        value={property.notes || ''}
                                        onChange={(e) => updateProperty(
                                            propertyIndex,
                                            'notes',
                                            e.target.value
                                        )}
                                        placeholder="Enter any additional notes about this configuration..."
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Station-Specific Information */}
                <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <div className="font-medium">Station Type: {stationType?.toUpperCase()}</div>
                            <ul className="text-sm space-y-1">
                                <li>• Device orientation is measured from the selected reference direction</li>
                                <li>• Height reference determines the datum for height measurements</li>
                                <li>• Multiple configurations can be defined for different time periods</li>
                                {stationType === 'floating_lidar' && (
                                    <li>• For floating systems, consider motion compensation and deployment depth</li>
                                )}
                                {(stationType === 'wave_buoy' || stationType === 'adcp') && (
                                    <li>• For marine systems, ensure proper depth and orientation settings</li>
                                )}
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
};