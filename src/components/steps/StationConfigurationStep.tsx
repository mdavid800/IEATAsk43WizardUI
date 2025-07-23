import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Settings, AlertCircle, CheckCircle2, Info, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConditionalStationConfig } from '@/components/station-config/ConditionalStationConfig';
import { LoggerConfigurationForm } from '@/components/station-config/LoggerConfigurationForm';
import { SensorManagementForm } from '@/components/station-config/SensorManagementForm';
import { schemaValidator, type ValidationResult } from '@/services/schema-validator';
import type { IEATask43Schema } from '@/types/schema';

interface StationConfigurationStepProps {
    currentLocationIndex: number;
    totalLocations: number;
    onLocationChange: (index: number) => void;
    onNext: () => void;
    onPrevious: () => void;
}

export const StationConfigurationStep: React.FC<StationConfigurationStepProps> = ({
    currentLocationIndex,
    totalLocations,
    onLocationChange,
    onNext,
    onPrevious
}) => {
    const { watch } = useFormContext<IEATask43Schema>();
    const [validation, setValidation] = useState<ValidationResult | null>(null);

    const locations = watch('measurement_location') || [];
    const currentLocation = locations[currentLocationIndex];
    const stationType = currentLocation?.measurement_station_type_id;

    // Validate current location's station configuration
    useEffect(() => {
        if (currentLocation) {
            const validateData = async () => {
                try {
                    const errors = [];
                    const warnings = [];

                    // Validate based on station type
                    if (stationType === 'mast') {
                        if (!currentLocation.mast_properties || currentLocation.mast_properties.length === 0) {
                            warnings.push({
                                schemaPath: 'mast_properties',
                                dataPath: 'mast_properties',
                                message: 'Mast properties should be defined for mast stations',
                                schemaRule: 'recommended',
                                severity: 'warning' as const
                            });
                        }
                    } else if (['lidar', 'sodar', 'floating_lidar', 'wave_buoy', 'adcp'].includes(stationType)) {
                        if (!currentLocation.vertical_profiler_properties || currentLocation.vertical_profiler_properties.length === 0) {
                            warnings.push({
                                schemaPath: 'vertical_profiler_properties',
                                dataPath: 'vertical_profiler_properties',
                                message: 'Vertical profiler properties should be defined for this station type',
                                schemaRule: 'recommended',
                                severity: 'warning' as const
                            });
                        }
                    } else if (['reanalysis', 'virtual_met_mast'].includes(stationType)) {
                        if (!currentLocation.model_config || currentLocation.model_config.length === 0) {
                            warnings.push({
                                schemaPath: 'model_config',
                                dataPath: 'model_config',
                                message: 'Model configuration should be defined for model-based stations',
                                schemaRule: 'recommended',
                                severity: 'warning' as const
                            });
                        }
                    }

                    // Check for logger configuration on physical stations
                    const physicalStations = ['mast', 'lidar', 'sodar', 'floating_lidar', 'wave_buoy', 'adcp'];
                    if (physicalStations.includes(stationType)) {
                        if (!currentLocation.logger_main_config || currentLocation.logger_main_config.length === 0) {
                            errors.push({
                                schemaPath: 'logger_main_config',
                                dataPath: 'logger_main_config',
                                message: 'Logger configuration is required for physical measurement stations',
                                schemaRule: 'required',
                                severity: 'error' as const
                            });
                        }

                        if (!currentLocation.sensors || currentLocation.sensors.length === 0) {
                            warnings.push({
                                schemaPath: 'sensors',
                                dataPath: 'sensors',
                                message: 'Sensor inventory should be defined for physical measurement stations',
                                schemaRule: 'recommended',
                                severity: 'warning' as const
                            });
                        }
                    }

                    setValidation({
                        isValid: errors.length === 0,
                        errors,
                        warnings
                    });
                } catch (error) {
                    setValidation({
                        isValid: false,
                        errors: [{
                            schemaPath: 'station_configuration',
                            dataPath: 'station_configuration',
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
    }, [currentLocation, stationType]);

    const getStationTypeLabel = (type: string) => {
        const labels = {
            'mast': 'Meteorological Mast',
            'lidar': 'LiDAR System',
            'sodar': 'SODAR System',
            'floating_lidar': 'Floating LiDAR',
            'wave_buoy': 'Wave Buoy',
            'adcp': 'ADCP System',
            'reanalysis': 'Reanalysis Data',
            'virtual_met_mast': 'Virtual Met Mast'
        };
        return labels[type as keyof typeof labels] || type?.toUpperCase();
    };

    const getRequiredTabs = () => {
        const tabs = ['station'];
        
        const physicalStations = ['mast', 'lidar', 'sodar', 'floating_lidar', 'wave_buoy', 'adcp'];
        if (physicalStations.includes(stationType)) {
            tabs.push('logger', 'sensors');
        }
        
        return tabs;
    };

    const isTabRequired = (tab: string) => {
        return getRequiredTabs().includes(tab);
    };

    if (!currentLocation) {
        return (
            <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Location Selected</h3>
                <p className="text-muted-foreground">Please add measurement locations first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Settings className="w-6 h-6" />
                        Station Configuration
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Configure measurement station properties, logging systems, and sensor inventory
                    </p>
                </div>
                {validation && (
                    <Badge variant={validation.isValid ? "default" : "destructive"} className="text-sm">
                        {validation.isValid ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Valid Configuration
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Configuration Issues
                            </>
                        )}
                    </Badge>
                )}
            </div>

            {/* Location Navigation */}
            {totalLocations > 1 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={() => onLocationChange(Math.max(0, currentLocationIndex - 1))}
                                disabled={currentLocationIndex === 0}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Previous Location
                            </Button>
                            
                            <div className="text-center">
                                <div className="font-medium">
                                    {currentLocation.name || `Location ${currentLocationIndex + 1}`}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {getStationTypeLabel(stationType)} • {currentLocationIndex + 1} of {totalLocations}
                                </div>
                            </div>
                            
                            <Button
                                variant="outline"
                                onClick={() => onLocationChange(Math.min(totalLocations - 1, currentLocationIndex + 1))}
                                disabled={currentLocationIndex === totalLocations - 1}
                            >
                                Next Location
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Validation Summary */}
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

            {validation && validation.warnings.length > 0 && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-1">
                            <div className="font-medium">Recommendations:</div>
                            {validation.warnings.map((warning, index) => (
                                <div key={index} className="text-sm">• {warning.message}</div>
                            ))}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Configuration Tabs */}
            <Tabs defaultValue="station" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="station" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Station Properties
                        {isTabRequired('station') && <span className="text-red-500">*</span>}
                    </TabsTrigger>
                    <TabsTrigger 
                        value="logger" 
                        disabled={!isTabRequired('logger')}
                        className="flex items-center gap-2"
                    >
                        Logger Configuration
                        {isTabRequired('logger') && <span className="text-red-500">*</span>}
                    </TabsTrigger>
                    <TabsTrigger 
                        value="sensors" 
                        disabled={!isTabRequired('sensors')}
                        className="flex items-center gap-2"
                    >
                        Sensor Management
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="station" className="space-y-4">
                    <ConditionalStationConfig locationIndex={currentLocationIndex} />
                </TabsContent>

                <TabsContent value="logger" className="space-y-4">
                    {isTabRequired('logger') ? (
                        <LoggerConfigurationForm locationIndex={currentLocationIndex} />
                    ) : (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Logger configuration is not required for {getStationTypeLabel(stationType)} stations.
                                Model-based and virtual stations do not use physical data loggers.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="sensors" className="space-y-4">
                    {isTabRequired('sensors') ? (
                        <SensorManagementForm locationIndex={currentLocationIndex} />
                    ) : (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Sensor management is not applicable for {getStationTypeLabel(stationType)} stations.
                                Model-based and virtual stations do not use physical sensors.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>
            </Tabs>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6">
                <Button variant="outline" onClick={onPrevious}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous Step
                </Button>
                
                <div className="text-sm text-muted-foreground">
                    Configure station properties, logging systems, and sensor inventory
                </div>
                
                <Button 
                    onClick={onNext}
                    disabled={validation && !validation.isValid}
                >
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>

            {/* Configuration Guidelines */}
            <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                    <div className="space-y-2">
                        <div className="font-medium">Station Configuration Guidelines:</div>
                        <ul className="text-sm space-y-1">
                            <li>• <strong>Station Properties:</strong> Define type-specific configuration (mast geometry, device orientation, model parameters)</li>
                            <li>• <strong>Logger Configuration:</strong> Required for physical stations - defines data collection and timing parameters</li>
                            <li>• <strong>Sensor Management:</strong> Optional but recommended - tracks physical sensor inventory and calibration history</li>
                            <li>• <strong>Multiple Configurations:</strong> Use date ranges to define different settings for different time periods</li>
                            <li>• <strong>Schema Compliance:</strong> All configurations are validated against the IEA Task 43 standard</li>
                        </ul>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    );
};