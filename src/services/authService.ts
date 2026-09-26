import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, withTimeout } from '../core/supabase/supabaseClient';

/**
 * SERVIÇO DE AUTENTICAÇÃO SUPABASE COM SUPORTE OFFLINE-FIRST
 * Centraliza gerenciamento de sessão, login, registro e observadores de auth.
 * Nunca armazena senhas localmente e nunca bloqueia a abertura do aplicativo sem Internet.
 */

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Lê sessão em cache local do Supabase (token JWT/metadados públicos de sessão, nunca senha)
 * Permite validar sessão local instantaneamente quando navigator.onLine === false
 */
function getCachedSupabaseSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.user && parsed.access_token) {
            return parsed as Session;
          }
        }
      }
    }
  } catch {}
  return null;
}

export async function getCurrentUser(): Promise<User | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = getCachedSupabaseSession();
    return cached?.user || null;
  }

  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: { user }, error } = await withTimeout(client.auth.getUser(), 3500);
    if (error) {
      const cached = getCachedSupabaseSession();
      return cached?.user || null;
    }
    return user;
  } catch (err) {
    console.warn('Erro/timeout ao obter usuário Supabase, usando sessão local:', err);
    const cached = getCachedSupabaseSession();
    return cached?.user || null;
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return getCachedSupabaseSession();
  }

  const client = getSupabaseClient();
  if (!client) return getCachedSupabaseSession();

  try {
    const { data: { session }, error } = await withTimeout(client.auth.getSession(), 3000);
    if (error) return getCachedSupabaseSession();
    return session || getCachedSupabaseSession();
  } catch (err) {
    console.warn('Erro/timeout ao obter sessão Supabase, usando sessão local:', err);
    return getCachedSupabaseSession();
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{
  success: boolean;
  user?: User | null;
  error?: string;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      error: 'Sem conexão com a Internet. Para entrar na nuvem, conecte-se à rede ou utilize uma Conta Local Offline.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase não inicializado. Verifique a URL e a Publishable Key no .env.',
    };
  }

  try {
    const { data, error } = await withTimeout(
      client.auth.signInWithPassword({
        email: email.trim(),
        password,
      }),
      6000,
      'Tempo limite excedido ao conectar ao Supabase Auth.'
    );

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
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      error: 'Sem conexão com a Internet. Você pode criar uma Conta Local 100% Offline agora e vincular à nuvem depois.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase não inicializado. Verifique a URL e a Publishable Key no .env.',
    };
  }

  try {
    const { data, error } = await withTimeout(
      client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      }),
      6000,
      'Tempo limite excedido ao registrar conta no Supabase Auth.'
    );

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
  if (!client || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return { success: true };
  }

  try {
    const { error } = await withTimeout(client.auth.signOut(), 3000);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: true };
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
