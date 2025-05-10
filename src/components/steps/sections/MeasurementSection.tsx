import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, Upload, ChevronDown } from 'lucide-react';
import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';

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
          const height = extractHeight(cleanName);
          
          return {
            id: Date.now() + index,
            isExpanded: true,
            name: cleanName,
            measurement_type_id: type,
            height_m: height || 0,
            height_reference_id: type.includes('wave') ? 'sea_level' : 'ground_level'
          };
        });

        // Update form state with new measurements
        setMeasurements(newMeasurements);
        
        // Update form values for each measurement
        newMeasurements.forEach((measurement, index) => {
          setValue(`measurement_location.${locationIndex}.measurement_point.${index}.name`, measurement.name);
          setValue(`measurement_location.${locationIndex}.measurement_point.${index}.measurement_type_id`, measurement.measurement_type_id);
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
    
    // Wave measurements
    if (lowerName.includes('significantwaveheight')) return 'wave_height';
    if (lowerName.includes('maximumwaveheight')) return 'wave_height';
    if (lowerName.includes('peakperiod')) return 'wave_period';
    if (lowerName.includes('meanspectralperiod')) return 'wave_period';
    if (lowerName.includes('wavedirection')) return 'wave_direction';
    
    // Wind measurements
    if (lowerName.includes('windspeed')) return 'wind_speed';
    if (lowerName.includes('winddirection')) return 'wind_direction';
    
    // Other measurements
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
                    <Select
                      onValueChange={(value) => setValue(`measurement_location.${locationIndex}.measurement_point.${index}.measurement_type_id`, value)}
                      value={getValues(`measurement_location.${locationIndex}.measurement_point.${index}.measurement_type_id`)}
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
                    <Select
                      onValueChange={(value) => setValue(`measurement_location.${locationIndex}.measurement_point.${index}.height_reference_id`, value)}
                      value={getValues(`measurement_location.${locationIndex}.measurement_point.${index}.height_reference_id`)}
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