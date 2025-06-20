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
    <div className="mt-6 pt-6 border-t border-border">
      <div className="bg-secondary/30 rounded-lg p-6 shadow-sm border border-secondary/40">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          <h4 className="text-lg font-semibold text-foreground">Optional Logger Fields</h4>
        </div>

        {/* Shown Fields */}
        <div className="space-y-4 mb-6">
          {shownFields.map(key => {
            const field = OPTIONAL_FIELDS.find(f => f.key === key);
            if (!field) return null;
            const name = `measurement_location.${locationIndex}.logger_main_config.${loggerIndex}.${key}`;
            return (
              <div key={key} className="bg-background rounded-lg p-4 border border-border shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={name} className="text-sm font-medium text-foreground">
                      {field.label}
                    </Label>
                    <div className="w-full">
                      {field.render({ register, setValue, watch }, name)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(key)}
                    className="mt-6 p-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Remove field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Field Dropdown */}
        {availableFields.length > 0 && (
          <div className="flex justify-center">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <select
                className="bg-background border border-border rounded-lg px-4 py-2 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-150 min-w-[280px]"
                onChange={e => {
                  if (e.target.value) {
                    addField(e.target.value);
                    e.target.value = '';
                  }
                }}
                value=""
                aria-label="Select field to add"
              >
                <option value="" disabled className="text-muted-foreground">
                  Add optional field...
                </option>
                {availableFields.map(f => (
                  <option key={f.key} value={f.key} className="text-foreground">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Empty State */}
        {shownFields.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">
              No optional fields added. Use the dropdown above to add additional logger configuration fields.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}