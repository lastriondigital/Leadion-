import React from 'react';
import { 
  Search, 
  Plus, 
  Moon, 
  Sun, 
  Zap, 
  SlidersHorizontal,
  Bell,
  Database,
  Cloud
} from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { SyncStatusBadge } from '../sync/SyncStatusBadge';

export const Header: React.FC = () => {
  const { 
    activeNav, 
    searchQuery, 
    setSearchQuery, 
    setIsNewLeadModalOpen,
    setIsNewCompanyModalOpen,
    setEditingCompany,
    todayMetrics,
    syncStatus,
    pendingMutations,
    syncConflicts,
    setIsSyncCenterModalOpen,
    openDataManagementModal
  } = useLeadion() as any;
  const { theme, toggleTheme } = useTheme();

  const getNavTitle = () => {
    switch (activeNav) {
      case 'today':
        return {
          title: 'Prospectar hoje',
          subtitle: 'Fila de execução prioritária. Contatos, gatilhos, scripts e próxima ação imediata.',
        };
      case 'companies':
        return {
          title: 'Empresas & Contas',
          subtitle: 'Mapeamento de contas-alvo, ICP fit e inteligência de mercado.',
        };
      case 'funnels':
        return {
          title: 'Funis & Cadências',
          subtitle: 'Esteira de conversão e cadências multicanal ativas.',
        };
      case 'scripts':
        return {
          title: 'Scripts de Abordagem',
          subtitle: 'Playbooks de conexão, ganchos comprovados e chamadas de fechamento.',
        };
      case 'objections':
        return {
          title: 'Matriz de Objeções',
          subtitle: 'Contornos táticos em tempo real para destravar conversas comerciais.',
        };
      case 'services':
        return {
          title: 'Serviços & Proposta de Valor',
          subtitle: 'Catálogo de soluções estruturadas para oferta imediata.',
        };
      case 'calendar':
        return {
          title: 'Calendário de Ações',
          subtitle: 'Próximos toques, reuniões agendadas e retornos operacionais.',
        };
      case 'statistics':
        return {
          title: 'Estatísticas Operacionais',
          subtitle: 'Eficiência de prospecção, taxas de resposta por canal e volume de reuniões.',
        };
      case 'settings':
        return {
          title: 'Configurações',
          subtitle: 'Preferências de workspace, parâmetros de cadência e canais de contato.',
        };
      default:
        return { title: 'Leadion', subtitle: 'Sales Execution Engine' };
    }
  };

  const navInfo = getNavTitle();

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#111319]/90 backdrop-blur-md border-b border-[#E6E8EC] dark:border-[#232836] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Title / Context */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
            {navInfo.title}
          </h1>
          {activeNav === 'today' && todayMetrics.totalDueToday > 0 && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF]">
              {todayMetrics.totalDueToday} para agir
            </span>
          )}
        </div>
        <p className="hidden md:block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-xl">
          {navInfo.subtitle}
        </p>
      </div>

      {/* Global Search & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search */}
        <div className="relative w-36 sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar lead ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-[#E6E8EC] dark:border-[#232836] rounded-[11px] py-1.5 pl-8 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20"
          />
        </div>

        {/* Sync Status Badge (Offline-First Indicator) */}
        <SyncStatusBadge
          status={syncStatus}
          pendingCount={pendingMutations?.length || 0}
          conflictsCount={syncConflicts?.filter((c: any) => !c.resolved).length || 0}
          onClick={() => setIsSyncCenterModalOpen(true)}
        />

        {/* Data & Backup Quick Action Button */}
        <Button
          variant="outline"
          size="sm"
          icon={<Database className="w-3.5 h-3.5 text-[#635BFF]" />}
          onClick={() => openDataManagementModal('backup')}
          className="hidden lg:inline-flex"
        >
          <span>Backup & Dados</span>
        </Button>

        {/* New Action Button */}
        {activeNav === 'companies' ? (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingCompany(null);
              setIsNewCompanyModalOpen(true);
            }}
            className="shadow-xs"
          >
            <span className="hidden sm:inline">Nova Empresa</span>
            <span className="sm:hidden">Empresa</span>
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewLeadModalOpen(true)}
            className="shadow-xs"
          >
            <span className="hidden sm:inline">Nova Prospecção</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Alternar tema claro/escuro"
          className="p-2 rounded-[10px] border border-[#E6E8EC] dark:border-[#232836] bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>
      </div>
    </header>
  );
};
