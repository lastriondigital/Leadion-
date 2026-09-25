import React, { useState } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { 
  Cloud, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  Key, 
  Copy, 
  Code, 
  ExternalLink,
  Laptop,
  Check,
  X,
  Clock,
  Layers,
  ShieldCheck,
  Split
} from 'lucide-react';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  testSupabaseConnection, 
  runSupabaseDiagnostics,
  maskApiKey,
  sanitizeSupabaseKey,
  sanitizeSupabaseUrl,
  getSupabaseValidationStatus,
  SUPABASE_SQL_SCHEMA 
} from '../../core/supabase/supabaseClient';
import { getDeviceName, getOrCreateDeviceId } from '../../core/storage/offlineEngine';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDataModal: (tab?: 'export' | 'import' | 'backup') => void;
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenDataModal,
}) => {
  const {
    syncStatus,
    pendingMutations,
    syncConflicts,
    lastSyncTime,
    lastSyncError,
    triggerCloudSync,
    openConflictResolutionModal,
    simulateRemoteConflict
  } = useLeadion() as any;

  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'status' | 'supabase' | 'conflicts'>('status');

  // Configuração do Supabase
  const [credentials, setCredentials] = useState(() => getSupabaseCredentials());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(credentials.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(credentials.anonKey);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Erro inesperado' });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSaveCredentials = () => {
    const cleanUrl = sanitizeSupabaseUrl(supabaseUrlInput);
    const cleanKey = sanitizeSupabaseKey(supabaseKeyInput);
    setSupabaseUrlInput(cleanUrl);
    setSupabaseKeyInput(cleanKey);
    saveSupabaseCredentials(cleanUrl, cleanKey);
    setCredentials(getSupabaseCredentials());
    showToast('Credenciais do Supabase salvas e validadas!', 'success');
    handleTestConnection();
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    showToast('Script SQL copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  const handleForceSync = async () => {
    if (triggerCloudSync) {
      await triggerCloudSync();
      showToast('Sincronização concluída com sucesso.', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[22px] shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#232836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Central de Sincronização & Nuvem
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Arquitetura Offline-First, múltiplos dispositivos e integração com Supabase.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-3 border-b border-zinc-100 dark:border-[#232836] flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'status'
                ? 'border-[#635BFF] text-[#635BFF] dark:text-[#9A94FF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Status & Fila Offline ({pendingMutations?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conflicts')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'conflicts'
                ? 'border-[#635BFF] text-[#635BFF] dark:text-[#9A94FF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Conflitos ({syncConflicts?.filter((c: any) => !c.resolved).length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'supabase'
                ? 'border-[#635BFF] text-[#635BFF] dark:text-[#9A94FF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Configurar Supabase</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: STATUS & FILA OFFLINE */}
          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* Card Indicador Principal */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#181B24] flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  {syncStatus === 'synced' && (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                  {syncStatus === 'syncing' && (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-[#635BFF] flex items-center justify-center shrink-0">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                  {syncStatus === 'offline' && (
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <WifiOff className="w-5 h-5" />
                    </div>
                  )}
                  {syncStatus === 'error' && (
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                      {syncStatus === 'synced' && 'Sistema Sincronizado'}
                      {syncStatus === 'syncing' && 'Sincronizando com a Nuvem...'}
                      {syncStatus === 'offline' && 'Modo Offline Ativo'}
                      {syncStatus === 'error' && 'Erro de Sincronização'}
                    </div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5 flex items-center gap-2">
                      <span>Dispositivo: <strong>{getDeviceName()}</strong></span>
                      <span>&bull;</span>
                      <span>Última sincronização: {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Recentemente'}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleForceSync}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />}
                  disabled={syncStatus === 'syncing'}
                >
                  Sincronizar Agora
                </Button>
              </div>

              {lastSyncError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{lastSyncError}</span>
                </div>
              )}

              {/* Fila de Mutações Pendentes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#635BFF]" />
                    <span>Fila de Mutações Pendentes ({pendingMutations?.length || 0})</span>
                  </h4>
                  <span className="text-[11px] text-zinc-400">Gravadas localmente no storage offline</span>
                </div>

                {(!pendingMutations || pendingMutations.length === 0) ? (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-400 text-[11px]">
                    Nenhuma alteração pendente. Todas as empresas, scripts e atividades estão totalmente atualizados.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {pendingMutations.map((m: any) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#181B24] flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                            m.operation === 'CREATE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                            m.operation === 'UPDATE' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' :
                            'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {m.operation}
                          </span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {m.entityType}: {m.entityId}
                          </span>
                        </div>
                        <span className="text-zinc-400 text-[10px]">
                          {new Date(m.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões Rápidos para Backup & Importação */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#181B24] flex items-center justify-between">
                <div>
                  <div className="font-bold text-zinc-800 dark:text-zinc-200">
                    Backup e Exportação
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Crie snapshots locais ou exporte planilhas CSV para segurança externa.
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenDataModal('backup');
                  }}
                >
                  Abrir Gerenciador de Backups
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: CONFLITOS DE SINCRONIZAÇÃO */}
          {activeTab === 'conflicts' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-zinc-600 dark:text-zinc-300 space-y-1">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  Controle de Conflitos Concorrentes
                </p>
                <p>
                  O LEADION nunca sobrescreve silenciosamente dados diferentes editados em outro dispositivo.
                  Quando há divergência de conteúdo na mesma entidade, um conflito é sinalizado para sua decisão deliberada.
                </p>
              </div>

              <div className="space-y-2">
                {(!syncConflicts || syncConflicts.filter((c: any) => !c.resolved).length === 0) ? (
                  <div className="p-6 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Nenhum conflito pendente!
                    </p>
                    <p className="text-[11px]">
                      Todas as alterações coincidem com as versões mais recentes dos seus dispositivos.
                    </p>
                    {simulateRemoteConflict && (
                      <button
                        type="button"
                        onClick={simulateRemoteConflict}
                        className="mt-2 text-xs text-[#635BFF] hover:underline"
                      >
                        [Simular conflito multi-dispositivo para teste]
                      </button>
                    )}
                  </div>
                ) : (
                  syncConflicts.filter((c: any) => !c.resolved).map((conf: any) => (
                    <div
                      key={conf.id}
                      className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {conf.entityTitle}
                          </span>
                          <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-1.5 py-0.2 rounded font-bold">
                            {conf.entityType}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1">
                          {conf.conflictingFields.length} campos divergentes: {conf.conflictingFields.join(', ')}
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openConflictResolutionModal(conf)}
                        icon={<Split className="w-3.5 h-3.5" />}
                      >
                        Resolver Conflito
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONFIGURAÇÃO SUPABASE */}
          {activeTab === 'supabase' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Parâmetros de Conexão Supabase
                </h4>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Configuração oficial de conexão com o banco PostgreSQL no Supabase para sincronização em tempo real e backup.
                </p>
              </div>

              {/* Card de Diagnóstico e Validação */}
              {credentials.validationError ? (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Configuração do Supabase ausente ou incompleta</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Para sincronizar com a nuvem, verifique se as variáveis de ambiente estão devidamente preenchidas:
                  </p>
                  <ul className="list-disc list-inside text-[11px] font-mono pl-1 space-y-0.5">
                    <li>VITE_SUPABASE_URL</li>
                    <li>VITE_SUPABASE_PUBLISHABLE_KEY</li>
                  </ul>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Status das Variáveis de Ambiente</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Válido ({credentials.keyType === 'publishable' ? 'Publishable Key' : 'Anon JWT'})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                    <div className="truncate">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">URL: </span>
                      <span className="font-mono text-zinc-500">{credentials.url || 'Não configurada'}</span>
                    </div>
                    <div className="truncate">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Chave: </span>
                      <span className="font-mono text-zinc-500">{credentials.maskedKey}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Supabase Project URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://sadhhykrhczkyrzwdlyv.supabase.co"
                    className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Supabase Publishable Key (VITE_SUPABASE_PUBLISHABLE_KEY)
                  </label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="sb_publishable_..."
                    className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-xs"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Utilize a Publishable Key (sb_publishable_...) ou Anon Key pública. Nunca utilize chaves secretas ou service_role.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveCredentials}
                  >
                    Salvar Credenciais
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={isTestingConn}
                  >
                    {isTestingConn ? 'Testando Conexão...' : 'Testar Conexão'}
                  </Button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-700 dark:text-rose-300'
                  }`}>
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Script SQL do Schema */}
              <div className="pt-2 border-t border-zinc-100 dark:border-[#232836] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-500" />
                    <span>Schema SQL das Tabelas no Supabase</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySchema}
                    className="text-xs text-[#635BFF] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSchema ? 'Copiado!' : 'Copiar SQL'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-zinc-900 text-zinc-300 font-mono text-[10px] max-h-36 overflow-y-auto">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
