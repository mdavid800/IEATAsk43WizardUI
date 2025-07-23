import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Plus, Trash2, Zap, AlertCircle, CheckCircle2, Info, Thermometer, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { schemaValidator, type ValidationResult } from '@/services/schema-validator';
import type { 
    IEATask43Schema, 
    Sensor, 
    SensorType,
    Calibration
} from '@/types/schema';

interface SensorManagementFormProps {
    locationIndex: number;
}

const sensorTypeOptions = [
    { value: 'cup_anemometer', label: 'Cup Anemometer' },
    { value: 'wind_vane', label: 'Wind Vane' },
    { value: 'temperature_sensor', label: 'Temperature Sensor' },
    { value: 'pressure_sensor', label: 'Pressure Sensor' },
    { value: 'humidity_sensor', label: 'Humidity Sensor' },
    { value: 'precipitation_sensor', label: 'Precipitation Sensor' },
    { value: 'pyranometer', label: 'Pyranometer' },
    { value: 'sonic_anemometer_2d', label: '2D Sonic Anemometer' },
    { value: 'sonic_anemometer_3d', label: '3D Sonic Anemometer' },
    { value: '3d_ultrasonic', label: '3D Ultrasonic' },
    { value: 'vertical_anemometer', label: 'Vertical Anemometer' },
    { value: 'propeller_anemometer', label: 'Propeller Anemometer' },
    { value: 'gill_propeller', label: 'Gill Propeller' },
    { value: 'rain_gauge', label: 'Rain Gauge' },
    { value: 'ice_detection_sensor', label: 'Ice Detection Sensor' },
    { value: 'fog_sensor', label: 'Fog Sensor' },
    { value: 'gps', label: 'GPS' },
    { value: 'illuminance_sensor', label: 'Illuminance Sensor' },
    { value: 'compass', label: 'Compass' },
    { value: 'solar_compass', label: 'Solar Compass' },
    { value: 'wave_buoy', label: 'Wave Buoy' },
    { value: 'inertial_measurement_unit', label: 'Inertial Measurement Unit' },
    { value: 'gps_motion_unit', label: 'GPS Motion Unit' }
];

