import { getSupabaseClient } from '../core/supabase/supabaseClient';
import { ObjectionEntity } from '../core/types/objection';

/**
 * REPOSITORY DE OBJEÇÕES NO SUPABASE
 * Centraliza persistência da Biblioteca de Objeções e Mini-funis.
 */

const PRIMARY_TABLE = 'leadion_objections';
const FALLBACK_TABLE = 'objections';

function mapRowToObjection(row: any): ObjectionEntity {
  return {
    id: row.id,
    name: row.name,
    category: row.category || 'outros',
    description: row.description || '',
    conditions: row.conditions || [],
    sequences: row.sequences || [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapObjectionToRow(o: ObjectionEntity, userId?: string | null): Record<string, any> {
  const row: Record<string, any> = {
    id: o.id,
    name: o.name,
    category: o.category,
    description: o.description || '',
    conditions: o.conditions || [],
    sequences: o.sequences || [],
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    row.user_id = userId;
  }

  return row;
}

export async function fetchObjectionsFromSupabase(): Promise<{
  success: boolean;
  data: ObjectionEntity[];
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

    const list = (data || []).map(mapRowToObjection);
    return { success: true, data: list };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function upsertObjectionToSupabase(
  objection: ObjectionEntity,
  userId?: string | null
): Promise<{
  success: boolean;
  objection?: ObjectionEntity;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client não configurado.' };
  }

  const row = mapObjectionToRow(objection, userId);

  try {
    let { error } = await client.from(PRIMARY_TABLE).upsert(row, { onConflict: 'id' });

    if (error && error.code === '42P01') {
      const fallbackRes = await client.from(FALLBACK_TABLE).upsert(row, { onConflict: 'id' });
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, objection };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteObjectionFromSupabase(id: string): Promise<{
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

export async function bulkUpsertObjectionsToSupabase(
  objections: ObjectionEntity[],
  userId?: string | null
): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client || objections.length === 0) {
    return { success: false, count: 0, error: 'Cliente não disponível ou lista vazia.' };
  }

  const rows = objections.map((o) => mapObjectionToRow(o, userId));

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
