import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ChannelPerformanceData } from '../../core/analytics/analyticsTypes';
import { MessageSquare, Phone, Linkedin, Mail, Video, CheckCircle2 } from 'lucide-react';
import { formatPercent } from '../../core/analytics/analyticsEngine';

interface ChannelPerformanceChartProps {
  channels: ChannelPerformanceData[];
}

export const ChannelPerformanceChart: React.FC<ChannelPerformanceChartProps> = ({ channels }) => {
  // Ícone por canal
  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case 'phone':
        return <Phone className="w-3.5 h-3.5 text-indigo-500" />;
      case 'linkedin':
        return <Linkedin className="w-3.5 h-3.5 text-sky-500" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-amber-500" />;
      case 'reuniao':
        return <Video className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  // Melhor canal em resposta
  const bestReplyChannel = [...channels].sort((a, b) => b.taxaResposta - a.taxaResposta)[0];
  // Melhor canal em fechamento
  const bestWinChannel = [...channels].sort((a, b) => b.taxaConversao - a.taxaConversao)[0];

  return (
    <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[16px] p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Eficiência por Canal de Contato
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Compare o volume investido contra as taxas reais de resposta e fechamento.
          </p>
        </div>

        {bestReplyChannel && (
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg">
            Maior Resposta: <strong>{bestReplyChannel.label} ({bestReplyChannel.taxaResposta}%)</strong>
          </div>
        )}
      </div>

      {/* Grid: Donut de Volume à esquerda + Barras de Taxa à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Donut Chart (Volume de esforço) */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="w-44 h-44 relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channels}
                  dataKey="volume"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {channels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} contatos`, name]}
                  contentStyle={{
                    backgroundColor: '#181B24',
                    borderColor: '#2E3547',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Total</span>
              <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                {channels.reduce((acc, c) => acc + c.volume, 0)}
              </span>
            </div>
          </div>

          {/* Legenda do Donut */}
          <div className="space-y-1.5 w-full sm:w-auto text-xs">
            {channels.map((c) => (
              <div key={c.channel} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>{c.label}</span>
                </div>
                <span className="text-zinc-400 font-mono text-[11px]">
                  {c.volume} ({c.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Barras de Desempenho (Taxa de Resposta e Taxa de Fechamento) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-[#232836]">
            <span>Canal</span>
            <div className="flex items-center gap-6 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Taxa de Resposta
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#635BFF]" /> Taxa Fechamento
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {channels.map((c) => (
              <div key={c.channel} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    {getChannelIcon(c.channel)}
                    {c.label}
                  </span>
                  <div className="flex items-center gap-4 text-xs font-bold tabular-nums">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatPercent(c.taxaResposta)}
                    </span>
                    <span className="text-[#635BFF] dark:text-[#9A94FF]">
                      {formatPercent(c.taxaConversao)}
                    </span>
                  </div>
                </div>

                {/* Dupla barra de progresso sóbria */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-zinc-100 dark:bg-[#1B202E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(c.taxaResposta, 3)}%` }}
                    />
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-[#1B202E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#635BFF] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(c.taxaConversao, 3)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
