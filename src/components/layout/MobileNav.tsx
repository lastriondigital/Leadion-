import React, { useState } from 'react';
import { 
  Flame, 
  Building2, 
  GitFork, 
  FileText, 
  MoreHorizontal,
  ShieldAlert,
  Briefcase,
  CalendarDays,
  BarChart3,
  Settings,
  X,
  Scale
} from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';
import { DesktopNavId, MobileNavId } from '../../core/types/navigation';

export const MobileNav: React.FC = () => {
  const { activeNav, setActiveNav, todayMetrics } = useLeadion();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainTabs: Array<{ id: MobileNavId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }> = [
    { id: 'today', label: 'Hoje', icon: Flame, badge: todayMetrics.totalDueToday },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'funnels', label: 'Funis', icon: GitFork },
    { id: 'scripts', label: 'Scripts', icon: FileText },
    { id: 'more', label: 'Mais', icon: MoreHorizontal },
  ];

  const moreItems: Array<{ id: DesktopNavId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'qualification', label: 'Motor de Qualificação', icon: Scale },
    { id: 'objections', label: 'Objeções & Contornos', icon: ShieldAlert },
    { id: 'services', label: 'Serviços & Ofertas', icon: Briefcase },
    { id: 'calendar', label: 'Calendário de Ações', icon: CalendarDays },
    { id: 'statistics', label: 'Estatísticas', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleTabClick = (tabId: MobileNavId) => {
    if (tabId === 'more') {
      setIsMoreOpen(true);
    } else {
      setActiveNav(tabId);
      setIsMoreOpen(false);
    }
  };

  const handleMoreSelect = (navId: DesktopNavId) => {
    setActiveNav(navId);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111319]/95 backdrop-blur-md border-t border-[#E6E8EC] dark:border-[#232836] px-2 py-1.5 flex items-center justify-around safe-area-bottom">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === 'more' 
            ? ['qualification', 'objections', 'services', 'calendar', 'statistics', 'settings'].includes(activeNav) 
            : activeNav === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[56px] transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-[#635BFF] dark:text-[#8D87FF] font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#635BFF] text-white text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* "Mais" Menu Drawer */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full bg-white dark:bg-[#161922] border-t border-[#E6E8EC] dark:border-[#232836] rounded-t-[20px] p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#E6E8EC]/80 dark:border-[#232836]/80 pb-3">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Menu Adicional
              </span>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 py-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMoreSelect(item.id)}
                    className={`flex items-center gap-3 w-full p-3 rounded-[12px] text-sm font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF]'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-zinc-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
