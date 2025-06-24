import { useFormContext } from 'react-hook-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export function BasicInfoStep() {
  const { register, watch, setValue } = useFormContext();
  const campaignStatus = watch('campaignStatus');
  const plantType = watch('plant_type');

  // Handler for custom input
  const handleCustomPlantTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('plant_type', e.target.value);
  }

  // Validation logic moved from ReviewStep
  const validateBasicInfo = () => {
    const formData = watch();
    const { author, organisation, plant_name, plant_type, version, startDate, campaignStatus, endDate } = formData;
    const issues: string[] = [];

    if (!author) issues.push('Author is required');
    if (!organisation) issues.push('Organisation is required');
    if (!plant_name) issues.push('Plant name is required');
    if (!plant_type) issues.push('Plant type is required');
    if (!version) issues.push('Version is required');
    if (!startDate) issues.push('Start date is required');
    if (campaignStatus === 'historical' && !endDate) issues.push('End date is required');

    return {
      valid: issues.length === 0,
      issues
    };
  };

  const validationResult = validateBasicInfo();

  return (
    <div className="space-y-8">
      <div className="border-b border-border/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">Basic Information</h2>
            <p className="text-muted-foreground">Provide essential details about your measurement campaign and organization.</p>
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
          <DatePicker
            id="startDate"
            value={watch('startDate')}
            onChange={(value) => setValue('startDate', value)}
            placeholder="Select start date and time"
            required
            includeTime={true}
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
            <DatePicker
              id="endDate"
              value={watch('endDate') || ''}
              onChange={(value) => setValue('endDate', value)}
              placeholder="Select end date and time"
              required
              includeTime={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}