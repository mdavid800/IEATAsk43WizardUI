import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, ChevronDown, Settings, Info } from 'lucide-react';
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
  const [expandedLoggers, setExpandedLoggers] = useState<{ [key: number]: boolean }>({});

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
    setExpandedLoggers({ ...expandedLoggers, [currentLoggers.length]: true }); // Use index as key
  };

  const removeLogger = (locationIndex: number, loggerIndex: number) => {
    const currentLoggers = watch(`measurement_location.${locationIndex}.logger_main_config`) || [];
    setValue(
      `measurement_location.${locationIndex}.logger_main_config`,
      currentLoggers.filter((_, i) => i !== loggerIndex)
    );
  };

  const toggleLocationExpand = (locationId: string) => {
    setExpandedLocations(prev => ({
      ...prev,
      [locationId]: !prev[locationId]
    }));
  };

  const toggleLoggerExpand = (loggerIndex: number) => {
    setExpandedLoggers(prev => ({
      ...prev,
      [loggerIndex]: !prev[loggerIndex]
    }));
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-foreground">Logger Configuration</h2>
      <div className="text-muted-foreground mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                A separate logger file is required for each data file which will be uploaded to the system. Data files should ensure consistency in timestamp conventions, averaging periods, etc. for all parameters contained within those files – care should be taken that this is the case when data files contain outputs from multiple sensors.
              </p>
            </div>
          </div>
        </div>
      </div>

      {locations.map((location, locationIndex) => (
        <div key={location.uuid} className="logger-card mb-8">
          <div
            className="bg-white p-5 cursor-pointer hover:bg-secondary/10 transition-colors border-b border-border backdrop-blur-md"
            onClick={() => toggleLocationExpand(location.uuid)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${expandedLocations[location.uuid] ? 'rotate-0' : '-rotate-90'}`}
                />
                <h3 className="text-xl font-semibold text-foreground tracking-tight">
                  {location.name || `Location ${locationIndex + 1}`}
                </h3>
                <span className="ml-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                  {location.measurement_station_type_id}
                </span>
              </div>
            </div>
          </div>

          {expandedLocations[location.uuid] && (
            <div className="p-8 bg-white border-t border-border space-y-8 transition-all animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground tracking-tight text-base">Loggers</span>
                </div>
                <Button
                  type="button"
                  variant="default"
                  className="bg-primary hover:bg-primary/90 focus:ring-1 focus:ring-primary/50"
                  onClick={() => addLogger(locationIndex)}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Logger
                </Button>
              </div>

              <div className="space-y-6">
                {(watch(`measurement_location.${locationIndex}.logger_main_config`) || []).map((logger, loggerIndex) => (
                  <div className="border border-border rounded-xl overflow-hidden mb-6 shadow-sm transition-transform hover:border-primary/20\" key={loggerIndex}>
                    <div
                      className="flex items-center gap-3 cursor-pointer select-none px-6 py-3 bg-secondary/20 hover:bg-secondary/30 transition-colors border-b border-border"
                      onClick={() => toggleLoggerExpand(loggerIndex)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={`w-5 h-5 transition-transform ${expandedLoggers[loggerIndex] ? 'transform rotate-0' : 'transform -rotate-90'
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
                          aria-label="Remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLogger(locationIndex, loggerIndex);
                          }}
                          className="p-2 hover:bg-transparent"
                        >
                          <Trash2 className="w-6 h-6 text-[#FF0000] hover:text-[#CC0000]" />
                        </Button>
                      </div>
                    </div>

                    {expandedLoggers[loggerIndex] && (
                      <div className="p-6 bg-background space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8 bg-white rounded-b-xl">
                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_oem_id`}>
                              Logger Manufacturer
                            </Label>
                            <Select
                              onValueChange={(value) => setValue(
                                `measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_oem_id`,
                                value as LoggerOEM
                              )}
                              value={watch(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_oem_id`) || ''}
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
                              value={watch(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.timestamp_is_end_of_period`)?.toString() || ''}
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
                              value={watch(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.clock_is_auto_synced`)?.toString() || ''}
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