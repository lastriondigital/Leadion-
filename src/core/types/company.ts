export type CompanyFunnelStage = 
  | 'prospeccao'
  | 'contato_feito'
  | 'qualificacao'
  | 'reuniao_agendada'
  | 'proposta'
  | 'negociacao'
  | 'cliente'
  | 'desqualificado';

export type CompanyTimelineEventType =
  | 'empresa_criada'
  | 'servico_selecionado'
  | 'qualificacao'
  | 'mensagem_enviada'
  | 'whatsapp_enviado'
  | 'follow_up'
  | 'resposta'
  | 'objecao'
  | 'proposta'
  | 'alteracao_etapa'
  | 'transicao_funil'
  | 'nota'
  | 'reuniao'
  | 'contato_realizado'
  | 'reuniao_agendada'
  | 'proposta_enviada'
  | 'nota_adicionada';

export interface CompanySocials {
  instagram?: string;
  facebook?: string;
  gmb?: string; // Google Business Profile / GMB
  googleBusiness?: string;
  linkedin?: string;
  tiktok?: string;
  others?: string;
  other?: string;
}

export interface CompanyResponsible {
  id: string;
  name: string;
  role: string;
  phone: string;
  whatsapp: string;
  email: string;
  notes?: string;
  isPrimary?: boolean;
}

export interface CompanyContact {
  id: string;
  label?: string; // ex: Recepção, Central de Atendimento, Suporte, Compras
  name?: string;
  role?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
}

export interface CompanyActivity {
  id: string;
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'task' | 'note' | 'ligacao' | 'reuniao' | 'proposta' | 'tarefa';
  title: string;
  dueDate?: string;
  dueTime?: string;
  completed: boolean;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CompanyNextAction {
  actionType: string;
  label: string;
  dueDate: string;
  dueTime?: string;
  channel: 'whatsapp' | 'phone' | 'email' | 'linkedin' | 'meeting';
  responsibleName?: string;
  notes?: string;
}

export interface CompanyTimelineEvent {
  id: string;
  timestamp: string;
  type: CompanyTimelineEventType;
  title: string;
  detail: string;
  author?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface Company {
  id: string;
  
  // INFORMAÇÕES DA EMPRESA
  name: string;
  niche: string;
  country: string;
  city: string;
  state?: string;
  location: string;
  address: string;
  website: string;

  // CONTACTOS
  phone: string;
  whatsapp: string;
  email: string;
  additionalContacts?: CompanyContact[];

  // REDES SOCIAIS
  socials: CompanySocials;

  // RESPONSÁVEL (múltiplos responsáveis)
  responsibles: CompanyResponsible[];

  // INFORMAÇÕES COMERCIAIS
  unitsCount: number;
  businessType: string;
  size: string;
  leadSource: string;
  commercialNotes?: string;

  // SISTEMA & FUNIL
  score: number;
  funnelStage: CompanyFunnelStage;
  funnelId?: string;                 // ID explícito do funil associado à empresa
  funnelStageId?: string;            // ID explícito da etapa atual dentro do funil
  funnelStageName?: string;          // Nome legível da etapa
  primaryServiceId?: string;         // Serviço principal associado
  status: 'active' | 'archived';
  associatedServices: string[];
  nextAction?: CompanyNextAction;
  timeline: CompanyTimelineEvent[];
  activities: CompanyActivity[];

  createdAt: string;
  updatedAt: string;

  // Backwards compatibility properties
  domain?: string;
  segment?: string;
  employeesRange?: string;
  estimatedRevenue?: string;
  icpScore?: number;
  activeLeadsCount?: number;
  recentTriggers?: string[];
  keyTechStack?: string[];
  tradingName?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  decisionMakerName?: string;
  serviceInterest?: string;
  instagram?: string;
}

