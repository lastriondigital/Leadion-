import React from 'react';
import { 
  Users, 
  UserPlus, 
  PhoneCall, 
  MessageSquare, 
  CheckCircle2, 
  FileSpreadsheet, 
  Handshake, 
  Trophy, 
  XCircle, 
  Percent, 
  TrendingUp, 
  DollarSign, 
  Coins, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { AnalyticsMetrics, MetricsComparisonDeltas } from '../../core/analytics/analyticsTypes';
import { formatCurrency, formatPercent } from '../../core/analytics/analyticsEngine';

interface StatsKpiGridProps {
  metrics: AnalyticsMetrics;
  deltas: MetricsComparisonDeltas | null;
  isComparisonActive: boolean;
}

export const StatsKpiGrid: React.FC<StatsKpiGridProps> = ({
  metrics,
  deltas,
  isComparisonActive,
}) => {
  // Renderizador de delta badge
  const renderDelta = (key: keyof AnalyticsMetrics, isInverseMetric: boolean = false) => {
    if (!isComparisonActive || !deltas || !deltas[key]) return null;

    const delta = deltas[key];
    const isNeutral = delta.percentDelta === 0;
    // Para métricas como "perdidos", ter um aumento é negativo
    const isGood = isInverseMetric ? !delta.isPositive : delta.isPositive;

    if (isNeutral) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded">
          <Minus className="w-2.5 h-2.5" /> 0%
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
          isGood
            ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/50'
            : 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-800/50'
        }`}
        title={`Comparado ao período anterior (${delta.absoluteDelta >= 0 ? '+' : ''}${delta.absoluteDelta})`}
      >
        {delta.isPositive ? (
          <ArrowUpRight className="w-2.5 h-2.5" />
        ) : (
          <ArrowDownRight className="w-2.5 h-2.5" />
        )}
        {delta.percentDelta > 0 ? `+${delta.percentDelta}%` : `${delta.percentDelta}%`}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* GRUPO 1: EFICIÊNCIA & INTELIGÊNCIA FINANCEIRA (OS INDICADORES DE RESULTADO) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Taxa de Resposta */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[14px] p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-indigo-500" />
              Taxa de Resposta
            </span>
            {renderDelta('taxaResposta')}
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatPercent(metrics.taxaResposta)}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {metrics.respostas} respostas de {metrics.contatados} toques
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[14px] p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Taxa de Conversão
            </span>
            {renderDelta('taxaConversao')}
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatPercent(metrics.taxaConversao)}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {metrics.ganhos} fechados de {metrics.totalLeads} leads
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[14px] p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              Ticket Médio
            </span>
            {renderDelta('ticketMedio')}
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatCurrency(metrics.ticketMedio)}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Média por contrato ganho
          </div>
        </div>

        {/* Valor Fechado (Receita Ganha) */}
        <div className="bg-white dark:bg-[#141720] border border-emerald-200 dark:border-emerald-900/60 rounded-[14px] p-4 shadow-xs space-y-1.5 bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-[#141720] dark:to-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-emerald-600" />
              Valor Fechado
            </span>
            {renderDelta('valorFechado')}
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(metrics.valorFechado)}
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">
            Receita convertida confirmada
          </div>
        </div>

        {/* Valor Potencial (Pipeline Aberto) */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[14px] p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#635BFF]" />
              Valor Potencial
            </span>
            {renderDelta('valorPotencial')}
          </div>
          <div className="text-2xl font-black text-[#635BFF] dark:text-[#9A94FF] tabular-nums">
            {formatCurrency(metrics.valorPotencial)}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Pipeline em negociação ativa
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRUPO 2 & 3: FUNIL OPERACIONAL (VOLUME & PIPELINE DE DECISÃO)              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5">
        {/* Total de Leads */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-xl p-3 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Total Leads</span>
            {renderDelta('totalLeads')}
          </div>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
            {metrics.totalLeads}
          </div>
          <span className="text-[10px] text-zinc-400 block truncate">Na base / filtro</span>
        </div>

        {/* Novos */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-xl p-3 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Novos</span>
            {renderDelta('novos')}
          </div>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
            {metrics.novos}
          </div>
          <span className="text-[10px] text-zinc-400 block truncate">Aguardando toque</span>
        </div>

        {/* Contatados */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-xl p-3 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Contatados</span>
            {renderDelta('contatados')}
          </div>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
            {metrics.contatados}
          </div>
          <span className="text-[10px] text-zinc-400 block truncate">Toque realizado</span>
        </div>

        {/* Respostas */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-xl p-3 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-indigo-500">Respostas</span>
            {renderDelta('respostas')}
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
            {metrics.respostas}
          </div>
          <span className="text-[10px] text-zinc-400 block truncate">Engajamento ativo</span>
        </div>

        {/* Qualificados */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-xl p-3 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Qualificados</span>
            {renderDelta('qualificados')}
          </div>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
            {metrics.qualificados}
          </div>
          <span className="text-[10px] text-zinc-400 block truncate">Fit ICP aprovado</span>
        </div>

        {/* Propostas */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-xl p-3 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Propostas</span>
            {renderDelta('propostas')}
          </div>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
            {metrics.propostas}
          </div>
          <span className="text-[10px] text-zinc-400 block truncate">Escopo enviado</span>
        </div>

        {/* Negociações */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-xl p-3 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Negociações</span>
            {renderDelta('negociacoes')}
          </div>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
            {metrics.negociacoes}
          </div>
          <span className="text-[10px] text-zinc-400 block truncate">Ajuste de contrato</span>
        </div>

        {/* Ganhos */}
        <div className="bg-white dark:bg-[#141720] border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 shadow-xs space-y-1 bg-emerald-50/20 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Ganhos</span>
            {renderDelta('ganhos')}
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {metrics.ganhos}
          </div>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block truncate">Clientes ativos</span>
        </div>

        {/* Perdidos */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-xl p-3 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Perdidos</span>
            {renderDelta('perdidos', true)}
          </div>
          <div className="text-xl font-black text-zinc-500 dark:text-zinc-400 tabular-nums">
            {metrics.perdidos}
          </div>
          <span className="text-[10px] text-zinc-400 block truncate">Desqualificados</span>
        </div>
      </div>
    </div>
  );
};
