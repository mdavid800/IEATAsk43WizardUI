import { useFormContext } from 'react-hook-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export function BasicInfoStep() {
  const { register, watch, setValue } = useFormContext();
  const campaignStatus = watch('campaignStatus');
  const plantType = watch('plant_type');

  // Handler for custom input
  const handleCustomPlantTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('plant_type', e.target.value);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author">Author <span className="required-asterisk">*</span></Label>
          <Input
            id="author"
            {...register('author')}
            placeholder="Enter author name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organisation">Organisation <span className="required-asterisk">*</span></Label>
          <Input
            id="organisation"
            {...register('organisation')}
            placeholder="Enter organisation name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plant_name">Plant Name <span className="required-asterisk">*</span></Label>
          <Input
            id="plant_name"
            {...register('plant_name')}
            placeholder="Enter plant name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plant_type">Plant Type <span className="required-asterisk">*</span></Label>
          <select
            id="plant_type"
            {...register('plant_type')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select plant type</option>
            <option value="onshore_wind">Onshore Wind</option>
            <option value="offshore_wind">Offshore Wind</option>
            <option value="solar">Solar</option>
            <option value="custom">Custom...</option>
          </select>
          {(
            plantType === 'custom' ||
            (plantType && !['onshore_wind', 'offshore_wind', 'solar'].includes(plantType))
          ) && (
            <div className="mt-2">
              <Label htmlFor="plant_type">Custom Plant Type <span className="required-asterisk">*</span></Label>
              <Input
                id="plant_type"
                placeholder="Enter custom plant type"
                value={['onshore_wind', 'offshore_wind', 'solar', 'custom'].includes(plantType) ? '' : plantType}
                onChange={handleCustomPlantTypeChange}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="version">Version <span className="required-asterisk">*</span></Label>
          <Input
            id="version"
            {...register('version')}
            placeholder="e.g., 1.0.0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date <span className="required-asterisk">*</span></Label>
          <Input
            type="date"
            id="startDate"
            {...register('startDate')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaignStatus">Campaign Status <span className="required-asterisk">*</span></Label>
          <select
            id="campaignStatus"
            {...register('campaignStatus')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="live">Live</option>
            <option value="historical">Historical</option>
          </select>
        </div>

        {campaignStatus === 'historical' && (
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date <span className="required-asterisk">*</span></Label>
            <Input
              type="date"
              id="endDate"
              {...register('endDate')}
            />
          </div>
        )}
      </div>
    </div>
  );
}