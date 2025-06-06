import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, Upload, ChevronDown, AlertCircle, Search, X } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
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
  measurementType: MeasurementType;
  height: number | null;
  unit: string | null;
  statisticType: StatisticType;
}

interface TableFilters {
  name: string;
  measurementType: string;
  height: string;
  heightReference: string;
  notes: string;
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
  
  // Filter state for each logger
  const [tableFilters, setTableFilters] = useState<{ [key: string]: TableFilters }>({});

  // Initialize filters for a logger if they don't exist
  const getFiltersForLogger = (loggerIdentifier: string): TableFilters => {
    return tableFilters[loggerIdentifier] || {
      name: '',
      measurementType: '',
      height: '',
      heightReference: '',
      notes: ''
    };
  };

  // Update filters for a specific logger
  const updateFilter = (loggerIdentifier: string, field: keyof TableFilters, value: string) => {
    setTableFilters(prev => ({
      ...prev,
      [loggerIdentifier]: {
        ...getFiltersForLogger(loggerIdentifier),
        [field]: value
      }
    }));
  };

  // Clear all filters for a logger
  const clearFilters = (loggerIdentifier: string) => {
    setTableFilters(prev => ({
      ...prev,
      [loggerIdentifier]: {
        name: '',
        measurementType: '',
        height: '',
        heightReference: '',
        notes: ''
      }
    }));
  };

  // Filter measurement points based on current filters
  const getFilteredPoints = (locationIndex: number, loggerIdentifier: string) => {
    const allPoints = watch(`measurement_location.${locationIndex}.measurement_point`) || [];
    const relevantPoints = allPoints.filter(point =>
      point.logger_measurement_config?.[0]?.logger_id === loggerIdentifier
    );
    
    const filters = getFiltersForLogger(loggerIdentifier);
    
    // If no filters are active, return all points
    if (!Object.values(filters).some(filter => filter.trim() !== '')) {
      return relevantPoints.map((point, index) => ({
        point,
        originalIndex: allPoints.findIndex(p => p === point),
        displayIndex: index
      }));
    }

    // Apply filters
    return relevantPoints
      .map((point, index) => ({
        point,
        originalIndex: allPoints.findIndex(p => p === point),
        displayIndex: index
      }))
      .filter(({ point }) => {
        const matchesName = !filters.name || 
          (point.name || '').toLowerCase().includes(filters.name.toLowerCase());
        
        const matchesType = !filters.measurementType || 
          point.measurement_type_id === filters.measurementType;
        
        const matchesHeight = !filters.height || 
          point.height_m.toString().includes(filters.height);
        
        const matchesHeightRef = !filters.heightReference || 
          point.height_reference_id === filters.heightReference;
        
        const matchesNotes = !filters.notes || 
          (point.notes || '').toLowerCase().includes(filters.notes.toLowerCase());

        return matchesName && matchesType && matchesHeight && matchesHeightRef && matchesNotes;
      });
  };

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
      unit: null,
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

            const { headers, timeColIndex } = validation.data as { headers: string[], headerRowIndex: number, timeColIndex: number };
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
    const filteredPoints = getFilteredPoints(locationIndex, loggerIdentifier);

    const allSelected = filteredPoints.every(({ originalIndex }) =>
      selectedPoints[`${locationIndex}-${originalIndex}`]
    );

