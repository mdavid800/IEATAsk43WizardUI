import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, Upload, ChevronDown, AlertCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  IEATask43Schema,
  MeasurementType,
  HeightReference,
  MeasurementPoint,
  StatisticType
} from '@/types/schema';
import { Checkbox } from '@/components/ui/checkbox';

interface CSVValidationError {
  type: 'error' | 'warning';
  message: string;
}

interface CSVValidationResult {
  isValid: boolean;
  errors: CSVValidationError[];
  data: any[] | null;
}

interface BulkEditValues {
  measurement_type_id: MeasurementType | '';
  height_m: string;
  height_reference_id: HeightReference | '';
}

interface ColumnInfo {
  name: string;
  displayName: string;
  measurementType: MeasurementType;
  height: number | null;
  unit: string | null;
  statisticType: StatisticType;
}

export function MeasurementStep() {
  const { register, setValue, watch } = useFormContext<IEATask43Schema>();
  const locations = watch('measurement_location');
  const [expandedLocations, setExpandedLocations] = useState<{ [key: string]: boolean }>(
    locations.reduce((acc, loc) => ({ ...acc, [loc.uuid]: true }), {})
  );
  const [expandedLoggers, setExpandedLoggers] = useState<{ [key: string]: boolean }>({});
  const [expandedPoints, setExpandedPoints] = useState<{ [key: string]: boolean }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: CSVValidationError[] }>({});
  const [selectedPoints, setSelectedPoints] = useState<{ [key: string]: boolean }>({});
  const [bulkEditValues, setBulkEditValues] = useState<BulkEditValues>({
    measurement_type_id: '',
    height_m: '',
    height_reference_id: ''
  });

  const addMeasurementPoint = (locationIndex: number, loggerIndex: number) => {
    const logger = watch(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}`);
    if (!logger) return;

    const currentPoints = watch(`measurement_location.${locationIndex}.measurement_point`) || [];
    const newPoint = {
      name: '',
      measurement_type_id: 'other' as const,
      height_m: 0,
      height_reference_id: 'ground_level' as const,
      update_at: new Date().toISOString(),
      logger_measurement_config: [{
        logger_id: logger.logger_id || logger.logger_serial_number,
        date_from: new Date().toISOString(),
        date_to: null,
        update_at: new Date().toISOString(),
        column_name: []
      }],
      sensor: []
    };

    setValue(`measurement_location.${locationIndex}.measurement_point`, [...currentPoints, newPoint]);
    const pointId = crypto.randomUUID();
    setExpandedPoints(prev => ({ ...prev, [pointId]: true }));
  };

  const removeMeasurementPoint = (locationIndex: number, pointIndex: number) => {
    const currentPoints = watch(`measurement_location.${locationIndex}.measurement_point`);
    setValue(
      `measurement_location.${locationIndex}.measurement_point`,
      currentPoints.filter((_, i) => i !== pointIndex)
    );
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

  const togglePointExpand = (pointId: string) => {
    setExpandedPoints(prev => ({
      ...prev,
      [pointId]: !prev[pointId]
    }));
  };

  const handleUploadClick = (locationId: string, loggerId: string) => {
    const refKey = `${locationId}-${loggerId}`;
    fileInputRefs.current[refKey]?.click();
  };

  const validateCSVStructure = (data: any[]): CSVValidationResult => {
    const errors: CSVValidationError[] = [];

    // Remove empty rows
    const nonEmptyRows = data.filter(row => {
      if (!Array.isArray(row)) return false;
      return row.some((cell: any) => cell !== null && cell !== undefined && cell !== '');
    });

    if (nonEmptyRows.length < 2) {
      errors.push({
        type: 'error',
        message: 'CSV file must contain at least 2 rows (header and data)'
      });
      return { isValid: false, errors, data: null };
    }

    // Assume first row is header
    const headers = nonEmptyRows[0] as string[];
    if (!headers || headers.length === 0) {
      errors.push({
        type: 'error',
        message: 'CSV file must contain valid headers'
      });
      return { isValid: false, errors, data: null };
    }

    // Check if first column is timestamp
    const firstHeader = headers[0]?.toString().toLowerCase() || '';
    const hasTimestampColumn = firstHeader.includes('timestamp') || 
                              firstHeader.includes('date') || 
                              firstHeader.includes('time') || 
                              firstHeader === 'iso' || 
                              firstHeader.includes('utc');
    
    if (!hasTimestampColumn) {
      errors.push({
        type: 'warning',
        message: `First column "${headers[0]}" might not be a timestamp column. Processing will continue, but data may be incorrectly interpreted.`
      });
    }

    // Check for measurement columns (all columns except timestamp column)
    const measurementNames = headers.slice(1).filter(name => name && name.trim() !== '');
    if (measurementNames.length === 0) {
      errors.push({
        type: 'error',
        message: 'No valid measurement columns found'
      });
      return { isValid: false, errors, data: null };
    }

    // Validate data rows (skip header row)
    let invalidTimestampCount = 0;
    for (let i = 1; i < nonEmptyRows.length; i++) {
      const row = nonEmptyRows[i] as string[];
      if (!row || row.length !== headers.length) {
        errors.push({
          type: 'warning',
          message: `Row ${i + 1} has ${row ? row.length : 0} columns, expected ${headers.length}. This row will be skipped.`
        });
        continue;
      }

      // Validate timestamp if the row has data
      if (row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        const timestamp = row[0];
        if (!timestamp || !isValidTimestamp(timestamp)) {
          invalidTimestampCount++;
          if (invalidTimestampCount <= 3) { // Limit number of timestamp warnings
            errors.push({
              type: 'warning',
              message: `Invalid timestamp in row ${i + 1}: "${timestamp}"`
            });
          }
        }
      }
    }

    if (invalidTimestampCount > 3) {
      errors.push({
        type: 'warning',
        message: `${invalidTimestampCount - 3} additional rows with invalid timestamps found`
      });
    }

    // Determine if we should proceed (only stop on errors, not warnings)
    const hasErrors = errors.some(error => error.type === 'error');

    return {
      isValid: !hasErrors,
      errors,
      data: hasErrors ? null : nonEmptyRows
    };
  };

  const isValidTimestamp = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;

    // Skip validation for header row
    if (value.toLowerCase().includes('timestamp') || 
        value.toLowerCase().includes('date') || 
        value.toLowerCase() === 'time' ||
        value.toLowerCase() === 'iso' ||
        value.toLowerCase().includes('utc')) {
      return true;
    }

    // Try ISO format first
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(value)) {
      return true;
    }

    // Try parsing with Date.parse
    if (!isNaN(Date.parse(value))) {
      return true;
    }

    return false;
  };

  const parseColumnHeader = (header: string): ColumnInfo => {
    const result: ColumnInfo = {
      name: header, // Preserve original header name exactly
      displayName: header,
      measurementType: 'other',
      height: null,
      unit: null,
      statisticType: 'avg'
    };

    // Extract height using various patterns
    let heightMatch = /(\d+)m\b/i.exec(header);
    if (heightMatch) {
      result.height = parseInt(heightMatch[1], 10);
    }

    // Extract unit information
    if (header.includes('m/s')) {
      result.unit = 'm/s';
    } else if (header.includes('deg')) {
      result.unit = 'deg';
    } else if (header.includes('%')) {
      result.unit = '%';
    }

    // Process different measurement types
    const lowerHeader = header.toLowerCase();

    // Wind speed measurements
    if (lowerHeader.includes('verticalwindspeed')) {
      result.measurementType = 'wind_speed';
      result.displayName = `Vertical Wind Speed ${result.height}m`;
    } 
    else if (lowerHeader.includes('windspeed') || lowerHeader.includes('wind speed')) {
      result.measurementType = 'wind_speed';
      result.displayName = `Wind Speed ${result.height}m`;
    }
    // Wind direction
    else if (lowerHeader.includes('winddir') || lowerHeader.includes('wind direction')) {
      result.measurementType = 'wind_direction';
      result.displayName = `Wind Direction ${result.height}m`;
    }
    // Wind gust
    else if (lowerHeader.includes('windgust') || lowerHeader.includes('wind gust')) {
      result.measurementType = 'wind_speed';
      result.displayName = `Wind Gust ${result.height}m`;
    }
    // Max/Min wind
    else if (lowerHeader.includes('windmax') || lowerHeader.includes('max_hor')) {
      result.measurementType = 'wind_speed';
      result.statisticType = 'max';
      result.displayName = `Max Wind Speed ${result.height}m`;
    }
    else if (lowerHeader.includes('windmin') || lowerHeader.includes('min_hor')) {
      result.measurementType = 'wind_speed';
      result.statisticType = 'min';
      result.displayName = `Min Wind Speed ${result.height}m`;
    }
    // Standard deviation
    else if (lowerHeader.includes('standarddeviation') || lowerHeader.includes('std')) {
      result.measurementType = 'wind_speed';
      result.statisticType = 'sd';
      result.displayName = `Wind Speed SD ${result.height}m`;
    }
    // Wind shear
    else if (lowerHeader.includes('wind shear')) {
      result.measurementType = 'wind_speed';
      result.displayName = `Wind Shear ${header.replace('Wind Shear ', '')}`;
      
      // Extract height range from shear measurements
      const shearMatch = /(\d+)m-(\d+)m/.exec(header);
      if (shearMatch) {
        const upperHeight = parseInt(shearMatch[1], 10);
        const lowerHeight = parseInt(shearMatch[2], 10);
        result.height = (upperHeight + lowerHeight) / 2; // Use average height
      }
    }
    // Wind veer
    else if (lowerHeader.includes('wind veer')) {
      result.measurementType = 'wind_direction';
      result.displayName = `Wind Veer ${header.replace('Wind Veer ', '')}`;
      
      // Extract height range from veer measurements
      const veerMatch = /(\d+)m-(\d+)m/.exec(header);
      if (veerMatch) {
        const upperHeight = parseInt(veerMatch[1], 10);
        const lowerHeight = parseInt(veerMatch[2], 10);
        result.height = (upperHeight + lowerHeight) / 2; // Use average height
      }
    }
    // Turbulence intensity
    else if (lowerHeader.includes('turbulence') || lowerHeader.includes('(ti)')) {
      result.measurementType = 'wind_speed';
      result.statisticType = 'ti';
      result.displayName = `Turbulence Intensity ${result.height}m`;
    }

    // If no height was found but the column name has numbers, try to extract height
    if (result.height === null) {
      const genericHeightMatch = /(\d+)/.exec(header);
      if (genericHeightMatch) {
        result.height = parseInt(genericHeightMatch[1], 10);
      }
    }

    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, locationIndex: number, loggerIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const logger = watch(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}`);
    if (!logger) {
      alert('No logger found for the selected location');
      return;
    }

    const loggerId = logger.logger_id || logger.logger_serial_number;
    if (!loggerId) {
      alert('Logger must have an ID or serial number before uploading data');
      return;
    }

    setUploadErrors(prev => ({ ...prev, [loggerId]: [] }));

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') return;

        Papa.parse(text, {
          complete: (results) => {
            console.log('CSV parsing complete', results.data);
            const validation = validateCSVStructure(results.data);
            console.log('Validation result', validation);

            if (!validation.isValid) {
              setUploadErrors(prev => ({
                ...prev,
                [loggerId]: validation.errors
              }));
              return;
            }

            const headers = validation.data![0] as string[];
            console.log('CSV headers', headers);
            
            // Process all columns except the first (timestamp)
            const measurementColumns = headers.slice(1).map(parseColumnHeader);
            console.log('Parsed columns', measurementColumns);
            
            // Group columns by height and measurement type
            const measurementGroups = new Map<string, ColumnInfo[]>();
            
            measurementColumns.forEach(column => {
              if (column.height === null) {
                column.height = 0; // Default height if none detected
              }
              
              // Create a unique key for each height + type combination
              const groupKey = `${column.measurementType}_${column.height}`;
              
              if (!measurementGroups.has(groupKey)) {
                measurementGroups.set(groupKey, []);
              }
              
              measurementGroups.get(groupKey)!.push(column);
            });
            
            // Create measurement points from the groups
            const measurementPoints: MeasurementPoint[] = [];
            
            measurementGroups.forEach((columns, groupKey) => {
              // Use the first column in the group for basic info
              const primaryColumn = columns[0];
              
              // Create column config for logger
              const columnConfigs = columns.map(col => ({
                column_name: col.name, // Use exact original column name
                statistic_type_id: col.statisticType,
                is_ignored: false,
                update_at: new Date().toISOString()
              }));
              
              // Create the measurement point
              const measurementPoint: MeasurementPoint = {
                name: primaryColumn.displayName,
                measurement_type_id: primaryColumn.measurementType,
                height_m: primaryColumn.height || 0,
                height_reference_id: 'ground_level',
                update_at: new Date().toISOString(),
                logger_measurement_config: [{
                  logger_id: loggerId,
                  date_from: new Date().toISOString(),
                  date_to: null,
                  update_at: new Date().toISOString(),
                  column_name: columnConfigs
                }],
                sensor: []
              };
              
              measurementPoints.push(measurementPoint);
            });
            
            console.log('Created measurement points', measurementPoints);

            // Get existing points for other loggers
            const allCurrentPoints = watch(`measurement_location.${locationIndex}.measurement_point`) || [];
            const otherLoggersPoints = allCurrentPoints.filter(point => 
              point.logger_measurement_config?.[0]?.logger_id !== loggerId
            );

            // Update form with combined points
            setValue(
              `measurement_location.${locationIndex}.measurement_point`,
              [...otherLoggersPoints, ...measurementPoints]
            );

            // Make all new points expanded by default
            measurementPoints.forEach(() => {
              const pointId = crypto.randomUUID();
              setExpandedPoints(prev => ({ ...prev, [pointId]: true }));
            });

            setUploadErrors(prev => ({
              ...prev,
              [loggerId]: [{
                type: 'warning',
                message: `Successfully imported ${measurementPoints.length} measurement points from ${measurementColumns.length} columns`
              }]
            }));
          },
          error: (error: Error) => {
            console.error('CSV parsing error', error);
            setUploadErrors(prev => ({
              ...prev,
              [loggerId]: [{
                type: 'error',
                message: `Error parsing CSV: ${error.message}`
              }]
            }));
          }
        });
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('File reading error', error);
      setUploadErrors(prev => ({
        ...prev,
        [loggerId]: [{
          type: 'error',
          message: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      }));
    }

    event.target.value = '';
  };

  const handleBulkEdit = (locationIndex: number, loggerIdentifier: string) => {
    const points = watch(`measurement_location.${locationIndex}.measurement_point`) || [];
    const pointsToUpdate = points.filter((_, index) =>
      selectedPoints[`${locationIndex}-${index}`] &&
      points[index].logger_measurement_config?.[0]?.logger_id === loggerIdentifier
    );

    pointsToUpdate.forEach((_, index) => {
      if (bulkEditValues.measurement_type_id) {
        setValue(
          `measurement_location.${locationIndex}.measurement_point.${index}.measurement_type_id`,
          bulkEditValues.measurement_type_id as MeasurementType
        );
      }
      if (bulkEditValues.height_m) {
        setValue(
          `measurement_location.${locationIndex}.measurement_point.${index}.height_m`,
          parseFloat(bulkEditValues.height_m)
        );
      }
      if (bulkEditValues.height_reference_id) {
        setValue(
          `measurement_location.${locationIndex}.measurement_point.${index}.height_reference_id`,
          bulkEditValues.height_reference_id as HeightReference
        );
      }
    });

    // Reset bulk edit values and selections
    setBulkEditValues({
      measurement_type_id: '',
      height_m: '',
      height_reference_id: ''
    });
    setSelectedPoints({});
  };

  const toggleSelectAll = (locationIndex: number, loggerIdentifier: string) => {
    const points = watch(`measurement_location.${locationIndex}.measurement_point`) || [];
    const relevantPoints = points.filter(point =>
      point.logger_measurement_config?.[0]?.logger_id === loggerIdentifier
    );

    const allSelected = relevantPoints.every((_, index) =>
      selectedPoints[`${locationIndex}-${index}`]
    );

    const newSelectedPoints = { ...selectedPoints };
    relevantPoints.forEach((_, index) => {
      newSelectedPoints[`${locationIndex}-${index}`] = !allSelected;
    });
    setSelectedPoints(newSelectedPoints);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-foreground">Measurement Points</h2>

      {locations.map((location, locationIndex) => (
        <div key={location.uuid} className="border border-border rounded-lg overflow-hidden">
          <div
            className="bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleLocationExpand(location.uuid)}
          >
            <div className="flex items-center gap-3">
              <ChevronDown
                className={`w-5 h-5 transition-transform ${expandedLocations[location.uuid] ? 'transform rotate-0' : 'transform -rotate-90'
                  }`}
              />
              <h3 className="text-lg font-medium text-foreground">{location.name || `Location ${locationIndex + 1}`}</h3>
              <div className="text-sm text-muted-foreground">
                {location.measurement_station_type_id}
              </div>
            </div>
          </div>

          {expandedLocations[location.uuid] && (
            <div className="p-6 border-t border-border">
              {(location.logger_main_config || []).map((logger, loggerIndex) => {
                const loggerId = `${location.uuid}-${loggerIndex}`;
                const loggerIdentifier = logger.logger_id || logger.logger_serial_number;

                return (
                  <div key={loggerId} className="mb-6 last:mb-0">
                    <div
                      className="bg-primary/5 p-4 cursor-pointer hover:bg-primary/10 transition-colors rounded-lg"
                      onClick={() => toggleLoggerExpand(loggerId)}
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${expandedLoggers[loggerId] ? 'transform rotate-0' : 'transform -rotate-90'
                            }`}
                        />
                        <h4 className="text-base font-medium">Logger {loggerIndex + 1}</h4>
                        <div className="text-sm text-muted-foreground">
                          {logger.logger_name || logger.logger_serial_number || 'Unnamed Logger'}
                        </div>
                      </div>
                    </div>

                    {expandedLoggers[loggerId] && (
                      <div className="mt-4 pl-6 border-l-2 border-primary/30">
                        {uploadErrors[loggerIdentifier]?.length > 0 && (
                          <div className="mb-4">
                            {uploadErrors[loggerIdentifier].map((error, index) => (
                              <div
                                key={index}
                                className={`p-3 rounded-md mb-2 ${error.type === 'error'
                                  ? "bg-red-50 border border-red-200 text-red-700"
                                  : "bg-blue-50 border border-blue-200 text-blue-700"
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-sm">{error.message}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between items-center mb-4">
                          <div className="text-sm text-muted-foreground">
                            Measurement Points
                          </div>
                          <div className="flex gap-2">
                            <input
                              ref={el => fileInputRefs.current[`${location.uuid}-${loggerId}`] = el}
                              type="file"
                              accept=".csv"
                              onChange={(e) => handleFileUpload(e, locationIndex, loggerIndex)}
                              className="hidden"
                              aria-label="Upload CSV file"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleUploadClick(location.uuid, loggerId)}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload CSV
                            </Button>
                            <Button
                              type="button"
                              onClick={() => addMeasurementPoint(locationIndex, loggerIndex)}
                              className="bg-primary hover:bg-primary/90"
                            >
                              <PlusCircle className="w-4 h-4 mr-2" />
                              Add Point
                            </Button>
                          </div>
                        </div>

                        {/* Bulk Edit Controls */}
                        <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                          <h5 className="text-sm font-medium mb-3">Bulk Edit Selected Points</h5>
                          <div className="grid grid-cols-3 gap-4">
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
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button
                              type="button"
                              onClick={() => handleBulkEdit(locationIndex, loggerIdentifier)}
                              disabled={!Object.values(selectedPoints).some(Boolean)}
                            >
                              Apply to Selected
                            </Button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">
                                  <Checkbox
                                    checked={Object.values(selectedPoints).some(Boolean)}
                                    onCheckedChange={() => toggleSelectAll(locationIndex, loggerIdentifier)}
                                    aria-label="Select all points"
                                  />
                                </th>
                                <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Measurement Type</th>
                                <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Height (m)</th>
                                <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Height Reference</th>
                                <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Notes</th>
                                <th className="px-4 py-2 text-center align-middle text-xs font-medium text-muted-foreground">Remove</th>
                              </tr>
                            </thead>
                            <tbody className="bg-background divide-y divide-border">
                              {(watch(`measurement_location.${locationIndex}.measurement_point`) || [])
                                .filter(point =>
                                  point.logger_measurement_config?.[0]?.logger_id === loggerIdentifier
                                )
                                .map((point, pointIndex) => {
                                  // Find the actual index in the measurement_point array
                                  const actualPointIndex = watch(`measurement_location.${locationIndex}.measurement_point`)
                                    .findIndex(p => p === point);
                                  
                                  return (
                                  <tr key={`${loggerId}-${pointIndex}`}>
                                    <td className="px-4 py-2 text-center align-middle">
                                      <Checkbox
                                        checked={selectedPoints[`${locationIndex}-${actualPointIndex}`] || false}
                                        onCheckedChange={(checked: boolean) =>
                                          setSelectedPoints(prev => ({
                                            ...prev,
                                            [`${locationIndex}-${actualPointIndex}`]: checked
                                          }))
                                        }
                                        aria-label={`Select point ${pointIndex + 1}`}
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                      <Input
                                        {...register(`measurement_location.${locationIndex}.measurement_point.${actualPointIndex}.name`)}
                                        placeholder="Enter measurement name"
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                      <Select
                                        onValueChange={(value: MeasurementType) => setValue(
                                          `measurement_location.${locationIndex}.measurement_point.${actualPointIndex}.measurement_type_id`,
                                          value
                                        )}
                                        value={watch(
                                          `measurement_location.${locationIndex}.measurement_point.${actualPointIndex}.measurement_type_id`
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
                                          `measurement_location.${locationIndex}.measurement_point.${actualPointIndex}.height_m`,
                                          { valueAsNumber: true }
                                        )}
                                        placeholder="Enter height"
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                      <Select
                                        onValueChange={(value: HeightReference) => setValue(
                                          `measurement_location.${locationIndex}.measurement_point.${actualPointIndex}.height_reference_id`,
                                          value
                                        )}
                                        value={watch(
                                          `measurement_location.${locationIndex}.measurement_point.${actualPointIndex}.height_reference_id`
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
                                      <Textarea
                                        {...register(`measurement_location.${locationIndex}.measurement_point.${actualPointIndex}.notes`)}
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
                                        onClick={() => removeMeasurementPoint(locationIndex, actualPointIndex)}
                                        className="p-2 hover:bg-transparent"
                                      >
                                        <Trash2 className="w-6 h-6 text-[#FF0000] hover:text-[#CC0000]" />
                                      </Button>
                                    </td>
                                  </tr>
                                )})}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}