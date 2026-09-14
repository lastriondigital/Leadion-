/**
 * LEADION OFFLINE-FIRST STORAGE & SYNC ENGINE
 * Garante que nenhuma empresa, script, funil, atividade ou configuração seja perdida.
 * Funciona 100% offline, enfileira mutações locais e sincroniza quando a conexão é restabelecida.
 */

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

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
  entityType: EntityType;
  operation: MutationOperation;
  entityId: string;
  payload: any;
  timestamp: string;
  version: number;
  deviceId: string;
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

export interface HistoricalPriceSnapshot {
  serviceId: string;
  serviceName: string;
  serviceVersion: number;
  currency: string;
  myPrice: number;
  marketMinPrice?: number;
  marketMaxPrice?: number;
  capturedAt: string;
  country: string;
}

export interface HistoricalScriptSnapshot {
  scriptId: string;
  scriptName: string;
  scriptVersion: number;
  channel: string;
  renderedContent: string;
  hook?: string;
  valueProposition?: string;
  cta?: string;
  dispatchedAt: string;
}

export interface HistoricalStageSnapshot {
  funnelId: string;
  funnelName: string;
  stageId: string;
  stageName: string;
  order: number;
  transitionedAt: string;
}

export interface HistoricalQualificationSnapshot {
  questionId: string;
  questionText: string;
  selectedOptionKey: string;
  selectedOptionText: string;
  scoreAwarded: number;
  evaluatedAt: string;
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
 * Obtém ou inicializa o identificador único deste dispositivo/navegador
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server-device-id';
  let devId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!devId) {
    devId = 'dev-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
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
    name = `${platform} (${getOrCreateDeviceId().slice(-4)})`;
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
}

/**
 * Enfileira uma mutação offline de forma atômica
 */
export function enqueueOfflineMutation(
  entityType: EntityType,
  operation: MutationOperation,
  entityId: string,
  payload: any,
  version: number = 1
): OfflineMutation {
  const queue = loadPendingQueue();
  const mutation: OfflineMutation = {
    id: 'mut-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    entityType,
    operation,
    entityId,
    payload,
    timestamp: new Date().toISOString(),
    version,
    deviceId: getOrCreateDeviceId(),
  };

  // Se já houver mutação para a mesma entidade na fila, coalescemos inteligentemente
  const existingIdx = queue.findIndex(
    (m) => m.entityId === entityId && m.entityType === entityType && m.operation === operation
  );

  if (existingIdx >= 0 && operation === 'UPDATE') {
    // Mescla payload preservando histórico
    queue[existingIdx] = {
      ...queue[existingIdx],
      payload: { ...queue[existingIdx].payload, ...payload },
      timestamp: mutation.timestamp,
      version: Math.max(queue[existingIdx].version, version) + 1,
    };
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
}

/**
 * Limpa toda a fila offline após sincronização com sucesso
 */
export function clearPendingQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.PENDING_QUEUE);
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
}

/**
 * Registra um conflito detectado (quando nuvem e dispositivo local têm alterações divergentes)
 * Regra de ouro: NÃO SOBRESCREVER SILENCIOSAMENTE!
 */
export function recordSyncConflict(conflict: Omit<SyncConflict, 'id' | 'detectedAt' | 'resolved'>): SyncConflict {
  const conflicts = loadSyncConflicts();
  const newConflict: SyncConflict = {
    ...conflict,
    id: 'conf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    detectedAt: new Date().toISOString(),
    resolved: false,
  };

  // Substitui se já houver conflito não resolvido para este ID
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
  const keys = fieldsToCheck || Array.from(new Set([...Object.keys(localObj), ...Object.keys(remoteObj)]));

  for (const key of keys) {
    // Ignora metadados internos de sync
    if (['updatedAt', 'version', 'deviceId', 'lastSyncedAt'].includes(key)) continue;

    const valLocal = JSON.stringify(localObj[key]);
    const valRemote = JSON.stringify(remoteObj[key]);

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
