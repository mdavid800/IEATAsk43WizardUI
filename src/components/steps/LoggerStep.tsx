import { useFormContext } from 'react-hook-form';
import { PlusCircle, Trash2, ChevronDown, Settings, AlertCircle, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { cn } from '../../utils/cn';
import { getDefaultDatesForNewEntry } from '../../utils/campaign-dates';
import { validateLoggers } from '../../utils/step-validation';
import type { IEATask43Schema, LoggerOEM, LoggerMainConfig } from '../../types/schema';
import DynamicLoggerOptionalFields from './DynamicLoggerOptionalFields';

export function LoggerStep() {
  const { register, setValue, watch } = useFormContext<IEATask43Schema>();
  const locations = watch('measurement_location');
  const [expandedLocations, setExpandedLocations] = useState<{ [key: string]: boolean }>(
    locations.reduce((acc, loc) => ({ ...acc, [loc.uuid!]: true }), {})
  );
  const [expandedLoggers, setExpandedLoggers] = useState<{ [key: number]: boolean }>({});

  // Use shared validation utility
  const formData = watch();
  const validationResult = validateLoggers(formData);

  const addLogger = (locationIndex: number) => {
    const formData = watch();
    const defaultDates = getDefaultDatesForNewEntry(formData);
    const currentLoggers = watch(`measurement_location.${locationIndex}.logger_main_config`) || [];
    const newLogger: Partial<LoggerMainConfig> = {
      logger_oem_id: undefined,
      logger_serial_number: '',
      date_from: defaultDates.date_from,
      date_to: defaultDates.date_to,
      update_at: new Date().toISOString(),
      clock_is_auto_synced: undefined
    };

    setValue(`measurement_location.${locationIndex}.logger_main_config`, [...currentLoggers, newLogger as LoggerMainConfig]);
    setExpandedLoggers({ ...expandedLoggers, [currentLoggers.length]: true }); // Use index as key
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

  const toggleLoggerExpand = (loggerIndex: number) => {
    setExpandedLoggers(prev => ({
      ...prev,
      [loggerIndex]: !prev[loggerIndex]
    }));
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-border/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">Logger Configuration</h2>
            <p className="text-muted-foreground">A separate logger file is required for each data file which will be uploaded to the system. Data files should ensure consistency in timestamp conventions, averaging periods, etc. for all parameters contained within those files – care should be taken that this is the case when data files contain outputs from multiple sensors.</p>
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

      {locations.map((location, locationIndex) => (
        <div key={location.uuid} className="logger-card mb-8 shadow-lg transition-transform hover:scale-[1.01]">
          <div
            className="flex items-center justify-between bg-gradient-to-r from-primary/5 to-primary/0 p-5 cursor-pointer hover:bg-primary/10 transition-colors border-b border-border/60 backdrop-blur-md"
            onClick={() => toggleLocationExpand(location.uuid!)}
          >
            <div className="flex items-center gap-4">
              <ChevronDown
                className={`w-5 h-5 transition-transform ${expandedLocations[location.uuid!] ? 'rotate-0' : '-rotate-90'}`}
              />
              <h3 className="text-xl font-semibold text-primary drop-shadow-sm tracking-tight">
                {location.name || `Location ${locationIndex + 1}`}
              </h3>
              <span className="ml-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                {location.measurement_station_type_id}
              </span>
            </div>
          </div>

          {expandedLocations[location.uuid!] && (
            <div className="p-8 bg-white/70 backdrop-blur-md border-t border-border/60 space-y-8 transition-all animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground tracking-tight text-base">Loggers</span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-primary hover:bg-primary/90 shadow hover:shadow-lg focus:ring-2 focus:ring-primary/50"
                  onClick={() => addLogger(locationIndex)}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Logger
                </Button>
              </div>

              <div className="space-y-6">
                {(watch(`measurement_location.${locationIndex}.logger_main_config`) || []).map((logger, loggerIndex) => (
                  <div className="glass-card border border-primary/20 rounded-xl overflow-hidden mb-6 shadow transition-transform hover:scale-[1.01]" key={loggerIndex}>
                    <div
                      className="flex items-center gap-3 cursor-pointer select-none px-6 py-3 bg-gradient-to-r from-primary/10 to-primary/0 hover:bg-primary/20 transition-colors border-b border-border/40"
                      onClick={() => toggleLoggerExpand(loggerIndex)}
                    >
                      <div className="flex items-center w-full justify-between">
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={`w-5 h-5 transition-transform ${expandedLoggers[loggerIndex] ? 'transform rotate-0' : 'transform -rotate-90'}`}
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
                          className="p-2 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLogger(locationIndex, loggerIndex);
                          }}
                        >
                          <Trash2 className="w-6 h-6 text-[#FF0000] hover:text-[#CC0000]" />
                        </Button>
                      </div>
                    </div>

                    {expandedLoggers[loggerIndex] && (
                      <div className="p-6 bg-background space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_oem_id`}>
                              Logger Manufacturer <span className="required-asterisk">*</span>
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
                              Model Name <span className="required-asterisk">*</span>
                            </Label>
                            <Input
                              {...register(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_model_name`)}
                              placeholder="Enter model name"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.logger_serial_number`}>
                              Serial Number <span className="required-asterisk">*</span>
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
                              Date From <span className="required-asterisk">*</span>
                            </Label>
                            <DatePicker
                              value={watch(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.date_from`) || ''}
                              onChange={(value) => setValue(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.date_from`, value)}
                              placeholder="Select start date and time"
                              includeTime={true}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.date_to`}>
                              Date To <span className="required-asterisk">*</span>
                            </Label>
                            <DatePicker
                              value={watch(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.date_to`) || ''}
                              onChange={(value) => setValue(`measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.date_to`, value)}
                              placeholder="Select end date and time"
                              includeTime={true}
                              required
                            />
                          </div>

                          {/* Dynamic Optional Fields UI */}
                          {typeof window !== 'undefined' && (
                            <DynamicLoggerOptionalFields
                              locationIndex={locationIndex}
                              loggerIndex={loggerIndex}
                              register={register}
                              setValue={setValue}
                              watch={watch}
                            />
                          )}

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