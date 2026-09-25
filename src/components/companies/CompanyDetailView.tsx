import React, { useState, useEffect, useMemo } from 'react';
import { 
  Company, 
  CompanyFunnelStage, 
  CompanyResponsible, 
  CompanyContact,
  CompanyCommercialContext,
  CompanyServiceRelation,
  ServiceQualificationStatus 
} from '../../core/types/company';
import { FUNNEL_COLOR_PRESETS } from '../../core/types/funnel';
import { useLeadion } from '../../context/LeadionContext';
import { fetchCompanyByIdFromSupabase } from '../../services';
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
  HelpCircle,
  ShieldAlert,
  Plus,
  X,
  ThumbsUp,
  ThumbsDown,
  Tag,
  DollarSign,
  FileText
} from 'lucide-react';
import { WhyThisScoreModal } from '../qualification/WhyThisScoreModal';
import { CompanyQualificationModal } from '../qualification/CompanyQualificationModal';
import { calculateCompanyQualification } from '../../core/qualification/qualificationEngine';
import { getServicePriceForCompany, formatServiceCurrency } from '../../core/types/service';
import { replaceScriptVariables } from '../../core/utils/scriptVariables';

interface CompanyDetailViewProps {
  company: Company;
  onBack: () => void;
}

const DEFAULT_SCRIPT_TEMPLATES = [
  {
    id: 'script-approach',
    name: 'Primeiro Toque (Apresentação & Dor)',
    channel: 'whatsapp',
    template: 'Olá {{nome}}, tudo bem? Acompanho o crescimento da {{empresa}} em {{cidade}} e notei uma excelente oportunidade para {{objetivo}}. Atualmente, identificamos que {{problema}}, o que pode limitar a atração de clientes qualificados. Com a nossa solução de {{servico}}, ajudamos operações de {{pais}} a acelerar resultados por {{preco}}. Faria sentido conversar 10 minutos esta semana?',
  },
  {
    id: 'script-followup',
    name: 'Follow-up de Resposta',
    channel: 'whatsapp',
    template: 'Olá {{nome}}! Passando rapidamente para saber se conseguiu avaliar o ponto sobre {{problema}} na {{empresa}}. Preparamos um modelo prático de {{servico}} adaptado para o mercado de {{cidade}} por {{preco}}. Posso te enviar um resumo em 2 minutos?',
  },
  {
    id: 'script-proposal',
    name: 'Apresentação de Oferta & Preço',
    channel: 'whatsapp',
    template: 'Olá {{nome}}! Conforme conversamos, o investimento para estruturar o {{servico}} na {{empresa}} é de {{preco}} (moeda: {{moeda}}). Essa solução resolve diretamente a dor de {{dor}} e aproveita o ponto forte de {{ponto_positivo}}. Quando podemos alinhar os próximos passos de implantação?',
  },
];

