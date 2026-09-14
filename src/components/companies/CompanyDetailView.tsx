import React, { useState } from 'react';
import { Company, CompanyFunnelStage } from '../../core/types/company';
import { FUNNEL_COLOR_PRESETS } from '../../core/types/funnel';
import { useLeadion } from '../../context/LeadionContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Score } from '../ui/Score';
import { Tabs, TabItem } from '../ui/Tabs';
import { Modal } from '../ui/Modal';
import { StageTransitionModal } from '../modals/StageTransitionModal';
import { CompanyTimeline } from './CompanyTimeline';
import { CompanyActivities } from './CompanyActivities';
import { 
  ArrowLeft, 
  ArrowRight,
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  MessageSquare, 
  Mail, 
  Share2, 
  ExternalLink, 
  Edit3, 
  Copy, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Briefcase, 
  Users, 
  Target, 
  Zap, 
  AlertTriangle,
  Send,
  Layers,
  Check,
  Scale,
  HelpCircle
} from 'lucide-react';
import { WhyThisScoreModal } from '../qualification/WhyThisScoreModal';
import { CompanyQualificationModal } from '../qualification/CompanyQualificationModal';
import { calculateCompanyQualification } from '../../core/qualification/qualificationEngine';

interface CompanyDetailViewProps {
  company: Company;
  onBack: () => void;
}

const FUNNEL_STAGES_LIST: { id: CompanyFunnelStage; label: string; short: string }[] = [
  { id: 'prospeccao', label: 'Prospecção', short: 'Prosp.' },
  { id: 'contato_feito', label: 'Contato Feito', short: 'Contato' },
  { id: 'qualificacao', label: 'Qualificação', short: 'Qualif.' },
  { id: 'reuniao_agendada', label: 'Reunião Agendada', short: 'Reunião' },
  { id: 'proposta', label: 'Proposta Apresentada', short: 'Proposta' },
  { id: 'negociacao', label: 'Negociação', short: 'Negoc.' },
  { id: 'cliente', label: 'Cliente Conquistado', short: 'Ganho' },
  { id: 'desqualificado', label: 'Desqualificado', short: 'Desq.' },
];

