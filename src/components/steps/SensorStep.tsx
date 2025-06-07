import { useFormContext, useFieldArray } from 'react-hook-form';
import { PlusCircle, Trash2, ChevronDown, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { IEATask43Schema, SensorType, MeasurementType } from '../../types/schema';

// Define types for managing expanded states locally per location
interface LocationExpandedState {
  [locationKey: string]: ExpandedState; // locationKey (e.g. locationIndex) -> sensorFieldId -> boolean
}
interface LocationNestedExpandedState {
  [locationKey: string]: NestedExpandedState; // locationKey -> sensorFieldId -> calibrationFieldId -> boolean
}

interface ExpandedState {
  [key: string]: boolean;
}

interface NestedExpandedState {
  [key: string]: ExpandedState;
}

export function SensorStep() {
  const { control, register, setValue, watch } = useFormContext<IEATask43Schema>();
  const allLocations = watch('measurement_location') || [];

  // States are now objects keyed by location index
  const [expandedSensors, setExpandedSensors] = useState<LocationExpandedState>({});
  const [expandedCalibrations, setExpandedCalibrations] = useState<LocationNestedExpandedState>({});

  // Adjust handlers to take locationIndex
  const toggleExpandSensor = (locationIndex: number, sensorFieldId: string) => {
    setExpandedSensors(prev => ({
      ...prev,
      [locationIndex]: {
        ...(prev[locationIndex] || {}),
        [sensorFieldId]: !prev[locationIndex]?.[sensorFieldId],
      }
    }));
  };

  const handleCalibrationAdded = (locationIndex: number, sensorFieldId: string, newCalibrationFieldId: string) => {
    setExpandedCalibrations(prev => ({
      ...prev,
      [locationIndex]: {
        ...(prev[locationIndex] || {}),
        [sensorFieldId]: {
          ...((prev[locationIndex] || {})[sensorFieldId] || {}),
          [newCalibrationFieldId]: true,
        },
      },
    }));
  };

  const handleCalibrationRemoved = (locationIndex: number, sensorFieldId: string, calibrationFieldId: string) => {
    setExpandedCalibrations(prev => {
      const locCalibrations = { ...(prev[locationIndex] || {}) };
      const sensorCalibrations = { ...(locCalibrations[sensorFieldId] || {}) };
      delete sensorCalibrations[calibrationFieldId];
      locCalibrations[sensorFieldId] = sensorCalibrations;
      return {
        ...prev,
        [locationIndex]: locCalibrations,
      };
    });
  };

  const toggleExpandCalibration = (locationIndex: number, sensorFieldId: string, calibrationFieldId: string) => {
    setExpandedCalibrations(prev => ({
      ...prev,
      [locationIndex]: {
        ...(prev[locationIndex] || {}),
        [sensorFieldId]: {
          ...((prev[locationIndex] || {})[sensorFieldId] || {}),
          [calibrationFieldId]: !((prev[locationIndex] || {})[sensorFieldId] || {})[calibrationFieldId],
        },
      },
    }));
  };

  if (allLocations.length === 0) {
    return <p className="text-muted-foreground">No measurement locations defined. Please add locations in the 'Location\' step.</p>;
  }

  return (
    <div className="space-y-8">
      {allLocations.map((location, locationIndex) => (
        <div key={location.id || `location-${locationIndex}`} className="space-y-6 p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold text-foreground">
            Sensors for Location: {location.name_of_location || `Location ${locationIndex + 1}`}
          </h2>
          <LocationSensorManager
            locationIndex={locationIndex}
            control={control}
            register={register}
            setValue={setValue}
            watch={watch}
            expandedSensors={expandedSensors[locationIndex] || {}}
            expandedCalibrations={expandedCalibrations[locationIndex] || {}}
            toggleExpandSensor={(sensorId) => toggleExpandSensor(locationIndex, sensorId)}
            onCalibrationAdded={(sensorId, calId) => handleCalibrationAdded(locationIndex, sensorId, calId)}
            onCalibrationRemoved={(sensorId, calId) => handleCalibrationRemoved(locationIndex, sensorId, calId)}
            onToggleExpandCalibration={(sensorId, calId) => toggleExpandCalibration(locationIndex, sensorId, calId)}
          />
        </div>
      ))}
    </div>
  );
}

// --- LocationSensorManager Component ---
interface LocationSensorManagerProps {
  locationIndex: number;
  control: any;
  register: any;
  setValue: any;
  watch: any;
  expandedSensors: ExpandedState;
  expandedCalibrations: NestedExpandedState; // This will be further nested or specific to this location's sensors
  toggleExpandSensor: (sensorFieldId: string) => void;
  onCalibrationAdded: (sensorFieldId: string, newCalFieldId: string) => void;
  onCalibrationRemoved: (sensorFieldId: string, calFieldId: string) => void;
  onToggleExpandCalibration: (sensorFieldId: string, calFieldId: string) => void;
}

function LocationSensorManager({
  locationIndex,
  control,
  register,
  setValue,
  watch,
  expandedSensors,
  expandedCalibrations,
  toggleExpandSensor,
  onCalibrationAdded,
  onCalibrationRemoved,
  onToggleExpandCalibration,
}: LocationSensorManagerProps) {
  const { fields: sensorFields, append: appendSensor, remove: removeSensorAt } = useFieldArray({
    control,
    name: `measurement_location.${locationIndex}.sensor`
  });

  // Effect to default new sensors in this location to expanded
  useEffect(() => {
    sensorFields.forEach(field => {
      if (typeof expandedSensors[field.id] === 'undefined') {
        toggleExpandSensor(field.id); // This will call parent's toggle which defaults to true if not set
      }
    });
  }, [sensorFields, expandedSensors, toggleExpandSensor]);
  // Note: The above useEffect might cause a loop if toggleExpandSensor doesn't correctly handle initial undefined state.
  // Parent's toggleExpandSensor should be robust. Let's assume it is.

  const addSensorForLocation = () => {
    appendSensor({
      oem: '', model: '', serial_number: '', sensor_type_id: undefined, classification: '',
      instrument_poi_height_mm: 0, is_heated: false, sensor_body_size_mm: 0,
      date_from: '', date_to: '', notes: '', calibration: [], logger_measurement_config: []
    });
    // Expansion of new sensor is handled by parent's toggle called from useEffect
  };

  const removeSensorForLocation = (sensorIndex: number) => {
    // Before removing from RHF, clean up its expansion state via parent if needed
    const sensorFieldId = sensorFields[sensorIndex]?.id;
    // This cleanup might be better handled in the parent's main removeSensor upon RHF update,
    // but if direct child calls are preferred:
    // if (sensorFieldId) {
    //   // Call a specific prop function if parent needs to clean up this specific sensor's state from this location
    // }
    removeSensorAt(sensorIndex);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-end">
            <Button
            type="button"
            onClick={addSensorForLocation}
            className="bg-primary hover:bg-primary/90"
            >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Sensor to this Location
            </Button>
        </div>

      {sensorFields.map((sensorField, sensorIndex) => (
        <div key={sensorField.id} className="bg-background/50 border rounded-lg overflow-hidden"> {/* Slightly different bg for nested items */}
          <div 
            className="bg-primary/10 p-4 cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={() => toggleExpandSensor(sensorField.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedSensors[sensorField.id] ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                <h3 className="text-lg font-medium text-foreground">Sensor {sensorIndex + 1}</h3>
                <div className="text-sm text-muted-foreground">
                  {watch(`measurement_location.${locationIndex}.sensor.${sensorIndex}.model`) || 'Unnamed Sensor'}
                </div>
              </div>
              {sensorFields.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove Sensor"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSensorForLocation(sensorIndex);
                  }}
                  className="p-2 hover:bg-transparent"
                >
                  <Trash2 className="w-6 h-6 text-[#FF0000] hover:text-[#CC0000]" />
                </Button>
              )}
            </div>
          </div>

          {expandedSensors[sensorField.id] && (
            <div className="p-6 space-y-6">
              {/* Sensor Details (paths need locationIndex) */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.oem`}>OEM</Label>
                  <Input {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.oem`)} placeholder="Manufacturer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.model`}>Model</Label>
                  <Input {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.model`)} placeholder="Model name" />
                </div>
                {/* ... other sensor fields with updated paths ... */}
                 <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.serial_number`}>Serial Number</Label>
                  <Input {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.serial_number`)} placeholder="Serial number"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.sensor_type_id`}>Sensor Type</Label>
                  <Select
                    onValueChange={(value) => setValue(`measurement_location.${locationIndex}.sensor.${sensorIndex}.sensor_type_id`, value as SensorType)}
                    value={watch(`measurement_location.${locationIndex}.sensor.${sensorIndex}.sensor_type_id`)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select sensor type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anemometer">Anemometer</SelectItem>
                      <SelectItem value="wind_vane">Wind Vane</SelectItem>
                      {/* ... other sensor types ... */}
                       <SelectItem value="barometer">Barometer</SelectItem>
                      <SelectItem value="hygrometer">Hygrometer</SelectItem>
                      <SelectItem value="pyranometer">Pyranometer</SelectItem>
                      <SelectItem value="2d_ultrasonic">2D Ultrasonic</SelectItem>
                      <SelectItem value="3d_ultrasonic">3D Ultrasonic</SelectItem>
                      <SelectItem value="rain_gauge">Rain Gauge</SelectItem>
                      <SelectItem value="gps">GPS</SelectItem>
                      <SelectItem value="compass">Compass</SelectItem>
                      <SelectItem value="adcp">ADCP</SelectItem>
                      <SelectItem value="altimeter">Altimeter</SelectItem>
                      <SelectItem value="ctd">CTD</SelectItem>
                      <SelectItem value="lidar">Lidar</SelectItem>
                      <SelectItem value="sodar">Sodar</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.classification`}>Classification</Label>
                  <Input {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.classification`)} placeholder="e.g., 1.2A" pattern="^([0-9]{1,2})[.]([0-9]{1,2})[ABCDS]$"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.instrument_poi_height_mm`}>POI Height (mm)</Label>
                  <Input type="number" {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.instrument_poi_height_mm`, { valueAsNumber: true })} placeholder="Height in mm"/>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.is_heated`}>Heated</Label>
                  <Select
                    onValueChange={(value) => setValue(`measurement_location.${locationIndex}.sensor.${sensorIndex}.is_heated`, value === 'true')}
                    value={watch(`measurement_location.${locationIndex}.sensor.${sensorIndex}.is_heated`)?.toString()}
                  >
                    <SelectTrigger><SelectValue placeholder="Is sensor heated?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.sensor_body_size_mm`}>Body Size (mm)</Label>
                  <Input type="number" {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.sensor_body_size_mm`, { valueAsNumber: true })} placeholder="Body size in mm"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.date_from`}>Date From</Label>
                  <Input type="datetime-local" {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.date_from`)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.date_to`}>Date To</Label>
                  <Input type="datetime-local" {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.date_to`)} />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.notes`}>Notes</Label>
                  <Textarea {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.notes`)} placeholder="Additional notes" rows={3}/>
                </div>
              </div>

              <CalibrationArray
                locationIndex={locationIndex} // Pass locationIndex
                sensorFieldId={sensorField.id} // This is RHF's field ID for this sensor
                sensorIndex={sensorIndex} // This is the array index for this sensor
                control={control}
                register={register}
                setValue={setValue}
                watch={watch}
                expandedCalibrations={expandedCalibrations[sensorField.id] || {}} // Pass only this sensor's calibration states
                toggleExpandCalibration={(calFieldId) => onToggleExpandCalibration(sensorField.id, calFieldId)}
                onCalibrationAdded={(newCalId) => onCalibrationAdded(sensorField.id, newCalId)}
                onCalibrationRemoved={(calId) => onCalibrationRemoved(sensorField.id, calId)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


// --- CalibrationArray Component ---
interface CalibrationArrayProps {
  locationIndex: number; // Added
  sensorFieldId: string;
  sensorIndex: number;
  control: any;
  register: any;
  setValue: any;
  watch: any;
  expandedCalibrations: ExpandedState;
  toggleExpandCalibration: (calibrationFieldId: string) => void;
  onCalibrationAdded: (newCalibrationFieldId: string) => void;
  onCalibrationRemoved: (calibrationFieldId: string) => void;
}

function CalibrationArray({
  locationIndex, // Added
  sensorFieldId,
  sensorIndex,
  control,
  register,
  setValue,
  watch,
  expandedCalibrations,
  toggleExpandCalibration,
  onCalibrationAdded,
  onCalibrationRemoved,
}: CalibrationArrayProps) {
  const { fields: calibrationFields, append: appendCalibrationRHF, remove: removeCalibrationRHF } = useFieldArray({
    control,
    name: `measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration` // Dynamic path
  });

  // Effect to notify parent when a new calibration is added and should be expanded
  const prevCalFieldsLength = React.useRef(calibrationFields.length);
  useEffect(() => {
    if (calibrationFields.length > prevCalFieldsLength.current) {
      const newField = calibrationFields[calibrationFields.length - 1];
      // Check if it's not already in the expanded state (important to prevent loops)
      if (newField && typeof expandedCalibrations[newField.id] === 'undefined') {
        onCalibrationAdded(newField.id);
      }
    }
    prevCalFieldsLength.current = calibrationFields.length;
  }, [calibrationFields, expandedCalibrations, onCalibrationAdded]);


  const addCalibration = () => {
    appendCalibrationRHF({
      measurement_type_id: undefined, slope: 1, offset: 0, sensitivity: 0, calibration_id: '',
      date_of_calibration: '', calibration_organisation: '', place_of_calibration: '',
      uncertainty_k_factor: 0, revision: '', report_file_name: '', report_link: '',
      notes: '', calibration_uncertainty: []
    });
    // The useEffect above will detect the new item and call onCalibrationAdded.
  };

  const handleRemoveCalibration = (index: number) => {
    const calFieldId = calibrationFields[index]?.id;
    removeCalibrationRHF(index);
    if (calFieldId) { // Ensure ID was found before calling callback
      onCalibrationRemoved(calFieldId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium">Calibration</h4>
        <Button
          type="button"
          variant="outline"
          onClick={addCalibration}
          className="border-primary/20 hover:border-primary/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Calibration
        </Button>
      </div>
      {calibrationFields.map((calField, calIndex) => (
        <div key={calField.id} className="border rounded-lg overflow-hidden">
          <div
            className="bg-primary/5 p-4 cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => toggleExpandCalibration(calField.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedCalibrations[calField.id] ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                <h5 className="text-base font-medium">Calibration {calIndex + 1}</h5>
              </div>
              {calibrationFields.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove Calibration"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCalibration(calIndex);
                  }}
                  className="p-2 hover:bg-transparent"
                >
                  <Trash2 className="w-6 h-6 text-[#FF0000] hover:text-[#CC0000]" />
                </Button>
              )}
            </div>
          </div>

          {expandedCalibrations[calField.id] && (
            <div className="p-6 space-y-6 bg-background">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.measurement_type_id`}>
                    Measurement Type
                  </Label>
                  <Select
                    onValueChange={(value) => setValue(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.measurement_type_id`, value as MeasurementType)}
                    value={watch(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.measurement_type_id`)}
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
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.slope`}>
                    Slope
                  </Label>
                  <Input
                    type="number"
                    step="any" // Allow more precision
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.slope`, { valueAsNumber: true })}
                    placeholder="Enter slope value"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.offset`}>
                    Offset
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.offset`, { valueAsNumber: true })}
                    placeholder="Enter offset value"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.sensitivity`}>
                    Sensitivity
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.sensitivity`, { valueAsNumber: true })}
                    placeholder="Enter sensitivity value"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.calibration_id`}>
                    Calibration ID
                  </Label>
                  <Input
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.calibration_id`)}
                    placeholder="Enter calibration ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.date_of_calibration`}>
                    Calibration Date
                  </Label>
                  <Input
                    type="date"
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.date_of_calibration`)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.calibration_organisation`}>
                    Calibration Organisation
                  </Label>
                  <Input
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.calibration_organisation`)}
                    placeholder="Enter organisation name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.place_of_calibration`}>
                    Place of Calibration
                  </Label>
                  <Input
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.place_of_calibration`)}
                    placeholder="Enter calibration location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.uncertainty_k_factor`}>
                    Uncertainty K Factor
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.uncertainty_k_factor`, { valueAsNumber: true })}
                    placeholder="Enter k factor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.revision`}>
                    Revision
                  </Label>
                  <Input
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.revision`)}
                    placeholder="e.g., 2.0 or B"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.report_file_name`}>
                    Report File Name
                  </Label>
                  <Input
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.report_file_name`)}
                    placeholder="e.g., calibration_report.pdf"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.report_link`}>
                    Report Link
                  </Label>
                  <Input
                    type="url"
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.report_link`)}
                    placeholder="Enter URL to calibration report"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.notes`}>
                    Notes
                  </Label>
                  <Textarea
                    {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.notes`)}
                    placeholder="Add any additional notes"
                    rows={3}
                  />
                </div>
              </div>

              {/* Calibration Uncertainty Section */}
              <UncertaintyArray
                locationIndex={locationIndex} // Pass locationIndex
                sensorIndex={sensorIndex}
                calIndex={calIndex}
                control={control}
                register={register}
                // setValue and watch might not be needed if uncertainties are simple
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- UncertaintyArray Component ---
interface UncertaintyArrayProps {
  locationIndex: number; // Added
  sensorIndex: number;
  calIndex: number;
  control: any;
  register: any;
}

function UncertaintyArray({
  locationIndex, // Added
  sensorIndex,
  calIndex,
  control,
  register,
}: UncertaintyArrayProps) {
  const { fields: uncertaintyFields, append: appendUncertainty, remove: removeUncertainty } = useFieldArray({
    control,
    name: `measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty` // Dynamic path
  });

  const addUncertaintyItem = () => {
    appendUncertainty({
      reference_bin: 0,
      reference_unit: '',
      combined_uncertainty: 0,
    });
  };

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <div className="flex justify-between items-center mb-4">
        <h6 className="text-base font-medium">Calibration Uncertainty</h6>
        <Button
          type="button"
          variant="outline"
          onClick={addUncertaintyItem}
          size="sm"
          className="border-primary/20 hover:border-primary/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Uncertainty
        </Button>
      </div>
      <div className="space-y-4">
        {uncertaintyFields.map((uncField, uncIndex) => (
          <div key={uncField.id} className="grid grid-cols-1 gap-4 sm:grid-cols-3 p-4 bg-muted/50 rounded-lg relative">
            {uncertaintyFields.length > 0 && ( // Show remove if there's at least one item
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove Uncertainty"
                onClick={() => removeUncertainty(uncIndex)}
                className="absolute right-2 top-2 p-1 hover:bg-transparent" // Adjusted padding
              >
                <Trash2 className="w-4 h-4 text-[#FF0000] hover:text-[#CC0000]" />
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_bin`}>
                Reference Bin
              </Label>
              <Input
                type="number"
                step="any"
                {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_bin`, { valueAsNumber: true })}
                placeholder="Enter reference bin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_unit`}>
                Reference Unit
              </Label>
              <Input
                {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_unit`)}
                placeholder="e.g., m/s"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.combined_uncertainty`}>
                Combined Uncertainty
              </Label>
              <Input
                type="number"
                step="any"
                {...register(`measurement_location.${locationIndex}.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.combined_uncertainty`, { valueAsNumber: true })}
                placeholder="Enter combined uncertainty"
              />
            </div>
          </div>
        ))}
        {uncertaintyFields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No uncertainty data provided.</p>
        )}
      </div>
    </div>
  );
}