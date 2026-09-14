import React from 'react';
import { 
  CheckCircle2, 
  RefreshCw, 
  WifiOff, 
  AlertTriangle,
  Cloud,
  Layers
} from 'lucide-react';
import { SyncStatus } from '../../core/storage/offlineEngine';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  pendingCount: number;
  lastSyncTime?: string | null;
  conflictsCount: number;
  onClick: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  pendingCount,
  lastSyncTime,
  conflictsCount,
  onClick,
}) => {
  // Formata hora amigável (ex: 14:32)
  const formatTime = (iso?: string | null) => {
    if (!iso) return 'Agora';
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recentemente';
    }
  };

  if (conflictsCount > 0) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer animate-pulse"
        title="Existem conflitos de sincronização aguardando resolução!"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span>{conflictsCount} conflito{conflictsCount > 1 ? 's' : ''}</span>
      </button>
    );
  }

  switch (status) {
    case 'synced':
      return (
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-all cursor-pointer"
          title={`Sincronizado às ${formatTime(lastSyncTime)}. Clique para abrir a Central de Dados.`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Sincronizado</span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 sm:hidden">Ok</span>
        </button>
      );

    case 'syncing':
      return (
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-[#635BFF] dark:text-[#9A94FF] border border-indigo-200/80 dark:border-indigo-800/60 hover:bg-indigo-100/60 transition-all cursor-pointer"
          title="Sincronizando dados com o banco na nuvem..."
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#635BFF] animate-spin" />
          <span>Sincronizando...</span>
        </button>
      );

    case 'offline':
      return (
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100/60 transition-all cursor-pointer"
          title="Modo Offline ativo. Suas alterações estão salvas no dispositivo e serão sincronizadas quando reconectar."
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Offline</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-200/70 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-bold rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
      );

    case 'error':
      return (
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100/60 transition-all cursor-pointer"
          title="Erro de sincronização. Clique para ver detalhes e tentar novamente."
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Erro de sincronização</span>
          {pendingCount > 0 && (
            <span className="text-[10px] bg-rose-200/60 dark:bg-rose-900/60 px-1.5 py-0.2 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
      );
  }
};
