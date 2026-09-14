import { ServicePriceSnapshot } from './service';

export type ProspectActionStatus = 'atrasada' | 'hoje' | 'proxima' | 'concluida' | 'cancelada';

export type ActionChannel = 'whatsapp' | 'phone' | 'email' | 'linkedin' | 'reuniao';

export type ActionPriorityTier = 'PRIORIDADE' | 'ALTA' | 'MÉDIA' | 'NORMAL';

export interface ProspectAction {
  id: string;
  companyId: string;
  companyName: string;
  niche: string;
  location: string;
  score: number; // 0-100
  service: string; // Ex: "Landing Page", "Leadion Sales OS & Otimização"
  serviceId?: string;
  funnelStage: string; // Ex: "prospeccao" | "contato_feito" | "qualificacao" | "reuniao_agendada" | "proposta" | "negociacao"
  funnelStageLabel: string; // Ex: "Prospecção", "Contato Feito", etc.
  channel: ActionChannel;
  nextAction: string; // Ex: "Primeira abordagem", "Enviar proposta", etc.
  date: string; // YYYY-MM-DD or readable
  time: string; // HH:mm ex: "09:30"
  responsible: string; // Ex: "Manuel Domingos"
  observation?: string;
  status: ProspectActionStatus;
  urgency?: 'alta' | 'media' | 'baixa';
  potentialValue?: string; // Ex: "R$ 4.500" ou "$ 1.200"
  
  // Snapshot imutável de precificação do país da empresa no momento do agendamento
  priceSnapshot?: ServicePriceSnapshot;
  
  // Decisor / Contato
  targetContactName?: string;
  targetContactRole?: string;
  whatsappNumber?: string;
  phone?: string;
  email?: string;
  linkedinUrl?: string;
  scriptText?: string;
  
  // Metadados operacionais
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  
  // Pontuações dinâmicas calculadas pelo Motor de Prioridade
  calculatedPriorityScore?: number;
  priorityTier?: ActionPriorityTier;
  priorityReasons?: string[];
  
  // Flag de conformidade com a regra: Todo lead ativo deve possuir uma próxima ação
  hasPendingNextAction?: boolean;
}

export interface PlanningFormData {
  companyId: string;
  service: string;
  serviceId?: string;
  funnelStage: string;
  channel: ActionChannel;
  date: string;
  time: string;
  responsible: string;
  observation?: string;
  nextActionTitle?: string;
  priceSnapshot?: ServicePriceSnapshot;
}

// Arquitetura preparada para extensão futura de botões táticos
export interface FutureActionExtensionConfig {
  enableObjectionAssistant: boolean; // [OBJEÇÃO]
  enableNextMessageRecommender: boolean; // [PRÓXIMA MENSAGEM]
  enableSmartFollowUp: boolean; // [FOLLOW-UP]
}
