import { useFormContext } from 'react-hook-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function BasicInfoStep() {
  const { register, watch, setValue } = useFormContext();
  const campaignStatus = watch('campaignStatus');
  const plantType = watch('plant_type');

  // Handler for custom input
  const handleCustomPlantTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('plant_type', e.target.value);
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-border/20 pb-4">
        <h2 className="text-2xl font-bold text-primary mb-2">Basic Information</h2>
        <p className="text-muted-foreground">Provide essential details about your measurement campaign and organization.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="author">Author <span className="required-asterisk">*</span></Label>
          <Input
            id="author"
            {...register('author')}
            placeholder="Enter author name"
            className="professional-input"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="organisation">Organisation <span className="required-asterisk">*</span></Label>
          <Input
            id="organisation"
            {...register('organisation')}
            placeholder="Enter organisation name"
            className="professional-input"
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
          <Select
            onValueChange={(value) => setValue('plant_type', value)}
            value={plantType || ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select plant type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onshore_wind">Onshore Wind</SelectItem>
              <SelectItem value="offshore_wind">Offshore Wind</SelectItem>
              <SelectItem value="solar">Solar</SelectItem>
              <SelectItem value="custom">Custom...</SelectItem>
            </SelectContent>
          </Select>
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
          <Select
            onValueChange={(value) => setValue('campaignStatus', value)}
            value={campaignStatus || ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select campaign status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="historical">Historical</SelectItem>
            </SelectContent>
          </Select>
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