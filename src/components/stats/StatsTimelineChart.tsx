import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TimelineDataPoint } from '../../core/analytics/analyticsTypes';
import { formatCurrency } from '../../core/analytics/analyticsEngine';
import { Calendar, DollarSign, Activity } from 'lucide-react';

interface StatsTimelineChartProps {
  data: TimelineDataPoint[];
  isComparisonActive: boolean;
}

export const StatsTimelineChart: React.FC<StatsTimelineChartProps> = ({
  data,
  isComparisonActive,
}) => {
  const [chartMode, setChartMode] = useState<'volume' | 'financeiro'>('volume');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  return (
    <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[16px] p-5 shadow-xs space-y-4">
      {/* Header com controles de visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Evolução Temporal & Trajetória
            {isComparisonActive && (
              <span className="text-[10px] font-bold text-[#635BFF] bg-[#635BFF]/10 px-2 py-0.5 rounded-full">
                Comparativo Ativo
              </span>
            )}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {chartMode === 'volume' 
              ? 'Progresso de contatos executados, respostas e negócios conquistados.'
              : 'Acúmulo de valor potencial no pipeline versus receita realizada.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Seletor de Modo: Volume vs Financeiro */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#1B202E] rounded-lg border border-zinc-200/70 dark:border-[#282E3F]">
            <button
              type="button"
              onClick={() => setChartMode('volume')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                chartMode === 'volume'
                  ? 'bg-white dark:bg-[#635BFF] text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <Activity className="w-3 h-3" />
              Volume
            </button>
            <button
              type="button"
              onClick={() => setChartMode('financeiro')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                chartMode === 'financeiro'
                  ? 'bg-white dark:bg-[#635BFF] text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              Financeiro
            </button>
          </div>

          {/* Toggle Linha vs Área */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#1B202E] rounded-lg border border-zinc-200/70 dark:border-[#282E3F]">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                chartType === 'area'
                  ? 'bg-white dark:bg-[#2A3146] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              Área
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                chartType === 'line'
                  ? 'bg-white dark:bg-[#2A3146] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              Linha
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico Recharts */}
      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'volume' ? (
            chartType === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorContatados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#635BFF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#635BFF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRespostas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis dataKey="displayDate" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181B24',
                    borderColor: '#2E3547',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="contatados"
                  name="Contatados"
                  stroke="#635BFF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorContatados)"
                />
                <Area
                  type="monotone"
                  dataKey="respostas"
                  name="Respostas"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRespostas)"
                />
                <Line
                  type="monotone"
                  dataKey="ganhos"
                  name="Ganhos (Clientes)"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                {isComparisonActive && (
                  <Line
                    type="monotone"
                    dataKey="contatadosPrev"
                    name="Contatados (Período Anterior)"
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis dataKey="displayDate" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181B24',
                    borderColor: '#2E3547',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="contatados"
                  name="Contatados"
                  stroke="#635BFF"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="respostas"
                  name="Respostas"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="ganhos"
                  name="Ganhos (Clientes)"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                {isComparisonActive && (
                  <Line
                    type="monotone"
                    dataKey="contatadosPrev"
                    name="Contatados (Período Anterior)"
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}
              </LineChart>
            )
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPotencial" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#635BFF" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#635BFF" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorFechado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
              <XAxis dataKey="displayDate" stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => formatCurrency(val, '')}
              />
              <Tooltip
                formatter={(val: any) => formatCurrency(Number(val) || 0)}
                contentStyle={{
                  backgroundColor: '#181B24',
                  borderColor: '#2E3547',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="valorPotencial"
                name="Valor em Pipeline"
                stroke="#635BFF"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPotencial)"
              />
              <Area
                type="monotone"
                dataKey="valorFechado"
                name="Receita Fechada"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorFechado)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
