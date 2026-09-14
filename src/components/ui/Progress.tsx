import React from 'react';

interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  sublabel?: string;
  showPercentage?: boolean;
  variant?: 'primary' | 'success' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  sublabel,
  showPercentage = false,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2.5';

  const barColor = {
    primary: 'bg-[#635BFF]',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
  }[variant];

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {(label || showPercentage || sublabel) && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {label && <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>}
            {sublabel && <span className="text-zinc-500 dark:text-zinc-400">{sublabel}</span>}
          </div>
          {showPercentage && (
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{percentage}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-zinc-200/80 dark:bg-zinc-800 rounded-full overflow-hidden ${barHeight}`}>
        <div
          className={`${barColor} ${barHeight} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