    const newSelectedPoints = { ...selectedPoints };
    filteredPoints.forEach(({ originalIndex }) => {
      newSelectedPoints[`${locationIndex}-${originalIndex}`] = !allSelected;
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
                const filteredPoints = getFilteredPoints(locationIndex, loggerIdentifier);
                const filters = getFiltersForLogger(loggerIdentifier);

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
                        <div className="text-sm text-primary font-medium">
                          {filteredPoints.length} points
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
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                              Measurement Points
                            </div>
                            {Object.values(filters).some(filter => filter.trim() !== '') && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => clearFilters(loggerIdentifier)}
                                className="text-xs text-primary hover:text-primary/90"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Clear Filters
                              </Button>
                            )}
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
                                    checked={filteredPoints.length > 0 && filteredPoints.every(({ originalIndex }) =>
                                      selectedPoints[`${locationIndex}-${originalIndex}`]
                                    )}
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
                              {/* Filter Row */}
                              <tr className="bg-muted/30">
                                <td className="px-4 py-2">
                                  <div className="w-6"></div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="relative">
                                    <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      type="text"
                                      placeholder="Filter name..."
                                      value={filters.name}
                                      onChange={(e) => updateFilter(loggerIdentifier, 'name', e.target.value)}
                                      className="pl-7 h-8 text-xs"
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <Select
                                    value={filters.measurementType}
                                    onValueChange={(value) => updateFilter(loggerIdentifier, 'measurementType', value)}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Filter type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">All Types</SelectItem>
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
                                <td className="px-4 py-2">
                                  <div className="relative">
                                    <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      type="text"
                                      placeholder="Filter height..."
                                      value={filters.height}
                                      onChange={(e) => updateFilter(loggerIdentifier, 'height', e.target.value)}
                                      className="pl-7 h-8 text-xs"
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <Select
                                    value={filters.heightReference}
                                    onValueChange={(value) => updateFilter(loggerIdentifier, 'heightReference', value)}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Filter ref..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">All References</SelectItem>
                                      <SelectItem value="ground_level">Ground Level</SelectItem>
                                      <SelectItem value="sea_level">Sea Level</SelectItem>
                                      <SelectItem value="sea_floor">Sea Floor</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="relative">
                                    <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      type="text"
                                      placeholder="Filter notes..."
                                      value={filters.notes}
                                      onChange={(e) => updateFilter(loggerIdentifier, 'notes', e.target.value)}
                                      className="pl-7 h-8 text-xs"
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="w-6"></div>
                                </td>
                              </tr>
                            </thead>
                            <tbody className="bg-background divide-y divide-border">
                              {filteredPoints.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                    {Object.values(filters).some(filter => filter.trim() !== '') 
                                      ? 'No measurement points match the current filters.'
                                      : 'No measurement points found for this logger.'
                                    }
                                  </td>
                                </tr>
                              ) : (
                                filteredPoints.map(({ point, originalIndex, displayIndex }) => (
                                  <tr key={`${loggerId}-${originalIndex}`}>
                                    <td className="px-4 py-2 text-center align-middle">
                                      <Checkbox
                                        checked={selectedPoints[`${locationIndex}-${originalIndex}`] || false}
                                        onCheckedChange={(checked: boolean) =>
                                          setSelectedPoints(prev => ({
                                            ...prev,
                                            [`${locationIndex}-${originalIndex}`]: checked
                                          }))
                                        }
                                        aria-label={`Select point ${displayIndex + 1}`}
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                      <Input
                                        {...register(`measurement_location.${locationIndex}.measurement_point.${originalIndex}.name`)}
                                        placeholder="Enter measurement name"
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                      <Select
                                        onValueChange={(value: MeasurementType) => setValue(
                                          `measurement_location.${locationIndex}.measurement_point.${originalIndex}.measurement_type_id`,
                                          value
                                        )}
                                        value={watch(
                                          `measurement_location.${locationIndex}.measurement_point.${originalIndex}.measurement_type_id`
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
                                          `measurement_location.${locationIndex}.measurement_point.${originalIndex}.height_m`,
                                          { valueAsNumber: true }
                                        )}
                                        placeholder="Enter height"
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                      <Select
                                        onValueChange={(value: HeightReference) => setValue(
                                          `measurement_location.${locationIndex}.measurement_point.${originalIndex}.height_reference_id`,
                                          value
                                        )}
                                        value={watch(
                                          `measurement_location.${locationIndex}.measurement_point.${originalIndex}.height_reference_id`
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
                                        {...register(`measurement_location.${locationIndex}.measurement_point.${originalIndex}.notes`)}
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
                                        onClick={() => removeMeasurementPoint(locationIndex, originalIndex)}
                                        className="p-2 hover:bg-transparent"
                                      >
                                        <Trash2 className="w-6 h-6 text-[#FF0000] hover:text-[#CC0000]" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))
                              )}
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