export const CompanyDetailView: React.FC<CompanyDetailViewProps> = ({ company: initialCompany, onBack }) => {
  const { 
    companies,
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
    openWhatsAppForCompany,
    openObjectionDispatchModal,
    setIsPlanningModalOpen,
    setPlanningPreselectedCompany,
    services,
    scripts,
    objections,
    funnels,
    qualificationQuestions,
    qualificationAnswers,
    saveCompanyQualificationAnswers,
    userName,
  } = useLeadion();

  // Reatividade com o estado global e hidratação via Supabase sob demanda
  const companyFromContext = companies.find((c) => c.id === initialCompany.id);
  const [fetchedCompany, setFetchedCompany] = useState<Company | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!companyFromContext && initialCompany?.id) {
      fetchCompanyByIdFromSupabase(initialCompany.id).then((res) => {
        if (isMounted && res.success && res.company) {
          setFetchedCompany(res.company);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [initialCompany?.id, companyFromContext]);

  const company = companyFromContext || fetchedCompany || initialCompany;

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [selectedTargetStageId, setSelectedTargetStageId] = useState<string | undefined>(undefined);

  // Modais de Qualificação
  const [isWhyScoreModalOpen, setIsWhyScoreModalOpen] = useState(false);
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);

  // Estados locais para adição de novos contatos / decisores
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [newContact, setNewContact] = useState<Partial<CompanyResponsible>>({
    name: '',
    role: '',
    phone: '',
    whatsapp: '',
    email: '',
    preferredName: '',
    gender: '',
    isPrimary: false,
    isDecisionMaker: true,
    isInfluencer: false,
    communicationPreference: 'whatsapp',
    interests: '',
    conversationContext: '',
    notes: '',
  });

  // Estados locais para adição de serviços à empresa
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [selectedServiceIdToAdd, setSelectedServiceIdToAdd] = useState<string>(services[0]?.id || '');

  // Estados para Contexto Comercial
  const [commercialContext, setCommercialContext] = useState<CompanyCommercialContext>(() => company.commercialContext || {});
  const [positivePoints, setPositivePoints] = useState<string[]>(() => company.positivePoints || []);
  const [negativePoints, setNegativePoints] = useState<string[]>(() => company.negativePoints || []);
  const [newPositiveInput, setNewPositiveInput] = useState('');
  const [newNegativeInput, setNewNegativeInput] = useState('');
  const [contextSavedNotification, setContextSavedNotification] = useState(false);

  // Sincroniza estado de contexto comercial quando a empresa atualizar
  useEffect(() => {
    setCommercialContext(company.commercialContext || {});
    setPositivePoints(company.positivePoints || []);
    setNegativePoints(company.negativePoints || []);
  }, [company.commercialContext, company.positivePoints, company.negativePoints]);

  // Scripts interativos
  const [selectedScriptTemplateId, setSelectedScriptTemplateId] = useState<string>(DEFAULT_SCRIPT_TEMPLATES[0].id);
  const [customScriptText, setCustomScriptText] = useState<string>('');
  const [copiedScript, setCopiedScript] = useState(false);

  // Cálculo determinístico em tempo real
  const scoreResult = useMemo(() => {
    const answers = qualificationAnswers[company.id] || {};
    return calculateCompanyQualification(company, qualificationQuestions, services, answers);
  }, [company, qualificationQuestions, services, qualificationAnswers]);

  // Funil ativo da empresa
  const currentFunnel = funnels.find((f) => f.id === company.funnelId) || funnels.find((f) => f.isDefault) || funnels[0];
  const currentStage = currentFunnel?.stages.find((s) => s.id === company.funnelStageId);

  // Decisor principal (não assume o primeiro como padrão absoluto; prioriza isDecisionMaker ou isPrimary)
  const primaryResponsible = company.responsibles.find((r) => r.isDecisionMaker) ||
    company.responsibles.find((r) => r.isPrimary) ||
    company.responsibles[0];

  // Serviços associados
  const matchedServices = services.filter((s) => (company.associatedServices || []).includes(s.id));
  const activeService = matchedServices[0] || services[0];

  // WhatsApp link generator
  const getWhatsAppLink = (number?: string) => {
    if (!number) return '#';
    const cleanNumber = number.replace(/\D/g, '');
    const fullNumber = cleanNumber.startsWith('55') || cleanNumber.startsWith('258') || cleanNumber.startsWith('351') 
      ? cleanNumber 
      : `55${cleanNumber}`;
    return `https://wa.me/${fullNumber}`;
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

  // Gerenciamento de Serviços
  const handleAttachService = (serviceId: string) => {
    const s = services.find((srv) => srv.id === serviceId);
    if (!s) return;

    const currentAssoc = company.associatedServices || [];
    if (currentAssoc.includes(serviceId)) return;

    const pricing = getServicePriceForCompany(s, company.country);
    const newRelation: CompanyServiceRelation = {
      serviceId: s.id,
      serviceName: s.name,
      country: company.country,
      currency: pricing?.currency || 'MT',
      currencySymbol: pricing?.currencySymbol || pricing?.currency || 'MT',
      price: pricing?.myPrice || 0,
      funnelId: s.defaultFunnelId || currentFunnel?.id,
      funnelStageId: s.defaultFunnelStageId || currentFunnel?.stages[0]?.id,
      qualificationStatus: 'NOT_STARTED',
      score: null,
      qualificationAnswers: {},
      positivePoints: [],
      negativePoints: [],
      commercialContext: {},
      qualifiedAt: undefined,
    };

    const updatedRelations = [...(company.companyServices || []), newRelation];
    const updatedServices = [...currentAssoc, serviceId];

    updateCompany(company.id, {
      associatedServices: updatedServices,
      companyServices: updatedRelations,
      primaryServiceId: company.primaryServiceId || serviceId,
      funnelId: company.funnelId || s.defaultFunnelId || currentFunnel?.id,
      funnelStageId: company.funnelStageId || s.defaultFunnelStageId || currentFunnel?.stages[0]?.id,
    });

    addCompanyTimelineEvent(company.id, {
      type: 'servico_selecionado',
      title: `Serviço "${s.name}" associado`,
      detail: `Preço padrão carregado: ${newRelation.currencySymbol} ${newRelation.price.toLocaleString()} para ${company.country}.`,
      author: userName || 'Você (Operador)',
    });

    setIsAddServiceModalOpen(false);
  };

  const handleRemoveService = (serviceId: string) => {
    const updatedServices = (company.associatedServices || []).filter((id) => id !== serviceId);
    const updatedRelations = (company.companyServices || []).filter((r) => r.serviceId !== serviceId);

    updateCompany(company.id, {
      associatedServices: updatedServices,
      companyServices: updatedRelations,
      primaryServiceId: updatedServices[0] || undefined,
    });
  };

  // Gerenciamento de Contatos
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name?.trim()) return;

    const contactToSave: CompanyResponsible = {
      id: `resp-${Date.now()}`,
      name: newContact.name.trim(),
      role: newContact.role?.trim() || 'Contato Comercial',
      phone: newContact.phone?.trim() || '',
      whatsapp: newContact.whatsapp?.trim() || newContact.phone?.trim() || '',
      email: newContact.email?.trim() || '',
      preferredName: newContact.preferredName?.trim(),
      gender: newContact.gender,
      isPrimary: newContact.isPrimary || company.responsibles.length === 0,
      isDecisionMaker: newContact.isDecisionMaker || false,
      isInfluencer: newContact.isInfluencer || false,
      communicationPreference: newContact.communicationPreference || 'whatsapp',
      interests: newContact.interests?.trim(),
      conversationContext: newContact.conversationContext?.trim(),
      notes: newContact.notes?.trim(),
    };

    const updatedResponsibles = [...company.responsibles, contactToSave];
    updateCompany(company.id, { responsibles: updatedResponsibles });

    addCompanyTimelineEvent(company.id, {
      type: 'nota',
      title: `Contato "${contactToSave.name}" adicionado`,
      detail: `${contactToSave.role}${contactToSave.isDecisionMaker ? ' • [DECISOR]' : ''}`,
      author: userName || 'Você (Operador)',
    });

    setIsContactModalOpen(false);
    setNewContact({
      name: '',
      role: '',
      phone: '',
      whatsapp: '',
      email: '',
      preferredName: '',
      gender: '',
      isPrimary: false,
      isDecisionMaker: true,
      isInfluencer: false,
      communicationPreference: 'whatsapp',
      interests: '',
      conversationContext: '',
      notes: '',
    });
  };

  const handleRemoveContact = (contactId: string) => {
    const updated = company.responsibles.filter((r) => r.id !== contactId);
    updateCompany(company.id, { responsibles: updated });
  };

  const handleToggleContactFlag = (contactId: string, flag: 'isDecisionMaker' | 'isInfluencer' | 'isPrimary') => {
    const updated = company.responsibles.map((r) => {
      if (r.id !== contactId) {
        return flag === 'isPrimary' ? { ...r, isPrimary: false } : r;
      }
      return { ...r, [flag]: !r[flag] };
    });
    updateCompany(company.id, { responsibles: updated });
  };

  // Gerenciamento de Pontos Positivos e Negativos
  const handleAddPositivePoint = (text?: string) => {
    const val = (text || newPositiveInput).trim();
    if (!val || positivePoints.includes(val)) return;
    const updated = [...positivePoints, val];
    setPositivePoints(updated);
    setNewPositiveInput('');
    updateCompany(company.id, { positivePoints: updated });
  };

  const handleRemovePositivePoint = (index: number) => {
    const updated = positivePoints.filter((_, i) => i !== index);
    setPositivePoints(updated);
    updateCompany(company.id, { positivePoints: updated });
  };

  const handleAddNegativePoint = (text?: string) => {
    const val = (text || newNegativeInput).trim();
    if (!val || negativePoints.includes(val)) return;
    const updated = [...negativePoints, val];
    setNegativePoints(updated);
    setNewNegativeInput('');
    updateCompany(company.id, { negativePoints: updated });
  };

  const handleRemoveNegativePoint = (index: number) => {
    const updated = negativePoints.filter((_, i) => i !== index);
    setNegativePoints(updated);
    updateCompany(company.id, { negativePoints: updated });
  };

  // Salvar Contexto Comercial
  const handleSaveCommercialContext = () => {
    updateCompany(company.id, {
      commercialContext,
      positivePoints,
      negativePoints,
    });
    setContextSavedNotification(true);
    setTimeout(() => setContextSavedNotification(false), 3000);
  };

  // Geração e Cópia de Script
  const activeScriptTemplate = useMemo(() => {
    return DEFAULT_SCRIPT_TEMPLATES.find((s) => s.id === selectedScriptTemplateId) || DEFAULT_SCRIPT_TEMPLATES[0];
  }, [selectedScriptTemplateId]);

  const renderedScript = useMemo(() => {
    return replaceScriptVariables(
      customScriptText || activeScriptTemplate.template,
      company,
      activeService,
      userName || 'Consultor Leadion'
    );
  }, [customScriptText, activeScriptTemplate, company, activeService, userName]);

  const handleCopyScript = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(renderedScript);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  // Tabs do Detalhamento
  const isCompanyQualified = company.qualificationStatus === 'QUALIFIED' || (scoreResult.clientScore !== null && scoreResult.clientScore >= 60);

  const detailTabs: TabItem[] = [
    { id: 'overview', label: 'Resumo & Cadastro', icon: <Building2 className="w-3.5 h-3.5" /> },
    { 
      id: 'contacts', 
      label: `Contactos (${company.responsibles.length})`, 
      icon: <Users className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'services', 
      label: `Serviços (${matchedServices.length})`, 
      icon: <Briefcase className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'qualification', 
      label: `Qualificação (${scoreResult.clientScore !== null ? `${scoreResult.clientScore}/100` : '—'})`, 
      icon: <Scale className="w-3.5 h-3.5" /> 
    },
    { id: 'context', label: 'Contexto & Dores', icon: <Tag className="w-3.5 h-3.5" /> },
    { id: 'scripts', label: 'Scripts Personalizados', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { 
      id: 'activities', 
      label: 'Atividades', 
      icon: <Clock className="w-3.5 h-3.5" />,
      count: (company.activities || []).filter((a) => !a.completed).length 
    },
    { id: 'timeline', label: 'Histórico', icon: <Layers className="w-3.5 h-3.5" /> },
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
            Voltar
          </Button>

          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Building2 className="w-3.5 h-3.5 text-[#635BFF]" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{company.name}</span>
            <span>•</span>
            <span>{company.country}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => openWhatsAppForCompany(company)}
            icon={<Send className="w-3.5 h-3.5" />}
            className="shadow-xs"
          >
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openObjectionDispatchModal(company)}
            icon={<ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
          >
            Objeção
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPlanningPreselectedCompany(company);
              setIsPlanningModalOpen(true);
            }}
            icon={<Calendar className="w-3.5 h-3.5 text-[#635BFF]" />}
          >
            Agendar Ação
          </Button>
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
      <div className="p-6 rounded-[20px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/20 uppercase tracking-wider">
                {company.niche || 'Geral B2B'}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-zinc-400" />
                {company.location || `${company.city || ''} - ${company.country}`}
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

          {/* Quick Score Card */}
          <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#635BFF]">
                    Score Cliente
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsWhyScoreModalOpen(true)}
                    className="p-0.5 rounded text-[#635BFF] hover:bg-[#635BFF]/10 transition-colors cursor-pointer"
                    title="Ver auditoria detalhada de pontos"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {scoreResult.clientLevel}
                </span>
              </div>
              <Score 
                score={scoreResult.clientScore} 
                size="md" 
                onClick={() => setIsWhyScoreModalOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BANNER CONTEXTUAL: PRÓXIMO PASSO RECOMENDADO (SECTION 41)                 */}
        {/* ========================================================================= */}
        {(!company.associatedServices || company.associatedServices.length === 0) ? (
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#635BFF] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#635BFF] block">
                  Próximo passo recomendado
                </span>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Adicionar Serviço Comercial
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Selecione a oferta a propor (Landing Page, Website, etc.) para carregar preço regional e perguntas.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('services')}
              className="shrink-0 text-xs"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Adicionar Serviço
            </Button>
          </div>
        ) : (company.qualificationStatus === 'NOT_STARTED' || scoreResult.clientScore === null) ? (
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                  Próximo passo recomendado
                </span>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Iniciar Qualificação Manual ({activeService?.name || 'Serviço'})
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Responda aos critérios da oferta para calcular o Service Score antes de prospectar.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('qualification')}
              className="shrink-0 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              icon={<Scale className="w-3.5 h-3.5" />}
            >
              Iniciar Qualificação
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  Empresa Qualificada ({scoreResult.clientScore}/100)
                </span>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Preparar Abordagem e Prospectar
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Gere o script personalizado e inicie a abordagem no WhatsApp com argumentos reais.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('scripts')}
                className="shrink-0 text-xs"
                icon={<Sparkles className="w-3.5 h-3.5 text-[#635BFF]" />}
              >
                Ver Scripts
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openWhatsAppForCompany(company)}
                className="shrink-0 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Disparar WhatsApp
              </Button>
            </div>
          </div>
        )}

        {/* Funil Pipeline Bar */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Funil:</span>
              <span className="font-bold text-[#635BFF]">{currentFunnel?.name || 'Padrão'}</span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-[10px] font-bold uppercase text-zinc-400">Etapa:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {currentStage?.name || company.funnelStage}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTransitionModalOpen(true)}
              className="text-xs h-7 px-2.5"
            >
              Mover Etapa
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={detailTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pill"
        className="w-full sm:w-auto overflow-x-auto"
      />

      {/* ========================================================================= */}
      {/* ABA 1: RESUMO & CADASTRO BÁSICO (SECTION 6 & 7)                           */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Dados Cadastrais & Estrutura */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#635BFF]" />
                  Dados Básicos & Estrutura
                </h3>
                <Button variant="outline" size="sm" onClick={handleEdit} icon={<Edit3 className="w-3 h-3" />}>
                  Editar Dados
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">País & Região</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{company.country}</div>
                  <div className="text-zinc-500 mt-0.5">{company.city ? `${company.city}, ${company.state || ''}` : 'Cidade não especificada'}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Endereço Completo</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{company.address || 'Não cadastrado'}</div>
                  <div className="text-zinc-500 mt-0.5">{company.zipCode ? `CEP/Código: ${company.zipCode}` : ''}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Porte & Unidades</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{company.size || 'Não especificado'}</div>
                  <div className="text-zinc-500 mt-0.5">{company.unitsCount || 1} unidade(s) física(s)</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Tipo de Negócio & Origem</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{company.businessType || 'B2B'}</div>
                  <div className="text-zinc-500 mt-0.5">Fonte: {company.leadSource || 'Outbound'}</div>
                </div>
              </div>

              {company.commercialNotes && (
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 text-xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Notas Comerciais</span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{company.commercialNotes}</p>
                </div>
              )}
            </div>

            {/* Redes Sociais & Presença Digital (Section 7) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#635BFF]" />
                  Redes Sociais & Presença Digital
                </h3>
                <Button variant="outline" size="sm" onClick={handleEdit} icon={<Edit3 className="w-3 h-3" />}>
                  Editar Redes
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Website</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{company.website || 'Sem website cadastrado'}</span>
                  </div>
                  {company.website && (
                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="text-[#635BFF] hover:underline p-1">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Google Business Profile / GMB</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{company.socials?.gmb || company.socials?.googleBusiness || 'Não verificado'}</span>
                  </div>
                  {(company.socials?.gmb || company.socials?.googleBusiness) && (
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  )}
                </div>

                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Instagram</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{company.socials?.instagram || 'Não informado'}</span>
                  </div>
                  {company.socials?.instagram && (
                    <span className="text-xs text-[#635BFF] font-semibold">{company.socials.instagram}</span>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">LinkedIn</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{company.socials?.linkedin || 'Não informado'}</span>
                  </div>
                  {company.socials?.linkedin && (
                    <span className="text-xs text-[#635BFF] font-semibold">LinkedIn Ativo</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Side Column: Próxima Ação & Decisor Rápido */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Próxima Ação Comercial
              </h4>
              {company.nextAction ? (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{company.nextAction.label}</div>
                  <div className="text-[11px] text-zinc-500">Data: {company.nextAction.dueDate} · Canal: {company.nextAction.channel}</div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                  <Clock className="w-6 h-6 text-zinc-300 dark:text-zinc-700 mx-auto" />
                  <p className="text-xs text-zinc-500">Nenhuma ação futura agendada.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPlanningPreselectedCompany(company);
                      setIsPlanningModalOpen(true);
                    }}
                    className="text-xs"
                    icon={<Calendar className="w-3.5 h-3.5 text-[#635BFF]" />}
                  >
                    Agendar Ação
                  </Button>
                </div>
              )}
            </div>

            {/* Decisor Principal */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Decisor Principal
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('contacts')}
                  className="text-xs text-[#635BFF] font-semibold hover:underline cursor-pointer"
                >
                  Ver todos
                </button>
              </div>

              {primaryResponsible ? (
                <div className="p-3.5 rounded-xl bg-[#635BFF]/5 border border-[#635BFF]/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{primaryResponsible.name}</span>
                    <span className="text-[9px] font-bold uppercase bg-[#635BFF] text-white px-1.5 py-0.2 rounded">Decisor</span>
                  </div>
                  <p className="text-xs text-zinc-500">{primaryResponsible.role}</p>
                  <div className="pt-2 flex items-center gap-2">
                    {primaryResponsible.whatsapp && (
                      <a href={getWhatsAppLink(primaryResponsible.whatsapp)} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
                    {primaryResponsible.phone && (
                      <a href={`tel:${primaryResponsible.phone.replace(/\D/g, '')}`} className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Ligar
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                  <p className="text-xs text-zinc-500">Nenhum decisor cadastrado ainda.</p>
                  <Button variant="outline" size="sm" onClick={() => setIsContactModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                    Cadastrar Contato
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CONTACTOS & DECISORES (SECTION 8 & 9)                              */}
      {/* ========================================================================= */}
      {activeTab === 'contacts' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#635BFF]" />
                  Contactos & Tomadores de Decisão ({company.responsibles.length})
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Cadastre múltiplos contatos e identifique explicitamente quem é Decisor, Influenciador ou Contato Principal.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsContactModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Adicionar Contato
              </Button>
            </div>

            {company.responsibles.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
                <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <p className="text-xs text-zinc-500">Nenhum contato cadastrado para {company.name}.</p>
                <Button variant="outline" size="sm" onClick={() => setIsContactModalOpen(true)} icon={<Plus className="w-3 h-3" />}>
                  Cadastrar Primeiro Contato
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.responsibles.map((resp, idx) => (
                  <div
                    key={resp.id || idx}
                    className={`p-4 rounded-xl border transition-all ${
                      resp.isDecisionMaker
                        ? 'border-[#635BFF]/40 bg-[#635BFF]/5 shadow-xs'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {resp.name}
                          </h4>
                          {resp.preferredName && (
                            <span className="text-[10px] text-zinc-500">
                              (Chamar de: "{resp.preferredName}")
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">{resp.role}</p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {resp.isDecisionMaker && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#635BFF] text-white">
                            Decisor
                          </span>
                        )}
                        {resp.isInfluencer && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            Influenciador
                          </span>
                        )}
                        {resp.isPrimary && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                            Principal
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(resp.id)}
                          className="text-zinc-400 hover:text-rose-500 p-1 cursor-pointer"
                          title="Remover Contato"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Canais e Links */}
                    <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800 mt-3 grid grid-cols-2 gap-2 text-xs">
                      {resp.whatsapp && (
                        <a href={getWhatsAppLink(resp.whatsapp)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-600 hover:underline">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="truncate">{resp.whatsapp}</span>
                        </a>
                      )}
                      {resp.phone && (
                        <a href={`tel:${resp.phone.replace(/\D/g, '')}`} className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:underline">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="truncate">{resp.phone}</span>
                        </a>
                      )}
                      {resp.email && (
                        <a href={`mailto:${resp.email}`} className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:underline col-span-2">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{resp.email}</span>
                        </a>
                      )}
                    </div>

                    {/* Campos de Personalização (Section 9) */}
                    {(resp.conversationContext || resp.interests || resp.notes) && (
                      <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
                        {resp.conversationContext && (
                          <div><strong>Contexto / Origem:</strong> {resp.conversationContext}</div>
                        )}
                        {resp.interests && (
                          <div><strong>Interesses profissionais:</strong> {resp.interests}</div>
                        )}
                        {resp.notes && (
                          <div><strong>Observações:</strong> {resp.notes}</div>
                        )}
                      </div>
                    )}

                    {/* Toggles Rápidos */}
                    <div className="pt-2 flex items-center gap-3 text-[11px] text-zinc-500">
                      <button
                        type="button"
                        onClick={() => handleToggleContactFlag(resp.id, 'isDecisionMaker')}
                        className={`hover:underline cursor-pointer ${resp.isDecisionMaker ? 'font-bold text-[#635BFF]' : ''}`}
                      >
                        {resp.isDecisionMaker ? '✓ É Decisor' : '+ Marcar Decisor'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleContactFlag(resp.id, 'isInfluencer')}
                        className={`hover:underline cursor-pointer ${resp.isInfluencer ? 'font-bold text-purple-600' : ''}`}
                      >
                        {resp.isInfluencer ? '✓ É Influenciador' : '+ Marcar Influenciador'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: SERVIÇOS & PREÇOS (SECTION 10, 11 & 17)                            */}
      {/* ========================================================================= */}
      {activeTab === 'services' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#635BFF]" />
                  Serviços Oferecidos a {company.name} ({matchedServices.length})
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Cada serviço possui precificação automática para {company.country}, funil associado e qualificação independente.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddServiceModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Associar Serviço
              </Button>
            </div>

            {matchedServices.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
                <Briefcase className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Sem serviço comercial definido</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Vincule a oferta de alto valor que você planeja propor para carregar automaticamente a precificação na moeda de {company.country}.
                </p>
                <div className="pt-2">
                  <Button variant="primary" size="sm" onClick={() => setIsAddServiceModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                    Escolher Serviço
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchedServices.map((service) => {
                  const pricing = getServicePriceForCompany(service, company.country);
                  const relation = (company.companyServices || []).find((r) => r.serviceId === service.id);
                  const isQualifiedForService = relation?.qualificationStatus === 'QUALIFIED' || (relation?.score !== null && relation?.score !== undefined);

                  return (
                    <div
                      key={service.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#635BFF] uppercase tracking-wider block">
                            {service.code || 'SERVIÇO'}
                          </span>
                          <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                            {service.name}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(service.id)}
                          className="text-zinc-400 hover:text-rose-500 p-1 cursor-pointer"
                          title="Desvincular Serviço"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Precificação Regionalizada Automática (Section 10) */}
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Preço para {company.country}</span>
                          <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 font-mono">
                            {pricing ? formatServiceCurrency(pricing.myPrice, pricing.currency, pricing.currencySymbol) : 'Sob Consulta'}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#635BFF] bg-[#635BFF]/10 px-2 py-0.5 rounded">
                          Moeda: {pricing?.currency || 'MT'}
                        </span>
                      </div>

                      {/* Status de Qualificação do Serviço (Section 16 & 18) */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-zinc-500">Qualificação do Serviço:</span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          relation?.qualificationStatus === 'QUALIFIED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          {relation?.qualificationStatus === 'QUALIFIED' ? 'Qualificado' : 'Não avaliado'}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('qualification')}
                          className="text-xs"
                          icon={<Scale className="w-3 h-3 text-[#635BFF]" />}
                        >
                          Qualificar Oferta
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setActiveTab('scripts')}
                          className="text-xs"
                          icon={<Sparkles className="w-3 h-3" />}
                        >
                          Ver Script
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: QUALIFICAÇÃO MANUAL DO SERVIÇO (SECTIONS 12, 13, 14 & 15)           */}
      {/* ========================================================================= */}
      {activeTab === 'qualification' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#635BFF]/10 text-[#635BFF] uppercase tracking-wider">
                    Qualificação Pertence ao Serviço
                  </span>
                  <span className="text-xs text-zinc-400">• Respostas Manuais do Operador</span>
                </div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                  Questionário Comercial de {company.name}
                </h3>
                <p className="text-xs text-zinc-500">
                  As perguntas medem adequação e necessidade real. O Service Score é gerado exclusivamente após suas respostas.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWhyScoreModalOpen(true)}
                  icon={<HelpCircle className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Auditar Score
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsQualifyModalOpen(true)}
                  icon={<Scale className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Abrir Questionário Completo
                </Button>
              </div>
            </div>

            {/* Score Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Score do Cliente (0 a 100)</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {scoreResult.clientLevel}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-zinc-900 dark:text-zinc-100">
                    {scoreResult.clientScore !== null ? scoreResult.clientScore : '—'}
                  </span>
                  {scoreResult.clientScore !== null && <span className="text-xs text-zinc-400">/ 100</span>}
                </div>
                <p className="text-xs text-zinc-500">
                  {scoreResult.clientScore === null 
                    ? 'Ainda não avaliado. Clique em "Abrir Questionário" para qualificar.' 
                    : 'Pontuação auditável calculada pelas respostas registradas.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Status Operacional</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    isCompanyQualified 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {isCompanyQualified ? 'Qualificado' : 'Não qualificado'}
                  </span>
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                  Serviço analisado: <strong className="text-zinc-900 dark:text-zinc-100">{activeService?.name || 'Geral'}</strong>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQualifyModalOpen(true)}
                    className="w-full text-xs"
                    icon={<Scale className="w-3.5 h-3.5 text-[#635BFF]" />}
                  >
                    Responder Perguntas Manualmente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: CONTEXTO COMERCIAL, DORES & PONTOS (SECTIONS 19, 20 & 21)           */}
      {/* ========================================================================= */}
      {activeTab === 'context' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Alerta de salvamento */}
          {contextSavedNotification && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Contexto comercial e pontos atualizados com sucesso.
            </div>
          )}

          {/* Pontos Positivos e Negativos (Section 19) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pontos Positivos */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  Pontos Positivos ({positivePoints.length})
                </h4>
              </div>

              {/* Input para adicionar ponto positivo */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPositiveInput}
                  onChange={(e) => setNewPositiveInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPositivePoint(); } }}
                  placeholder="Ex: Instagram ativo, boa reputação, decisor acessível..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100"
                />
                <Button size="sm" variant="outline" onClick={() => handleAddPositivePoint()} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add
                </Button>
              </div>

              {/* Tags de pontos positivos */}
              <div className="flex items-center gap-1.5 flex-wrap min-h-12 pt-1">
                {positivePoints.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-semibold"
                  >
                    <span>{p}</span>
                    <button type="button" onClick={() => handleRemovePositivePoint(idx)} className="text-emerald-500 hover:text-emerald-800 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Sugestões rápidas */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <span className="block font-semibold">Sugestões rápidas:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['Instagram ativo', 'Decisor mapeado', 'Várias unidades', 'Nicho alto padrão', 'Boa reputação'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddPositivePoint(sug)}
                      className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-100 text-zinc-600 dark:text-zinc-300 text-[10px] cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pontos Negativos */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <ThumbsDown className="w-4 h-4 text-rose-600" />
                  Pontos Negativos / Gargalos ({negativePoints.length})
                </h4>
              </div>

              {/* Input para adicionar ponto negativo */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newNegativeInput}
                  onChange={(e) => setNewNegativeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNegativePoint(); } }}
                  placeholder="Ex: Website inexistente, link na bio genérico, baixo orçamento..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100"
                />
                <Button size="sm" variant="outline" onClick={() => handleAddNegativePoint()} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add
                </Button>
              </div>

              {/* Tags de pontos negativos */}
              <div className="flex items-center gap-1.5 flex-wrap min-h-12 pt-1">
                {negativePoints.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 text-xs font-semibold"
                  >
                    <span>{p}</span>
                    <button type="button" onClick={() => handleRemoveNegativePoint(idx)} className="text-rose-500 hover:text-rose-800 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Sugestões rápidas */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <span className="block font-semibold">Sugestões rápidas:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['Website inexistente', 'Sem link na bio', 'Pouca atividade digital', 'Contato difícil', 'Decisor não identificado'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddNegativePoint(sug)}
                      className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-100 text-zinc-600 dark:text-zinc-300 text-[10px] cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Contexto do Lead Form (Section 20) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#635BFF]" />
                  Contexto Comercial & Dores Estratégicas
                </h3>
                <p className="text-xs text-zinc-500">
                  Estes dados serão utilizados para personalizar os scripts e as mensagens sem inventar informações.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveCommercialContext}
                icon={<Check className="w-3.5 h-3.5" />}
              >
                Salvar Contexto
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Problema Identificado
                </label>
                <input
                  type="text"
                  value={commercialContext.problem || ''}
                  onChange={(e) => setCommercialContext({ ...commercialContext, problem: e.target.value })}
                  placeholder="Ex: Não possui website rápido para converter leads do WhatsApp"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Necessidade Percebida
                </label>
                <input
                  type="text"
                  value={commercialContext.perceivedNeed || ''}
                  onChange={(e) => setCommercialContext({ ...commercialContext, perceivedNeed: e.target.value })}
                  placeholder="Ex: Captar clientes particulares fora de convênios"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Objetivo Principal da Empresa
                </label>
                <input
                  type="text"
                  value={commercialContext.companyGoal || ''}
                  onChange={(e) => setCommercialContext({ ...commercialContext, companyGoal: e.target.value })}
                  placeholder="Ex: Dobrar número de consultas por mês"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Dor Principal
                </label>
                <input
                  type="text"
                  value={commercialContext.mainPain || ''}
                  onChange={(e) => setCommercialContext({ ...commercialContext, mainPain: e.target.value })}
                  placeholder="Ex: Perda diária de pacientes para clínicas vizinhas"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Urgência de Solução
                </label>
                <select
                  value={commercialContext.urgency || 'media'}
                  onChange={(e) => setCommercialContext({ ...commercialContext, urgency: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs font-semibold"
                >
                  <option value="baixa">Baixa (Apenas sondando)</option>
                  <option value="media">Média (Planejamento para o trimestre)</option>
                  <option value="alta">Alta (Prejuízo imediato / Decisor ativo)</option>
                  <option value="imediata">Imediata (Precisa fechar agora)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Orçamento Conhecido
                </label>
                <input
                  type="text"
                  value={commercialContext.knownBudget || ''}
                  onChange={(e) => setCommercialContext({ ...commercialContext, knownBudget: e.target.value })}
                  placeholder="Ex: Verba de marketing disponível de 15.000 MT"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Solução Atual / Fornecedor
                </label>
                <input
                  type="text"
                  value={commercialContext.currentSolution || ''}
                  onChange={(e) => setCommercialContext({ ...commercialContext, currentSolution: e.target.value })}
                  placeholder="Ex: Apenas perfil do Instagram e boca a boca"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Objeção Antecipada
                </label>
                <input
                  type="text"
                  value={commercialContext.anticipatedObjection || ''}
                  onChange={(e) => setCommercialContext({ ...commercialContext, anticipatedObjection: e.target.value })}
                  placeholder="Ex: Falta de tempo para passar conteúdo"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 6: SCRIPTS PERSONALIZADOS (SECTIONS 21, 22 & 23)                      */}
      {/* ========================================================================= */}
      {activeTab === 'scripts' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#635BFF]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#635BFF]">
                    Personalização Baseada em Contexto Real
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  Scripts Comerciais com Variáveis de {company.name}
                </h3>
                <p className="text-xs text-zinc-500">
                  Variáveis reais como {"{{empresa}}"}, {"{{nome}}"}, {"{{preco}}"} e {"{{problema}}"} são preenchidas com precisão cirúrgica sem inventar dados.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyScript}
                  icon={<Copy className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  {copiedScript ? 'Copiado!' : 'Copiar Texto'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openWhatsAppForCompany(company)}
                  icon={<Send className="w-3.5 h-3.5" />}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Enviar no WhatsApp
                </Button>
              </div>
            </div>

            {/* Template Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {DEFAULT_SCRIPT_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedScriptTemplateId(tmpl.id);
                    setCustomScriptText(tmpl.template);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                    selectedScriptTemplateId === tmpl.id
                      ? 'bg-[#635BFF] text-white border-[#635BFF] shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                  }`}
                >
                  {tmpl.name}
                </button>
              ))}
            </div>

            {/* Rendered Preview Box */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Prévia final da mensagem (Pronta para envio):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Canal WhatsApp</span>
              </div>

              <textarea
                value={renderedScript}
                readOnly
                rows={6}
                className="w-full p-4 rounded-xl bg-white dark:bg-zinc-950 font-mono text-xs text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 leading-relaxed focus:outline-none"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-400">
                  Destinatário: <strong className="text-zinc-700 dark:text-zinc-300">{primaryResponsible?.name || 'Recepção / Contato Geral'}</strong> ({company.whatsapp || company.phone || 'Sem telefone'})
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openWhatsAppForCompany(company)}
                  icon={<Send className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Disparar Mensagem Agora
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 7: ATIVIDADES & PRÓXIMA AÇÃO                                          */}
      {/* ========================================================================= */}
      {activeTab === 'activities' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <CompanyActivities
            company={company}
            onAddActivity={(act) => addCompanyActivity(company.id, act)}
            onToggleActivity={(actId) => toggleCompanyActivity(company.id, actId)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 8: HISTÓRICO CRONOLÓGICO                                              */}
      {/* ========================================================================= */}
      {activeTab === 'timeline' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <CompanyTimeline
            events={company.timeline || []}
            companyName={company.name}
            onAddNote={(note) => {
              addCompanyTimelineEvent(company.id, {
                type: 'nota',
                title: 'Nota Comercial',
                detail: note,
                author: userName || 'Você (Operador)',
              });
            }}
          />
        </div>
      )}

      {/* MODAL: Adicionar Contato */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Adicionar Contato / Decisor"
        description="Cadastre um novo contato para a empresa sem assumir automaticamente que ele é o decisor."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsContactModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveContact} disabled={!newContact.name?.trim()}>
              Salvar Contato
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveContact} className="space-y-3 py-1 text-xs">
          <div>
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={newContact.name || ''}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder="Ex: Dra. Samira Patel ou João Silva"
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Como prefere ser chamado?
              </label>
              <input
                type="text"
                value={newContact.preferredName || ''}
                onChange={(e) => setNewContact({ ...newContact, preferredName: e.target.value })}
                placeholder="Ex: Samira"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Cargo / Função
              </label>
              <input
                type="text"
                value={newContact.role || ''}
                onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                placeholder="Ex: Diretora Clínica"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={newContact.phone || ''}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="Telefone"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                WhatsApp
              </label>
              <input
                type="tel"
                value={newContact.whatsapp || ''}
                onChange={(e) => setNewContact({ ...newContact, whatsapp: e.target.value })}
                placeholder="WhatsApp direto"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
              />
            </div>
          </div>

          {/* Papéis do Contato (Section 8) */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 block">Papel Comercial no Negócio</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newContact.isDecisionMaker || false}
                  onChange={(e) => setNewContact({ ...newContact, isDecisionMaker: e.target.checked })}
                  className="rounded text-[#635BFF]"
                />
                <span className="font-semibold">[DECISOR]</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newContact.isInfluencer || false}
                  onChange={(e) => setNewContact({ ...newContact, isInfluencer: e.target.checked })}
                  className="rounded text-[#635BFF]"
                />
                <span className="font-semibold">[INFLUENCIADOR]</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newContact.isPrimary || false}
                  onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                  className="rounded text-[#635BFF]"
                />
                <span className="font-semibold">[PRINCIPAL]</span>
              </label>
            </div>
          </div>

          <div>
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Contexto da conversa / Como conheceu
            </label>
            <input
              type="text"
              value={newContact.conversationContext || ''}
              onChange={(e) => setNewContact({ ...newContact, conversationContext: e.target.value })}
              placeholder="Ex: Conectou no LinkedIn, indicado por cliente X..."
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL: Associar Serviço */}
      <Modal
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        title="Associar Serviço Comercial"
        description={`Selecione uma oferta para associar a ${company.name}. O preço será automaticamente regionalizado para ${company.country}.`}
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsAddServiceModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleAttachService(selectedServiceIdToAdd)}>
              Vincular Serviço
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1 text-xs">
          <div>
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Qual serviço deseja oferecer?
            </label>
            <select
              value={selectedServiceIdToAdd}
              onChange={(e) => setSelectedServiceIdToAdd(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs font-semibold"
            >
              {services.map((s) => {
                const p = getServicePriceForCompany(s, company.country);
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({p ? formatServiceCurrency(p.myPrice, p.currency, p.currencySymbol) : 'Sob Consulta'})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1">
            <p>• O funil padrão do serviço será configurado para esta empresa.</p>
            <p>• A empresa NÃO será qualificada automaticamente. Você decidirá quando responder aos critérios.</p>
          </div>
        </div>
      </Modal>

      {/* Modais de Suporte */}
      <WhyThisScoreModal
        isOpen={isWhyScoreModalOpen}
        onClose={() => setIsWhyScoreModalOpen(false)}
        result={scoreResult}
        onOpenQuestionnaire={() => {
          setIsWhyScoreModalOpen(false);
          setIsQualifyModalOpen(true);
        }}
      />

      <CompanyQualificationModal
        isOpen={isQualifyModalOpen}
        onClose={() => setIsQualifyModalOpen(false)}
        company={company}
        questions={qualificationQuestions}
        services={services}
        savedAnswers={qualificationAnswers[company.id] || {}}
        onSaveAnswers={(compId, answers) => {
          saveCompanyQualificationAnswers(compId, answers);
          const updatedScoreResult = calculateCompanyQualification(company, qualificationQuestions, services, answers);
          updateCompany(company.id, {
            score: updatedScoreResult.clientScore,
            qualificationStatus: updatedScoreResult.clientScore !== null && updatedScoreResult.clientScore >= 60 ? 'QUALIFIED' : 'REVIEW',
          });
        }}
        onOpenAuditModal={() => {
          setIsQualifyModalOpen(false);
          setIsWhyScoreModalOpen(true);
        }}
      />

      {currentFunnel && (
        <StageTransitionModal
          isOpen={isTransitionModalOpen}
          onClose={() => setIsTransitionModalOpen(false)}
          company={company}
          funnel={currentFunnel}
          targetStageId={selectedTargetStageId}
          onTransitionSuccess={() => {
            setIsTransitionModalOpen(false);
          }}
        />
      )}

      {/* Modal de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Empresa"
        description={`Tem certeza que deseja remover ${company.name}? Todas as notas e atividades serão excluídas.`}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleDeleteConfirm} className="bg-rose-600 hover:bg-rose-700 text-white">
              Confirmar Exclusão
            </Button>
          </div>
        }
      >
        <div className="py-2 text-xs text-zinc-600 dark:text-zinc-400">
          Esta ação é irreversível e remove o lead de todas as esteiras de prospecção.
        </div>
      </Modal>
    </div>
  );
};
