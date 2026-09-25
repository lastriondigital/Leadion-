/**
 * LEADION OFFLINE-FIRST STORAGE & SYNC ENGINE
 * Garante funcionamento 100% offline, persistência estruturada em IndexedDB e sincronização segura com Supabase.
 */

import { idbGet, idbPut, idbDelete, idbGetAll, idbClear, STORES } from './indexedDB';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending' | 'error';

export type EntityType = 
  | 'company' 
  | 'script' 
  | 'funnel' 
  | 'service' 
  | 'action' 
  | 'activity' 
  | 'objection' 
  | 'qualification' 
  | 'setting';

export type MutationOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export interface OfflineMutation {
  id: string; // operation_id
  entityType: EntityType; // entity
  entityId: string; // entity_id
  operation: MutationOperation;
  payload: any;
  timestamp: string; // created_at
  createdAt: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'synced';
  version: number;
  deviceId: string;
  deletedAt?: string | null;
}

export interface SyncConflict {
  id: string;
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  detectedAt: string;
  localVersion: number;
  remoteVersion: number;
  localTimestamp: string;
  remoteTimestamp: string;
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  conflictingFields: string[];
  resolved: boolean;
  resolvedAt?: string;
  resolutionStrategy?: 'keep_local' | 'keep_remote' | 'custom_merge';
}

const STORAGE_KEYS = {
  DEVICE_ID: 'leadion_device_id',
  DEVICE_NAME: 'leadion_device_name',
  PENDING_QUEUE: 'leadion_pending_sync_queue',
  CONFLICTS: 'leadion_sync_conflicts',
  LAST_SYNC_TIME: 'leadion_last_sync_timestamp',
  SYNC_ERROR: 'leadion_last_sync_error',
};

/**
 * Gera um UUID seguro v4 usando crypto.randomUUID ou fallback robusto
 */
export function generateSecureUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Obtém ou inicializa o identificador único deste dispositivo/navegador
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server-device-id';
  let devId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!devId) {
    devId = 'dev-' + generateSecureUUID();
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, devId);
  }
  return devId;
}

/**
 * Obtém ou define um nome amigável para este dispositivo (ex: "MacBook Pro - Escritório")
 */
export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Dispositivo Web';
  let name = localStorage.getItem(STORAGE_KEYS.DEVICE_NAME);
  if (!name) {
    const userAgent = navigator.userAgent;
    let platform = 'Navegador Web';
    if (userAgent.includes('Macintosh')) platform = 'Mac';
    else if (userAgent.includes('Windows')) platform = 'Windows PC';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'Dispositivo iOS';
    else if (userAgent.includes('Android')) platform = 'Android';
    else if (userAgent.includes('Linux')) platform = 'Linux';
    name = `${platform} (${getOrCreateDeviceId().slice(-6)})`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_NAME, name);
  }
  return name;
}

/**
 * Carrega a fila de mutações pendentes de sincronização
 */
export function loadPendingQueue(): OfflineMutation[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.PENDING_QUEUE);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler fila offline:', err);
    return [];
  }
}

/**
 * Salva a fila de mutações pendentes
 */
export function savePendingQueue(queue: OfflineMutation[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(queue));
  
  // Persiste em background no IndexedDB
  try {
    idbClear(STORES.SYNC_QUEUE).then(() => {
      queue.forEach((item) => idbPut(STORES.SYNC_QUEUE, item));
    }).catch(() => {});
  } catch {}
}

/**
 * Enfileira uma mutação offline com estrutura de auditoria completa
 */
export function enqueueOfflineMutation(
  entityType: EntityType,
  operation: MutationOperation,
  entityId: string,
  payload: any,
  version: number = 1
): OfflineMutation {
  const queue = loadPendingQueue();
  const now = new Date().toISOString();
  
  const mutation: OfflineMutation = {
    id: 'op-' + generateSecureUUID(),
    entityType,
    entityId,
    operation,
    payload,
    timestamp: now,
    createdAt: now,
    retryCount: 0,
    status: 'pending',
    version,
    deviceId: getOrCreateDeviceId(),
    deletedAt: operation === 'DELETE' ? now : null,
  };

  // Se for UPDATE e já existir UPDATE na fila para a mesma entidade, mesclamos
  const existingIdx = queue.findIndex(
    (m) => m.entityId === entityId && m.entityType === entityType && m.operation === operation
  );

  if (existingIdx >= 0 && operation === 'UPDATE') {
    queue[existingIdx] = {
      ...queue[existingIdx],
      payload: { ...queue[existingIdx].payload, ...payload },
      timestamp: mutation.timestamp,
      createdAt: mutation.timestamp,
      version: Math.max(queue[existingIdx].version, version) + 1,
    };
  } else if (existingIdx >= 0 && operation === 'DELETE') {
    // Se foi deletado, remove qualquer criação ou atualização pendente anterior e coloca apenas o DELETE
    const filtered = queue.filter((m) => !(m.entityId === entityId && m.entityType === entityType));
    filtered.push(mutation);
    savePendingQueue(filtered);
    return mutation;
  } else {
    queue.push(mutation);
  }

  savePendingQueue(queue);
  return mutation;
}

