/**
 * LEADION INDEXEDDB DATABASE ENGINE
 * Armazenamento local estruturado de alto desempenho para CRM Offline-First.
 * Substitui a dependência de localStorage para dados volumosos ou estruturados.
 */

const DB_NAME = 'leadion_offline_db';
const DB_VERSION = 2;

export const STORES = {
  ACCOUNTS: 'accounts',
  WORKSPACES: 'workspaces',
  COMPANIES: 'companies',
  ACTIONS: 'actions',
  SCRIPTS: 'scripts',
  FUNNELS: 'funnels',
  SERVICES: 'services',
  OBJECTIONS: 'objections',
  QUALIFICATIONS: 'qualifications',
  SETTINGS: 'settings',
  LEADS: 'leads',
  SYNC_QUEUE: 'sync_queue',
  SYNC_CONFLICTS: 'sync_conflicts',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

export function openLeadionDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB não suportado neste ambiente.'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Contas & Perfis de Usuário
      if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
        db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'userId' });
      }

      // 2. Workspaces
      if (!db.objectStoreNames.contains(STORES.WORKSPACES)) {
        db.createObjectStore(STORES.WORKSPACES, { keyPath: 'id' });
      }

      // 3. Empresas & Contas do CRM
      if (!db.objectStoreNames.contains(STORES.COMPANIES)) {
        const store = db.createObjectStore(STORES.COMPANIES, { keyPath: 'id' });
        store.createIndex('funnelId', 'funnelId', { unique: false });
        store.createIndex('sync_status', 'sync_status', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 4. Ações & Fila de Prospecção
      if (!db.objectStoreNames.contains(STORES.ACTIONS)) {
        const store = db.createObjectStore(STORES.ACTIONS, { keyPath: 'id' });
        store.createIndex('companyId', 'companyId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('sync_status', 'sync_status', { unique: false });
      }

      // 5. Scripts & Sequências
      if (!db.objectStoreNames.contains(STORES.SCRIPTS)) {
        const store = db.createObjectStore(STORES.SCRIPTS, { keyPath: 'id' });
        store.createIndex('channel', 'channel', { unique: false });
      }

      // 6. Funis & Cadências
      if (!db.objectStoreNames.contains(STORES.FUNNELS)) {
        db.createObjectStore(STORES.FUNNELS, { keyPath: 'id' });
      }

      // 7. Catálogo de Serviços
      if (!db.objectStoreNames.contains(STORES.SERVICES)) {
        db.createObjectStore(STORES.SERVICES, { keyPath: 'id' });
      }

      // 8. Objeções & Mini-Funis
      if (!db.objectStoreNames.contains(STORES.OBJECTIONS)) {
        db.createObjectStore(STORES.OBJECTIONS, { keyPath: 'id' });
      }

      // 9. Qualificações & Perguntas
      if (!db.objectStoreNames.contains(STORES.QUALIFICATIONS)) {
        db.createObjectStore(STORES.QUALIFICATIONS, { keyPath: 'id' });
      }

      // 10. Configurações & Perfil Local
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }

      // 11. Leads
      if (!db.objectStoreNames.contains(STORES.LEADS)) {
        db.createObjectStore(STORES.LEADS, { keyPath: 'id' });
      }

      // 12. Fila de Mutações Offline (sync_queue)
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const store = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        store.createIndex('entityType', 'entityType', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 13. Conflitos de Sincronização
      if (!db.objectStoreNames.contains(STORES.SYNC_CONFLICTS)) {
        db.createObjectStore(STORES.SYNC_CONFLICTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      console.error('Falha ao abrir IndexedDB:', request.error);
      dbPromise = null;
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn('IndexedDB bloqueado por outra aba.');
    };
  });

  return dbPromise;
}

/**
 * Obtém um único registro por chave primária
 */
export async function idbGet<T>(storeName: StoreName, key: IDBValidKey): Promise<T | null> {
  try {
    const db = await openLeadionDB();
    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Falha idbGet(${storeName}, ${key}):`, err);
    return null;
  }
}

/**
 * Retorna todos os registros de uma tabela
 */
export async function idbGetAll<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await openLeadionDB();
    return new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Falha idbGetAll(${storeName}):`, err);
    return [];
  }
}

/**
 * Retorna apenas os registros ativos (ignorando tombstones de exclusão pendente)
 */
export async function idbGetAllActive<T extends Record<string, any>>(storeName: StoreName): Promise<T[]> {
  const all = await idbGetAll<T>(storeName);
  return all.filter((item) => !item?.deleted_at && item?.sync_status !== 'pending_delete');
}

/**
 * Insere ou atualiza um único registro
 */
export async function idbPut<T>(storeName: StoreName, value: T): Promise<void> {
  try {
    const db = await openLeadionDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Falha idbPut(${storeName}):`, err);
  }
}

/**
 * Insere ou atualiza múltiplos registros em uma única transação atômica
 */
export async function idbBulkPut<T>(storeName: StoreName, items: T[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    const db = await openLeadionDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      items.forEach((item) => store.put(item));

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Falha idbBulkPut(${storeName}):`, err);
  }
}

/**
 * Marca um registro como excluído localmente (Tombstone) até que a exclusão seja sincronizada com o Supabase
 */
export async function idbMarkTombstone(storeName: StoreName, key: string, fallbackRecord?: Record<string, any>): Promise<void> {
  try {
    const existing = await idbGet<Record<string, any>>(storeName, key);
    const nowIso = new Date().toISOString();
    const tombstone = {
      ...(existing || fallbackRecord || { id: key }),
      id: key,
      deleted_at: nowIso,
      sync_status: 'pending_delete',
      updatedAt: nowIso,
    };
    await idbPut(storeName, tombstone);
  } catch (err) {
    console.warn(`[IndexedDB] Falha idbMarkTombstone(${storeName}, ${key}):`, err);
  }
}

/**
 * Remove definitivamente um registro por chave (usado após confirmação do DELETE no Supabase)
 */
export async function idbDelete(storeName: StoreName, key: IDBValidKey): Promise<void> {
  try {
    const db = await openLeadionDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Falha idbDelete(${storeName}, ${key}):`, err);
  }
}

/**
 * Limpa uma store inteira
 */
export async function idbClear(storeName: StoreName): Promise<void> {
  try {
    const db = await openLeadionDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Falha idbClear(${storeName}):`, err);
  }
}
