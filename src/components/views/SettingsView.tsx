import React from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { 
  Settings, 
  Moon, 
  Sun, 
  RotateCcw, 
  ShieldCheck, 
  Zap, 
  Cloud, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle2,
  Server,
  Layers,
  Split
} from 'lucide-react';
import { getDeviceName, getOrCreateDeviceId } from '../../core/storage/offlineEngine';

export const SettingsView: React.FC = () => {
  const { 
    theme, 
    toggleTheme 
  } = useTheme();
  const { showToast } = useToast();
  const {
    syncStatus,
    pendingMutations,
    syncConflicts,
    lastSyncTime,
    lastSyncError,
    triggerCloudSync,
    setIsSyncCenterModalOpen,
    openDataManagementModal,
    simulateRemoteConflict
  } = useLeadion() as any;

  const handleResetData = () => {
    if (typeof window !== 'undefined') {
      if (confirm('Tem certeza de que deseja restaurar os dados originais? Recomendamos criar um backup antes.')) {
        localStorage.clear();
        window.location.reload();
      }
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

      {/* Offline-First & Cloud Sync (Supabase) */}
      <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[15px] p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#635BFF]" />
              <span>Arquitetura Offline-First & Nuvem (Supabase)</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              O LEADION é tolerante a falhas de rede. Todas as operações funcionam offline e sincronizam quando online.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
              syncStatus === 'syncing' ? 'bg-indigo-50 text-[#635BFF] dark:bg-indigo-950/60 dark:text-[#9A94FF] border border-indigo-200 dark:border-indigo-800' :
              syncStatus === 'offline' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
              'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {syncStatus === 'synced' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {syncStatus === 'syncing' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {syncStatus === 'offline' && <WifiOff className="w-3.5 h-3.5" />}
              {syncStatus === 'error' && <AlertTriangle className="w-3.5 h-3.5" />}
              <span className="capitalize">{syncStatus}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-1">
            <span className="text-zinc-400 block font-medium">Identificador deste Dispositivo</span>
            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate block">
              {getDeviceName()}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              ID: {getOrCreateDeviceId().slice(0, 14)}...
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-1">
            <span className="text-zinc-400 block font-medium">Fila de Mutações Offline</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {pendingMutations?.length || 0} pendentes
            </span>
            <span className="text-[10px] text-zinc-500 block">
              Gravadas no localStorage com replay automático.
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-1">
            <span className="text-zinc-400 block font-medium">Controle de Conflitos</span>
            <span className={`text-base font-bold ${
              syncConflicts?.filter((c: any) => !c.resolved).length > 0 
                ? 'text-amber-600 dark:text-amber-400' 
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {syncConflicts?.filter((c: any) => !c.resolved).length || 0} pendentes
            </span>
            <span className="text-[10px] text-zinc-500 block">
              Nunca sobrescreve dados concorrentes silenciosamente.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Cloud className="w-3.5 h-3.5" />}
            onClick={() => setIsSyncCenterModalOpen(true)}
          >
            Abrir Central de Sincronização & Supabase
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />}
            onClick={triggerCloudSync}
            disabled={syncStatus === 'syncing'}
          >
            Forçar Sincronização
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<Split className="w-3.5 h-3.5 text-amber-500" />}
            onClick={simulateRemoteConflict}
          >
            Simular Conflito de Teste
          </Button>
        </div>
      </div>

      {/* Data Management: Import, Export, Snapshots */}
      <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[15px] p-6 shadow-xs space-y-5">
        <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#635BFF]" />
            <span>Gestão de Dados, Importação/Exportação & Backups</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Preservação histórica total. Exporte para planilhas ou guarde backups JSON com restauração point-in-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                Exportar Dados
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                Exporte empresas em CSV para planilhas ou gere o arquivo JSON completo de contingência.
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => openDataManagementModal('export')}
              className="w-full justify-center"
            >
              Exportar CSV / JSON
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                Importar Dados
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                Importe planilhas CSV ou restaure backups JSON com validação e pré-visualização.
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => openDataManagementModal('import')}
              className="w-full justify-center"
            >
              Importar CSV / JSON
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                Snapshots & Backups
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                Crie pontos de restauração antes de grandes alterações e reverta com 1 clique.
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              onClick={() => openDataManagementModal('backup')}
              className="w-full justify-center"
            >
              Gerenciar Backups
            </Button>
          </div>
        </div>

        <div className="p-3.5 rounded-[12px] bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" />
          <span>
            <strong>Preservação Histórica Garantida:</strong> No LEADION, mudanças futuras em preços, scripts, etapas de funil ou critérios de qualificação <strong>nunca destroem registros históricos</strong>. Transições e ações passadas são armazenadas com snapshots imutáveis.
          </span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-[#141720] border border-rose-200 dark:border-rose-900/50 rounded-[15px] p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 pb-2 border-b border-rose-100 dark:border-rose-950">
          Zona de Recuperação do Workspace
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
            className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950"
          >
            Restaurar Dados Iniciais
          </Button>
        </div>
      </div>
    </div>
  );
};
