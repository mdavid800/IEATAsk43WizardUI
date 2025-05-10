import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, Upload, ChevronDown, AlertCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { IEATask43Schema } from '../../types/schema';

interface CSVValidationError {
  type: 'error' | 'warning';
  message: string;
}

interface CSVValidationResult {
  isValid: boolean;
  errors: CSVValidationError[];
  data: any[] | null;
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

  const isValidNumber = (value: string): boolean => {
    // Allow empty strings and "NaN" values
    if (value === '' || value.toLowerCase() === 'nan') {
      return true;
    }
    return !isNaN(parseFloat(value)) && isFinite(Number(value));
  };

  const validateCSVStructure = (data: any[]): CSVValidationResult => {
    const errors: CSVValidationError[] = [];

    // Remove empty rows and find the header row
    const cleanData = data.filter(row => {
      if (!Array.isArray(row)) return false;
      return row.some(cell => cell !== null && cell !== undefined && cell !== '');
    });

    if (cleanData.length < 2) {
      errors.push({
        type: 'error',
        message: 'CSV file must contain at least 2 rows (header and data)'
      });
      return { isValid: false, errors, data: null };
    }

    // Find the actual header row (look for the row containing "timestamp")
    let headerRowIndex = cleanData.findIndex(row => 
      row.some(cell => typeof cell === 'string' && cell.toLowerCase().includes('timestamp'))
    );

    if (headerRowIndex === -1) {
      errors.push({
        type: 'error',
        message: 'Could not find header row with timestamp column'
      });
      return { isValid: false, errors, data: null };
    }

    // Reorganize data to put header row first
    if (headerRowIndex > 0) {
      const beforeHeaders = cleanData.slice(0, headerRowIndex);
      errors.push({
        type: 'warning',
        message: `Removed ${beforeHeaders.length} row(s) before headers`
      });
      cleanData.splice(0, headerRowIndex);
      headerRowIndex = 0;
    }

    const headers = cleanData[headerRowIndex] as string[];
    if (!headers || headers.length === 0) {
      errors.push({
        type: 'error',
        message: 'CSV file must contain valid headers'
      });
      return { isValid: false, errors, data: null };
    }

    const measurementNames = headers.slice(1).filter(name => name && name.trim() !== '');
    if (measurementNames.length === 0) {
      errors.push({
        type: 'error',
        message: 'No valid measurement columns found'
      });
      return { isValid: false, errors, data: null };
    }

    const uniqueNames = new Set(measurementNames);
    if (uniqueNames.size !== measurementNames.length) {
      errors.push({
        type: 'error',
        message: 'Duplicate measurement names found'
      });
    }

    // Validate data rows (skip header row)
    for (let i = 1; i < cleanData.length; i++) {
      const row = cleanData[i] as string[];
      if (!row || row.length !== headers.length) {
        errors.push({
          type: 'warning',
          message: `Skipping row ${i + 1}: mismatched column count`
        });
        continue;
      }

      // Only validate timestamp if the row has data
      if (row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        const timestamp = row[0];
        if (!timestamp || !isValidTimestamp(timestamp)) {
          errors.push({
            type: 'warning',
            message: `Invalid timestamp in row ${i + 1}: "${timestamp}"`
          });
        }
      }
    }

    // Add warning about empty rows if they were removed
    if (data.length !== cleanData.length) {
      errors.push({
        type: 'warning',
        message: `Removed ${data.length - cleanData.length} empty rows`
      });
    }

    // Determine if we should proceed (only stop on errors, not warnings)
    const hasErrors = errors.some(error => error.type === 'error');

    return {
      isValid: !hasErrors,
      errors,
      data: hasErrors ? null : cleanData
    };
  };

  const isValidTimestamp = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;

    // Skip validation for header row
    if (value.toLowerCase() === 'timestamp') return true;

