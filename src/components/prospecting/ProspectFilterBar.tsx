import React from 'react';
import { useLeadion, ProspectFilter } from '../../context/LeadionContext';
import { Flame, Clock, Zap, UserPlus, CheckCircle2 } from 'lucide-react';

export const ProspectFilterBar: React.FC = () => {
  const { prospectFilter, setProspectFilter, leads, todayMetrics } = useLeadion();

  const filterTabs: Array<{
    id: ProspectFilter;
    label: string;
    icon: React.ReactNode;
    count: number;
    highlight?: boolean;
  }> = [
    {
      id: 'all',
      label: 'Fila de Hoje',
      icon: <Flame className="w-3.5 h-3.5" />,
      count: leads.length,
    },
    {
      id: 'overdue',
      label: 'Atrasados / Urgentes',
      icon: <Clock className="w-3.5 h-3.5" />,
      count: todayMetrics.overdueCount,
      highlight: todayMetrics.overdueCount > 0,
    },
    {
      id: 'high_score',
      label: 'Alta Propensão (Ion 90+)',
      icon: <Zap className="w-3.5 h-3.5" />,
      count: todayMetrics.highScoreCount,
    },
    {
      id: 'first_touch',
      label: 'Primeiro Toque',
      icon: <UserPlus className="w-3.5 h-3.5" />,
      count: leads.filter((l) => l.timing.cadenceStep === 1).length,
    },
    {
      id: 'due_today',
      label: 'Em Aberto',
      icon: <Clock className="w-3.5 h-3.5" />,
      count: leads.filter((l) => l.timing.status === 'due_today').length,
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
      {filterTabs.map((tab) => {
        const isActive = prospectFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setProspectFilter(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border ${
              isActive
                ? 'bg-[#635BFF] border-[#635BFF] text-white shadow-xs'
                : tab.highlight
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:border-amber-400'
                : 'bg-white dark:bg-[#141720] border-[#E6E8EC] dark:border-[#232836] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <span className={isActive ? 'text-white' : tab.highlight ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
