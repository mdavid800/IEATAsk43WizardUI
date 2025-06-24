import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { PlusCircle, Trash2, Settings, Info } from 'lucide-react';

const OPTIONAL_FIELDS = [
  {
    key: 'classification',
    label: 'Classification',
    render: ({ register }: any, name: string) => (
      <Input {...register(name)} placeholder="e.g., 1.2A" pattern="^([0-9]{1,2})[.]([0-9]{1,2})[ABCDS]$" />
    ),
  },
  {
    key: 'instrument_poi_height_mm',
    label: 'POI Height (mm)',
    render: ({ register }: any, name: string) => (
      <Input type="number" {...register(name, { valueAsNumber: true })} placeholder="Height in mm" />
    ),
  },
  {
    key: 'is_heated',
    label: 'Heated',
    render: ({ setValue, watch }: any, name: string) => (
      <Select
        onValueChange={value => setValue(name, value === 'true')}
        value={watch(name)?.toString()}
      >
        <SelectTrigger>
          <SelectValue placeholder="Is sensor heated?" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    key: 'sensor_body_size_mm',
    label: 'Body Size (mm)',
    render: ({ register }: any, name: string) => (
      <Input type="number" {...register(name, { valueAsNumber: true })} placeholder="Body size in mm" />
    ),
  },
];

type Props = {
  locationIndex: number;
  sensorIndex: number;
  register: any;
  setValue: any;
  watch: any;
};

export default function DynamicSensorOptionalFields({ locationIndex, sensorIndex, register, setValue, watch }: Props) {
  const [shownFields, setShownFields] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const availableFields = OPTIONAL_FIELDS.filter(f => !shownFields.includes(f.key));

  // Initialize shown fields based on existing form values
  useEffect(() => {
    if (!isInitialized) {
      const fieldsWithExistingValues: string[] = [];

      OPTIONAL_FIELDS.forEach(field => {
        const name = `measurement_location.${locationIndex}.sensors.${sensorIndex}.${field.key}`;
        const value = watch(name);

        // If the field has a meaningful value, show it
        if (value !== undefined && value !== null && value !== '' &&
          !(typeof value === 'number' && isNaN(value))) {
          fieldsWithExistingValues.push(field.key);
        }
      });

      if (fieldsWithExistingValues.length > 0) {
        setShownFields(fieldsWithExistingValues);
      }
      setIsInitialized(true);
    }
  }, [locationIndex, sensorIndex, watch, isInitialized]);

  // Check which fields have values
  const getFieldValue = (key: string) => {
    const name = `measurement_location.${locationIndex}.sensors.${sensorIndex}.${key}`;
    return watch(name);
  };

  const fieldsWithValues = shownFields.filter(key => {
    const value = getFieldValue(key);
    return value !== undefined && value !== null && value !== '' && !isNaN(value);
  });

  const addField = (key: string) => setShownFields([...shownFields, key]);
  const removeField = (key: string) => {
    // Clear the field value when removing
    const name = `measurement_location.${locationIndex}.sensors.${sensorIndex}.${key}`;
    setValue(name, undefined);
    setShownFields(shownFields.filter(f => f !== key));
  };

  return (
    <div className="sm:col-span-2 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Settings className="w-5 h-5 text-primary" />
        <h6 className="text-base font-semibold text-foreground">Optional Sensor Configuration</h6>
        {fieldsWithValues.length > 0 && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            {fieldsWithValues.length} field{fieldsWithValues.length !== 1 ? 's' : ''} will be exported
          </span>
        )}
      </div>

      {shownFields.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Optional fields with values will be included in the JSON export.</p>
              <p className="text-xs mt-1">Empty fields will be automatically excluded to keep the export clean.</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {shownFields.map(key => {
          const field = OPTIONAL_FIELDS.find(f => f.key === key);
          if (!field) return null;
          const name = `measurement_location.${locationIndex}.sensors.${sensorIndex}.${key}`;
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
                aria-label="Add optional field"
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
            <p className="text-xs mt-1">Use the dropdown above to add optional sensor configuration fields</p>
          </div>
        )}
      </div>
    </div>
  );
}