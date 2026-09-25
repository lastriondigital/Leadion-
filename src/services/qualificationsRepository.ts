import { getSupabaseClient } from '../core/supabase/supabaseClient';
import { QualificationQuestion } from '../core/types/qualification';

/**
 * REPOSITORY DE QUALIFICAÇÃO & SCORES NO SUPABASE
 * Centraliza persistência de perguntas e respostas de auditoria ICP.
 */

const PRIMARY_TABLE = 'leadion_qualifications';
const FALLBACK_TABLE = 'qualifications';

export async function fetchQualificationQuestionsFromSupabase(): Promise<{
  success: boolean;
  data: QualificationQuestion[];
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: [], error: 'Supabase client não configurado.' };
  }

  try {
    let { data, error } = await client
      .from(PRIMARY_TABLE)
      .select('payload')
      .eq('id', 'qualification_questions')
      .single();

    if (error && error.code === '42P01') {
      const fallbackRes = await client
        .from(FALLBACK_TABLE)
        .select('payload')
        .eq('id', 'qualification_questions')
        .single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error && error.code !== 'PGRST116') {
      return { success: false, data: [], error: error.message };
    }

    if (data?.payload && Array.isArray(data.payload)) {
      return { success: true, data: data.payload };
    }

    return { success: true, data: [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function saveQualificationQuestionsToSupabase(
  questions: QualificationQuestion[],
  userId?: string | null
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client não configurado.' };
  }

  const row: Record<string, any> = {
    id: 'qualification_questions',
    type: 'questions',
    payload: questions,
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    row.user_id = userId;
  }

  try {
    let { error } = await client.from(PRIMARY_TABLE).upsert(row, { onConflict: 'id' });

    if (error && error.code === '42P01') {
      const fallbackRes = await client.from(FALLBACK_TABLE).upsert(row, { onConflict: 'id' });
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

export async function fetchQualificationAnswersFromSupabase(): Promise<{
  success: boolean;
  data: Record<string, Record<string, string | number>>;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: {}, error: 'Supabase client não configurado.' };
  }

  try {
    let { data, error } = await client
      .from(PRIMARY_TABLE)
      .select('payload')
      .eq('id', 'qualification_answers')
      .single();

    if (error && error.code === '42P01') {
      const fallbackRes = await client
        .from(FALLBACK_TABLE)
        .select('payload')
        .eq('id', 'qualification_answers')
        .single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error && error.code !== 'PGRST116') {
      return { success: false, data: {}, error: error.message };
    }

    if (data?.payload && typeof data.payload === 'object') {
      return { success: true, data: data.payload };
    }

    return { success: true, data: {} };
  } catch (err: any) {
    return { success: false, data: {}, error: err.message };
  }
}

export async function saveQualificationAnswersToSupabase(
  answers: Record<string, Record<string, string | number>>,
  userId?: string | null
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client não configurado.' };
  }

  const row: Record<string, any> = {
    id: 'qualification_answers',
    type: 'answers',
    payload: answers,
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    row.user_id = userId;
  }

  try {
    let { error } = await client.from(PRIMARY_TABLE).upsert(row, { onConflict: 'id' });

    if (error && error.code === '42P01') {
      const fallbackRes = await client.from(FALLBACK_TABLE).upsert(row, { onConflict: 'id' });
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
