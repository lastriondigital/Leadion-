import { getSupabaseClient } from '../core/supabase/supabaseClient';
import { Company, CompanyTimelineEvent, CompanyActivity } from '../core/types/company';
import { isDemoCompany, purgeDemoDataFromSupabase } from '../core/utils/demoCleaners';

export { isDemoCompany, purgeDemoDataFromSupabase };

/**
 * REPOSITORY OFICIAL DE EMPRESAS NO SUPABASE
 * Centraliza persistência real no PostgreSQL via Supabase Client.
 * Suporta busca por ID real, criação com retorno de ID gerado pelo banco,
 * e fallback automático de schema entre leadion_companies e companies.
 */

const PRIMARY_TABLE = 'leadion_companies';
const FALLBACK_TABLE = 'companies';

export function mapRowToCompany(row: any): Company {
  if (!row) {
    throw new Error('Registro inválido retornado pelo banco de dados.');
  }

  const rawResponsibles = row.responsibles;
  let responsibles: any[] = [];
  if (Array.isArray(rawResponsibles)) {
    responsibles = rawResponsibles;
  } else if (typeof rawResponsibles === 'string') {
    try {
      const parsed = JSON.parse(rawResponsibles);
      if (Array.isArray(parsed)) responsibles = parsed;
    } catch {}
  }

  const rawContacts = row.additional_contacts || row.contacts;
  let additionalContacts: any[] = [];
  if (Array.isArray(rawContacts)) {
    additionalContacts = rawContacts;
  } else if (typeof rawContacts === 'string') {
    try {
      const parsed = JSON.parse(rawContacts);
      if (Array.isArray(parsed)) additionalContacts = parsed;
    } catch {}
  }

  let socials: Record<string, any> = {};
  if (row.socials && typeof row.socials === 'object') {
    socials = row.socials;
  } else if (typeof row.socials === 'string') {
    try {
      socials = JSON.parse(row.socials);
    } catch {}
  }

  let timeline: CompanyTimelineEvent[] = [];
  if (Array.isArray(row.timeline)) {
    timeline = row.timeline;
  } else if (typeof row.timeline === 'string') {
    try {
      const parsed = JSON.parse(row.timeline);
      if (Array.isArray(parsed)) timeline = parsed;
    } catch {}
  }

  let activities: CompanyActivity[] = [];
  if (Array.isArray(row.activities)) {
    activities = row.activities;
  } else if (typeof row.activities === 'string') {
    try {
      const parsed = JSON.parse(row.activities);
      if (Array.isArray(parsed)) activities = parsed;
    } catch {}
  }

  let associatedServices: string[] = [];
  if (Array.isArray(row.associated_services)) {
    associatedServices = row.associated_services;
  } else if (typeof row.associated_services === 'string') {
    try {
      const parsed = JSON.parse(row.associated_services);
      if (Array.isArray(parsed)) associatedServices = parsed;
    } catch {}
  }

  const city = row.city || '';
  const state = row.state || '';
  const country = row.country || '';
  const location = row.location || [city, state].filter(Boolean).join(', ') + (country ? ` - ${country}` : '');

  return {
    id: String(row.id),
    name: row.name || row.commercial_name || '',
    niche: row.niche || row.segment || '',
    country: country || 'Brasil',
    city: city,
    state: state,
    location: location.trim(),
    address: row.address || '',
    website: row.website || '',
    phone: row.phone || '',
    whatsapp: row.whatsapp || row.phone || '',
    email: row.email || '',
    additionalContacts,
    socials,
    responsibles,
    unitsCount: Number(row.units_count ?? row.unitsCount) || 1,
    businessType: row.business_type || row.businessType || 'B2B',
    size: row.size || row.employees_range || '11-50 colaboradores',
    leadSource: row.lead_source || row.leadSource || 'Outbound Ativo',
    commercialNotes: row.commercial_notes || row.commercialNotes || '',
    dealValue: row.deal_value ?? row.dealValue,
    closedAt: row.closed_at ?? row.closedAt,
    score: row.score !== null && row.score !== undefined ? Number(row.score) : null,
    funnelStage: row.funnel_stage || row.funnelStage || 'prospeccao',
    funnelId: row.funnel_id || row.funnelId,
    funnelStageId: row.funnel_stage_id || row.funnelStageId,
    funnelStageName: row.funnel_stage_name || row.funnelStageName,
    primaryServiceId: row.primary_service_id || row.primaryServiceId,
    status: row.status === 'archived' ? 'archived' : 'active',
    associatedServices,
    nextAction: row.next_action || row.nextAction,
    timeline,
    activities,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    // Compatibilidade reversa
    segment: row.niche || row.segment || '',
    domain: row.website ? row.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : '',
    icpScore: row.score !== null && row.score !== undefined ? Number(row.score) : undefined,
    employeesRange: row.size || row.employees_range || '11-50 colaboradores',
    activeLeadsCount: responsibles.length,
  };
}

