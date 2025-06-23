import React, { useState, useEffect, useRef } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { PlusCircle, Trash2, ChevronDown, Plus, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { IEATask43Schema, SensorType, MeasurementType } from '../../types/schema';
import DynamicSensorOptionalFields from './DynamicSensorOptionalFields';
import { ValidationSummary } from '../ValidationSummary';
import { validateSensors } from '../../utils/validation';

// Define types for managing expanded states locally per location
interface LocationExpandedState {
  [locationKey: string]: ExpandedState; // locationKey (e.g. locationIndex) -> sensorsFieldId -> boolean
}
interface LocationNestedExpandedState {
  [locationKey: string]: NestedExpandedState; // locationKey -> sensorsFieldId -> calibrationFieldId -> boolean
}

interface ExpandedState {
  [key: string]: boolean;
}

interface NestedExpandedState {
  [key: string]: ExpandedState;
}

// Re-usable tooltip wrapper (matching style from MeasurementTable)
const TooltipWrapper = ({ children, text, className = "" }: { children: React.ReactNode; text: string; className?: string }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && text && (
        <div className="absolute z-50 px-3 py-2 text-sm leading-snug text-white bg-gray-800 rounded-md shadow-lg bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-normal break-words text-center max-w-md w-72">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 transform rotate-45 -translate-y-1" />
        </div>
      )}
    </div>
  );
};

