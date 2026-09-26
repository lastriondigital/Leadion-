/**
 * MOTOR DE DETECÇÃO DE CONECTIVIDADE REAL
 * Valida a conexão real com a Internet e com o Supabase, prevenindo falsos positivos de navigator.onLine.
 */

import { testSupabaseConnection, getSupabaseCredentials } from '../supabase/supabaseClient';

export type ConnectivityState = 
  | 'online' 
  | 'offline' 
  | 'reconnecting' 
  | 'syncing' 
  | 'synced' 
  | 'sync_pending'
  | 'sync_error';

export type ConnectivityListener = (state: {
  connectivity: ConnectivityState;
  isRealOnline: boolean;
  latencyMs?: number;
  lastChecked: string;
}) => void;

class ConnectivityManager {
  private currentState: ConnectivityState = typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline';
  private isRealOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : false;
  private latencyMs?: number;
  private listeners: Set<ConnectivityListener> = new Set();
  private checkIntervalId?: any;
  private isChecking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleBrowserOnline());
      window.addEventListener('offline', () => this.handleBrowserOffline());

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            this.handleBrowserOffline();
          } else {
            this.validateRealConnection();
          }
        }
      });

      // Validação inicial em background sem bloquear a thread principal
      setTimeout(() => this.validateRealConnection(), 800);

      // Verificação periódica a cada 45 segundos quando a aba estiver em foco
      this.checkIntervalId = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          this.validateRealConnection();
        }
      }, 45000);
    }
  }

  private handleBrowserOnline() {
    this.currentState = 'reconnecting';
    this.notify();
    this.validateRealConnection();
  }

  private handleBrowserOffline() {
    this.currentState = 'offline';
    this.isRealOnline = false;
    this.notify();
  }

  public async validateRealConnection(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.currentState = 'offline';
      this.isRealOnline = false;
      this.notify();
      return false;
    }

    const creds = getSupabaseCredentials();
    if (!creds.isConfigured) {
      // Sem credenciais de nuvem configuradas, respeita navigator.onLine para a rede mas mantém operação local
      this.isRealOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
      this.currentState = this.isRealOnline ? 'online' : 'offline';
      this.notify();
      return this.isRealOnline;
    }

    if (this.isChecking) {
      return this.isRealOnline;
    }

    this.isChecking = true;
    try {
      const res = await testSupabaseConnection();
      if (res.success) {
        this.isRealOnline = true;
        this.latencyMs = res.latencyMs;
        if (this.currentState === 'offline' || this.currentState === 'reconnecting') {
          this.currentState = 'online';
        }
      } else {
        this.isRealOnline = false;
        this.currentState = 'offline';
      }
    } catch {
      this.isRealOnline = false;
      this.currentState = 'offline';
    } finally {
      this.isChecking = false;
    }

    this.notify();
    return this.isRealOnline;
  }

  public setSyncState(state: 'syncing' | 'synced' | 'sync_pending' | 'sync_error' | 'offline' | 'online') {
    this.currentState = state;
    this.notify();
  }

  public getState() {
    return {
      connectivity: this.currentState,
      isRealOnline: this.isRealOnline,
      latencyMs: this.latencyMs,
      lastChecked: new Date().toISOString(),
    };
  }

  public subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('Erro em listener de conectividade:', err);
      }
    });
  }
}

export const connectivityEngine = new ConnectivityManager();
