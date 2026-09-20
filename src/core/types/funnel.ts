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

export interface FunnelEntity {
  id: string;
  name: string;                    // Ex: "Funil Comercial B2B", "Funil de Vendas de LPs", etc.
  code: string;                    // Ex: "FUN-B2B", "FUN-LP"
  description?: string;
  status: 'active' | 'archived';
  isDefault?: boolean;
  stages: FunnelStage[];
  
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