/**
 * Remove uma mutação confirmada da fila offline
 */
export function dequeueOfflineMutation(mutationId: string): void {
  const queue = loadPendingQueue().filter((m) => m.id !== mutationId);
  savePendingQueue(queue);
  idbDelete(STORES.SYNC_QUEUE, mutationId).catch(() => {});
}

/**
 * Limpa toda a fila offline após sincronização com sucesso
 */
export function clearPendingQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.PENDING_QUEUE);
  idbClear(STORES.SYNC_QUEUE).catch(() => {});
}

/**
 * Carrega a lista de conflitos de sincronização
 */
export function loadSyncConflicts(): SyncConflict[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.CONFLICTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

/**
 * Salva a lista de conflitos de sincronização
 */
export function saveSyncConflicts(conflicts: SyncConflict[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CONFLICTS, JSON.stringify(conflicts));
  try {
    idbClear(STORES.SYNC_CONFLICTS).then(() => {
      conflicts.forEach((c) => idbPut(STORES.SYNC_CONFLICTS, c));
    }).catch(() => {});
  } catch {}
}

/**
 * Registra um conflito detectado (quando nuvem e dispositivo local têm alterações divergentes)
 */
export function recordSyncConflict(conflict: Omit<SyncConflict, 'id' | 'detectedAt' | 'resolved'>): SyncConflict {
  const conflicts = loadSyncConflicts();
  const newConflict: SyncConflict = {
    ...conflict,
    id: 'conf-' + generateSecureUUID(),
    detectedAt: new Date().toISOString(),
    resolved: false,
  };

  const filtered = conflicts.filter((c) => c.entityId !== conflict.entityId || c.resolved);
  filtered.push(newConflict);
  saveSyncConflicts(filtered);
  return newConflict;
}

/**
 * Marca um conflito como resolvido com a estratégia escolhida pelo usuário
 */
export function resolveSyncConflict(
  conflictId: string,
  strategy: 'keep_local' | 'keep_remote' | 'custom_merge'
): void {
  const conflicts = loadSyncConflicts();
  const updated = conflicts.map((c) => {
    if (c.id === conflictId) {
      return {
        ...c,
        resolved: true,
        resolvedAt: new Date().toISOString(),
        resolutionStrategy: strategy,
      };
    }
    return c;
  });
  saveSyncConflicts(updated);
}

/**
 * Detecta campos divergentes entre versão local e remota
 */
export function detectFieldConflicts(
  localObj: Record<string, any>,
  remoteObj: Record<string, any>,
  fieldsToCheck?: string[]
): string[] {
  const differingFields: string[] = [];
  const keys = fieldsToCheck || Array.from(new Set([...Object.keys(localObj || {}), ...Object.keys(remoteObj || {})]));

  for (const key of keys) {
    if (['updatedAt', 'version', 'deviceId', 'lastSyncedAt', 'sync_status', 'synced_at'].includes(key)) continue;

    const valLocal = JSON.stringify(localObj?.[key]);
    const valRemote = JSON.stringify(remoteObj?.[key]);

    if (valLocal !== valRemote) {
      differingFields.push(key);
    }
  }

  return differingFields;
}

/**
 * Armazena e lê o timestamp da última sincronização realizada
 */
export function getLastSyncTimestamp(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
}

export function setLastSyncTimestamp(isoTimestamp: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, isoTimestamp);
}

/**
 * Armazena e lê o último erro de sincronização
 */
export function getLastSyncError(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.SYNC_ERROR);
}

export function setLastSyncError(errorMsg: string | null): void {
  if (typeof window === 'undefined') return;
  if (!errorMsg) {
    localStorage.removeItem(STORAGE_KEYS.SYNC_ERROR);
  } else {
    localStorage.setItem(STORAGE_KEYS.SYNC_ERROR, errorMsg);
  }
}
