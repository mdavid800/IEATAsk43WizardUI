import React, { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, Upload, ChevronDown } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { SearchableSelect } from '../../ui/searchable-select';
import { Textarea } from '../../ui/textarea';
import { measurementTypeOptions, heightReferenceOptions } from '../../../utils/enum-options';

interface MeasurementSectionProps {
  locationIndex: number;
}

export function MeasurementSection({ locationIndex }: MeasurementSectionProps) {
  const { register, setValue, getValues } = useFormContext();
  const [measurements, setMeasurements] = useState([{ id: Date.now(), isExpanded: true }]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMeasurement = () => {
    setMeasurements([...measurements, { id: Date.now(), isExpanded: true }]);
  };

  const removeMeasurement = (id: number) => {
    setMeasurements(measurements.filter(m => m.id !== id));
  };

  const toggleExpand = (id: number) => {
    setMeasurements(measurements.map(m =>
      m.id === id ? { ...m, isExpanded: !m.isExpanded } : m
    ));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        if (!results.data || results.data.length < 2) {
          alert('Invalid CSV format. File must contain at least 2 rows.');
          return;
        }

        // Get the second row which contains the measurement names
        const headers = results.data[1] as string[];
        if (!headers || headers.length === 0) {
          alert('No measurement points found in the CSV file.');
          return;
        }

        // Skip the timestamp column (first column) and filter out empty headers
        const measurementNames = headers.slice(1).filter(name => name && name.trim() !== '');

        if (measurementNames.length === 0) {
          alert('No valid measurement points found in the CSV file.');
          return;
        }

        // Create measurement points from the names
        const newMeasurements = measurementNames.map((name, index) => {
          const cleanName = name.trim();
          const type = determineMeasurementType(cleanName);
          const statisticType = determineStatisticType(cleanName);
          const height = extractHeight(cleanName);

          return {
            id: Date.now() + index,
            isExpanded: true,
            name: cleanName,
            measurement_type_id: type,
            statistic_type_id: statisticType,
            height_m: height || 0,
            height_reference_id: determineHeightReference(type, cleanName)
          };
        });

        // Update form state with new measurements
        setMeasurements(newMeasurements);

        // Update form values for each measurement
        newMeasurements.forEach((measurement, index) => {
          setValue(`measurement_location.${locationIndex}.measurement_point.${index}.name`, measurement.name);
          setValue(`measurement_location.${locationIndex}.measurement_point.${index}.measurement_type_id`, measurement.measurement_type_id);
          setValue(`measurement_location.${locationIndex}.measurement_point.${index}.statistic_type_id`, measurement.statistic_type_id);
          setValue(`measurement_location.${locationIndex}.measurement_point.${index}.height_m`, measurement.height_m);
          setValue(`measurement_location.${locationIndex}.measurement_point.${index}.height_reference_id`, measurement.height_reference_id);
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

  const determineHeightReference = (measurementType: string, name: string): string => {
    const lowerName = name.toLowerCase();

    // Marine/water measurements typically use sea level references
    if (measurementType.includes('wave_') ||
      measurementType.includes('water_') ||
      measurementType === 'salinity' ||
      measurementType === 'conductivity' ||
      measurementType === 'turbidity' ||
      lowerName.includes('sea') ||
      lowerName.includes('marine') ||
      lowerName.includes('offshore')) {
      return 'sea_level';
    }

    // Motion measurements (from floating platforms) typically use sea level
    if (measurementType === 'pitch' ||
      measurementType === 'roll' ||
      measurementType === 'heading' ||
      measurementType.includes('motion_corrected') ||
      lowerName.includes('motion') ||
      lowerName.includes('float')) {
      return 'sea_level';
    }

    // Depth measurements use sea floor reference
    if (measurementType === 'depth' ||
      lowerName.includes('depth') ||
      lowerName.includes('seafloor')) {
      return 'sea_floor';
    }

    // Default to ground level for terrestrial measurements
    return 'ground_level';
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
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Measurement Points</h3>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            title="Upload CSV file"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={addMeasurement}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Point
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {measurements.map((measurement, index) => (
          <div key={measurement.id} className="border border-border rounded-lg overflow-hidden">
            {/* Measurement Header */}
            <div
              className="bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpand(measurement.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChevronDown className={`w-5 h-5 transition-transform ${measurement.isExpanded ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                  <h4 className="text-base font-medium text-foreground">Measurement Point {index + 1}</h4>
                  <div className="text-sm text-muted-foreground">
                    {getValues(`measurement_location.${locationIndex}.measurement_point.${index}.name`) || 'Unnamed Point'}
                  </div>
                </div>
                {measurements.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMeasurement(measurement.id);
                    }}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Measurement Content */}
            {measurement.isExpanded && (
              <div className="border-t border-border p-6 bg-background">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`measurement_location.${locationIndex}.measurement_point.${index}.name`}>
                      Name
                    </Label>
                    <Input
                      {...register(`measurement_location.${locationIndex}.measurement_point.${index}.name`)}
                      placeholder="Enter measurement name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`measurement_location.${locationIndex}.measurement_point.${index}.measurement_type_id`}>
                      Measurement Type
                    </Label>
                    <SearchableSelect
                      options={measurementTypeOptions}
                      value={getValues(`measurement_location.${locationIndex}.measurement_point.${index}.measurement_type_id`)}
                      onValueChange={(value) => setValue(`measurement_location.${locationIndex}.measurement_point.${index}.measurement_type_id`, value)}
                      placeholder="Select measurement type..."
                      searchPlaceholder="Search measurement types..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`measurement_location.${locationIndex}.measurement_point.${index}.height_m`}>
                      Height (m)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      {...register(`measurement_location.${locationIndex}.measurement_point.${index}.height_m`)}
                      placeholder="Enter height"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`measurement_location.${locationIndex}.measurement_point.${index}.height_reference_id`}>
                      Height Reference
                    </Label>
                    <SearchableSelect
                      options={heightReferenceOptions}
                      value={getValues(`measurement_location.${locationIndex}.measurement_point.${index}.height_reference_id`)}
                      onValueChange={(value) => setValue(`measurement_location.${locationIndex}.measurement_point.${index}.height_reference_id`, value)}
                      placeholder="Select height reference..."
                      searchPlaceholder="Search height references..."
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor={`measurement_location.${locationIndex}.measurement_point.${index}.notes`}>
                      Notes
                    </Label>
                    <Textarea
                      {...register(`measurement_location.${locationIndex}.measurement_point.${index}.notes`)}
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
  );
}