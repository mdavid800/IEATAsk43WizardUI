import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { ValidationResult } from '../utils/validation';

interface Props {
  title: string;
  result: ValidationResult;
}

export function ValidationSummary({ title, result }: Props) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border mb-6',
        result.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {result.valid ? (
          <Check className="w-5 h-5 text-green-500" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-500" />
        )}
        <h3 className="text-base font-medium">{title}</h3>
      </div>
      {!result.valid && result.issues.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-red-700">
          {result.issues.map((issue, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="select-none">•</span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
