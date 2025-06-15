import { useFormContext } from 'react-hook-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export function BasicInfoStep() {
  const { register, watch } = useFormContext();
  const campaignStatus = watch('campaignStatus');

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
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            {...register('version')}
            placeholder="e.g., 1.0.0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            type="date"
            id="startDate"
            {...register('startDate')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaignStatus">Campaign Status</Label>
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
            <Label htmlFor="endDate">End Date</Label>
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