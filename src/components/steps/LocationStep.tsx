import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Map } from '../ui/map';
import type { IEATask43Schema } from '../../types/schema';

export function LocationStep() {
  const { register, setValue, watch } = useFormContext<IEATask43Schema>();
  const [locations, setLocations] = useState([{ id: crypto.randomUUID(), isExpanded: true }]);

  const addLocation = () => {
    const newLocation = {
      uuid: crypto.randomUUID(),
      name: '',
      latitude_ddeg: 0,
      longitude_ddeg: 0,
      measurement_station_type_id: 'mast' as const,
      update_at: new Date().toISOString(),
      measurement_point: []
    };

    setValue('measurement_location', [...watch('measurement_location'), newLocation]);
    setLocations([...locations, { id: crypto.randomUUID(), isExpanded: true }]);
  };

  const removeLocation = (index: number) => {
    const currentLocations = watch('measurement_location');
    setValue('measurement_location', currentLocations.filter((_, i) => i !== index));
    setLocations(locations.filter((_, i) => i !== index));
  };

  const toggleExpand = (id: string) => {
    setLocations(locations.map(loc => 
      loc.id === id ? { ...loc, isExpanded: !loc.isExpanded } : loc
    ));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Measurement Locations</h2>
        <Button
          type="button"
          onClick={addLocation}
          className="bg-primary hover:bg-primary/90"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {locations.map((location, index) => (
        <div key={location.id} className="border border-border rounded-lg overflow-hidden">
          <div 
            className="bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleExpand(location.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown className={`w-5 h-5 transition-transform ${location.isExpanded ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                <h3 className="text-lg font-medium text-foreground">Location {index + 1}</h3>
                <div className="text-sm text-muted-foreground">
                  {watch(`measurement_location.${index}.name`) || 'Unnamed Location'}
                </div>
              </div>
              {locations.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLocation(index);
                  }}
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {location.isExpanded && (
            <div className="border-t border-border">
              <div className="p-6 bg-background space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`measurement_location.${index}.name`}>
                      Location Name
                    </Label>
                    <Input
                      {...register(`measurement_location.${index}.name`)}
                      placeholder="Enter location name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`measurement_location.${index}.measurement_station_type_id`}>
                      Station Type
                    </Label>
                    <Select
                      onValueChange={(value) => setValue(`measurement_location.${index}.measurement_station_type_id`, value as any)}
                      value={watch(`measurement_location.${index}.measurement_station_type_id`)}
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
                    <Label htmlFor={`measurement_location.${index}.latitude_ddeg`}>
                      Latitude (degrees)
                    </Label>
                    <Input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      {...register(`measurement_location.${index}.latitude_ddeg`, { valueAsNumber: true })}
                      placeholder="Enter latitude"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`measurement_location.${index}.longitude_ddeg`}>
                      Longitude (degrees)
                    </Label>
                    <Input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      {...register(`measurement_location.${index}.longitude_ddeg`, { valueAsNumber: true })}
                      placeholder="Enter longitude"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Map 
                      latitude={watch(`measurement_location.${index}.latitude_ddeg`) || 0}
                      longitude={watch(`measurement_location.${index}.longitude_ddeg`) || 0}
                      className="border border-border shadow-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor={`measurement_location.${index}.notes`}>
                      Notes
                    </Label>
                    <Textarea
                      {...register(`measurement_location.${index}.notes`)}
                      placeholder="Add any additional notes"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Mast Properties Section */}
                {watch(`measurement_location.${index}.measurement_station_type_id`) === 'mast' && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h4 className="text-lg font-medium mb-4">Mast Properties</h4>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`measurement_location.${index}.mast_properties.mast_geometry_id`}>
                          Mast Geometry
                        </Label>
                        <Select
                          onValueChange={(value) => setValue(`measurement_location.${index}.mast_properties.mast_geometry_id`, value as any)}
                          value={watch(`measurement_location.${index}.mast_properties.mast_geometry_id`)}
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
                        <Label htmlFor={`measurement_location.${index}.mast_properties.mast_height_m`}>
                          Mast Height (m)
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          {...register(`measurement_location.${index}.mast_properties.mast_height_m`, { valueAsNumber: true })}
                          placeholder="Enter mast height"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`measurement_location.${index}.mast_properties.mast_oem`}>
                          Mast Manufacturer
                        </Label>
                        <Input
                          {...register(`measurement_location.${index}.mast_properties.mast_oem`)}
                          placeholder="Enter manufacturer name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`measurement_location.${index}.mast_properties.mast_model`}>
                          Mast Model
                        </Label>
                        <Input
                          {...register(`measurement_location.${index}.mast_properties.mast_model`)}
                          placeholder="Enter model name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`measurement_location.${index}.mast_properties.mast_serial_number`}>
                          Serial Number
                        </Label>
                        <Input
                          {...register(`measurement_location.${index}.mast_properties.mast_serial_number`)}
                          placeholder="Enter serial number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`measurement_location.${index}.mast_properties.date_from`}>
                          Date From
                        </Label>
                        <Input
                          type="datetime-local"
                          {...register(`measurement_location.${index}.mast_properties.date_from`)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`measurement_location.${index}.mast_properties.date_to`}>
                          Date To
                        </Label>
                        <Input
                          type="datetime-local"
                          {...register(`measurement_location.${index}.mast_properties.date_to`)}
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor={`measurement_location.${index}.mast_properties.notes`}>
                          Notes
                        </Label>
                        <Textarea
                          {...register(`measurement_location.${index}.mast_properties.notes`)}
                          placeholder="Add any additional notes"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Vertical Profiler Properties Section */}
                {['lidar', 'sodar', 'floating_lidar'].includes(watch(`measurement_location.${index}.measurement_station_type_id`)) && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h4 className="text-lg font-medium mb-4">Vertical Profiler Properties</h4>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`measurement_location.${index}.vertical_profiler_properties.0.device_datum_plane_height_m`}>
                          Device Datum Plane Height (m)
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          {...register(`measurement_location.${index}.vertical_profiler_properties.0.device_datum_plane_height_m`, { valueAsNumber: true })}
                          placeholder="Enter height"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`measurement_location.${index}.vertical_profiler_properties.0.height_reference_id`}>
                          Height Reference
                        </Label>
                        <Select
                          onValueChange={(value) => setValue(`measurement_location.${index}.vertical_profiler_properties.0.height_reference_id`, value as any)}
                          value={watch(`measurement_location.${index}.vertical_profiler_properties.0.height_reference_id`)}
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
                        <Label htmlFor={`measurement_location.${index}.vertical_profiler_properties.0.device_orientation_deg`}>
                          Device Orientation (deg)
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="360"
                          {...register(`measurement_location.${index}.vertical_profiler_properties.0.device_orientation_deg`, { valueAsNumber: true })}
                          placeholder="Enter orientation"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`measurement_location.${index}.vertical_profiler_properties.0.orientation_reference_id`}>
                          Orientation Reference
                        </Label>
                        <Select
                          onValueChange={(value) => setValue(`measurement_location.${index}.vertical_profiler_properties.0.orientation_reference_id`, value as any)}
                          value={watch(`measurement_location.${index}.vertical_profiler_properties.0.orientation_reference_id`)}
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
                        <Label htmlFor={`measurement_location.${index}.vertical_profiler_properties.0.device_vertical_orientation`}>
                          Vertical Orientation
                        </Label>
                        <Select
                          onValueChange={(value) => setValue(`measurement_location.${index}.vertical_profiler_properties.0.device_vertical_orientation`, value as any)}
                          value={watch(`measurement_location.${index}.vertical_profiler_properties.0.device_vertical_orientation`)}
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
                        <Label htmlFor={`measurement_location.${index}.vertical_profiler_properties.0.date_from`}>
                          Date From
                        </Label>
                        <Input
                          type="datetime-local"
                          {...register(`measurement_location.${index}.vertical_profiler_properties.0.date_from`)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`measurement_location.${index}.vertical_profiler_properties.0.date_to`}>
                          Date To
                        </Label>
                        <Input
                          type="datetime-local"
                          {...register(`measurement_location.${index}.vertical_profiler_properties.0.date_to`)}
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor={`measurement_location.${index}.vertical_profiler_properties.0.notes`}>
                          Notes
                        </Label>
                        <Textarea
                          {...register(`measurement_location.${index}.vertical_profiler_properties.0.notes`)}
                          placeholder="Add any additional notes"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}