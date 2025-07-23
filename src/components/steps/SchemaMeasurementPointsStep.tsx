import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { PlusCircle, ChevronDown, AlertCircle, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SchemaAwareDataGrid } from '@/components/measurement-points/SchemaAwareDataGrid';
import { SchemaBulkEditDialog } from '@/components/measurement-points/SchemaBulkEditDialog';
import { schemaValidator } from '@/services/schema-validator';
import { getDefaultDatesForNewEntry } from '@/utils/campaign-dates';
import type {
    IEATask43Schema,
    MeasurementPoint,
    Sensor
} from '@/types/schema';

interface ValidationSummary {
    valid: boolean;
    issues: string[];
    totalPoints: number;
    validPoints: number;
    invalidPoints: number;
}

export function SchemaMeasurementPointsStep() {
    const { setValue, watch } = useFormContext<IEATask43Schema>();
    const locations = watch('measurement_location') || [];
    
    const [expandedLocations, setExpandedLocations] = useState<{ [key: string]: boolean }>(
        locations.reduce((acc, loc, index) => {
            const locationId = loc.uuid || `location-${index}`;
            return { ...acc, [locationId]: true };
        }, {})
    );
    
    const [expandedLoggers, setExpandedLoggers] = useState<{ [key: string]: boolean }>({});
    const [selectedPoints, setSelectedPoints] = useState<{ [key: string]: number[] }>({});
    const [isBulkEditOpen, setBulkEditOpen] = useState(false);
    const [currentBulkEditData, setCurrentBulkEditData] = useState<{
        locationIndex: number;
        loggerIndex: number;
        points: MeasurementPoint[];
        indices: number[];
    } | null>(null);

    // Validate all measurement points
    const validateMeasurementPoints = (): ValidationSummary => {
        const issues: string[] = [];
        let totalPoints = 0;
        let validPoints = 0;

        locations.forEach((location, locationIndex) => {
            if (!location.measurement_point || location.measurement_point.length === 0) {
                issues.push(`Location "${location.name || `Location ${locationIndex + 1}`}" has no measurement points`);
                return;
            }

            totalPoints += location.measurement_point.length;

            location.measurement_point.forEach((point, pointIndex) => {
                // Schema validation
                const validation = schemaValidator.validatePath(
                    point,
                    'measurement_location.items.properties.measurement_point.items'
                );

                if (validation.isValid) {
                    validPoints++;
                } else {
                    validation.errors.forEach(error => {
                        issues.push(
                            `Point "${point.name || `Point ${pointIndex + 1}`}" in "${location.name}": ${error.message}`
                        );
                    });
                }

                // Basic validation
                if (!point.name || point.name.trim() === '') {
                    issues.push(`Point ${pointIndex + 1} in "${location.name}" needs a name`);
                }

                if (!point.measurement_type_id) {
                    issues.push(`Point "${point.name}" in "${location.name}" needs a measurement type`);
                }

                if (!point.logger_measurement_config || point.logger_measurement_config.length === 0) {
                    issues.push(`Point "${point.name}" in "${location.name}" needs logger configuration`);
                }
            });
        });

        return {
            valid: issues.length === 0,
            issues,
            totalPoints,
            validPoints,
            invalidPoints: totalPoints - validPoints
        };
    };

    const validationResult = validateMeasurementPoints();

    const addMeasurementPoint = (locationIndex: number, loggerIndex: number) => {
        const location = locations[locationIndex];
        const logger = location.logger_main_config?.[loggerIndex];
        
        if (!logger) return;

        const formData = watch();
        const defaultDates = getDefaultDatesForNewEntry(formData);
        const currentPoints = location.measurement_point || [];
        
        const newPoint: MeasurementPoint = {
            name: '',
            measurement_type_id: 'other',
            height_m: 0,
            height_reference_id: 'ground_level',
            update_at: new Date().toISOString(),
            logger_measurement_config: [{
                logger_id: logger.logger_id || logger.logger_serial_number || '',
                date_from: defaultDates.date_from,
                date_to: defaultDates.date_to,
                update_at: new Date().toISOString(),
                column_name: []
            }],
            sensor: []
        };

        const updatedPoints = [...currentPoints, newPoint];
        setValue(`measurement_location.${locationIndex}.measurement_point`, updatedPoints);
    };

    const updateMeasurementPoints = (locationIndex: number, points: MeasurementPoint[]) => {
        setValue(`measurement_location.${locationIndex}.measurement_point`, points);
    };

    const toggleLocationExpand = (locationId: string) => {
        setExpandedLocations(prev => ({
            ...prev,
            [locationId]: !prev[locationId]
        }));
    };

    const toggleLoggerExpand = (loggerId: string) => {
        setExpandedLoggers(prev => ({
            ...prev,
            [loggerId]: !prev[loggerId]
        }));
    };

    const handleBulkEdit = (locationIndex: number, loggerIndex: number) => {
        const location = locations[locationIndex];
        const logger = location.logger_main_config?.[loggerIndex];
        const loggerIdentifier = logger?.logger_id || logger?.logger_serial_number || '';
        
        // Get points for this logger
        const allPoints = location.measurement_point || [];
        const loggerPoints = allPoints.filter(point => 
            point.logger_measurement_config?.[0]?.logger_id === loggerIdentifier
        );
        
        const selectedIndices = selectedPoints[`${locationIndex}-${loggerIndex}`] || [];
        const selectedPointsData = selectedIndices.map(index => loggerPoints[index]).filter(Boolean);

        if (selectedPointsData.length === 0) return;

        setCurrentBulkEditData({
            locationIndex,
            loggerIndex,
            points: selectedPointsData,
            indices: selectedIndices
        });
        setBulkEditOpen(true);
    };

    const handleBulkEditComplete = (updatedPoints: MeasurementPoint[]) => {
        if (!currentBulkEditData) return;

        const { locationIndex, loggerIndex } = currentBulkEditData;
        const location = locations[locationIndex];
        const logger = location.logger_main_config?.[loggerIndex];
        const loggerIdentifier = logger?.logger_id || logger?.logger_serial_number || '';
        
        // Update the points for this logger
        const allPoints = [...(location.measurement_point || [])];
        const selectedIndices = selectedPoints[`${locationIndex}-${loggerIndex}`] || [];
        
        // Find actual indices in the full points array
        const loggerPointIndices: number[] = [];
        allPoints.forEach((point, index) => {
            if (point.logger_measurement_config?.[0]?.logger_id === loggerIdentifier) {
                loggerPointIndices.push(index);
            }
        });

        // Apply updates
        selectedIndices.forEach((selectedIndex, i) => {
            const actualIndex = loggerPointIndices[selectedIndex];
            if (actualIndex !== undefined && updatedPoints[i]) {
                allPoints[actualIndex] = updatedPoints[i];
            }
        });

        setValue(`measurement_location.${locationIndex}.measurement_point`, allPoints);
        setSelectedPoints(prev => ({ ...prev, [`${locationIndex}-${loggerIndex}`]: [] }));
        setBulkEditOpen(false);
        setCurrentBulkEditData(null);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="border-b border-border/20 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-primary mb-2">
                            Measurement Points
                        </h2>
                        <p className="text-muted-foreground">
                            Define measurement points with schema validation and enhanced CSV import capabilities.
                        </p>
                    </div>
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                        validationResult.valid
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                    )}>
                        {validationResult.valid ? (
                            <>
                                <Check className="w-4 h-4" />
                                <span>Schema Valid</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-4 h-4" />
                                <span>{validationResult.issues.length} issue{validationResult.issues.length !== 1 ? 's' : ''}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Validation Summary */}
                {validationResult.totalPoints > 0 && (
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Check className="w-4 h-4 text-green-600" />
                            <span>{validationResult.validPoints} valid points</span>
                        </div>
                        {validationResult.invalidPoints > 0 && (
                            <div className="flex items-center gap-1">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span>{validationResult.invalidPoints} invalid points</span>
                            </div>
                        )}
                        <div>Total: {validationResult.totalPoints} points</div>
                    </div>
                )}

                {/* Validation Issues */}
                {!validationResult.valid && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="w-5 h-5" />
                        <AlertDescription>
                            <div className="space-y-1">
                                <div className="font-medium">Schema validation issues found:</div>
                                <ul className="text-sm space-y-1 ml-4">
                                    {validationResult.issues.slice(0, 5).map((issue, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="select-none">•</span>
                                            <span>{issue}</span>
                                        </li>
                                    ))}
                                    {validationResult.issues.length > 5 && (
                                        <li className="text-muted-foreground">
                                            ...and {validationResult.issues.length - 5} more issues
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Enhanced Features Info */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    <div className="font-medium mb-1">Enhanced Schema-Aware Features:</div>
                    <ul className="text-sm space-y-1 ml-4">
                        <li>• Real-time schema validation with detailed error messages</li>
                        <li>• Smart CSV import with automatic column mapping and validation</li>
                        <li>• Bulk editing with schema constraint enforcement</li>
                        <li>• CSV template generation based on schema definitions</li>
                    </ul>
                </AlertDescription>
            </Alert>

            {/* Locations and Measurement Points */}
            {locations.map((location, locationIndex) => {
                const locationId = location.uuid || `location-${locationIndex}`;
                
                return (
                    <div key={locationId} className="border border-border rounded-lg overflow-hidden">
                        <div
                            className="bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleLocationExpand(locationId)}
                        >
                            <div className="flex items-center gap-3">
                                <ChevronDown
                                    className={`w-5 h-5 transition-transform ${
                                        expandedLocations[locationId] ? 'transform rotate-0' : 'transform -rotate-90'
                                    }`}
                                />
                                <h3 className="text-lg font-medium text-foreground">
                                    {location.name || `Location ${locationIndex + 1}`}
                                </h3>
                                <Badge variant="secondary">
                                    {location.measurement_station_type_id}
                                </Badge>
                                <div className="ml-auto flex items-center gap-2">
                                    <Badge variant="outline">
                                        {(location.measurement_point || []).length} points
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {expandedLocations[locationId] && (
                            <div className="p-6 border-t border-border">
                                {(location.logger_main_config || []).map((logger, loggerIndex) => {
                                    const loggerId = `${locationId}-${loggerIndex}`;
                                    const loggerIdentifier = logger.logger_id || logger.logger_serial_number || '';
                                    const loggerPoints = (location.measurement_point || []).filter(point =>
                                        point.logger_measurement_config?.[0]?.logger_id === loggerIdentifier
                                    );
                                    const selectedCount = selectedPoints[`${locationIndex}-${loggerIndex}`]?.length || 0;

                                    return (
                                        <div key={loggerId} className="mb-6 last:mb-0">
                                            <div
                                                className="bg-primary/5 p-4 cursor-pointer hover:bg-primary/10 transition-colors rounded-lg"
                                                onClick={() => toggleLoggerExpand(loggerId)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ChevronDown
                                                        className={`w-5 h-5 transition-transform ${
                                                            expandedLoggers[loggerId] ? 'transform rotate-0' : 'transform -rotate-90'
                                                        }`}
                                                    />
                                                    <h4 className="text-base font-medium">
                                                        Logger {loggerIndex + 1}
                                                    </h4>
                                                    <div className="text-sm text-muted-foreground">
                                                        {logger.logger_name || logger.logger_serial_number || 'Unnamed Logger'}
                                                    </div>
                                                    <div className="ml-auto flex items-center gap-2">
                                                        <Badge variant="outline">
                                                            {loggerPoints.length} points
                                                        </Badge>
                                                        {selectedCount > 0 && (
                                                            <Badge variant="default">
                                                                {selectedCount} selected
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedLoggers[loggerId] && (
                                                <div className="mt-4 pl-6 border-l-2 border-primary/30">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="text-sm text-muted-foreground">
                                                            Measurement Points with Schema Validation
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {selectedCount > 0 && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleBulkEdit(locationIndex, loggerIndex)}
                                                                >
                                                                    Bulk Edit ({selectedCount})
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => addMeasurementPoint(locationIndex, loggerIndex)}
                                                                className="bg-primary hover:bg-primary/90"
                                                            >
                                                                <PlusCircle className="w-4 h-4 mr-2" />
                                                                Add Point
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <SchemaAwareDataGrid
                                                        locationIndex={locationIndex}
                                                        loggerIdentifier={loggerIdentifier}
                                                        data={loggerPoints}
                                                        onUpdate={(updatedPoints) => {
                                                            // Update all points for this location, maintaining points from other loggers
                                                            const allPoints = location.measurement_point || [];
                                                            const otherLoggerPoints = allPoints.filter(point =>
                                                                point.logger_measurement_config?.[0]?.logger_id !== loggerIdentifier
                                                            );
                                                            const combinedPoints = [...otherLoggerPoints, ...updatedPoints];
                                                            updateMeasurementPoints(locationIndex, combinedPoints);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Bulk Edit Dialog */}
            {isBulkEditOpen && currentBulkEditData && (
                <SchemaBulkEditDialog
                    isOpen={isBulkEditOpen}
                    onClose={() => {
                        setBulkEditOpen(false);
                        setCurrentBulkEditData(null);
                    }}
                    selectedRows={currentBulkEditData.points}
                    selectedIndices={currentBulkEditData.indices}
                    onBulkEdit={handleBulkEditComplete}
                    availableSensors={locations[currentBulkEditData.locationIndex]?.sensors || []}
                />
            )}
        </div>
    );
}