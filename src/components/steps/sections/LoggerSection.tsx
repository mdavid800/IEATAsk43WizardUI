import React, { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, ChevronDown, Upload, HardDrive, Gauge } from 'lucide-react';
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
          const statisticType = determineStatisticType(cleanName);
          const height = extractHeight(cleanName);

          return {
            id: generateId(),
            isExpanded: true,
            name: cleanName,
            measurement_type_id: type,
            statistic_type_id: statisticType,
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
          setValue(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.measurement_point.${index}.statistic_type_id`, measurement.statistic_type_id);
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

    // Wind measurements (most common, check first)
    if (lowerName.includes('windspeed') || lowerName.includes('wind_speed')) return 'wind_speed';
    if (lowerName.includes('winddirection') || lowerName.includes('wind_direction')) return 'wind_direction';
    if (lowerName.includes('verticalwind') || lowerName.includes('vertical_wind')) return 'vertical_wind_speed';
    if (lowerName.includes('turbulence') || lowerName.includes('ti')) return 'wind_speed_turbulence';
    if (lowerName.includes('gust')) return 'wind_speed'; // Gust is typically wind speed statistic

    // Temperature measurements
    if (lowerName.includes('airtemp') || lowerName.includes('air_temp')) return 'air_temperature';
    if (lowerName.includes('watertemp') || lowerName.includes('water_temp') || lowerName.includes('seatemp')) return 'water_temperature';
    if (lowerName.includes('temp') && !lowerName.includes('air') && !lowerName.includes('water')) return 'temperature';

    // Pressure measurements
    if (lowerName.includes('airpress') || lowerName.includes('air_press') || lowerName.includes('barometric')) return 'air_pressure';
    if (lowerName.includes('press') && !lowerName.includes('air')) return 'pressure';
    if (lowerName.includes('density')) return 'air_density';

    // Humidity
    if (lowerName.includes('humid') || lowerName.includes('rh')) return 'relative_humidity';

    // Wave measurements  
    if (lowerName.includes('significantwaveheight') || lowerName.includes('hs') || lowerName.includes('swh')) return 'wave_significant_height';
    if (lowerName.includes('maximumwaveheight') || lowerName.includes('hmax')) return 'wave_maximum_height';
    if (lowerName.includes('waveheight') || lowerName.includes('wave_height')) return 'wave_height';
    if (lowerName.includes('peakperiod') || lowerName.includes('tp')) return 'wave_peak_period';
    if (lowerName.includes('meanspectralperiod') || lowerName.includes('tm')) return 'wave_period';
    if (lowerName.includes('waveperiod') || lowerName.includes('wave_period')) return 'wave_period';
    if (lowerName.includes('wavedirection') || lowerName.includes('wave_direction') || lowerName.includes('mwd')) return 'wave_direction';

    // Solar/Irradiance measurements
    if (lowerName.includes('ghi') || lowerName.includes('globalhorz') || lowerName.includes('global_horizontal')) return 'global_horizontal_irradiance';
    if (lowerName.includes('dni') || lowerName.includes('directnormal') || lowerName.includes('direct_normal')) return 'direct_normal_irradiance';
    if (lowerName.includes('dhi') || lowerName.includes('diffusehorizontal')) return 'diffuse_horizontal_irradiance';
    if (lowerName.includes('irradiance') || lowerName.includes('solar')) return 'global_horizontal_irradiance';
    if (lowerName.includes('albedo') || lowerName.includes('reflection')) return 'albedo';

    // Electrical measurements
    if (lowerName.includes('voltage') || lowerName.includes('volt')) return 'voltage';
    if (lowerName.includes('current') || lowerName.includes('amp')) return 'current';
    if (lowerName.includes('resistance') || lowerName.includes('ohm')) return 'resistance';
    if (lowerName.includes('power') && !lowerName.includes('wind')) return 'power';
    if (lowerName.includes('energy')) return 'energy';

    // Position and motion
    if (lowerName.includes('gps') || lowerName.includes('latitude') || lowerName.includes('longitude')) return 'gps_coordinates';
    if (lowerName.includes('pitch')) return 'pitch';
    if (lowerName.includes('roll')) return 'roll';
    if (lowerName.includes('heading') || lowerName.includes('yaw')) return 'heading';
    if (lowerName.includes('tilt')) return 'tilt';
    if (lowerName.includes('orientation')) return 'orientation';

    // Environmental
    if (lowerName.includes('precipitation') || lowerName.includes('rain')) return 'precipitation';
    if (lowerName.includes('ice') || lowerName.includes('icing')) return 'ice_detection';
    if (lowerName.includes('fog') || lowerName.includes('visibility')) return 'fog';
    if (lowerName.includes('illuminance') || lowerName.includes('lux')) return 'illuminance';

    // Water measurements
    if (lowerName.includes('salinity') || lowerName.includes('salt')) return 'salinity';
    if (lowerName.includes('conductivity')) return 'conductivity';
    if (lowerName.includes('turbidity')) return 'turbidity';
    if (lowerName.includes('waterspeed') || lowerName.includes('current_speed')) return 'water_speed';
    if (lowerName.includes('waterdirection') || lowerName.includes('current_direction')) return 'water_direction';

    // Quality and status
    if (lowerName.includes('quality') || lowerName.includes('qc')) return 'quality';
    if (lowerName.includes('status') || lowerName.includes('flag')) return 'status';
    if (lowerName.includes('availability') || lowerName.includes('avail')) return 'availability';
    if (lowerName.includes('counter') || lowerName.includes('count')) return 'counter';

    // Signal strength (lidar/sodar)
    if (lowerName.includes('cnr') || lowerName.includes('carrier')) return 'carrier_to_noise_ratio';
    if (lowerName.includes('snr') || lowerName.includes('signal')) return 'signal_to_noise_ratio';
    if (lowerName.includes('echo') || lowerName.includes('intensity')) return 'echo_intensity';

    return 'other';
  };

  const extractHeight = (name: string): number | null => {
    const match = name.match(/_(\d+)m/);
    if (match) {
      return parseInt(match[1]);
    }
    return null;
  };

  const determineStatisticType = (name: string): string => {
    const lowerName = name.toLowerCase();

    // Enhanced statistic type detection
    if (/\bavg\b|\baverage\b|\bmean\b/i.test(lowerName)) return 'avg';
    if (/\bstd\b|\bstdev\b|\bstandarddeviation\b|\bsd\b|\bsigma\b/i.test(lowerName)) return 'sd';
    if (/\bmax\b|\bmaximum\b|\bpeak\b|\bhighest\b/i.test(lowerName)) return 'max';
    if (/\bmin\b|\bminimum\b|\blowest\b/i.test(lowerName)) return 'min';
    if (/\bti\b|\bturbulence\b|\bintensity\b|\bti\d+|\bti_\d+/i.test(lowerName)) return 'ti';
    if (/\bgust\b|\bgusting\b|\bwindgust\b/i.test(lowerName)) return 'gust';
    if (/\bcount\b|\bnumber\b|\bn\b|\bnum\b/i.test(lowerName)) return 'count';
    if (/\bsum\b|\btotal\b|\bcumulative\b/i.test(lowerName)) return 'sum';
    if (/\bmedian\b|\bmid\b|\bmiddle\b/i.test(lowerName)) return 'median';
    if (/\brange\b|\bspan\b|\bdifference\b/i.test(lowerName)) return 'range';
    if (/\bquality\b|\bvalid\b|\bavailability\b|\bavail\b/i.test(lowerName)) return 'quality';
    if (/\btext\b|\bstring\b|\blabel\b|\bstatus\b/i.test(lowerName)) return 'text';

    return 'avg'; // Default to average
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
                      <Label htmlFor={`fileInput_${logger.id}`}>
                        Upload CSV
                      </Label>
                      <input
                        id={`fileInput_${logger.id}`}
                        ref={el => fileInputRefs.current[logger.id] = el}
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, logger.id, loggerIndex)}
                        className="hidden"
                        title="Upload CSV file"
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