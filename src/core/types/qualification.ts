export type QualificationTargetType = 'client' | 'service';
export type QualificationResponseType = 'boolean' | 'choice' | 'scale';

export interface QualificationOption {
  id: string;
  label: string;
  value: string;
  points: number;
  isIdeal?: boolean;
}

export interface QualificationQuestion {
  id: string;
  text: string;
  targetType: QualificationTargetType;
  serviceId?: string; // 'all' ou ID do serviço específico (ex: 'serv-landing-page')
  serviceName?: string;
  category: string;
  responseType: QualificationResponseType;
  options: QualificationOption[];
  idealResponse: string; // Ex: 'nao' ou 'sim' ou valor da option
  idealPoints: number;
  weight: number; // Peso multiplicador (ex: 1, 1.5, 2, 3)
  status: 'active' | 'inactive';
  rationale?: string; // Explicação técnica do motivo da pontuação
  createdAt: string;
  updatedAt: string;
}

export interface AuditScoreBreakdownItem {
  questionId: string;
  questionText: string;
  category: string;
  targetType: QualificationTargetType;
  serviceId?: string;
  serviceName?: string;
  answeredValue: string;
  answeredLabel: string;
  isIdeal: boolean;
  pointsEarned: number;
  maxPoints: number;
  weight: number;
  weightedEarned: number;
  weightedMax: number;
  contributionPercentage: number;
  rationale: string;
}

export interface ServiceScoreItem {
  serviceId: string;
  serviceName: string;
  score: number; // 0 a 100
  level: 'Excelente Fit' | 'Bom Fit' | 'Moderado' | 'Baixo Fit';
  breakdown: AuditScoreBreakdownItem[];
  questionsCount: number;
}

export interface RecommendationFactor {
  factor: 'adequacao' | 'necessidade' | 'prioridade' | 'capacidade' | 'contexto';
  label: string;
  score: number; // 0 a 100
  weight: number;
  contribution: number;
  description: string;
}

export interface ServiceRecommendationResult {
  serviceId: string;
  serviceName: string;
  serviceScore: number;
  combinationScore: number; // 0 a 100 (combinação ponderada dos 5 pilares)
  matchLevel: 'Altíssima Recomendação' | 'Forte Recomendação' | 'Oportunidade Secundária';
  factors: RecommendationFactor[];
  summary: string;
  pitchAngle: string;
}

export interface CompanyScoreResult {
  companyId: string;
  companyName: string;
  
  // 1. SCORE DO CLIENTE (0 a 100)
  clientScore: number;
  clientLevel: 'Tier 1 (Excelente)' | 'Tier 2 (Qualificado)' | 'Tier 3 (Neutro)' | 'Desqualificado';
  clientBreakdown: AuditScoreBreakdownItem[];

  // 2. SCORE DO SERVIÇO (0 a 100 por serviço)
  serviceScores: ServiceScoreItem[];

  // 3. RECOMENDAÇÃO INTELIGENTE (Adequação, Necessidade, Prioridade, Capacidade, Contexto)
  recommendedService: ServiceRecommendationResult | null;

  // METADADOS DE AUDITORIA
  totalAnswered: number;
  totalQuestions: number;
  calculatedAt: string;
  auditHash: string; // Hash determinístico dos dados
}
