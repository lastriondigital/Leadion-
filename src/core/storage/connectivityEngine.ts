/**
 * MOTOR DE DETECÇÃO DE CONECTIVIDADE REAL
 * Valida a conexão real com a Internet e com o Supabase, prevenindo falsos positivos de navigator.onLine.
 */

import { testSupabaseConnection } from '../supabase/supabaseClient';

export type ConnectivityState = 
  | 'online' 
  | 'offline' 
  | 'reconnecting' 
  | 'syncing' 
  | 'synced' 
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

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleBrowserOnline());
      window.addEventListener('offline', () => this.handleBrowserOffline());
      
      // Validação inicial em background
      setTimeout(() => this.validateRealConnection(), 1000);

      // Verificação periódica a cada 40 segundos quando a aba estiver em foco
      this.checkIntervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          this.validateRealConnection();
        }
      }, 40000);
    }
  }

  private handleBrowserOnline() {
    this.currentState = 'reconnecting';
    this.notify();
    // Valida se há conexão de verdade
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

    try {
      const res = await testSupabaseConnection();
      if (res.success) {
        this.isRealOnline = true;
        this.latencyMs = res.latencyMs;
        // Se estava offline ou reconectando, passa a online/synced
        if (this.currentState === 'offline' || this.currentState === 'reconnecting') {
          this.currentState = 'online';
        }
      } else {
        // Tentativa de ping alternativo caso erro do Supabase seja específico de RLS ou tabela
        this.isRealOnline = false;
        this.currentState = 'offline';
      }
    } catch {
      this.isRealOnline = false;
      this.currentState = 'offline';
    }

    this.notify();
    return this.isRealOnline;
  }

  public setSyncState(state: 'syncing' | 'synced' | 'sync_error') {
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
    // Notifica estado atual imediatamente
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
