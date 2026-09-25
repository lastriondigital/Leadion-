import { getSupabaseClient } from '../core/supabase/supabaseClient';
import { ScriptEntity } from '../core/types/script';

/**
 * REPOSITORY DE SCRIPTS NO SUPABASE
 * Centraliza persistência real dos Playbooks e Construtor de Scripts no PostgreSQL.
 */

const PRIMARY_TABLE = 'leadion_scripts';
const FALLBACK_TABLE = 'scripts';

function mapRowToScript(row: any): ScriptEntity {
  return {
    id: row.id,
    name: row.name,
    channel: row.channel || 'whatsapp',
    country: row.country || 'Todos',
    gender: row.gender || 'all',
    niche: row.niche || '',
    serviceId: row.service_id || 'all',
    serviceName: row.service_name,
    funnelId: row.funnel_id || 'all',
    funnelName: row.funnel_name,
    variables: row.variables || [],
    content: row.content || '',
    previousScriptId: row.previous_script_id,
    nextScriptId: row.next_script_id,
    condition: row.condition || '',
    delay: row.delay || { value: 0, unit: 'hours', event: 'manual' },
    status: row.status || 'active',
    sequenceOrder: row.sequence_order,
    sequenceType: row.sequence_type,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapScriptToRow(s: ScriptEntity, userId?: string | null): Record<string, any> {
  const row: Record<string, any> = {
    id: s.id,
    name: s.name,
    channel: s.channel,
    country: s.country || 'Todos',
    gender: s.gender || 'all',
    niche: s.niche || '',
    service_id: s.serviceId || 'all',
    service_name: s.serviceName || null,
    funnel_id: s.funnelId || 'all',
    funnel_name: s.funnelName || null,
    variables: s.variables || [],
    content: s.content,
    previous_script_id: s.previousScriptId || null,
    next_script_id: s.nextScriptId || null,
    condition: s.condition || '',
    delay: s.delay || null,
    status: s.status || 'active',
    sequence_order: s.sequenceOrder ?? null,
    sequence_type: s.sequenceType || null,
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    row.user_id = userId;
  }

  return row;
}

export async function fetchScriptsFromSupabase(): Promise<{
  success: boolean;
  data: ScriptEntity[];
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: [], error: 'Supabase client não configurado.' };
  }

  try {
    let { data, error } = await client
      .from(PRIMARY_TABLE)
      .select('*')
      .order('name', { ascending: true });

    if (error && error.code === '42P01') {
      const fallbackRes = await client.from(FALLBACK_TABLE).select('*').order('name', { ascending: true });
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    const scripts = (data || []).map(mapRowToScript);
    return { success: true, data: scripts };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function upsertScriptToSupabase(
  script: ScriptEntity,
  userId?: string | null
): Promise<{
  success: boolean;
  script?: ScriptEntity;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client não configurado.' };
  }

  const row = mapScriptToRow(script, userId);

  try {
    let { error } = await client.from(PRIMARY_TABLE).upsert(row, { onConflict: 'id' });

    if (error && error.code === '42P01') {
      const fallbackRes = await client.from(FALLBACK_TABLE).upsert(row, { onConflict: 'id' });
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, script };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteScriptFromSupabase(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client não configurado.' };
  }

  try {
    let { error } = await client.from(PRIMARY_TABLE).delete().eq('id', id);

    if (error && error.code === '42P01') {
      const fallbackRes = await client.from(FALLBACK_TABLE).delete().eq('id', id);
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function bulkUpsertScriptsToSupabase(
  scripts: ScriptEntity[],
  userId?: string | null
): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client || scripts.length === 0) {
    return { success: false, count: 0, error: 'Cliente não disponível ou lista vazia.' };
  }

  const rows = scripts.map((s) => mapScriptToRow(s, userId));

  try {
    let { error } = await client.from(PRIMARY_TABLE).upsert(rows, { onConflict: 'id' });

    if (error && error.code === '42P01') {
      const fallbackRes = await client.from(FALLBACK_TABLE).upsert(rows, { onConflict: 'id' });
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: rows.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message };
  }
}
