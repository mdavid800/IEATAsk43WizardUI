import { AlertCircle } from 'lucide-react';

export function ValidationAlert({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <h3 className="text-sm font-medium text-red-700">Please fix the following issues:</h3>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-red-700">
        {issues.map((issue, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="select-none">•</span>
            <span>{issue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
