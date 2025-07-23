import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Plus, Trash2, HardDrive, AlertCircle, CheckCircle2, Info, Clock, Shield } from 'lucide-react';
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
    LoggerMainConfig,
    LoggerOEM 
} from '@/types/schema';

interface LoggerConfigurationFormProps {
    locationIndex: number;
}

const loggerOEMOptions = [
    { value: 'NRG Systems', label: 'NRG Systems' },
    { value: 'Ammonit', label: 'Ammonit' },
    { value: 'Campbell Scientific', label: 'Campbell Scientific' },
    { value: 'Vaisala', label: 'Vaisala' },
    { value: 'SecondWind', label: 'SecondWind' },
    { value: 'Kintech', label: 'Kintech' },
    { value: 'Wilmers', label: 'Wilmers' },
    { value: 'Unidata', label: 'Unidata' },
    { value: 'WindLogger', label: 'WindLogger' },
    { value: 'Leosphere', label: 'Leosphere' },
    { value: 'ZX Lidars', label: 'ZX Lidars' },
    { value: 'AXYS Technologies', label: 'AXYS Technologies' },
    { value: 'AQSystem', label: 'AQSystem' },
    { value: 'Pentaluum', label: 'Pentaluum' },
    { value: 'Nortek', label: 'Nortek' }
];

