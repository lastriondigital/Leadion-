import React, { useState } from 'react';
import { 
  Scale, 
  Plus, 
  Search, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Briefcase, 
  Sliders, 
  Edit3, 
  Trash2, 
  Layers, 
  Check, 
  TrendingUp, 
  Filter,
  ArrowRight,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';
import { QualificationQuestion, CompanyScoreResult } from '../../core/types/qualification';
import { Company } from '../../core/types/company';
import { calculateCompanyQualification } from '../../core/qualification/qualificationEngine';
import { WhyThisScoreModal } from '../qualification/WhyThisScoreModal';
import { QuestionBuilderModal } from '../qualification/QuestionBuilderModal';
import { CompanyQualificationModal } from '../qualification/CompanyQualificationModal';

export const QualificationView: React.FC = () => {
  const { 
    companies, 
    services, 
    qualificationQuestions,
    addQualificationQuestion,
    updateQualificationQuestion,
    deleteQualificationQuestion,
    qualificationAnswers,
    saveCompanyQualificationAnswers,
  } = useLeadion();

  const [activeTab, setActiveTab] = useState<'matrix' | 'questions' | 'simulator'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [questionFilter, setQuestionFilter] = useState<'all' | 'client' | 'service'>('all');

  // Modals state
  const [selectedAuditResult, setSelectedAuditResult] = useState<CompanyScoreResult | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const [selectedCompanyForForm, setSelectedCompanyForForm] = useState<Company | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState<QualificationQuestion | null>(null);
  const [isQuestionBuilderOpen, setIsQuestionBuilderOpen] = useState(false);

  // Seleção para simulador
  const [simulatorCompanyId, setSimulatorCompanyId] = useState<string>(companies[0]?.id || '');

  // Calcula scores para todas as empresas em cache determinístico
  const companyScoreResults: { company: Company; result: CompanyScoreResult }[] = companies.map((c) => {
    const customAns = qualificationAnswers[c.id] || {};
    const res = calculateCompanyQualification(c, qualificationQuestions, services, customAns);
    return { company: c, result: res };
  });

  // Métricas de topo
  const avgClientScore = Math.round(
    companyScoreResults.reduce((acc, curr) => acc + curr.result.clientScore, 0) / (companyScoreResults.length || 1)
  );

  const highFitCompaniesCount = companyScoreResults.filter((item) => item.result.clientScore >= 75).length;
  const activeQuestionsCount = qualificationQuestions.filter((q) => q.status === 'active').length;

  // Filtragem de empresas
  const filteredCompanies = companyScoreResults.filter(({ company }) => {
    const q = searchTerm.toLowerCase();
    return (
      company.name.toLowerCase().includes(q) ||
      company.city.toLowerCase().includes(q) ||
      company.niche.toLowerCase().includes(q)
    );
  });

  // Filtragem de perguntas
  const filteredQuestions = qualificationQuestions.filter((q) => {
    if (questionFilter === 'client') return q.targetType === 'client';
    if (questionFilter === 'service') return q.targetType === 'service';
    return true;
  });

  // Handlers
  const handleOpenAudit = (result: CompanyScoreResult) => {
    setSelectedAuditResult(result);
    setIsAuditModalOpen(true);
  };

  const handleOpenCompanyForm = (company: Company) => {
    setSelectedCompanyForForm(company);
    setIsFormModalOpen(true);
  };

  const handleCreateNewQuestion = () => {
    setEditingQuestion(null);
    setIsQuestionBuilderOpen(true);
  };

  const handleEditQuestion = (q: QualificationQuestion) => {
    setEditingQuestion(q);
    setIsQuestionBuilderOpen(true);
  };

  const handleSaveQuestion = (q: QualificationQuestion) => {
    if (editingQuestion) {
      updateQualificationQuestion(q);
    } else {
      addQualificationQuestion(q);
    }
  };

  const handleToggleQuestionStatus = (q: QualificationQuestion) => {
    updateQualificationQuestion({
      ...q,
      status: q.status === 'active' ? 'inactive' : 'active',
    });
  };

  // Empresa selecionada para o simulador
  const simulatorCompany = companies.find((c) => c.id === simulatorCompanyId) || companies[0];
  const simulatorResult = simulatorCompany 
    ? calculateCompanyQualification(simulatorCompany, qualificationQuestions, services, qualificationAnswers[simulatorCompany.id] || {})
    : null;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/20">
              Motor de Qualificação & Scores
            </span>
            <span className="text-xs text-zinc-400">
              Dois scores independentes • 100% Auditável
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            Qualificação Comercial & de Serviços
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl">
            Avalie cada empresa através do <strong>Score do Cliente (0–100)</strong> e do <strong>Score do Serviço (0–100)</strong>. 
            Pontos totalmente configuráveis pelo operador com auditoria matemática transparente e recomendação pelos 5 pilares.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCreateNewQuestion}
            className="px-4 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5248E2] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Pergunta</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Média Score do Cliente
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white">
              {avgClientScore}
            </span>
            <span className="text-xs font-bold text-zinc-400">/ 100</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Fit comercial médio da base ativa
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Serviço Mais Recomendado
          </div>
          <div className="text-lg font-black text-[#635BFF] dark:text-[#9A94FF] truncate">
            Landing Page
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Alta urgência e tração direta no WhatsApp
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Empresas Altamente Qualificadas
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {highFitCompaniesCount}
            </span>
            <span className="text-xs text-zinc-400">de {companies.length}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Score do cliente ≥ 75 pontos
          </p>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Critérios Ativos no Motor
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white">
              {activeQuestionsCount}
            </span>
            <span className="text-xs text-zinc-400">perguntas ponderadas</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Pontuações 100% auditáveis
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'border-[#635BFF] text-[#635BFF]'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Matriz de Scores & Empresas ({companies.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-[#635BFF] text-[#635BFF]'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Perguntas & Critérios Configuráveis ({qualificationQuestions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'simulator'
              ? 'border-[#635BFF] text-[#635BFF]'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Simulador dos 5 Pilares de Recomendação</span>
        </button>
      </div>

      {/* TAB 1: MATRIZ DE SCORES */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar empresa, nicho ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141720] text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#635BFF]"
              />
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Exibindo <strong>{filteredCompanies.length}</strong> empresas avaliadas
            </div>
          </div>

          {/* Tabela de Empresas e Scores */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-[#141720] shadow-xs">
            <div className="bg-zinc-100 dark:bg-zinc-900/80 px-4 py-3 grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <div className="col-span-4">Empresa / Localização</div>
              <div className="col-span-2 text-center">Score Cliente</div>
              <div className="col-span-3">Scores dos Serviços</div>
              <div className="col-span-3 text-right">Recomendação & Ações</div>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredCompanies.map(({ company, result }) => (
                <div 
                  key={company.id}
                  className="p-4 grid grid-cols-12 items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                >
                  {/* Empresa */}
                  <div className="col-span-4 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {company.name}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {company.niche}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {company.city}, {company.country} • Porte: {company.size || 'Médio'}
                    </div>
                  </div>

                  {/* Score do Cliente */}
                  <div className="col-span-2 text-center">
                    <div className="inline-flex flex-col items-center">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-black font-mono ${
                          result.clientScore >= 80 ? 'text-[#635BFF]' : result.clientScore >= 60 ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'
                        }`}>
                          {result.clientScore}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold">/100</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        {result.clientLevel.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Scores dos Serviços */}
                  <div className="col-span-3 space-y-1">
                    {result.serviceScores.slice(0, 3).map((s) => (
                      <div key={s.serviceId} className="flex items-center justify-between text-xs pr-2">
                        <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[130px]">
                          {s.serviceName.split(' ')[0]}:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                            {s.score}/100
                          </span>
                          <div className="w-12 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${s.score >= 80 ? 'bg-emerald-500' : 'bg-[#635BFF]'}`}
                              style={{ width: `${s.score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recomendação & Ações */}
                  <div className="col-span-3 flex flex-col items-end gap-2">
                    {result.recommendedService && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                          ★ {result.recommendedService.serviceName.split(' ')[0]}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                          {result.recommendedService.combinationScore}% Match
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenAudit(result)}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-[#635BFF] text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-[#635BFF] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <HelpCircle className="w-3 h-3 text-[#635BFF]" />
                        <span>Por que este score?</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenCompanyForm(company)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-[#635BFF] hover:text-white text-[11px] font-bold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                        title="Responder ou ajustar perguntas desta empresa"
                      >
                        Qualificar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERGUNTAS & CRITÉRIOS */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuestionFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  questionFilter === 'all'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Todas ({qualificationQuestions.length})
              </button>

              <button
                type="button"
                onClick={() => setQuestionFilter('client')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  questionFilter === 'client'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Critérios do Cliente
              </button>

              <button
                type="button"
                onClick={() => setQuestionFilter('service')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  questionFilter === 'service'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Critérios dos Serviços
              </button>
            </div>

            <button
              type="button"
              onClick={handleCreateNewQuestion}
              className="px-3.5 py-1.5 rounded-xl bg-[#635BFF] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar Nova Pergunta
            </button>
          </div>

          {/* Cards das Perguntas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3 relative"
              >
                {/* Header da pergunta */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        q.targetType === 'client'
                          ? 'bg-indigo-50 text-[#635BFF] dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {q.targetType === 'client' ? 'Score do Cliente' : `Serviço: ${q.serviceName || 'Geral'}`}
                      </span>

                      <span className="text-[10px] text-zinc-400 font-semibold">
                        {q.category}
                      </span>

                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        Peso {q.weight}x
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {q.text}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleQuestionStatus(q)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        q.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800'
                      }`}
                    >
                      {q.status === 'active' ? 'Ativo' : 'Inativo'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditQuestion(q)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteQualificationQuestion(q.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Opções e pontos configurados */}
                <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Pontuação por Resposta:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt) => (
                      <span
                        key={opt.id}
                        className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                          opt.value === q.idealResponse
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200 font-bold'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {opt.value === q.idealResponse && <Check className="w-3 h-3 text-emerald-600" />}
                        <span>{opt.label}:</span>
                        <strong className="font-mono text-[#635BFF] dark:text-[#9A94FF]">
                          +{opt.points} pts
                        </strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Racional */}
                {q.rationale && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                    Racional: {q.rationale}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SIMULADOR DOS 5 PILARES */}
      {activeTab === 'simulator' && simulatorResult && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Simulador dos 5 Pilares de Recomendação
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Veja como o motor combina Adequação, Necessidade, Prioridade, Capacidade e Contexto para eleger o melhor serviço.
              </p>
            </div>

            {/* Seletor de empresa */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500">Empresa:</span>
              <select
                value={simulatorCompanyId}
                onChange={(e) => setSimulatorCompanyId(e.target.value)}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-zinc-100"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.niche})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards de resultado da empresa simulada */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Score do Cliente
              </span>
              <div className="text-3xl font-black text-[#635BFF] mt-1 font-mono">
                {simulatorResult.clientScore}/100
              </div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {simulatorResult.clientLevel}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Scores por Serviço
              </span>
              <div className="space-y-1 mt-1">
                {simulatorResult.serviceScores.map((s) => (
                  <div key={s.serviceId} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">{s.serviceName}:</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{s.score}/100</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Vencedor Recomendado
              </span>
              <div className="text-lg font-black text-zinc-900 dark:text-white mt-1">
                {simulatorResult.recommendedService?.serviceName}
              </div>
              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {simulatorResult.recommendedService?.combinationScore}% Match Geral
              </div>
            </div>
          </div>

          {/* Gráfico / Barras dos 5 Pilares */}
          {simulatorResult.recommendedService && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Análise Ponderada dos 5 Pilares:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {simulatorResult.recommendedService.factors.map((f) => (
                  <div 
                    key={f.factor}
                    className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-2"
                  >
                    <div className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                      {f.label}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono text-[#635BFF]">
                        {f.score}
                      </span>
                      <span className="text-[10px] text-zinc-400">/ 100</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#635BFF] h-full rounded-full"
                        style={{ width: `${f.score}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-snug">
                      {f.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão de Auditoria */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => handleOpenAudit(simulatorResult)}
              className="px-4 py-2 rounded-xl bg-[#635BFF] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <HelpCircle className="w-4 h-4" />
              Abrir Auditoria Completa: &ldquo;Por que este score?&rdquo;
            </button>
          </div>
        </div>
      )}

      {/* Modais Integrados */}
      <WhyThisScoreModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        result={selectedAuditResult}
        onOpenQuestionnaire={() => {
          if (selectedAuditResult) {
            const c = companies.find((comp) => comp.id === selectedAuditResult.companyId);
            if (c) handleOpenCompanyForm(c);
          }
        }}
      />

      <CompanyQualificationModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        company={selectedCompanyForForm}
        questions={qualificationQuestions}
        services={services}
        savedAnswers={selectedCompanyForForm ? qualificationAnswers[selectedCompanyForForm.id] || {} : {}}
        onSaveAnswers={saveCompanyQualificationAnswers}
        onOpenAuditModal={(res) => {
          setIsFormModalOpen(false);
          handleOpenAudit(res);
        }}
      />

      <QuestionBuilderModal
        isOpen={isQuestionBuilderOpen}
        onClose={() => setIsQuestionBuilderOpen(false)}
        onSave={handleSaveQuestion}
        questionToEdit={editingQuestion}
        services={services}
      />
    </div>
  );
};
