import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ChevronDown, PlusCircle, Trash2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DateTimePicker } from '../ui/date-time-picker';
import { Textarea } from '../ui/textarea';
import { Map } from '../ui/map';
import { Button } from '../ui/button';
import type { IEATask43Schema } from '../../types/schema';

export function LocationStep() {
  const { register, setValue, watch } = useFormContext<IEATask43Schema>();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedProfilerProps, setExpandedProfilerProps] = useState<Record<string, boolean>>({});

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleProfilerPropExpand = (index: number) => {
    setExpandedProfilerProps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const addVerticalProfilerProperty = () => {
    const currentProps = watch('measurement_location.0.vertical_profiler_properties') || [];
    setValue('measurement_location.0.vertical_profiler_properties', [
      ...currentProps,
      {
        device_datum_plane_height_m: 0,
        height_reference_id: 'ground_level',
        device_orientation_deg: 0,
        orientation_reference_id: 'true_north',
        device_vertical_orientation: 'upward',
        date_from: new Date().toISOString(),
        date_to: null,
        notes: '',
        update_at: new Date().toISOString()
      }
    ]);
  };

  const removeVerticalProfilerProperty = (index: number) => {
    const currentProps = watch('measurement_location.0.vertical_profiler_properties') || [];
    const newProps = currentProps.filter((_, i) => i !== index);
    setValue('measurement_location.0.vertical_profiler_properties', newProps);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary mb-2">Measurement Location</h2>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div
          className="bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={toggleExpand}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'transform rotate-0' : 'transform -rotate-90'}`} />
              <h3 className="text-lg font-medium text-foreground">Location</h3>
              <div className="text-sm text-muted-foreground">
                {watch('measurement_location.0.name') || 'Unnamed Location'}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-border">
            <div className="p-6 bg-background space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="measurement_location.0.name">
                    Name <span className="required-asterisk">*</span>
                  </Label>
                  <Input
                    {...register('measurement_location.0.name')}
                    placeholder="Enter Device Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="measurement_location.0.measurement_station_type_id">
                    Station Type <span className="required-asterisk">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('measurement_location.0.measurement_station_type_id', value as any)}
                    value={watch('measurement_location.0.measurement_station_type_id')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select station type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mast">Met Mast</SelectItem>
                      <SelectItem value="lidar">Lidar</SelectItem>
                      <SelectItem value="sodar">Sodar</SelectItem>
                      <SelectItem value="floating_lidar">Floating Lidar</SelectItem>
                      <SelectItem value="wave_buoy">Wave Buoy</SelectItem>
                      <SelectItem value="adcp">ADCP</SelectItem>
                      <SelectItem value="solar">Solar</SelectItem>
                      <SelectItem value="virtual_met_mast">Virtual Met Mast</SelectItem>
                      <SelectItem value="reanalysis">Reanalysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="measurement_location.0.latitude_ddeg">
                    Latitude (degrees) <span className="required-asterisk">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.000001"
                    min="-90"
                    max="90"
                    {...register('measurement_location.0.latitude_ddeg', { valueAsNumber: true })}
                    placeholder="Enter latitude"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="measurement_location.0.longitude_ddeg">
                    Longitude (degrees) <span className="required-asterisk">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.000001"
                    min="-180"
                    max="180"
                    {...register('measurement_location.0.longitude_ddeg', { valueAsNumber: true })}
                    placeholder="Enter longitude"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Map
                    latitude={watch('measurement_location.0.latitude_ddeg') || 0}
                    longitude={watch('measurement_location.0.longitude_ddeg') || 0}
                    className="border border-border shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="measurement_location.0.notes">
                    Notes
                  </Label>
                  <Textarea
                    {...register('measurement_location.0.notes')}
                    placeholder="Add any additional notes"
                    rows={3}
                  />
                </div>
              </div>

              {/* Mast Properties Section */}
              {watch('measurement_location.0.measurement_station_type_id') === 'mast' && (
                <div className="mt-8 pt-6 border-t border-border">
                  <h4 className="text-lg font-medium mb-4">Mast Properties</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="measurement_location.0.mast_properties.mast_geometry_id">
                        Mast Geometry
                      </Label>
                      <Select
                        onValueChange={(value) => setValue('measurement_location.0.mast_properties.mast_geometry_id', value as any)}
                        value={watch('measurement_location.0.mast_properties.mast_geometry_id') as string}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select mast geometry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lattice_triangle">Lattice Triangle</SelectItem>
                          <SelectItem value="lattice_square_round_edges">Lattice Square (Round Edges)</SelectItem>
                          <SelectItem value="lattice_square_sharp_edges">Lattice Square (Sharp Edges)</SelectItem>
                          <SelectItem value="pole">Pole</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="measurement_location.0.mast_properties.mast_height_m">
                        Mast Height (m)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        {...register('measurement_location.0.mast_properties.mast_height_m', { valueAsNumber: true })}
                        placeholder="Enter mast height"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="measurement_location.0.mast_properties.mast_oem">
                        Mast Manufacturer
                      </Label>
                      <Input
                        {...register('measurement_location.0.mast_properties.mast_oem')}
                        placeholder="Enter manufacturer name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="measurement_location.0.mast_properties.mast_model">
                        Mast Model
                      </Label>
                      <Input
                        {...register('measurement_location.0.mast_properties.mast_model')}
                        placeholder="Enter model name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="measurement_location.0.mast_properties.mast_serial_number">
                        Serial Number
                      </Label>
                      <Input
                        {...register('measurement_location.0.mast_properties.mast_serial_number')}
                        placeholder="Enter serial number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="measurement_location.0.mast_properties.date_from">
                        Date From
                      </Label>
                      <DateTimePicker
                        value={watch('measurement_location.0.mast_properties.date_from') || ''}
                        onChange={(value) => setValue('measurement_location.0.mast_properties.date_from', value)}
                        placeholder="Select start date and time"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="measurement_location.0.mast_properties.date_to">
                        Date To
                      </Label>
                      <DateTimePicker
                        value={watch('measurement_location.0.mast_properties.date_to') || ''}
                        onChange={(value) => setValue('measurement_location.0.mast_properties.date_to', value)}
                        placeholder="Select end date and time"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="measurement_location.0.mast_properties.notes">
                        Notes
                      </Label>
                      <Textarea
                        {...register('measurement_location.0.mast_properties.notes')}
                        placeholder="Add any additional notes"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Vertical Profiler Properties Section */}
              {['lidar', 'sodar', 'floating_lidar'].includes(watch('measurement_location.0.measurement_station_type_id')) && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium">Vertical Profiler Properties</h4>
                    <Button
                      type="button"
                      variant="secondary"
                      className="bg-primary hover:bg-primary/90 shadow hover:shadow-lg focus:ring-2 focus:ring-primary/50"
                      onClick={addVerticalProfilerProperty}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Vertical Profiler Property
                    </Button>
                  </div>

                  {(watch('measurement_location.0.vertical_profiler_properties') || []).map((_, index) => (
                    <div key={index} className="border border-border rounded-lg overflow-hidden mb-4">
                      <div
                        className="bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleProfilerPropExpand(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ChevronDown className={`w-5 h-5 transition-transform ${expandedProfilerProps[index] ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                            <h5 className="text-base font-medium">Vertical Profiler Property {index + 1}</h5>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVerticalProfilerProperty(index);
                            }}
                            className="p-2 hover:bg-transparent"
                          >
                            <Trash2 className="w-6 h-6 text-[#FF0000] hover:text-[#CC0000]" />
                          </Button>
                        </div>
                      </div>

                      {expandedProfilerProps[index] && (
                        <div className="border-t border-border p-6 bg-background">
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.vertical_profiler_properties.${index}.device_datum_plane_height_m`}>
                                Device Datum Plane Height (m)
                              </Label>
                              <Input
                                type="number"
                                step="0.1"
                                {...register(`measurement_location.0.vertical_profiler_properties.${index}.device_datum_plane_height_m`, { valueAsNumber: true })}
                                placeholder="Enter height"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.vertical_profiler_properties.${index}.height_reference_id`}>
                                Height Reference
                              </Label>
                              <Select
                                onValueChange={(value) => setValue(`measurement_location.0.vertical_profiler_properties.${index}.height_reference_id`, value as any)}
                                value={watch(`measurement_location.0.vertical_profiler_properties.${index}.height_reference_id`)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select height reference" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ground_level">Ground Level</SelectItem>
                                  <SelectItem value="mean_sea_level">Mean Sea Level</SelectItem>
                                  <SelectItem value="sea_level">Sea Level</SelectItem>
                                  <SelectItem value="lowest_astronomical_tide">Lowest Astronomical Tide</SelectItem>
                                  <SelectItem value="sea_floor">Sea Floor</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.vertical_profiler_properties.${index}.device_orientation_deg`}>
                                Device Orientation (deg)
                              </Label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="360"
                                {...register(`measurement_location.0.vertical_profiler_properties.${index}.device_orientation_deg`, { valueAsNumber: true })}
                                placeholder="Enter orientation"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.vertical_profiler_properties.${index}.orientation_reference_id`}>
                                Orientation Reference
                              </Label>
                              <Select
                                onValueChange={(value) => setValue(`measurement_location.0.vertical_profiler_properties.${index}.orientation_reference_id`, value as any)}
                                value={watch(`measurement_location.0.vertical_profiler_properties.${index}.orientation_reference_id`)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select orientation reference" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="magnetic_north">Magnetic North</SelectItem>
                                  <SelectItem value="true_north">True North</SelectItem>
                                  <SelectItem value="grid_north">Grid North</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.vertical_profiler_properties.${index}.device_vertical_orientation`}>
                                Vertical Orientation
                              </Label>
                              <Select
                                onValueChange={(value) => setValue(`measurement_location.0.vertical_profiler_properties.${index}.device_vertical_orientation`, value as any)}
                                value={watch(`measurement_location.0.vertical_profiler_properties.${index}.device_vertical_orientation`) as string}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select vertical orientation" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="upward">Upward</SelectItem>
                                  <SelectItem value="downward">Downward</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.vertical_profiler_properties.${index}.date_from`}>
                                Date From
                              </Label>
                              <DateTimePicker
                                value={watch(`measurement_location.0.vertical_profiler_properties.${index}.date_from`) || ''}
                                onChange={(value) => setValue(`measurement_location.0.vertical_profiler_properties.${index}.date_from`, value)}
                                placeholder="Select start date and time"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.vertical_profiler_properties.${index}.date_to`}>
                                Date To
                              </Label>
                              <DateTimePicker
                                value={watch(`measurement_location.0.vertical_profiler_properties.${index}.date_to`) || ''}
                                onChange={(value) => setValue(`measurement_location.0.vertical_profiler_properties.${index}.date_to`, value)}
                                placeholder="Select end date and time"
                              />
                            </div>

                            <div className="sm:col-span-2 space-y-2">
                              <Label htmlFor={`measurement_location.0.vertical_profiler_properties.${index}.notes`}>
                                Notes
                              </Label>
                              <Textarea
                                {...register(`measurement_location.0.vertical_profiler_properties.${index}.notes`)}
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}