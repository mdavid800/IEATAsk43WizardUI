import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { PlusCircle, Trash2, Settings } from 'lucide-react';

const OPTIONAL_FIELDS = [
  {
    key: 'encryption_pin_or_key',
    label: 'Encryption PIN/Key',
    render: ({ register }: any, name: string) => (
      <Input type="password" {...register(name)} placeholder="Enter encryption PIN or key" />
    ),
  },
  {
    key: 'enclosure_lock_details',
    label: 'Enclosure Lock Details',
    render: ({ register }: any, name: string) => (
      <Input {...register(name)} placeholder="Enter lock details" />
    ),
  },
  {
    key: 'offset_from_utc_hrs',
    label: 'UTC Offset (hours)',
    render: ({ register }: any, name: string) => (
      <Input type="number" step="0.5" {...register(name, { valueAsNumber: true })} placeholder="Enter UTC offset" />
    ),
  },
  {
    key: 'sampling_rate_sec',
    label: 'Sampling Rate (seconds)',
    render: ({ register }: any, name: string) => (
      <Input type="number" {...register(name, { valueAsNumber: true })} placeholder="Enter sampling rate" />
    ),
  },
  {
    key: 'averaging_period_minutes',
    label: 'Averaging Period (minutes)',
    render: ({ register }: any, name: string) => (
      <Input type="number" {...register(name, { valueAsNumber: true })} placeholder="Enter averaging period" />
    ),
  },
  {
    key: 'timestamp_is_end_of_period',
    label: 'Timestamp at End of Period',
    render: ({ setValue, watch }: any, name: string) => (
      <Select
        onValueChange={value => setValue(name, value === 'true')}
        value={watch(name)?.toString()}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select timestamp position" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    key: 'clock_is_auto_synced',
    label: 'Auto-Synced Clock',
    render: ({ setValue, watch }: any, name: string) => (
      <Select
        onValueChange={value => setValue(name, value === 'true')}
        value={watch(name)?.toString()}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select if clock is auto-synced" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    key: 'logger_acquisition_uncertainty',
    label: 'Acquisition Uncertainty (%)',
    render: ({ register }: any, name: string) => (
      <Input type="number" step="0.01" {...register(name, { valueAsNumber: true })} placeholder="Enter uncertainty percentage" />
    ),
  },
  {
    key: 'uncertainty_k_factor',
    label: 'Uncertainty K Factor',
    render: ({ register }: any, name: string) => (
      <Input type="number" step="0.1" {...register(name, { valueAsNumber: true })} placeholder="Enter k factor" />
    ),
  },
];

type Props = {
  locationIndex: number;
  loggerIndex: number;
  register: any;
  setValue: any;
  watch: any;
};

export default function DynamicLoggerOptionalFields({ locationIndex, loggerIndex, register, setValue, watch }: Props) {
  const [shownFields, setShownFields] = useState<string[]>([]);
  const availableFields = OPTIONAL_FIELDS.filter(f => !shownFields.includes(f.key));

  const addField = (key: string) => setShownFields([...shownFields, key]);
  const removeField = (key: string) => setShownFields(shownFields.filter(f => f !== key));

  return (
    <div className="sm:col-span-2 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Settings className="w-5 h-5 text-primary" />
        <h6 className="text-base font-semibold text-foreground">Optional Logger Configuration</h6>
      </div>
      
      <div className="space-y-4">
        {shownFields.map(key => {
          const field = OPTIONAL_FIELDS.find(f => f.key === key);
          if (!field) return null;
          const name = `measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.${key}`;
          return (
            <div key={key} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg border border-border/30">
              <div className="sm:col-span-3 space-y-2">
                <Label htmlFor={name} className="font-medium text-foreground">{field.label}</Label>
                {field.render({ register, setValue, watch }, name)}
              </div>
              <div className="flex items-end">
                <Button  
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove field"
                  className="p-2 hover:bg-transparent" 
                  onClick={() => removeField(key)}
                >
                  <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700" />
                </Button>
              </div>
            </div>
          );
        })}
        
        {availableFields.length > 0 && (
          <div className="flex justify-center pt-4">
            <div className="flex items-center gap-3">
              <Label className="text-muted-foreground text-sm">Add optional field:</Label>
              <select
                className="flex h-10 w-60 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary"
                onChange={e => {
                  if (e.target.value) {
                    addField(e.target.value);
                    e.target.value = '';
                  }
                }}
                value=""
              >
                <option value="" disabled>
                  Select a field to add...
                </option>
                {availableFields.map(f => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
              <PlusCircle className="w-5 h-5 text-primary" />
            </div>
          </div>
        )}
        
        {shownFields.length === 0 && availableFields.length > 0 && (
          <div className="text-center text-muted-foreground py-8 border-2 border-dashed border-border/40 rounded-lg">
            <Settings className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No optional fields added yet</p>
            <p className="text-xs mt-1">Use the dropdown above to add optional logger configuration fields</p>
          </div>
        )}
      </div>
    </div>
  );
}