export const SensorManagementForm: React.FC<SensorManagementFormProps> = ({
    locationIndex
}) => {
    const { setValue, watch } = useFormContext<IEATask43Schema>();
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    
    const sensors = watch(`measurement_location.${locationIndex}.sensors`) as Sensor[] | undefined;
    const locationName = watch(`measurement_location.${locationIndex}.name`) || `Location ${locationIndex + 1}`;
    const stationType = watch(`measurement_location.${locationIndex}.measurement_station_type_id`);

    // Initialize sensors array if not present
    useEffect(() => {
        if (!sensors) {
            setValue(`measurement_location.${locationIndex}.sensors`, []);
        }
    }, [sensors, setValue, locationIndex]);

    // Validate sensors
    useEffect(() => {
        if (sensors && sensors.length > 0) {
            const validateData = async () => {
                try {
                    const errors = [];
                    
                    sensors.forEach((sensor, index) => {
                        // Required fields validation
                        if (!sensor.serial_number || sensor.serial_number.trim() === '') {
                            errors.push({
                                schemaPath: `sensors[${index}].serial_number`,
                                dataPath: `sensors[${index}].serial_number`,
                                message: `Sensor ${index + 1}: Serial number is required`,
                                schemaRule: 'required',
                                severity: 'error' as const
                            });
                        }

                        if (!sensor.date_from) {
                            errors.push({
                                schemaPath: `sensors[${index}].date_from`,
                                dataPath: `sensors[${index}].date_from`,
                                message: `Sensor ${index + 1}: Date from is required`,
                                schemaRule: 'required',
                                severity: 'error' as const
                            });
                        }

                        // Range validations
                        if (sensor.instrument_poi_height_mm !== undefined && 
                            sensor.instrument_poi_height_mm !== null &&
                            sensor.instrument_poi_height_mm < 0) {
                            errors.push({
                                schemaPath: `sensors[${index}].instrument_poi_height_mm`,
                                dataPath: `sensors[${index}].instrument_poi_height_mm`,
                                message: `Sensor ${index + 1}: Instrument height cannot be negative`,
                                schemaRule: 'minimum',
                                severity: 'error' as const
                            });
                        }

                        if (sensor.sensor_body_size_mm !== undefined && 
                            sensor.sensor_body_size_mm !== null &&
                            sensor.sensor_body_size_mm <= 0) {
                            errors.push({
                                schemaPath: `sensors[${index}].sensor_body_size_mm`,
                                dataPath: `sensors[${index}].sensor_body_size_mm`,
                                message: `Sensor ${index + 1}: Sensor body size must be greater than 0`,
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
                            schemaPath: 'sensors',
                            dataPath: 'sensors',
                            message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            schemaRule: 'validation',
                            severity: 'error' as const
                        }],
                        warnings: []
                    });
                }
            };
            validateData();
        } else {
            setValidation({ isValid: true, errors: [], warnings: [] });
        }
    }, [sensors]);

    const addSensor = () => {
        const now = new Date().toISOString();
        const newSensor: Sensor = {
            oem: '',
            model: '',
            serial_number: '',
            sensor_type_id: 'cup_anemometer',
            classification: '',
            instrument_poi_height_mm: 0,
            is_heated: false,
            sensor_body_size_mm: 0,
            date_from: now,
            date_to: null,
            notes: '',
            update_at: now,
            calibration: []
        };

        const updatedSensors = [...(sensors || []), newSensor];
        setValue(`measurement_location.${locationIndex}.sensors`, updatedSensors);
    };

    const removeSensor = (sensorIndex: number) => {
        if (!sensors) return;

        const updatedSensors = sensors.filter((_, index) => index !== sensorIndex);
        setValue(`measurement_location.${locationIndex}.sensors`, updatedSensors);
    };

    const updateSensor = (sensorIndex: number, field: string, value: any) => {
        if (!sensors) return;

        const updatedSensors = [...sensors];
        (updatedSensors[sensorIndex] as any)[field] = value;
        updatedSensors[sensorIndex].update_at = new Date().toISOString();

        setValue(`measurement_location.${locationIndex}.sensors`, updatedSensors);
    };

    const addCalibration = (sensorIndex: number) => {
        if (!sensors) return;

        const now = new Date().toISOString();
        const newCalibration: Calibration = {
            calibration_date: now,
            calibration_certificate_reference: '',
            post_calibration_transfer_function_slope: 1.0,
            post_calibration_transfer_function_offset: 0.0,
            calibrated_range_min: 0,
            calibrated_range_max: 100,
            calibration_notes: '',
            date_from: now,
            date_to: null,
            notes: '',
            update_at: now
        };

        const updatedSensors = [...sensors];
        updatedSensors[sensorIndex].calibration = [
            ...(updatedSensors[sensorIndex].calibration || []),
            newCalibration
        ];

        setValue(`measurement_location.${locationIndex}.sensors`, updatedSensors);
    };

    const removeCalibration = (sensorIndex: number, calibrationIndex: number) => {
        if (!sensors) return;

        const updatedSensors = [...sensors];
        updatedSensors[sensorIndex].calibration = updatedSensors[sensorIndex].calibration?.filter(
            (_, index) => index !== calibrationIndex
        ) || [];

        setValue(`measurement_location.${locationIndex}.sensors`, updatedSensors);
    };

    const updateCalibration = (sensorIndex: number, calibrationIndex: number, field: string, value: any) => {
        if (!sensors || !sensors[sensorIndex].calibration) return;

        const updatedSensors = [...sensors];
        if (updatedSensors[sensorIndex].calibration) {
            (updatedSensors[sensorIndex].calibration![calibrationIndex] as any)[field] = value;
            updatedSensors[sensorIndex].calibration![calibrationIndex].update_at = new Date().toISOString();
        }

        setValue(`measurement_location.${locationIndex}.sensors`, updatedSensors);
    };

    const getSensorIcon = (sensorType: SensorType) => {
        if (sensorType.includes('temperature')) return <Thermometer className="w-4 h-4" />;
        return <Zap className="w-4 h-4" />;
    };

    if (!sensors) {
        return null; // Will be initialized by useEffect
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Zap className="w-5 h-5" />
                    <div>
                        <div>Sensor Management</div>
                        <div className="text-sm font-normal text-muted-foreground">
                            Physical sensors and instruments for {locationName}
                        </div>
                    </div>
                    <div className="ml-auto">
                        {validation && (
                            <Badge variant={validation.isValid ? "default" : "destructive"}>
                                {validation.isValid ? (
                                    <>
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Valid ({sensors.length})
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
                            <div className="font-medium">Sensor Inventory for {stationType?.toUpperCase()}</div>
                            <div className="text-sm">
                                Define the physical sensors and instruments deployed at this measurement location. 
                                Each sensor can have multiple calibration records for different time periods.
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>

                {/* Add Sensor Button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium">Sensors & Instruments</h4>
                        <p className="text-sm text-muted-foreground">
                            Manage the physical sensors deployed at this location
                        </p>
                    </div>
                    <Button onClick={addSensor} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Sensor
                    </Button>
                </div>

                {/* Sensors List */}
                {sensors.length > 0 ? (
                    <div className="space-y-4">
                        {sensors.map((sensor, sensorIndex) => (
                            <Card key={sensorIndex} className="bg-muted/20">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            {getSensorIcon(sensor.sensor_type_id || 'cup_anemometer')}
                                            Sensor {sensorIndex + 1}
                                            {sensor.model && (
                                                <span className="font-normal text-muted-foreground">
                                                    ({sensor.oem} {sensor.model})
                                                </span>
                                            )}
                                        </CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeSensor(sensorIndex)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="basic" className="space-y-4">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                            <TabsTrigger value="specs">Specifications</TabsTrigger>
                                            <TabsTrigger value="calibration">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                Calibration
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="basic" className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Sensor Type</Label>
                                                    <SearchableSelect
                                                        options={sensorTypeOptions}
                                                        value={sensor.sensor_type_id}
                                                        onValueChange={(value) => updateSensor(
                                                            sensorIndex,
                                                            'sensor_type_id',
                                                            value as SensorType
                                                        )}
                                                        placeholder="Select sensor type..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>OEM/Manufacturer</Label>
                                                    <Input
                                                        value={sensor.oem || ''}
                                                        onChange={(e) => updateSensor(
                                                            sensorIndex,
                                                            'oem',
                                                            e.target.value || undefined
                                                        )}
                                                        placeholder="Manufacturer name..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Model</Label>
                                                    <Input
                                                        value={sensor.model || ''}
                                                        onChange={(e) => updateSensor(
                                                            sensorIndex,
                                                            'model',
                                                            e.target.value || undefined
                                                        )}
                                                        placeholder="Model name..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>
                                                        Serial Number <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        value={sensor.serial_number || ''}
                                                        onChange={(e) => updateSensor(
                                                            sensorIndex,
                                                            'serial_number',
                                                            e.target.value || undefined
                                                        )}
                                                        placeholder="Serial number..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Classification</Label>
                                                    <Input
                                                        value={sensor.classification || ''}
                                                        onChange={(e) => updateSensor(
                                                            sensorIndex,
                                                            'classification',
                                                            e.target.value || undefined
                                                        )}
                                                        placeholder="Sensor classification..."
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
                                                        value={sensor.date_from ? sensor.date_from.slice(0, 16) : ''}
                                                        onChange={(e) => updateSensor(
                                                            sensorIndex,
                                                            'date_from',
                                                            e.target.value ? new Date(e.target.value).toISOString() : ''
                                                        )}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Date To</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={sensor.date_to ? sensor.date_to.slice(0, 16) : ''}
                                                        onChange={(e) => updateSensor(
                                                            sensorIndex,
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
                                                    value={sensor.notes || ''}
                                                    onChange={(e) => updateSensor(
                                                        sensorIndex,
                                                        'notes',
                                                        e.target.value || undefined
                                                    )}
                                                    placeholder="Enter any additional notes about this sensor..."
                                                    rows={3}
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="specs" className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Instrument POI Height (mm)</Label>
                                                    <Input
                                                        type="number"
                                                        step="1"
                                                        min="0"
                                                        value={sensor.instrument_poi_height_mm || ''}
                                                        onChange={(e) => updateSensor(
                                                            sensorIndex,
                                                            'instrument_poi_height_mm',
                                                            e.target.value ? parseInt(e.target.value) : undefined
                                                        )}
                                                        placeholder="Height in millimeters..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Sensor Body Size (mm)</Label>
                                                    <Input
                                                        type="number"
                                                        step="1"
                                                        min="0"
                                                        value={sensor.sensor_body_size_mm || ''}
                                                        onChange={(e) => updateSensor(
                                                            sensorIndex,
                                                            'sensor_body_size_mm',
                                                            e.target.value ? parseInt(e.target.value) : undefined
                                                        )}
                                                        placeholder="Size in millimeters..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`heated-${locationIndex}-${sensorIndex}`}
                                                    checked={sensor.is_heated || false}
                                                    onCheckedChange={(checked) => updateSensor(
                                                        sensorIndex,
                                                        'is_heated',
                                                        checked as boolean
                                                    )}
                                                />
                                                <Label htmlFor={`heated-${locationIndex}-${sensorIndex}`}>
                                                    Sensor is heated
                                                </Label>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="calibration" className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium">Calibration Records</h5>
                                                    <p className="text-sm text-muted-foreground">
                                                        Calibration history for this sensor
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() => addCalibration(sensorIndex)}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add Calibration
                                                </Button>
                                            </div>

                                            {sensor.calibration && sensor.calibration.length > 0 ? (
                                                <div className="space-y-3">
                                                    {sensor.calibration.map((calibration, calibrationIndex) => (
                                                        <Card key={calibrationIndex} className="bg-background">
                                                            <CardHeader className="pb-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-sm font-medium">
                                                                        Calibration {calibrationIndex + 1}
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeCalibration(sensorIndex, calibrationIndex)}
                                                                        className="text-red-600 hover:text-red-700"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="space-y-3">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div className="space-y-2">
                                                                        <Label>Calibration Date</Label>
                                                                        <Input
                                                                            type="date"
                                                                            value={calibration.calibration_date ? calibration.calibration_date.slice(0, 10) : ''}
                                                                            onChange={(e) => updateCalibration(
                                                                                sensorIndex,
                                                                                calibrationIndex,
                                                                                'calibration_date',
                                                                                e.target.value ? new Date(e.target.value).toISOString() : ''
                                                                            )}
                                                                        />
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <Label>Certificate Reference</Label>
                                                                        <Input
                                                                            value={calibration.calibration_certificate_reference || ''}
                                                                            onChange={(e) => updateCalibration(
                                                                                sensorIndex,
                                                                                calibrationIndex,
                                                                                'calibration_certificate_reference',
                                                                                e.target.value || undefined
                                                                            )}
                                                                            placeholder="Certificate number..."
                                                                        />
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <Label>Transfer Function Slope</Label>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.0001"
                                                                            value={calibration.post_calibration_transfer_function_slope || ''}
                                                                            onChange={(e) => updateCalibration(
                                                                                sensorIndex,
                                                                                calibrationIndex,
                                                                                'post_calibration_transfer_function_slope',
                                                                                e.target.value ? parseFloat(e.target.value) : undefined
                                                                            )}
                                                                            placeholder="Slope..."
                                                                        />
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <Label>Transfer Function Offset</Label>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.0001"
                                                                            value={calibration.post_calibration_transfer_function_offset || ''}
                                                                            onChange={(e) => updateCalibration(
                                                                                sensorIndex,
                                                                                calibrationIndex,
                                                                                'post_calibration_transfer_function_offset',
                                                                                e.target.value ? parseFloat(e.target.value) : undefined
                                                                            )}
                                                                            placeholder="Offset..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-muted-foreground">
                                                    <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No calibration records</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h4 className="font-medium mb-2">No Sensors Configured</h4>
                        <p className="text-sm mb-4">Add sensors and instruments deployed at this location</p>
                        <Button onClick={addSensor} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Sensor
                        </Button>
                    </div>
                )}

                {/* Sensor Guidelines */}
                <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <div className="font-medium">Sensor Management Guidelines:</div>
                            <ul className="text-sm space-y-1">
                                <li>• Each sensor should have a unique serial number for identification</li>
                                <li>• Calibration records help maintain measurement traceability</li>
                                <li>• Date ranges define when each sensor configuration was active</li>
                                <li>• Physical specifications affect measurement quality and uncertainty</li>
                                <li>• Multiple calibrations can represent different time periods or recalibrations</li>
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
};