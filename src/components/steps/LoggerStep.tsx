import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, ChevronDown, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { IEATask43Schema, LoggerOEM } from '../../types/schema';

export function LoggerStep() {
  const { register, setValue, watch } = useFormContext<IEATask43Schema>();
  const locations = watch('measurement_location');
  const [expandedLocations, setExpandedLocations] = useState<{ [key: string]: boolean }>(
    locations.reduce((acc, loc) => ({ ...acc, [loc.uuid]: true }), {})
  );
  const [expandedLoggers, setExpandedLoggers] = useState<{ [key: string]: boolean }>({});

  const addLogger = (locationIndex: number) => {
    const currentLoggers = watch(`measurement_location.${locationIndex}.logger_main_config`) || [];
    const newLogger = {
      logger_oem_id: 'Other' as LoggerOEM,
      logger_serial_number: '',
      date_from: new Date().toISOString(),
      date_to: null,
      update_at: new Date().toISOString(),
      clock_is_auto_synced: true
    };

    setValue(`measurement_location.${locationIndex}.logger_main_config`, [...currentLoggers, newLogger]);
    setExpandedLoggers({ ...expandedLoggers, [newLogger.logger_serial_number]: true });
  };

  const removeLogger = (locationIndex: number, loggerIndex: number) => {
    const currentLoggers = watch(`measurement_location.${locationIndex}.logger_main_config`) || [];
    setValue(
      `measurement_location.${locationIndex}.logger_main_config`,
      currentLoggers.filter((_, index) => index !== loggerIndex)
    );
  };

  const toggleLocationExpand = (locationId: string) => {
    setExpandedLocations(prev => ({
      ...prev,
      [locationId]: !prev[locationId]
    }));
  };

  const toggleLoggerExpand = (loggerId: string) => {
    setExpandedLoggers(prev => ({
      ...prev,
      [loggerId]: !prev[loggerId]
    }));
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-foreground">Logger Configuration</h2>

      {locations.map((location, locationIndex) => (
        <div key={location.uuid} className="border border-border rounded-lg overflow-hidden">
          <div 
            className="bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleLocationExpand(location.uuid)}
          >
            <div className="flex items-center gap-3">
              <ChevronDown 
                className={`w-5 h-5 transition-transform ${
                  expandedLocations[location.uuid] ? 'transform rotate-0' : 'transform -rotate-90'
                }`} 
              />
              <h3 className="text-lg font-medium text-foreground">{location.name || `Location ${locationIndex + 1}`}</h3>
              <div className="text-sm text-muted-foreground">
                {location.measurement_station_type_id}
              </div>
            </div>
          </div>

          {expandedLocations[location.uuid] && (
            <div className="p-6 border-t border-border">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  <h4 className="text-base font-medium">Loggers</h4>
                </div>
                <Button
                  type="button"
                  onClick={() => addLogger(locationIndex)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Logger
                </Button>
              </div>

              <div className="space-y-6">
                {(watch(`measurement_location.${locationIndex}.logger_main_config`) || []).map((logger, loggerIndex) => (
                  <div key={`${locationIndex}-${loggerIndex}`} className="border border-border rounded-lg overflow-hidden">
                    <div 
                      className="bg-primary/5 p-4 cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => toggleLoggerExpand(logger.logger_serial_number)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ChevronDown 
                            className={`w-5 h-5 transition-transform ${
                              expandedLoggers[logger.logger_serial_number] ? 'transform rotate-0' : 'transform -rotate-90'
                            }`}
                          />
                          <h5 className="text-base font-medium">Logger {loggerIndex + 1}</h5>
                          <div className="text-sm text-muted-foreground">
                            {logger.logger_name || logger.logger_serial_number || 'New Logger'}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLogger(locationIndex, loggerIndex);
                          }}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {expandedLoggers[logger.logger_serial_number] && (
                      <div className="p-6 bg-background space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_oem_id`}>
                              Logger Manufacturer
                            </Label>
                            <Select
                              onValueChange={(value) => setValue(
                                `measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_oem_id`,
                                value as LoggerOEM
                              )}
                              value={watch(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_oem_id`)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select manufacturer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NRG Systems">NRG Systems</SelectItem>
                                <SelectItem value="Ammonit">Ammonit</SelectItem>
                                <SelectItem value="Campbell Scientific">Campbell Scientific</SelectItem>
                                <SelectItem value="Vaisala">Vaisala</SelectItem>
                                <SelectItem value="SecondWind">SecondWind</SelectItem>
                                <SelectItem value="Kintech">Kintech</SelectItem>
                                <SelectItem value="Wilmers">Wilmers</SelectItem>
                                <SelectItem value="Unidata">Unidata</SelectItem>
                                <SelectItem value="WindLogger">WindLogger</SelectItem>
                                <SelectItem value="Leosphere">Leosphere</SelectItem>
                                <SelectItem value="ZX Lidars">ZX Lidars</SelectItem>
                                <SelectItem value="AXYS Technologies">AXYS Technologies</SelectItem>
                                <SelectItem value="AQSystem">AQSystem</SelectItem>
                                <SelectItem value="Pentaluum">Pentaluum</SelectItem>
                                <SelectItem value="Nortek">Nortek</SelectItem>
                                <SelectItem value="Teledyne RDI">Teledyne RDI</SelectItem>
                                <SelectItem value="Aanderaa">Aanderaa</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
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
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_serial_number`}>
                              Serial Number
                            </Label>
                            <Input
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_serial_number`)}
                              placeholder="Enter serial number"
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
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_id`}>
                              Logger ID
                            </Label>
                            <Input
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_id`)}
                              placeholder="Enter logger ID"
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
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.date_from`}>
                              Date From
                            </Label>
                            <Input
                              type="datetime-local"
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.date_from`)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.date_to`}>
                              Date To
                            </Label>
                            <Input
                              type="datetime-local"
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.date_to`)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.encryption_pin_or_key`}>
                              Encryption PIN/Key
                            </Label>
                            <Input
                              type="password"
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.encryption_pin_or_key`)}
                              placeholder="Enter encryption PIN or key"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.enclosure_lock_details`}>
                              Enclosure Lock Details
                            </Label>
                            <Input
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.enclosure_lock_details`)}
                              placeholder="Enter lock details"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.offset_from_utc_hrs`}>
                              UTC Offset (hours)
                            </Label>
                            <Input
                              type="number"
                              step="0.5"
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.offset_from_utc_hrs`, { 
                                valueAsNumber: true 
                              })}
                              placeholder="Enter UTC offset"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.sampling_rate_sec`}>
                              Sampling Rate (seconds)
                            </Label>
                            <Input
                              type="number"
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.sampling_rate_sec`, { 
                                valueAsNumber: true 
                              })}
                              placeholder="Enter sampling rate"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.averaging_period_minutes`}>
                              Averaging Period (minutes)
                            </Label>
                            <Input
                              type="number"
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.averaging_period_minutes`, { 
                                valueAsNumber: true 
                              })}
                              placeholder="Enter averaging period"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.timestamp_is_end_of_period`}>
                              Timestamp at End of Period
                            </Label>
                            <Select
                              onValueChange={(value) => setValue(
                                `measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.timestamp_is_end_of_period`,
                                value === 'true'
                              )}
                              value={watch(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.timestamp_is_end_of_period`)?.toString()}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select timestamp position" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.clock_is_auto_synced`}>
                              Auto-Synced Clock
                            </Label>
                            <Select
                              onValueChange={(value) => setValue(
                                `measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.clock_is_auto_synced`,
                                value === 'true'
                              )}
                              value={watch(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.clock_is_auto_synced`)?.toString()}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select if clock is auto-synced" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_acquisition_uncertainty`}>
                              Acquisition Uncertainty (%)
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_acquisition_uncertainty`, { 
                                valueAsNumber: true 
                              })}
                              placeholder="Enter uncertainty percentage"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.uncertainty_k_factor`}>
                              Uncertainty K Factor
                            </Label>
                            <Input
                              type="number"
                              step="0.1"
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.uncertainty_k_factor`, { 
                                valueAsNumber: true 
                              })}
                              placeholder="Enter k factor"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.data_transfer_details`}>
                              Data Transfer Details
                            </Label>
                            <Textarea
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.data_transfer_details`)}
                              placeholder="Enter data transfer details"
                              rows={3}
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
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}