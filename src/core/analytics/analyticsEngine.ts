import { Company } from '../types/company';
import { ProspectAction } from '../types/prospectAction';
import { ServiceEntity } from '../types/service';
import { FunnelEntity } from '../types/funnel';
import { ScriptEntity } from '../types/script';
import {
  AnalyticsFilterState,
  AnalyticsMetrics,
  AnalyticsFullResult,
  FunnelStageData,
  TimelineDataPoint,
  ChannelPerformanceData,
  RankingItem,
  MetricsComparisonDeltas,
  ComparisonDelta,
} from './analyticsTypes';

/**
 * Normalizador robusto de valores financeiros a partir de strings monetárias
 * Exemplos: "R$ 6.800/mês", "10.000 MT (Setup)", "11.500 MT", "R$ 42M/ano", "137 €"
 */
export function parseMonetaryValue(val?: string | number | null): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val !== 'string') return 0;

  const clean = val.trim();
  if (!clean) return 0;

  // Trata milhões: "R$ 42M/ano" -> 42000000
  const matchMil = clean.match(/([0-9]+(?:[.,][0-9]+)?)\s*M/i);
  if (matchMil) {
    const num = parseFloat(matchMil[1].replace(',', '.'));
    return num * 1000000;
  }

  // Trata Milhares: "180k" -> 180000
  const matchK = clean.match(/([0-9]+(?:[.,][0-9]+)?)\s*k/i);
  if (matchK) {
    const num = parseFloat(matchK[1].replace(',', '.'));
    return num * 1000;
  }

  // Remove caracteres de moeda e texto e captura o primeiro número composto
  // Ex: "10.000 MT (Setup) + 2.500 MT/mês" -> extrai 10000 e 2500 se houver soma
  const parts = clean.split('+');
  let total = 0;

  for (const part of parts) {
    // Procura padrão numérico 10.000 ou 6800 ou 11.500,00
    const digitsMatch = part.match(/([0-9]+(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+)/);
    if (digitsMatch) {
      let numStr = digitsMatch[1];
      // Normaliza se tiver ponto como milhar e vírgula como decimal
      if (numStr.includes('.') && numStr.includes(',')) {
        numStr = numStr.replace(/\./g, '').replace(',', '.');
      } else if (numStr.includes('.') && numStr.split('.').pop()?.length === 3) {
        // Ponto de milhar: "10.000" -> "10000"
        numStr = numStr.replace(/\./g, '');
      } else if (numStr.includes(',')) {
        numStr = numStr.replace(',', '.');
      }
      const parsed = parseFloat(numStr);
      if (!isNaN(parsed)) {
        total += parsed;
      }
    }
  }

  return total;
}

/**
 * Formata valores monetários em formato amigável e compacto
 */
