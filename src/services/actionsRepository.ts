import { getSupabaseClient } from '../core/supabase/supabaseClient';
import { ProspectAction, ProspectActionStatus, ActionChannel, ActionOutcomeType } from '../core/types/prospectAction';
import { isDemoAction } from '../core/utils/demoCleaners';

/**
 * REPOSITORY DE AÇÕES PROSPECT NO SUPABASE
 * Centraliza persistência real da fila de execução no PostgreSQL.
 */

const PRIMARY_TABLE = 'leadion_prospect_actions';
const FALLBACK_TABLE = 'prospect_actions';

function mapRowToAction(row: any): ProspectAction {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name || '',
    niche: row.niche || '',
    location: row.location || '',
    score: row.score ?? 50,
    clientScore: row.client_score,
    serviceScore: row.service_score,
    service: row.service || '',
    serviceId: row.service_id,
    funnelStage: row.funnel_stage || 'prospeccao',
    funnelStageLabel: row.funnel_stage_label || 'Prospecção',
    channel: (row.channel || 'whatsapp') as ActionChannel,
    nextAction: row.next_action || 'Primeira abordagem',
    date: row.date || 'Hoje',
    time: row.time || '09:00',
    responsible: row.responsible || 'Equipe',
    observation: row.observation,
    status: (row.status || 'hoje') as ProspectActionStatus,
    urgency: row.urgency,
    importance: row.importance,
    potentialValue: row.potential_value,
    isFollowUp: Boolean(row.is_follow_up),
    clientReplied: Boolean(row.client_replied),
    daysSinceLastContact: row.days_since_last_contact,
    scriptId: row.script_id,
    scriptText: row.script_text,
    outcome: row.outcome as ActionOutcomeType,
    outcomeNotes: row.outcome_notes,
    lostReason: row.lost_reason,
    priceSnapshot: row.price_snapshot,
    targetContactName: row.target_contact_name,
    targetContactRole: row.target_contact_role,
    whatsappNumber: row.whatsapp_number,
    phone: row.phone,
    email: row.email,
    linkedinUrl: row.linkedin_url,
    calculatedPriorityScore: row.calculated_priority_score,
    priorityTier: row.priority_tier,
    priorityReasons: row.priority_reasons || [],
    hasPendingNextAction: Boolean(row.has_pending_next_action),
    createdAt: row.created_at || new Date().toISOString(),
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
  };
}

function mapActionToRow(a: ProspectAction, userId?: string | null): Record<string, any> {
  const row: Record<string, any> = {
    id: a.id,
    company_id: a.companyId,
    company_name: a.companyName,
    niche: a.niche || '',
    location: a.location || '',
    score: a.score ?? 50,
    client_score: a.clientScore ?? null,
    service_score: a.serviceScore ?? null,
    service: a.service || '',
    service_id: a.serviceId || null,
    funnel_stage: a.funnelStage || 'prospeccao',
    funnel_stage_label: a.funnelStageLabel || 'Prospecção',
    channel: a.channel,
    next_action: a.nextAction,
    date: a.date,
    time: a.time,
    responsible: a.responsible,
    observation: a.observation || null,
    status: a.status,
    urgency: a.urgency || null,
    importance: a.importance || null,
    potential_value: a.potentialValue || null,
    is_follow_up: Boolean(a.isFollowUp),
    client_replied: Boolean(a.clientReplied),
    days_since_last_contact: a.daysSinceLastContact ?? null,
    script_id: a.scriptId || null,
    script_text: a.scriptText || null,
    outcome: a.outcome || null,
    outcome_notes: a.outcomeNotes || null,
    lost_reason: a.lostReason || null,
    price_snapshot: a.priceSnapshot || null,
    target_contact_name: a.targetContactName || null,
    target_contact_role: a.targetContactRole || null,
    whatsapp_number: a.whatsappNumber || null,
    phone: a.phone || null,
    email: a.email || null,
    linkedin_url: a.linkedinUrl || null,
    calculated_priority_score: a.calculatedPriorityScore ?? null,
    priority_tier: a.priorityTier || null,
    priority_reasons: a.priorityReasons || [],
    has_pending_next_action: Boolean(a.hasPendingNextAction),
    completed_at: a.completedAt || null,
    cancelled_at: a.cancelledAt || null,
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    row.user_id = userId;
  }

  return row;
}

export async function fetchActionsFromSupabase(): Promise<{
  success: boolean;
  data: ProspectAction[];
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

    const actions = (data || [])
      .map(mapRowToAction)
      .filter((a) => !isDemoAction(a));

    return { success: true, data: actions };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function upsertActionToSupabase(
  action: ProspectAction,
  userId?: string | null
): Promise<{
  success: boolean;
  action?: ProspectAction;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client não configurado.' };
  }

  const row = mapActionToRow(action, userId);

  try {
    let { error } = await client.from(PRIMARY_TABLE).upsert(row, { onConflict: 'id' });

    if (error && error.code === '42P01') {
      const fallbackRes = await client.from(FALLBACK_TABLE).upsert(row, { onConflict: 'id' });
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, action };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteActionFromSupabase(id: string): Promise<{
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

export async function bulkUpsertActionsToSupabase(
  actions: ProspectAction[],
  userId?: string | null
): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client || actions.length === 0) {
    return { success: false, count: 0, error: 'Cliente não disponível ou lista vazia.' };
  }

  const rows = actions.map((a) => mapActionToRow(a, userId));

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