export const CompanyDetailView: React.FC<CompanyDetailViewProps> = ({ company, onBack }) => {
  const { 
    updateCompany, 
    deleteCompany, 
    archiveCompany, 
    unarchiveCompany, 
    duplicateCompany,
    addCompanyTimelineEvent,
    addCompanyActivity,
    toggleCompanyActivity,
    setEditingCompany,
    setIsNewCompanyModalOpen,
    services,
    scripts,
    objections,
    funnels,
    qualificationQuestions,
    qualificationAnswers,
    saveCompanyQualificationAnswers,
  } = useLeadion();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [selectedTargetStageId, setSelectedTargetStageId] = useState<string | undefined>(undefined);

  // Modais de Qualificação
  const [isWhyScoreModalOpen, setIsWhyScoreModalOpen] = useState(false);
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);

  // Cálculo determinístico em tempo real
  const scoreResult = React.useMemo(() => {
    const answers = qualificationAnswers[company.id] || {};
    return calculateCompanyQualification(company, qualificationQuestions, services, answers);
  }, [company, qualificationQuestions, services, qualificationAnswers]);

  // Active Funnel for this company
  const currentFunnel = funnels.find((f) => f.id === company.funnelId) || funnels.find((f) => f.isDefault) || funnels[0];
  const currentStage = currentFunnel?.stages.find((s) => s.id === company.funnelStageId);

  // Decision maker
  const primaryResponsible = company.responsibles.find((r) => r.isPrimary) || company.responsibles[0];

  // Associated service details
  const matchedServices = services.filter((s) => (company.associatedServices || []).includes(s.id));

  // WhatsApp link generator
  const getWhatsAppLink = (number?: string) => {
    if (!number) return '#';
    const cleanNumber = number.replace(/\D/g, '');
    const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    return `https://wa.me/${fullNumber}`;
  };

  const handleStageChange = (newStage: CompanyFunnelStage) => {
    if (newStage === company.funnelStage) return;
    updateCompany(company.id, { funnelStage: newStage });
  };

  const handleEdit = () => {
    setEditingCompany(company);
    setIsNewCompanyModalOpen(true);
  };

  const handleDuplicate = () => {
    duplicateCompany(company.id);
  };

  const handleToggleArchive = () => {
    if (company.status === 'archived') {
      unarchiveCompany(company.id);
    } else {
      archiveCompany(company.id);
    }
  };

  const handleDeleteConfirm = () => {
    deleteCompany(company.id);
    setIsDeleteModalOpen(false);
    onBack();
  };

  const detailTabs: TabItem[] = [
    { id: 'overview', label: 'Visão Geral & Cadastro', icon: <Building2 className="w-3.5 h-3.5" /> },
    { 
      id: 'qualification', 
      label: `Qualificação (${scoreResult.clientScore}/100)`, 
      icon: <Scale className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'activities', 
      label: 'Próxima Ação & Atividades', 
      icon: <Clock className="w-3.5 h-3.5" />,
      count: (company.activities || []).filter((a) => !a.completed).length 
    },
    { id: 'timeline', label: 'Histórico & Timeline', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'offer', label: 'Serviços & Proposta', icon: <Briefcase className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Voltar para Todas as Empresas
          </Button>

          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Building2 className="w-3.5 h-3.5 text-[#635BFF]" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{company.name}</span>
            <span>•</span>
            <span>{company.niche}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            icon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            icon={<Copy className="w-3.5 h-3.5" />}
          >
            Duplicar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleArchive}
            icon={company.status === 'archived' ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          >
            {company.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Excluir
          </Button>
        </div>
      </div>

      {/* Main Company Header Card */}
      <div className="p-6 rounded-[20px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/20 uppercase tracking-wider">
                {company.niche}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-zinc-400" />
                {company.location || `${company.city}, ${company.state} - ${company.country}`}
              </span>
              {company.status === 'archived' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  ARQUIVADA
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {company.name}
            </h1>

            {/* Quick Contact Line */}
            <div className="flex items-center gap-4 flex-wrap pt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {company.phone && (
                <a 
                  href={`tel:${company.phone.replace(/\D/g, '')}`}
                  className="flex items-center gap-1 hover:text-[#635BFF] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{company.phone}</span>
                </a>
              )}
              {company.whatsapp && (
                <a 
                  href={getWhatsAppLink(company.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp: {company.whatsapp}</span>
                </a>
              )}
              {company.website && (
                <a 
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{company.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Score & Direct Outbound Action */}
          <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#635BFF]">
                    Score Cliente (0–100)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsWhyScoreModalOpen(true)}
                    className="p-0.5 rounded text-[#635BFF] hover:bg-[#635BFF]/10 transition-colors"
                    title="Ver auditoria matemática detalhada"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {scoreResult.clientLevel}
                </span>
              </div>
              <Score score={scoreResult.clientScore} size="md" />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsWhyScoreModalOpen(true)}
                className="px-2.5 py-1.5 rounded-[10px] border border-zinc-200 dark:border-zinc-700 hover:border-[#635BFF] text-xs font-bold text-[#635BFF] dark:text-[#9A94FF] bg-white dark:bg-zinc-800 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Por que este score?</span>
              </button>

              {/* Quick Outbound Action Button */}
              {company.whatsapp && (
                <a
                  href={getWhatsAppLink(company.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Dynamic Funnel Pipeline Bar */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Funil:
              </span>
              <span className="text-xs font-bold text-[#635BFF]">
                {currentFunnel?.name || 'Esteira Comercial'}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Etapa Atual:
              </span>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                {currentStage?.name || company.funnelStageName || company.funnelStage}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight className="w-3.5 h-3.5 text-[#635BFF]" />}
              onClick={() => {
                setSelectedTargetStageId(undefined);
                setIsTransitionModalOpen(true);
              }}
              className="text-xs h-7 px-2.5"
            >
              Mover de Etapa (Auditável)
            </Button>
          </div>

          {currentFunnel && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 p-1.5 rounded-[13px] bg-zinc-100 dark:bg-[#12151D] border border-[#E6E8EC]/80 dark:border-[#232836]">
              {currentFunnel.stages.map((stage, idx) => {
                const isActive = stage.id === company.funnelStageId || stage.id === currentStage?.id;
                const stageIndex = currentFunnel.stages.findIndex((s) => s.id === (company.funnelStageId || currentStage?.id));
                const isPassed = stageIndex !== -1 && idx < stageIndex;
                const colorPreset = FUNNEL_COLOR_PRESETS[stage.color || 'zinc'];

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      setSelectedTargetStageId(stage.id);
                      setIsTransitionModalOpen(true);
                    }}
                    className={`shrink-0 py-2 px-3 rounded-[9px] text-[11px] font-semibold transition-all cursor-pointer text-center flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-[#635BFF] text-white border-[#635BFF] shadow-xs font-bold scale-[1.02]'
                        : isPassed
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 hover:border-[#635BFF]/50'
                    }`}
                    title={`Clique para transitar para: ${stage.name}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isActive ? '#FFFFFF' : colorPreset.accent }}
                    />
                    <span className="font-mono text-[10px] opacity-75">{idx + 1}.</span>
                    <span className="truncate max-w-[120px]">{stage.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CORE VALUE BANNER: "Transformar Prospecção em Execução" */}
      <div className="p-5 rounded-[16px] bg-gradient-to-r from-[#635BFF]/10 via-indigo-500/5 to-transparent border border-[#635BFF]/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#635BFF]" />
            <span className="text-[10px] font-bold text-[#635BFF] uppercase tracking-wider">
              Diretriz de Execução Comercial
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            Próxima Ação: {company.nextAction?.label || 'Primeiro toque de prospecção via WhatsApp'}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Vencimento: <strong className="text-zinc-800 dark:text-zinc-200">{company.nextAction?.dueDate || 'Hoje'}</strong> • 
            Canal prioritário: <strong className="text-zinc-800 dark:text-zinc-200">{company.nextAction?.channel?.toUpperCase() || 'WHATSAPP'}</strong> • 
            Decisor: <strong className="text-zinc-800 dark:text-zinc-200">{primaryResponsible?.name} ({primaryResponsible?.role})</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {primaryResponsible?.whatsapp ? (
            <a
              href={getWhatsAppLink(primaryResponsible.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#635BFF] hover:bg-[#5249ea] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Executar com Script Agora</span>
            </a>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('activities')}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Ver Tarefas da Conta
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={detailTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pill"
        className="w-full sm:w-auto"
      />

      {/* TAB CONTENT */}
      {/* 1. VISÃO GERAL & CADASTRO */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Decisores Mapeados */}
            <div className="p-5 rounded-[16px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#635BFF]" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Responsáveis & Tomadores de Decisão ({company.responsibles.length})
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  icon={<Edit3 className="w-3 h-3" />}
                >
                  Gerenciar Decisores
                </Button>
              </div>

              <div className="space-y-3">
                {company.responsibles.map((resp) => (
                  <div
                    key={resp.id}
                    className={`p-4 rounded-[14px] border transition-all ${
                      resp.isPrimary
                        ? 'bg-[#635BFF]/5 border-[#635BFF]/40 shadow-xs'
                        : 'bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {resp.name}
                          </h4>
                          {resp.isPrimary && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#635BFF] text-white">
                              Decisor Principal
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {resp.role}
                        </p>
                      </div>

                      {/* Direct Outreach Buttons */}
                      <div className="flex items-center gap-2">
                        {resp.whatsapp && (
                          <a
                            href={getWhatsAppLink(resp.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        {resp.phone && (
                          <a
                            href={`tel:${resp.phone.replace(/\D/g, '')}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Ligar</span>
                          </a>
                        )}
                        {resp.email && (
                          <a
                            href={`mailto:${resp.email}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>E-mail</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {resp.notes && (
                      <div className="mt-3 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-[9px]">
                        <strong className="text-zinc-700 dark:text-zinc-300 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Observações sobre este decisor:
                        </strong>
                        {resp.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Informações Comerciais */}
            <div className="p-5 rounded-[16px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Inteligência & Informações Comerciais
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Unidades / Lojas
                  </span>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {company.unitsCount || 1} {company.unitsCount === 1 ? 'unidade' : 'unidades'}
                  </span>
                </div>

                <div className="p-3 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Tipo de Negócio
                  </span>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {company.businessType || 'B2B'}
                  </span>
                </div>

                <div className="p-3 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Porte Estimado
                  </span>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {company.size || company.employeesRange || '11-50 colab.'}
                  </span>
                </div>

                <div className="p-3 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Fonte do Lead
                  </span>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {company.leadSource || 'Outbound Ativo'}
                  </span>
                </div>
              </div>

              {company.commercialNotes && (
                <div className="p-3.5 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                    Gargalos, Dores & Observações Estratégicas:
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {company.commercialNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Contatos Adicionais (se existirem) */}
            {company.additionalContacts && company.additionalContacts.length > 0 && (
              <div className="p-5 rounded-[16px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Contatos Adicionais & Ramais ({company.additionalContacts.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {company.additionalContacts.map((contact, idx) => (
                    <div
                      key={contact.id || idx}
                      className="p-3 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-zinc-900 dark:text-zinc-100">{contact.name}</strong>
                        {contact.role && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {contact.role}
                          </span>
                        )}
                      </div>
                      {contact.phone && (
                        <div className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Localização, Redes Sociais, Serviços */}
          <div className="space-y-6">
            {/* Endereço & Localização */}
            <div className="p-5 rounded-[16px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Localização & Endereço
                </h3>
              </div>

              <div className="text-xs space-y-2 text-zinc-600 dark:text-zinc-400">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Cidade & Estado
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {company.city}, {company.state} - {company.country}
                  </span>
                </div>

                {company.address && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                      Endereço
                    </span>
                    <span className="text-zinc-800 dark:text-zinc-200">
                      {company.address}
                    </span>
                  </div>
                )}

                {company.website && (
                  <div className="pt-2">
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#635BFF] hover:underline font-semibold"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Visitar Website Oficial</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Redes Sociais & Ficha GMB */}
            <div className="p-5 rounded-[16px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Canais & Redes Sociais
                </h3>
              </div>

              <div className="space-y-2">
                {company.socials?.instagram && (
                  <a
                    href={company.socials.instagram.startsWith('http') ? company.socials.instagram : `https://instagram.com/${company.socials.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 hover:border-pink-500/50 transition-colors text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-pink-500" />
                      Instagram
                    </span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                )}

                {company.socials?.linkedin && (
                  <a
                    href={company.socials.linkedin.startsWith('http') ? company.socials.linkedin : `https://${company.socials.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 hover:border-sky-500/50 transition-colors text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-600" />
                      LinkedIn
                    </span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                )}

                {company.socials?.googleBusiness && (
                  <a
                    href={company.socials.googleBusiness.startsWith('http') ? company.socials.googleBusiness : `https://${company.socials.googleBusiness}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 hover:border-emerald-500/50 transition-colors text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Google Maps (GMB)
                    </span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                )}

                {company.socials?.facebook && (
                  <a
                    href={company.socials.facebook.startsWith('http') ? company.socials.facebook : `https://${company.socials.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 hover:border-blue-600/50 transition-colors text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      Facebook
                    </span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                )}

                {company.socials?.tiktok && (
                  <a
                    href={company.socials.tiktok.startsWith('http') ? company.socials.tiktok : `https://${company.socials.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 hover:border-zinc-400 transition-colors text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white" />
                      TikTok
                    </span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                )}

                {!company.socials?.instagram && !company.socials?.linkedin && !company.socials?.googleBusiness && !company.socials?.facebook && !company.socials?.tiktok && (
                  <div className="p-3 text-center text-xs text-zinc-400">
                    Nenhuma rede social associada. Clique em "Editar" para cadastrar links de inteligência.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRÓXIMA AÇÃO & ATIVIDADES */}
      {activeTab === 'activities' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <CompanyActivities
            companyId={company.id}
            activities={company.activities || []}
            onToggleActivity={toggleCompanyActivity}
            onAddActivity={addCompanyActivity}
          />
        </div>
      )}

      {/* 3. HISTÓRICO & TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <CompanyTimeline
            companyId={company.id}
            events={company.timeline || []}
            onAddEvent={addCompanyTimelineEvent}
          />
        </div>
      )}

      {/* 4. SERVIÇOS & PROPOSTA */}
      {activeTab === 'offer' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-5 rounded-[16px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Serviços Recomendados para {company.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  O que vender e quais soluções trazem maior aderência financeira e operacional para o nicho de {company.niche}.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                icon={<Edit3 className="w-3 h-3" />}
              >
                Alterar Serviços
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchedServices.length > 0 ? (
                matchedServices.map((service) => (
                  <div
                    key={service.id}
                    className="p-4 rounded-[14px] bg-[#635BFF]/5 border border-[#635BFF]/30 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {service.name}
                        </h4>
                        <span className="text-xs font-bold text-[#635BFF] block mt-0.5">
                          {service.standardTicket}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#635BFF] text-white">
                        Alta Margem
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {service.coreValueProposition}
                    </p>

                    <div className="pt-2 border-t border-[#635BFF]/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Entregáveis Centrais:
                      </span>
                      <ul className="space-y-1">
                        {service.deliverables.map((del, i) => (
                          <li key={i} className="text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{del}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 col-span-2 text-center rounded-[12px] bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                  Nenhum serviço vinculado especificamente. Clique em "Alterar Serviços" para mapear a oferta ideal.
                </div>
              )}
            </div>
          </div>

          {/* Script Sugerido para o Nicho */}
          <div className="p-5 rounded-[16px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#635BFF]" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Argumentação & Script Recomendado para este Nicho
              </h3>
            </div>

            <div className="p-4 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Gancho sugerido para WhatsApp / Decisor Principal ({primaryResponsible?.name || 'Decisor'}):</span>
                <span className="font-semibold text-[#635BFF]">Canal WhatsApp</span>
              </div>
              <p className="text-xs text-zinc-800 dark:text-zinc-200 font-mono bg-white dark:bg-zinc-950 p-3 rounded-[8px] border border-zinc-200/80 dark:border-zinc-800/80 leading-relaxed">
                "Olá {primaryResponsible?.name || 'Diretor'}, tudo bem? Acompanho o crescimento e posicionamento da {company.name} no mercado de {company.niche}. Mapeamos um modelo de processo comercial que ajudou empresas semelhantes a aumentar o volume de reuniões qualificadas em 40%. Você teria 10 minutos na quinta-feira para uma troca prática?"
              </p>
              <div className="flex justify-end pt-1">
                {primaryResponsible?.whatsapp && (
                  <a
                    href={getWhatsAppLink(primaryResponsible.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar Agora no WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA: QUALIFICAÇÃO & SCORES (0 A 100) */}
      {activeTab === 'qualification' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Score do Cliente */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#635BFF]">
                  1. Score do Cliente
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-[#635BFF] dark:bg-indigo-950/60 dark:text-indigo-300">
                  {scoreResult.clientLevel}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono text-zinc-900 dark:text-white">
                  {scoreResult.clientScore}
                </span>
                <span className="text-sm font-bold text-zinc-400">/ 100</span>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed">
                Mede o quanto a empresa <strong>{company.name}</strong> é adequada ao perfil comercial ideal (porte, canal e decisor).
              </p>

              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWhyScoreModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-[#635BFF] text-xs font-bold text-[#635BFF] dark:text-[#9A94FF] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Auditar Pontos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsQualifyModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-[#635BFF] hover:text-white text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                >
                  Ajustar Questionário
                </button>
              </div>
            </div>

            {/* Card Serviço Recomendado */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  2. Recomendação do Leadion
                </span>
                {scoreResult.recommendedService && (
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {scoreResult.recommendedService.combinationScore}% Match
                  </span>
                )}
              </div>

              <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 truncate">
                {scoreResult.recommendedService?.serviceName || 'Nenhum avaliado'}
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed">
                {scoreResult.recommendedService?.rationale || 'O serviço com melhor combinação entre adequação, necessidade, prioridade, capacidade e contexto.'}
              </p>

              <div className="pt-1">
                <span className="text-[11px] font-semibold text-zinc-400">
                  Combinação balanceada de 5 pilares matemáticos
                </span>
              </div>
            </div>

            {/* Card Status da Auditoria */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                3. Transparência & Regras
              </span>

              <div className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                100% Determinístico
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed">
                Sem pontuações aleatórias ou caixas-pretas de IA. Cada ponto concedido tem origem auditável em perguntas e respostas configuradas pelo operador.
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsWhyScoreModalOpen(true)}
                  className="w-full py-2 rounded-xl bg-[#635BFF] hover:bg-[#5248E2] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Por que este score?</span>
                </button>
              </div>
            </div>
          </div>

          {/* Comparativo de Scores dos Serviços (0 a 100) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                  Scores dos Serviços (0 a 100)
                </h3>
                <p className="text-xs text-zinc-500">
                  Mede o quanto cada serviço é adequado especificamente para a {company.name}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {scoreResult.serviceScores.map((s) => {
                const isWinner = scoreResult.recommendedService?.serviceId === s.serviceId;

                return (
                  <div
                    key={s.serviceId}
                    className={`p-4 rounded-xl border transition-all ${
                      isWinner 
                        ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs' 
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        {isWinner && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                            ★ Recomendado
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {s.serviceName}
                        </h4>
                      </div>
                      <span className="text-base font-mono font-black text-zinc-900 dark:text-white">
                        {s.score}/100
                      </span>
                    </div>

                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${isWinner ? 'bg-emerald-500' : 'bg-[#635BFF]'}`}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-zinc-500 leading-snug">
                      {s.rationale}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Análise dos 5 Pilares de Recomendação */}
          {scoreResult.recommendedService && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#635BFF] block">
                  Matriz de Decisão
                </span>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                  Os 5 Pilares de Recomendação: {scoreResult.recommendedService.serviceName}
                </h3>
                <p className="text-xs text-zinc-500">
                  Como o Leadion combinou adequação, necessidade, prioridade, capacidade e contexto.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {scoreResult.recommendedService.factors.map((f) => (
                  <div
                    key={f.factor}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-2"
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
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
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
        </div>
      )}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Empresa Definitivamente"
        description="Esta ação removerá a empresa, seus contatos e atividades do sistema. Tem certeza que deseja continuar?"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Sim, Excluir Empresa
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 p-2 text-xs text-zinc-600 dark:text-zinc-400">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p>
            Você está prestes a excluir <strong>{company.name}</strong>. Esta operação não pode ser desfeita. Se preferir manter o histórico sem vê-la na fila ativa, considere arquivar a empresa.
          </p>
        </div>
      </Modal>

      {/* Stage Transition Modal with Audit Logging */}
      <StageTransitionModal
        isOpen={isTransitionModalOpen}
        onClose={() => {
          setIsTransitionModalOpen(false);
          setSelectedTargetStageId(undefined);
        }}
        company={company}
        funnel={currentFunnel || null}
        initialTargetStageId={selectedTargetStageId}
      />

      {/* Modal de Auditoria Detalhada: "Por que este score?" */}
      <WhyThisScoreModal
        isOpen={isWhyScoreModalOpen}
        onClose={() => setIsWhyScoreModalOpen(false)}
        result={scoreResult}
        onOpenQuestionnaire={() => {
          setIsWhyScoreModalOpen(false);
          setIsQualifyModalOpen(true);
        }}
      />

      {/* Modal Interativo de Preenchimento / Ajuste de Perguntas */}
      <CompanyQualificationModal
        isOpen={isQualifyModalOpen}
        onClose={() => setIsQualifyModalOpen(false)}
        company={company}
        questions={qualificationQuestions}
        services={services}
        savedAnswers={qualificationAnswers[company.id] || {}}
        onSaveAnswers={saveCompanyQualificationAnswers}
        onOpenAuditModal={() => {
          setIsQualifyModalOpen(false);
          setIsWhyScoreModalOpen(true);
        }}
      />
    </div>
  );
};
