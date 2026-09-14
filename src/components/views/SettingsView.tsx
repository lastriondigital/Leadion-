import React from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Settings, Moon, Sun, RotateCcw, ShieldCheck, Zap } from 'lucide-react';
import { INITIAL_LEADS } from '../../core/data/initialData';

export const SettingsView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const handleResetData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('leadion-leads');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-[15px] bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Configurações do LEADION
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
          Parâmetros do Sales OS, regras de cadência e preferências do usuário.
        </p>
      </div>

      {/* Preferences Card */}
      <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[15px] p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          Aparência & Interface
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
              Tema Visual
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Alternar entre Modo Claro (Light Mode) e Modo Escuro (Dark Mode).
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? 'Modo Escuro Ativo' : 'Modo Claro Ativo'}
          </Button>
        </div>
      </div>

      {/* Cadence Rules */}
      <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[15px] p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          Diretrizes da Esteira Outbound
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Intervalo padrão entre toques"
            defaultValue="2 dias úteis"
            readOnly
          />
          <Input
            label="Total máximo de toques na cadência"
            defaultValue="4 toques por decisor"
            readOnly
          />
        </div>

        <div className="p-3.5 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" />
          <span>
            <strong>Princípio LEADION:</strong> &ldquo;Transformar prospecção em execução.&rdquo; A cadência é projetada para reduzir o esforço cognitivo do SDR e direcionar a próxima ação em menos de 5 segundos após abrir o card.
          </span>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[15px] p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          Dados do Workspace
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
              Reiniciar Dados da Esteira
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Restaura a fila original de leads, empresas e scripts demonstrativos do Leadion.
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleResetData}
          >
            Restaurar Dados Iniciais
          </Button>
        </div>
      </div>
    </div>
  );
};
