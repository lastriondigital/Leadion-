import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useLeadion } from '../../context/LeadionContext';
import { 
  Company, 
  CompanyFunnelStage, 
  CompanyResponsible, 
  CompanyContact,
  CompanySocials 
} from '../../core/types/company';
import { 
  Building2, 
  Phone, 
  Globe, 
  Share2, 
  UserCheck, 
  Briefcase, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Check, 
  MapPin,
  Sparkles,
  ArrowRight,
  Layers,
  MessageSquare,
  CheckCircle2,
  Sliders,
  ExternalLink
} from 'lucide-react';

const COUNTRY_OPTIONS = [
  { value: 'Moçambique', label: 'Moçambique (MT)' },
  { value: 'Portugal', label: 'Portugal (€)' },
  { value: 'Brasil', label: 'Brasil (R$)' },
  { value: 'Angola', label: 'Angola (Kz)' },
  { value: 'Estados Unidos', label: 'Estados Unidos ($)' },
  { value: 'Reino Unido', label: 'Reino Unido (£)' },
  { value: 'África do Sul', label: 'África do Sul (R)' },
  { value: 'Espanha', label: 'Espanha (€)' },
  { value: 'Cabo Verde', label: 'Cabo Verde (Esc)' },
  { value: 'Outro', label: 'Outro País' },
];

const FUNNEL_STAGE_OPTIONS: { value: CompanyFunnelStage; label: string }[] = [
  { value: 'prospeccao', label: 'Prospecção' },
  { value: 'contato_feito', label: 'Contato Feito' },
  { value: 'qualificacao', label: 'Qualificação' },
  { value: 'reuniao_agendada', label: 'Reunião Agendada' },
  { value: 'proposta', label: 'Proposta Apresentada' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'cliente', label: 'Cliente Conquistado' },
  { value: 'desqualificado', label: 'Desqualificado' },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: 'B2B', label: 'B2B (Serviços e Soluções Corporativas)' },
  { value: 'B2C', label: 'B2C (Consumidor Final)' },
  { value: 'B2B2C', label: 'B2B2C' },
  { value: 'Franquia', label: 'Rede / Franquia' },
  { value: 'Indústria', label: 'Indústria / Manufatura' },
  { value: 'Distribuidora', label: 'Distribuidora / Atacado' },
  { value: 'Consultoria', label: 'Consultoria / Assessoria' },
];

const SIZE_OPTIONS = [
  { value: '1-10 colaboradores', label: '1 - 10 colaboradores (Pequeno)' },
  { value: '11-50 colaboradores', label: '11 - 50 colaboradores (Médio PME)' },
  { value: '51-200 colaboradores', label: '51 - 200 colaboradores (Mid-Market)' },
  { value: '201-500 colaboradores', label: '201 - 500 colaboradores (Grande)' },
  { value: '500+ colaboradores', label: 'Mais de 500 colaboradores (Enterprise)' },
];

const LEAD_SOURCE_OPTIONS = [
  { value: 'Outbound Ativo', label: 'Outbound Ativo (Radar Leadion)' },
  { value: 'Google Maps / GMB', label: 'Google Maps / Local Search' },
  { value: 'Instagram / Redes', label: 'Instagram / Redes Sociais' },
  { value: 'LinkedIn Sales Navigator', label: 'LinkedIn / Sales Nav' },
  { value: 'Indicação Comercial', label: 'Indicação / Parceiro' },
  { value: 'Inbound / Site', label: 'Inbound / Formulário' },
  { value: 'Eventos / Feiras', label: 'Eventos / Feiras' },
  { value: 'Base Legada', label: 'Base Legada de Contatos' },
];

