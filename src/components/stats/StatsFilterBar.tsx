import React from 'react';
import { 
  Calendar, 
  Filter, 
  RotateCcw, 
  Globe, 
  MapPin, 
  Briefcase, 
  Layers, 
  Send, 
  FileText, 
  User, 
  TrendingUp,
  Check
} from 'lucide-react';
import { AnalyticsFilterState, PeriodOption } from '../../core/analytics/analyticsTypes';

interface StatsFilterBarProps {
  filter: AnalyticsFilterState;
  onChangeFilter: (updates: Partial<AnalyticsFilterState>) => void;
  onResetFilters: () => void;
  options: {
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

export const StatsFilterBar: React.FC<StatsFilterBarProps> = ({
  filter,
  onChangeFilter,
  onResetFilters,
  options,
}) => {
  const periodButtons: { id: PeriodOption; label: string }[] = [
    { id: '7d', label: '7 Dias' },
    { id: '30d', label: '30 Dias' },
    { id: '90d', label: '90 Dias' },
    { id: 'year', label: 'Ano' },
    { id: 'custom', label: 'Personalizado' },
  ];

  // Conta quantos filtros avançados estão ativos além do período padrão
  const activeFiltersCount = [
    filter.country !== 'all',
    filter.city !== 'all',
    filter.niche !== 'all',
    filter.serviceId !== 'all',
    filter.funnelId !== 'all',
    filter.channel !== 'all',
    filter.scriptId !== 'all',
    filter.responsible !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[16px] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Linha Superior: Período + Comparação + Reset */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Seletor de Período Rápido */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 dark:bg-[#1B202E] rounded-xl border border-zinc-200/80 dark:border-[#282E3F]">
          {periodButtons.map((btn) => {
            const isActive = filter.period === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => onChangeFilter({ period: btn.id })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-white dark:bg-[#635BFF] text-zinc-900 dark:text-white shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Inputs de Data Personalizada se o período for 'custom' */}
        {filter.period === 'custom' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300">
              <span className="text-zinc-400">De:</span>
              <input
                type="date"
                value={filter.customStartDate || '2026-08-15'}
                onChange={(e) => onChangeFilter({ customStartDate: e.target.value })}
                className="bg-transparent border-none outline-none text-xs text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <span className="text-zinc-400 text-xs">até</span>
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300">
              <span className="text-zinc-400">Até:</span>
              <input
                type="date"
                value={filter.customEndDate || '2026-09-14'}
                onChange={(e) => onChangeFilter({ customEndDate: e.target.value })}
                className="bg-transparent border-none outline-none text-xs text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        )}

        {/* Toggle de Comparação de Período + Limpar */}
        <div className="flex items-center gap-3">
          <label 
            className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#282E3F] hover:bg-zinc-50 dark:hover:bg-[#1B202E] transition-colors"
          >
            <input
              type="checkbox"
              checked={filter.compareWithPreviousPeriod}
              onChange={(e) => onChangeFilter({ compareWithPreviousPeriod: e.target.checked })}
              className="rounded border-zinc-300 dark:border-zinc-700 text-[#635BFF] focus:ring-[#635BFF] w-3.5 h-3.5"
            />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <TrendingUp className="w-3.5 h-3.5 text-[#635BFF]" />
              <span>Comparar c/ período anterior</span>
            </div>
          </label>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 px-2 py-1 rounded-md transition-colors"
              title="Limpar todos os filtros avançados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Grade de Filtros Multidimensionais (País, Cidade, Nicho, Serviço, Funil, Canal, Script, Responsável) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2 border-t border-zinc-100 dark:border-[#232836]">
        {/* País */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <Globe className="w-3 h-3 text-zinc-400" /> País
          </label>
          <select
            value={filter.country}
            onChange={(e) => onChangeFilter({ country: e.target.value })}
            className="w-full text-xs bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#635BFF]"
          >
            <option value="all">Todos os países</option>
            {options.paises.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Cidade */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-zinc-400" /> Cidade
          </label>
          <select
            value={filter.city}
            onChange={(e) => onChangeFilter({ city: e.target.value })}
            className="w-full text-xs bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#635BFF]"
          >
            <option value="all">Todas as cidades</option>
            {options.cidades.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Nicho */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <Briefcase className="w-3 h-3 text-zinc-400" /> Nicho
          </label>
          <select
            value={filter.niche}
            onChange={(e) => onChangeFilter({ niche: e.target.value })}
            className="w-full text-xs bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#635BFF]"
          >
            <option value="all">Todos os nichos</option>
            {options.nichos.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Serviço */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <Layers className="w-3 h-3 text-zinc-400" /> Serviço
          </label>
          <select
            value={filter.serviceId}
            onChange={(e) => onChangeFilter({ serviceId: e.target.value })}
            className="w-full text-xs bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#635BFF]"
          >
            <option value="all">Todos os serviços</option>
            {options.servicos.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Funil */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <Filter className="w-3 h-3 text-zinc-400" /> Funil
          </label>
          <select
            value={filter.funnelId}
            onChange={(e) => onChangeFilter({ funnelId: e.target.value })}
            className="w-full text-xs bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#635BFF]"
          >
            <option value="all">Todos os funis</option>
            {options.funis.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Canal */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <Send className="w-3 h-3 text-zinc-400" /> Canal
          </label>
          <select
            value={filter.channel}
            onChange={(e) => onChangeFilter({ channel: e.target.value })}
            className="w-full text-xs bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#635BFF]"
          >
            <option value="all">Todos os canais</option>
            {options.canais.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Script */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <FileText className="w-3 h-3 text-zinc-400" /> Script
          </label>
          <select
            value={filter.scriptId}
            onChange={(e) => onChangeFilter({ scriptId: e.target.value })}
            className="w-full text-xs bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#635BFF]"
          >
            <option value="all">Todos os scripts</option>
            {options.scripts.map((sc) => (
              <option key={sc.id} value={sc.id}>{sc.title}</option>
            ))}
          </select>
        </div>

        {/* Responsável */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <User className="w-3 h-3 text-zinc-400" /> Responsável
          </label>
          <select
            value={filter.responsible}
            onChange={(e) => onChangeFilter({ responsible: e.target.value })}
            className="w-full text-xs bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#635BFF]"
          >
            <option value="all">Todos</option>
            {options.responsaveis.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
