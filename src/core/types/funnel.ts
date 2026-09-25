export type FunnelSemanticColor = 
  | 'zinc' 
  | 'blue' 
  | 'purple' 
  | 'amber' 
  | 'orange' 
  | 'emerald' 
  | 'rose' 
  | 'cyan';

export type FunnelStageType = 'open' | 'in_progress' | 'won' | 'lost' | 'qualified' | 'archived';
export type StageType = FunnelStageType;

export interface FunnelStageConditionalRule {
  triggerCondition?: string;       // Ex: "Sem resposta após 3 dias", "Diagnóstico concluído"
  recommendedAction?: string;      // Ex: "Enviar follow-up com gancho de autoridade", "Marcar reunião"
  autoAdvanceDays?: number;        // Tempo limite recomendado nesta etapa
  requiredFields?: string[];       // Ex: ["decisor_identificado", "dor_mapeada"]
}

export interface FunnelStage {
  id: string;
  name: string;                    // Ex: "Novo", "Qualificação", "Primeira abordagem", "Aguardando resposta", "Conversando", "Necessidade identificada", "Oferta", "Proposta", "Negociação", "Ganho", "Perdido"
  order: number;                   // 0, 1, 2, ...
  color: FunnelSemanticColor;      // Cor semântica do sistema
  stageType?: FunnelStageType;     // Classificação operacional
  description?: string;            // Dica de ação ou objetivo da etapa
  
  // Preparação de arquitetura para scripts condicionais e automações futuras
  suggestedScriptIds?: string[];   // Scripts recomendados para uso nesta etapa
  conditionalRules?: FunnelStageConditionalRule;
}

export type FunnelChannel = 'whatsapp' | 'instagram' | 'email' | 'linkedin' | 'phone' | 'outro';

export type FunnelObjective = 
  | 'primeiro_contacto' 
  | 'qualificacao' 
  | 'apresentacao' 
  | 'follow_up' 
  | 'fechamento' 
  | 'reativacao' 
  | 'personalizado';

export type FollowUpCondition = 
  | 'respondeu' 
  | 'nao_respondeu' 
  | 'mensagem_enviada' 
  | 'prazo_expirado' 
  | 'manual' 
  | 'interesse' 
  | 'sem_interesse' 
  | 'encerramento';

