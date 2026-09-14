import React from 'react';
import { Zap } from 'lucide-react';

interface ScoreProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const Score: React.FC<ScoreProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const getScoreTier = (val: number) => {
    if (val >= 90) return { label: 'Alta Propensão', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/60', dot: 'bg-emerald-500' };
    if (val >= 75) return { label: 'Boa Aderência', color: 'text-[#635BFF] dark:text-[#9A94FF]', bg: 'bg-[#EEF0FF] dark:bg-[#1E1D38] border-[#635BFF]/20', dot: 'bg-[#635BFF]' };
    if (val >= 60) return { label: 'Moderada', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/60', dot: 'bg-amber-500' };
    return { label: 'Baixa', color: 'text-zinc-500 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700', dot: 'bg-zinc-400' };
  };

  const tier = getScoreTier(score);

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[7px] border ${tier.bg} ${className}`}>
        <Zap className={`w-3 h-3 ${tier.color} fill-current`} />
        <span className={`text-xs font-bold ${tier.color} tabular-nums`}>{score}</span>
        {showLabel && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Ion Score</span>
        )}
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-[12px] border ${tier.bg} ${className}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-white dark:bg-zinc-900 border border-current/10 shadow-xs">
          <Zap className={`w-5 h-5 ${tier.color} fill-current`} />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tracking-tight ${tier.color} tabular-nums`}>{score}</span>
            <span className="text-xs text-zinc-400 font-medium">/ 100</span>
          </div>
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Ion Propensity • {tier.label}
          </div>
        </div>
      </div>
    );
  }

  // Medium (default)
  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-[8px] border ${tier.bg} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Ion Score:</span>
        <span className={`text-xs font-bold ${tier.color} tabular-nums`}>{score}</span>
      </div>
      {showLabel && (
        <span className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium border-l border-zinc-300 dark:border-zinc-700 pl-1.5">
          {tier.label}
        </span>
      )}
    </div>
  );
};
