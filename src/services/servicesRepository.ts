import { getSupabaseClient } from '../core/supabase/supabaseClient';
import { ServiceEntity } from '../core/types/service';

/**
 * REPOSITORY DE SERVIÇOS & PRECIFICAÇÃO NO SUPABASE
 * Centraliza persistência de serviços e precificação multipaís.
 */

const PRIMARY_TABLE = 'leadion_services';
const FALLBACK_TABLE = 'services';

function mapRowToService(row: any): ServiceEntity {
  return {
    id: row.id,
    name: row.name,
    code: row.code || row.id,
    description: row.description || '',
    shortDescription: row.short_description,
    status: row.status || 'active',
    countryPrices: row.country_prices || [],
    defaultFunnelId: row.default_funnel_id,
    defaultFunnelStageId: row.default_funnel_stage_id,
    defaultFunnelStage: row.default_funnel_stage || 'prospeccao',
    defaultFunnelStageName: row.default_funnel_stage_name,
    qualificationCriteria: row.qualification_criteria || [],
    qualificationQuestions: row.qualification_questions || [],
    deliverables: row.deliverables || [],
    idealCustomerProfile: row.ideal_customer_profile || '',
    coreValueProposition: row.core_value_proposition,
    standardTicket: row.standard_ticket,
    version: row.version ?? 1,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapServiceToRow(s: ServiceEntity, userId?: string | null): Record<string, any> {
  const row: Record<string, any> = {
    id: s.id,
    name: s.name,
    code: s.code || s.id,
    description: s.description || '',
    short_description: s.shortDescription || s.description || '',
    status: s.status || 'active',
    country_prices: s.countryPrices || [],
    default_funnel_id: s.defaultFunnelId || null,
    default_funnel_stage_id: s.defaultFunnelStageId || null,
    default_funnel_stage: s.defaultFunnelStage || 'prospeccao',
    default_funnel_stage_name: s.defaultFunnelStageName || null,
    qualification_criteria: s.qualificationCriteria || [],
    qualification_questions: s.qualificationQuestions || [],
    deliverables: s.deliverables || [],
    ideal_customer_profile: s.idealCustomerProfile || '',
    core_value_proposition: s.coreValueProposition || null,
    standard_ticket: s.standardTicket || null,
    version: s.version ?? 1,
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    row.user_id = userId;
  }

  return row;
}

export async function fetchServicesFromSupabase(): Promise<{
  success: boolean;
  data: ServiceEntity[];
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

    const services = (data || []).map(mapRowToService);
    return { success: true, data: services };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function upsertServiceToSupabase(
  service: ServiceEntity,
  userId?: string | null
): Promise<{
  success: boolean;
  service?: ServiceEntity;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client não configurado.' };
  }

  const row = mapServiceToRow(service, userId);

  try {
    let { error } = await client.from(PRIMARY_TABLE).upsert(row, { onConflict: 'id' });

    if (error && error.code === '42P01') {
      const fallbackRes = await client.from(FALLBACK_TABLE).upsert(row, { onConflict: 'id' });
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, service };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteServiceFromSupabase(id: string): Promise<{
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

export async function bulkUpsertServicesToSupabase(
  services: ServiceEntity[],
  userId?: string | null
): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client || services.length === 0) {
    return { success: false, count: 0, error: 'Cliente não disponível ou lista vazia.' };
  }

  const rows = services.map((s) => mapServiceToRow(s, userId));

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
