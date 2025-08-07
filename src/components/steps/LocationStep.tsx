import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ChevronDown, PlusCircle, Trash2, AlertCircle, Check, Info } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePicker } from '../ui/date-picker';
import { Textarea } from '../ui/textarea';
import { Map } from '../ui/map';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';
import { getDefaultDatesForNewEntry } from '../../utils/campaign-dates';
import { validateLocations } from '../../utils/step-validation';
import type { IEATask43Schema } from '../../types/schema';

export function LocationStep() {
  const { register, setValue, watch } = useFormContext<IEATask43Schema>();
  const campaignStatus = watch('campaignStatus'); // Get campaign status from form
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedProfilerProps, setExpandedProfilerProps] = useState<Record<string, boolean>>({});
  const [expandedModelConfigs, setExpandedModelConfigs] = useState<Record<string, boolean>>({});

  // Use shared validation utility
  const formData = watch();
  const validationResult = validateLocations(formData);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleProfilerPropExpand = (index: number) => {
    setExpandedProfilerProps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleModelConfigExpand = (index: number) => {
    setExpandedModelConfigs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const addVerticalProfilerProperty = () => {
    const currentProps = watch('measurement_location.0.vertical_profiler_properties') || [];
    setValue('measurement_location.0.vertical_profiler_properties', [
      ...currentProps,
      {
        device_datum_plane_height_m: null,
        height_reference_id: null,
        device_orientation_deg: null,
        orientation_reference_id: null,
        device_vertical_orientation: null,
        date_from: null,
        date_to: null,
        notes: null,
        update_at: null
      }
    ]);
  };

  const removeVerticalProfilerProperty = (index: number) => {
    const currentProps = watch('measurement_location.0.vertical_profiler_properties') || [];
    const newProps = currentProps.filter((_, i) => i !== index);
    setValue('measurement_location.0.vertical_profiler_properties', newProps);
  };

  const addModelConfig = () => {
    const formData = watch();
    const defaultDates = getDefaultDatesForNewEntry(formData);
    const currentConfigs = watch('measurement_location.0.model_config') || [];
    // Fix any existing configs with invalid reanalysis values
    const validatedConfigs = currentConfigs.map(config => ({
      ...config,
      reanalysis: config.reanalysis || 'ERA5'
    }));
    setValue('measurement_location.0.model_config', [
      ...validatedConfigs,
      {
        reanalysis: 'ERA5',
        horizontal_grid_resolution_m: null,
        model_used: null,
        date_from: defaultDates.date_from,
        date_to: defaultDates.date_to,
        offset_from_utc_hrs: null,
        averaging_period_minutes: null,
        timestamp_is_end_of_period: null,
        notes: null,
        update_at: new Date().toISOString()
      }
    ]);
  };

  const removeModelConfig = (index: number) => {
    const currentConfigs = watch('measurement_location.0.model_config') || [];
    const newConfigs = currentConfigs.filter((_, i) => i !== index);
    setValue('measurement_location.0.model_config', newConfigs);
  };

  // Handle date_to fields with null support for live campaigns
  const handleMastDateToChange = (value: string) => {
    // If user enters "null" (case insensitive), set actual null value
    if (value.toLowerCase().trim() === 'null') {
      setValue('measurement_location.0.mast_properties.date_to', null);
    } else {
      setValue('measurement_location.0.mast_properties.date_to', value);
    }
  };

  const handleVerticalProfilerDateToChange = (value: string, index: number) => {
    // If user enters "null" (case insensitive), set actual null value
    if (value.toLowerCase().trim() === 'null') {
      setValue(`measurement_location.0.vertical_profiler_properties.${index}.date_to`, null);
    } else {
      setValue(`measurement_location.0.vertical_profiler_properties.${index}.date_to`, value);
    }
  };

  const handleModelConfigDateToChange = (value: string, index: number) => {
    // If user enters "null" (case insensitive), set actual null value
    if (value.toLowerCase().trim() === 'null') {
      setValue(`measurement_location.0.model_config.${index}.date_to`, null);
    } else {
      setValue(`measurement_location.0.model_config.${index}.date_to`, value);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-border/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">Measurement Location</h2>
            <p className="text-muted-foreground">Define the geographical location and properties of your measurement station.</p>
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
                    onValueChange={(value) => setValue('measurement_location.0.measurement_station_type_id', value as 'mast' | 'lidar' | 'sodar' | 'floating_lidar' | 'wave_buoy' | 'adcp' | 'solar' | 'virtual_met_mast' | 'reanalysis')}
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
                    {...register('measurement_location.0.latitude_ddeg', {
                      valueAsNumber: true,
                      validate: (value) => {
                        if (value === undefined || value === null) return true;
                        if (value < -90 || value > 90) {
                          return 'Latitude must be between -90 and 90 degrees';
                        }
                        return true;
                      }
                    })}
                    placeholder="Enter latitude (-90 to 90)"
                    className={
                      watch('measurement_location.0.latitude_ddeg') > 90 ||
                        watch('measurement_location.0.latitude_ddeg') < -90
                        ? 'border-red-500 focus:border-red-500'
                        : ''
                    }
                  />
                  {(watch('measurement_location.0.latitude_ddeg') > 90 || watch('measurement_location.0.latitude_ddeg') < -90) && (
                    <p className="text-sm text-red-600">
                      Latitude must be between -90 and 90 degrees
                    </p>
                  )}
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
                    {...register('measurement_location.0.longitude_ddeg', {
                      valueAsNumber: true,
                      validate: (value) => {
                        if (value === undefined || value === null) return true;
                        if (value < -180 || value > 180) {
                          return 'Longitude must be between -180 and 180 degrees';
                        }
                        return true;
                      }
                    })}
                    placeholder="Enter longitude (-180 to 180)"
                    className={
                      watch('measurement_location.0.longitude_ddeg') > 180 ||
                        watch('measurement_location.0.longitude_ddeg') < -180
                        ? 'border-red-500 focus:border-red-500'
                        : ''
                    }
                  />
                  {(watch('measurement_location.0.longitude_ddeg') > 180 || watch('measurement_location.0.longitude_ddeg') < -180) && (
                    <p className="text-sm text-red-600">
                      Longitude must be between -180 and 180 degrees
                    </p>
                  )}
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
                        onValueChange={(value) => setValue('measurement_location.0.mast_properties.mast_geometry_id', value as 'lattice_triangle' | 'lattice_square_round_edges' | 'lattice_square_sharp_edges' | 'pole')}
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
                      <DatePicker
                        value={watch('measurement_location.0.mast_properties.date_from') || ''}
                        onChange={(value) => setValue('measurement_location.0.mast_properties.date_from', value)}
                        placeholder="Select start date and time"
                        includeTime={true}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="measurement_location.0.mast_properties.date_to">
                        Date To
                      </Label>
                      <DatePicker
                        value={watch('measurement_location.0.mast_properties.date_to') || ''}
                        onChange={(value) => handleMastDateToChange(value)}
                        placeholder="Select end date and time or type 'null'"
                        includeTime={true}
                      />
                      {campaignStatus === 'live' && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-700">
                              <strong>Live Campaign Note:</strong> For ongoing campaigns, you can either:
                              <ul className="mt-1 ml-4 list-disc">
                                <li>Use the current date/time as the end date</li>
                                <li>Type <code className="px-1 py-0.5 bg-blue-100 rounded text-xs font-mono">null</code> to indicate the campaign is still active</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
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
                                onValueChange={(value) => setValue(`measurement_location.0.vertical_profiler_properties.${index}.height_reference_id`, value as 'ground_level' | 'mean_sea_level' | 'sea_level' | 'lowest_astronomical_tide' | 'sea_floor' | 'other')}
                                value={watch(`measurement_location.0.vertical_profiler_properties.${index}.height_reference_id`) ?? undefined}
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
                                onValueChange={(value) => setValue(`measurement_location.0.vertical_profiler_properties.${index}.orientation_reference_id`, value as 'magnetic_north' | 'true_north' | 'grid_north')}
                                value={watch(`measurement_location.0.vertical_profiler_properties.${index}.orientation_reference_id`) ?? undefined}
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
                                onValueChange={(value) => setValue(`measurement_location.0.vertical_profiler_properties.${index}.device_vertical_orientation`, value as 'upward' | 'downward')}
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
                              <DatePicker
                                value={watch(`measurement_location.0.vertical_profiler_properties.${index}.date_from`) || ''}
                                onChange={(value) => setValue(`measurement_location.0.vertical_profiler_properties.${index}.date_from`, value)}
                                placeholder="Select start date and time"
                                includeTime={true}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.vertical_profiler_properties.${index}.date_to`}>
                                Date To
                              </Label>
                              <DatePicker
                                value={watch(`measurement_location.0.vertical_profiler_properties.${index}.date_to`) || ''}
                                onChange={(value) => handleVerticalProfilerDateToChange(value, index)}
                                placeholder="Select end date and time or type 'null'"
                                includeTime={true}
                              />
                              {campaignStatus === 'live' && (
                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                  <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-blue-700">
                                      <strong>Live Campaign Note:</strong> For ongoing campaigns, you can either:
                                      <ul className="mt-1 ml-4 list-disc">
                                        <li>Use the current date/time as the end date</li>
                                        <li>Type <code className="px-1 py-0.5 bg-blue-100 rounded text-xs font-mono">null</code> to indicate the campaign is still active</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
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

              {/* Model Configuration Section */}
              {watch('measurement_location.0.measurement_station_type_id') === 'reanalysis' && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium">Model Configuration</h4>
                    <Button
                      type="button"
                      variant="secondary"
                      className="bg-primary hover:bg-primary/90 shadow hover:shadow-lg focus:ring-2 focus:ring-primary/50"
                      onClick={addModelConfig}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Model Configuration
                    </Button>
                  </div>

                  {(watch('measurement_location.0.model_config') || []).map((_, index) => (
                    <div key={index} className="border border-border rounded-lg overflow-hidden mb-4">
                      <div
                        className="bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleModelConfigExpand(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ChevronDown className={`w-5 h-5 transition-transform ${expandedModelConfigs[index] ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                            <h5 className="text-base font-medium">Model Configuration {index + 1}</h5>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeModelConfig(index);
                            }}
                            className="p-2 hover:bg-transparent"
                          >
                            <Trash2 className="w-6 h-6 text-[#FF0000] hover:text-[#CC0000]" />
                          </Button>
                        </div>
                      </div>

                      {expandedModelConfigs[index] && (
                        <div className="border-t border-border p-6 bg-background">
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.model_config.${index}.reanalysis`}>
                                Reanalysis <span className="required-asterisk">*</span>
                              </Label>
                              <Select
                                onValueChange={(value) => setValue(`measurement_location.0.model_config.${index}.reanalysis`, value as 'CFSR' | 'ERA-Interim' | 'ERA5' | 'JRA-55' | 'MERRA-2' | 'NCAR' | 'Other')}
                                value={watch(`measurement_location.0.model_config.${index}.reanalysis`)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select reanalysis dataset" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CFSR">CFSR</SelectItem>
                                  <SelectItem value="ERA-Interim">ERA-Interim</SelectItem>
                                  <SelectItem value="ERA5">ERA5</SelectItem>
                                  <SelectItem value="JRA-55">JRA-55</SelectItem>
                                  <SelectItem value="MERRA-2">MERRA-2</SelectItem>
                                  <SelectItem value="NCAR">NCAR</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.model_config.${index}.horizontal_grid_resolution_m`}>
                                Horizontal Grid Resolution (m)
                              </Label>
                              <Input
                                type="number"
                                step="1"
                                {...register(`measurement_location.0.model_config.${index}.horizontal_grid_resolution_m`, { valueAsNumber: true })}
                                placeholder="Enter grid resolution"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.model_config.${index}.model_used`}>
                                Model Used
                              </Label>
                              <Input
                                {...register(`measurement_location.0.model_config.${index}.model_used`)}
                                placeholder="Enter model name"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.model_config.${index}.offset_from_utc_hrs`}>
                                Offset From UTC (hrs)
                              </Label>
                              <Input
                                type="number"
                                step="0.5"
                                {...register(`measurement_location.0.model_config.${index}.offset_from_utc_hrs`, { valueAsNumber: true })}
                                placeholder="Enter UTC offset"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.model_config.${index}.averaging_period_minutes`}>
                                Averaging Period (min)
                              </Label>
                              <Input
                                type="number"
                                step="1"
                                {...register(`measurement_location.0.model_config.${index}.averaging_period_minutes`, { valueAsNumber: true })}
                                placeholder="Enter averaging period"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.model_config.${index}.timestamp_is_end_of_period`}>
                                Timestamp at End of Period
                              </Label>
                              <Select
                                onValueChange={(value) => setValue(`measurement_location.0.model_config.${index}.timestamp_is_end_of_period`, value === 'true' ? true : value === 'false' ? false : null)}
                                value={watch(`measurement_location.0.model_config.${index}.timestamp_is_end_of_period`) === true ? 'true' : watch(`measurement_location.0.model_config.${index}.timestamp_is_end_of_period`) === false ? 'false' : ''}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timestamp position" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">True (end of period)</SelectItem>
                                  <SelectItem value="false">False (start of period)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.model_config.${index}.date_from`}>
                                Date From <span className="required-asterisk">*</span>
                              </Label>
                              <DatePicker
                                value={watch(`measurement_location.0.model_config.${index}.date_from`) || ''}
                                onChange={(value) => setValue(`measurement_location.0.model_config.${index}.date_from`, value)}
                                placeholder="Select start date and time"
                                includeTime={true}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`measurement_location.0.model_config.${index}.date_to`}>
                                Date To
                              </Label>
                              <DatePicker
                                value={watch(`measurement_location.0.model_config.${index}.date_to`) || ''}
                                onChange={(value) => handleModelConfigDateToChange(value, index)}
                                placeholder="Select end date and time or type 'null'"
                                includeTime={true}
                              />
                              {campaignStatus === 'live' && (
                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                  <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-blue-700">
                                      <strong>Live Campaign Note:</strong> For ongoing campaigns, you can either:
                                      <ul className="mt-1 ml-4 list-disc">
                                        <li>Use the current date/time as the end date</li>
                                        <li>Type <code className="px-1 py-0.5 bg-blue-100 rounded text-xs font-mono">null</code> to indicate the campaign is still active</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="sm:col-span-2 space-y-2">
                              <Label htmlFor={`measurement_location.0.model_config.${index}.notes`}>
                                Notes
                              </Label>
                              <Textarea
                                {...register(`measurement_location.0.model_config.${index}.notes`)}
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