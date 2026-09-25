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
  Cloud,
  LogOut,
  User as UserIcon
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
    openDataManagementModal,
    currentUser,
    openAuthModal,
    signOut,
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
    <header className="hidden md:flex sticky top-0 z-20 bg-white/90 dark:bg-[#111319]/90 backdrop-blur-md border-b border-[#E6E8EC] dark:border-[#232836] px-4 sm:px-8 py-3.5 items-center justify-between gap-4">
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
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Search */}
        <div className="relative hidden sm:block w-40 md:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-[#E6E8EC] dark:border-[#232836] rounded-[11px] min-h-[38px] py-1.5 pl-8 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20"
          />
        </div>

        {/* Sync Status Badge (Offline-First Indicator) */}
        <SyncStatusBadge
          status={syncStatus}
          pendingCount={pendingMutations?.length || 0}
          conflictsCount={syncConflicts?.filter((c: any) => !c.resolved).length || 0}
          onClick={() => setIsSyncCenterModalOpen(true)}
        />

        {/* Supabase Cloud Auth Button / User Session */}
        {currentUser ? (
          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-[#E6E8EC] dark:border-[#232836] rounded-[10px] px-2.5 py-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Autenticado no Supabase" />
            <span className="text-zinc-700 dark:text-zinc-200 font-medium truncate max-w-[120px]" title={currentUser.email}>
              {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário'}
            </span>
            <button
              onClick={() => signOut()}
              title="Sair da conta Supabase"
              className="text-zinc-400 hover:text-rose-500 p-0.5 rounded transition-colors cursor-pointer ml-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-xs font-semibold border border-dashed border-[#635BFF]/50 hover:border-[#635BFF] bg-[#EEF0FF]/50 dark:bg-[#1E1D38]/50 text-[#635BFF] dark:text-[#9A94FF] hover:bg-[#EEF0FF] dark:hover:bg-[#1E1D38] transition-colors cursor-pointer"
            title="Conectar sua conta ao Supabase"
          >
            <Cloud className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Entrar</span>
          </button>
        )}

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
            aria-label="Adicionar empresa"
          >
            <span className="hidden sm:inline">Adicionar empresa</span>
            <span className="sm:hidden">Empresa</span>
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewLeadModalOpen(true)}
            className="shadow-xs"
            aria-label="Nova prospecção"
          >
            <span className="hidden sm:inline">Nova prospecção</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Alternar tema claro/escuro"
          className="min-w-[40px] min-h-[40px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center p-2 rounded-[10px] border border-[#E6E8EC] dark:border-[#232836] bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>
      </div>
    </header>
  );
};