export const LoggerConfigurationForm: React.FC<LoggerConfigurationFormProps> = ({
    locationIndex
}) => {
    const { setValue, watch } = useFormContext<IEATask43Schema>();
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    
    const loggerConfigs = watch(`measurement_location.${locationIndex}.logger_main_config`) as LoggerMainConfig[] | undefined;
    const locationName = watch(`measurement_location.${locationIndex}.name`) || `Location ${locationIndex + 1}`;
    const stationType = watch(`measurement_location.${locationIndex}.measurement_station_type_id`);

    // Initialize logger config if not present
    useEffect(() => {
        if (!loggerConfigs || loggerConfigs.length === 0) {
            const now = new Date().toISOString();
            const defaultConfig: LoggerMainConfig[] = [{
                logger_oem_id: 'NRG Systems',
                logger_model_name: '',
                logger_serial_number: '',
                logger_firmware_version: '',
                logger_id: '',
                logger_name: '',
                date_from: now,
                date_to: null,
                encryption_pin_or_key: '',
                enclosure_lock_details: '',
                data_transfer_details: '',
                offset_from_utc_hrs: 0,
                sampling_rate_sec: 1,
                averaging_period_minutes: 10,
                timestamp_is_end_of_period: true,
                clock_is_auto_synced: false,
                notes: '',
                update_at: now
            }];
            setValue(`measurement_location.${locationIndex}.logger_main_config`, defaultConfig);
        }
    }, [loggerConfigs, setValue, locationIndex]);

    // Validate logger configs
    useEffect(() => {
        if (loggerConfigs && loggerConfigs.length > 0) {
            const validateData = async () => {
                try {
                    const errors = [];
                    
                    loggerConfigs.forEach((config, index) => {
                        // Required fields validation
                        if (!config.logger_serial_number || config.logger_serial_number.trim() === '') {
                            errors.push({
                                schemaPath: `logger_main_config[${index}].logger_serial_number`,
                                dataPath: `logger_main_config[${index}].logger_serial_number`,
                                message: `Logger ${index + 1}: Serial number is required`,
                                schemaRule: 'required',
                                severity: 'error' as const
                            });
                        }

                        if (!config.date_from) {
                            errors.push({
                                schemaPath: `logger_main_config[${index}].date_from`,
                                dataPath: `logger_main_config[${index}].date_from`,
                                message: `Logger ${index + 1}: Date from is required`,
                                schemaRule: 'required',
                                severity: 'error' as const
                            });
                        }

                        // Range validations
                        if (config.sampling_rate_sec !== undefined && 
                            config.sampling_rate_sec !== null &&
                            config.sampling_rate_sec <= 0) {
                            errors.push({
                                schemaPath: `logger_main_config[${index}].sampling_rate_sec`,
                                dataPath: `logger_main_config[${index}].sampling_rate_sec`,
                                message: `Logger ${index + 1}: Sampling rate must be greater than 0`,
                                schemaRule: 'minimum',
                                severity: 'error' as const
                            });
                        }

                        if (config.averaging_period_minutes !== undefined && 
                            config.averaging_period_minutes !== null &&
                            config.averaging_period_minutes <= 0) {
                            errors.push({
                                schemaPath: `logger_main_config[${index}].averaging_period_minutes`,
                                dataPath: `logger_main_config[${index}].averaging_period_minutes`,
                                message: `Logger ${index + 1}: Averaging period must be greater than 0`,
                                schemaRule: 'minimum',
                                severity: 'error' as const
                            });
                        }

                        if (config.offset_from_utc_hrs !== undefined &&
                            config.offset_from_utc_hrs !== null &&
                            (config.offset_from_utc_hrs < -12 || config.offset_from_utc_hrs > 14)) {
                            errors.push({
                                schemaPath: `logger_main_config[${index}].offset_from_utc_hrs`,
                                dataPath: `logger_main_config[${index}].offset_from_utc_hrs`,
                                message: `Logger ${index + 1}: UTC offset must be between -12 and +14 hours`,
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
                            schemaPath: 'logger_main_config',
                            dataPath: 'logger_main_config',
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
    }, [loggerConfigs]);

    const addLogger = () => {
        const now = new Date().toISOString();
        const newConfig: LoggerMainConfig = {
            logger_oem_id: 'NRG Systems',
            logger_model_name: '',
            logger_serial_number: '',
            logger_firmware_version: '',
            logger_id: '',
            logger_name: '',
            date_from: now,
            date_to: null,
            encryption_pin_or_key: '',
            enclosure_lock_details: '',
            data_transfer_details: '',
            offset_from_utc_hrs: 0,
            sampling_rate_sec: 1,
            averaging_period_minutes: 10,
            timestamp_is_end_of_period: true,
            clock_is_auto_synced: false,
            notes: '',
            update_at: now
        };

        const updatedConfigs = [...(loggerConfigs || []), newConfig];
        setValue(`measurement_location.${locationIndex}.logger_main_config`, updatedConfigs);
    };

    const removeLogger = (configIndex: number) => {
        if (!loggerConfigs) return;

        const updatedConfigs = loggerConfigs.filter((_, index) => index !== configIndex);
        setValue(`measurement_location.${locationIndex}.logger_main_config`, updatedConfigs);
    };

    const updateLogger = (configIndex: number, field: string, value: any) => {
        if (!loggerConfigs) return;

        const updatedConfigs = [...loggerConfigs];
        (updatedConfigs[configIndex] as any)[field] = value;
        updatedConfigs[configIndex].update_at = new Date().toISOString();

        setValue(`measurement_location.${locationIndex}.logger_main_config`, updatedConfigs);
    };

    if (!loggerConfigs) {
        return null; // Will be initialized by useEffect
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <HardDrive className="w-5 h-5" />
                    <div>
                        <div>Logger Configuration</div>
                        <div className="text-sm font-normal text-muted-foreground">
                            Data logging system configuration for {locationName}
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
                            <div className="font-medium">Physical Measurement Station</div>
                            <div className="text-sm">
                                Logger configuration is required for physical measurement stations ({stationType}). 
                                This defines how data is collected, stored, and timestamped.
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>

                {/* Add Logger Button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium">Logger Configurations</h4>
                        <p className="text-sm text-muted-foreground">
                            Define the data logging systems for different time periods
                        </p>
                    </div>
                    <Button onClick={addLogger} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Logger
                    </Button>
                </div>

                {/* Loggers List */}
                <div className="space-y-4">
                    {loggerConfigs.map((config, configIndex) => (
                        <Card key={configIndex} className="bg-muted/20">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">
                                        Logger {configIndex + 1}
                                        {config.logger_name && (
                                            <span className="font-normal text-muted-foreground ml-2">
                                                ({config.logger_name})
                                            </span>
                                        )}
                                    </CardTitle>
                                    {loggerConfigs.length > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeLogger(configIndex)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="basic" className="space-y-4">
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                        <TabsTrigger value="timing">
                                            <Clock className="w-4 h-4 mr-1" />
                                            Timing
                                        </TabsTrigger>
                                        <TabsTrigger value="security">
                                            <Shield className="w-4 h-4 mr-1" />
                                            Security
                                        </TabsTrigger>
                                        <TabsTrigger value="notes">Notes</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="basic" className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>
                                                    Logger OEM <span className="text-red-500">*</span>
                                                </Label>
                                                <SearchableSelect
                                                    options={loggerOEMOptions}
                                                    value={config.logger_oem_id}
                                                    onValueChange={(value) => updateLogger(
                                                        configIndex,
                                                        'logger_oem_id',
                                                        value as LoggerOEM
                                                    )}
                                                    placeholder="Select logger manufacturer..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Logger Model</Label>
                                                <Input
                                                    value={config.logger_model_name || ''}
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'logger_model_name',
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
                                                    value={config.logger_serial_number}
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'logger_serial_number',
                                                        e.target.value
                                                    )}
                                                    placeholder="Serial number..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Firmware Version</Label>
                                                <Input
                                                    value={config.logger_firmware_version || ''}
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'logger_firmware_version',
                                                        e.target.value || undefined
                                                    )}
                                                    placeholder="Firmware version..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Logger ID</Label>
                                                <Input
                                                    value={config.logger_id || ''}
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'logger_id',
                                                        e.target.value || undefined
                                                    )}
                                                    placeholder="Logger identifier..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Logger Name</Label>
                                                <Input
                                                    value={config.logger_name || ''}
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'logger_name',
                                                        e.target.value || undefined
                                                    )}
                                                    placeholder="Descriptive name..."
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
                                                    value={config.date_from ? config.date_from.slice(0, 16) : ''}
                                                    onChange={(e) => updateLogger(
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
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'date_to',
                                                        e.target.value ? new Date(e.target.value).toISOString() : null
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="timing" className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>UTC Offset (hours)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.5"
                                                    min="-12"
                                                    max="14"
                                                    value={config.offset_from_utc_hrs || ''}
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'offset_from_utc_hrs',
                                                        e.target.value ? parseFloat(e.target.value) : undefined
                                                    )}
                                                    placeholder="Hours from UTC..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Sampling Rate (seconds)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min="0.1"
                                                    value={config.sampling_rate_sec || ''}
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'sampling_rate_sec',
                                                        e.target.value ? parseFloat(e.target.value) : undefined
                                                    )}
                                                    placeholder="Sampling interval..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Averaging Period (minutes)</Label>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    min="1"
                                                    value={config.averaging_period_minutes || ''}
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'averaging_period_minutes',
                                                        e.target.value ? parseInt(e.target.value) : undefined
                                                    )}
                                                    placeholder="Minutes (e.g., 10)..."
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`timestamp-end-${locationIndex}-${configIndex}`}
                                                    checked={config.timestamp_is_end_of_period || false}
                                                    onCheckedChange={(checked) => updateLogger(
                                                        configIndex,
                                                        'timestamp_is_end_of_period',
                                                        checked as boolean
                                                    )}
                                                />
                                                <Label htmlFor={`timestamp-end-${locationIndex}-${configIndex}`}>
                                                    Timestamp represents end of averaging period
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`auto-sync-${locationIndex}-${configIndex}`}
                                                    checked={config.clock_is_auto_synced || false}
                                                    onCheckedChange={(checked) => updateLogger(
                                                        configIndex,
                                                        'clock_is_auto_synced',
                                                        checked as boolean
                                                    )}
                                                />
                                                <Label htmlFor={`auto-sync-${locationIndex}-${configIndex}`}>
                                                    Clock is automatically synchronized
                                                </Label>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="security" className="space-y-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Encryption PIN/Key</Label>
                                                <Input
                                                    type="password"
                                                    value={config.encryption_pin_or_key || ''}
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'encryption_pin_or_key',
                                                        e.target.value || undefined
                                                    )}
                                                    placeholder="Encryption credentials..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Enclosure Lock Details</Label>
                                                <Textarea
                                                    value={config.enclosure_lock_details || ''}
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'enclosure_lock_details',
                                                        e.target.value || undefined
                                                    )}
                                                    placeholder="Lock type, combination, key details..."
                                                    rows={2}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Data Transfer Details</Label>
                                                <Textarea
                                                    value={config.data_transfer_details || ''}
                                                    onChange={(e) => updateLogger(
                                                        configIndex,
                                                        'data_transfer_details',
                                                        e.target.value || undefined
                                                    )}
                                                    placeholder="Communication method, protocols, access details..."
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="notes" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Notes</Label>
                                            <Textarea
                                                value={config.notes || ''}
                                                onChange={(e) => updateLogger(
                                                    configIndex,
                                                    'notes',
                                                    e.target.value || undefined
                                                )}
                                                placeholder="Enter any additional notes about this logger configuration..."
                                                rows={4}
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Configuration Guidelines */}
                <Alert>
                    <HardDrive className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <div className="font-medium">Logger Configuration Guidelines:</div>
                            <ul className="text-sm space-y-1">
                                <li>• Serial number uniquely identifies the logger device</li>
                                <li>• UTC offset should match the local timezone for data interpretation</li>
                                <li>• Sampling rate defines how often measurements are taken</li>
                                <li>• Averaging period defines the final data output interval</li>
                                <li>• Multiple logger configurations can represent different time periods or settings</li>
                                <li>• Security details help with maintenance and data retrieval</li>
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
};