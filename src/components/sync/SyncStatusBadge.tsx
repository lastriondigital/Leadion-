import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';
import { SyncStatus } from '../../core/storage/offlineEngine';

export interface SyncStatusBadgeProps {
  status?: SyncStatus;
  pendingCount?: number;
  lastSyncTime?: string | null;
  conflictsCount?: number;
  onClick?: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = () => {
  const {
    syncStatus,
    pendingMutations,
    syncConflicts,
    setIsSyncCenterModalOpen,
    triggerCloudSync,
    userAccount,
  } = useLeadion();

  const unresolvedConflicts = syncConflicts.filter((c) => !c.resolved).length;
  const pendingCount = pendingMutations.length;
  const isLocalOnly = userAccount?.accountType === 'local';
  const isOffline = syncStatus === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine);

  const getBadgeConfig = () => {
    if (unresolvedConflicts > 0) {
      return {
        label: `${unresolvedConflicts} Conflito${unresolvedConflicts > 1 ? 's' : ''}`,
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />,
        bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25',
        dot: 'bg-amber-400',
        stateCode: 'SYNC_CONFLICT',
      };
    }

    if (isOffline) {
      return {
        label:
          pendingCount > 0
            ? `Offline · ${pendingCount} ${pendingCount === 1 ? 'alteração pendente' : 'alterações pendentes'}`
            : isLocalOnly
            ? 'Conta Local · Offline'
            : 'Offline',
        icon: <CloudOff className="w-3.5 h-3.5 text-amber-400" />,
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20',
        dot: 'bg-amber-400',
        stateCode: 'OFFLINE',
      };
    }

    if (isLocalOnly) {
      return {
        label: pendingCount > 0 ? `Local · ${pendingCount} pendente${pendingCount > 1 ? 's' : ''}` : 'Conta Local',
        icon: <CloudOff className="w-3.5 h-3.5 text-slate-400" />,
        bg: 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-800',
        dot: 'bg-slate-400',
        stateCode: 'LOCAL_ONLY',
      };
    }

    switch (syncStatus) {
      case 'syncing':
        return {
          label: 'Sincronizando...',
          icon: <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />,
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20',
          dot: 'bg-cyan-400',
          stateCode: 'SYNCING',
        };
      case 'pending':
        return {
          label: `${pendingCount} ${pendingCount === 1 ? 'alteração pendente' : 'alterações pendentes'}`,
          icon: <Clock className="w-3.5 h-3.5 text-indigo-400" />,
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20',
          dot: 'bg-indigo-400',
          stateCode: 'SYNC_PENDING',
        };
      case 'error':
        return {
          label: pendingCount > 0 ? `Erro de Sync · ${pendingCount} na fila` : 'Erro de Sync',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20',
          dot: 'bg-rose-400',
          stateCode: 'SYNC_ERROR',
        };
      case 'synced':
      default:
        if (pendingCount > 0) {
          return {
            label: `${pendingCount} ${pendingCount === 1 ? 'alteração pendente' : 'alterações pendentes'}`,
            icon: <Clock className="w-3.5 h-3.5 text-indigo-400" />,
            bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20',
            dot: 'bg-indigo-400',
            stateCode: 'SYNC_PENDING',
          };
        }
        return {
          label: 'Sincronizado',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20',
          dot: 'bg-emerald-400',
          stateCode: 'SYNCED',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setIsSyncCenterModalOpen(true)}
        data-sync-state={config.stateCode}
        title="Abrir Central de Sincronização & Fila Offline"
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${config.bg}`}
      >
        {config.icon}
        <span className="hidden sm:inline">{config.label}</span>
        {pendingCount > 0 && (
          <span className="sm:hidden px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-bold">
            {pendingCount}
          </span>
        )}
      </button>

      {(syncStatus === 'pending' || syncStatus === 'error' || pendingCount > 0) && !isOffline && (
        <button
          onClick={() => triggerCloudSync()}
          title="Sincronizar Agora"
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Cloud className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