export function SensorsStep() {
  const { control, register, setValue, watch, formState: { errors } } = useFormContext<IEATask43Schema>();
  const allLocations = watch('measurement_location') || [];

  const validation = validateSensors(watch());

  // States are now objects keyed by location index
  const [expandedSensors, setExpandedSensors] = useState<LocationExpandedState>({});
  const [expandedCalibrations, setExpandedCalibrations] = useState<LocationNestedExpandedState>({});

  // Adjust handlers to take locationIndex
  const toggleExpandSensor = (locationIndex: number, sensorsFieldId: string) => {
    setExpandedSensors(prev => ({
      ...prev,
      [locationIndex]: {
        ...(prev[locationIndex] || {}),
        [sensorsFieldId]: !prev[locationIndex]?.[sensorsFieldId],
      }
    }));
  };

  const handleCalibrationAdded = (locationIndex: number, sensorsFieldId: string, newCalibrationFieldId: string) => {
    setExpandedCalibrations(prev => ({
      ...prev,
      [locationIndex]: {
        ...(prev[locationIndex] || {}),
        [sensorsFieldId]: {
          ...((prev[locationIndex] || {})[sensorsFieldId] || {}),
          [newCalibrationFieldId]: true,
        },
      },
    }));
  };

  const handleCalibrationRemoved = (locationIndex: number, sensorsFieldId: string, calibrationFieldId: string) => {
    setExpandedCalibrations(prev => {
      const locCalibrations = { ...(prev[locationIndex] || {}) };
      const sensorCalibrations = { ...(locCalibrations[sensorsFieldId] || {}) };
      delete sensorCalibrations[calibrationFieldId];
      locCalibrations[sensorsFieldId] = sensorCalibrations;
      return {
        ...prev,
        [locationIndex]: locCalibrations,
      };
    });
  };

  const toggleExpandCalibration = (locationIndex: number, sensorsFieldId: string, calibrationFieldId: string) => {
    setExpandedCalibrations(prev => ({
      ...prev,
      [locationIndex]: {
        ...(prev[locationIndex] || {}),
        [sensorsFieldId]: {
          ...((prev[locationIndex] || {})[sensorsFieldId] || {}),
          [calibrationFieldId]: !((prev[locationIndex] || {})[sensorsFieldId] || {})[calibrationFieldId],
        },
      },
    }));
  };

  if (allLocations.length === 0) {
    return <p className="text-muted-foreground">No measurement locations defined. Please add locations in the 'Location\' step.</p>;
  }

  return (
    <div className="space-y-8">
      <ValidationSummary title="Sensors" result={validation} />
      <h2 className="text-2xl font-bold text-primary mb-2">Sensors</h2>
      <div className="text-muted-foreground mb-6">
        Provide details for each sensor which produces data included in the logger file. It may be necessary to input multiple sensors for some parameters to reflect sensor swap outs throughout the measurement campaign e.g. in response to sensor failures or planned maintenance swap outs. A sensor entry should also be made for periods where no sensor was installed but the logger reports null data; in these cases, the OEM and model should be stated but the serial number stated as N/A and a note entered to indicate why this sensor is unavailable
      </div>
      {allLocations.map((location, locationIndex) => (
        <div key={location.uuid || `location-${locationIndex}`} className="space-y-6 p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold text-foreground">
            Sensors for Location: {location.name || `Location ${locationIndex + 1}`}
          </h2>
          <LocationSensorsManager
            locationIndex={locationIndex}
            control={control}
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
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

// --- LocationSensorsManager Component ---
interface LocationSensorsManagerProps {
  locationIndex: number;
  control: any;
  register: any;
  setValue: any;
  watch: any;
  errors: any;
  expandedSensors: ExpandedState;
  expandedCalibrations: NestedExpandedState; // This will be further nested or specific to this location's sensors
  toggleExpandSensor: (sensorsFieldId: string) => void;
  onCalibrationAdded: (sensorsFieldId: string, newCalFieldId: string) => void;
  onCalibrationRemoved: (sensorsFieldId: string, calFieldId: string) => void;
  onToggleExpandCalibration: (sensorsFieldId: string, calFieldId: string) => void;
}

function LocationSensorsManager({
  locationIndex,
  control,
  register,
  setValue,
  watch,
  errors,
  expandedSensors,
  expandedCalibrations,
  toggleExpandSensor,
  onCalibrationAdded,
  onCalibrationRemoved,
  onToggleExpandCalibration,
}: LocationSensorsManagerProps) {
  const { fields: sensorsFields, append: appendSensors, insert: insertSensors, remove: removeSensorsAt } = useFieldArray({
    control,
    name: `measurement_location.${locationIndex}.sensors`
  });

  // Effect to default new sensors in this location to expanded
  useEffect(() => {
    sensorsFields.forEach(field => {
      if (typeof expandedSensors[field.id] === 'undefined') {
        toggleExpandSensor(field.id); // This will call parent's toggle which defaults to true if not set
      }
    });
  }, [sensorsFields, expandedSensors, toggleExpandSensor]);
  // Note: The above useEffect might cause a loop if toggleExpandSensor doesn't correctly handle initial undefined state.
  // Parent's toggleExpandSensor should be robust. Let's assume it is.

  const addSensorsForLocation = () => {
    appendSensors({
      oem: '',
      model: '',
      serial_number: '',
      sensor_type_id: undefined,
      classification: '',
      instrument_poi_height_mm: 0,
      is_heated: false,
      sensor_body_size_mm: 0,
      date_from: '',
      date_to: '',
      notes: '',
      calibration: [],
      logger_measurement_config: [],
    });
    // Expansion of new sensor is handled by parent's toggle called from useEffect
  };

  // Duplicate current sensor (copy OEM/model etc.) and insert right after
  const duplicateSensorsForLocation = (sensorsIndex: number) => {
    const currentSensorss = watch(`measurement_location.${locationIndex}.sensors.${sensorsIndex}`);
    if (!currentSensorss) return;

    const newSensor = {
      ...currentSensorss,
      serial_number: '', // clear serial so user enters new one
      date_from: currentSensorss?.date_to || '', // next sensor starts when this one ends
      date_to: '', // leave end date empty
      calibration: [], // start with empty calibration arrays
      logger_measurement_config: [],
    } as typeof currentSensorss;

    insertSensors(sensorsIndex + 1, newSensor);
  };

  const removeSensorsForLocation = (sensorsIndex: number) => {
    // Before removing from RHF, clean up its expansion state via parent if needed
    const sensorsFieldId = sensorsFields[sensorsIndex]?.id;
    // This cleanup might be better handled in the parent's main removeSensor upon RHF update,
    // but if direct child calls are preferred:
    // if (sensorsFieldId) {
    //   // Call a specific prop function if parent needs to clean up this specific sensor's state from this location
    // }
    removeSensorsAt(sensorsIndex);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-end">
            <Button
            type="button"
            onClick={addSensorsForLocation}
            className="bg-primary hover:bg-primary/90"
            >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Sensor to this Location
            </Button>
        </div>

      {sensorsFields.map((sensorField, sensorsIndex) => (
        <div key={sensorField.id} className="bg-background/50 border rounded-lg overflow-visible"> {/* Slightly different bg for nested items */}
          <div 
            className="bg-primary/10 p-4 cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={() => toggleExpandSensor(sensorField.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedSensors[sensorField.id] ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                <h3 className="text-lg font-medium text-foreground">Sensor {sensorsIndex + 1}</h3>
                <div className="text-sm text-muted-foreground">
                  {watch(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.model`) || 'Unnamed Sensor'}
                </div>
              </div>
              {sensorsFields.length > 0 && (
                <div className="flex items-center gap-2">
                  <TooltipWrapper text="Creates a new sensor entry below this one. All fields except Serial Number and End Date are copied. Start Date is set to the End Date of the current sensor.">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Add follow on device"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSensorsForLocation(sensorsIndex);
                      }}
                      className="border-primary/20 hover:border-primary/50"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Add follow on device
                    </Button>
                  </TooltipWrapper>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove Sensor"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSensorsForLocation(sensorsIndex);
                    }}
                    className="p-2 hover:bg-transparent"
                  >
                    <Trash2 className="w-6 h-6 text-[#FF0000] hover:text-[#CC0000]" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {expandedSensors[sensorField.id] && (
            <div className="p-6 space-y-6">
              {/* Sensor Details (paths need locationIndex) */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.oem`}>
  OEM <span className="required-asterisk">*</span>
</Label>
<Input
  {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.oem`, {
    required: "OEM is required"
  })}
  placeholder="Manufacturer"
  className={errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.oem ? 'border-red-500' : ''}
/>
{errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.oem && (
  <p className="text-red-500 text-sm">{errors.measurement_location[locationIndex].sensors[sensorsIndex].oem.message}</p>
)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.model`}>
  Model <span className="required-asterisk">*</span>
</Label>
<Input
  {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.model`, {
    required: "Model is required"
  })}
  placeholder="Model name"
  className={errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.model ? 'border-red-500' : ''}
/>
{errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.model && (
  <p className="text-red-500 text-sm">{errors.measurement_location[locationIndex].sensors[sensorsIndex].model.message}</p>
)}
                </div>
                {/* ... other sensor fields with updated paths ... */}
                 <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.serial_number`}>
  Serial Number <span className="required-asterisk">*</span>
</Label>
<Input
  {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.serial_number`, {
    required: "Serial number is required"
  })}
  placeholder="Serial number"
  className={errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.serial_number ? 'border-red-500' : ''}
/>
{errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.serial_number && (
  <p className="text-red-500 text-sm">{errors.measurement_location[locationIndex].sensors[sensorsIndex].serial_number.message}</p>
)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.sensor_type_id`}>
  Sensor Type <span className="required-asterisk">*</span>
</Label>
<Select
  onValueChange={(value) => setValue(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.sensor_type_id`, value as SensorType)}
  value={watch(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.sensor_type_id`)}
>
  <SelectTrigger className={errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.sensor_type_id ? 'border-red-500' : ''}>
    <SelectValue placeholder="Select sensor type" />
  </SelectTrigger>
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
{errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.sensor_type_id && (
  <p className="text-red-500 text-sm">{errors.measurement_location[locationIndex].sensors[sensorsIndex].sensor_type_id.message || 'Sensor type is required'}</p>
)}
                </div>
                <div className="space-y-2">
  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.date_from`}>
    Date From <span className="required-asterisk">*</span>
  </Label>
  <DatePicker
    value={watch(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.date_from`) || ''}
    onChange={(value) => setValue(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.date_from`, value)}
    placeholder="Select start date and time"
    includeTime
    required
    className={errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.date_from ? 'border-red-500' : ''}
  />
  {errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.date_from && (
    <p className="text-red-500 text-sm">{errors.measurement_location[locationIndex].sensors[sensorsIndex].date_from.message}</p>
  )}
</div>
                <div className="space-y-2">
  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.date_to`}>
    Date To <span className="required-asterisk">*</span>
  </Label>
  <DatePicker
    value={watch(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.date_to`) || ''}
    onChange={(value) => setValue(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.date_to`, value)}
    placeholder="Select end date and time"
    includeTime
    required
    className={errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.date_to ? 'border-red-500' : ''}
  />
  {errors?.measurement_location?.[locationIndex]?.sensor?.[sensorsIndex]?.date_to && (
    <p className="text-red-500 text-sm">{errors.measurement_location[locationIndex].sensors[sensorsIndex].date_to.message}</p>
  )}
</div>
                
                {/* Dynamic Optional Fields UI */}
                {typeof window !== 'undefined' && (
                  <DynamicSensorOptionalFields
                    locationIndex={locationIndex}
                    sensorIndex={sensorsIndex}
                    register={register}
                    setValue={setValue}
                    watch={watch}
                  />
                )}

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.notes`}>Notes</Label>
                  <Textarea {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.notes`)} placeholder="Additional notes" rows={3}/>
                </div>
              </div>

              <CalibrationArray
                locationIndex={locationIndex} // Pass locationIndex
                sensorsFieldId={sensorField.id} // This is RHF's field ID for this sensor
                sensorsIndex={sensorsIndex} // This is the array index for this sensor
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
  sensorsFieldId: string;
  sensorsIndex: number;
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
  sensorsFieldId,
  sensorsIndex,
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
    name: `measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration` // Dynamic path
  });

  // Effect to notify parent when a new calibration is added and should be expanded
  const prevCalFieldsLength = useRef(calibrationFields.length);
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
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.measurement_type_id`}>
                    Measurement Type
                  </Label>
                  <Select
                    onValueChange={(value) => setValue(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.measurement_type_id`, value as MeasurementType)}
                    value={watch(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.measurement_type_id`)}
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
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.slope`}>
                    Slope
                  </Label>
                  <Input
                    type="number"
                    step="any" // Allow more precision
                    {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.slope`, { valueAsNumber: true })}
                    placeholder="Enter slope value"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.offset`}>
                    Offset
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.offset`, { valueAsNumber: true })}
                    placeholder="Enter offset value"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.sensitivity`}>
                    Sensitivity
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.sensitivity`, { valueAsNumber: true })}
                    placeholder="Enter sensitivity value"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.calibration_id`}>
                    Calibration ID
                  </Label>
                  <Input
                    {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.calibration_id`)}
                    placeholder="Enter calibration ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.date_of_calibration`}>
                    Calibration Date
                  </Label>
                  <DatePicker
                    value={watch(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.date_of_calibration`) || ''}
                    onChange={(value) => setValue(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.date_of_calibration`, value)}
                    placeholder="Select calibration date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.calibration_organisation`}>
                    Calibration Organisation
                  </Label>
                  <Input
                    {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.calibration_organisation`)}
                    placeholder="Enter organisation name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.place_of_calibration`}>
                    Place of Calibration
                  </Label>
                  <Input
                    {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.place_of_calibration`)}
                    placeholder="Enter calibration location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.uncertainty_k_factor`}>
                    Uncertainty K Factor
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.uncertainty_k_factor`, { valueAsNumber: true })}
                    placeholder="Enter k factor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.revision`}>
                    Revision
                  </Label>
                  <Input
                    {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.revision`)}
                    placeholder="e.g., 2.0 or B"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.report_file_name`}>
                    Report File Name
                  </Label>
                  <Input
                    {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.report_file_name`)}
                    placeholder="e.g., calibration_report.pdf"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.report_link`}>
                    Report Link
                  </Label>
                  <Input
                    type="url"
                    {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.report_link`)}
                    placeholder="Enter URL to calibration report"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.notes`}>
                    Notes
                  </Label>
                  <Textarea
                    {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.notes`)}
                    placeholder="Add any additional notes"
                    rows={3}
                  />
                </div>
              </div>

              {/* Calibration Uncertainty Section */}
              <UncertaintyArray
                locationIndex={locationIndex} // Pass locationIndex
                sensorsIndex={sensorsIndex}
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
  sensorsIndex: number;
  calIndex: number;
  control: any;
  register: any;
}

function UncertaintyArray({
  locationIndex, // Added
  sensorsIndex,
  calIndex,
  control,
  register,
}: UncertaintyArrayProps) {
  const { fields: uncertaintyFields, append: appendUncertainty, remove: removeUncertainty } = useFieldArray({
    control,
    name: `measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.calibration_uncertainty` // Dynamic path
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
              <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_bin`}>
                Reference Bin
              </Label>
              <Input
                type="number"
                step="any"
                {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_bin`, { valueAsNumber: true })}
                placeholder="Enter reference bin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_unit`}>
                Reference Unit
              </Label>
              <Input
                {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_unit`)}
                placeholder="e.g., m/s"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.combined_uncertainty`}>
                Combined Uncertainty
              </Label>
              <Input
                type="number"
                step="any"
                {...register(`measurement_location.${locationIndex}.sensors.${sensorsIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.combined_uncertainty`, { valueAsNumber: true })}
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