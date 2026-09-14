import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  iconRight,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-zinc-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-[#E6E8EC] dark:border-[#232836] focus:border-[#635BFF] focus:ring-[#635BFF]/20'
          } rounded-[11px] py-2 px-3.5 transition-all duration-150 outline-none focus:ring-3 ${
            icon ? 'pl-9' : ''
          } ${iconRight ? 'pr-9' : ''} disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 text-zinc-400 flex items-center justify-center">
            {iconRight}
          </div>
        )}
      </div>
      {error ? (
        <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
