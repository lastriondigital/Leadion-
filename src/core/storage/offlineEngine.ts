/**
 * LEADION OFFLINE-FIRST STORAGE & SYNC ENGINE
 * Garante funcionamento 100% offline, persistência estruturada em IndexedDB e sincronização segura com Supabase.
 */

import { idbPut, idbDelete, idbGetAll, idbClear, STORES } from './indexedDB';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced' | 'pending' | 'error';

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
  id: string;
  entity: EntityType;
  entityType: EntityType;
  local_id: string;
  remote_id?: string | null;
  entityId: string;
  operation: MutationOperation;
  payload: any;
  created_at: string;
  updated_at: string;
  timestamp: string;
  createdAt: string;
  attempts: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'synced' | 'sync_error';
  last_error?: string | null;
  nextRetryAt?: number | null;
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

export const RETRY_BACKOFF_MS = [2000, 5000, 15000, 30000] as const;
export const MAX_RETRY_ATTEMPTS = RETRY_BACKOFF_MS.length; // 4 tentativas

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
  try {
    let devId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!devId) {
      devId = 'dev-' + generateSecureUUID();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, devId);
    }
    return devId;
  } catch {
    return 'dev-local';
  }
}

/**
 * Obtém ou define um nome amigável para este dispositivo (ex: "MacBook Pro - Escritório")
 */
export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Dispositivo Web';
  try {
    let name = localStorage.getItem(STORAGE_KEYS.DEVICE_NAME);
    if (!name) {
      const userAgent = navigator.userAgent;
      let platform = 'Navegador Web';
      if (userAgent.includes('Android')) platform = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'Dispositivo iOS';
      else if (userAgent.includes('Macintosh')) platform = 'Mac';
      else if (userAgent.includes('Windows')) platform = 'Windows PC';
      else if (userAgent.includes('Linux')) platform = 'Linux';
      name = `${platform} (${getOrCreateDeviceId().slice(-6)})`;
      localStorage.setItem(STORAGE_KEYS.DEVICE_NAME, name);
    }
    return name;
  } catch {
    return 'Dispositivo Local';
  }
}

/**
 * Normaliza registro da fila para garantir todos os campos obrigatórios
 */
function normalizeMutation(raw: any): OfflineMutation {
  const now = new Date().toISOString();
  const entityType: EntityType = raw.entityType || raw.entity || 'company';
  const entityId: string = raw.entityId || raw.local_id || raw.remote_id || generateSecureUUID();
  const created = raw.created_at || raw.createdAt || raw.timestamp || now;
  const attempts = typeof raw.attempts === 'number' ? raw.attempts : (typeof raw.retryCount === 'number' ? raw.retryCount : 0);

  return {
    id: raw.id || 'op-' + generateSecureUUID(),
    entity: entityType,
    entityType,
    local_id: raw.local_id || entityId,
    remote_id: raw.remote_id ?? null,
    entityId,
    operation: raw.operation || 'UPDATE',
    payload: raw.payload ?? null,
    created_at: created,
    updated_at: raw.updated_at || raw.timestamp || created,
    timestamp: raw.timestamp || raw.updated_at || created,
    createdAt: created,
    attempts,
    retryCount: attempts,
    status: raw.status || 'pending',
    last_error: raw.last_error ?? null,
    nextRetryAt: raw.nextRetryAt ?? null,
    version: raw.version || 1,
    deviceId: raw.deviceId || getOrCreateDeviceId(),
    deletedAt: raw.deletedAt ?? (raw.operation === 'DELETE' ? created : null),
  };
}

/**
 * Carrega a fila de mutações pendentes de sincronização (síncrono para boot rápido + hidratação IndexedDB)
 */
export function loadPendingQueue(): OfflineMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_QUEUE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeMutation);
  } catch (err) {
    console.error('Erro ao ler fila offline:', err);
    return [];
  }
}

/**
 * Hidrata a fila de mutações a partir do IndexedDB (garante persistência mesmo se localStorage for limpo)
 */
export async function hydrateQueueFromIndexedDB(): Promise<OfflineMutation[]> {
  try {
    const idbItems = await idbGetAll<OfflineMutation>(STORES.SYNC_QUEUE);
    const localItems = loadPendingQueue();
    if (idbItems.length === 0 && localItems.length === 0) return [];

    const map = new Map<string, OfflineMutation>();
    for (const item of localItems) {
      map.set(item.id, normalizeMutation(item));
    }
    for (const item of idbItems) {
      const norm = normalizeMutation(item);
      const existing = map.get(norm.id);
      if (!existing || new Date(norm.updated_at).getTime() >= new Date(existing.updated_at).getTime()) {
        map.set(norm.id, norm);
      }
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    savePendingQueue(merged);
    return merged;
  } catch {
    return loadPendingQueue();
  }
}

/**
 * Salva a fila de mutações pendentes no IndexedDB e localStorage
 */
export function savePendingQueue(queue: OfflineMutation[]): void {
  if (typeof window === 'undefined') return;
  const normalized = queue.map(normalizeMutation);
  try {
    localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(normalized));
  } catch (e) {
    console.warn('Aviso ao gravar fila no localStorage:', e);
  }

  // Persiste de forma confiável no IndexedDB
  try {
    idbClear(STORES.SYNC_QUEUE)
      .then(() => Promise.all(normalized.map((item) => idbPut(STORES.SYNC_QUEUE, item))))
      .catch(() => {});
  } catch {}
}

/**
 * Enfileira uma mutação offline com estrutura de auditoria completa (sync_queue)
 */
