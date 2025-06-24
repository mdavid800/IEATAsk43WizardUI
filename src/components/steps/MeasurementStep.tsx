import React, { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { PlusCircle, Upload, ChevronDown, AlertCircle, Check } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { cn } from '../../utils/cn';
import type {
  IEATask43Schema,
  MeasurementType,
  HeightReference,
  MeasurementPoint,
  StatisticType
} from '@/types/schema';
import { MeasurementTable, type BulkEditValues } from './sections/MeasurementTable';

interface CSVValidationError {
  type: 'error' | 'warning';
  message: string;
}

interface CSVValidationResult {
  isValid: boolean;
  errors: CSVValidationError[];
  data: { headers: string[]; headerRowIndex: number; timeColIndex: number } | null;
}

interface ColumnInfo {
  name: string;
  measurementType: MeasurementType;
  height: number | null;
  unit?: string;
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
    height_reference_id: '',
    unit: '',
    sensors: []
  });

  // Validation logic moved from ReviewStep
  const validateMeasurements = () => {
    const formData = watch();
    const issues: string[] = [];

    formData.measurement_location?.forEach((location, locIndex) => {
      if (!location.measurement_point?.length) {
        issues.push(`Location ${locIndex + 1}: At least one measurement point is required`);
        return;
      }

      location.measurement_point.forEach((point, pointIndex) => {
        if (!point.name) {
          issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}: Name is required`);
        }
        if (!point.measurement_type_id) {
          issues.push(`Location ${locIndex + 1}, Point ${pointIndex + 1}: Measurement type is required`);
        }
      });
    });

    return {
      valid: issues.length === 0,
      issues
    };
  };

  const validationResult = validateMeasurements();

  const addMeasurementPoint = (locationIndex: number, loggerIndex: number) => {
    const logger = watch(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}`);
    if (!logger) return;

    const currentPoints = watch(`measurement_location.${locationIndex}.measurement_point`) || [];
    const newPoint = {
      name: '',
      measurement_type_id: 'other' as const,
      height_m: 0,
      unit: '', // Add this line
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

    // Find header row - try first few rows until we find one with valid column names
    let headerRowIndex = 0;
    let headers: string[] = [];

    // Check first 5 rows to find header
    for (let i = 0; i < Math.min(5, nonEmptyRows.length); i++) {
      const potentialHeaders = nonEmptyRows[i] as string[];
      if (potentialHeaders && potentialHeaders.length > 1) {
        // Skip rows that are mostly empty
        const nonEmptyCells = potentialHeaders.filter(cell => cell !== null && cell !== undefined && cell !== '');
        if (nonEmptyCells.length > Math.max(2, potentialHeaders.length * 0.2)) {
          // Check if this row looks like a header row (containing keywords like timestamp, wind, speed, etc.)
          const headerKeywords = ['time', 'date', 'wind', 'speed', 'dir', 'temp', 'humidity', 'pressure', 'wave'];
          const lowerCaseCells = potentialHeaders.map(cell => (cell || '').toString().toLowerCase());

          const keywordMatches = headerKeywords.some(keyword =>
            lowerCaseCells.some(cell => cell.includes(keyword))
          );

          if (keywordMatches) {
            headerRowIndex = i;
            headers = potentialHeaders;
            break;
          }
        }
      }
    }

    // If we couldn't find a proper header row, default to the first row
    if (headers.length === 0) {
      headers = nonEmptyRows[0] as string[];
      headerRowIndex = 0;
    }

    if (!headers || headers.length === 0) {
      errors.push({
        type: 'error',
        message: 'CSV file must contain valid headers'
      });
      return { isValid: false, errors, data: null };
    }

    // Check if there's a timestamp column
    // Look for timestamp in first few columns (sometimes there are metadata rows before timestamp)
    const timestampColumnIndex = headers.findIndex((header, index) => {
      if (index > 5) return false; // Only check first few columns

      const headerStr = (header || '').toString().toLowerCase();
      return headerStr.includes('timestamp') ||
        headerStr.includes('date') ||
        headerStr.includes('time') ||
        headerStr === 'iso' ||
        headerStr.includes('utc');
    });

    if (timestampColumnIndex === -1) {
      errors.push({
        type: 'warning',
        message: 'No timestamp column detected. First column will be treated as timestamp.'
      });
    }

    // Identify the actual timestamp column to use (default to first column if none found)
    const timeColIndex = timestampColumnIndex !== -1 ? timestampColumnIndex : 0;

    // Check for measurement columns (all columns except timestamp column)
    const dataColumns = headers.filter((name, i) => i !== timeColIndex && name && name.trim() !== '');
    if (dataColumns.length === 0) {
      errors.push({
        type: 'error',
        message: 'No valid measurement columns found'
      });
      return { isValid: false, errors, data: null };
    }

    // Validate data rows (skip header row)
    let invalidTimestampCount = 0;
    for (let i = headerRowIndex + 1; i < nonEmptyRows.length; i++) {
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
        const timestamp = row[timeColIndex];
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
      data: hasErrors ? null : { headers, headerRowIndex, timeColIndex }
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

    // Support various date formats

    // Try ISO format first
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(value)) {
      return true;
    }

    // DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/.test(value)) {
      return true;
    }

    // MM/DD/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}\s\d{1,2}:\d{1,2}(?::\d{1,2})?(?:\s[APap][Mm])?$/.test(value)) {
      return true;
    }

    // YYYY/MM/DD format
    if (/^\d{4}\/\d{1,2}\/\d{1,2}\s\d{1,2}:\d{1,2}(?::\d{1,2})?$/.test(value)) {
      return true;
    }

    // YYYYMMDD_HHMMSS format
    if (/^\d{8}_\d{6}$/.test(value)) {
      return true;
    }

    // Unix timestamp (seconds since epoch)
    if (/^\d{10}$/.test(value) && !isNaN(parseInt(value))) {
      return true;
    }

    // Try parsing with Date.parse as a fallback
    if (!isNaN(Date.parse(value))) {
      return true;
    }

    return false;
  };

  const parseColumnHeader = (header: string): ColumnInfo => {
    // Always preserve the exact original column name
    const result: ColumnInfo = {
      name: header, // Preserve original header name exactly
      measurementType: 'other',
      height: null,
      unit: undefined,
      statisticType: 'avg'
    };

    // Process the header to extract metadata without changing the original name
    const lowerHeader = header.toLowerCase();

    // Extract units
    if (lowerHeader.includes('m/s')) {
      result.unit = 'm/s';
    } else if (lowerHeader.includes('deg')) {
      result.unit = 'deg';
    } else if (lowerHeader.includes('%')) {
      result.unit = '%';
    } else if (lowerHeader.includes('hpa')) {
      result.unit = 'hPa';
    } else if (lowerHeader.includes('mbar')) {
      result.unit = 'mbar';
    }

    // Extract height using various patterns
    // Pattern matching for different height formats like "40m", "40 m", "_40m", etc.
    let heightPatterns = [
      // Matches "040m" or "40m" format
      /(?:^|[^0-9])(\d+)m\b/i,
      // Matches "_40m" format
      /_(\d+)m/i,
      // Matches "40 m" format with space
      /(\d+)\s+m\b/i,
      // Matches height at the end like "height40"
      /height(\d+)/i,
      // Matches "_2m" format (e.g., for buoy wave data)
      /_(\d+)m\b/i,
    ];

    // Try each pattern until we find a match
    for (const pattern of heightPatterns) {
      const match = pattern.exec(lowerHeader);
      if (match) {
        result.height = parseInt(match[1], 10);
        break;
      }
    }

    // Process different measurement types - extended pattern matching

    // Wind speed measurements
    if (/verticalwindspeed|vertical_wind_speed|vert[._]?w[._]?s|vertical[._]?speed/i.test(lowerHeader)) {
      result.measurementType = 'wind_speed';
    }
    else if (/windspeed|wind_speed|wind[._]?s|w[._]?s|hor[._]?speed|horiz[._]?speed/i.test(lowerHeader)) {
      result.measurementType = 'wind_speed';
    }
    else if (/wind[._]?vel|windvelocity/i.test(lowerHeader)) {
      result.measurementType = 'wind_speed';
    }

    // Wind direction
    else if (/winddir|wind_dir|wind[._]?d|w[._]?d|wind[._]?direction|direction/i.test(lowerHeader)) {
      result.measurementType = 'wind_direction';
    }
    else if (/azimuth|heading|bearing/i.test(lowerHeader)) {
      result.measurementType = 'wind_direction';
    }

    // Wind gust
    else if (/windgust|wind_gust|gust|max[._]?gust/i.test(lowerHeader)) {
      result.measurementType = 'wind_speed';
      result.statisticType = 'gust';
    }

    // Max/Min wind
    else if (/windmax|wind_max|max[._]?hor|max[._]?wind/i.test(lowerHeader)) {
      result.measurementType = 'wind_speed';
      result.statisticType = 'max';
    }
    else if (/windmin|wind_min|min[._]?hor|min[._]?wind/i.test(lowerHeader)) {
      result.measurementType = 'wind_speed';
      result.statisticType = 'min';
    }

    // Standard deviation
    else if (/standarddeviation|std|std[._]?dev|sigma|wind[._]?std/i.test(lowerHeader)) {
      result.measurementType = 'wind_speed';
      result.statisticType = 'sd';
    }

    // Wind shear
    else if (/wind[._]?shear|shear/i.test(lowerHeader)) {
      result.measurementType = 'wind_speed';

      // Extract height range from shear measurements
      const shearMatch = /(\d+)m-(\d+)m/.exec(header);
      if (shearMatch) {
        const upperHeight = parseInt(shearMatch[1], 10);
        const lowerHeight = parseInt(shearMatch[2], 10);
        result.height = (upperHeight + lowerHeight) / 2; // Use average height
      }
    }

    // Wind veer
    else if (/wind[._]?veer|veer/i.test(lowerHeader)) {
      result.measurementType = 'wind_direction';

      // Extract height range from veer measurements
      const veerMatch = /(\d+)m-(\d+)m/.exec(header);
      if (veerMatch) {
        const upperHeight = parseInt(veerMatch[1], 10);
        const lowerHeight = parseInt(veerMatch[2], 10);
        result.height = (upperHeight + lowerHeight) / 2; // Use average height
      }
    }

    // Turbulence intensity
    else if (/turbulence|ti\d+m|ti[._]?\d+|intensity|ti\b/i.test(lowerHeader)) {
      result.measurementType = 'wind_speed';
      result.statisticType = 'ti';
    }

    // Temperature
    else if (/temp|temperature/i.test(lowerHeader)) {
      result.measurementType = 'temperature';
    }

    // Pressure
    else if (/press|pressure|baro/i.test(lowerHeader)) {
      result.measurementType = 'pressure';
    }

    // Humidity
    else if (/humid|humidity|rh\b/i.test(lowerHeader)) {
      result.measurementType = 'humidity';
    }

    // Wave measurements
    else if (/significantwaveheight|significant[._]?wave|hsig|hs\b/i.test(lowerHeader)) {
      result.measurementType = 'wave_height';
    }
    else if (/maximumwaveheight|maximum[._]?wave|hmax/i.test(lowerHeader)) {
      result.measurementType = 'wave_height';
      result.statisticType = 'max';
    }
    else if (/peakperiod|peak[._]?period|tp\b/i.test(lowerHeader)) {
      result.measurementType = 'wave_period';
    }
    else if (/meanspectralperiod|mean[._]?period|t[0-9]\b/i.test(lowerHeader)) {
      result.measurementType = 'wave_period';
    }
    else if (/wavedirection|wave[._]?direction|mwd\b|direction/i.test(lowerHeader)) {
      result.measurementType = 'wave_direction';
    }

    // Position/GPS
    else if (/gps|lat|lon|position|coordinate/i.test(lowerHeader)) {
      result.measurementType = 'position';
    }

    // If no height was found but there are numbers in the column name, try to extract height
    if (result.height === null) {
      // Look for any number in the string as a fallback
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

            if (!validation.data) {
              console.error('Validation passed but data is null');
              return;
            }
            const { headers, timeColIndex } = validation.data;
            console.log('CSV headers', headers);

            // Process all columns except the timestamp column
            const dataColumns = headers.filter((_, i) => i !== timeColIndex);
            console.log('Data columns', dataColumns);

            // Parse each column header to extract metadata (without changing the name)
            const measurementColumns = dataColumns.map(parseColumnHeader);
            console.log('Parsed columns', measurementColumns);

            // Create measurement points from columns (one point per column)
            const measurementPoints: MeasurementPoint[] = [];

            measurementColumns.forEach(column => {
              if (column.height === null) {
                column.height = 0; // Default height if none detected
              }

              // Create the measurement point
              const measurementPoint: MeasurementPoint = {
                name: column.name, // Use exact original column name
                measurement_type_id: column.measurementType,
                height_m: column.height || 0,
                unit: column.unit, // Assign the unit from ColumnInfo
                height_reference_id: 'ground_level',
                update_at: new Date().toISOString(),
                logger_measurement_config: [{
                  logger_id: loggerId,
                  date_from: new Date().toISOString(),
                  date_to: null,
                  update_at: new Date().toISOString(),
                  column_name: [{
                    column_name: column.name, // Use exact original column name
                    statistic_type_id: column.statisticType,
                    is_ignored: false,
                    update_at: new Date().toISOString()
                  }]
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

  return (
    <div className="space-y-8">
      <div className="border-b border-border/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">Measurement Points</h2>
            <p className="text-muted-foreground">Define the measurement points and their configurations for each logger.</p>
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
                <span>Complete</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>{validationResult.issues.length} issue{validationResult.issues.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>

        {!validationResult.valid && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-2">Please complete the following:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationResult.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="select-none">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

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

                        <MeasurementTable
                          locationIndex={locationIndex}
                          loggerIdentifier={loggerIdentifier}
                          selectedPoints={selectedPoints}
                          setSelectedPoints={setSelectedPoints}
                          bulkEditValues={bulkEditValues}
                          setBulkEditValues={setBulkEditValues}
                          onRemovePoint={removeMeasurementPoint}
                        />
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