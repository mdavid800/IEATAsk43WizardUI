import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';

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
    <div className="space-y-4 border-2 border-blue-400 bg-blue-50 rounded-md p-4 shadow-md">
      <div className="font-semibold text-blue-700 text-lg mb-2">Optional Logger Fields</div>
      {shownFields.map(key => {
        const field = OPTIONAL_FIELDS.find(f => f.key === key);
        if (!field) return null;
        const name = `measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.${key}`;
        return (
          <div key={key} className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor={name}>{field.label}</Label>
              {field.render({ register, setValue, watch }, name)}
            </div>
            <Button  type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove"
                          className="p-2 hover:bg-transparent" onClick={() => removeField(key)} title="Remove field">
              <Trash2 className="w-6 h-6 text-[#FF0000] hover:text-[#CC0000]" />
            </Button>
          </div>
        );
      })}
      {availableFields.length > 0 && (
        <div className="w-full flex justify-center">
          <select
            className="border rounded px-3 py-2 shadow bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-150"
            onChange={e => {
              if (e.target.value) addField(e.target.value);
            }}
            value=""
            aria-label="Select field to add"
            style={{ minWidth: 220 }}
          >
            <option value="" disabled>
              Add optional field...
            </option>
            {availableFields.map(f => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
