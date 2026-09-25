import React, { useState, useMemo } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { SmartProspectActionCard } from './SmartProspectActionCard';
import { TopNextActionHero } from './TopNextActionHero';
import { sortActionsByPriority } from '../../core/priority/priorityEngine';
import { ProspectActionStatus } from '../../core/types/prospectAction';
import { Button } from '../ui/Button';
import { 
  Plus, 
  Sliders, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Filter, 
  Inbox, 
  CalendarDays,
  XCircle,
  Building2,
  BellRing
} from 'lucide-react';

type QueueTab = 'todos' | 'atrasadas' | 'hoje' | 'proxima' | 'agenda' | 'sem_acao' | 'concluida';

export const ProspectTodayView: React.FC = () => {
  const { 
    userName, 
    greeting, 
    actions, 
    actionCounters, 
    unplannedCompanies, 
    priorityWeights, 
    setIsPlanningModalOpen, 
    setPlanningPreselectedCompany,
    setIsPriorityModalOpen,
    companyNeedingNextAction,
    setCompanyNeedingNextAction,
    quickViewCompany,
    setQuickViewCompany,
    openActionOutcomeModal,
    openObjectionDispatchModal,
    companies,
    setIsNewCompanyModalOpen,
  } = useLeadion();

  const [activeTab, setActiveTab] = useState<QueueTab>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // Top Next Action determinada pelo Motor de Prioridade LEADION
  const topAction = useMemo(() => {
    const pendingActions = actions.filter((a) => a.status !== 'concluida' && a.status !== 'cancelada');
    const sorted = sortActionsByPriority(pendingActions, priorityWeights);
    return sorted[0] || null;
  }, [actions, priorityWeights]);

  // Formata data de hoje em português
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(new Date());
  }, []);

  // Filtragem e Ordenação pelo Motor de Prioridade
  const prioritizedActions = useMemo(() => {
    // 1. Filtrar por tab
    let list = actions;

    if (activeTab === 'atrasadas') {
      list = actions.filter((a) => a.status === 'atrasada');
    } else if (activeTab === 'hoje') {
      list = actions.filter((a) => a.status === 'hoje');
    } else if (activeTab === 'proxima') {
      list = actions.filter((a) => a.status === 'proxima');
    } else if (activeTab === 'concluida') {
      list = actions.filter((a) => a.status === 'concluida');
    } else if (activeTab === 'todos') {
      // Fila operacional: atrasadas + hoje + próximas não concluídas
      list = actions.filter((a) => a.status !== 'concluida' && a.status !== 'cancelada');
    }

    // 2. Busca por texto
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((a) => 
        a.companyName.toLowerCase().includes(q) ||
        a.niche.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.service.toLowerCase().includes(q) ||
        a.nextAction.toLowerCase().includes(q) ||
        a.responsible.toLowerCase().includes(q)
      );
    }

    // 3. Filtro por canal
    if (channelFilter !== 'all') {
      list = list.filter((a) => a.channel === channelFilter);
    }

    // 4. Ordenação estrita pelo Motor de Prioridade LEADION
    return sortActionsByPriority(list, priorityWeights);
  }, [actions, activeTab, searchTerm, channelFilter, priorityWeights]);

  // Agrupamento para modo Agenda
  const agendaGrouped = useMemo(() => {
    const morning = prioritizedActions.filter((a) => {
      const h = parseInt(a.time.split(':')[0], 10) || 9;
      return h < 12;
    });
    const afternoon = prioritizedActions.filter((a) => {
      const h = parseInt(a.time.split(':')[0], 10) || 9;
      return h >= 12;
    });
    return { morning, afternoon };
  }, [prioritizedActions]);

  const handleProgramForUnplanned = (comp: any) => {
    setPlanningPreselectedCompany(comp);
    setIsPlanningModalOpen(true);
  };

  // Se não houver empresas cadastradas: Empty state profissional sem dados fictícios
  if (companies.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111318] tracking-tight">
              Comece sua prospecção
            </h2>
            <p className="text-sm text-zinc-500">
              Cadastre sua primeira empresa para começar.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsNewCompanyModalOpen(true)}
              className="bg-[#635BFF] hover:bg-[#5248E5] text-white font-bold px-6 py-2.5 rounded-xl shadow-sm text-sm"
              icon={<Plus className="w-4 h-4 mr-1.5" />}
            >
              Adicionar empresa
            </Button>
          </div>

          <p className="text-xs text-zinc-400">
            Você poderá completar os dados da empresa depois.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* ========================================================================= */}
      {/* TOPO: Bom dia, [nome] & AÇÕES ATRASADAS / HOJE / PRÓXIMAS / AGENDA        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-sm space-y-4">
        
        {/* Cabeçalho de Saudação & Botões de Ação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#635BFF] animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 capitalize">
                {todayFormatted}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111318] tracking-tight mt-1">
              {greeting}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Transformar prospecção em execução. Sua fila inteligente de prioridade comercial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* [Prioridade] */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPriorityModalOpen(true)}
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 border-zinc-200"
              title="Configurar regras e pesos do motor de prioridade"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5 text-[#635BFF]" />
              Prioridade
            </Button>

            {/* [Programar] */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPlanningPreselectedCompany(null);
                setIsPlanningModalOpen(true);
              }}
              className="bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Programar
            </Button>
          </div>
        </div>

        {/* BARRAS DE STATUS / CONTADORES (atrasadas, hoje, próximas, agenda) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
          
          {/* [TODAS / FILA GERAL] */}
          <button
            onClick={() => setActiveTab('todos')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'todos'
                ? 'border-[#635BFF] bg-[#635BFF]/5 ring-1 ring-[#635BFF]/30 shadow-xs'
                : 'border-zinc-200 hover:border-zinc-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Fila Geral
              </span>
              <Inbox className="w-3.5 h-3.5 text-[#635BFF]" />
            </div>
            <div className="text-xl font-bold tabular-nums text-[#111318] mt-1">
              {actionCounters.atrasadas + actionCounters.hoje + actionCounters.proxima}
            </div>
          </button>

          {/* [AÇÕES ATRASADAS] */}
          <button
            onClick={() => setActiveTab('atrasadas')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'atrasadas'
                ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-300 shadow-xs'
                : actionCounters.atrasadas > 0
                ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50'
                : 'border-zinc-200 hover:border-zinc-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                actionCounters.atrasadas > 0 ? 'text-rose-600' : 'text-zinc-400'
              }`}>
                Atrasadas
              </span>
              <AlertTriangle className={`w-3.5 h-3.5 ${
                actionCounters.atrasadas > 0 ? 'text-rose-600' : 'text-zinc-400'
              }`} />
            </div>
            <div className={`text-xl font-bold tabular-nums mt-1 ${
              actionCounters.atrasadas > 0 ? 'text-rose-700' : 'text-zinc-700'
            }`}>
              {actionCounters.atrasadas}
            </div>
          </button>

          {/* [AÇÕES PARA HOJE] */}
          <button
            onClick={() => setActiveTab('hoje')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'hoje'
                ? 'border-[#635BFF] bg-[#635BFF]/10 ring-1 ring-[#635BFF]/30 shadow-xs'
                : 'border-zinc-200 hover:border-zinc-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
                Para Hoje
              </span>
              <Clock className="w-3.5 h-3.5 text-[#635BFF]" />
            </div>
            <div className="text-xl font-bold tabular-nums text-[#635BFF] mt-1">
              {actionCounters.hoje}
            </div>
          </button>

          {/* [PRÓXIMAS AÇÕES] */}
          <button
            onClick={() => setActiveTab('proxima')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'proxima'
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                : 'border-zinc-200 hover:border-zinc-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                activeTab === 'proxima' ? 'text-zinc-300' : 'text-zinc-400'
              }`}>
                Próximas
              </span>
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className={`text-xl font-bold tabular-nums mt-1 ${
              activeTab === 'proxima' ? 'text-white' : 'text-[#111318]'
            }`}>
              {actionCounters.proxima}
            </div>
          </button>

          {/* [AGENDA] */}
          <button
            onClick={() => setActiveTab('agenda')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'agenda'
                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-300 shadow-xs'
                : 'border-zinc-200 hover:border-zinc-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Agenda
              </span>
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xs font-semibold text-zinc-700 mt-1.5">
              Grade Horária
            </div>
          </button>

          {/* [SEM PRÓXIMA AÇÃO] - Conformidade com a regra */}
          <button
            onClick={() => setActiveTab('sem_acao')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'sem_acao'
                ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-300 shadow-xs'
                : actionCounters.semProximaAcao > 0
                ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                : 'border-zinc-200 hover:border-zinc-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                actionCounters.semProximaAcao > 0 ? 'text-amber-700' : 'text-zinc-400'
              }`}>
                Sem Ação
              </span>
              <BellRing className={`w-3.5 h-3.5 ${
                actionCounters.semProximaAcao > 0 ? 'text-amber-600' : 'text-zinc-400'
              }`} />
            </div>
            <div className={`text-xl font-bold tabular-nums mt-1 ${
              actionCounters.semProximaAcao > 0 ? 'text-amber-800' : 'text-zinc-700'
            }`}>
              {actionCounters.semProximaAcao}
            </div>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* ALERTA DE CONFORMIDADE: REGRA DO SISTEMA                                  */}
      {/* "Todo lead ativo deve possuir uma próxima ação.                           */}
      {/* Se uma atividade for concluída e não houver próxima ação, o sistema      */}
      {/* deve sinalizar isso."                                                     */}
      {/* ========================================================================= */}
      {companyNeedingNextAction && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Atenção: {companyNeedingNextAction.name} está sem próxima ação agendada!
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Regra Leadion: todo lead ativo deve possuir uma próxima ação programada para evitar perda de cadência.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center shrink-0">
            <button
              onClick={() => setCompanyNeedingNextAction(null)}
              className="text-xs text-amber-800 hover:text-amber-950 font-medium px-2 py-1"
            >
              Dispensar
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleProgramForUnplanned(companyNeedingNextAction)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
            >
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Programar
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESTAQUE PRINCIPAL: # PRÓXIMA AÇÃO (MOTOR DE PRIORIDADE LEADION)          */}
      {/* ========================================================================= */}
      {topAction && activeTab !== 'concluida' && !searchTerm && (
        <TopNextActionHero
          topAction={topAction}
          onOpenOutcomeModal={(act) => openActionOutcomeModal(act)}
          onOpenObjectionModal={(act) => {
            const comp = companies.find((c) => c.id === act.companyId);
            openObjectionDispatchModal(comp, act.id);
          }}
          onOpenCompanyDetail={(companyId) => {
            const comp = companies.find((c) => c.id === companyId);
            if (comp) setQuickViewCompany(comp);
          }}
          onOpenPlanningModal={(companyId) => {
            const comp = companies.find((c) => c.id === companyId);
            if (comp) setPlanningPreselectedCompany(comp);
            setIsPlanningModalOpen(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO: PROSPECTAR HOJE                                                    */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* Cabeçalho da Seção com Filtros e Busca */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#111318] tracking-tight">
                Prospectar Hoje
              </h2>
              <span className="text-xs font-mono font-bold bg-[#635BFF]/10 text-[#635BFF] px-2 py-0.5 rounded-full">
                {prioritizedActions.length} ações
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Empresas organizadas por prioridade matemática (atrasadas, score, horário e potencial).
            </p>
          </div>

          {/* Filtros rápidos e busca */}
          <div className="flex items-center gap-2">
            
            {/* Input de Busca */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar empresa, nicho..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-zinc-400 hover:text-zinc-600 absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtro Canal */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:border-[#635BFF]"
            >
              <option value="all">Todos Canais</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Telefone</option>
              <option value="email">E-mail</option>
              <option value="linkedin">LinkedIn</option>
              <option value="reuniao">Reunião</option>
            </select>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL: MODO LISTA / MODO AGENDA / MODO SEM AÇÃO */}
        {activeTab === 'sem_acao' ? (
          
          /* Visualização de Empresas sem Próxima Ação */
          <div className="space-y-3">
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Empresas Ativas sem Próxima Ação Agendada ({unplannedCompanies.length})
              </h3>
              <p className="text-xs text-amber-800 mt-1">
                Para manter a tração comercial, nenhuma empresa ativa deve ficar parada no funil sem data de contato marcada.
              </p>
            </div>

            {unplannedCompanies.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-zinc-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-zinc-900">Todas as empresas estão em cadência ativa!</h4>
                <p className="text-xs text-zinc-500 mt-0.5">Nenhum lead esquecido na base.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unplannedCompanies.map((comp) => (
                  <div key={comp.id} className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs hover:border-amber-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded">
                        {comp.score}/100
                      </span>
                      <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Ação Pendente
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-900 truncate">{comp.name}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{comp.niche} · {comp.city || comp.location}</p>

                    <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleProgramForUnplanned(comp)}
                        className="w-full text-xs bg-[#635BFF] hover:bg-[#5248E5] text-white"
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        Programar Próxima Ação
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : activeTab === 'agenda' ? (

          /* Visualização de Agenda por Horário */
          <div className="space-y-6">
            
            {/* Bloco Manhã */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                <Clock className="w-4 h-4 text-[#635BFF]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Manhã (08:00 – 12:00) · {agendaGrouped.morning.length} ações
                </h3>
              </div>
              {agendaGrouped.morning.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-2">Nenhuma ação programada para o turno da manhã.</p>
              ) : (
                <div className="space-y-3">
                  {agendaGrouped.morning.map((act) => (
                    <SmartProspectActionCard key={act.id} action={act} />
                  ))}
                </div>
              )}
            </div>

            {/* Bloco Tarde */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Tarde (12:00 – 18:00) · {agendaGrouped.afternoon.length} ações
                </h3>
              </div>
              {agendaGrouped.afternoon.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-2">Nenhuma ação programada para o turno da tarde.</p>
              ) : (
                <div className="space-y-3">
                  {agendaGrouped.afternoon.map((act) => (
                    <SmartProspectActionCard key={act.id} action={act} />
                  ))}
                </div>
              )}
            </div>

          </div>

        ) : (

          /* Visualização da Fila Inteligente (Padrão) */
          <div className="space-y-3">
            {prioritizedActions.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-zinc-200 shadow-xs">
                <Inbox className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-900">
                  {searchTerm 
                    ? 'Nenhuma ação encontrada nesta busca'
                    : 'Você não tem ações para hoje.'}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  {searchTerm 
                    ? `Nenhuma empresa corresponde à busca "${searchTerm}". Tente limpar o filtro.`
                    : 'Cadastre uma nova empresa ou programe ações para movimentar sua prospecção comercial.'}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsNewCompanyModalOpen(true);
                    }}
                    className="bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar empresa
                  </Button>
                  {companies.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setActiveTab('todos');
                        setIsPlanningModalOpen(true);
                      }}
                      className="text-xs font-semibold"
                    >
                      Programar Nova Prospecção
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              prioritizedActions.map((action) => (
                <SmartProspectActionCard key={action.id} action={action} />
              ))
            )}
          </div>

        )}

      </div>

    </div>
  );
};
