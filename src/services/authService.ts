import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, getSupabaseCredentials } from '../core/supabase/supabaseClient';

/**
 * SERVIÇO DE AUTENTICAÇÃO SUPABASE
 * Centraliza gerenciamento de sessão, login, registro e observadores de auth.
 */

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error) {
      // Se não autenticado ou sessão expirada
      return null;
    }
    return user;
  } catch (err) {
    console.warn('Erro ao obter usuário Supabase:', err);
    return null;
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) return null;
    return session;
  } catch (err) {
    console.warn('Erro ao obter sessão Supabase:', err);
    return null;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{
  success: boolean;
  user?: User | null;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase não inicializado. Verifique a URL e a Publishable Key no .env.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao realizar login.' };
  }
}

export async function signUpWithEmail(
  email: string, 
  password: string, 
  fullName?: string
): Promise<{
  success: boolean;
  user?: User | null;
  error?: string;
  requiresEmailConfirmation?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase não inicializado. Verifique a URL e a Publishable Key no .env.',
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const requiresEmailConfirmation = !data.session;
    return {
      success: true,
      user: data.user,
      requiresEmailConfirmation,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao cadastrar usuário.' };
  }
}

export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: true };

  try {
    const { error } = await client.auth.signOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { unsubscribe: () => void } {
  const client = getSupabaseClient();
  if (!client) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
}
