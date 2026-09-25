import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Scale, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Award, 
  Building2, 
  FileText, 
  ShieldCheck, 
  Compass, 
  Target, 
  ArrowRight,
  Info
} from 'lucide-react';
import { CompanyScoreResult, AuditScoreBreakdownItem } from '../../core/types/qualification';

interface WhyThisScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CompanyScoreResult | null;
  onOpenQuestionnaire?: () => void;
}

export const WhyThisScoreModal: React.FC<WhyThisScoreModalProps> = ({
  isOpen,
  onClose,
  result,
  onOpenQuestionnaire,
}) => {
  const [activeTab, setActiveTab] = useState<'client' | 'services' | 'recommendation'>('client');
  const [selectedServiceTab, setSelectedServiceTab] = useState<string>('');

  if (!isOpen || !result) return null;

  const currentServiceId = selectedServiceTab || result.serviceScores[0]?.serviceId;
  const currentService = result.serviceScores.find((s) => s.serviceId === currentServiceId) || result.serviceScores[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        id="why-this-score-modal"
        className="bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/70 dark:bg-[#111319]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-[#635BFF]/10 border border-[#635BFF]/20 text-[#635BFF] shrink-0 mt-0.5">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/20">
                  Auditoria Matemática de Scores
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  ID: {result.auditHash}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
                Por que este score? — {result.companyName}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Trilha 100% auditável e determinística. Descubra a origem exata de cada ponto somado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Highlight Scores Bar */}
        <div className="p-4 sm:p-5 bg-zinc-100/60 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. Score do Cliente */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161922] border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                Score do Cliente
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {result.clientLevel}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-white">
                {result.clientScore !== null ? result.clientScore : '—'}
              </span>
              {result.clientScore !== null && <span className="text-sm font-bold text-zinc-400">/ 100</span>}
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-[#635BFF] h-full rounded-full transition-all duration-500"
                style={{ width: `${result.clientScore ?? 0}%` }}
              />
            </div>
          </div>

          {/* 2. Scores dos Serviços */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161922] border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-[10px] mb-1.5">
              Scores por Serviço
            </div>
            <div className="space-y-1.5">
              {result.serviceScores.map((s) => (
                <div key={s.serviceId} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[170px]">
                    {s.serviceName}
                  </span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {s.score}/100
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Serviço Recomendado */}
          {result.recommendedService && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-300 dark:border-emerald-800/80 shadow-xs sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Melhor Combinação
              </div>
              <div className="text-sm font-extrabold text-zinc-900 dark:text-white truncate">
                {result.recommendedService.serviceName}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                  {result.recommendedService.combinationScore}% Match
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                  {result.recommendedService.matchLevel}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 pt-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'client'
                ? 'border-[#635BFF] text-[#635BFF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Auditoria: Score do Cliente ({result.clientScore}/100)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'border-[#635BFF] text-[#635BFF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Auditoria: Scores dos Serviços
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recommendation')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'recommendation'
                ? 'border-[#635BFF] text-[#635BFF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Combinação & 5 Pilares
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: SCORE DO CLIENTE */}
          {activeTab === 'client' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#635BFF]" />
                <div>
                  <strong className="block font-bold">Fórmula de Cálculo:</strong>
                  Score do Cliente = Soma Ponderada dos Pontos das Perguntas ÷ Soma Ponderada Máxima Possível × 100.
                  Nenhuma pontuação foi gerada por IA; cada valor reflete estritamente as regras de pontos configuradas.
                </div>
              </div>

              {/* Tabela de Perguntas e Pontos */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-zinc-100 dark:bg-zinc-900/80 px-4 py-3 grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="col-span-5">Pergunta / Critério</div>
                  <div className="col-span-2">Resposta Registrada</div>
                  <div className="col-span-2 text-center">Pontos & Peso</div>
                  <div className="col-span-1 text-center">Pond.</div>
                  <div className="col-span-2 text-right">% Contribuição</div>
                </div>

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-[#141720]">
                  {result.clientBreakdown.map((item) => (
                    <div key={item.questionId} className="p-4 grid grid-cols-12 items-center gap-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      {/* Pergunta */}
                      <div className="col-span-5 pr-2">
                        <span className="text-[10px] font-bold text-zinc-400 block uppercase mb-0.5">
                          {item.category}
                        </span>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {item.questionText}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 italic">
                          &ldquo;{item.rationale}&rdquo;
                        </p>
                      </div>

                      {/* Resposta */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                          item.isIdeal 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                        }`}>
                          {item.isIdeal && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {item.answeredLabel}
                        </span>
                        {item.isIdeal && (
                          <span className="block text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Resposta Ideal
                          </span>
                        )}
                      </div>

                      {/* Pontos & Peso */}
                      <div className="col-span-2 text-center">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          +{item.pointsEarned}
                        </span>
                        <span className="text-zinc-400 text-[10px]"> / {item.maxPoints} pts</span>
                        <div className="text-[10px] text-zinc-500">
                          Peso: {item.weight}x
                        </div>
                      </div>

                      {/* Ponderado */}
                      <div className="col-span-1 text-center font-mono font-bold text-[#635BFF]">
                        {item.weightedEarned}
                      </div>

                      {/* Contribuição */}
                      <div className="col-span-2 text-right">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          +{item.contributionPercentage}%
                        </span>
                        <span className="block text-[9px] text-zinc-400">no score final</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCORES DOS SERVIÇOS */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              {/* Seleção do Serviço */}
              <div className="flex items-center gap-2 flex-wrap">
                {result.serviceScores.map((s) => (
                  <button
                    key={s.serviceId}
                    type="button"
                    onClick={() => setSelectedServiceTab(s.serviceId)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                      currentService.serviceId === s.serviceId
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <span>{s.serviceName}</span>
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[11px]">
                      {s.score}/100
                    </span>
                  </button>
                ))}
              </div>

              {/* Detalhe do Serviço Selecionado */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Serviço Avaliado
                  </span>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {currentService.serviceName}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-zinc-500 block">Grau de Fit</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {currentService.level}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#635BFF] text-white font-mono font-black text-xl shadow-xs">
                    {currentService.score}
                  </div>
                </div>
              </div>

              {/* Tabela de Perguntas do Serviço */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-zinc-100 dark:bg-zinc-900/80 px-4 py-3 grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="col-span-6">Critério Técnico de Adequação</div>
                  <div className="col-span-2">Resposta</div>
                  <div className="col-span-2 text-center">Pontos & Peso</div>
                  <div className="col-span-2 text-right">Contribuição</div>
                </div>

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-[#141720]">
                  {currentService.breakdown.map((item) => (
                    <div key={item.questionId} className="p-4 grid grid-cols-12 items-center gap-2 text-xs">
                      <div className="col-span-6 pr-2">
                        <span className="text-[10px] font-bold text-zinc-400 block uppercase mb-0.5">
                          {item.category}
                        </span>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {item.questionText}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 italic">
                          &ldquo;{item.rationale}&rdquo;
                        </p>
                      </div>

                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                          item.isIdeal 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}>
                          {item.answeredLabel}
                        </span>
                      </div>

                      <div className="col-span-2 text-center">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          +{item.pointsEarned}
                        </span>
                        <span className="text-zinc-400 text-[10px]"> / {item.maxPoints} pts</span>
                        <div className="text-[10px] text-zinc-500">
                          Peso: {item.weight}x
                        </div>
                      </div>

                      <div className="col-span-2 text-right">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          +{item.contributionPercentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMBINAÇÃO INTELIGENTE (5 PILARES) */}
          {activeTab === 'recommendation' && result.recommendedService && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Serviço Recomendado pelo LEADION
                  </span>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-0.5">
                    {result.recommendedService.serviceName}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 max-w-xl">
                    {result.recommendedService.summary}
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/80 shadow-xs shrink-0">
                  <span className="text-[10px] font-bold text-zinc-400 block uppercase">Índice Geral</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {result.recommendedService.combinationScore}%
                  </span>
                </div>
              </div>

              {/* Os 5 Pilares de Combinação */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Decomposição dos 5 Fatores de Decisão:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.recommendedService.factors.map((f) => (
                    <div 
                      key={f.factor}
                      className="p-4 rounded-2xl bg-white dark:bg-[#161922] border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#635BFF]" />
                          {f.label}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-black text-sm text-[#635BFF]">
                            {f.score}/100
                          </span>
                          <span className="text-[10px] text-zinc-400">({Math.round(f.weight * 100)}% peso)</span>
                        </div>
                      </div>

                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#635BFF] h-full rounded-full"
                          style={{ width: `${f.score}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pitch Angle Comercial */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
                <span className="text-[10px] font-bold text-[#635BFF] uppercase tracking-wider block mb-1">
                  Ângulo de Abordagem Comercial Recomendado:
                </span>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium">
                  {result.recommendedService.pitchAngle}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#111319] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Scores auditáveis matematicamente — sem pontuação inventada por IA.</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenQuestionnaire && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQuestionnaire();
                }}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ajustar Respostas da Empresa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
