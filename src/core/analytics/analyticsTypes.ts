export type PeriodOption = '7d' | '30d' | '90d' | 'year' | 'custom';

export interface AnalyticsFilterState {
  period: PeriodOption;
  customStartDate?: string;
  customEndDate?: string;
  compareWithPreviousPeriod: boolean;
  country: string;
  city: string;
  niche: string;
  serviceId: string;
  funnelId: string;
  channel: string;
  scriptId: string;
  responsible: string;
}

export interface AnalyticsMetrics {
  totalLeads: number;
  novos: number;
  contatados: number;
  respostas: number;
  qualificados: number;
  propostas: number;
  negociacoes: number;
  ganhos: number;
  perdidos: number;
  taxaResposta: number; // % (respostas / contatados * 100)
  taxaConversao: number; // % (ganhos / totalLeads * 100)
  ticketMedio: number; // Valor monetário médio de negócios ganhos/fechados
  valorPotencial: number; // Valor acumulado de oportunidades em aberto
  valorFechado: number; // Valor acumulado de negócios fechados com sucesso
}

export interface ComparisonDelta {
  absoluteDelta: number;
  percentDelta: number; // ex: +14.5% ou -8.2%
  isPositive: boolean;
}

export type MetricsComparisonDeltas = Record<keyof AnalyticsMetrics, ComparisonDelta>;

export interface FunnelStageData {
  id: string;
  label: string;
  count: number;
  percentageOfTop: number;
  conversionFromPrevious: number;
  dropoffRate: number;
  isBottleneck?: boolean;
}

export interface TimelineDataPoint {
  dateKey: string;
  displayDate: string;
  contatados: number;
  respostas: number;
  ganhos: number;
  valorPotencial: number;
  valorFechado: number;
  // Comparativo período anterior
  contatadosPrev?: number;
  respostasPrev?: number;
  ganhosPrev?: number;
}

export interface ChannelPerformanceData {
  channel: string;
  label: string;
  volume: number;
  respostas: number;
  ganhos: number;
  taxaResposta: number;
  taxaConversao: number;
  valorFechado: number;
  percentage: number;
  color: string;
}

export interface RankingItem {
  id: string;
  title: string;
  category?: string;
  volume: number;
  respostas: number;
  ganhos: number;
  taxaResposta: number;
  taxaConversao: number;
  ticketMedio: number;
  valorTotal: number;
  scoreGeral: number; // 0-100 ponderado para identificar "o que realmente gera resultado"
  insight: string;
}

export type RankingCategory = 
  | 'servico'
  | 'nicho'
  | 'pais'
  | 'canal'
  | 'script'
  | 'funil';

export interface AnalyticsFullResult {
  currentMetrics: AnalyticsMetrics;
  previousMetrics: AnalyticsMetrics | null;
  deltas: MetricsComparisonDeltas | null;
  funnelData: FunnelStageData[];
  timelineData: TimelineDataPoint[];
  channelData: ChannelPerformanceData[];
  rankings: {
    servicos: RankingItem[];
    nichos: RankingItem[];
    paises: RankingItem[];
    canais: RankingItem[];
    scripts: RankingItem[];
    funis: RankingItem[];
  };
  filterOptions: {
    paises: string[];
    cidades: string[];
    nichos: string[];
    servicos: { id: string; name: string }[];
    funis: { id: string; name: string }[];
    canais: { id: string; label: string }[];
    scripts: { id: string; title: string }[];
    responsaveis: string[];
  };
}
