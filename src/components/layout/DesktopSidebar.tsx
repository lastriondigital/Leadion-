import React from 'react';
import { 
  Flame, 
  Building2, 
  GitFork, 
  FileText, 
  ShieldAlert, 
  Briefcase, 
  CalendarDays, 
  BarChart3, 
  Settings, 
  Zap,
  ChevronRight,
  ExternalLink,
  Scale
} from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';
import { DesktopNavId } from '../../core/types/navigation';

interface SidebarItem {
  id: DesktopNavId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const DesktopSidebar: React.FC = () => {
  const { activeNav, setActiveNav, todayMetrics } = useLeadion();

  const primaryNavItems: SidebarItem[] = [
    { id: 'today', label: 'Hoje', icon: Flame, badge: todayMetrics.totalDueToday },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'funnels', label: 'Funis', icon: GitFork },
    { id: 'scripts', label: 'Scripts', icon: FileText },
  ];

  const salesSupportItems: SidebarItem[] = [
    { id: 'qualification', label: 'Qualificação', icon: Scale },
    { id: 'objections', label: 'Objeções', icon: ShieldAlert },
    { id: 'services', label: 'Serviços', icon: Briefcase },
    { id: 'calendar', label: 'Agenda', icon: CalendarDays },
  ];

  const bottomNavItems: SidebarItem[] = [
    { id: 'statistics', label: 'Estatísticas', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#111319] border-r border-[#E6E8EC] dark:border-[#232836] shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E6E8EC]/80 dark:border-[#232836]/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#635BFF] flex items-center justify-center text-white shadow-xs">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white">
                LEADION
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF]">
                OS
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Sales Execution Engine
            </p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Execution */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Execução Ativa
          </div>
          <nav className="space-y-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#635BFF] dark:text-[#9A94FF]' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? 'bg-[#635BFF] text-white'
                          : 'bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Intelligence & Resources */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Armas & Inteligência
          </div>
          <nav className="space-y-1">
            {salesSupportItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#635BFF] dark:text-[#9A94FF]' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* System & Analytics */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Sistema
          </div>
          <nav className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#635BFF] dark:text-[#9A94FF]' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Principle Footer */}
      <div className="p-4 border-t border-[#E6E8EC]/80 dark:border-[#232836]/80 bg-zinc-50/70 dark:bg-[#0D0F14]/70">
        <div className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Foco do Turno</span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
          &ldquo;Transformar prospecção em execução.&rdquo;
        </p>
      </div>
    </aside>
  );
};
