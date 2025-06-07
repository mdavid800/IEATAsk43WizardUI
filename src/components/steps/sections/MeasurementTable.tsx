import { useFormContext } from 'react-hook-form';
import { Trash2, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select'; // Assuming this path
import { useState, useMemo } from 'react';
import type {
    IEATask43Schema,
    MeasurementType,
    HeightReference,
    Sensor
} from '@/types/schema';

export interface BulkEditValues {
    measurement_type_id: MeasurementType | '';
    height_m: string;
    height_reference_id: HeightReference | '';
    unit: string;
    sensors: Sensor[];
}

interface FilterValues {
    name: string;
    measurement_type_id: MeasurementType | 'all';
    height_m: string;
    height_reference_id: HeightReference | 'all';
    unit: string;
    notes: string;
}

interface MeasurementTableProps {
    locationIndex: number;
    loggerIdentifier: string;
    selectedPoints: { [key: string]: boolean };
    setSelectedPoints: (update: (prev: { [key: string]: boolean }) => { [key: string]: boolean }) => void;
    bulkEditValues: BulkEditValues;
    setBulkEditValues: (update: (prev: BulkEditValues) => BulkEditValues) => void;
    onRemovePoint: (locationIndex: number, pointIndex: number) => void;
}

export function MeasurementTable({
    locationIndex,
    loggerIdentifier,
    selectedPoints,
    setSelectedPoints,
    bulkEditValues,
    setBulkEditValues,
    onRemovePoint
}: MeasurementTableProps) {
    const { register, setValue, watch } = useFormContext<IEATask43Schema>();

    // Get available sensors for this location
    const availableSensors = watch(`measurement_location.${locationIndex}.sensor`) || [];

    // Memoize and prepare sensor options for the multi-select
    const sensorOptions = useMemo(() => {
        const groupedByOem: { [key: string]: { label: string; value: Sensor }[] } = {};
        availableSensors.forEach((sensor: Sensor) => {
            if (!sensor.oem) return; // Skip if OEM is not defined
            if (!groupedByOem[sensor.oem]) {
                groupedByOem[sensor.oem] = [];
            }
            groupedByOem[sensor.oem].push({
                label: `${sensor.oem} (${sensor.serial_number || 'N/A'})`,
                value: sensor,
            });
        });

        return Object.keys(groupedByOem).map(oem => ({
            label: oem,
            options: groupedByOem[oem],
        }));
    }, [availableSensors]);

    const [filters, setFilters] = useState<FilterValues>({
        name: '',
        measurement_type_id: 'all',
        height_m: '',
        height_reference_id: 'all',
        unit: 'all',
        notes: ''
    });

    const [showFilters, setShowFilters] = useState(false);

    const clearFilters = () => {
        setFilters({
            name: '',
            measurement_type_id: 'all',
            height_m: '',
            height_reference_id: 'all',
            unit: 'all',
            notes: ''
        });
    };

    const hasActiveFilters = filters.name !== '' || filters.measurement_type_id !== 'all' || filters.height_m !== '' || filters.height_reference_id !== 'all' || filters.unit !== 'all' || filters.notes !== '';

    // First filter by logger identifier, then apply user filters
    const allPoints = watch(`measurement_location.${locationIndex}.measurement_point`) || [];

    // Create array of points with their actual indices for better tracking
    const loggerFilteredPointsWithIndices = allPoints
        .map((point, actualIndex) => ({ point, actualIndex }))
        .filter(({ point }) => point.logger_measurement_config?.[0]?.logger_id === loggerIdentifier);

    const filteredPointsWithIndices = loggerFilteredPointsWithIndices.filter(({ point, actualIndex }) => {
        const pointData = watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}`);

        // Apply filters
        if (filters.name && !pointData.name?.toLowerCase().includes(filters.name.toLowerCase())) {
            return false;
        }
        if (filters.measurement_type_id !== 'all' && pointData.measurement_type_id !== filters.measurement_type_id) {
            return false;
        }
        if (filters.height_m && !pointData.height_m?.toString().includes(filters.height_m)) {
            return false;
        }
        if (filters.height_reference_id !== 'all' && pointData.height_reference_id !== filters.height_reference_id) {
            return false;
        }
        if (filters.unit !== 'all' && !pointData.unit?.toLowerCase().includes(filters.unit.toLowerCase())) {
            return false;
        }
        if (filters.notes && !pointData.notes?.toLowerCase().includes(filters.notes.toLowerCase())) {
            return false;
        }

        return true;
    });

    // For backward compatibility, extract just the points
    const filteredPoints = filteredPointsWithIndices.map(({ point }) => point);
    const loggerFilteredPoints = loggerFilteredPointsWithIndices.map(({ point }) => point);

    const handleBulkEdit = () => {
        // Only apply bulk edit to filtered and selected points
        filteredPointsWithIndices.forEach(({ point, actualIndex }) => {
            if (selectedPoints[`${locationIndex}-${actualIndex}`]) {
                if (bulkEditValues.measurement_type_id) {
                    setValue(
                        `measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`,
                        bulkEditValues.measurement_type_id as MeasurementType
                    );
                }
                if (bulkEditValues.height_m) {
                    setValue(
                        `measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_m`,
                        parseFloat(bulkEditValues.height_m)
                    );
                }
                if (bulkEditValues.height_reference_id) {
                    setValue(
                        `measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_reference_id`,
                        bulkEditValues.height_reference_id as HeightReference
                    );
                }
                if (bulkEditValues.unit) {
                    setValue(
                        `measurement_location.${locationIndex}.measurement_point.${actualIndex}.unit`,
                        bulkEditValues.unit
                    );
                }
                // Apply selected sensors
                if (bulkEditValues.sensors && bulkEditValues.sensors.length > 0) {
                    // Assuming measurement_point.sensor is the target field.
                    // The schema might expect an array of sensor UUIDs or the full sensor objects.
                    // For now, let's assume it expects the full sensor objects as per BulkEditValues.sensors type.
                    // Adjust if it expects sensor_id or similar.
                    // This will REPLACE existing sensors with the selected ones.
                    setValue(
                        `measurement_location.${locationIndex}.measurement_point.${actualIndex}.sensor`,
                        bulkEditValues.sensors
                    );
                }
            }
        });

        // Reset bulk edit values and selections
        setBulkEditValues(() => ({
            measurement_type_id: '',
            height_m: '',
            height_reference_id: '',
            unit: '',
            sensors: []
        }));
        setSelectedPoints(() => ({}));
    };

    const toggleSelectAll = () => {
        // Only select/deselect filtered points
        const filteredActualIndices = filteredPointsWithIndices.map(({ actualIndex }) => actualIndex);

        const allFilteredSelected = filteredActualIndices.every(index =>
            selectedPoints[`${locationIndex}-${index}`]
        );

        const newSelectedPoints = { ...selectedPoints };
        filteredActualIndices.forEach(index => {
            newSelectedPoints[`${locationIndex}-${index}`] = !allFilteredSelected;
        });
        setSelectedPoints(() => newSelectedPoints);
    };

    // Check if any filtered points are selected
    const hasSelectedFilteredPoints = filteredPointsWithIndices.some(({ actualIndex }) => {
        return selectedPoints[`${locationIndex}-${actualIndex}`];
    });

    // Get unique units for the unit filter dropdown
    const allUnits = [...new Set(loggerFilteredPoints.map(point => point.unit).filter(Boolean))].sort();

    return (
        <div>
            {/* Filter Toggle and Clear */}
            <div className="mb-4 flex items-center justify-between">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                >
                    <Filter className="w-4 h-4" />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                    {hasActiveFilters && (
                        <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                            {[
                                filters.name !== '',
                                filters.measurement_type_id !== 'all',
                                filters.height_m !== '',
                                filters.height_reference_id !== 'all',
                                filters.unit !== 'all',
                                filters.notes !== ''
                            ].filter(Boolean).length}
                        </span>
                    )}
                </Button>
                {hasActiveFilters && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Filter Controls */}
            {showFilters && (
                <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                    <h5 className="text-sm font-medium mb-3">Filter Points</h5>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                        <div>
                            <Label>Name</Label>
                            <Input
                                value={filters.name}
                                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Filter by name..."
                            />
                        </div>
                        <div>
                            <Label>Measurement Type</Label>
                            <Select
                                value={filters.measurement_type_id}
                                onValueChange={(value) =>
                                    setFilters(prev => ({ ...prev, measurement_type_id: value as MeasurementType | 'all' }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All types</SelectItem>
                                    <SelectItem value="wind_speed">Wind Speed</SelectItem>
                                    <SelectItem value="wind_direction">Wind Direction</SelectItem>
                                    <SelectItem value="temperature">Temperature</SelectItem>
                                    <SelectItem value="pressure">Pressure</SelectItem>
                                    <SelectItem value="humidity">Humidity</SelectItem>
                                    <SelectItem value="wave_height">Wave Height</SelectItem>
                                    <SelectItem value="wave_period">Wave Period</SelectItem>
                                    <SelectItem value="wave_direction">Wave Direction</SelectItem>
                                    <SelectItem value="position">Position</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Height (m)</Label>
                            <Input
                                value={filters.height_m}
                                onChange={(e) => setFilters(prev => ({ ...prev, height_m: e.target.value }))}
                                placeholder="Filter by height..."
                            />
                        </div>
                        <div>
                            <Label>Height Reference</Label>
                            <Select
                                value={filters.height_reference_id}
                                onValueChange={(value) =>
                                    setFilters(prev => ({ ...prev, height_reference_id: value as HeightReference | 'all' }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All references" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All references</SelectItem>
                                    <SelectItem value="ground_level">Ground Level</SelectItem>
                                    <SelectItem value="sea_level">Sea Level</SelectItem>
                                    <SelectItem value="sea_floor">Sea Floor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Unit</Label>
                            <Select
                                value={filters.unit}
                                onValueChange={(value) =>
                                    setFilters(prev => ({ ...prev, unit: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All units" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All units</SelectItem>
                                    {allUnits.map(unit => (
                                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Input
                                value={filters.notes}
                                onChange={(e) => setFilters(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Filter by notes..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Results Summary */}
            <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredPoints.length} of {loggerFilteredPoints.length} points
                {hasActiveFilters && ' (filtered)'}
            </div>

            {/* Bulk Edit Controls */}
            <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                <h5 className="text-sm font-medium mb-3">Bulk Edit Selected Points</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"> {/* Adjusted grid for new field */}
                    <div>
                        <Label>Measurement Type</Label>
                        <Select
                            value={bulkEditValues.measurement_type_id}
                            onValueChange={(value: MeasurementType) =>
                                setBulkEditValues(prev => ({ ...prev, measurement_type_id: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select measurement type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="wind_speed">Wind Speed</SelectItem>
                                <SelectItem value="wind_direction">Wind Direction</SelectItem>
                                <SelectItem value="temperature">Temperature</SelectItem>
                                <SelectItem value="pressure">Pressure</SelectItem>
                                <SelectItem value="humidity">Humidity</SelectItem>
                                <SelectItem value="wave_height">Wave Height</SelectItem>
                                <SelectItem value="wave_period">Wave Period</SelectItem>
                                <SelectItem value="wave_direction">Wave Direction</SelectItem>
                                <SelectItem value="position">Position</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Height (m)</Label>
                        <Input
                            type="number"
                            step="0.1"
                            value={bulkEditValues.height_m}
                            onChange={(e) => setBulkEditValues(prev => ({ ...prev, height_m: e.target.value }))}
                            placeholder="Enter height"
                        />
                    </div>
                    <div>
                        <Label>Height Reference</Label>
                        <Select
                            value={bulkEditValues.height_reference_id}
                            onValueChange={(value: HeightReference) =>
                                setBulkEditValues(prev => ({ ...prev, height_reference_id: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select height reference" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ground_level">Ground Level</SelectItem>
                                <SelectItem value="sea_level">Sea Level</SelectItem>
                                <SelectItem value="sea_floor">Sea Floor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Unit</Label>
                        <Input
                            value={bulkEditValues.unit}
                            onChange={(e) => setBulkEditValues(prev => ({ ...prev, unit: e.target.value }))}
                            placeholder="Enter unit (e.g., m/s, deg)"
                        />
                    </div>
                    <div>
                        <Label>Sensors</Label>
                        <MultiSelect
                            options={sensorOptions}
                            selected={bulkEditValues.sensors} // Pass the array of Sensor objects directly
                            onChange={(selectedSensorValues: Sensor[]) => {
                                setBulkEditValues(prev => ({ ...prev, sensors: selectedSensorValues }));
                            }}
                            placeholder="Select sensors"
                            className="w-full"
                        />
                    </div>
                </div>
                <div className="mt-3 flex justify-end">
                    <Button
                        type="button"
                        onClick={handleBulkEdit}
                        disabled={!hasSelectedFilteredPoints}
                    >
                        Apply to Selected ({filteredPointsWithIndices.filter(({ actualIndex }) => {
                            return selectedPoints[`${locationIndex}-${actualIndex}`];
                        }).length})
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">
                                <Checkbox
                                    checked={filteredPointsWithIndices.length > 0 && filteredPointsWithIndices.every(({ actualIndex }) => {
                                        return selectedPoints[`${locationIndex}-${actualIndex}`];
                                    })}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Select all visible points"
                                />
                            </th>
                            <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Name</th>
                            <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Measurement Type</th>
                            <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Height (m)</th>
                            <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Height Reference</th>
                            <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Unit</th>
                            <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Notes</th>
                            <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Remove</th>
                        </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                        {filteredPointsWithIndices.map(({ point, actualIndex }, displayIndex) => {
                            return (
                                <tr key={`${loggerIdentifier}-${actualIndex}`}>
                                    <td className="px-4 py-2 text-center align-middle">
                                        <Checkbox
                                            checked={selectedPoints[`${locationIndex}-${actualIndex}`] || false}
                                            onCheckedChange={(checked: boolean) =>
                                                setSelectedPoints(prev => ({
                                                    ...prev,
                                                    [`${locationIndex}-${actualIndex}`]: checked
                                                }))
                                            }
                                            aria-label={`Select point ${displayIndex + 1}`}
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        <Input
                                            {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.name`)}
                                            placeholder="Enter measurement name"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        <Select
                                            onValueChange={(value: MeasurementType) => setValue(
                                                `measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`,
                                                value
                                            )}
                                            value={watch(
                                                `measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`
                                            ) as MeasurementType}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select measurement type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="wind_speed">Wind Speed</SelectItem>
                                                <SelectItem value="wind_direction">Wind Direction</SelectItem>
                                                <SelectItem value="temperature">Temperature</SelectItem>
                                                <SelectItem value="pressure">Pressure</SelectItem>
                                                <SelectItem value="humidity">Humidity</SelectItem>
                                                <SelectItem value="wave_height">Wave Height</SelectItem>
                                                <SelectItem value="wave_period">Wave Period</SelectItem>
                                                <SelectItem value="wave_direction">Wave Direction</SelectItem>
                                                <SelectItem value="position">Position</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            {...register(
                                                `measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_m`,
                                                { valueAsNumber: true }
                                            )}
                                            placeholder="Enter height"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        <Select
                                            onValueChange={(value: HeightReference) => setValue(
                                                `measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_reference_id`,
                                                value
                                            )}
                                            value={watch(
                                                `measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_reference_id`
                                            ) as HeightReference}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select height reference" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ground_level">Ground Level</SelectItem>
                                                <SelectItem value="sea_level">Sea Level</SelectItem>
                                                <SelectItem value="sea_floor">Sea Floor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        <Input
                                            {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.unit`)}
                                            placeholder="Enter unit (e.g., m/s, deg)"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        <Textarea
                                            {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.notes`)}
                                            placeholder="Add any additional notes"
                                            rows={2}
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Remove"
                                            onClick={() => onRemovePoint(locationIndex, actualIndex)}
                                            className="p-2 hover:bg-transparent"
                                        >
                                            <Trash2 className="w-6 h-6 text-[#FF0000] hover:text-[#CC0000]" />
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* No Results Message */}
            {filteredPoints.length === 0 && loggerFilteredPoints.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No points match the current filters.</p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-2"
                    >
                        Clear Filters
                    </Button>
                </div>
            )}
        </div>
    );
}