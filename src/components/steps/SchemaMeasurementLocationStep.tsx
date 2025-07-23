import React, { useState } from 'react';
import { Plus, Trash2, MapPin, AlertCircle, Check, Info, Settings2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { DynamicFormFieldHook } from '../schema/DynamicFormField';
import { ConditionalStationConfig } from '../schema/DynamicFormStep';
import { useSchemaForm } from '../../hooks/use-schema-form';
import { schemaService } from '../../services/schema-service';
import type { MeasurementLocation } from '../../types/schema';

export function SchemaMeasurementLocationStep() {
  const {
    storeData,
    validationResults,
    addArrayItem,
    removeArrayItem,
    updateStoreField
  } = useSchemaForm({ step: 1 });

  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);

  // Get validation results for this step
  const stepValidation = validationResults?.stepValidations?.[1];
  const isStepValid = stepValidation?.isValid ?? false;
  const stepErrors = stepValidation?.errors ?? [];

  const measurementLocations = storeData.measurement_location || [];
  const currentLocation = measurementLocations[selectedLocationIndex];

  // Get measurement station types from schema
  const stationTypes = schemaService.getEnumValues('measurement_location.items.properties.measurement_station_type_id');

  const addLocation = () => {
    const template: Partial<MeasurementLocation> = {
      uuid: crypto.randomUUID(),
      name: '',
      latitude_ddeg: 0,
      longitude_ddeg: 0,
      measurement_station_type_id: 'mast',
      update_at: new Date().toISOString(),
      measurement_point: []
    };
    
    addArrayItem('measurement_location', template);
    setSelectedLocationIndex(measurementLocations.length);
  };

  const removeLocation = (index: number) => {
    if (measurementLocations.length > 1) {
      removeArrayItem('measurement_location', index);
      if (selectedLocationIndex >= measurementLocations.length - 1) {
        setSelectedLocationIndex(Math.max(0, measurementLocations.length - 2));
      }
    }
  };

  const getStationTypeInfo = (stationType: string) => {
    const info = {
      mast: {
        icon: '🗼',
        title: 'Meteorological Mast',
        description: 'Traditional wind measurement tower with physical sensors',
        requirements: 'Requires mast properties, logger configuration, and physical measurements'
      },
      lidar: {
        icon: '📡',
        title: 'LiDAR System',
        description: 'Light Detection and Ranging remote sensing device',
        requirements: 'Requires vertical profiler properties and logger configuration'
      },
      sodar: {
        icon: '🔊',
        title: 'SODAR System', 
        description: 'Sonic Detection and Ranging acoustic profiler',
        requirements: 'Requires vertical profiler properties and logger configuration'
      },
      floating_lidar: {
        icon: '🌊',
        title: 'Floating LiDAR',
        description: 'LiDAR system mounted on floating platform for offshore measurements',
        requirements: 'Requires vertical profiler properties and specialized marine logger configuration'
      },
      wave_buoy: {
        icon: '🌊',
        title: 'Wave Buoy',
        description: 'Floating device for measuring wave and meteorological conditions',
        requirements: 'Requires vertical profiler properties and marine logger configuration'
      },
      adcp: {
        icon: '🌊',
        title: 'ADCP (Acoustic Doppler Current Profiler)',
        description: 'Device for measuring water current velocity profiles',
        requirements: 'Requires vertical profiler properties for underwater measurements'
      },
      solar: {
        icon: '☀️',
        title: 'Solar Measurement Station',
        description: 'Station for measuring solar irradiance and meteorological conditions',
        requirements: 'Requires specific sensors for irradiance measurement and logger configuration'
      },
      virtual_met_mast: {
        icon: '💻',
        title: 'Virtual Met Mast',
        description: 'Simulated measurement station using model data',
        requirements: 'Requires model configuration instead of physical logger'
      },
      reanalysis: {
        icon: '🌐',
        title: 'Reanalysis Data',
        description: 'Historical weather data from atmospheric models',
        requirements: 'Requires model configuration with reanalysis dataset specification'
      }
    };
    
    return info[stationType as keyof typeof info] || {
      icon: '📍',
      title: 'Unknown Station Type',
      description: 'Station type not recognized',
      requirements: 'Please select a valid station type'
    };
  };

  return (
    <div className="space-y-8">
      {/* Step Header */}
      <div className="border-b border-border/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">Measurement Locations</h2>
            <p className="text-muted-foreground">
              Configure measurement stations and their properties. Each location will have different requirements based on station type.
            </p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
            isStepValid
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          )}>
            {isStepValid ? (
              <>
                <Check className="w-4 h-4" />
                <span>{measurementLocations.length} Location{measurementLocations.length !== 1 ? 's' : ''} Valid</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>{stepErrors.length} issue{stepErrors.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>

        {/* Step-level validation errors */}
        {!isStepValid && stepErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">Location Validation Issues</h4>
                <ul className="space-y-1 text-sm text-red-700">
                  {stepErrors.slice(0, 3).map((error, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      <span>{error.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Location Management */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Location List Sidebar */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Locations</CardTitle>
                <Button
                  onClick={addLocation}
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {measurementLocations.map((location, index) => {
                const stationInfo = getStationTypeInfo(location.measurement_station_type_id);
                const isSelected = index === selectedLocationIndex;
                
                return (
                  <div
                    key={location.uuid || index}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/50 hover:bg-primary/2"
                    )}
                    onClick={() => setSelectedLocationIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{stationInfo.icon}</span>
                        <div>
                          <p className="font-medium text-sm">
                            {location.name || `Location ${index + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {location.measurement_station_type_id.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      {measurementLocations.length > 1 && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLocation(index);
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Location Details */}
        <div className="lg:col-span-3 space-y-6">
          {currentLocation ? (
            <>
              {/* Basic Location Properties */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location Properties
                  </CardTitle>
                  <CardDescription>
                    Basic information about this measurement location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DynamicFormFieldHook
                      name={`measurement_location.${selectedLocationIndex}.name` as any}
                      schemaPath="measurement_location.items.properties.name"
                      label="Location Name"
                      placeholder="Enter location name"
                      description="Descriptive name for this measurement location"
                    />
                    
                    <DynamicFormFieldHook
                      name={`measurement_location.${selectedLocationIndex}.measurement_station_type_id` as any}
                      schemaPath="measurement_location.items.properties.measurement_station_type_id"
                      label="Station Type"
                      description="Type of measurement station equipment"
                    />
                    
                    <DynamicFormFieldHook
                      name={`measurement_location.${selectedLocationIndex}.latitude_ddeg` as any}
                      schemaPath="measurement_location.items.properties.latitude_ddeg"
                      label="Latitude (degrees)"
                      placeholder="e.g., 52.1234"
                      description="Latitude in decimal degrees (WGS84)"
                    />
                    
                    <DynamicFormFieldHook
                      name={`measurement_location.${selectedLocationIndex}.longitude_ddeg` as any}
                      schemaPath="measurement_location.items.properties.longitude_ddeg"
                      label="Longitude (degrees)"
                      placeholder="e.g., 5.6789"
                      description="Longitude in decimal degrees (WGS84)"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Station Type Information */}
              {currentLocation.measurement_station_type_id && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">
                        {getStationTypeInfo(currentLocation.measurement_station_type_id).icon}
                      </span>
                      {getStationTypeInfo(currentLocation.measurement_station_type_id).title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-blue-800">
                    <p className="mb-2">
                      {getStationTypeInfo(currentLocation.measurement_station_type_id).description}
                    </p>
                    <p className="text-blue-700 text-xs">
                      <strong>Requirements:</strong> {getStationTypeInfo(currentLocation.measurement_station_type_id).requirements}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Conditional Station Configuration */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    Station Configuration
                  </CardTitle>
                  <CardDescription>
                    Configuration specific to the selected station type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConditionalStationConfig locationIndex={selectedLocationIndex} />
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Additional Notes</CardTitle>
                  <CardDescription>
                    Optional notes about this measurement location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DynamicFormFieldHook
                    name={`measurement_location.${selectedLocationIndex}.notes` as any}
                    schemaPath="measurement_location.items.properties.notes"
                    label="Notes"
                    placeholder="Enter any additional notes about this location..."
                    description="Optional notes or comments about this measurement location"
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            /* No locations state */
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Measurement Locations</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first measurement location to get started
                </p>
                <Button onClick={addLocation}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Schema Information */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-600" />
            Location Configuration Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Physical Stations</h4>
              <ul className="text-xs space-y-1">
                <li>• <strong>Mast:</strong> Requires mast properties + logger config</li>
                <li>• <strong>LiDAR/SODAR:</strong> Requires vertical profiler properties</li>
                <li>• <strong>Marine devices:</strong> Specialized logger configuration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Virtual Stations</h4>
              <ul className="text-xs space-y-1">
                <li>• <strong>Reanalysis:</strong> Requires model configuration only</li>
                <li>• <strong>Virtual mast:</strong> Model config instead of logger</li>
                <li>• <strong>Solar:</strong> Irradiance-specific sensors required</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}