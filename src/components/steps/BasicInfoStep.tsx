import { useFormContext } from 'react-hook-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function BasicInfoStep() {
  const { register, setValue, watch } = useFormContext();
  const plantType = watch('plant_type');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            {...register('author')}
            placeholder="Enter author name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organisation">Organisation</Label>
          <Input
            id="organisation"
            {...register('organisation')}
            placeholder="Enter organisation name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plant_name">Plant Name</Label>
          <Input
            id="plant_name"
            {...register('plant_name')}
            placeholder="Enter plant name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plant_type">Plant Type</Label>
          <Select 
            value={plantType} 
            onValueChange={(value) => setValue('plant_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select plant type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offshore_wind">Offshore Wind</SelectItem>
              <SelectItem value="onshore_wind">Onshore Wind</SelectItem>
              <SelectItem value="solar">Solar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            {...register('version')}
            placeholder="e.g., 1.0.0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            type="date"
            id="date"
            {...register('date')}
          />
        </div>
      </div>
    </div>
  );
}