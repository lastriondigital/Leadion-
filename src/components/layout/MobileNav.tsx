import React from 'react';
import { 
  Flame, 
  Building2, 
  GitFork, 
  FileText, 
  CalendarDays 
} from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';
import { MobileNavId } from '../../core/types/navigation';

export const MobileNav: React.FC = () => {
  const { activeNav, setActiveNav, todayMetrics, actions = [] } = useLeadion() as any;

  // Contagem de ações pendentes para Hoje e Agenda
  const dueTodayCount = todayMetrics?.totalDueToday || 0;
  const overdueCount = actions.filter((a: any) => a.status === 'atrasada').length;

  const tabs: Array<{ 
    id: MobileNavId; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    badge?: number;
    badgeColor?: string;
  }> = [
    { 
      id: 'today', 
      label: 'Hoje', 
      icon: Flame, 
      badge: dueTodayCount 
    },
    { 
      id: 'companies', 
      label: 'Empresas', 
      icon: Building2 
    },
    { 
      id: 'funnels', 
      label: 'Funis', 
      icon: GitFork 
    },
    { 
      id: 'scripts', 
      label: 'Scripts', 
      icon: FileText 
    },
    { 
      id: 'calendar', 
      label: 'Agenda', 
      icon: CalendarDays,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-red-500'
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111319]/95 backdrop-blur-md border-t border-[#E6E8EC] dark:border-[#232836] safe-area-bottom shadow-lg">
      <div className="grid grid-cols-5 items-center w-full px-1 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeNav === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveNav(tab.id)}
              className={`relative flex flex-col items-center justify-center min-h-[50px] py-1 rounded-xl transition-all cursor-pointer select-none ${
                isActive
                  ? 'text-[#635BFF] dark:text-[#9A94FF] font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Indicador visual de ativo no topo da aba */}
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#635BFF] dark:bg-[#9A94FF]" />
              )}

              {/* Ícone com badge */}
              <div className="relative mt-0.5">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-105 stroke-[2.3]' : 'stroke-[1.8]'}`} />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full ${tab.badgeColor || 'bg-[#635BFF]'} text-white text-[9px] font-bold flex items-center justify-center shadow-xs tabular-nums`}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Label sem quebras estranhas */}
              <span className={`text-[11px] leading-tight mt-1 whitespace-nowrap tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