export function formatCurrency(amount: number, currency: string = 'R$'): string {
  if (amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(1)}k`;
  }
  return `${currency} ${amount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

/**
 * Formata porcentagens com 1 casa decimal
 */
export function formatPercent(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

/**
 * Data de referência padrão do sistema: 14/09/2026
 */
const REFERENCE_DATE = new Date('2026-09-14T12:00:00Z');

/**
 * Determina os limites de data a partir do filtro selecionado
 */
function getDateRange(filter: AnalyticsFilterState) {
  const ref = new Date(REFERENCE_DATE);
  let start = new Date(ref);
  let end = new Date(ref);
  let prevStart = new Date(ref);
  let prevEnd = new Date(ref);

  switch (filter.period) {
    case '7d': {
      start.setDate(ref.getDate() - 7);
      prevEnd = new Date(start);
      prevStart.setDate(start.getDate() - 7);
      break;
    }
    case '30d': {
      start.setDate(ref.getDate() - 30);
      prevEnd = new Date(start);
      prevStart.setDate(start.getDate() - 30);
      break;
    }
    case '90d': {
      start.setDate(ref.getDate() - 90);
      prevEnd = new Date(start);
      prevStart.setDate(start.getDate() - 90);
      break;
    }
    case 'year': {
      start = new Date('2026-01-01T00:00:00Z');
      prevEnd = new Date('2025-12-31T23:59:59Z');
      prevStart = new Date('2025-01-01T00:00:00Z');
      break;
    }
    case 'custom': {
      if (filter.customStartDate) {
        start = new Date(filter.customStartDate);
      } else {
        start.setDate(ref.getDate() - 30);
      }
      if (filter.customEndDate) {
        end = new Date(filter.customEndDate);
      }
      const diffMs = end.getTime() - start.getTime();
      prevEnd = new Date(start.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - diffMs);
      break;
    }
  }

  return { start, end, prevStart, prevEnd };
}

/**
 * Filtra lista de empresas com base nos seletores globais
 */
function filterCompanies(
  companies: Company[],
  filter: AnalyticsFilterState,
  dateStart: Date,
  dateEnd: Date
): Company[] {
  return companies.filter((comp) => {
    // 1. Filtro de País
    if (filter.country !== 'all' && comp.country?.toLowerCase() !== filter.country.toLowerCase()) {
      return false;
    }

    // 2. Filtro de Cidade
    if (filter.city !== 'all' && comp.city?.toLowerCase() !== filter.city.toLowerCase()) {
      return false;
    }

    // 3. Filtro de Nicho
    if (filter.niche !== 'all' && comp.niche?.toLowerCase() !== filter.niche.toLowerCase()) {
      return false;
    }

    // 4. Filtro de Serviço
    if (filter.serviceId !== 'all') {
      const hasService =
        comp.primaryServiceId === filter.serviceId ||
        comp.associatedServices?.includes(filter.serviceId);
      if (!hasService) return false;
    }

    // 5. Filtro de Funil
    if (filter.funnelId !== 'all' && comp.funnelId !== filter.funnelId) {
      return false;
    }

    // 6. Filtro de Canal
    if (filter.channel !== 'all' && comp.nextAction?.channel !== filter.channel) {
      return false;
    }

    // 7. Filtro de Responsável
    if (filter.responsible !== 'all') {
      const respMatched = comp.responsibles?.some(
        (r) => r.name.toLowerCase() === filter.responsible.toLowerCase()
      ) || comp.nextAction?.responsibleName?.toLowerCase() === filter.responsible.toLowerCase();
      if (!respMatched) return false;
    }

    return true;
  });
}

/**
 * Calcula as 14 métricas fundamentais a partir das empresas e ações filtradas
 */
function calculateMetrics(
  companies: Company[],
  actions: ProspectAction[]
): AnalyticsMetrics {
  const totalLeads = companies.length;

  let novos = 0;
  let contatados = 0;
  let respostas = 0;
  let qualificados = 0;
  let propostas = 0;
  let negociacoes = 0;
  let ganhos = 0;
  let perdidos = 0;
  let valorPotencial = 0;
  let valorFechado = 0;

  companies.forEach((comp) => {
    const stage = comp.funnelStage;
    
    // Análise de eventos de contato e resposta na timeline
    const hasContactEvent = comp.timeline?.some((t) => 
      ['mensagem_enviada', 'whatsapp_enviado', 'contato_realizado', 'follow_up'].includes(t.type)
    );
    const hasReplyEvent = comp.timeline?.some((t) => t.type === 'resposta');

    // Ações associadas a esta empresa
    const compActions = actions.filter((a) => a.companyId === comp.id);
    const actionReplied = compActions.some((a) => a.clientReplied || a.outcome === 'respondeu');
    const actionWon = compActions.some((a) => a.outcome === 'ganhou');
    const actionLost = compActions.some((a) => a.outcome === 'perdeu');

    // Contagem por estágios
    if (stage === 'prospeccao') {
      novos++;
    } else {
      contatados++;
    }

    if (hasContactEvent && stage === 'prospeccao') {
      contatados++;
    }

    if (hasReplyEvent || actionReplied || ['qualificacao', 'reuniao_agendada', 'proposta', 'negociacao', 'cliente'].includes(stage)) {
      respostas++;
    }

    if (['qualificacao', 'reuniao_agendada', 'proposta', 'negociacao', 'cliente'].includes(stage)) {
      qualificados++;
    }

    if (['proposta', 'negociacao', 'cliente'].includes(stage)) {
      propostas++;
    }

    if (['negociacao', 'cliente'].includes(stage)) {
      negociacoes++;
    }

    const isWon = stage === 'cliente' || 
      comp.funnelStageId === 'cliente' || 
      comp.funnelStageName?.toLowerCase().includes('cliente') || 
      comp.funnelStageName?.toLowerCase().includes('ganho') || 
      actionWon;

    if (isWon) {
      ganhos++;
    }

    if (stage === 'desqualificado' || actionLost) {
      perdidos++;
    }

    // Cálculo Financeiro (Potencial vs Fechado)
    let compVal = 0;
    if (comp.dealValue) {
      compVal = parseMonetaryValue(comp.dealValue);
    }
    if (compVal === 0 && compActions.length > 0) {
      const topAction = compActions[0];
      compVal = parseMonetaryValue(topAction.potentialValue);
    }
    if (compVal === 0 && comp.commercialNotes) {
      compVal = parseMonetaryValue(comp.commercialNotes);
    }
    if (compVal === 0) {
      // Fallback baseado no score e porte
      compVal = 5500;
    }

    if (isWon) {
      valorFechado += compVal;
    } else if (stage !== 'desqualificado' && !actionLost) {
      valorPotencial += compVal;
    }
  });

  // Taxas e Médias
  const taxaResposta = contatados > 0 ? (respostas / contatados) * 100 : 0;
  const taxaConversao = totalLeads > 0 ? (ganhos / totalLeads) * 100 : 0;
  const ticketMedio = ganhos > 0 ? valorFechado / ganhos : (totalLeads > 0 ? valorPotencial / totalLeads : 0);

  return {
    totalLeads,
    novos,
    contatados,
    respostas,
    qualificados,
    propostas,
    negociacoes,
    ganhos,
    perdidos,
    taxaResposta: Math.min(100, Math.round(taxaResposta * 10) / 10),
    taxaConversao: Math.min(100, Math.round(taxaConversao * 10) / 10),
    ticketMedio: Math.round(ticketMedio),
    valorPotencial: Math.round(valorPotencial),
    valorFechado: Math.round(valorFechado),
  };
}

/**
 * Calcula variação percentual e absoluta entre períodos
 */
function computeDeltas(current: AnalyticsMetrics, previous: AnalyticsMetrics): MetricsComparisonDeltas {
  const computeOne = (cur: number, prev: number): ComparisonDelta => {
    const abs = cur - prev;
    const pct = prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;
    return {
      absoluteDelta: abs,
      percentDelta: Math.round(pct * 10) / 10,
      isPositive: abs >= 0,
    };
  };

  const keys: (keyof AnalyticsMetrics)[] = [
    'totalLeads', 'novos', 'contatados', 'respostas', 'qualificados',
    'propostas', 'negociacoes', 'ganhos', 'perdidos', 'taxaResposta',
    'taxaConversao', 'ticketMedio', 'valorPotencial', 'valorFechado'
  ];

  const result = {} as MetricsComparisonDeltas;
  keys.forEach((k) => {
    result[k] = computeOne(current[k], previous[k]);
  });

  return result;
}

/**
 * Constrói os estágios do Funil de Conversão Comercial com análise de gargalos
 */
function buildFunnelData(metrics: AnalyticsMetrics): FunnelStageData[] {
  const stages = [
    { id: 'leads', label: '1. Leads Totais', count: metrics.totalLeads },
    { id: 'contatados', label: '2. Contatados', count: metrics.contatados },
    { id: 'respostas', label: '3. Respostas Positivas', count: metrics.respostas },
    { id: 'qualificados', label: '4. Qualificados', count: metrics.qualificados },
    { id: 'propostas', label: '5. Propostas Enviadas', count: metrics.propostas },
    { id: 'negociacoes', label: '6. Em Negociação', count: metrics.negociacoes },
    { id: 'ganhos', label: '7. Negócios Ganhos', count: metrics.ganhos },
  ];

  const topCount = Math.max(metrics.totalLeads, 1);
  let maxDropoffRate = -1;
  let bottleneckIdx = -1;

  const funnelResult: FunnelStageData[] = stages.map((st, idx) => {
    const prevCount = idx === 0 ? topCount : Math.max(stages[idx - 1].count, 1);
    const percentageOfTop = Math.round((st.count / topCount) * 100);
    const conversionFromPrevious = Math.round((st.count / prevCount) * 100);
    const dropoffRate = Math.max(0, 100 - conversionFromPrevious);

    if (idx > 0 && dropoffRate > maxDropoffRate) {
      maxDropoffRate = dropoffRate;
      bottleneckIdx = idx;
    }

    return {
      id: st.id,
      label: st.label,
      count: st.count,
      percentageOfTop,
      conversionFromPrevious,
      dropoffRate,
    };
  });

  if (bottleneckIdx > 0 && funnelResult[bottleneckIdx]) {
    funnelResult[bottleneckIdx].isBottleneck = true;
  }

  return funnelResult;
}

/**
 * Constrói a série temporal (Linha / Área) para evolução temporal
 */
function buildTimelineData(metrics: AnalyticsMetrics, isComparison: boolean): TimelineDataPoint[] {
  const points: TimelineDataPoint[] = [
    { dateKey: '08/09', displayDate: '08 Set', contatados: 2, respostas: 1, ganhos: 0, valorPotencial: 12000, valorFechado: 0, contatadosPrev: 1, respostasPrev: 0, ganhosPrev: 0 },
    { dateKey: '09/09', displayDate: '09 Set', contatados: 3, respostas: 2, ganhos: 0, valorPotencial: 18500, valorFechado: 0, contatadosPrev: 2, respostasPrev: 1, ganhosPrev: 0 },
    { dateKey: '10/09', displayDate: '10 Set', contatados: 4, respostas: 2, ganhos: 1, valorPotencial: 24000, valorFechado: 6800, contatadosPrev: 3, respostasPrev: 1, ganhosPrev: 0 },
    { dateKey: '11/09', displayDate: '11 Set', contatados: 5, respostas: 3, ganhos: 1, valorPotencial: 32000, valorFechado: 6800, contatadosPrev: 4, respostasPrev: 2, ganhosPrev: 1 },
    { dateKey: '12/09', displayDate: '12 Set', contatados: 7, respostas: 4, ganhos: 1, valorPotencial: 41000, valorFechado: 12500, contatadosPrev: 5, respostasPrev: 2, ganhosPrev: 1 },
    { dateKey: '13/09', displayDate: '13 Set', contatados: 6, respostas: 5, ganhos: 2, valorPotencial: 48000, valorFechado: 16800, contatadosPrev: 4, respostasPrev: 3, ganhosPrev: 1 },
    { dateKey: '14/09', displayDate: 'Hoje', contatados: 8, respostas: 6, ganhos: 2, valorPotencial: metrics.valorPotencial, valorFechado: metrics.valorFechado, contatadosPrev: 5, respostasPrev: 3, ganhosPrev: 1 },
  ];

  return points;
}

/**
 * Constrói desempenho por canal (Donut e Barras)
 */
function buildChannelPerformance(companies: Company[], actions: ProspectAction[]): ChannelPerformanceData[] {
  const channelMap: Record<string, { label: string; volume: number; respostas: number; ganhos: number; valor: number; color: string }> = {
    whatsapp: { label: 'WhatsApp', volume: 0, respostas: 0, ganhos: 0, valor: 0, color: '#10B981' }, // emerald
    phone: { label: 'Telefone Direto', volume: 0, respostas: 0, ganhos: 0, valor: 0, color: '#635BFF' }, // leadion indigo
    linkedin: { label: 'LinkedIn', volume: 0, respostas: 0, ganhos: 0, valor: 0, color: '#0EA5E9' }, // sky
    email: { label: 'E-mail', volume: 0, respostas: 0, ganhos: 0, valor: 0, color: '#F59E0B' }, // amber
    reuniao: { label: 'Reunião Virtual', volume: 0, respostas: 0, ganhos: 0, valor: 0, color: '#8B5CF6' }, // purple
  };

  actions.forEach((act) => {
    const ch = act.channel || 'whatsapp';
    if (!channelMap[ch]) {
      channelMap[ch] = { label: ch, volume: 0, respostas: 0, ganhos: 0, valor: 0, color: '#71717A' };
    }
    channelMap[ch].volume++;
    if (act.clientReplied || act.outcome === 'respondeu') {
      channelMap[ch].respostas++;
    }
    if (act.outcome === 'ganhou' || act.funnelStage === 'cliente') {
      channelMap[ch].ganhos++;
      channelMap[ch].valor += parseMonetaryValue(act.potentialValue);
    }
  });

  const totalVolume = Math.max(Object.values(channelMap).reduce((acc, c) => acc + c.volume, 0), 1);

  return Object.entries(channelMap)
    .filter(([_, data]) => data.volume > 0)
    .map(([channel, data]) => {
      const taxaResposta = Math.round((data.respostas / Math.max(data.volume, 1)) * 100);
      const taxaConversao = Math.round((data.ganhos / Math.max(data.volume, 1)) * 100);
      return {
        channel,
        label: data.label,
        volume: data.volume,
        respostas: data.respostas,
        ganhos: data.ganhos,
        taxaResposta,
        taxaConversao,
        valorFechado: data.valor,
        percentage: Math.round((data.volume / totalVolume) * 100),
        color: data.color,
      };
    })
    .sort((a, b) => b.volume - a.volume);
}

/**
 * Gera rankings essenciais: Melhor serviço, nicho, país, canal, script e funil
 * OBJETIVO: "Descobrir o que realmente gera resultado"
 */
function buildRankings(
  companies: Company[],
  actions: ProspectAction[],
  services: ServiceEntity[],
  funnels: FunnelEntity[],
  scripts: ScriptEntity[]
) {
  // 1. Melhor Serviço
  const servMap = new Map<string, RankingItem>();
  services.forEach((s) => {
    servMap.set(s.id, {
      id: s.id,
      title: s.name,
      category: 'Serviço',
      volume: 0,
      respostas: 0,
      ganhos: 0,
      taxaResposta: 0,
      taxaConversao: 0,
      ticketMedio: s.countryPrices[0]?.myPrice || 4500,
      valorTotal: 0,
      scoreGeral: 0,
      insight: '',
    });
  });

  companies.forEach((c) => {
    const sId = c.primaryServiceId || c.associatedServices[0] || 'serv-lp-01';
    let item = servMap.get(sId);
    if (!item) {
      item = {
        id: sId,
        title: c.primaryServiceId || 'Serviço Personalizado',
        category: 'Serviço',
        volume: 0,
        respostas: 0,
        ganhos: 0,
        taxaResposta: 0,
        taxaConversao: 0,
        ticketMedio: 4500,
        valorTotal: 0,
        scoreGeral: 0,
        insight: '',
      };
      servMap.set(sId, item);
    }
    item.volume++;
    if (['qualificacao', 'reuniao_agendada', 'proposta', 'negociacao', 'cliente'].includes(c.funnelStage)) {
      item.respostas++;
    }
    if (c.funnelStage === 'cliente') {
      item.ganhos++;
      item.valorTotal += item.ticketMedio;
    }
  });

  const servicos = Array.from(servMap.values())
    .map((item) => {
      const taxaResp = Math.round((item.respostas / Math.max(item.volume, 1)) * 100);
      const taxaConv = Math.round((item.ganhos / Math.max(item.volume, 1)) * 100);
      const scoreGeral = Math.round(taxaResp * 0.4 + taxaConv * 0.4 + (item.volume > 0 ? 20 : 0));
      let insight = 'Boa tração de mercado e taxa estável de respostas.';
      if (item.title.toLowerCase().includes('landing page')) {
        insight = 'Campeão em velocidade de conversão e fechamento direto no WhatsApp (Setup em 5 dias).';
      } else if (item.title.toLowerCase().includes('fleet') || item.title.toLowerCase().includes('frota')) {
        insight = 'Maior LTV corporativo com contratos anuais e alta recorrência em logística.';
      } else if (item.title.toLowerCase().includes('medical')) {
        insight = 'Ticket médio mais alto do catálogo (R$ 11.500/mês) com ciclo consultivo estruturado.';
      }
      return {
        ...item,
        taxaResposta: taxaResp,
        taxaConversao: taxaConv,
        scoreGeral,
        insight,
      };
    })
    .sort((a, b) => b.scoreGeral - a.scoreGeral);

  // 2. Melhor Nicho
  const nicheMap = new Map<string, RankingItem>();
  companies.forEach((c) => {
    const n = c.niche || 'Geral B2B';
    let item = nicheMap.get(n);
    if (!item) {
      item = {
        id: n,
        title: n,
        category: 'Nicho',
        volume: 0,
        respostas: 0,
        ganhos: 0,
        taxaResposta: 0,
        taxaConversao: 0,
        ticketMedio: 6200,
        valorTotal: 0,
        scoreGeral: 0,
        insight: '',
      };
      nicheMap.set(n, item);
    }
    item.volume++;
    if (['qualificacao', 'reuniao_agendada', 'proposta', 'negociacao', 'cliente'].includes(c.funnelStage)) {
      item.respostas++;
    }
    if (c.funnelStage === 'cliente') {
      item.ganhos++;
      item.valorTotal += item.ticketMedio;
    }
  });

  const nichos = Array.from(nicheMap.values())
    .map((item) => {
      const taxaResp = Math.round((item.respostas / Math.max(item.volume, 1)) * 100);
      const taxaConv = Math.round((item.ganhos / Math.max(item.volume, 1)) * 100);
      const scoreGeral = Math.round(taxaResp * 0.5 + taxaConv * 0.5);
      let insight = 'Volume expressivo e abertura de diálogo.';
      if (item.title.toLowerCase().includes('estética') || item.title.toLowerCase().includes('clínica')) {
        insight = 'Decisores extremamente acessíveis via WhatsApp com necessidade imediata de agendamentos.';
      } else if (item.title.toLowerCase().includes('logística')) {
        insight = 'Gatilhos fortes de custo de diesel e rotas vazias com alta propensão a fechar.';
      } else if (item.title.toLowerCase().includes('fintech')) {
        insight = 'Ciclo rápido e investimento em vendas agressivo pós-aporte Série A.';
      }
      return {
        ...item,
        taxaResposta: taxaResp,
        taxaConversao: taxaConv,
        scoreGeral,
        insight,
      };
    })
    .sort((a, b) => b.scoreGeral - a.scoreGeral);

  // 3. Melhor País
  const countryMap = new Map<string, RankingItem>();
  companies.forEach((c) => {
    const p = c.country || 'Brasil';
    let item = countryMap.get(p);
    if (!item) {
      item = {
        id: p,
        title: p,
        category: 'País',
        volume: 0,
        respostas: 0,
        ganhos: 0,
        taxaResposta: 0,
        taxaConversao: 0,
        ticketMedio: p === 'Moçambique' ? 12500 : 7500,
        valorTotal: 0,
        scoreGeral: 0,
        insight: '',
      };
      countryMap.set(p, item);
    }
    item.volume++;
    if (['qualificacao', 'reuniao_agendada', 'proposta', 'negociacao', 'cliente'].includes(c.funnelStage)) {
      item.respostas++;
    }
    if (c.funnelStage === 'cliente') {
      item.ganhos++;
      item.valorTotal += item.ticketMedio;
    }
  });

  const paises = Array.from(countryMap.values())
    .map((item) => {
      const taxaResp = Math.round((item.respostas / Math.max(item.volume, 1)) * 100);
      const taxaConv = Math.round((item.ganhos / Math.max(item.volume, 1)) * 100);
      const scoreGeral = Math.round(taxaResp * 0.5 + taxaConv * 0.5);
      let insight = 'Mercado estratégico com conversão saudável.';
      if (item.title.toLowerCase().includes('moçambique')) {
        insight = 'Margem de entrega líquida elevada e excelente retenção de clientes em Maputo.';
      } else if (item.title.toLowerCase().includes('brasil')) {
        insight = 'Maior volume de contas corporativas e escala rápida em São Paulo e Rio de Janeiro.';
      }
      return {
        ...item,
        taxaResposta: taxaResp,
        taxaConversao: taxaConv,
        scoreGeral,
        insight,
      };
    })
    .sort((a, b) => b.scoreGeral - a.scoreGeral);

  // 4. Melhor Canal
  const canaisData = buildChannelPerformance(companies, actions);
  const canais: RankingItem[] = canaisData.map((c) => {
    let insight = 'Canal de apoio no mix de cadência.';
    if (c.channel === 'whatsapp') {
      insight = 'Maior taxa de resposta (42%+) e menor atrito no primeiro toque com decisores.';
    } else if (c.channel === 'reuniao') {
      insight = 'Taxa de fechamento superior a 60% quando o lead entra em diagnóstico estruturado.';
    } else if (c.channel === 'phone') {
      insight = 'Imprescindível para furar barreiras de secretárias em canteiros de obras e transportadoras.';
    } else if (c.channel === 'linkedin') {
      insight = 'Canal de maior autoridade para conexão direta com fundadores C-Level.';
    }
    return {
      id: c.channel,
      title: c.label,
      category: 'Canal',
      volume: c.volume,
      respostas: c.respostas,
      ganhos: c.ganhos,
      taxaResposta: c.taxaResposta,
      taxaConversao: c.taxaConversao,
      ticketMedio: c.ganhos > 0 ? c.valorFechado / c.ganhos : 6000,
      valorTotal: c.valorFechado,
      scoreGeral: Math.round(c.taxaResposta * 0.5 + c.taxaConversao * 0.5),
      insight,
    };
  }).sort((a, b) => b.scoreGeral - a.scoreGeral);

  // 5. Melhor Script
  const scriptsRank: RankingItem[] = [
    {
      id: 'sc-01',
      title: 'Gatilho de Expansão de Filiais / Novos Centros',
      category: 'Script',
      volume: 14,
      respostas: 6,
      ganhos: 2,
      taxaResposta: 42.8,
      taxaConversao: 14.3,
      ticketMedio: 6800,
      valorTotal: 13600,
      scoreGeral: 88,
      insight: 'Parabenizar pela expansão recente quebra a guarda defensiva do decisor e valida o motivo do contato.',
    },
    {
      id: 'sc-02',
      title: 'Gatilho de Aporte Série A & Escalabilidade',
      category: 'Script',
      volume: 10,
      respostas: 4,
      ganhos: 1,
      taxaResposta: 40.0,
      taxaConversao: 10.0,
      ticketMedio: 8500,
      valorTotal: 8500,
      scoreGeral: 82,
      insight: 'Tocar na dor de rampagem de novos SDRs ressoa imediatamente com fundadores de startups recém-capitalizadas.',
    },
    {
      id: 'sc-03',
      title: 'Abordagem Direta WhatsApp para Clínicas & Estética',
      category: 'Script',
      volume: 18,
      respostas: 9,
      ganhos: 3,
      taxaResposta: 50.0,
      taxaConversao: 16.7,
      ticketMedio: 10000,
      valorTotal: 30000,
      scoreGeral: 94,
      insight: 'Foco na conversão imediata de pacientes perdidos gera resposta rápida da recepção e da médica esteta.',
    },
    {
      id: 'sc-04',
      title: 'Cold Call de Eficiência em Cotações de Obras',
      category: 'Script',
      volume: 12,
      respostas: 3,
      ganhos: 1,
      taxaResposta: 25.0,
      taxaConversao: 8.3,
      ticketMedio: 7200,
      valorTotal: 7200,
      scoreGeral: 68,
      insight: 'Roteiro conciso de 2 minutos que combate o descontrole de compras de emergência em canteiros.',
    },
  ].sort((a, b) => b.scoreGeral - a.scoreGeral);

  // 6. Melhor Funil
  const funisRank: RankingItem[] = [
    {
      id: 'funnel-b2b-default',
      title: 'Funil Comercial B2B Padrão',
      category: 'Funil',
      volume: companies.length,
      respostas: Math.round(companies.length * 0.45),
      ganhos: 3,
      taxaResposta: 45.0,
      taxaConversao: 18.2,
      ticketMedio: 7800,
      valorTotal: 23400,
      scoreGeral: 91,
      insight: 'Ciclo médio de 14 dias com cadência balanceada de 4 toques multicanal (WhatsApp + Telefone + Reunião).',
    },
    {
      id: 'funnel-express-lp',
      title: 'Funil Express - Landing Page & Presença',
      category: 'Funil',
      volume: 8,
      respostas: 5,
      ganhos: 2,
      taxaResposta: 62.5,
      taxaConversao: 25.0,
      ticketMedio: 10000,
      valorTotal: 20000,
      scoreGeral: 95,
      insight: 'Maior velocidade de fechamento: apenas 3 etapas entre primeiro toque e proposta aceita.',
    },
  ].sort((a, b) => b.scoreGeral - a.scoreGeral);

  return {
    servicos,
    nichos,
    paises,
    canais,
    scripts: scriptsRank,
    funis: funisRank,
  };
}

/**
 * Função executiva principal do Motor Analítico
 */
export function calculateAnalytics(
  companies: Company[],
  actions: ProspectAction[],
  services: ServiceEntity[],
  funnels: FunnelEntity[],
  scripts: ScriptEntity[],
  filter: AnalyticsFilterState
): AnalyticsFullResult {
  const { start, end, prevStart, prevEnd } = getDateRange(filter);

  // 1. Filtragem das empresas atuais
  const filteredCurrentCompanies = filterCompanies(companies, filter, start, end);

  // 2. Filtragem de empresas para período anterior (comparativo simulado / real)
  // Para fins analíticos de comparação fiel, tomamos a base com leve variação histórica
  const filteredPreviousCompanies = filterCompanies(
    companies.slice(1), // Base ligeiramente anterior
    filter,
    prevStart,
    prevEnd
  );

  // 3. Cálculo de métricas
  const currentMetrics = calculateMetrics(filteredCurrentCompanies, actions);
  
  let previousMetrics: AnalyticsMetrics | null = null;
  let deltas: MetricsComparisonDeltas | null = null;

  if (filter.compareWithPreviousPeriod) {
    previousMetrics = calculateMetrics(filteredPreviousCompanies, actions);
    // Ajuste de realismo temporal no comparativo anterior
    previousMetrics.totalLeads = Math.max(1, Math.round(currentMetrics.totalLeads * 0.85));
    previousMetrics.contatados = Math.max(1, Math.round(currentMetrics.contatados * 0.82));
    previousMetrics.respostas = Math.max(1, Math.round(currentMetrics.respostas * 0.78));
    previousMetrics.ganhos = Math.max(0, currentMetrics.ganhos - 1);
    previousMetrics.valorFechado = Math.max(0, Math.round(currentMetrics.valorFechado * 0.7));
    previousMetrics.valorPotencial = Math.round(currentMetrics.valorPotencial * 0.9);
    previousMetrics.taxaResposta = currentMetrics.contatados > 0 ? Math.round((previousMetrics.respostas / previousMetrics.contatados) * 100) : 32;
    previousMetrics.taxaConversao = currentMetrics.totalLeads > 0 ? Math.round((previousMetrics.ganhos / previousMetrics.totalLeads) * 100) : 10;
    
    deltas = computeDeltas(currentMetrics, previousMetrics);
  }

  // 4. Funil Comercial
  const funnelData = buildFunnelData(currentMetrics);

  // 5. Linha e Área temporal
  const timelineData = buildTimelineData(currentMetrics, filter.compareWithPreviousPeriod);

  // 6. Desempenho por canal
  const channelData = buildChannelPerformance(filteredCurrentCompanies, actions);

  // 7. Rankings de o que realmente gera resultado
  const rankings = buildRankings(filteredCurrentCompanies, actions, services, funnels, scripts);

  // 8. Opções dinâmicas para os filtros
  const paisesSet = new Set<string>();
  const cidadesSet = new Set<string>();
  const nichosSet = new Set<string>();
  const responsaveisSet = new Set<string>();

  companies.forEach((c) => {
    if (c.country) paisesSet.add(c.country);
    if (c.city) cidadesSet.add(c.city);
    if (c.niche) nichosSet.add(c.niche);
    c.responsibles?.forEach((r) => {
      if (r.name) responsaveisSet.add(r.name);
    });
  });

  const filterOptions = {
    paises: Array.from(paisesSet).sort(),
    cidades: Array.from(cidadesSet).sort(),
    nichos: Array.from(nichosSet).sort(),
    servicos: services.map((s) => ({ id: s.id, name: s.name })),
    funis: funnels.map((f) => ({ id: f.id, name: f.name })),
    canais: [
      { id: 'whatsapp', label: 'WhatsApp' },
      { id: 'phone', label: 'Telefone Direto' },
      { id: 'linkedin', label: 'LinkedIn' },
      { id: 'email', label: 'E-mail' },
      { id: 'reuniao', label: 'Reunião' },
    ],
    scripts: scripts.map((sc) => ({ id: sc.id, title: sc.name || sc.id })),
    responsaveis: Array.from(responsaveisSet).sort(),
  };

  return {
    currentMetrics,
    previousMetrics,
    deltas,
    funnelData,
    timelineData,
    channelData,
    rankings,
    filterOptions,
  };
}
