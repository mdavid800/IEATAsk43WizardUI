import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle, Info, Settings, Database, Tower } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MastPropertiesForm } from './MastPropertiesForm';
import { VerticalProfilerPropertiesForm } from './VerticalProfilerPropertiesForm';
import { ModelConfigForm } from './ModelConfigForm';
import { schemaValidator } from '@/services/schema-validator';
import type { 
    IEATask43Schema, 
    MeasurementLocation,
    MeasurementStationType 
} from '@/types/schema';

interface ConditionalStationConfigProps {
    locationIndex: number;
}

interface StationConfig {
    stationType: MeasurementStationType;
    showMastProperties: boolean;
    showVerticalProfilerProperties: boolean;
    showModelConfig: boolean;
    showLoggerConfig: boolean;
    configName: string;
    description: string;
    icon: React.ReactNode;
    requirements: string[];
}

export const ConditionalStationConfig: React.FC<ConditionalStationConfigProps> = ({
    locationIndex
}) => {
    const { watch, setValue } = useFormContext<IEATask43Schema>();
    const location = watch(`measurement_location.${locationIndex}`) as MeasurementLocation;
    const stationType = location?.measurement_station_type_id;

    // Configuration mapping based on measurement station type
    const stationConfig = useMemo((): StationConfig | null => {
        if (!stationType) return null;

        const configs: Record<MeasurementStationType, StationConfig> = {
            'mast': {
                stationType: 'mast',
                showMastProperties: true,
                showVerticalProfilerProperties: false,
                showModelConfig: false,
                showLoggerConfig: true,
                configName: 'Met Mast Configuration',
                description: 'Physical meteorological mast with height-based measurements',
                icon: <Tower className="w-5 h-5" />,
                requirements: [
                    'Mast properties (geometry, height, sections)',
                    'Logger configuration required',
                    'Physical measurement points'
                ]
            },
            'lidar': {
                stationType: 'lidar',
                showMastProperties: false,
                showVerticalProfilerProperties: true,
                showModelConfig: false,
                showLoggerConfig: true,
                configName: 'LiDAR Configuration',
                description: 'Light Detection and Ranging vertical profiler',
                icon: <Settings className="w-5 h-5" />,
                requirements: [
                    'Vertical profiler properties (orientation, height reference)',
                    'Logger configuration required',
                    'Remote sensing measurement points'
                ]
            },
            'sodar': {
                stationType: 'sodar',
                showMastProperties: false,
                showVerticalProfilerProperties: true,
                showModelConfig: false,
                showLoggerConfig: true,
                configName: 'SODAR Configuration',
                description: 'Sonic Detection and Ranging vertical profiler',
                icon: <Settings className="w-5 h-5" />,
                requirements: [
                    'Vertical profiler properties (orientation, height reference)',
                    'Logger configuration required',
                    'Acoustic measurement points'
                ]
            },
            'floating_lidar': {
                stationType: 'floating_lidar',
                showMastProperties: false,
                showVerticalProfilerProperties: true,
                showModelConfig: false,
                showLoggerConfig: true,
                configName: 'Floating LiDAR Configuration',
                description: 'Marine-deployed LiDAR system',
                icon: <Settings className="w-5 h-5" />,
                requirements: [
                    'Vertical profiler properties (orientation, height reference)',
                    'Logger configuration required',
                    'Marine measurement points'
                ]
            },
            'wave_buoy': {
                stationType: 'wave_buoy',
                showMastProperties: false,
                showVerticalProfilerProperties: true,
                showModelConfig: false,
                showLoggerConfig: true,
                configName: 'Wave Buoy Configuration',
                description: 'Marine wave measurement system',
                icon: <Settings className="w-5 h-5" />,
                requirements: [
                    'Vertical profiler properties (orientation, height reference)',
                    'Logger configuration required',
                    'Wave and marine measurement points'
                ]
            },
            'adcp': {
                stationType: 'adcp',
                showMastProperties: false,
                showVerticalProfilerProperties: true,
                showModelConfig: false,
                showLoggerConfig: true,
                configName: 'ADCP Configuration',
                description: 'Acoustic Doppler Current Profiler',
                icon: <Settings className="w-5 h-5" />,
                requirements: [
                    'Vertical profiler properties (orientation, height reference)',
                    'Logger configuration required',
                    'Current and water measurement points'
                ]
            },
            'solar': {
                stationType: 'solar',
                showMastProperties: false,
                showVerticalProfilerProperties: false,
                showModelConfig: false,
                showLoggerConfig: true,
                configName: 'Solar Measurement Configuration',
                description: 'Solar irradiance measurement station',
                icon: <Settings className="w-5 h-5" />,
                requirements: [
                    'Logger configuration required',
                    'Solar measurement points'
                ]
            },
            'virtual_met_mast': {
                stationType: 'virtual_met_mast',
                showMastProperties: false,
                showVerticalProfilerProperties: false,
                showModelConfig: true,
                showLoggerConfig: false,
                configName: 'Virtual Met Mast Configuration',
                description: 'Model-based virtual measurement station',
                icon: <Database className="w-5 h-5" />,
                requirements: [
                    'Model configuration required',
                    'Logger configuration not allowed',
                    'Virtual measurement points'
                ]
            },
            'reanalysis': {
                stationType: 'reanalysis',
                showMastProperties: false,
                showVerticalProfilerProperties: false,
                showModelConfig: true,
                showLoggerConfig: false,
                configName: 'Reanalysis Configuration',
                description: 'Reanalysis data source configuration',
                icon: <Database className="w-5 h-5" />,
                requirements: [
                    'Model configuration required',
                    'Logger configuration not allowed',
                    'Reanalysis measurement points'
                ]
            }
        };

        return configs[stationType] || null;
    }, [stationType]);

    // Validate configuration completeness
    const validateConfiguration = () => {
        if (!stationConfig) return { isValid: false, errors: ['No station type selected'] };

        const errors: string[] = [];

        // Check required configurations
        if (stationConfig.showMastProperties && !location.mast_properties) {
            errors.push('Mast properties configuration is required for mast stations');
        }

        if (stationConfig.showVerticalProfilerProperties && (!location.vertical_profiler_properties || location.vertical_profiler_properties.length === 0)) {
            errors.push('Vertical profiler properties configuration is required');
        }

        if (stationConfig.showModelConfig && (!location.model_config || location.model_config.length === 0)) {
            errors.push('Model configuration is required for virtual/reanalysis stations');
        }

        if (stationConfig.showLoggerConfig && (!location.logger_main_config || location.logger_main_config.length === 0)) {
            errors.push('Logger configuration is required for physical measurement stations');
        }

        // Check conflicting configurations
        if (!stationConfig.showLoggerConfig && location.logger_main_config && location.logger_main_config.length > 0) {
            errors.push('Logger configuration should not be present for virtual/reanalysis stations');
        }

        if (!stationConfig.showModelConfig && location.model_config && location.model_config.length > 0) {
            errors.push('Model configuration should not be present for physical measurement stations');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    };

    const validation = validateConfiguration();

    if (!stationType) {
        return (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Select a measurement station type to configure station-specific properties.
                </AlertDescription>
            </Alert>
        );
    }

    if (!stationConfig) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Unknown measurement station type: {stationType}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Configuration Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        {stationConfig.icon}
                        <div>
                            <div>{stationConfig.configName}</div>
                            <div className="text-sm font-normal text-muted-foreground">
                                {stationConfig.description}
                            </div>
                        </div>
                        <div className="ml-auto">
                            <Badge variant={validation.isValid ? "default" : "destructive"}>
                                {validation.isValid ? "Valid" : "Incomplete"}
                            </Badge>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm">Configuration Requirements:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            {stationConfig.requirements.map((requirement, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="select-none">•</span>
                                    <span>{requirement}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Validation Errors */}
            {!validation.isValid && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-1">
                            <div className="font-medium">Configuration Issues:</div>
                            {validation.errors.map((error, index) => (
                                <div key={index} className="text-sm">• {error}</div>
                            ))}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Conditional Configuration Forms */}
            <div className="space-y-6">
                {/* Mast Properties */}
                {stationConfig.showMastProperties && (
                    <MastPropertiesForm locationIndex={locationIndex} />
                )}

                {/* Vertical Profiler Properties */}
                {stationConfig.showVerticalProfilerProperties && (
                    <VerticalProfilerPropertiesForm locationIndex={locationIndex} />
                )}

                {/* Model Configuration */}
                {stationConfig.showModelConfig && (
                    <ModelConfigForm locationIndex={locationIndex} />
                )}
            </div>

            {/* Schema Compliance Info */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    <div className="space-y-2">
                        <div className="font-medium">Schema Compliance Notes:</div>
                        <ul className="text-sm space-y-1">
                            <li>• All configurations are validated against the IEA Task 43 schema</li>
                            <li>• Required fields are enforced based on measurement station type</li>
                            <li>• Conflicting configurations are automatically detected and prevented</li>
                            {stationConfig.showLoggerConfig && (
                                <li>• Logger configuration will be available after completing station properties</li>
                            )}
                        </ul>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    );
};