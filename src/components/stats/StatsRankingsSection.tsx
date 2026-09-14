import React, { useState } from 'react';
import { 
  RankingItem, 
  RankingCategory 
} from '../../core/analytics/analyticsTypes';
import { 
  Trophy, 
  Sparkles, 
  Layers, 
  Briefcase, 
  Globe, 
  Send, 
  FileText, 
  Filter,
  CheckCircle2,
  TrendingUp,
  Percent,
  Coins
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../../core/analytics/analyticsEngine';

interface StatsRankingsSectionProps {
  rankings: {
    servicos: RankingItem[];
    nichos: RankingItem[];
    paises: RankingItem[];
    canais: RankingItem[];
    scripts: RankingItem[];
    funis: RankingItem[];
  };
}

export const StatsRankingsSection: React.FC<StatsRankingsSectionProps> = ({ rankings }) => {
  const [activeCategory, setActiveCategory] = useState<RankingCategory>('servico');

  const categories: { id: RankingCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'servico', label: 'Melhor Serviço', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'nicho', label: 'Melhor Nicho', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'pais', label: 'Melhor País', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'canal', label: 'Melhor Canal', icon: <Send className="w-3.5 h-3.5" /> },
    { id: 'script', label: 'Melhor Script', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'funil', label: 'Melhor Funil', icon: <Filter className="w-3.5 h-3.5" /> },
  ];

  const getActiveItems = (): RankingItem[] => {
    switch (activeCategory) {
      case 'servico':
        return rankings.servicos;
      case 'nicho':
        return rankings.nichos;
      case 'pais':
        return rankings.paises;
      case 'canal':
        return rankings.canais;
      case 'script':
        return rankings.scripts;
      case 'funil':
        return rankings.funis;
      default:
        return rankings.servicos;
    }
  };

  const currentItems = getActiveItems();
  const topWinner = currentItems[0];

  return (
    <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[16px] p-5 shadow-xs space-y-5">
      {/* Header do Módulo de Inteligência */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Rankings de Eficácia Comercial
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
              O que realmente gera resultado
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Descubra quais ofertas, nichos, países, canais e scripts trazem o maior retorno sobre esforço.
          </p>
        </div>

        {/* Abas das 6 Categorias de Ranking */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100 dark:bg-[#1B202E] rounded-xl border border-zinc-200/80 dark:border-[#282E3F]">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white dark:bg-[#635BFF] text-zinc-900 dark:text-white shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Destaque do #1 Líder da Categoria */}
      {topWinner && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/40 dark:border-amber-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-black text-sm">
              #1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {topWinner.title}
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 px-1.5 py-0.2 rounded">
                  Maior Eficácia
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                {topWinner.insight}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold self-end sm:self-center">
            <div>
              <span className="text-[10px] text-zinc-400 block font-normal">Taxa Resposta</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatPercent(topWinner.taxaResposta)}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-normal">Conversão</span>
              <span className="text-[#635BFF] dark:text-[#9A94FF]">{formatPercent(topWinner.taxaConversao)}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-normal">Ticket Médio</span>
              <span className="text-zinc-900 dark:text-zinc-100">{formatCurrency(topWinner.ticketMedio)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista Classificada de Rankings */}
      <div className="space-y-3">
        {currentItems.map((item, index) => {
          const rankNumber = index + 1;
          const isFirst = rankNumber === 1;

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-zinc-100 dark:border-[#232836] bg-zinc-50/50 dark:bg-[#181B24]/40 hover:bg-white dark:hover:bg-[#1A1F2C] transition-colors space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Posição e Título */}
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                      isFirst
                        ? 'bg-amber-500 text-white shadow-xs'
                        : rankNumber === 2
                        ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                        : rankNumber === 3
                        ? 'bg-amber-700/80 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {rankNumber}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {item.volume} oportunidades analisadas
                    </span>
                  </div>
                </div>

                {/* Métricas de Performance */}
                <div className="grid grid-cols-4 gap-3 text-xs self-end sm:self-center">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Resposta</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPercent(item.taxaResposta)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Conversão</span>
                    <span className="font-bold text-[#635BFF] dark:text-[#9A94FF]">
                      {formatPercent(item.taxaConversao)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Ticket Médio</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {formatCurrency(item.ticketMedio)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Total Ganho</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.valorTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de Progresso / Score */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-zinc-200/70 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#635BFF] to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(item.scoreGeral, 8)}%` }}
                  />
                </div>
              </div>

              {/* Insight Acionável */}
              <div className="flex items-start gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 pt-1">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Fator de Sucesso:</strong> {item.insight}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
