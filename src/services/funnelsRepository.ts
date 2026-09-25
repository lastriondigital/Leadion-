import { getSupabaseClient } from '../core/supabase/supabaseClient';
import { FunnelEntity } from '../core/types/funnel';

/**
 * REPOSITORY DE FUNIS & CADÊNCIAS NO SUPABASE
 * Centraliza persistência de funis e etapas no PostgreSQL.
 */

const PRIMARY_TABLE = 'leadion_funnels';
const FALLBACK_TABLE = 'funnels';

function mapRowToFunnel(row: any): FunnelEntity {
  let stages = Array.isArray(row.stages) ? row.stages : [];
  let embeddedMeta: any = null;
  const metaIdx = stages.findIndex((s: any) => s.id === '__leadion_flow_metadata__');
  if (metaIdx >= 0) {
    try {
      embeddedMeta = JSON.parse(stages[metaIdx].description || '{}');
      stages = stages.filter((s: any) => s.id !== '__leadion_flow_metadata__');
    } catch {}
  }

  return {
    id: row.id,
    name: row.name,
    code: row.code || row.id,
    description: row.description || '',
    channel: row.channel || embeddedMeta?.channel || 'whatsapp',
    objective: row.objective || embeddedMeta?.objective || 'primeiro_contacto',
    status: row.status || 'active',
    isDefault: Boolean(row.is_default),
    stages,
    sequences: Array.isArray(row.sequences) && row.sequences.length > 0 ? row.sequences : (embeddedMeta?.sequences || row.metadata?.sequences || []),
    flowNodes: Array.isArray(row.flow_nodes) && row.flow_nodes.length > 0 ? row.flow_nodes : (embeddedMeta?.flowNodes || row.flowNodes || row.metadata?.flowNodes || []),
    flowEdges: Array.isArray(row.flow_edges) && row.flow_edges.length > 0 ? row.flow_edges : (embeddedMeta?.flowEdges || row.flowEdges || row.metadata?.flowEdges || []),
    flowViewport: row.flow_viewport || embeddedMeta?.flowViewport || row.flowViewport || row.metadata?.flowViewport || { x: 0, y: 0, zoom: 1 },
    funnelScripts: Array.isArray(row.funnel_scripts) && row.funnel_scripts.length > 0 ? row.funnel_scripts : (embeddedMeta?.funnelScripts || row.funnelScripts || row.metadata?.funnelScripts || []),
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
    channel: f.channel || 'whatsapp',
    objective: f.objective || 'primeiro_contacto',
    is_default: Boolean(f.isDefault),
    stages: f.stages || [],
    sequences: f.sequences || [],
    flow_nodes: f.flowNodes || [],
    flow_edges: f.flowEdges || [],
    flow_viewport: f.flowViewport || { x: 0, y: 0, zoom: 1 },
    funnel_scripts: f.funnelScripts || [],
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
    } else if (error && error.code === '42703') {
      // Se colunas como sequences/flow_nodes não existirem na tabela remota,
      // empacota com segurança dentro do JSON de stages
      const legacyStagesWithMeta = [
        ...funnel.stages,
        {
          id: '__leadion_flow_metadata__',
          name: '__METADATA__',
          order: 9999,
          color: 'zinc' as const,
          description: JSON.stringify({
            channel: funnel.channel,
            objective: funnel.objective,
            sequences: funnel.sequences,
            flowNodes: funnel.flowNodes,
            flowEdges: funnel.flowEdges,
            flowViewport: funnel.flowViewport,
            funnelScripts: funnel.funnelScripts,
          }),
        },
      ];
      const legacyRow: Record<string, any> = {
        id: funnel.id,
        name: funnel.name,
        code: funnel.code || funnel.id,
        description: funnel.description || '',
        is_default: Boolean(funnel.isDefault),
        stages: legacyStagesWithMeta,
        version: funnel.version ?? 1,
        status: funnel.status || 'active',
        updated_at: new Date().toISOString(),
      };
      if (userId) legacyRow.user_id = userId;
      const retryRes = await client.from(PRIMARY_TABLE).upsert(legacyRow, { onConflict: 'id' });
      error = retryRes.error;
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
