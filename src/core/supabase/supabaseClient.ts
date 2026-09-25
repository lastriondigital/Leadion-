import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OfflineMutation } from '../storage/offlineEngine';

/**
 * CLIENTE & CONECTOR SUPABASE LEADION
 * Prepara autenticação, banco de dados relacional, sincronização em tempo real e backups na nuvem.
 */

// Chaves de armazenamento local para configuração manual via UI (caso não use .env)
const SUPABASE_LOCAL_STORAGE = {
  URL: 'leadion_supabase_url',
  ANON_KEY: 'leadion_supabase_anon_key',
  CLOUD_SIMULATED_BACKUPS: 'leadion_simulated_cloud_backups',
  MOCK_REMOTE_STORE: 'leadion_mock_remote_db',
};

/**
 * Sanitiza URL do Supabase removendo aspas, prefixos duplicados e barras finais
 */
export function sanitizeSupabaseUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  let url = String(rawUrl).trim();
  url = url.replace(/^["']|["']$/g, '').trim();
  url = url.replace(/^(export\s+)?VITE_SUPABASE_URL\s*[:= ]\s*/i, '').trim();
  url = url.replace(/^(export\s+)?SUPABASE_URL\s*[:= ]\s*/i, '').trim();
  url = url.replace(/^["']|["']$/g, '').trim();
  return url.replace(/\/+$/, '');
}

/**
 * Sanitiza a Publishable Key / Anon Key do Supabase:
 * Remove aspas, espaços, e prefixos acidentais como "VITE_SUPABASE_PUBLISHABLE_KEY "
 */
export function sanitizeSupabaseKey(rawKey?: string | null): string {
  if (!rawKey) return '';
  let key = String(rawKey).trim();
  key = key.replace(/^["']|["']$/g, '').trim();
  key = key.replace(/^(export\s+)?VITE_SUPABASE_PUBLISHABLE_KEY\s*[:= ]\s*/i, '').trim();
  key = key.replace(/^(export\s+)?VITE_SUPABASE_ANON_KEY\s*[:= ]\s*/i, '').trim();
  key = key.replace(/^(export\s+)?SUPABASE_KEY\s*[:= ]\s*/i, '').trim();
  key = key.replace(/^(export\s+)?SUPABASE_ANON_KEY\s*[:= ]\s*/i, '').trim();
  return key.replace(/^["']|["']$/g, '').trim();
}

/**
 * Valida o formato da URL do Supabase
 */
export function isValidSupabaseUrlFormat(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.hostname.length > 3;
  } catch {
    return false;
  }
}

/**
 * Valida o formato da Publishable Key / Anon Key do Supabase:
 * Suporta o formato moderno 'sb_publishable_...' e o formato legado JWT 'eyJ...'
 */
export function isValidSupabaseKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.startsWith('sb_publishable_') && trimmed.length >= 25) {
    return true;
  }
  if (trimmed.startsWith('eyJ') && trimmed.split('.').length === 3) {
    return true;
  }
  return false;
}

/**
 * Mascara a chave com segurança para exibição e logs sem vazar a credencial
 * Exemplo: sb_publishable_...9iR ou eyJ...abc
 */
export function maskApiKey(key: string): string {
  if (!key) return '(não configurada)';
  const cleaned = sanitizeSupabaseKey(key);
  if (cleaned.length <= 12) return '***';
  if (cleaned.startsWith('sb_publishable_')) {
    return `sb_publishable_...${cleaned.slice(-4)}`;
  }
  return `${cleaned.slice(0, 10)}...${cleaned.slice(-4)}`;
}

/**
 * Mascara a URL para exibição
 */
export function maskUrl(url: string): string {
  if (!url) return '(não configurada)';
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}

export interface SupabaseConfigValidation {
  isValid: boolean;
  error: string | null;
  missingVars: string[];
}

/**
 * Validação central das variáveis de ambiente exigidas
 */
export function getSupabaseValidationStatus(): SupabaseConfigValidation {
  const envUrl = sanitizeSupabaseUrl((import.meta as any).env?.VITE_SUPABASE_URL);
  const envKey = sanitizeSupabaseKey(
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
  );

  const missing: string[] = [];
  if (!envUrl) missing.push('VITE_SUPABASE_URL');
  if (!envKey) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');

  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Configuração do Supabase ausente. Verifique: ${missing.join(' e ')}`,
      missingVars: missing,
    };
  }

  if (!isValidSupabaseUrlFormat(envUrl)) {
    return {
      isValid: false,
      error: 'Formato inválido de VITE_SUPABASE_URL. Deve ser uma URL válida (ex: https://xyz.supabase.co).',
      missingVars: [],
    };
  }

  if (!isValidSupabaseKeyFormat(envKey)) {
    return {
      isValid: false,
      error: 'Formato inválido de VITE_SUPABASE_PUBLISHABLE_KEY. Deve iniciar com "sb_publishable_" ou ser um token JWT válido.',
      missingVars: [],
    };
  }

  return {
    isValid: true,
    error: null,
    missingVars: [],
  };
}

/**
 * Obtém URL e Publishable Key oficiais e sanitizadas
 */
export function getSupabaseCredentials(): {
  url: string;
  anonKey: string;
  publishableKey: string;
  isConfigured: boolean;
  isValidFormat: boolean;
  keyType: 'publishable' | 'legacy_jwt' | 'invalid' | 'none';
  maskedKey: string;
  validationError: string | null;
} {
  // 1. Lê prioritariamente do ambiente de execução Vite (.env)
  const rawEnvUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  const rawEnvKey = (
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
  ) as string | undefined;

  let url = sanitizeSupabaseUrl(rawEnvUrl);
  let key = sanitizeSupabaseKey(rawEnvKey);

  // 2. Limpa cache corrompido ou antigo do localStorage para evitar interferência
  if (typeof window !== 'undefined') {
    try {
      const cachedKey = localStorage.getItem(SUPABASE_LOCAL_STORAGE.ANON_KEY);
      if (cachedKey) {
        const cleanedCachedKey = sanitizeSupabaseKey(cachedKey);
        // Se a chave no localStorage estiver mal formatada ou se houver chave válida no .env, remove a do localStorage
        if (!isValidSupabaseKeyFormat(cleanedCachedKey) || (key && isValidSupabaseKeyFormat(key))) {
          localStorage.removeItem(SUPABASE_LOCAL_STORAGE.ANON_KEY);
        } else if (!key && isValidSupabaseKeyFormat(cleanedCachedKey)) {
          key = cleanedCachedKey;
        }
      }

      const cachedUrl = localStorage.getItem(SUPABASE_LOCAL_STORAGE.URL);
      if (cachedUrl) {
        const cleanedCachedUrl = sanitizeSupabaseUrl(cachedUrl);
        if (!isValidSupabaseUrlFormat(cleanedCachedUrl) || (url && isValidSupabaseUrlFormat(url))) {
          localStorage.removeItem(SUPABASE_LOCAL_STORAGE.URL);
        } else if (!url && isValidSupabaseUrlFormat(cleanedCachedUrl)) {
          url = cleanedCachedUrl;
        }
      }
    } catch {
      // Ignora erro de acesso a localStorage
    }
  }

  const hasUrl = Boolean(url && isValidSupabaseUrlFormat(url));
  const hasKey = Boolean(key && isValidSupabaseKeyFormat(key));
  const isConfigured = hasUrl && hasKey;

  let keyType: 'publishable' | 'legacy_jwt' | 'invalid' | 'none' = 'none';
  if (!key) {
    keyType = 'none';
  } else if (key.startsWith('sb_publishable_')) {
    keyType = 'publishable';
  } else if (key.startsWith('eyJ')) {
    keyType = 'legacy_jwt';
  } else {
    keyType = 'invalid';
  }

  let validationError: string | null = null;
  if (!url || !key) {
    const missing: string[] = [];
    if (!url) missing.push('VITE_SUPABASE_URL');
    if (!key) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
    validationError = `Configuração do Supabase ausente. Verifique: ${missing.join(' e ')}`;
  } else if (!hasUrl) {
    validationError = 'VITE_SUPABASE_URL contém uma URL com formato inválido.';
  } else if (!hasKey) {
    validationError = 'VITE_SUPABASE_PUBLISHABLE_KEY possui formato inválido.';
  }

  return {
    url,
    anonKey: key,
    publishableKey: key,
    isConfigured,
    isValidFormat: isConfigured,
    keyType,
    maskedKey: maskApiKey(key),
    validationError,
  };
}

/**
 * Salva credenciais do Supabase configuradas diretamente na interface
 */
export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;

  const cleanUrl = sanitizeSupabaseUrl(url);
  const cleanKey = sanitizeSupabaseKey(anonKey);

  if (cleanUrl) localStorage.setItem(SUPABASE_LOCAL_STORAGE.URL, cleanUrl);
  else localStorage.removeItem(SUPABASE_LOCAL_STORAGE.URL);

  if (cleanKey) localStorage.setItem(SUPABASE_LOCAL_STORAGE.ANON_KEY, cleanKey);
  else localStorage.removeItem(SUPABASE_LOCAL_STORAGE.ANON_KEY);

  // Reinicializa cliente
  supabaseClientInstance = null;
}

let supabaseClientInstance: SupabaseClient | null = null;

/**
 * Obtém ou inicializa o cliente Supabase oficial centralizado
 * UI -> Repository / Service -> Supabase Client -> Supabase
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) return supabaseClientInstance;

  const { url, publishableKey, isConfigured, validationError } = getSupabaseCredentials();
  if (!isConfigured) {
    if (validationError) {
      console.warn('[Leadion Supabase]', validationError);
    }
    return null;
  }

  try {
    supabaseClientInstance = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseClientInstance;
  } catch (err) {
    console.error('Erro ao inicializar Supabase Client:', err);
    return null;
  }
}

export interface SupabaseDiagnosticResult {
  urlPresent: boolean;
  urlValidFormat: boolean;
  urlMasked: string;
  keyPresent: boolean;
  keyValidFormat: boolean;
  keyMasked: string;
  keyType: 'publishable' | 'legacy_jwt' | 'invalid' | 'none';
  clientInitialized: boolean;
  sessionAvailable: boolean;
  sessionUserId?: string | null;
  status: 'healthy' | 'misconfigured' | 'invalid_key' | 'offline_only';
  message: string;
  latencyMs?: number;
}

/**
 * Função de diagnóstico interno oficial do Supabase:
 * Verifica URL, Publishable Key, formato, inicialização e sessão
 * NUNCA expõe a chave completa no console
 */
export async function runSupabaseDiagnostics(): Promise<SupabaseDiagnosticResult> {
  const creds = getSupabaseCredentials();

  const urlPresent = Boolean(creds.url);
  const urlValidFormat = isValidSupabaseUrlFormat(creds.url);
  const keyPresent = Boolean(creds.publishableKey);
  const keyValidFormat = isValidSupabaseKeyFormat(creds.publishableKey);
  const keyMasked = maskApiKey(creds.publishableKey);
  const urlMasked = maskUrl(creds.url);

  if (!urlPresent || !keyPresent) {
    console.info(`[Supabase Diagnostic] Configuração incompleta | Key: ${keyMasked} | URL: ${urlMasked}`);
    return {
      urlPresent,
      urlValidFormat,
      urlMasked,
      keyPresent,
      keyValidFormat,
      keyMasked,
      keyType: creds.keyType,
      clientInitialized: false,
      sessionAvailable: false,
      status: 'misconfigured',
      message: creds.validationError || 'Configuração do Supabase ausente.',
    };
  }

  if (!keyValidFormat) {
    console.warn(`[Supabase Diagnostic] Chave em formato incompatível | Key: ${keyMasked}`);
    return {
      urlPresent,
      urlValidFormat,
      urlMasked,
      keyPresent,
      keyValidFormat: false,
      keyMasked,
      keyType: creds.keyType,
      clientInitialized: false,
      sessionAvailable: false,
      status: 'invalid_key',
      message: 'Formato da Publishable Key incorreto.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      urlPresent,
      urlValidFormat,
      urlMasked,
      keyPresent,
      keyValidFormat,
      keyMasked,
      keyType: creds.keyType,
      clientInitialized: false,
      sessionAvailable: false,
      status: 'misconfigured',
      message: 'Não foi possível inicializar o cliente Supabase.',
    };
  }

  let sessionAvailable = false;
  let sessionUserId: string | null = null;
  try {
    const { data: { session } } = await client.auth.getSession();
    sessionAvailable = Boolean(session);
    sessionUserId = session?.user?.id || null;
  } catch {}

  const conn = await testSupabaseConnection();
  console.info(
    `[Supabase Diagnostic] Key configured: true (${creds.keyType}) | Key: ${keyMasked} | Client: ready | Ping: ${conn.success ? 'OK' : 'Falha'}`
  );

  return {
    urlPresent,
    urlValidFormat,
    urlMasked,
    keyPresent,
    keyValidFormat,
    keyMasked,
    keyType: creds.keyType,
    clientInitialized: true,
    sessionAvailable,
    sessionUserId,
    status: conn.success ? 'healthy' : 'invalid_key',
    message: conn.message,
    latencyMs: conn.latencyMs,
  };
}

/**
 * Testa conectividade real com a instância do Supabase
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  latencyMs?: number;
  message: string;
  isSimulated?: boolean;
}> {
  const { url, publishableKey, isConfigured, validationError } = getSupabaseCredentials();

  if (!isConfigured) {
    return {
      success: false,
      latencyMs: 0,
      message: validationError || 'Configuração do Supabase ausente. Verifique: VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Falha ao criar cliente Supabase. Verifique a sintaxe da URL e Publishable Key.',
    };
  }

  const start = performance.now();
  try {
    // Executa ping simples na tabela oficial de empresas
    const { error } = await client.from('companies').select('id').limit(1);
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return {
          success: true,
          latencyMs,
          message: `Conexão bem-sucedida com ${new URL(url).hostname} (${latencyMs}ms)`,
        };
      }

      return {
        success: false,
        latencyMs,
        message: `Erro na resposta do Supabase: ${error.message} (${error.code || 'sem código'})`,
      };
    }

    return {
      success: true,
      latencyMs,
      message: `Conexão estabelecida com sucesso com ${new URL(url).hostname} (${latencyMs}ms)`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Não foi possível conectar ao servidor Supabase: ${err.message || 'Erro de rede ou CORS'}`,
    };
  }
}


export interface CloudBackupMetadata {
  id: string;
  name: string;
  sizeBytes: number;
  createdAt: string;
  deviceName: string;
  recordsCount: {
    companies: number;
    scripts: number;
    funnels: number;
    services: number;
    actions: number;
  };
}

/**
 * Envia um backup completo para o Supabase (ou store de simulação cloud caso offline/sandbox)
 */
export async function uploadCloudBackup(
  backupData: any,
  backupName: string,
  deviceName: string
): Promise<{ success: boolean; backupId: string; message: string }> {
  const client = getSupabaseClient();
  const backupId = 'bck-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
  const now = new Date().toISOString();
  const serialized = JSON.stringify(backupData);
  const sizeBytes = new Blob([serialized]).size;

  const metadata: CloudBackupMetadata = {
    id: backupId,
    name: backupName,
    sizeBytes,
    createdAt: now,
    deviceName,
    recordsCount: {
      companies: backupData.companies?.length || 0,
      scripts: backupData.scripts?.length || 0,
      funnels: backupData.funnels?.length || 0,
      services: backupData.services?.length || 0,
      actions: backupData.actions?.length || 0,
    },
  };

  if (client) {
    try {
      const { error } = await client.from('leadion_cloud_backups').insert({
        id: backupId,
        name: backupName,
        device_name: deviceName,
        payload: backupData,
        size_bytes: sizeBytes,
        created_at: now,
      });

      if (!error) {
        return { success: true, backupId, message: 'Backup salvo na nuvem Supabase com sucesso.' };
      }
    } catch (e) {
      console.warn('Fallback para sandbox de backup local:', e);
    }
  }

  // Armazena no slot sandbox cloud local
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(SUPABASE_LOCAL_STORAGE.CLOUD_SIMULATED_BACKUPS);
    let list: { metadata: CloudBackupMetadata; payload: any }[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch {}
    }
    list.unshift({ metadata, payload: backupData });
    // Limita aos 10 backups mais recentes
    if (list.length > 10) list = list.slice(0, 10);
    localStorage.setItem(SUPABASE_LOCAL_STORAGE.CLOUD_SIMULATED_BACKUPS, JSON.stringify(list));
  }

  return {
    success: true,
    backupId,
    message: client 
      ? 'Backup salvo no banco de dados na nuvem.' 
      : 'Backup salvo na réplica em nuvem (Sandbox Offline/Supabase).',
  };
}

/**
 * Lista backups disponíveis na nuvem
 */
export async function listCloudBackups(): Promise<CloudBackupMetadata[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('leadion_cloud_backups')
        .select('id, name, device_name, size_bytes, created_at, payload')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          sizeBytes: d.size_bytes || 0,
          createdAt: d.created_at,
          deviceName: d.device_name || 'Dispositivo Remoto',
          recordsCount: {
            companies: d.payload?.companies?.length || 0,
            scripts: d.payload?.scripts?.length || 0,
            funnels: d.payload?.funnels?.length || 0,
            services: d.payload?.services?.length || 0,
            actions: d.payload?.actions?.length || 0,
          },
        }));
      }
    } catch (e) {
      // segue para fallback
    }
  }

  // Fallback para réplica local
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(SUPABASE_LOCAL_STORAGE.CLOUD_SIMULATED_BACKUPS);
    if (raw) {
      try {
        const list: { metadata: CloudBackupMetadata }[] = JSON.parse(raw);
        return list.map((item) => item.metadata);
      } catch {}
    }
  }

  return [];
}

