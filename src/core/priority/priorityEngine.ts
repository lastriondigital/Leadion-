import { ProspectAction, ActionPriorityTier, ProspectActionStatus } from '../types/prospectAction';

export interface PriorityWeights {
  overdueWeight: number;            // Ações atrasadas (peso prioritário)
  dueTodayWeight: number;           // Ações para hoje
  scoreWeight: number;              // Score ICP da conta (0-100)
  urgencyWeight: number;            // Nível de urgência declarado
  stageWeight: number;              // Proximidade de conversão no funil
  timeProximityWeight: number;      // Proximidade do horário marcado
  commercialPotentialWeight: number;// Potencial comercial (ticket)
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  overdueWeight: 35,
  dueTodayWeight: 25,
  scoreWeight: 20,
  urgencyWeight: 12,
  stageWeight: 10,
  timeProximityWeight: 8,
  commercialPotentialWeight: 6,
};

const STAGE_WEIGHT_SCORES: Record<string, number> = {
  negociacao: 1.0,
  proposta: 0.9,
  reuniao_agendada: 0.8,
  qualificacao: 0.65,
  contato_feito: 0.5,
  prospeccao: 0.4,
  cliente: 0.1,
  desqualificado: 0.0,
};

/**
 * Calcula a pontuação composta de prioridade de uma ação.
 * Retorna score (0 a 100+), tier de classificação e justificativas do algoritmo.
 */
export function calculateActionPriority(
  action: ProspectAction,
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS,
  referenceDate = new Date()
): { priorityScore: number; priorityTier: ActionPriorityTier; priorityReasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Ações atrasadas
  if (action.status === 'atrasada') {
    score += weights.overdueWeight * 1.5;
    reasons.push('Ação Atrasada (Requer resolução imediata)');
  } else if (action.status === 'hoje') {
    score += weights.dueTodayWeight;
    reasons.push('Agendada para hoje');
  }

  // 2. Score ICP da empresa (proporcional de 0 a 100)
  const normalizedIcp = Math.max(0, Math.min(100, action.score || 0)) / 100;
  score += normalizedIcp * weights.scoreWeight * 2;
  if (action.score >= 90) {
    reasons.push(`Score ICP Elevado (${action.score}/100)`);
  }

  // 3. Nível de Urgência
  if (action.urgency === 'alta') {
    score += weights.urgencyWeight * 1.5;
    reasons.push('Urgência Alta');
  } else if (action.urgency === 'media') {
    score += weights.urgencyWeight * 0.8;
  }

  // 4. Etapa do Funil (etapas mais avançadas têm maior peso)
  const stageMultiplier = STAGE_WEIGHT_SCORES[action.funnelStage] || 0.4;
  score += stageMultiplier * weights.stageWeight * 1.5;
  if (['negociacao', 'proposta', 'reuniao_agendada'].includes(action.funnelStage)) {
    reasons.push(`Etapa Estratégica: ${action.funnelStageLabel}`);
  }

  // 5. Proximidade do Horário (se for hoje)
  if (action.status === 'hoje' && action.time) {
    try {
      const [hours, minutes] = action.time.split(':').map(Number);
      const currentHours = referenceDate.getHours();
      const currentMinutes = referenceDate.getMinutes();
      const actionTotalMin = hours * 60 + minutes;
      const currentTotalMin = currentHours * 60 + currentMinutes;
      const diffMin = actionTotalMin - currentTotalMin;

      if (diffMin < 0) {
        // Horário de hoje já passou
        score += weights.timeProximityWeight * 1.4;
        reasons.push('Horário ultrapassado');
      } else if (diffMin <= 60) {
        // Próxima hora
        score += weights.timeProximityWeight * 1.2;
        reasons.push('Horário iminente (próxima hora)');
      } else if (diffMin <= 180) {
        score += weights.timeProximityWeight * 0.8;
      }
    } catch {
      // ignore
    }
  }

  // 6. Potencial Comercial
  if (action.potentialValue) {
    const numericVal = parseInt(action.potentialValue.replace(/\D/g, ''), 10) || 0;
    if (numericVal >= 5000) {
      score += weights.commercialPotentialWeight * 1.3;
      reasons.push('Ticket Comercial de Alto Valor');
    }
  }

  // Definição do Tier de Prioridade
  let priorityTier: ActionPriorityTier = 'NORMAL';
  if (action.status === 'atrasada' || score >= 80 || action.score >= 93) {
    priorityTier = 'PRIORIDADE';
  } else if (score >= 60 || action.score >= 85) {
    priorityTier = 'ALTA';
  } else if (score >= 40) {
    priorityTier = 'MÉDIA';
  }

  return {
    priorityScore: Math.round(score),
    priorityTier,
    priorityReasons: reasons,
  };
}

/**
 * Ordena a fila de ações estritamente pelo algoritmo de prioridade
 */
export function sortActionsByPriority(
  actions: ProspectAction[],
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS
): ProspectAction[] {
  const referenceDate = new Date();

  // Calcula scores dinâmicos primeiro
  const enriched = actions.map((act) => {
    const calc = calculateActionPriority(act, weights, referenceDate);
    return {
      ...act,
      calculatedPriorityScore: calc.priorityScore,
      priorityTier: calc.priorityTier,
      priorityReasons: calc.priorityReasons,
    };
  });

  return enriched.sort((a, b) => {
    // 1. Status concluído/cancelado vai para o final
    if (a.status === 'concluida' && b.status !== 'concluida') return 1;
    if (b.status === 'concluida' && a.status !== 'concluida') return -1;
    if (a.status === 'cancelada' && b.status !== 'cancelada') return 1;
    if (b.status === 'cancelada' && a.status !== 'cancelada') return -1;

    // 2. Atrasadas têm prioridade absoluta no topo
    if (a.status === 'atrasada' && b.status !== 'atrasada') return -1;
    if (b.status === 'atrasada' && a.status !== 'atrasada') return 1;

    // 3. Ações de hoje vêm antes de próximas ações futuras
    if (a.status === 'hoje' && b.status === 'proxima') return -1;
    if (b.status === 'hoje' && a.status === 'proxima') return 1;

    // 4. Comparação por pontuação calculada pelo motor
    const scoreDiff = (b.calculatedPriorityScore || 0) - (a.calculatedPriorityScore || 0);
    if (scoreDiff !== 0) return scoreDiff;

    // 5. Desempate pelo Score ICP
    if (b.score !== a.score) return b.score - a.score;

    // 6. Desempate por horário
    return (a.time || '').localeCompare(b.time || '');
  });
}

/**
 * Helper para carregar pesos configuráveis do localStorage
 */
export function loadSavedPriorityWeights(): PriorityWeights {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('leadion-priority-weights');
    if (saved) {
      try {
        return { ...DEFAULT_PRIORITY_WEIGHTS, ...JSON.parse(saved) };
      } catch {
        // fallback
      }
    }
  }
  return DEFAULT_PRIORITY_WEIGHTS;
}

/**
 * Helper para salvar pesos configuráveis
 */
export function savePriorityWeights(weights: PriorityWeights): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('leadion-priority-weights', JSON.stringify(weights));
  }
}
