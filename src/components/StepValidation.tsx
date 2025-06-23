import React from 'react';
import { AlertCircle } from 'lucide-react';

interface StepValidationProps {
  issues: string[];
}

export function StepValidation({ issues }: StepValidationProps) {
  if (!issues || issues.length === 0) return null;
  return (
    <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex items-center gap-2 mb-2 text-red-700 font-medium">
        <AlertCircle className="w-4 h-4" />
        <span>Please address the following issues:</span>
      </div>
      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
        {issues.map((issue, idx) => (
          <li key={idx}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}
