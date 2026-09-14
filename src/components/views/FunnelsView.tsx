import React, { useState, useMemo } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { FunnelEntity, FunnelStage, FUNNEL_COLOR_PRESETS } from '../../core/types/funnel';
import { Company } from '../../core/types/company';
import { StageTransitionModal } from '../modals/StageTransitionModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Score } from '../ui/Score';
import { 
  GitFork, 
  Plus, 
  Settings, 
  Copy, 
  Archive, 
  Trash2, 
  ChevronRight, 
  ArrowRight, 
  Search, 
  Sparkles, 
  Layers, 
  Phone, 
  MessageSquare, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle,
  MoreVertical,
  Edit2,
  RefreshCw
} from 'lucide-react';

export const FunnelsView: React.FC = () => {
  const {
    funnels,
    activeFunnelId,
    setActiveFunnelId,
    activeFunnel,
    companies,
    services,
    duplicateFunnel,
    archiveFunnel,
    unarchiveFunnel,
    deleteFunnel,
    setIsFunnelModalOpen,
    setEditingFunnel,
    setIsFunnelStagesModalOpen,
    setActiveFunnelForStages,
    setSelectedCompany,
    openWhatsAppAction,
    addFunnelStage,
  } = useLeadion();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Transition modal state
  const [transitionCompany, setTransitionCompany] = useState<Company | null>(null);
  const [transitionTargetStageId, setTransitionTargetStageId] = useState<string | undefined>(undefined);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);

  // Mobile active expanded stage
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);

  // Fallback active funnel
  const currentFunnel = activeFunnel || funnels[0];

  // Filter companies assigned to this funnel
  const companiesInFunnel = useMemo(() => {
    if (!currentFunnel) return [];
    return companies.filter((c) => {
      // Company is in this funnel explicitly or if fallback matches
      const isInThisFunnel = (c.funnelId === currentFunnel.id) || (!c.funnelId && currentFunnel.isDefault);
      if (!isInThisFunnel) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.niche.toLowerCase().includes(term) ||
        c.city.toLowerCase().includes(term) ||
        c.country.toLowerCase().includes(term)
      );
    });
  }, [companies, currentFunnel, searchTerm]);

  // Stage mapping with companies
  const stageData = useMemo(() => {
    if (!currentFunnel) return [];
    return currentFunnel.stages.map((stage, idx) => {
      const companiesInThisStage = companiesInFunnel.filter((c) => {
        // Match explicit stage ID
        if (c.funnelStageId === stage.id) return true;
        // Fallback: if funnelStage matches or first stage
        if (!c.funnelStageId && idx === 0) return true;
        return false;
      });

      const nextStage = idx + 1 < currentFunnel.stages.length ? currentFunnel.stages[idx + 1] : null;

      return {
        stage,
        index: idx,
        companies: companiesInThisStage,
        nextStage,
      };
    });
  }, [currentFunnel, companiesInFunnel]);

  // Funnel performance metrics
  const metrics = useMemo(() => {
    const total = companiesInFunnel.length;
    const wonCount = stageData.filter((s) => s.stage.stageType === 'won').reduce((acc, s) => acc + s.companies.length, 0);
    const lostCount = stageData.filter((s) => s.stage.stageType === 'lost').reduce((acc, s) => acc + s.companies.length, 0);
    const inProgressCount = total - wonCount - lostCount;
    const conversionRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;

    return { total, inProgressCount, wonCount, lostCount, conversionRate };
  }, [companiesInFunnel, stageData]);

  const handleOpenTransition = (company: Company, targetStageId?: string) => {
    setTransitionCompany(company);
    setTransitionTargetStageId(targetStageId);
    setIsTransitionModalOpen(true);
  };

  const handleQuickAdvance = (company: Company, nextStage: FunnelStage | null) => {
    if (!nextStage) return;
    handleOpenTransition(company, nextStage.id);
  };

  const handleCreateNewFunnel = () => {
    setEditingFunnel(null);
    setIsFunnelModalOpen(true);
  };

  const handleEditCurrentFunnel = () => {
    if (!currentFunnel) return;
    setEditingFunnel(currentFunnel);
    setIsFunnelModalOpen(true);
  };

  const handleManageStages = () => {
    if (!currentFunnel) return;
    setActiveFunnelForStages(currentFunnel);
    setIsFunnelStagesModalOpen(true);
  };

  if (!currentFunnel) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#141720] rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <GitFork className="w-12 h-12 text-[#635BFF] mx-auto mb-3" />
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Nenhum Funil Cadastrado</h3>
        <p className="text-xs text-zinc-500 mt-1 mb-4">Crie seu primeiro funil comercial para organizar as etapas de venda.</p>
        <Button variant="primary" onClick={handleCreateNewFunnel} icon={<Plus className="w-4 h-4" />}>
          Criar Funil
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12">
      {/* TOP HEADER & FUNNEL CONTROLS */}
      <div className="p-5 rounded-[15px] bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#635BFF] px-2 py-0.5 rounded-full bg-[#635BFF]/10">
                Esteira Comercial
              </span>
              {currentFunnel.isDefault && (
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                  Funil Padrão
                </span>
              )}
              {currentFunnel.status === 'archived' && (
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                  Arquivado
                </span>
              )}
            </div>

            {/* Funnel Selector Dropdown */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <select
                value={currentFunnel.id}
                onChange={(e) => setActiveFunnelId(e.target.value)}
                className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-b-2 border-[#635BFF] py-0.5 pr-8 focus:outline-none cursor-pointer"
              >
                {funnels.map((f) => (
                  <option key={f.id} value={f.id} className="text-xs text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">
                    {f.name} ({f.stages.length} etapas){f.isDefault ? ' ★ Padrão' : ''}
                  </option>
                ))}
              </select>

              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                [{currentFunnel.code}]
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
              {currentFunnel.description || 'Esteira de vendas para acompanhamento consultivo e conversão.'}
            </p>
          </div>

          {/* Top Actions: Manage stages, Edit, Duplicate, Add funnel */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageStages}
              icon={<Layers className="w-3.5 h-3.5 text-[#635BFF]" />}
              className="text-xs"
            >
              Configurar Etapas ({currentFunnel.stages.length})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleEditCurrentFunnel}
              icon={<Edit2 className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Editar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicateFunnel(currentFunnel.id)}
              icon={<Copy className="w-3.5 h-3.5" />}
              title="Duplicar estrutura do funil"
              className="text-xs"
            >
              Duplicar
            </Button>

            {currentFunnel.status === 'active' ? (
              <button
                type="button"
                onClick={() => archiveFunnel(currentFunnel.id)}
                title="Arquivar funil"
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => unarchiveFunnel(currentFunnel.id)}
                title="Reativar funil"
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-emerald-600 hover:text-emerald-700 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              disabled={funnels.length <= 1}
              onClick={() => deleteFunnel(currentFunnel.id)}
              title="Excluir funil"
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNewFunnel}
              icon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Novo Funil
            </Button>
          </div>
        </div>

        {/* METRICS STRIP & SEARCH */}
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 shrink-0">
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] block">Total de Leads</span>
              <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{metrics.total}</strong>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 shrink-0">
              <span className="text-blue-600 dark:text-blue-400 text-[11px] block">Em Andamento</span>
              <strong className="text-sm font-bold text-blue-700 dark:text-blue-300">{metrics.inProgressCount}</strong>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 shrink-0">
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] block">Ganhos / Fechados</span>
              <strong className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{metrics.wonCount}</strong>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 shrink-0">
              <span className="text-rose-600 dark:text-rose-400 text-[11px] block">Perdidos / Descartados</span>
              <strong className="text-sm font-bold text-rose-700 dark:text-rose-300">{metrics.lostCount}</strong>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 shrink-0">
              <span className="text-purple-600 dark:text-purple-400 text-[11px] block">Taxa de Conversão</span>
              <strong className="text-sm font-bold text-purple-700 dark:text-purple-300">{metrics.conversionRate}%</strong>
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar empresas no funil..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW: KANBAN / WORKFLOW BOARD */}
      {/* ========================================================================= */}
      <div className="hidden lg:block overflow-x-auto pb-4">
        <div className="flex items-start gap-4 min-w-max">
          {stageData.map(({ stage, index, companies: leadsInStage, nextStage }) => {
            const colorPreset = FUNNEL_COLOR_PRESETS[stage.color || 'zinc'];

            return (
              <div
                key={stage.id}
                className="w-80 shrink-0 rounded-[15px] bg-zinc-50/90 dark:bg-[#12151D] border border-[#E6E8EC] dark:border-[#232836] p-3.5 flex flex-col min-h-[580px]"
              >
                {/* Stage Header */}
                <div className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: colorPreset.accent }}
                      />
                      <span className="text-[10px] font-mono font-bold text-zinc-400">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {stage.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${colorPreset.bg} ${colorPreset.border} ${colorPreset.text}`}
                    >
                      {leadsInStage.length}
                    </span>
                  </div>

                  {/* Next Stage & Recommended Action */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                    <span className="truncate">
                      {nextStage ? (
                        <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 font-medium truncate">
                          <ArrowRight className="w-3 h-3 text-[#635BFF] shrink-0" />
                          Próx: {nextStage.name}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Etapa final</span>
                      )}
                    </span>

                    {stage.conditionalRules?.autoAdvanceDays && (
                      <span className="shrink-0 flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3 h-3" />
                        {stage.conditionalRules.autoAdvanceDays}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Companies List inside Stage */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 max-h-[620px] pr-0.5">
                  {leadsInStage.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-zinc-200/70 dark:border-zinc-800/70 rounded-xl">
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block">
                        Nenhum lead nesta etapa
                      </span>
                    </div>
                  ) : (
                    leadsInStage.map((comp) => {
                      const primaryService = services.find((s) => s.id === comp.primaryServiceId) || services[0];
                      const responsibleName = comp.responsibles?.[0]?.name || 'Decisor Principal';

                      return (
                        <div
                          key={comp.id}
                          className="p-3 bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] rounded-[12px] shadow-xs hover:border-[#635BFF] transition-all space-y-2 group"
                        >
                          {/* Company Name & Score */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div
                              onClick={() => setSelectedCompany(comp)}
                              className="cursor-pointer truncate flex-1"
                            >
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#635BFF] transition-colors">
                                {comp.name}
                              </h4>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block truncate">
                                {comp.city} • {comp.country}
                              </span>
                            </div>

                            <Score score={comp.score} size="sm" showLabel={false} />
                          </div>

                          {/* Service tag & Decision maker */}
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                            <span className="truncate max-w-[140px] font-medium text-[#635BFF]">
                              {primaryService?.name || comp.niche}
                            </span>
                            <span className="truncate max-w-[100px] text-zinc-400 text-right">
                              {responsibleName}
                            </span>
                          </div>

                          {/* Actions: Direct Quick Advance or Open Transition Dialog */}
                          <div className="pt-1.5 flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedCompany(comp)}
                              className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline underline-offset-2"
                            >
                              Ver Perfil
                            </button>

                            <div className="flex items-center gap-1">
                              {comp.whatsapp && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cleanPhone = comp.whatsapp.replace(/\D/g, '');
                                    window.open(`https://wa.me/${cleanPhone}`, '_blank');
                                  }}
                                  title="Iniciar WhatsApp"
                                  className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenTransition(comp, nextStage?.id)}
                                className="text-[11px] font-bold text-[#635BFF] hover:bg-[#635BFF]/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                                title="Mover para próxima etapa com registro auditável"
                              >
                                Avançar
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Column Footer: quick add stage button or stage summary */}
                <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>Etapa {index + 1} de {currentFunnel.stages.length}</span>
                  <button
                    type="button"
                    onClick={handleManageStages}
                    className="hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    Ajustar
                  </button>
                </div>
              </div>
            );
          })}

          {/* Quick Add Stage Column at the end */}
          <div className="w-64 shrink-0 p-4 rounded-[15px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center space-y-2 min-h-[300px]">
            <Layers className="w-8 h-8 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Personalizar Esteira
            </span>
            <p className="text-[11px] text-zinc-400">
              Adicione novas etapas para qualificação, proposta ou follow-up.
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleManageStages}
            >
              Adicionar Etapa
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW: VERTICAL LIST OF STAGES */}
      {/* (Requirement: "Mobile: lista vertical de etapas. Cada etapa deve mostrar: nome, quantidade de leads, ações, próxima etapa.") */}
      {/* ========================================================================= */}
      <div className="block lg:hidden space-y-3">
        {stageData.map(({ stage, index, companies: leadsInStage, nextStage }) => {
          const isExpanded = expandedStageId === stage.id;
          const colorPreset = FUNNEL_COLOR_PRESETS[stage.color || 'zinc'];

          return (
            <div
              key={stage.id}
              className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[15px] p-4 shadow-xs space-y-3"
            >
              {/* Header required: Nome, Quantidade de Leads, Próxima Etapa, Ações */}
              <div
                onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: colorPreset.accent }}
                    />
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      #{index + 1}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {stage.name}
                    </h3>
                  </div>

                  {/* Quantidade de Leads */}
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${colorPreset.bg} ${colorPreset.border} ${colorPreset.text}`}
                  >
                    {leadsInStage.length} {leadsInStage.length === 1 ? 'lead' : 'leads'}
                  </span>
                </div>

                {/* Próxima etapa */}
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1 truncate">
                    <ArrowRight className="w-3.5 h-3.5 text-[#635BFF] shrink-0" />
                    <strong>Próxima etapa:</strong> {nextStage ? nextStage.name : 'Fechamento / Final'}
                  </span>
                  <span className="text-[11px] text-[#635BFF] font-semibold">
                    {isExpanded ? 'Recolher' : 'Ver leads'}
                  </span>
                </div>
              </div>

              {/* Ações da Etapa */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-400">
                  {stage.description || 'Etapa do funil'}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManageStages();
                  }}
                  className="text-xs h-7 px-2"
                >
                  Configurar
                </Button>
              </div>

              {/* Expanded Companies List in Mobile */}
              {isExpanded && (
                <div className="pt-2 space-y-2 border-t border-zinc-100 dark:border-zinc-800">
                  {leadsInStage.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-3">
                      Nenhum lead nesta etapa no momento.
                    </p>
                  ) : (
                    leadsInStage.map((comp) => (
                      <div
                        key={comp.id}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3"
                      >
                        <div
                          onClick={() => setSelectedCompany(comp)}
                          className="truncate flex-1 cursor-pointer"
                        >
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {comp.name}
                          </h4>
                          <span className="text-[11px] text-zinc-400 block truncate">
                            {comp.city} • Score {comp.score}
                          </span>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenTransition(comp, nextStage?.id)}
                          icon={<ArrowRight className="w-3.5 h-3.5" />}
                          className="text-xs shrink-0"
                        >
                          Avançar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* STAGE TRANSITION MODAL (Audit logging: previous stage, new stage, date, time, responsible) */}
      <StageTransitionModal
        isOpen={isTransitionModalOpen}
        onClose={() => {
          setIsTransitionModalOpen(false);
          setTransitionCompany(null);
          setTransitionTargetStageId(undefined);
        }}
        company={transitionCompany}
        funnel={currentFunnel}
        initialTargetStageId={transitionTargetStageId}
      />
    </div>
  );
};
