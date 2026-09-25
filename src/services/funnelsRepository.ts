import { getSupabaseClient } from '../core/supabase/supabaseClient';
import { FunnelEntity } from '../core/types/funnel';

/**
 * REPOSITORY DE FUNIS & CADÊNCIAS NO SUPABASE
 * Centraliza persistência de funis e etapas no PostgreSQL.
 */

const PRIMARY_TABLE = 'leadion_funnels';
const FALLBACK_TABLE = 'funnels';

function mapRowToFunnel(row: any): FunnelEntity {
  return {
    id: row.id,
    name: row.name,
    code: row.code || row.id,
    description: row.description || '',
    status: row.status || 'active',
    isDefault: Boolean(row.is_default),
    stages: row.stages || [],
    version: row.version ?? 1,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapFunnelToRow(f: FunnelEntity, userId?: string | null): Record<string, any> {
  const row: Record<string, any> = {
    id: f.id,
    name: f.name,
    code: f.code || f.id,
    description: f.description || '',
    is_default: Boolean(f.isDefault),
    stages: f.stages || [],
    version: f.version ?? 1,
    status: f.status || 'active',
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    row.user_id = userId;
  }

  return row;
}

export async function fetchFunnelsFromSupabase(): Promise<{
  success: boolean;
  data: FunnelEntity[];
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

    const funnels = (data || []).map(mapRowToFunnel);
    return { success: true, data: funnels };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function upsertFunnelToSupabase(
  funnel: FunnelEntity,
  userId?: string | null
): Promise<{
  success: boolean;
  funnel?: FunnelEntity;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client não configurado.' };
  }

  const row = mapFunnelToRow(funnel, userId);

  try {
    let { error } = await client.from(PRIMARY_TABLE).upsert(row, { onConflict: 'id' });

    if (error && error.code === '42P01') {
      const fallbackRes = await client.from(FALLBACK_TABLE).upsert(row, { onConflict: 'id' });
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, funnel };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteFunnelFromSupabase(id: string): Promise<{
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

export async function bulkUpsertFunnelsToSupabase(
  funnels: FunnelEntity[],
  userId?: string | null
): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client || funnels.length === 0) {
    return { success: false, count: 0, error: 'Cliente não disponível ou lista vazia.' };
  }

  const rows = funnels.map((f) => mapFunnelToRow(f, userId));

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
