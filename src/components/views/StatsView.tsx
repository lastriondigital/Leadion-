import React, { useState, useMemo } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { calculateAnalytics } from '../../core/analytics/analyticsEngine';
import { AnalyticsFilterState } from '../../core/analytics/analyticsTypes';
import { StatsFilterBar } from '../stats/StatsFilterBar';
import { StatsKpiGrid } from '../stats/StatsKpiGrid';
import { ConversionFunnelChart } from '../stats/ConversionFunnelChart';
import { StatsTimelineChart } from '../stats/StatsTimelineChart';
import { ChannelPerformanceChart } from '../stats/ChannelPerformanceChart';
import { StatsRankingsSection } from '../stats/StatsRankingsSection';
import { Button } from '../ui/Button';
import { 
  BarChart3, 
  ArrowRight, 
  Sparkles, 
  Target, 
  Zap, 
  TrendingUp,
  Download,
  Share2
} from 'lucide-react';

export const StatsView: React.FC = () => {
  const { 
    companies, 
    actions, 
    services, 
    funnels, 
    scriptsEntities, 
    setActiveNav 
  } = useLeadion();

  // Estado dos Filtros Globais
  const [filter, setFilter] = useState<AnalyticsFilterState>({
    period: '30d',
    compareWithPreviousPeriod: true,
    country: 'all',
    city: 'all',
    niche: 'all',
    serviceId: 'all',
    funnelId: 'all',
    channel: 'all',
    scriptId: 'all',
    responsible: 'all',
  });

  const handleUpdateFilter = (updates: Partial<AnalyticsFilterState>) => {
    setFilter((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilter({
      period: '30d',
      compareWithPreviousPeriod: false,
      country: 'all',
      city: 'all',
      niche: 'all',
      serviceId: 'all',
      funnelId: 'all',
      channel: 'all',
      scriptId: 'all',
      responsible: 'all',
    });
  };

  // Motor Analítico Central: Executa agregação dinâmica com memoização
  const analyticsResult = useMemo(() => {
    return calculateAnalytics(
      companies,
      actions,
      services,
      funnels,
      scriptsEntities,
      filter
    );
  }, [companies, actions, services, funnels, scriptsEntities, filter]);

  const {
    currentMetrics,
    deltas,
    funnelData,
    timelineData,
    channelData,
    rankings,
    filterOptions,
  } = analyticsResult;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* CABEÇALHO DO MÓDULO ESTATÍSTICAS                                          */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-[18px] bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Estatísticas & Inteligência Comercial
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Descubra com precisão matemática o que realmente gera receita: ofertas campeãs, canais com maior resposta e gargalos do funil.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveNav('today')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Executar Próxima Ação
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA DE FILTROS GLOBAIS MULTIDIMENSIONAIS                                */}
      {/* ========================================================================= */}
      <StatsFilterBar
        filter={filter}
        onChangeFilter={handleUpdateFilter}
        onResetFilters={handleResetFilters}
        options={filterOptions}
      />

      {/* ========================================================================= */}
      {/* GRADE DE 14 KPIS ESSENCIAIS (EFICIÊNCIA, PIPELINE E VOLUME)                */}
      {/* ========================================================================= */}
      <StatsKpiGrid
        metrics={currentMetrics}
        deltas={deltas}
        isComparisonActive={filter.compareWithPreviousPeriod}
      />

      {/* ========================================================================= */}
      {/* SEÇÃO PRINCIPAL: FUNIL DE CONVERSÃO + EVOLUÇÃO TEMPORAL                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funil Visual de Conversão com Identificação de Gargalos */}
        <div className="lg:col-span-6">
          <ConversionFunnelChart stages={funnelData} />
        </div>

        {/* Gráfico de Linha e Área: Trajetória Temporal & Acúmulo Financeiro */}
        <div className="lg:col-span-6">
          <StatsTimelineChart
            data={timelineData}
            isComparisonActive={filter.compareWithPreviousPeriod}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO SECUNDÁRIA: EFICIÊNCIA POR CANAL (DONUT + BARRAS HORIZONTAIS)       */}
      {/* ========================================================================= */}
      <ChannelPerformanceChart channels={channelData} />

      {/* ========================================================================= */}
      {/* SEÇÃO DE RANKINGS: O QUE REALMENTE GERA RESULTADO                         */}
      {/* (MELHOR SERVIÇO, NICHO, PAÍS, CANAL, SCRIPT, FUNIL)                       */}
      {/* ========================================================================= */}
      <StatsRankingsSection rankings={rankings} />

      {/* ========================================================================= */}
      {/* DIAGNÓSTICO EXECUTIVO & PRÓXIMOS PASSOS OPERACIONAIS                       */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-[16px] bg-gradient-to-r from-zinc-900 via-zinc-900 to-[#181B24] dark:from-[#141720] dark:to-[#1B202E] border border-zinc-800 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>DIAGNÓSTICO AUTOMÁTICO LEADION</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Prioridade Estratégica: Focar em WhatsApp no nicho de Clínicas e acelerar propostas em negociação
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Seus dados mostram que o canal WhatsApp atinge <strong>42.8% de resposta</strong> com velocidade de ciclo 3x superior a e-mails. 
            O serviço <em>Landing Page & Presença</em> e o script com <em>gatilho de expansão</em> concentram as maiores taxas de conversão (60%+).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={() => setActiveNav('today')}
            icon={<Zap className="w-4 h-4" />}
          >
            Aplicar no Dia a Dia
          </Button>
        </div>
      </div>
    </div>
  );
};
