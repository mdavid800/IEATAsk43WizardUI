import { useFormContext } from 'react-hook-form';
import { Trash2, Filter, X, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClearableSelect } from '@/components/ui/clearable-select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select';
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

// Tooltip component for truncated text
const TooltipWrapper = ({ children, text, className = "" }: { children: React.ReactNode; text: string; className?: string }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div 
            className={`relative ${className}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {children}
            {showTooltip && text && (
                <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg -top-8 left-0 whitespace-nowrap max-w-xs">
                    {text}
                    <div className="absolute top-full left-2 w-2 h-2 bg-gray-800 transform rotate-45 -translate-y-1"></div>
                </div>
            )}
        </div>
    );
};

// Expandable row component for mobile view
const ExpandableRow = ({ 
    point, 
    actualIndex, 
    locationIndex, 
    displayIndex,
    isSelected,
    onToggleSelect,
    onRemove,
    sensorOptions 
}: {
    point: any;
    actualIndex: number;
    locationIndex: number;
    displayIndex: number;
    isSelected: boolean;
    onToggleSelect: (checked: boolean) => void;
    onRemove: () => void;
    sensorOptions: any[];
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { register, setValue, watch } = useFormContext<IEATask43Schema>();
    const pointSensors = watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.sensor`) || [];

    return (
        <div className="border border-border rounded-lg mb-4 bg-background">
            {/* Header - Always visible */}
            <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelect}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select point ${displayIndex + 1}`}
                    />
                    <div className="flex-1 min-w-0">
                        <TooltipWrapper text={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.name`) || ''}>
                            <div className="font-medium truncate">
                                {watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.name`) || `Point ${displayIndex + 1}`}
                            </div>
                        </TooltipWrapper>
                        <div className="text-xs text-muted-foreground truncate">
                            {watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`) || 'No type'}
                        </div>
                    </div>
                    <ChevronRight 
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="p-2 hover:bg-transparent ml-2"
                >
                    <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                </Button>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="border-t border-border p-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Name</Label>
                            <Input
                                {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.name`)}
                                placeholder="Enter measurement name"
                                className="mt-1"
                            />
                        </div>
                        
                        <div>
                            <Label className="text-xs text-muted-foreground">Measurement Type</Label>
                            <ClearableSelect
                                value={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`) as MeasurementType || undefined}
                                onValueChange={(value: MeasurementType | undefined) => setValue(
                                    `measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`,
                                    value
                                )}
                                placeholder="Select measurement type"
                            >
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
                            </ClearableSelect>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Height (m)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_m`, { valueAsNumber: true })}
                                    placeholder="Enter height"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Unit</Label>
                                <Input
                                    {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.unit`)}
                                    placeholder="e.g., m/s, deg"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground">Height Reference</Label>
                            <ClearableSelect
                                value={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_reference_id`) as HeightReference || undefined}
                                onValueChange={(value: HeightReference | undefined) => setValue(
                                    `measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_reference_id`,
                                    value
                                )}
                                placeholder="Select height reference"
                            >
                                <SelectItem value="ground_level">Ground Level</SelectItem>
                                <SelectItem value="sea_level">Sea Level</SelectItem>
                                <SelectItem value="sea_floor">Sea Floor</SelectItem>
                            </ClearableSelect>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground">Sensors</Label>
                            <MultiSelect
                                options={sensorOptions}
                                selected={pointSensors}
                                onChange={(selectedSensors: Sensor[]) => {
                                    setValue(
                                        `measurement_location.${locationIndex}.measurement_point.${actualIndex}.sensor`,
                                        selectedSensors
                                    );
                                }}
                                placeholder="Select sensors"
                                className="w-full"
                            />
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground">Notes</Label>
                            <Textarea
                                {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.notes`)}
                                placeholder="Add any additional notes"
                                rows={2}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

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
    const [isMobileView, setIsMobileView] = useState(false);

    // Get available sensors for this location
    const availableSensors = watch(`measurement_location.${locationIndex}.sensor`) || [];

    // Memoize and prepare sensor options grouped by MODEL
    const sensorOptions = useMemo(() => {
        const validSensors = availableSensors.filter((sensor: Sensor) => 
            sensor.model && sensor.serial_number
        );
        
        const groupedByModel: { [key: string]: { label: string; value: Sensor }[] } = {};
        validSensors.forEach((sensor: Sensor) => {
            const model = sensor.model || 'Unknown Model';
            if (!groupedByModel[model]) {
                groupedByModel[model] = [];
            }
            groupedByModel[model].push({
                label: `${sensor.model} (${sensor.serial_number})`,
                value: sensor,
            });
        });

        return Object.keys(groupedByModel).map(model => ({
            label: model,
            options: groupedByModel[model],
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

    // Check if we should show mobile view
    React.useEffect(() => {
        const checkScreenSize = () => {
            setIsMobileView(window.innerWidth < 1024); // lg breakpoint
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return (
        <div className="w-full">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
                            <ClearableSelect
                                value={filters.measurement_type_id === 'all' ? undefined : filters.measurement_type_id}
                                onValueChange={(value) =>
                                    setFilters(prev => ({ ...prev, measurement_type_id: (value as MeasurementType) || 'all' }))
                                }
                                placeholder="All types"
                            >
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
                            </ClearableSelect>
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
                            <ClearableSelect
                                value={filters.height_reference_id === 'all' ? undefined : filters.height_reference_id}
                                onValueChange={(value) =>
                                    setFilters(prev => ({ ...prev, height_reference_id: (value as HeightReference) || 'all' }))
                                }
                                placeholder="All references"
                            >
                                <SelectItem value="ground_level">Ground Level</SelectItem>
                                <SelectItem value="sea_level">Sea Level</SelectItem>
                                <SelectItem value="sea_floor">Sea Floor</SelectItem>
                            </ClearableSelect>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <Label>Measurement Type</Label>
                        <ClearableSelect
                            value={bulkEditValues.measurement_type_id || undefined}
                            onValueChange={(value: MeasurementType | undefined) =>
                                setBulkEditValues(prev => ({ ...prev, measurement_type_id: value || '' }))
                            }
                            placeholder="Select measurement type"
                        >
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
                        </ClearableSelect>
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
                        <ClearableSelect
                            value={bulkEditValues.height_reference_id || undefined}
                            onValueChange={(value: HeightReference | undefined) =>
                                setBulkEditValues(prev => ({ ...prev, height_reference_id: value || '' }))
                            }
                            placeholder="Select height reference"
                        >
                            <SelectItem value="ground_level">Ground Level</SelectItem>
                            <SelectItem value="sea_level">Sea Level</SelectItem>
                            <SelectItem value="sea_floor">Sea Floor</SelectItem>
                        </ClearableSelect>
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
                            selected={bulkEditValues.sensors || []}
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

            {/* Responsive Table/Cards */}
            {isMobileView ? (
                // Mobile: Card-based layout
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                checked={filteredPointsWithIndices.length > 0 && filteredPointsWithIndices.every(({ actualIndex }) => {
                                    return selectedPoints[`${locationIndex}-${actualIndex}`];
                                })}
                                onCheckedChange={toggleSelectAll}
                                aria-label="Select all visible points"
                            />
                            <span className="text-sm font-medium">Select All</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {filteredPointsWithIndices.filter(({ actualIndex }) => selectedPoints[`${locationIndex}-${actualIndex}`]).length} selected
                        </span>
                    </div>

                    {filteredPointsWithIndices.map(({ point, actualIndex }, displayIndex) => (
                        <ExpandableRow
                            key={`${loggerIdentifier}-${actualIndex}`}
                            point={point}
                            actualIndex={actualIndex}
                            locationIndex={locationIndex}
                            displayIndex={displayIndex}
                            isSelected={selectedPoints[`${locationIndex}-${actualIndex}`] || false}
                            onToggleSelect={(checked: boolean) =>
                                setSelectedPoints(prev => ({
                                    ...prev,
                                    [`${locationIndex}-${actualIndex}`]: checked
                                }))
                            }
                            onRemove={() => onRemovePoint(locationIndex, actualIndex)}
                            sensorOptions={sensorOptions}
                        />
                    ))}
                </div>
            ) : (
                // Desktop: Enhanced table with horizontal scroll and sticky column
                <div className="relative">
                    <div className="overflow-x-auto border border-border rounded-lg bg-background">
                        <div className="min-w-[1200px]"> {/* Ensure minimum width for proper layout */}
                            <table className="w-full">
                                <thead className="bg-muted/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="sticky left-0 z-20 bg-muted/50 px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-[60px]">
                                            <Checkbox
                                                checked={filteredPointsWithIndices.length > 0 && filteredPointsWithIndices.every(({ actualIndex }) => {
                                                    return selectedPoints[`${locationIndex}-${actualIndex}`];
                                                })}
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Select all visible points"
                                            />
                                        </th>
                                        <th className="sticky left-[60px] z-20 bg-muted/50 px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-[200px] max-w-[250px]">
                                            <TooltipWrapper text="Measurement point name">
                                                <div className="flex items-center gap-1">
                                                    Name
                                                    <Info className="w-3 h-3" />
                                                </div>
                                            </TooltipWrapper>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-[160px]">Measurement Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-[100px]">Height (m)</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-[140px]">Height Reference</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-[80px]">Unit</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-[200px]">Sensors</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-[200px]">Notes</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground min-w-[80px]">Remove</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredPointsWithIndices.map(({ point, actualIndex }, displayIndex) => {
                                        const pointSensors = watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.sensor`) || [];
                                        const pointName = watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.name`) || '';
                                        
                                        return (
                                            <tr key={`${loggerIdentifier}-${actualIndex}`} className="hover:bg-muted/30 transition-colors">
                                                <td className="sticky left-0 z-10 bg-background px-4 py-3 border-r border-border">
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
                                                <td className="sticky left-[60px] z-10 bg-background px-4 py-3 border-r border-border min-w-[200px] max-w-[250px]">
                                                    <TooltipWrapper text={pointName} className="w-full">
                                                        <Input
                                                            {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.name`)}
                                                            placeholder="Enter measurement name"
                                                            className="truncate"
                                                        />
                                                    </TooltipWrapper>
                                                </td>
                                                <td className="px-4 py-3 min-w-[160px]">
                                                    <ClearableSelect
                                                        value={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`) as MeasurementType || undefined}
                                                        onValueChange={(value: MeasurementType | undefined) => setValue(
                                                            `measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`,
                                                            value
                                                        )}
                                                        placeholder="Select type"
                                                    >
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
                                                    </ClearableSelect>
                                                </td>
                                                <td className="px-4 py-3 min-w-[100px]">
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_m`, { valueAsNumber: true })}
                                                        placeholder="Height"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 min-w-[140px]">
                                                    <ClearableSelect
                                                        value={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_reference_id`) as HeightReference || undefined}
                                                        onValueChange={(value: HeightReference | undefined) => setValue(
                                                            `measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_reference_id`,
                                                            value
                                                        )}
                                                        placeholder="Select reference"
                                                    >
                                                        <SelectItem value="ground_level">Ground Level</SelectItem>
                                                        <SelectItem value="sea_level">Sea Level</SelectItem>
                                                        <SelectItem value="sea_floor">Sea Floor</SelectItem>
                                                    </ClearableSelect>
                                                </td>
                                                <td className="px-4 py-3 min-w-[80px]">
                                                    <TooltipWrapper text={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.unit`) || ''}>
                                                        <Input
                                                            {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.unit`)}
                                                            placeholder="Unit"
                                                            className="truncate"
                                                        />
                                                    </TooltipWrapper>
                                                </td>
                                                <td className="px-4 py-3 min-w-[200px]">
                                                    <MultiSelect
                                                        options={sensorOptions}
                                                        selected={pointSensors}
                                                        onChange={(selectedSensors: Sensor[]) => {
                                                            setValue(
                                                                `measurement_location.${locationIndex}.measurement_point.${actualIndex}.sensor`,
                                                                selectedSensors
                                                            );
                                                        }}
                                                        placeholder="Select sensors"
                                                        className="w-full"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 min-w-[200px]">
                                                    <TooltipWrapper text={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.notes`) || ''}>
                                                        <Textarea
                                                            {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.notes`)}
                                                            placeholder="Add notes"
                                                            rows={2}
                                                            className="resize-none"
                                                        />
                                                    </TooltipWrapper>
                                                </td>
                                                <td className="px-4 py-3 text-center min-w-[80px]">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Remove"
                                                        onClick={() => onRemovePoint(locationIndex, actualIndex)}
                                                        className="p-2 hover:bg-transparent"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

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