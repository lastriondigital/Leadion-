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

export type ServiceQualificationStatus = 
  | 'NOT_STARTED' 
  | 'IN_PROGRESS' 
  | 'QUALIFIED' 
  | 'NOT_QUALIFIED' 
  | 'REVIEW';

export interface CompanyResponsible {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role: string;
  phone: string;
  whatsapp: string;
  email: string;
  notes?: string;
  gender?: string;
  preferredName?: string; // Nome pelo qual prefere ser chamado
  isPrimary?: boolean;    // Contato principal
  isDecisionMaker?: boolean; // É Decisor?
  isInfluencer?: boolean;    // É Influenciador?
  linkedin?: string;
  instagram?: string;
  birthday?: string;
  communicationPreference?: 'whatsapp' | 'phone' | 'email' | 'linkedin';
  interests?: string;       // Interesses profissionais
  conversationContext?: string; // Contexto da conversa / como conheceu
  howMet?: string;
  lastInteraction?: string;
}

export interface CompanyContact {
  id: string;
  label?: string; // ex: Recepção, Central de Atendimento, Suporte, Compras
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  gender?: string;
  preferredName?: string;
  isPrimary?: boolean;
  isDecisionMaker?: boolean;
  isInfluencer?: boolean;
  linkedin?: string;
  instagram?: string;
  communicationPreference?: 'whatsapp' | 'phone' | 'email' | 'linkedin';
  interests?: string;
  notes?: string;
}

export interface CompanyCommercialContext {
  problem?: string;              // Problema identificado
  perceivedNeed?: string;        // Necessidade percebida
  companyGoal?: string;          // Objetivo da empresa
  mainPain?: string;             // Dor principal
  urgency?: 'baixa' | 'media' | 'alta' | 'imediata'; // Urgência
  knownBudget?: string;          // Orçamento conhecido
  currentCompetitor?: string;    // Concorrente atual
  currentSolution?: string;      // Solução / Fornecedor atual
  changeReason?: string;         // Motivo para mudança
  anticipatedObjection?: string; // Objeção antecipada
  perceivedOpportunity?: string; // Oportunidade percebida
  strategicNotes?: string;       // Observações estratégicas
}

export interface CompanyServiceRelation {
  serviceId: string;
  serviceName: string;
  country: string;
  currency: string;
  currencySymbol: string;
  price: number;
  funnelId?: string;
  funnelStageId?: string;
  qualificationStatus: ServiceQualificationStatus;
  score?: number | null;
  qualificationAnswers?: Record<string, string>;
  positivePoints?: string[];
  negativePoints?: string[];
  commercialContext?: CompanyCommercialContext;
  qualifiedAt?: string;
  notes?: string;
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
  zipCode?: string;
  website: string;
  openingHours?: string;
  description?: string;

  // CONTACTOS
  phone: string;
  whatsapp: string;
  email: string;
  additionalContacts?: CompanyContact[];

  // REDES SOCIAIS & PRESENÇA DIGITAL
  socials: CompanySocials;
  digitalPresenceNotes?: string;

  // RESPONSÁVEL (múltiplos responsáveis)
  responsibles: CompanyResponsible[];

  // INFORMAÇÕES COMERCIAIS & CONTEXTO
  unitsCount: number;
  businessType: string;
  size: string;
  leadSource: string;
  commercialNotes?: string;
  dealValue?: string;
  closedAt?: string;
  
  // CONTEXTO COMERCIAL E PONTOS
  positivePoints?: string[];
  negativePoints?: string[];
  commercialContext?: CompanyCommercialContext;

  // SISTEMA, SERVIÇOS & QUALIFICAÇÃO
  score?: number | null; // Null/undefined quando ainda não qualificada
  qualificationStatus?: ServiceQualificationStatus;
  funnelStage: CompanyFunnelStage;
  funnelId?: string;                 // ID explícito do funil associado à empresa
  funnelStageId?: string;            // ID explícito da etapa atual dentro do funil
  funnelStageName?: string;          // Nome legível da etapa
  primaryServiceId?: string;         // Serviço principal associado
  status: 'active' | 'archived';
  associatedServices: string[];
  companyServices?: CompanyServiceRelation[]; // Relações estruturadas com múltiplos serviços
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

