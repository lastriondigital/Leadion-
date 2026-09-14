import React from 'react';
import { FunnelStageData } from '../../core/analytics/analyticsTypes';
import { AlertCircle, ArrowDown, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface ConversionFunnelChartProps {
  stages: FunnelStageData[];
}

export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({ stages }) => {
  const bottleneck = stages.find((s) => s.isBottleneck);

  // Paleta de graduação elegante para cada degrau do funil
  const stageColors = [
    'from-zinc-500 to-zinc-600',        // Leads Totais
    'from-blue-600 to-blue-700',        // Contatados
    'from-indigo-600 to-indigo-700',    // Respostas
    'from-violet-600 to-violet-700',    // Qualificados
    'from-amber-600 to-amber-700',      // Propostas
    'from-orange-600 to-orange-700',    // Negociações
    'from-emerald-500 to-emerald-600',  // Ganhos
  ];

  return (
    <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[16px] p-5 shadow-xs space-y-5">
      {/* Header do Funil */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Funil de Conversão Comercial
            <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
              (Passagem real entre etapas)
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Acompanhe a retenção em cada fase e elimine vazamentos no processo comercial.
          </p>
        </div>

        {bottleneck && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold self-start sm:self-auto">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Gargalo: {bottleneck.label} ({bottleneck.dropoffRate}% de perda)</span>
          </div>
        )}
      </div>

      {/* Visualização dos Degraus do Funil */}
      <div className="space-y-2.5">
        {stages.map((stage, idx) => {
          const widthPercent = Math.max(stage.percentageOfTop, 12);
          const colorGradient = stageColors[idx] || 'from-indigo-600 to-indigo-700';

          return (
            <div key={stage.id} className="group relative">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {stage.label}
                  {stage.isBottleneck && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                      Maior Descarte
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-3">
                  {idx > 0 && (
                    <span className="text-[11px] text-zinc-400 hidden sm:inline" title="Conversão da etapa imediatamente anterior">
                      {stage.conversionFromPrevious}% de passagem
                    </span>
                  )}
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {stage.count} <span className="text-zinc-400 font-normal">({stage.percentageOfTop}%)</span>
                  </span>
                </div>
              </div>

              {/* Barra Proporcional com Gradiente Sóbrio */}
              <div className="h-8 w-full bg-zinc-100 dark:bg-[#1B202E] rounded-lg overflow-hidden flex items-center p-1 relative">
                <div
                  className={`h-full rounded-md bg-gradient-to-r ${colorGradient} transition-all duration-500 flex items-center justify-end px-2`}
                  style={{ width: `${widthPercent}%` }}
                >
                  <span className="text-[11px] font-bold text-white drop-shadow-xs tabular-nums">
                    {stage.count}
                  </span>
                </div>
              </div>

              {/* Conector de Perda / Dropoff entre etapas */}
              {idx < stages.length - 1 && (
                <div className="flex items-center justify-center my-0.5">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                    <ArrowDown className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
                    <span>Perda de {stages[idx + 1].dropoffRate}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodapé explicativo da taxa global */}
      <div className="pt-3 border-t border-zinc-100 dark:border-[#232836] flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            Conversão ponta a ponta: <strong>{stages[stages.length - 1]?.percentageOfTop || 0}% dos leads iniciais</strong> se tornam clientes.
          </span>
        </div>
        <div className="text-[11px] text-zinc-400">
          Base: empresas ativas no período selecionado
        </div>
      </div>
    </div>
  );
};