export const CompanyFormModal: React.FC = () => {
  const {
    isNewCompanyModalOpen,
    setIsNewCompanyModalOpen,
    editingCompany,
    setEditingCompany,
    addCompany,
    updateCompany,
    setSelectedCompany,
    setActiveNav,
    checkCompanyDuplicate,
    services,
    funnels,
  } = useLeadion();

  const isEditing = Boolean(editingCompany);

  // Estado de sucesso pós-registro
  const [createdCompany, setCreatedCompany] = useState<Company | null>(null);
  const [isSuccessState, setIsSuccessState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab navigation no modo de edição completa
  const [formTab, setFormTab] = useState<'empresa' | 'contatos' | 'redes' | 'responsaveis' | 'comercial'>('empresa');

  // Campos Prioritários (Fluxo Ágil)
  const [name, setName] = useState('');
  const [country, setCountry] = useState('Moçambique');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(false);

  // Campos Complementares
  const [niche, setNiche] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');

  // Redes Sociais
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [googleBusiness, setGoogleBusiness] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [otherSocial, setOtherSocial] = useState('');

  // Responsáveis / Contatos
  const [responsibles, setResponsibles] = useState<CompanyResponsible[]>([
    {
      id: 'resp-init-1',
      name: '',
      role: '',
      phone: '',
      whatsapp: '',
      email: '',
      notes: '',
      isPrimary: true,
      isDecisionMaker: false,
    }
  ]);

  // Informações Comerciais
  const [unitsCount, setUnitsCount] = useState<number>(1);
  const [businessType, setBusinessType] = useState('B2B');
  const [size, setSize] = useState('11-50 colaboradores');
  const [leadSource, setLeadSource] = useState('Outbound Ativo');
  const [commercialNotes, setCommercialNotes] = useState('');
  const [funnelStage, setFunnelStage] = useState<CompanyFunnelStage>('prospeccao');

  // Sincroniza estado ao abrir para edição ou criar nova
  useEffect(() => {
    setIsSuccessState(false);
    setCreatedCompany(null);

    if (editingCompany) {
      setName(editingCompany.name || '');
      setNiche(editingCompany.niche || '');
      setCountry(editingCompany.country || 'Moçambique');
      setState(editingCompany.state || '');
      setCity(editingCompany.city || '');
      setAddress(editingCompany.address || '');
      setWebsite(editingCompany.website || '');
      setPhone(editingCompany.phone || '');
      setWhatsapp(editingCompany.whatsapp || '');
      setEmail(editingCompany.email || '');

      setInstagram(editingCompany.socials?.instagram || '');
      setFacebook(editingCompany.socials?.facebook || '');
      setGoogleBusiness(editingCompany.socials?.gmb || editingCompany.socials?.googleBusiness || '');
      setLinkedin(editingCompany.socials?.linkedin || '');
      setTiktok(editingCompany.socials?.tiktok || '');
      setOtherSocial(editingCompany.socials?.other || '');

      setResponsibles(editingCompany.responsibles?.length ? editingCompany.responsibles : [
        {
          id: 'resp-init-1',
          name: '',
          role: '',
          phone: '',
          whatsapp: '',
          email: '',
          notes: '',
          isPrimary: true,
          isDecisionMaker: false,
        }
      ]);

      setUnitsCount(editingCompany.unitsCount || 1);
      setBusinessType(editingCompany.businessType || 'B2B');
      setSize(editingCompany.size || '11-50 colaboradores');
      setLeadSource(editingCompany.leadSource || 'Outbound Ativo');
      setCommercialNotes(editingCompany.commercialNotes || '');
      setFunnelStage(editingCompany.funnelStage || 'prospeccao');
    } else {
      // Reset limpo para novo registro
      setName('');
      setCountry('Moçambique');
      setState('');
      setCity('');
      setPhone('');
      setWhatsapp('');
      setSameAsPhone(false);
      setNiche('');
      setAddress('');
      setWebsite('');
      setEmail('');
      setInstagram('');
      setFacebook('');
      setGoogleBusiness('');
      setLinkedin('');
      setTiktok('');
      setOtherSocial('');
      setResponsibles([
        {
          id: 'resp-init-1',
          name: '',
          role: '',
          phone: '',
          whatsapp: '',
          email: '',
          notes: '',
          isPrimary: true,
          isDecisionMaker: false,
        }
      ]);
      setUnitsCount(1);
      setBusinessType('B2B');
      setSize('11-50 colaboradores');
      setLeadSource('Outbound Ativo');
      setCommercialNotes('');
      setFunnelStage('prospeccao');
      setFormTab('empresa');
    }
  }, [editingCompany, isNewCompanyModalOpen]);

  // Alinhamento automático WhatsApp = Telefone quando checkbox ativada
  useEffect(() => {
    if (sameAsPhone && phone.trim()) {
      setWhatsapp(phone.trim());
    }
  }, [sameAsPhone, phone]);

  // Checagem de duplicidade em tempo real
  const duplicateWarning = useMemo(() => {
    if (!name.trim() && !phone.trim() && !whatsapp.trim()) return null;
    return checkCompanyDuplicate(name, website, email, phone || whatsapp);
  }, [name, website, email, phone, whatsapp, checkCompanyDuplicate]);

  // Validação: Nome + País + (Telefone OU WhatsApp)
  const hasValidContactChannel = Boolean(phone.trim().length > 0 || whatsapp.trim().length > 0);
  const isValidToRegister = Boolean(name.trim().length > 0 && country.trim().length > 0 && hasValidContactChannel);

  const handleClose = () => {
    setIsNewCompanyModalOpen(false);
    setEditingCompany(null);
    setIsSuccessState(false);
    setCreatedCompany(null);
  };

  // Submissão do Registro Ágil ou Edição Completa
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!country.trim()) return;
    if (!hasValidContactChannel) return;

    setIsSubmitting(true);

    const parts = [city.trim(), state.trim()].filter(Boolean);
    const formattedLocation = parts.length > 0 
      ? (country.trim() ? `${parts.join(', ')} - ${country.trim()}` : parts.join(', ')) 
      : (country.trim() || '');

    const socialsPayload: CompanySocials = {
      instagram: instagram.trim() || undefined,
      facebook: facebook.trim() || undefined,
      gmb: googleBusiness.trim() || undefined,
      googleBusiness: googleBusiness.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      tiktok: tiktok.trim() || undefined,
      other: otherSocial.trim() || undefined,
    };

    const cleanResponsibles = responsibles
      .filter((r) => r.name.trim().length > 0)
      .map((r, idx) => ({
        ...r,
        id: r.id && !r.id.startsWith('resp-init') 
          ? r.id 
          : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `resp-${Date.now()}-${idx}`),
        isPrimary: r.isPrimary ?? idx === 0,
      }));

    if (isEditing && editingCompany) {
      const payload: Partial<Company> = {
        name: name.trim(),
        niche: niche.trim() || editingCompany.niche || 'Geral B2B',
        country: country.trim(),
        city: city.trim(),
        state: state.trim(),
        location: formattedLocation,
        address: address.trim(),
        website: website.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim(),
        socials: socialsPayload,
        responsibles: cleanResponsibles,
        unitsCount: Number(unitsCount) || 1,
        businessType,
        size,
        leadSource,
        commercialNotes: commercialNotes.trim(),
        funnelStage,
      };

      updateCompany(editingCompany.id, payload);
      setIsSubmitting(false);
      handleClose();
    } else {
      // REGISTRO DE NOVA EMPRESA (PRINCÍPIO: EMPRESA REGISTRADA ≠ QUALIFICADA)
      // Não atribui score, nem serviços, nem funil automático, nem próxima ação fictícia!
      const payload: Partial<Company> = {
        name: name.trim(),
        niche: niche.trim() || 'Geral B2B',
        country: country.trim(),
        city: city.trim(),
        state: state.trim(),
        location: formattedLocation,
        address: address.trim(),
        website: website.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim(),
        socials: socialsPayload,
        responsibles: cleanResponsibles,
        unitsCount: Number(unitsCount) || 1,
        businessType,
        size,
        leadSource,
        commercialNotes: commercialNotes.trim(),
        funnelStage: 'prospeccao',
        score: null,                         // Sem score prévio
        qualificationStatus: 'NOT_STARTED',  // Qualificação não iniciada
        associatedServices: [],              // Sem serviço automático
        companyServices: [],                 // Relações limpas
        positivePoints: [],
        negativePoints: [],
        commercialContext: {},
      };

      const res = await addCompany(payload);
      setIsSubmitting(false);

      if (res.success && res.company) {
        setCreatedCompany(res.company);
        setIsSuccessState(true);
      } else {
        handleClose();
      }
    }
  };

  // Ações imediatas pós-registro
  const handleViewCompany = () => {
    if (createdCompany) {
      setSelectedCompany(createdCompany);
      setActiveNav('companies');
    }
    handleClose();
  };

  const handleAddService = () => {
    if (createdCompany) {
      setSelectedCompany(createdCompany);
      setActiveNav('companies');
    }
    handleClose();
  };

  const handleEnrichData = () => {
    if (createdCompany) {
      setSelectedCompany(createdCompany);
      setActiveNav('companies');
    }
    handleClose();
  };

  // Se estiver na tela de sucesso pós-registro:
  if (isSuccessState && createdCompany) {
    return (
      <Modal
        isOpen={isNewCompanyModalOpen}
        onClose={handleClose}
        title="Empresa registrada."
        description="A empresa foi adicionada ao Leadion. Você decide quando começar o enriquecimento ou a qualificação."
        maxWidth="lg"
      >
        <div className="space-y-6 py-2">
          {/* Card de Confirmação Limpo */}
          <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                {createdCompany.name}
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Registrada com sucesso em <strong className="font-semibold">{createdCompany.country}</strong>
                {createdCompany.city ? ` · ${createdCompany.city}` : ''}.
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-emerald-700 dark:text-emerald-400">
                <span className="font-mono">{createdCompany.whatsapp || createdCompany.phone}</span>
                <span>•</span>
                <span className="bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-[11px] font-semibold">
                  Aguardando qualificação
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
            <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" />
              Princípio Leadion: Nenhum dado fictício gerado
            </div>
            <p>
              Nenhum score inventado ou tarefa falsa foi criada para esta empresa. O restante dos dados e o serviço comercial podem ser adicionados agora ou quando desejar.
            </p>
          </div>

          {/* 3 Opções Claras Imediatas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={handleViewCompany}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161922] hover:border-[#635BFF] hover:shadow-md transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <Building2 className="w-5 h-5 text-[#635BFF] mb-2" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#635BFF] transition-colors">
                  Ver Empresa
                </h4>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Abrir a ficha completa e visão geral da empresa.
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#635BFF] flex items-center gap-1 mt-3">
                Abrir <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>

            <button
              type="button"
              onClick={handleAddService}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161922] hover:border-[#635BFF] hover:shadow-md transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <Briefcase className="w-5 h-5 text-[#635BFF] mb-2" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#635BFF] transition-colors">
                  Adicionar Serviço
                </h4>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Vincular oferta comercial (Landing Page, Website, etc.) e precificação.
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#635BFF] flex items-center gap-1 mt-3">
                Selecionar <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>

            <button
              type="button"
              onClick={handleEnrichData}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161922] hover:border-[#635BFF] hover:shadow-md transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <Share2 className="w-5 h-5 text-[#635BFF] mb-2" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#635BFF] transition-colors">
                  Enriquecer Dados
                </h4>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Adicionar website, GMB, Instagram, decisores ou endereço.
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#635BFF] flex items-center gap-1 mt-3">
                Completar <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // MODO 1: CADASTRO ÁGIL (QUANDO NÃO ESTIVER EM EDIÇÃO)
  if (!isEditing) {
    return (
      <Modal
        isOpen={isNewCompanyModalOpen}
        onClose={handleClose}
        title="Registrar Empresa"
        description="Preencha os dados prioritários para criar o lead. Serviços, presença digital e qualificação podem ser completados depois."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-zinc-500">
              * Obrigatórios: <span className="font-semibold text-zinc-700 dark:text-zinc-300">Nome</span>, <span className="font-semibold text-zinc-700 dark:text-zinc-300">País</span> e pelo menos <span className="font-semibold text-zinc-700 dark:text-zinc-300">1 contato (Telefone ou WhatsApp)</span>.
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={!isValidToRegister || isSubmitting}
                icon={<Check className="w-3.5 h-3.5" />}
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Empresa'}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5 py-1">
          {/* Alerta de Duplicata em tempo real */}
          {duplicateWarning?.isDuplicate && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Atenção:</span> Possível lead já existente por {duplicateWarning.matchedField}:{' '}
                <span className="font-semibold underline">"{duplicateWarning.matchedValue}"</span>.
              </div>
            </div>
          )}

          {/* PAINEL DE CAMPOS PRIORITÁRIOS COM DESTAQUE VISUAL */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            
            {/* 1. Nome da Empresa */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#635BFF]" />
                  <span>1. Nome da empresa</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#635BFF] bg-[#635BFF]/10 px-2 py-0.5 rounded">
                  Prioritário
                </span>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Clínica Aurora, Maputo Tech, Veloce..."
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 font-medium"
              />
            </div>

            {/* 2. País */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#635BFF]" />
                  <span>2. País</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[10px] text-zinc-400">Usado para precificação e moeda</span>
              </div>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-sm text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3 & 4. Estado/Província e Região/Cidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>3. Estado / Província</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">Recomendado</span>
                </div>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Ex: Maputo Cidade, SP, Luanda..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#635BFF]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>4. Região / Cidade</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">Recomendado</span>
                </div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Maputo, Matola, São Paulo, Porto..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#635BFF]"
                />
              </div>
            </div>

            {/* 5 & 6. Telefone e WhatsApp (Pelo menos um obrigatório) */}
            <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#635BFF]" />
                  <span>Canais de Contato</span>
                  <span className="text-rose-500 font-bold">*</span>
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  hasValidContactChannel 
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                }`}>
                  {hasValidContactChannel ? 'Contato Válido' : 'Preencha Telefone OU WhatsApp'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    5. Telefone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: +258 84 123 4567 ou (11) 98765-4321"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#635BFF]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-emerald-500" />
                      <span>6. WhatsApp</span>
                    </label>
                    {phone.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setSameAsPhone(!sameAsPhone);
                          if (!sameAsPhone) setWhatsapp(phone.trim());
                        }}
                        className="text-[10px] text-[#635BFF] hover:underline cursor-pointer"
                      >
                        {sameAsPhone ? 'Desvincular' : 'Mesmo que o telefone'}
                      </button>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => {
                      setWhatsapp(e.target.value);
                      if (sameAsPhone) setSameAsPhone(false);
                    }}
                    placeholder="Ex: +258 84 123 4567 ou (11) 98765-4321"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#635BFF]"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Dica de Enriquecimento */}
          <div className="flex items-center justify-between px-1 text-xs text-zinc-500">
            <span>Redes sociais, decisores e contexto comercial podem ser adicionados após o registro.</span>
          </div>
        </form>
      </Modal>
    );
  }

  // MODO 2: EDIÇÃO COMPLETA DE EMPRESA EXISTENTE
  return (
    <Modal
      isOpen={isNewCompanyModalOpen}
      onClose={handleClose}
      title={`Editar Empresa: ${editingCompany?.name}`}
      description="Edite informações cadastrais, contatos, redes sociais e notas estratégicas."
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim()}
            icon={<Check className="w-3.5 h-3.5" />}
          >
            Salvar Alterações
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          {[
            { id: 'empresa', label: 'Dados Básicos', icon: <Building2 className="w-3.5 h-3.5" /> },
            { id: 'contatos', label: 'Canais de Contato', icon: <Phone className="w-3.5 h-3.5" /> },
            { id: 'redes', label: 'Redes & Web', icon: <Globe className="w-3.5 h-3.5" /> },
            { id: 'responsaveis', label: 'Decisores', icon: <UserCheck className="w-3.5 h-3.5" /> },
            { id: 'comercial', label: 'Comercial', icon: <Briefcase className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFormTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                formTab === tab.id
                  ? 'bg-[#635BFF] text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Dados Básicos */}
        {formTab === 'empresa' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs font-medium focus:outline-none focus:border-[#635BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  País *
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs font-medium focus:outline-none focus:border-[#635BFF]"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nicho / Segmento
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Ex: Clínica Odontológica"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs focus:outline-none focus:border-[#635BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Estado / Província
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs focus:outline-none focus:border-[#635BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs focus:outline-none focus:border-[#635BFF]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. 24 de Julho, 1234, Maputo"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs focus:outline-none focus:border-[#635BFF]"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Contatos */}
        {formTab === 'contatos' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Telefone Principal
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs focus:outline-none focus:border-[#635BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs focus:outline-none focus:border-[#635BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  E-mail Geral
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs focus:outline-none focus:border-[#635BFF]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Redes & Presença Digital */}
        {formTab === 'redes' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Website / Domínio
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://exemplo.co.mz"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs focus:outline-none focus:border-[#635BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Google Meu Negócio (GMB)
                </label>
                <input
                  type="text"
                  value={googleBusiness}
                  onChange={(e) => setGoogleBusiness(e.target.value)}
                  placeholder="Link da ficha no Google Maps"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs focus:outline-none focus:border-[#635BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Instagram (@usuario ou link)
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@clinicaaurora"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs focus:outline-none focus:border-[#635BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  LinkedIn
                </label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/company/..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs focus:outline-none focus:border-[#635BFF]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Responsáveis / Decisores */}
        {formTab === 'responsaveis' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Lista de Contatos e Decisores
              </span>
              <button
                type="button"
                onClick={() => setResponsibles((prev) => [
                  ...prev,
                  {
                    id: `resp-${Date.now()}`,
                    name: '',
                    role: '',
                    phone: '',
                    whatsapp: '',
                    email: '',
                    isPrimary: false,
                    isDecisionMaker: false,
                  }
                ])}
                className="text-xs text-[#635BFF] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Contato
              </button>
            </div>

            {responsibles.map((r, idx) => (
              <div key={r.id || idx} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                    Contato #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={r.isDecisionMaker || false}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setResponsibles((prev) => prev.map((item, i) => i === idx ? { ...item, isDecisionMaker: val } : item));
                        }}
                        className="rounded border-zinc-300 text-[#635BFF]"
                      />
                      <span>Decisor</span>
                    </label>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={r.isPrimary || false}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setResponsibles((prev) => prev.map((item, i) => i === idx ? { ...item, isPrimary: val } : { ...item, isPrimary: false }));
                        }}
                        className="rounded border-zinc-300 text-[#635BFF]"
                      />
                      <span>Principal</span>
                    </label>
                    {responsibles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setResponsibles((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResponsibles((prev) => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                    }}
                    placeholder="Nome completo"
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                  />
                  <input
                    type="text"
                    value={r.role}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResponsibles((prev) => prev.map((item, i) => i === idx ? { ...item, role: val } : item));
                    }}
                    placeholder="Cargo (ex: Diretor Clínico, Sócio)"
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                  />
                  <input
                    type="tel"
                    value={r.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResponsibles((prev) => prev.map((item, i) => i === idx ? { ...item, phone: val } : item));
                    }}
                    placeholder="Telefone / Celular"
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                  />
                  <input
                    type="tel"
                    value={r.whatsapp}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResponsibles((prev) => prev.map((item, i) => i === idx ? { ...item, whatsapp: val } : item));
                    }}
                    placeholder="WhatsApp direto"
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Comercial */}
        {formTab === 'comercial' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Tipo de Negócio
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                >
                  {BUSINESS_TYPE_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Tamanho / Colaboradores
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
                >
                  {SIZE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Notas Comerciais
              </label>
              <textarea
                value={commercialNotes}
                onChange={(e) => setCommercialNotes(e.target.value)}
                rows={3}
                placeholder="Observações estratégicas sobre o cliente..."
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#161922] text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
