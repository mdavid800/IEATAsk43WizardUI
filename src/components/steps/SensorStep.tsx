import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { IEATask43Schema, SensorType, MeasurementType } from '../../types/schema';

interface CalibrationState {
  id: string;
  isExpanded: boolean;
  uncertainties: { id: string }[];
}

export function SensorStep() {
  const { register, setValue, watch } = useFormContext<IEATask43Schema>();
  const [sensors, setSensors] = useState([{ 
    id: crypto.randomUUID(), 
    isExpanded: true,
    calibrations: [{ 
      id: crypto.randomUUID(), 
      isExpanded: true,
      uncertainties: [{ id: crypto.randomUUID() }]
    }] as CalibrationState[]
  }]);

  const addSensor = () => {
    setSensors([...sensors, { 
      id: crypto.randomUUID(), 
      isExpanded: true,
      calibrations: [{ 
        id: crypto.randomUUID(), 
        isExpanded: true,
        uncertainties: [{ id: crypto.randomUUID() }]
      }]
    }]);
  };

  const removeSensor = (id: string) => {
    setSensors(sensors.filter(sensor => sensor.id !== id));
  };

  const toggleExpand = (id: string) => {
    setSensors(sensors.map(sensor => 
      sensor.id === id ? { ...sensor, isExpanded: !sensor.isExpanded } : sensor
    ));
  };

  const addCalibration = (sensorId: string) => {
    setSensors(sensors.map(sensor => 
      sensor.id === sensorId 
        ? { 
            ...sensor, 
            calibrations: [
              ...sensor.calibrations, 
              { 
                id: crypto.randomUUID(), 
                isExpanded: true,
                uncertainties: [{ id: crypto.randomUUID() }]
              }
            ]
          }
        : sensor
    ));
  };

  const removeCalibration = (sensorId: string, calibrationId: string) => {
    setSensors(sensors.map(sensor => 
      sensor.id === sensorId 
        ? {
            ...sensor,
            calibrations: sensor.calibrations.filter(cal => cal.id !== calibrationId)
          }
        : sensor
    ));
  };

  const toggleCalibrationExpand = (sensorId: string, calibrationId: string) => {
    setSensors(sensors.map(sensor => 
      sensor.id === sensorId 
        ? {
            ...sensor,
            calibrations: sensor.calibrations.map(cal => 
              cal.id === calibrationId ? { ...cal, isExpanded: !cal.isExpanded } : cal
            )
          }
        : sensor
    ));
  };

  const addUncertainty = (sensorId: string, calibrationId: string) => {
    setSensors(sensors.map(sensor => 
      sensor.id === sensorId 
        ? {
            ...sensor,
            calibrations: sensor.calibrations.map(cal => 
              cal.id === calibrationId 
                ? { ...cal, uncertainties: [...cal.uncertainties, { id: crypto.randomUUID() }] }
                : cal
            )
          }
        : sensor
    ));
  };

  const removeUncertainty = (sensorId: string, calibrationId: string, uncertaintyId: string) => {
    setSensors(sensors.map(sensor => 
      sensor.id === sensorId 
        ? {
            ...sensor,
            calibrations: sensor.calibrations.map(cal => 
              cal.id === calibrationId 
                ? { ...cal, uncertainties: cal.uncertainties.filter(u => u.id !== uncertaintyId) }
                : cal
            )
          }
        : sensor
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Sensors</h2>
        <Button
          type="button"
          onClick={addSensor}
          className="bg-primary hover:bg-primary/90"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Sensor
        </Button>
      </div>

      {sensors.map((sensor, sensorIndex) => (
        <div key={sensor.id} className="bg-card border rounded-lg overflow-hidden">
          <div 
            className="bg-primary/5 p-4 cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => toggleExpand(sensor.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown className={`w-5 h-5 transition-transform ${sensor.isExpanded ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                <h3 className="text-lg font-medium text-foreground">Sensor {sensorIndex + 1}</h3>
                <div className="text-sm text-muted-foreground">
                  {watch(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.model`) || 'Unnamed Sensor'}
                </div>
              </div>
              {sensors.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSensor(sensor.id);
                  }}
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {sensor.isExpanded && (
            <div className="p-6 space-y-6">
              {/* Sensor Details */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.oem`}>
                    Manufacturer (OEM)
                  </Label>
                  <Input
                    {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.oem`)}
                    placeholder="Enter manufacturer name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.model`}>
                    Model
                  </Label>
                  <Input
                    {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.model`)}
                    placeholder="Enter model name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.serial_number`}>
                    Serial Number
                  </Label>
                  <Input
                    {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.serial_number`)}
                    placeholder="Enter serial number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.sensor_type_id`}>
                    Sensor Type
                  </Label>
                  <Select
                    onValueChange={(value) => setValue(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.sensor_type_id`, value as SensorType)}
                    value={watch(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.sensor_type_id`)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sensor type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anemometer">Anemometer</SelectItem>
                      <SelectItem value="wind_vane">Wind Vane</SelectItem>
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
                  <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.classification`}>
                    Classification
                  </Label>
                  <Input
                    {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.classification`)}
                    placeholder="e.g., 1.2A"
                    pattern="^([0-9]{1,2})[.]([0-9]{1,2})[ABCDS]$"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.instrument_poi_height_mm`}>
                    Point of Interest Height (mm)
                  </Label>
                  <Input
                    type="number"
                    {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.instrument_poi_height_mm`)}
                    placeholder="Enter height in mm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.is_heated`}>
                    Heated Sensor
                  </Label>
                  <Select
                    onValueChange={(value) => setValue(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.is_heated`, value === 'true')}
                    value={watch(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.is_heated`)?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select if sensor is heated" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.sensor_body_size_mm`}>
                    Body Size (mm)
                  </Label>
                  <Input
                    type="number"
                    {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.sensor_body_size_mm`)}
                    placeholder="Enter body size in mm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.date_from`}>
                    Date From
                  </Label>
                  <Input
                    type="datetime-local"
                    {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.date_from`)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.date_to`}>
                    Date To
                  </Label>
                  <Input
                    type="datetime-local"
                    {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.date_to`)}
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.notes`}>
                    Notes
                  </Label>
                  <Textarea
                    {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.notes`)}
                    placeholder="Add any additional notes"
                    rows={3}
                  />
                </div>
              </div>

              {/* Calibration Section */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">Calibration</h4>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addCalibration(sensor.id)}
                    className="border-primary/20 hover:border-primary/50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Calibration
                  </Button>
                </div>

                <div className="space-y-4">
                  {sensor.calibrations.map((calibration, calIndex) => (
                    <div key={calibration.id} className="border rounded-lg overflow-hidden">
                      <div 
                        className="bg-primary/5 p-4 cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => toggleCalibrationExpand(sensor.id, calibration.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ChevronDown className={`w-5 h-5 transition-transform ${calibration.isExpanded ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                            <h5 className="text-base font-medium">Calibration {calIndex + 1}</h5>
                          </div>
                          {sensor.calibrations.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCalibration(sensor.id, calibration.id);
                              }}
                              className="text-destructive hover:text-destructive/90"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {calibration.isExpanded && (
                        <div className="p-6 space-y-6 bg-background">
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.measurement_type_id`}>
                                Measurement Type
                              </Label>
                              <Select
                                onValueChange={(value) => setValue(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.measurement_type_id`, value as MeasurementType)}
                                value={watch(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.measurement_type_id`)}
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
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.slope`}>
                                Slope
                              </Label>
                              <Input
                                type="number"
                                step="0.000001"
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.slope`)}
                                placeholder="Enter slope value"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.offset`}>
                                Offset
                              </Label>
                              <Input
                                type="number"
                                step="0.000001"
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.offset`)}
                                placeholder="Enter offset value"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.sensitivity`}>
                                Sensitivity
                              </Label>
                              <Input
                                type="number"
                                step="0.000001"
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.sensitivity`)}
                                placeholder="Enter sensitivity value"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.calibration_id`}>
                                Calibration ID
                              </Label>
                              <Input
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.calibration_id`)}
                                placeholder="Enter calibration ID"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.date_of_calibration`}>
                                Calibration Date
                              </Label>
                              <Input
                                type="date"
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.date_of_calibration`)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.calibration_organisation`}>
                                Calibration Organisation
                              </Label>
                              <Input
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.calibration_organisation`)}
                                placeholder="Enter organisation name"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.place_of_calibration`}>
                                Place of Calibration
                              </Label>
                              <Input
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.place_of_calibration`)}
                                placeholder="Enter calibration location"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.uncertainty_k_factor`}>
                                Uncertainty K Factor
                              </Label>
                              <Input
                                type="number"
                                step="0.1"
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.uncertainty_k_factor`)}
                                placeholder="Enter k factor"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.revision`}>
                                Revision
                              </Label>
                              <Input
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.revision`)}
                                placeholder="e.g., 2.0 or B"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.report_file_name`}>
                                Report File Name
                              </Label>
                              <Input
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.report_file_name`)}
                                placeholder="e.g., calibration_report.pdf"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.report_link`}>
                                Report Link
                              </Label>
                              <Input
                                type="url"
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.report_link`)}
                                placeholder="Enter URL to calibration report"
                              />
                            </div>

                            <div className="sm:col-span-2 space-y-2">
                              <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.notes`}>
                                Notes
                              </Label>
                              <Textarea
                                {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.notes`)}
                                placeholder="Add any additional notes"
                                rows={3}
                              />
                            </div>
                          </div>

                          {/* Calibration Uncertainty Section */}
                          <div className="mt-6 pt-6 border-t border-border">
                            <div className="flex justify-between items-center mb-4">
                              <h6 className="text-base font-medium">Calibration Uncertainty</h6>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addUncertainty(sensor.id, calibration.id)}
                                size="sm"
                                className="border-primary/20 hover:border-primary/50"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Uncertainty
                              </Button>
                            </div>

                            <div className="space-y-4">
                              {calibration.uncertainties.map((uncertainty, uncIndex) => (
                                <div key={uncertainty.id} className="grid grid-cols-1 gap-4 sm:grid-cols-3 p-4 bg-muted/50 rounded-lg relative">
                                  {calibration.uncertainties.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeUncertainty(sensor.id, calibration.id, uncertainty.id)}
                                      className="absolute right-2 top-2 text-destructive hover:text-destructive/90"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_bin`}>
                                      Reference Bin
                                    </Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_bin`)}
                                      placeholder="Enter reference bin"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_unit`}>
                                      Reference Unit
                                    </Label>
                                    <Input
                                      {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.reference_unit`)}
                                      placeholder="e.g., m/s"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.combined_uncertainty`}>
                                      Combined Uncertainty
                                    </Label>
                                    <Input
                                      type="number"
                                      step="0.000001"
                                      {...register(`measurement_location.0.measurement_point.0.sensor.${sensorIndex}.calibration.${calIndex}.calibration_uncertainty.${uncIndex}.combined_uncertainty`)}
                                      placeholder="Enter combined uncertainty"
                                    />
                                  </div>
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
}