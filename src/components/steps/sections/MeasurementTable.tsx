import React, { useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Trash2, Filter, X, ChevronDown, ChevronRight, Info, ArrowUpDown, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClearableSelect } from '@/components/ui/clearable-select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type {
    IEATask43Schema,
    MeasurementType,
    HeightReference,
    StatisticType,
    Sensor
} from '@/types/schema';

export interface BulkEditValues {
    measurement_type_id: MeasurementType | '';
    statistic_type_id: StatisticType | '';
    height_m: string;
    height_reference_id: HeightReference | '';
    unit: string;
    sensors: Sensor[];
}

interface FilterValues {
    name: string;
    measurement_type_id: MeasurementType | 'all';
    statistic_type_id: StatisticType | 'all';
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
                                value={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`) || undefined}
                                onValueChange={(value: string | undefined) => {
                                    setValue(
                                        `measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`,
                                        value as MeasurementType
                                    );
                                }}
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
                            <Label className="text-xs text-muted-foreground">Statistic Type</Label>
                            <ClearableSelect
                                value={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.statistic_type_id`) || undefined}
                                onValueChange={(value: string | undefined) => {
                                    setValue(
                                        `measurement_location.${locationIndex}.measurement_point.${actualIndex}.statistic_type_id`,
                                        value as StatisticType
                                    );
                                }}
                                placeholder="Select statistic type"
                            >
                                <SelectItem value="avg">Average</SelectItem>
                                <SelectItem value="sd">Standard Deviation</SelectItem>
                                <SelectItem value="max">Maximum</SelectItem>
                                <SelectItem value="min">Minimum</SelectItem>
                                <SelectItem value="ti">Turbulence Intensity</SelectItem>
                                <SelectItem value="ti30sec">TI 30sec</SelectItem>
                                <SelectItem value="gust">Gust</SelectItem>
                                <SelectItem value="count">Count</SelectItem>
                                <SelectItem value="availability">Availability</SelectItem>
                                <SelectItem value="quality">Quality</SelectItem>
                                <SelectItem value="sum">Sum</SelectItem>
                                <SelectItem value="median">Median</SelectItem>
                                <SelectItem value="mode">Mode</SelectItem>
                                <SelectItem value="range">Range</SelectItem>
                                <SelectItem value="text">Text</SelectItem>
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
                                onValueChange={(value: string | undefined) =>
                                    setValue(
                                        `measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_reference_id`,
                                        value as HeightReference
                                    )
                                }
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
    const availableSensors = (watch(`measurement_location.${locationIndex}.sensors` as any) as Sensor[]) || [];

    // Memoize and prepare sensor options grouped by OEM (not MODEL) with proper formatting
    const sensorOptions = useMemo(() => {
        const validSensors = availableSensors.filter((sensor: Sensor) =>
            sensor && typeof sensor === 'object' && sensor.oem && sensor.serial_number
        );

        const groupedByOEM: { [key: string]: { label: string; value: Sensor }[] } = {};
        validSensors.forEach((sensor: Sensor) => {
            const oem = sensor.oem || 'Unknown OEM';
            if (!groupedByOEM[oem]) {
                groupedByOEM[oem] = [];
            }
            groupedByOEM[oem].push({
                label: `${sensor.oem} (${sensor.serial_number})`,
                value: sensor,
            });
        });

        return Object.keys(groupedByOEM).map(oem => ({
            label: oem,
            options: groupedByOEM[oem],
        }));
    }, [availableSensors]);

    const [filters, setFilters] = useState<FilterValues>({
        name: '',
        measurement_type_id: 'all',
        statistic_type_id: 'all',
        height_m: '',
        height_reference_id: 'all',
        unit: 'all',
        notes: ''
    });

    const clearFilters = () => {
        setFilters({
            name: '',
            measurement_type_id: 'all',
            statistic_type_id: 'all',
            height_m: '',
            height_reference_id: 'all',
            unit: 'all',
            notes: ''
        });
    };

    const hasActiveFilters = filters.name !== '' || filters.measurement_type_id !== 'all' || filters.statistic_type_id !== 'all' || filters.height_m !== '' || filters.height_reference_id !== 'all' || filters.unit !== 'all' || filters.notes !== '';

    // First filter by logger identifier, then apply user filters
    const allPoints = watch(`measurement_location.${locationIndex}.measurement_point`) || [];

    // Create array of points with their actual indices for better tracking
    const loggerFilteredPointsWithIndices = allPoints
        .map((point, actualIndex) => ({ point, actualIndex }))
        .filter(({ point }) => point.logger_measurement_config?.[0]?.logger_id === loggerIdentifier);

    // Add sensorsFilter state
    const [sensorsFilter, setSensorsFilter] = useState<Sensor[]>([]);

    // Update filtering logic to include sensors filter
    const filteredPointsWithIndices = loggerFilteredPointsWithIndices.filter(({ point, actualIndex }) => {
        const pointData = watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}`);

        // Apply filters
        if (filters.name && !pointData.name?.toLowerCase().includes(filters.name.toLowerCase())) {
            return false;
        }
        if (filters.measurement_type_id !== 'all' && pointData.measurement_type_id !== filters.measurement_type_id) {
            return false;
        }
        if (filters.statistic_type_id !== 'all' && pointData.statistic_type_id !== filters.statistic_type_id) {
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
        // Sensors filter: if any sensors are selected, point must have at least one of them
        if (sensorsFilter.length > 0) {
            const pointSensors = pointData.sensor || [];
            const hasMatch = sensorsFilter.some(selectedSensor =>
                pointSensors.some((ps: Sensor) => ps && ps.serial_number === selectedSensor.serial_number && ps.oem === selectedSensor.oem)
            );
            if (!hasMatch) return false;
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
                if (bulkEditValues.statistic_type_id) {
                    setValue(
                        `measurement_location.${locationIndex}.measurement_point.${actualIndex}.statistic_type_id`,
                        bulkEditValues.statistic_type_id as StatisticType
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
            statistic_type_id: '',
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
    const allUnits = [...new Set(loggerFilteredPoints.map(point => point.unit).filter((u): u is string => !!u))].sort();

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
                // Desktop: Modern shadcn table with improved UX
                <div className="space-y-4">
                    {/* Filters Toolbar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filters
                                        {hasActiveFilters && (
                                            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                                                {Object.values(filters).filter(v => v && v !== 'all').length + (sensorsFilter.length > 0 ? 1 : 0)}
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4" align="start">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">Filter Points</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Refine the measurement points shown in the table.
                                            </p>
                                        </div>
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name-filter">Name</Label>
                                                <Input
                                                    id="name-filter"
                                                    placeholder="Filter by name..."
                                                    value={filters.name}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="type-filter">Measurement Type</Label>
                                                <ClearableSelect
                                                    value={filters.measurement_type_id === 'all' ? undefined : filters.measurement_type_id}
                                                    onValueChange={(value: string | undefined) =>
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
                                            <div className="space-y-2">
                                                <Label htmlFor="statistic-type-filter">Statistic Type</Label>
                                                <ClearableSelect
                                                    value={filters.statistic_type_id === 'all' ? undefined : filters.statistic_type_id}
                                                    onValueChange={(value: string | undefined) =>
                                                        setFilters(prev => ({ ...prev, statistic_type_id: (value as StatisticType) || 'all' }))
                                                    }
                                                    placeholder="All statistics"
                                                >
                                                    <SelectItem value="avg">Average</SelectItem>
                                                    <SelectItem value="sd">Standard Deviation</SelectItem>
                                                    <SelectItem value="max">Maximum</SelectItem>
                                                    <SelectItem value="min">Minimum</SelectItem>
                                                    <SelectItem value="ti">Turbulence Intensity</SelectItem>
                                                    <SelectItem value="ti30sec">TI 30sec</SelectItem>
                                                    <SelectItem value="gust">Gust</SelectItem>
                                                    <SelectItem value="count">Count</SelectItem>
                                                    <SelectItem value="availability">Availability</SelectItem>
                                                    <SelectItem value="quality">Quality</SelectItem>
                                                    <SelectItem value="sum">Sum</SelectItem>
                                                    <SelectItem value="median">Median</SelectItem>
                                                    <SelectItem value="mode">Mode</SelectItem>
                                                    <SelectItem value="range">Range</SelectItem>
                                                    <SelectItem value="text">Text</SelectItem>
                                                </ClearableSelect>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="height-filter">Height (m)</Label>
                                                <Input
                                                    id="height-filter"
                                                    placeholder="Filter by height..."
                                                    value={filters.height_m}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, height_m: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="sensors-filter">Sensors</Label>
                                                <MultiSelect
                                                    options={sensorOptions}
                                                    selected={sensorsFilter}
                                                    onChange={setSensorsFilter}
                                                    placeholder="Filter by sensors"
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                        {(hasActiveFilters || sensorsFilter.length > 0) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => { clearFilters(); setSensorsFilter([]); }}
                                                className="w-full"
                                            >
                                                Clear all filters
                                            </Button>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {hasSelectedFilteredPoints && (
                                <Button size="sm" onClick={handleBulkEdit} className="h-8">
                                    Edit Selected ({filteredPointsWithIndices.filter(({ actualIndex }) => {
                                        return selectedPoints[`${locationIndex}-${actualIndex}`];
                                    }).length})
                                </Button>
                            )}
                        </div>

                        <div className="text-sm text-muted-foreground">
                            {filteredPoints.length} of {loggerFilteredPoints.length} points
                        </div>
                    </div>

                    {/* Bulk Edit Panel */}
                    {hasSelectedFilteredPoints && (
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <h5 className="mb-3 font-medium">Bulk Edit Selected Points</h5>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                                <div className="space-y-2">
                                    <Label>Measurement Type</Label>
                                    <ClearableSelect
                                        value={bulkEditValues.measurement_type_id || undefined}
                                        onValueChange={(value: string | undefined) =>
                                            setBulkEditValues(prev => ({ ...prev, measurement_type_id: (value as MeasurementType) || '' }))
                                        }
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
                                </div>
                                <div className="space-y-2">
                                    <Label>Statistic Type</Label>
                                    <ClearableSelect
                                        value={bulkEditValues.statistic_type_id || undefined}
                                        onValueChange={(value: string | undefined) =>
                                            setBulkEditValues(prev => ({ ...prev, statistic_type_id: (value as StatisticType) || '' }))
                                        }
                                        placeholder="Select statistic"
                                    >
                                        <SelectItem value="avg">Average</SelectItem>
                                        <SelectItem value="sd">Standard Deviation</SelectItem>
                                        <SelectItem value="max">Maximum</SelectItem>
                                        <SelectItem value="min">Minimum</SelectItem>
                                        <SelectItem value="ti">Turbulence Intensity</SelectItem>
                                        <SelectItem value="ti30sec">TI 30sec</SelectItem>
                                        <SelectItem value="gust">Gust</SelectItem>
                                        <SelectItem value="count">Count</SelectItem>
                                        <SelectItem value="availability">Availability</SelectItem>
                                        <SelectItem value="quality">Quality</SelectItem>
                                        <SelectItem value="sum">Sum</SelectItem>
                                        <SelectItem value="median">Median</SelectItem>
                                        <SelectItem value="mode">Mode</SelectItem>
                                        <SelectItem value="range">Range</SelectItem>
                                        <SelectItem value="text">Text</SelectItem>
                                    </ClearableSelect>
                                </div>
                                <div className="space-y-2">
                                    <Label>Height (m)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={bulkEditValues.height_m}
                                        onChange={(e) => setBulkEditValues(prev => ({ ...prev, height_m: e.target.value }))}
                                        placeholder="Enter height"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Height Reference</Label>
                                    <ClearableSelect
                                        value={bulkEditValues.height_reference_id || undefined}
                                        onValueChange={(value: string | undefined) =>
                                            setBulkEditValues(prev => ({ ...prev, height_reference_id: (value as HeightReference) || '' }))
                                        }
                                        placeholder="Select reference"
                                    >
                                        <SelectItem value="ground_level">Ground Level</SelectItem>
                                        <SelectItem value="sea_level">Sea Level</SelectItem>
                                        <SelectItem value="sea_floor">Sea Floor</SelectItem>
                                    </ClearableSelect>
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit</Label>
                                    <Input
                                        value={bulkEditValues.unit}
                                        onChange={(e) => setBulkEditValues(prev => ({ ...prev, unit: e.target.value }))}
                                        placeholder="e.g., m/s, deg"
                                    />
                                </div>
                                <div className="space-y-2">
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
                        </div>
                    )}

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={filteredPointsWithIndices.length > 0 && filteredPointsWithIndices.every(({ actualIndex }) =>
                                                selectedPoints[`${locationIndex}-${actualIndex}`]
                                            )}
                                            onCheckedChange={toggleSelectAll}
                                            aria-label="Select all visible points"
                                        />
                                    </TableHead>
                                    <TableHead className="min-w-[200px]">
                                        <Button variant="ghost" className="h-auto p-0 font-medium">
                                            Name
                                            <Info className="ml-1 h-3 w-3" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="min-w-[160px]">Measurement Type</TableHead>
                                    <TableHead className="min-w-[140px]">Statistic Type</TableHead>
                                    <TableHead className="min-w-[100px]">Height (m)</TableHead>
                                    <TableHead className="min-w-[140px]">Height Reference</TableHead>
                                    <TableHead className="min-w-[80px]">Unit</TableHead>
                                    <TableHead className="min-w-[200px]">Sensors</TableHead>
                                    <TableHead className="min-w-[200px]">Notes</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPointsWithIndices.map(({ point, actualIndex }, displayIndex) => {
                                    const pointSensors = watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.sensor`) || [];
                                    const pointName = watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.name`) || '';

                                    return (
                                        <TableRow
                                            key={`${loggerIdentifier}-${actualIndex}`}
                                            data-state={selectedPoints[`${locationIndex}-${actualIndex}`] ? "selected" : undefined}
                                        >
                                            <TableCell>
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
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
                                                <TooltipWrapper text={pointName} className="w-full">
                                                    <Input
                                                        {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.name`)}
                                                        placeholder="Enter measurement name"
                                                        className="truncate"
                                                    />
                                                </TooltipWrapper>
                                            </TableCell>
                                            <TableCell className="min-w-[160px]">
                                                <ClearableSelect
                                                    value={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`) || undefined}
                                                    onValueChange={(value: string | undefined) => {
                                                        setValue(
                                                            `measurement_location.${locationIndex}.measurement_point.${actualIndex}.measurement_type_id`,
                                                            value as MeasurementType
                                                        );
                                                    }}
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
                                            </TableCell>
                                            <TableCell className="min-w-[140px]">
                                                <ClearableSelect
                                                    value={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.statistic_type_id`) || undefined}
                                                    onValueChange={(value: string | undefined) => {
                                                        setValue(
                                                            `measurement_location.${locationIndex}.measurement_point.${actualIndex}.statistic_type_id`,
                                                            value as StatisticType
                                                        );
                                                    }}
                                                    placeholder="Select statistic"
                                                >
                                                    <SelectItem value="avg">Average</SelectItem>
                                                    <SelectItem value="sd">Standard Deviation</SelectItem>
                                                    <SelectItem value="max">Maximum</SelectItem>
                                                    <SelectItem value="min">Minimum</SelectItem>
                                                    <SelectItem value="ti">Turbulence Intensity</SelectItem>
                                                    <SelectItem value="ti30sec">TI 30sec</SelectItem>
                                                    <SelectItem value="gust">Gust</SelectItem>
                                                    <SelectItem value="count">Count</SelectItem>
                                                    <SelectItem value="availability">Availability</SelectItem>
                                                    <SelectItem value="quality">Quality</SelectItem>
                                                    <SelectItem value="sum">Sum</SelectItem>
                                                    <SelectItem value="median">Median</SelectItem>
                                                    <SelectItem value="mode">Mode</SelectItem>
                                                    <SelectItem value="range">Range</SelectItem>
                                                    <SelectItem value="text">Text</SelectItem>
                                                </ClearableSelect>
                                            </TableCell>
                                            <TableCell className="min-w-[100px]">
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_m`, { valueAsNumber: true })}
                                                    placeholder="Height"
                                                />
                                            </TableCell>
                                            <TableCell className="min-w-[140px]">
                                                <ClearableSelect
                                                    value={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_reference_id`) || undefined}
                                                    onValueChange={(value: string | undefined) =>
                                                        setValue(
                                                            `measurement_location.${locationIndex}.measurement_point.${actualIndex}.height_reference_id`,
                                                            value as HeightReference
                                                        )
                                                    }
                                                    placeholder="Select reference"
                                                >
                                                    <SelectItem value="ground_level">Ground Level</SelectItem>
                                                    <SelectItem value="sea_level">Sea Level</SelectItem>
                                                    <SelectItem value="sea_floor">Sea Floor</SelectItem>
                                                </ClearableSelect>
                                            </TableCell>
                                            <TableCell className="min-w-[80px]">
                                                <TooltipWrapper text={watch(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.unit`) || ''}>
                                                    <Input
                                                        {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.unit`)}
                                                        placeholder="Unit"
                                                        className="truncate"
                                                    />
                                                </TooltipWrapper>
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
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
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
                                                <Textarea
                                                    {...register(`measurement_location.${locationIndex}.measurement_point.${actualIndex}.notes`)}
                                                    placeholder="Add any additional notes"
                                                    rows={2}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => onRemovePoint(locationIndex, actualIndex)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove Point
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}