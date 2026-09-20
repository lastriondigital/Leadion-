import React from 'react';
import { 
  X, 
  ShieldAlert, 
  Briefcase, 
  BarChart3, 
  Settings, 
  Scale, 
  Database, 
  Cloud, 
  Sun, 
  Moon, 
  ChevronRight,
  ArrowDownUp
} from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';
import { useTheme } from '../../context/ThemeContext';
import { DesktopNavId } from '../../core/types/navigation';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    activeNav, 
    setActiveNav,
    setIsSyncCenterModalOpen,
    openDataManagementModal
  } = useLeadion() as any;
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  const handleNavClick = (id: DesktopNavId) => {
    setActiveNav(id);
    onClose();
  };

  const handleDataClick = (tab: 'backup' | 'export' | 'import' | 'reset') => {
    if (openDataManagementModal) {
      openDataManagementModal(tab);
    }
    onClose();
  };

  const handleSyncClick = () => {
    if (setIsSyncCenterModalOpen) {
      setIsSyncCenterModalOpen(true);
    }
    onClose();
  };

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click to close */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-[#15181F] border-t border-[#E6E8EC] dark:border-[#232836] rounded-t-[22px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Handle / Header */}
        <div className="p-4 border-b border-[#E6E8EC]/80 dark:border-[#232836]/80 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-[#1A1D26]">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Mais Opções
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              Secundárias
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Seção 1: Apoio Comercial */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2">
              Apoio Comercial & Vendas
            </div>

            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => handleNavClick('objections')}
                className={`flex items-center justify-between w-full p-3 rounded-xl text-left transition-colors min-h-[48px] cursor-pointer ${
                  activeNav === 'objections'
                    ? 'bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF] font-semibold'
                    : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-[#635BFF] dark:text-[#9A94FF]" />
                  <div>
                    <div className="text-xs sm:text-sm font-semibold">Matriz de Objeções</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Contornos táticos para conversas comerciais</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                onClick={() => handleNavClick('services')}
                className={`flex items-center justify-between w-full p-3 rounded-xl text-left transition-colors min-h-[48px] cursor-pointer ${
                  activeNav === 'services'
                    ? 'bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF] font-semibold'
                    : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="text-xs sm:text-sm font-semibold">Serviços & Catálogo</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Ofertas, escopos e preços multipaís</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                onClick={() => handleNavClick('qualification')}
                className={`flex items-center justify-between w-full p-3 rounded-xl text-left transition-colors min-h-[48px] cursor-pointer ${
                  activeNav === 'qualification'
                    ? 'bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF] font-semibold'
                    : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-indigo-500" />
                  <div>
                    <div className="text-xs sm:text-sm font-semibold">Qualificação & Scores</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Critérios de ICP e pesos prioritários</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                onClick={() => handleNavClick('statistics')}
                className={`flex items-center justify-between w-full p-3 rounded-xl text-left transition-colors min-h-[48px] cursor-pointer ${
                  activeNav === 'statistics'
                    ? 'bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF] font-semibold'
                    : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-xs sm:text-sm font-semibold">Estatísticas Operacionais</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Conversão, canais e métricas de funil</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Seção 2: Configurações & Sistema */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2">
              Configurações & Administração
            </div>

            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => handleNavClick('settings')}
                className={`flex items-center justify-between w-full p-3 rounded-xl text-left transition-colors min-h-[48px] cursor-pointer ${
                  activeNav === 'settings'
                    ? 'bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF] font-semibold'
                    : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-zinc-500" />
                  <div>
                    <div className="text-xs sm:text-sm font-semibold">Configurações Gerais</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Workspace, cadências e canais</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Aparência: Tema Claro / Escuro */}
              <div className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 min-h-[48px]">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Aparência
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Modo {theme === 'dark' ? 'Escuro' : 'Claro'} ativo
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Alternar Tema
                </button>
              </div>

              {/* Backup & Dados */}
              <button
                onClick={() => handleDataClick('backup')}
                className="flex items-center justify-between w-full p-3 rounded-xl text-left text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 transition-colors min-h-[48px] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-[#635BFF]" />
                  <div>
                    <div className="text-xs sm:text-sm font-semibold">Backup & Dados</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Snapshots locais e restauração</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Importar / Exportar */}
              <button
                onClick={() => handleDataClick('export')}
                className="flex items-center justify-between w-full p-3 rounded-xl text-left text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 transition-colors min-h-[48px] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ArrowDownUp className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-xs sm:text-sm font-semibold">Importar & Exportar</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Planilhas CSV e formato JSON</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Sincronização */}
              <button
                onClick={handleSyncClick}
                className="flex items-center justify-between w-full p-3 rounded-xl text-left text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 transition-colors min-h-[48px] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5 text-cyan-500" />
                  <div>
                    <div className="text-xs sm:text-sm font-semibold">Sincronização & Nuvem</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Offline-first e banco Supabase</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