export function mapCompanyToRow(c: Partial<Company>, userId?: string | null): Record<string, any> {
  const row: Record<string, any> = {
    name: c.name?.trim(),
    niche: c.niche || c.segment || '',
    country: c.country || '',
    city: c.city || '',
    state: c.state || '',
    location: c.location || '',
    address: c.address || '',
    website: c.website || '',
    phone: c.phone || '',
    whatsapp: c.whatsapp || c.phone || '',
    email: c.email || '',
    socials: c.socials || {},
    additional_contacts: c.additionalContacts || [],
    responsibles: c.responsibles || [],
    units_count: c.unitsCount ?? 1,
    business_type: c.businessType || 'B2B',
    size: c.size || c.employeesRange || '11-50 colaboradores',
    lead_source: c.leadSource || 'Outbound Ativo',
    commercial_notes: c.commercialNotes || '',
    deal_value: c.dealValue || null,
    closed_at: c.closedAt || null,
    score: c.score !== undefined && c.score !== null ? c.score : null,
    funnel_stage: c.funnelStage || 'prospeccao',
    funnel_id: c.funnelId || null,
    funnel_stage_id: c.funnelStageId || null,
    funnel_stage_name: c.funnelStageName || null,
    primary_service_id: c.primaryServiceId || null,
    status: c.status || 'active',
    associated_services: c.associatedServices || [],
    next_action: c.nextAction || null,
    timeline: c.timeline || [],
    activities: c.activities || [],
    updated_at: new Date().toISOString(),
  };

  if (c.id) {
    row.id = c.id;
  }

  if (userId) {
    row.user_id = userId;
  }

  return row;
}

/**
 * Busca todas as empresas cadastradas no Supabase
 * Aplica auditoria estrita: empresas demo/fictícias são 100% descartadas
 */
export async function fetchCompaniesFromSupabase(): Promise<{
  success: boolean;
  data: Company[];
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
      .order('created_at', { ascending: false });

    // Fallback se a tabela leadion_companies não existir mas companies sim
    if (error && error.code === '42P01') {
      const fallbackRes = await client
        .from(FALLBACK_TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    const companies = (data || [])
      .map(mapRowToCompany)
      .filter((c) => !isDemoCompany(c));

    return { success: true, data: companies };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Busca uma empresa específica pelo ID real do Supabase
 */
export async function fetchCompanyByIdFromSupabase(id: string): Promise<{
  success: boolean;
  company?: Company;
  error?: string;
}> {
  if (!id) {
    return { success: false, error: 'ID da empresa não fornecido.' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client não configurado.' };
  }

  try {
    let { data, error } = await client
      .from(PRIMARY_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === '42P01') {
      const fallbackRes = await client
        .from(FALLBACK_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Empresa não encontrada no Supabase.' };
    }

    return { success: true, company: mapRowToCompany(data) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Cria uma nova empresa no Supabase e RETORNA O REGISTRO CRIADO COM ID REAL
 * Exemplo conceitual:
 * const { data, error } = await supabase.from('companies').insert(payload).select().single();
 */
export async function createCompanyInSupabase(
  companyData: Partial<Company>,
  userId?: string | null
): Promise<{
  success: boolean;
  company?: Company;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client não configurado.' };
  }

  // Prepara linha
  const row = mapCompanyToRow(companyData, userId);
  
  // Se não possuir ID ou se tiver um ID temporário frontend, gera um UUID padrão válido para compatibilidade com tipos uuid/text do PostgreSQL
  if (!row.id || row.id.startsWith('comp-')) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      row.id = crypto.randomUUID();
    }
  }

  try {
    let { data, error } = await client
      .from(PRIMARY_TABLE)
      .insert(row)
      .select()
      .single();

    if (error && error.code === '42P01') {
      const fallbackRes = await client
        .from(FALLBACK_TABLE)
        .insert(row)
        .select()
        .single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Nenhum dado retornado após criação.' };
    }

    const createdCompany = mapRowToCompany(data);
    return { success: true, company: createdCompany };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Atualiza ou insere uma empresa existente no Supabase
 */
export async function upsertCompanyToSupabase(
  company: Company,
  userId?: string | null
): Promise<{
  success: boolean;
  company?: Company;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client não configurado.' };
  }

  const row = mapCompanyToRow(company, userId);

  try {
    let { data, error } = await client
      .from(PRIMARY_TABLE)
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error && error.code === '42P01') {
      const fallbackRes = await client
        .from(FALLBACK_TABLE)
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    const updatedCompany = data ? mapRowToCompany(data) : company;
    return { success: true, company: updatedCompany };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Remove uma empresa do Supabase pelo ID real
 */
export async function deleteCompanyFromSupabase(id: string): Promise<{
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

/**
 * Upsert em lote para migrações e sincronizações
 */
export async function bulkUpsertCompaniesToSupabase(
  companies: Company[],
  userId?: string | null
): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client || companies.length === 0) {
    return { success: false, count: 0, error: 'Cliente não disponível ou lista vazia.' };
  }

  const rows = companies.map((c) => mapCompanyToRow(c, userId));

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
