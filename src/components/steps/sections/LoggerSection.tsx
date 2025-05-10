import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, ChevronDown, Upload, HardDrive, Gauge } from 'lucide-react';
import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface LoggerSectionProps {
  locationIndex: number;
}

interface Logger {
  id: string;
  isExpanded: boolean;
  measurements: Measurement[];
}

interface Measurement {
  id: string;
  isExpanded: boolean;
}

const generateId = () => crypto.randomUUID();

export function LoggerSection({ locationIndex }: LoggerSectionProps) {
  const { register, setValue, getValues } = useFormContext();
  const [loggers, setLoggers] = useState<Logger[]>([{ 
    id: generateId(), 
    isExpanded: true,
    measurements: [{ id: generateId(), isExpanded: true }]
  }]);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const addLogger = () => {
    setLoggers([...loggers, { 
      id: generateId(), 
      isExpanded: true,
      measurements: [{ id: generateId(), isExpanded: true }]
    }]);
  };

  const removeLogger = (loggerId: string) => {
    setLoggers(loggers.filter(logger => logger.id !== loggerId));
  };

  const toggleLoggerExpand = (loggerId: string) => {
    setLoggers(loggers.map(logger => 
      logger.id === loggerId ? { ...logger, isExpanded: !logger.isExpanded } : logger
    ));
  };

  const addMeasurement = (loggerId: string) => {
    setLoggers(loggers.map(logger => 
      logger.id === loggerId 
        ? { 
            ...logger, 
            measurements: [...logger.measurements, { id: generateId(), isExpanded: true }]
          }
        : logger
    ));
  };

  const removeMeasurement = (loggerId: string, measurementId: string) => {
    setLoggers(loggers.map(logger => 
      logger.id === loggerId 
        ? {
            ...logger,
            measurements: logger.measurements.filter(m => m.id !== measurementId)
          }
        : logger
    ));
  };

  const toggleMeasurementExpand = (loggerId: string, measurementId: string) => {
    setLoggers(loggers.map(logger => 
      logger.id === loggerId 
        ? {
            ...logger,
            measurements: logger.measurements.map(m => 
              m.id === measurementId ? { ...m, isExpanded: !m.isExpanded } : m
            )
          }
        : logger
    ));
  };

  const handleUploadClick = (loggerId: string) => {
    fileInputRefs.current[loggerId]?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, loggerId: string, loggerIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        if (!results.data || results.data.length < 2) {
          alert('Invalid CSV format. File must contain at least 2 rows.');
          return;
        }

        const headers = results.data[1] as string[];
        if (!headers || headers.length === 0) {
          alert('No measurement points found in the CSV file.');
          return;
        }

        const measurementNames = headers.slice(1).filter(name => name && name.trim() !== '');
        
        if (measurementNames.length === 0) {
          alert('No valid measurement points found in the CSV file.');
          return;
        }

        const newMeasurements = measurementNames.map((name) => {
          const cleanName = name.trim();
          const type = determineMeasurementType(cleanName);
          const height = extractHeight(cleanName);
          
          return {
            id: generateId(),
            isExpanded: true,
            name: cleanName,
            measurement_type_id: type,
            height_m: height || 0,
            height_reference_id: type.includes('wave') ? 'sea_level' : 'ground_level'
          };
        });

        setLoggers(loggers.map(logger => 
          logger.id === loggerId 
            ? { ...logger, measurements: newMeasurements }
            : logger
        ));

        newMeasurements.forEach((measurement, index) => {
          setValue(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${index}.name`, measurement.name);
          setValue(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${index}.measurement_type_id`, measurement.measurement_type_id);
          setValue(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${index}.height_m`, measurement.height_m);
          setValue(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${index}.height_reference_id`, measurement.height_reference_id);
        });
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the file format.');
      }
    });

    event.target.value = '';
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
    <div className="p-6 space-y-4 theme-bold">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Loggers</h3>
        </div>
        <Button
          type="button"
          onClick={addLogger}
          variant="default"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Logger
        </Button>
      </div>

      <div className="space-y-6">
        {loggers.map((logger, loggerIndex) => (
          <div key={logger.id} className="logger-card">
            {/* Logger Header */}
            <div 
              className="bg-primary p-4 cursor-pointer hover:bg-primary/90 transition-colors"
              onClick={() => toggleLoggerExpand(logger.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChevronDown className={`w-5 h-5 transition-transform text-primary-foreground ${logger.isExpanded ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                  <h4 className="text-base font-medium text-primary-foreground">Logger {loggerIndex + 1}</h4>
                  <div className="text-sm text-primary-foreground/80">
                    {getValues(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_name`) || 'Unnamed Logger'}
                  </div>
                </div>
                {loggers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLogger(logger.id);
                    }}
                    className="text-primary-foreground hover:text-primary-foreground/90 hover:bg-primary-foreground/10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Logger Content */}
            {logger.isExpanded && (
              <div>
                {/* Logger Details */}
                <div className="p-6 bg-background">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_serial_number`}>
                        Serial Number
                      </Label>
                      <Input
                        {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_serial_number`)}
                        placeholder="Enter serial number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_model_name`}>
                        Model Name
                      </Label>
                      <Input
                        {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_model_name`)}
                        placeholder="Enter model name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_oem_id`}>
                        OEM ID
                      </Label>
                      <Input
                        {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_oem_id`)}
                        placeholder="Enter OEM ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_name`}>
                        Logger Name
                      </Label>
                      <Input
                        {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_name`)}
                        placeholder="Enter logger name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_firmware_version`}>
                        Firmware Version
                      </Label>
                      <Input
                        {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_firmware_version`)}
                        placeholder="Enter firmware version"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.date_from`}>
                        Date From
                      </Label>
                      <Input
                        type="datetime-local"
                        {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.date_from`)}
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.notes`}>
                        Notes
                      </Label>
                      <Textarea
                        {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.notes`)}
                        placeholder="Add any additional notes"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Measurements Section */}
                <div className="p-6 space-y-4 bg-muted">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-primary" />
                      <h4 className="text-base font-semibold text-foreground">Measurement Points</h4>
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={el => fileInputRefs.current[logger.id] = el}
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, logger.id, loggerIndex)}
                        className="hidden"
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleUploadClick(logger.id)}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CSV
                      </Button>
                      <Button 
                        type="button"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => addMeasurement(logger.id)}
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Point
                      </Button>
                    </div>
                  </div>

                  <div className="measurement-section">
                    {logger.measurements.map((measurement, measurementIndex) => (
                      <div key={measurement.id} className="measurement-card mb-4">
                        {/* Measurement Header */}
                        <div 
                          className="bg-primary/90 p-4 cursor-pointer hover:bg-primary/80 transition-colors"
                          onClick={() => toggleMeasurementExpand(logger.id, measurement.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ChevronDown className={`w-5 h-5 transition-transform text-primary-foreground ${measurement.isExpanded ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                              <h5 className="text-sm font-medium text-primary-foreground">Measurement Point {measurementIndex + 1}</h5>
                              <div className="text-sm text-primary-foreground/80">
                                {getValues(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.name`) || 'Unnamed Point'}
                              </div>
                            </div>
                            {logger.measurements.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMeasurement(logger.id, measurement.id);
                                }}
                                className="text-primary-foreground hover:text-primary-foreground/90 hover:bg-primary-foreground/10"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Measurement Content */}
                        {measurement.isExpanded && (
                          <div className="p-6 bg-background">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.name`}>
                                  Name
                                </Label>
                                <Input
                                  {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.name`)}
                                  placeholder="Enter measurement name"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.measurement_type_id`}>
                                  Measurement Type
                                </Label>
                                <Select
                                  onValueChange={(value) => setValue(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.measurement_type_id`, value)}
                                  value={getValues(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.measurement_type_id`)}
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
                                <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.height_m`}>
                                  Height (m)
                                </Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.height_m`)}
                                  placeholder="Enter height"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.height_reference_id`}>
                                  Height Reference
                                </Label>
                                <Select
                                  onValueChange={(value) => setValue(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.height_reference_id`, value)}
                                  value={getValues(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.height_reference_id`)}
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
                                <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.notes`}>
                                  Notes
                                </Label>
                                <Textarea
                                  {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${measurementIndex}.notes`)}
                                  placeholder="Add any additional notes"
                                  rows={3}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}