    // Handle common date formats
    const formats = [
      // DD/MM/YYYY HH:mm
      /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})$/,
      // YYYY-MM-DD HH:mm:ss
      /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/,
      // ISO 8601
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/
    ];

    // Try parsing with Date.parse first (handles ISO format)
    if (!isNaN(Date.parse(value))) {
      return true;
    }

    // Try each format
    for (const format of formats) {
      if (format.test(value)) {
        // For DD/MM/YYYY format, convert to YYYY-MM-DD
        if (format === formats[0]) {
          const [_, day, month, year, hours, minutes] = value.match(format) || [];
          const isoString = `${year}-${month}-${day}T${hours}:${minutes}:00`;
          return !isNaN(Date.parse(isoString));
        }
        return true;
      }
    }

    return false;
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
            const validation = validateCSVStructure(results.data);
            
            if (!validation.isValid) {
              setUploadErrors(prev => ({
                ...prev,
                [loggerId]: validation.errors
              }));
              return;
            }

            const headers = results.data[1] as string[];
            const measurementNames = headers.slice(1).filter(name => name && name.trim() !== '');

            // Create new measurement points
            const newPoints = measurementNames.map(name => {
              const cleanName = name.trim();
              const type = determineMeasurementType(cleanName);
              const height = extractHeight(cleanName);
              
              return {
                name: cleanName,
                measurement_type_id: type,
                height_m: height || 0,
                height_reference_id: type.includes('wave') ? 'sea_level' : 'ground_level',
                update_at: new Date().toISOString(),
                logger_measurement_config: [{
                  logger_id: loggerId,
                  date_from: new Date().toISOString(),
                  date_to: null,
                  update_at: new Date().toISOString(),
                  column_name: [{
                    column_name: cleanName,
                    statistic_type_id: determineStatisticType(cleanName),
                    is_ignored: false,
                    update_at: new Date().toISOString()
                  }]
                }],
                sensor: []
              };
            });

            // Get all current points
            const allCurrentPoints = watch(`measurement_location.${locationIndex}.measurement_point`) || [];
            
            // Separate points into those belonging to the current logger and others
            const otherLoggersPoints = allCurrentPoints.filter(point => 
              point.logger_measurement_config?.[0]?.logger_id !== loggerId
            );

            // Combine points: other loggers' points + new points for current logger
            setValue(
              `measurement_location.${locationIndex}.measurement_point`,
              [...otherLoggersPoints, ...newPoints]
            );

            // Expand new points
            newPoints.forEach(() => {
              const pointId = crypto.randomUUID();
              setExpandedPoints(prev => ({ ...prev, [pointId]: true }));
            });

            setUploadErrors(prev => ({
              ...prev,
              [loggerId]: [{
                type: 'warning',
                message: `Successfully added ${newPoints.length} measurement points`
              }]
            }));
          },
          error: (error) => {
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

  const determineStatisticType = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('_avg_')) return 'avg';
    if (lowerName.includes('_sd_')) return 'sd';
    if (lowerName.includes('_max_')) return 'max';
    if (lowerName.includes('_min_')) return 'min';
    if (lowerName.includes('_count_')) return 'count';
    if (lowerName.includes('_ti_')) return 'ti';
    return 'avg';
  };

  const determineMeasurementType = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('significantwaveheight')) return 'wave_height';
    if (lowerName.includes('maximumwaveheight')) return 'wave_height';
    if (lowerName.includes('peakperiod')) return 'wave_period';
    if (lowerName.includes('meanspectralperiod')) return 'wave_period';
    if (lowerName.includes('wavedirection')) return 'wave_direction';
    if (lowerName.includes('windspeed')) return 'wind_speed';
    if (lowerName.includes('winddirection')) return 'wind_direction';
    if (lowerName.includes('temp')) return 'temperature';
    if (lowerName.includes('press')) return 'pressure';
    if (lowerName.includes('humid')) return 'humidity';
    if (lowerName.includes('gps')) return 'position';
    
    return 'other';
  };

  const extractHeight = (name: string): number | null => {
    const match = name.match(/_(\d+)m/);
    if (match) {
      return parseInt(match[1]);
    }
    return null;
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
                className={`w-5 h-5 transition-transform ${
                  expandedLocations[location.uuid] ? 'transform rotate-0' : 'transform -rotate-90'
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
                          className={`w-5 h-5 transition-transform ${
                            expandedLoggers[loggerId] ? 'transform rotate-0' : 'transform -rotate-90'
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
                                className={`p-3 rounded-md mb-2 ${
                                  error.type === 'error' 
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
                            />
                            <Button 
                              type="button"
                              variant="outline" 
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

                        <div className="space-y-4">
                          {(watch(`measurement_location.${locationIndex}.measurement_point`) || [])
                            .filter(point => 
                              point.logger_measurement_config?.[0]?.logger_id === loggerIdentifier
                            )
                            .map((point, pointIndex) => {
                              const pointId = `${loggerId}-${pointIndex}`;
                              return (
                                <div key={pointId} className="border border-border rounded-lg overflow-hidden">
                                  <div 
                                    className="bg-muted/50 p-4 cursor-pointer hover:bg-muted/70 transition-colors"
                                    onClick={() => togglePointExpand(pointId)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <ChevronDown 
                                          className={`w-5 h-5 transition-transform ${
                                            expandedPoints[pointId] ? 'transform rotate-0' : 'transform -rotate-90'
                                          }`}
                                        />
                                        <h5 className="text-base font-medium">Measurement Point {pointIndex + 1}</h5>
                                        <div className="text-sm text-muted-foreground">
                                          {point.name || 'Unnamed Point'}
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeMeasurementPoint(locationIndex, pointIndex);
                                        }}
                                        className="text-destructive hover:text-destructive/90"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </Button>
                                    </div>
                                  </div>

                                  {expandedPoints[pointId] && (
                                    <div className="border-t border-border p-6 bg-background">
                                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                          <Label htmlFor={`measurement_location.${locationIndex}.measurement_point.${pointIndex}.name`}>
                                            Name
                                          </Label>
                                          <Input
                                            {...register(`measurement_location.${locationIndex}.measurement_point.${pointIndex}.name`)}
                                            placeholder="Enter measurement name"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor={`measurement_location.${locationIndex}.measurement_point.${pointIndex}.measurement_type_id`}>
                                            Measurement Type
                                          </Label>
                                          <Select
                                            onValueChange={(value) => setValue(
                                              `measurement_location.${locationIndex}.measurement_point.${pointIndex}.measurement_type_id`,
                                              value
                                            )}
                                            value={watch(
                                              `measurement_location.${locationIndex}.measurement_point.${pointIndex}.measurement_type_id`
                                            )}
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

                                        <div className="space-y-2">
                                          <Label htmlFor={`measurement_location.${locationIndex}.measurement_point.${pointIndex}.height_m`}>
                                            Height (m)
                                          </Label>
                                          <Input
                                            type="number"
                                            step="0.1"
                                            {...register(
                                              `measurement_location.${locationIndex}.measurement_point.${pointIndex}.height_m`,
                                              { valueAsNumber: true }
                                            )}
                                            placeholder="Enter height"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor={`measurement_location.${locationIndex}.measurement_point.${pointIndex}.height_reference_id`}>
                                            Height Reference
                                          </Label>
                                          <Select
                                            onValueChange={(value) => setValue(
                                              `measurement_location.${locationIndex}.measurement_point.${pointIndex}.height_reference_id`,
                                              value
                                            )}
                                            value={watch(
                                              `measurement_location.${locationIndex}.measurement_point.${pointIndex}.height_reference_id`
                                            )}
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

                                        <div className="sm:col-span-2 space-y-2">
                                          <Label htmlFor={`measurement_location.${locationIndex}.measurement_point.${pointIndex}.notes`}>
                                            Notes
                                          </Label>
                                          <Textarea
                                            {...register(`measurement_location.${locationIndex}.measurement_point.${pointIndex}.notes`)}
                                            placeholder="Add any additional notes"
                                            rows={3}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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