export interface MessageFollowUp {
  id: string;
  messageId: string;
  sequenceId: string;
  funnelId: string;
  name: string;
  delayValue: number;
  delayUnit: 'dias' | 'horas' | 'minutos' | 'semanas';
  condition: FollowUpCondition;
  content: string;
  targetType?: 'sequence' | 'message' | 'follow_up' | 'transition' | 'end' | 'custom';
  targetId?: string;
  targetFunnelId?: string;
  targetSequenceId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceMessage {
  id: string;
  sequenceId: string;
  funnelId: string;
  internalName: string;
  channel: FunnelChannel;
  content: string;
  order: number;
  followUps: MessageFollowUp[];
  createdAt: string;
  updatedAt: string;
}

export interface FunnelSequence {
  id: string;
  funnelId: string;
  name: string;
  description?: string;
  objective?: string;
  order: number;
  color?: FunnelSemanticColor;
  messages: SequenceMessage[];
  createdAt: string;
  updatedAt: string;
}

export type FlowNodeType = 'sequence' | 'message' | 'follow_up' | 'condition' | 'transition' | 'end';

export interface FlowNode {
  id: string;
  funnelId: string;
  type: FlowNodeType;
  referenceId?: string;
  title: string;
  subtitle?: string;
  positionX: number;
  positionY: number;
  data?: {
    channel?: FunnelChannel;
    condition?: FollowUpCondition | string;
    targetFunnelId?: string;
    targetFunnelName?: string;
    targetSequenceId?: string;
    targetSequenceName?: string;
    delayText?: string;
    contentPreview?: string;
    order?: number;
    color?: string;
    sequenceId?: string;
    messageId?: string;
    [key: string]: any;
  };
}

export interface FlowEdge {
  id: string;
  funnelId: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition: FollowUpCondition | string;
  label: string;
  metadata?: Record<string, any>;
}

export interface FlowViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface FunnelScript {
  id: string;
  funnelId: string;
  title: string;
  content: string;
  channel: FunnelChannel;
  sequenceId?: string;
  messageId?: string;
  situation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FunnelEntity {
  id: string;
  name: string;                    // Ex: "Funil Comercial B2B", "Funil de Vendas de LPs", etc.
  code: string;                    // Ex: "FUN-B2B", "FUN-LP"
  description?: string;
  channel?: FunnelChannel;
  objective?: FunnelObjective;
  status: 'active' | 'archived';
  isDefault?: boolean;
  stages: FunnelStage[];
  sequences?: FunnelSequence[];
  flowNodes?: FlowNode[];
  flowEdges?: FlowEdge[];
  flowViewport?: FlowViewport;
  funnelScripts?: FunnelScript[];
  
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface StageTransitionPayload {
  companyId: string;
  targetStageId: string;
  targetFunnelId?: string;
  responsibleName?: string;
  notes?: string;
  dealValue?: string;
}

export interface FunnelColorConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  headerBorder: string;
  accentBar: string;
  dotBg: string;
  bgLight: string;
  accent: string;
  bg: string;
  border: string;
  text: string;
}

export const FUNNEL_COLOR_PRESETS: Record<FunnelSemanticColor, FunnelColorConfig> = {
  zinc: {
    label: 'Neutro / Entrada',
    badgeBg: 'bg-zinc-100 dark:bg-zinc-800',
    badgeText: 'text-zinc-700 dark:text-zinc-300',
    badgeBorder: 'border-zinc-200 dark:border-zinc-700',
    headerBorder: 'border-zinc-300 dark:border-zinc-700',
    accentBar: 'bg-zinc-400',
    dotBg: 'bg-zinc-400',
    bgLight: 'bg-zinc-50/70 dark:bg-zinc-900/40',
    accent: '#9CA3AF',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    border: 'border-zinc-300 dark:border-zinc-700',
    text: 'text-zinc-700 dark:text-zinc-300',
  },
  blue: {
    label: 'Azul / Abordagem',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800/60',
    headerBorder: 'border-blue-300 dark:border-blue-800',
    accentBar: 'bg-blue-500',
    dotBg: 'bg-blue-500',
    bgLight: 'bg-blue-50/40 dark:bg-blue-950/20',
    accent: '#3B82F6',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-300 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
  },
  cyan: {
    label: 'Ciano / Investigação',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/60',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800/60',
    headerBorder: 'border-cyan-300 dark:border-cyan-800',
    accentBar: 'bg-cyan-500',
    dotBg: 'bg-cyan-500',
    bgLight: 'bg-cyan-50/40 dark:bg-cyan-950/20',
    accent: '#06B6D4',
    bg: 'bg-cyan-50 dark:bg-cyan-950/50',
    border: 'border-cyan-300 dark:border-cyan-800',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  purple: {
    label: 'Roxo / LEADION Primary',
    badgeBg: 'bg-[#EEF0FF] dark:bg-[#1E1D38]',
    badgeText: 'text-[#635BFF] dark:text-[#9A94FF]',
    badgeBorder: 'border-[#635BFF]/30 dark:border-[#635BFF]/40',
    headerBorder: 'border-[#635BFF]/40 dark:border-[#635BFF]/50',
    accentBar: 'bg-[#635BFF]',
    dotBg: 'bg-[#635BFF]',
    bgLight: 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10',
    accent: '#635BFF',
    bg: 'bg-[#EEF0FF] dark:bg-[#1E1D38]',
    border: 'border-[#635BFF]/30 dark:border-[#635BFF]/40',
    text: 'text-[#635BFF] dark:text-[#9A94FF]',
  },
  amber: {
    label: 'Amarelo / Em Andamento',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800/60',
    headerBorder: 'border-amber-300 dark:border-amber-800',
    accentBar: 'bg-amber-500',
    dotBg: 'bg-amber-500',
    bgLight: 'bg-amber-50/40 dark:bg-amber-950/20',
    accent: '#F59E0B',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-300 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
  },
  orange: {
    label: 'Laranja / Oferta & Proposta',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/60',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-800/60',
    headerBorder: 'border-orange-300 dark:border-orange-800',
    accentBar: 'bg-orange-500',
    dotBg: 'bg-orange-500',
    bgLight: 'bg-orange-50/40 dark:bg-orange-950/20',
    accent: '#F97316',
    bg: 'bg-orange-50 dark:bg-orange-950/50',
    border: 'border-orange-300 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
  },
  emerald: {
    label: 'Verde / Ganho & Sucesso',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
    headerBorder: 'border-emerald-300 dark:border-emerald-800',
    accentBar: 'bg-emerald-500',
    dotBg: 'bg-emerald-500',
    bgLight: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    accent: '#10B981',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-300 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  rose: {
    label: 'Vermelho / Perdido & Descarte',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800/60',
    headerBorder: 'border-rose-300 dark:border-rose-800',
    accentBar: 'bg-rose-500',
    dotBg: 'bg-rose-500',
    bgLight: 'bg-rose-50/40 dark:bg-rose-950/20',
    accent: '#F43F5E',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-300 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
  },
};

export const FUNNEL_CHANNELS: { value: FunnelChannel; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'email', label: 'E-mail' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'phone', label: 'Telefone / Ligação' },
  { value: 'outro', label: 'Outro' },
];

export const FUNNEL_OBJECTIVES: { value: FunnelObjective; label: string }[] = [
  { value: 'primeiro_contacto', label: 'Primeiro contacto' },
  { value: 'qualificacao', label: 'Qualificação' },
  { value: 'apresentacao', label: 'Apresentação' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'fechamento', label: 'Fechamento' },
  { value: 'reativacao', label: 'Reativação' },
  { value: 'personalizado', label: 'Personalizado' },
];

export const FOLLOWUP_CONDITIONS: { value: FollowUpCondition; label: string; description: string; color: string }[] = [
  { value: 'nao_respondeu', label: 'Não respondeu', description: 'Tempo expirado sem retorno da empresa', color: 'amber' },
  { value: 'respondeu', label: 'Respondeu', description: 'Empresa enviou resposta ou mensagem de réplica', color: 'emerald' },
  { value: 'mensagem_enviada', label: 'Mensagem enviada', description: 'Disparo manual ou confirmação de envio', color: 'blue' },
  { value: 'prazo_expirado', label: 'Prazo expirado', description: 'Janela de tempo limite ultrapassada', color: 'rose' },
  { value: 'manual', label: 'Manual', description: 'Ação executada sob critério do operador', color: 'purple' },
  { value: 'interesse', label: 'Demonstrou interesse', description: 'Contato pediu proposta, apresentação ou reunião', color: 'emerald' },
  { value: 'sem_interesse', label: 'Sem interesse', description: 'Contato recusou ou adiou sem previsão', color: 'zinc' },
  { value: 'encerramento', label: 'Encerramento', description: 'Finalização do contato ou descarte', color: 'rose' },
];

