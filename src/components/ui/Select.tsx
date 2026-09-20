import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  options,
  children,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={selectId}
          className={`w-full appearance-none bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 text-sm border ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-[#E6E8EC] dark:border-[#232836] focus:border-[#635BFF] focus:ring-[#635BFF]/20'
          } rounded-[11px] min-h-[48px] py-3 pl-3.5 pr-9 sm:min-h-[44px] sm:py-2.5 transition-all duration-150 outline-none focus:ring-3 cursor-pointer ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
      </div>
      {error ? (
        <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</span>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