export function enqueueOfflineMutation(
  entityType: EntityType,
  operation: MutationOperation,
  entityId: string,
  payload: any,
  version: number = 1,
  remoteId?: string | null
): OfflineMutation {
  const queue = loadPendingQueue();
  const now = new Date().toISOString();

  const mutation: OfflineMutation = {
    id: 'op-' + generateSecureUUID(),
    entity: entityType,
    entityType,
    local_id: entityId,
    remote_id: remoteId ?? payload?.remote_id ?? null,
    entityId,
    operation,
    payload,
    created_at: now,
    updated_at: now,
    timestamp: now,
    createdAt: now,
    attempts: 0,
    retryCount: 0,
    status: 'pending',
    last_error: null,
    nextRetryAt: null,
    version,
    deviceId: getOrCreateDeviceId(),
    deletedAt: operation === 'DELETE' ? now : null,
  };

  if (operation === 'DELETE') {
    // Se o registro foi criado offline e ainda não foi sincronizado, mas já queremos manter o histórico da fila ou consolidar:
    // Removemos mutações pendentes anteriores dessa mesma entidade e enfileiramos o DELETE
    const filtered = queue.filter((m) => !(m.entityId === entityId && m.entityType === entityType));
    filtered.push(mutation);
    savePendingQueue(filtered);
    return mutation;
  }

  // Se for UPDATE e já existir CREATE ou UPDATE pendente na fila para a mesma entidade, atualizamos o payload
  const existingIdx = queue.findIndex(
    (m) => m.entityId === entityId && m.entityType === entityType && (m.operation === 'UPDATE' || m.operation === 'CREATE')
  );

  if (existingIdx >= 0 && operation === 'UPDATE') {
    const prev = queue[existingIdx];
    const mergedPayload =
      prev.payload && typeof prev.payload === 'object' && payload && typeof payload === 'object'
        ? { ...prev.payload, ...payload }
        : payload ?? prev.payload;

    queue[existingIdx] = {
      ...prev,
      payload: mergedPayload,
      updated_at: now,
      timestamp: now,
      status: 'pending',
      last_error: null,
      nextRetryAt: null,
      version: Math.max(prev.version, version) + 1,
    };
    savePendingQueue(queue);
    return queue[existingIdx];
  }

  queue.push(mutation);
  savePendingQueue(queue);
  return mutation;
}

/**
 * Registra falha de tentativa de sincronização com backoff progressivo (2s, 5s, 15s, 30s -> sync_error)
 */
export function recordMutationFailure(
  mutationId: string,
  errorMessage: string
): (OfflineMutation & { nextDelayMs: number | null; exhausted: boolean }) | null {
  const queue = loadPendingQueue();
  const idx = queue.findIndex((m) => m.id === mutationId);
  if (idx < 0) return null;

  const current = queue[idx];
  const nextAttempts = (current.attempts || 0) + 1;
  const now = new Date().toISOString();

  const exhausted = nextAttempts >= MAX_RETRY_ATTEMPTS;
  const backoffDelay = exhausted
    ? null
    : RETRY_BACKOFF_MS[Math.min(nextAttempts - 1, RETRY_BACKOFF_MS.length - 1)];

  const updated: OfflineMutation & { nextDelayMs: number | null; exhausted: boolean } = {
    ...current,
    attempts: nextAttempts,
    retryCount: nextAttempts,
    updated_at: now,
    status: exhausted ? 'sync_error' : 'pending',
    last_error: errorMessage,
    lastError: errorMessage,
    nextRetryAt: backoffDelay ? Date.now() + backoffDelay : null,
    nextDelayMs: backoffDelay,
    exhausted,
  };

  queue[idx] = updated;
  savePendingQueue(queue);
  return updated;
}

/**
 * Reseta o contador de tentativas para permitir nova sincronização manual ou quando a conexão retorna
 */
export function resetMutationsForRetry(): OfflineMutation[] {
  const queue = loadPendingQueue();
  const now = new Date().toISOString();
  const updated = queue.map((m) => ({
    ...m,
    status: 'pending' as const,
    attempts: 0,
    retryCount: 0,
    nextRetryAt: null,
    updated_at: now,
  }));
  savePendingQueue(updated);
  return updated;
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
  } catch {
    return [];
  }
}

/**
 * Hidrata conflitos do IndexedDB
 */
export async function hydrateConflictsFromIndexedDB(): Promise<SyncConflict[]> {
  try {
    const idbItems = await idbGetAll<SyncConflict>(STORES.SYNC_CONFLICTS);
    const localItems = loadSyncConflicts();
    if (idbItems.length === 0 && localItems.length === 0) return [];
    const map = new Map<string, SyncConflict>();
    localItems.forEach((c) => map.set(c.id, c));
    idbItems.forEach((c) => map.set(c.id, c));
    const merged = Array.from(map.values());
    saveSyncConflicts(merged);
    return merged;
  } catch {
    return loadSyncConflicts();
  }
}

/**
 * Salva a lista de conflitos de sincronização
 */
export function saveSyncConflicts(conflicts: SyncConflict[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CONFLICTS, JSON.stringify(conflicts));
  } catch {}
  try {
    idbClear(STORES.SYNC_CONFLICTS)
      .then(() => Promise.all(conflicts.map((c) => idbPut(STORES.SYNC_CONFLICTS, c))))
      .catch(() => {});
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
    if (['updatedAt', 'updated_at', 'createdAt', 'created_at', 'version', 'deviceId', 'device_id', 'lastSyncedAt', 'sync_status', 'synced_at', 'local_id', 'remote_id', 'deleted_at'].includes(key)) continue;

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
