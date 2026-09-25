/**
 * MODELOS DE CONTA & WORKSPACE LEADION
 * Suporta modelo duplo: Conta Local (Offline) e Conta Online (Supabase Auth).
 */

export type AccountType = 'local' | 'online';

export interface UserAccount {
  userId: string;          // UUID seguro: local_user_id ou supabase auth id
  workspaceId: string;     // UUID seguro: local_workspace_id ou remote workspace id
  accountType: AccountType;
  fullName: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  companyName: string;
  sector?: string;
  country?: string;
  state?: string;
  region?: string;
  localCredential?: string; // Nome legível ou token local
  deviceId: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface WorkspaceProfile {
  id: string;
  name: string;
  sector?: string;
  country?: string;
  state?: string;
  region?: string;
  ownerId: string;
  isLocalOnly: boolean;
  createdAt: string;
  updatedAt: string;
}
