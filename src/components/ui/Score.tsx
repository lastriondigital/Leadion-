import React from 'react';
import { Zap } from 'lucide-react';

interface ScoreProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Score: React.FC<ScoreProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className = '',
  onClick,
}) => {
  const getScoreTier = (val: number) => {
    if (val >= 90) return { label: 'Alta Propensão', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/60', dot: 'bg-emerald-500' };
    if (val >= 75) return { label: 'Boa Aderência', color: 'text-[#635BFF] dark:text-[#9A94FF]', bg: 'bg-[#EEF0FF] dark:bg-[#1E1D38] border-[#635BFF]/20', dot: 'bg-[#635BFF]' };
    if (val >= 60) return { label: 'Moderada', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/60', dot: 'bg-amber-500' };
    return { label: 'Baixa', color: 'text-zinc-500 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700', dot: 'bg-zinc-400' };
  };

  const tier = getScoreTier(score);
  const interactiveClasses = onClick ? 'cursor-pointer hover:opacity-90 active:scale-[0.98] transition-transform' : '';

  if (size === 'sm') {
    return (
      <div 
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        title={onClick ? `Score ${score}/100: Toque para entender o cálculo` : `Score ${score}/100`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border ${tier.bg} ${interactiveClasses} ${className}`}
      >
        <Zap className={`w-3.5 h-3.5 ${tier.color} fill-current shrink-0`} />
        <span className={`text-xs font-bold ${tier.color} tabular-nums`}>{score}</span>
        <span className="text-[10px] text-zinc-400 font-medium">/100</span>
        {showLabel && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium border-l border-zinc-300 dark:border-zinc-700 pl-1.5">
            Score
          </span>
        )}
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div 
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`flex items-center gap-3 p-3.5 rounded-[12px] border ${tier.bg} ${interactiveClasses} ${className}`}
      >
        <div className="flex items-center justify-center w-11 h-11 rounded-[10px] bg-white dark:bg-zinc-900 border border-current/10 shadow-xs shrink-0">
          <Zap className={`w-5 h-5 ${tier.color} fill-current`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${tier.color} tabular-nums`}>{score}</span>
            <span className="text-xs text-zinc-400 font-medium">/ 100</span>
          </div>
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
            Ion Propensity • {tier.label}
          </div>
        </div>
      </div>
    );
  }

  // Medium (default)
  return (
    <div 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[9px] border ${tier.bg} ${interactiveClasses} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${tier.dot} shrink-0`} />
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Score:</span>
        <span className={`text-sm font-bold ${tier.color} tabular-nums`}>{score}</span>
        <span className="text-[11px] text-zinc-400 font-medium">/100</span>
      </div>
      {showLabel && (
        <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium border-l border-zinc-300 dark:border-zinc-700 pl-2">
          {tier.label}
        </span>
      )}
    </div>
  );
};