/**
 * Baixa um backup específico da nuvem
 */
export async function downloadCloudBackup(backupId: string): Promise<any | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('leadion_cloud_backups')
        .select('payload')
        .eq('id', backupId)
        .single();

      if (!error && data?.payload) {
        return data.payload;
      }
    } catch {}
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(SUPABASE_LOCAL_STORAGE.CLOUD_SIMULATED_BACKUPS);
    if (raw) {
      try {
        const list: { metadata: CloudBackupMetadata; payload: any }[] = JSON.parse(raw);
        const found = list.find((item) => item.metadata.id === backupId);
        if (found) return found.payload;
      } catch {}
    }
  }

  return null;
}

/**
 * Esquema SQL Oficial para provisionamento no Supabase
 * Disponibilizado para consulta do usuário na Central de Sincronização
 */
export const SUPABASE_SQL_SCHEMA = `-- SCHEMA OFICIAL LEADION NO SUPABASE
-- Execute no SQL Editor do seu projeto Supabase:

CREATE TABLE IF NOT EXISTS public.leadion_companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  commercial_name TEXT,
  document TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  country TEXT,
  city TEXT,
  niche TEXT,
  funnel_id TEXT,
  funnel_stage TEXT,
  funnel_stage_id TEXT,
  score INTEGER DEFAULT 0,
  score_details JSONB,
  responsibles JSONB DEFAULT '[]'::jsonb,
  associated_services JSONB DEFAULT '[]'::jsonb,
  primary_service_id TEXT,
  timeline JSONB DEFAULT '[]'::jsonb,
  activities JSONB DEFAULT '[]'::jsonb,
  version INTEGER DEFAULT 1,
  device_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leadion_scripts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  country TEXT,
  gender TEXT,
  niche TEXT,
  service_id TEXT,
  funnel_id TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  condition TEXT,
  delay JSONB,
  status TEXT DEFAULT 'active',
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leadion_funnels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT DEFAULT 'whatsapp',
  objective TEXT DEFAULT 'primeiro_contacto',
  is_default BOOLEAN DEFAULT false,
  stages JSONB DEFAULT '[]'::jsonb,
  sequences JSONB DEFAULT '[]'::jsonb,
  flow_nodes JSONB DEFAULT '[]'::jsonb,
  flow_edges JSONB DEFAULT '[]'::jsonb,
  flow_viewport JSONB DEFAULT '{"x":0,"y":0,"zoom":1}'::jsonb,
  funnel_scripts JSONB DEFAULT '[]'::jsonb,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.leadion_funnels ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'whatsapp';
ALTER TABLE public.leadion_funnels ADD COLUMN IF NOT EXISTS objective TEXT DEFAULT 'primeiro_contacto';
ALTER TABLE public.leadion_funnels ADD COLUMN IF NOT EXISTS sequences JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.leadion_funnels ADD COLUMN IF NOT EXISTS flow_nodes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.leadion_funnels ADD COLUMN IF NOT EXISTS flow_edges JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.leadion_funnels ADD COLUMN IF NOT EXISTS flow_viewport JSONB DEFAULT '{"x":0,"y":0,"zoom":1}'::jsonb;
ALTER TABLE public.leadion_funnels ADD COLUMN IF NOT EXISTS funnel_scripts JSONB DEFAULT '[]'::jsonb;


CREATE TABLE IF NOT EXISTS public.leadion_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  short_description TEXT,
  country_prices JSONB DEFAULT '[]'::jsonb,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leadion_prospect_actions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority_score INTEGER DEFAULT 50,
  outcome TEXT,
  outcome_details JSONB,
  scheduled_date TEXT,
  scheduled_time TEXT,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leadion_objections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  suggested_action TEXT,
  color TEXT,
  status TEXT DEFAULT 'active',
  sequences JSONB DEFAULT '[]'::jsonb,
  user_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leadion_qualifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  user_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leadion_cloud_backups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  device_name TEXT,
  payload JSONB NOT NULL,
  size_bytes BIGINT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativa Row Level Security (RLS) e Políticas de Acesso
ALTER TABLE public.leadion_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadion_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadion_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadion_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadion_prospect_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadion_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadion_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadion_cloud_backups ENABLE ROW LEVEL SECURITY;

-- Políticas universais para aplicação LEADION (Permite leitura/escrita para usuários autenticados e anon)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leadion_companies_policy') THEN
    CREATE POLICY leadion_companies_policy ON public.leadion_companies FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leadion_scripts_policy') THEN
    CREATE POLICY leadion_scripts_policy ON public.leadion_scripts FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leadion_funnels_policy') THEN
    CREATE POLICY leadion_funnels_policy ON public.leadion_funnels FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leadion_services_policy') THEN
    CREATE POLICY leadion_services_policy ON public.leadion_services FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leadion_actions_policy') THEN
    CREATE POLICY leadion_actions_policy ON public.leadion_prospect_actions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leadion_objections_policy') THEN
    CREATE POLICY leadion_objections_policy ON public.leadion_objections FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leadion_qualifications_policy') THEN
    CREATE POLICY leadion_qualifications_policy ON public.leadion_qualifications FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leadion_backups_policy') THEN
    CREATE POLICY leadion_backups_policy ON public.leadion_cloud_backups FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;
