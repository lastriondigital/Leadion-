import { ServicePriceSnapshot } from './service';

export type ProspectActionStatus = 'atrasada' | 'hoje' | 'proxima' | 'concluida' | 'cancelada';

export type ActionChannel = 'whatsapp' | 'phone' | 'email' | 'linkedin' | 'reuniao';

export type ActionPriorityTier = 'PRIORIDADE' | 'ALTA' | 'MÉDIA' | 'NORMAL';

export type ActionOutcomeType = 
  | 'respondeu'       // Cliente respondeu -> sugerir próximo script
  | 'nao_respondeu'   // Não respondeu -> sugerir follow-up
  | 'objecao'         // Apresentou objeção -> abrir biblioteca de objeções
  | 'ganhou'          // Ganhou -> encerrar prospecção / mover para cliente
  | 'perdeu';         // Perdeu -> registrar motivo

export interface ActionOutcomeDetails {
  outcome: ActionOutcomeType;
  notes?: string;
  lostReason?: string;
  wonValue?: string;
  nextScriptId?: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  nextActionTitle?: string;
  nextChannel?: ActionChannel;
}

export interface ProspectAction {
  id: string;
  companyId: string;
  companyName: string;
  niche: string;
  location: string;
  score: number; // 0-100 (Score Geral de compatibilidade)
  
  // OS 3 SCORES COM SIGNIFICADO PRÓPRIO
  clientScore?: number;  // SCORE DO CLIENTE: Qualificação da empresa/ICP (0 a 100)
  serviceScore?: number; // SCORE DO SERVIÇO: Aderência e atratividade do serviço (0 a 100)
  
  service: string; // Ex: "Landing Page", "Leadion Sales OS & Otimização"
  serviceId?: string;
  funnelStage: string; // Ex: "prospeccao" | "contato_feito" | "qualificacao" | "reuniao_agendada" | "proposta" | "negociacao"
  funnelStageLabel: string; // Ex: "Prospecção", "Contato Feito", etc.
  channel: ActionChannel;
  nextAction: string; // Ex: "Primeira abordagem", "Enviar Follow-up #1", etc.
  date: string; // YYYY-MM-DD or readable (ex: "Hoje", "13/09/2026")
  time: string; // HH:mm ex: "09:30"
  responsible: string; // Ex: "Manuel Domingos"
  observation?: string;
  status: ProspectActionStatus;
  urgency?: 'alta' | 'media' | 'baixa';
  importance?: 'alta' | 'media' | 'baixa';
  potentialValue?: string; // Ex: "R$ 4.500" ou "10.000 MT"
  
  // CRITÉRIOS DE CADÊNCIA E ENGAJAMENTO
  isFollowUp?: boolean;            // É ação de follow-up / reativação
  clientReplied?: boolean;         // Cliente respondeu recentemente ao contato
  daysSinceLastContact?: number;   // Dias decorridos sem interação registrada
  scriptId?: string;               // Script vinculado da biblioteca
  
  // Desfecho de conclusão operacional
  outcome?: ActionOutcomeType;
  outcomeNotes?: string;
  lostReason?: string;
  
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
  
  // PRIORIDADE DA AÇÃO: Pontuação dinâmica calculada pelo Motor de Prioridade
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
