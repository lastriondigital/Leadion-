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
  Info
} from 'lucide-react';

const FUNNEL_STAGE_OPTIONS: { value: CompanyFunnelStage; label: string }[] = [
  { value: 'prospeccao', label: 'Prospecção (Fila Ativa)' },
  { value: 'contato_feito', label: 'Contato Feito' },
  { value: 'qualificacao', label: 'Qualificação' },
  { value: 'reuniao_agendada', label: 'Reunião Agendada' },
  { value: 'proposta', label: 'Proposta Apresentada' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'cliente', label: 'Cliente Conquistado' },
  { value: 'desqualificado', label: 'Desqualificado' },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: 'B2B', label: 'B2B (Serviços e Soluções)' },
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
  { value: 'LinkedIn Sales Navigator', label: 'LinkedIn / Sales Nav' },
  { value: 'Google Maps / GMB', label: 'Google Maps / Local Search' },
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
    checkCompanyDuplicate,
    services,
    funnels,
  } = useLeadion();

  const isEditing = Boolean(editingCompany);

  // Tab navigation inside modal
  const [formTab, setFormTab] = useState<'empresa' | 'contatos' | 'redes' | 'responsaveis' | 'comercial'>('empresa');

  // Form Fields
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [state, setState] = useState('SP');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');

  // Primary Contacts
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Additional Contacts
  const [additionalContacts, setAdditionalContacts] = useState<CompanyContact[]>([]);

  // Socials
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [googleBusiness, setGoogleBusiness] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [otherSocial, setOtherSocial] = useState('');

  // Responsibles
  const [responsibles, setResponsibles] = useState<CompanyResponsible[]>([
    {
      id: `resp-init-1`,
      name: '',
      role: '',
      phone: '',
      whatsapp: '',
      email: '',
      notes: '',
      isPrimary: true,
    }
  ]);

  // Commercial Info & Funnels
  const [unitsCount, setUnitsCount] = useState<number>(1);
  const [businessType, setBusinessType] = useState('B2B');
  const [size, setSize] = useState('11-50 colaboradores');
  const [leadSource, setLeadSource] = useState('Outbound Ativo');
  const [commercialNotes, setCommercialNotes] = useState('');
  const [funnelId, setFunnelId] = useState<string>('');
  const [funnelStageId, setFunnelStageId] = useState<string>('');
  const [funnelStage, setFunnelStage] = useState<CompanyFunnelStage>('prospeccao');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [score, setScore] = useState<number>(85);

  // Sync with editingCompany if open for edit
  useEffect(() => {
    if (editingCompany) {
      setName(editingCompany.name || '');
      setNiche(editingCompany.niche || '');
      setCountry(editingCompany.country || 'Brasil');
      setState(editingCompany.state || 'SP');
      setCity(editingCompany.city || '');
      setLocation(editingCompany.location || '');
      setAddress(editingCompany.address || '');
      setWebsite(editingCompany.website || '');

      setPhone(editingCompany.phone || '');
      setWhatsapp(editingCompany.whatsapp || '');
      setEmail(editingCompany.email || '');

      setAdditionalContacts(editingCompany.additionalContacts || []);

      setInstagram(editingCompany.socials?.instagram || '');
      setFacebook(editingCompany.socials?.facebook || '');
      setGoogleBusiness(editingCompany.socials?.googleBusiness || '');
      setLinkedin(editingCompany.socials?.linkedin || '');
      setTiktok(editingCompany.socials?.tiktok || '');
      setOtherSocial(editingCompany.socials?.other || '');

      setResponsibles(editingCompany.responsibles?.length ? editingCompany.responsibles : [
        {
          id: `resp-init-1`,
          name: '',
          role: '',
          phone: '',
          whatsapp: '',
          email: '',
          notes: '',
          isPrimary: true,
        }
      ]);

      setUnitsCount(editingCompany.unitsCount || 1);
      setBusinessType(editingCompany.businessType || 'B2B');
      setSize(editingCompany.size || '11-50 colaboradores');
      setLeadSource(editingCompany.leadSource || 'Outbound Ativo');
      setCommercialNotes(editingCompany.commercialNotes || '');
      const defaultF = funnels.find((f) => f.isDefault) || funnels[0];
      setFunnelId(editingCompany.funnelId || defaultF?.id || '');
      setFunnelStageId(editingCompany.funnelStageId || defaultF?.stages[0]?.id || '');
      setFunnelStage(editingCompany.funnelStage || 'prospeccao');
      setSelectedServices(editingCompany.associatedServices || []);
      setScore(editingCompany.score || 85);
    } else {
      // Reset form
      setName('');
      setNiche('');
      setCountry('Brasil');
      setState('SP');
      setCity('');
      setLocation('');
      setAddress('');
      setWebsite('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setAdditionalContacts([]);
      setInstagram('');
      setFacebook('');
      setGoogleBusiness('');
      setLinkedin('');
      setTiktok('');
      setOtherSocial('');
      setResponsibles([
        {
          id: `resp-init-1`,
          name: '',
          role: '',
          phone: '',
          whatsapp: '',
          email: '',
          notes: '',
          isPrimary: true,
        }
      ]);
      setUnitsCount(1);
      setBusinessType('B2B');
      setSize('11-50 colaboradores');
      setLeadSource('Outbound Ativo');
      setCommercialNotes('');
      const defaultF = funnels.find((f) => f.isDefault) || funnels[0];
      const initialService = services[0];
      const initialFunnelId = initialService?.defaultFunnelId || defaultF?.id || '';
      const matchedF = funnels.find((f) => f.id === initialFunnelId) || defaultF;
      setFunnelId(initialFunnelId);
      setFunnelStageId(initialService?.defaultFunnelStageId || matchedF?.stages[0]?.id || '');
      setFunnelStage('prospeccao');
      setSelectedServices(initialService ? [initialService.id] : []);
      setScore(85);
      setFormTab('empresa');
    }
  }, [editingCompany, isNewCompanyModalOpen, services, funnels]);

  // Real-time Duplicate Check
  const duplicateWarning = useMemo(() => {
    if (!name.trim() && !website.trim() && !email.trim()) return null;
    const result = checkCompanyDuplicate(
      name,
      website,
      email,
      phone,
      editingCompany ? editingCompany.id : undefined
    );
    return result.isDuplicate ? result : null;
  }, [name, website, email, phone, checkCompanyDuplicate, editingCompany]);

  // Responsible Handlers
  const handleAddResponsible = () => {
    setResponsibles((prev) => [
      ...prev,
      {
        id: `resp-${Date.now()}`,
        name: '',
        role: '',
        phone: '',
        whatsapp: '',
        email: '',
        notes: '',
        isPrimary: prev.length === 0,
      }
    ]);
  };

  const handleUpdateResponsible = (index: number, field: keyof CompanyResponsible, value: any) => {
    setResponsibles((prev) => {
      const copy = [...prev];
      if (field === 'isPrimary' && value === true) {
        // Only one primary
        copy.forEach((r, i) => {
          r.isPrimary = i === index;
        });
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const handleRemoveResponsible = (index: number) => {
    if (responsibles.length <= 1) return;
    setResponsibles((prev) => {
      const copy = prev.filter((_, i) => i !== index);
      // Ensure at least one primary
      if (!copy.some((r) => r.isPrimary) && copy.length > 0) {
        copy[0].isPrimary = true;
      }
      return copy;
    });
  };

  // Additional Contacts Handlers
  const handleAddAdditionalContact = () => {
    setAdditionalContacts((prev) => [
      ...prev,
      {
        id: `cont-${Date.now()}`,
        name: '',
        role: '',
        phone: '',
        whatsapp: '',
        email: '',
        preferredChannel: 'whatsapp',
      }
    ]);
  };

  const handleUpdateAdditionalContact = (index: number, field: keyof CompanyContact, value: any) => {
    setAdditionalContacts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveAdditionalContact = (index: number) => {
    setAdditionalContacts((prev) => prev.filter((_, i) => i !== index));
  };

  // Service toggle
  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const isRemoving = prev.includes(serviceId);
      if (isRemoving) {
        return prev.filter((id) => id !== serviceId);
      } else {
        // Automatically select the service's default funnel if available
        const matchedService = services.find((s) => s.id === serviceId);
        if (matchedService?.defaultFunnelId) {
          setFunnelId(matchedService.defaultFunnelId);
          const matchedFunnel = funnels.find((f) => f.id === matchedService.defaultFunnelId);
          if (matchedService.defaultFunnelStageId) {
            setFunnelStageId(matchedService.defaultFunnelStageId);
          } else if (matchedFunnel?.stages[0]) {
            setFunnelStageId(matchedFunnel.stages[0].id);
          }
        }
        return [...prev, serviceId];
      }
    });
  };

  const handleClose = () => {
    setIsNewCompanyModalOpen(false);
    setEditingCompany(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedLocation = location.trim() || `${city.trim() || 'São Paulo'}, ${state.trim() || 'SP'} - ${country.trim() || 'Brasil'}`;

    const socialsPayload: CompanySocials = {
      instagram: instagram.trim() || undefined,
      facebook: facebook.trim() || undefined,
      googleBusiness: googleBusiness.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      tiktok: tiktok.trim() || undefined,
      other: otherSocial.trim() || undefined,
    };

    // Filter empty responsibles
    const cleanResponsibles = responsibles
      .filter((r) => r.name.trim().length > 0)
      .map((r, idx) => ({
        ...r,
        isPrimary: idx === 0 ? true : r.isPrimary,
      }));

    if (cleanResponsibles.length === 0) {
      cleanResponsibles.push({
        id: `resp-${Date.now()}`,
        name: 'Decisor Responsável',
        role: 'Diretor / Sócio',
        phone: phone.trim() || whatsapp.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim(),
        notes: '',
        isPrimary: true,
      });
    }

    const chosenFunnel = funnels.find((f) => f.id === funnelId);
    const chosenStage = chosenFunnel?.stages.find((s) => s.id === funnelStageId);

    const payload: Partial<Company> = {
      name: name.trim(),
      niche: niche.trim() || 'Geral B2B',
      country: country.trim() || 'Brasil',
      city: city.trim() || 'São Paulo',
      state: state.trim() || 'SP',
      location: formattedLocation,
      address: address.trim(),
      website: website.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      email: email.trim(),
      additionalContacts,
      socials: socialsPayload,
      responsibles: cleanResponsibles,
      unitsCount: Number(unitsCount) || 1,
      businessType,
      size,
      leadSource,
      commercialNotes: commercialNotes.trim(),
      funnelId: funnelId || undefined,
      funnelStageId: funnelStageId || undefined,
      funnelStageName: chosenStage?.name || undefined,
      funnelStage,
      score: Number(score) || 85,
      associatedServices: selectedServices,
      primaryServiceId: selectedServices[0] || undefined,
    };

    if (isEditing && editingCompany) {
      updateCompany(editingCompany.id, payload);
    } else {
      addCompany(payload);
    }

    handleClose();
  };

  return (
    <Modal
      isOpen={isNewCompanyModalOpen}
      onClose={handleClose}
      title={isEditing ? `Editar Empresa: ${editingCompany?.name}` : 'Cadastrar Nova Empresa'}
      description="Cadastre todas as informações cadastrais, canais de contato, decisores e inteligência comercial para prospecção ativa."
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">
              * Campos com nome e nicho são recomendados para priorização inteligente.
            </span>
          </div>
          <div className="flex items-center gap-2">
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
              {isEditing ? 'Salvar' : 'Adicionar empresa'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Duplicate warning alert */}
        {duplicateWarning && (
          <div className="p-3.5 rounded-[12px] bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold block">Aviso de Possível Duplicidade:</span>
              Já existe a empresa <strong>"{duplicateWarning.matchedValue}"</strong> cadastrada com coincidência em <em>{duplicateWarning.matchedField}</em>.
            </div>
          </div>
        )}

        {/* Form Tab Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-[12px] bg-zinc-100 dark:bg-[#12151D] border border-[#E6E8EC]/80 dark:border-[#232836] overflow-x-auto">
          <button
            type="button"
            onClick={() => setFormTab('empresa')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              formTab === 'empresa'
                ? 'bg-white dark:bg-[#1E222E] text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#635BFF]" />
            Empresa
          </button>
          <button
            type="button"
            onClick={() => setFormTab('contatos')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              formTab === 'contatos'
                ? 'bg-white dark:bg-[#1E222E] text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-emerald-500" />
            Contatos ({1 + additionalContacts.length})
          </button>
          <button
            type="button"
            onClick={() => setFormTab('redes')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              formTab === 'redes'
                ? 'bg-white dark:bg-[#1E222E] text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-sky-500" />
            Redes Sociais
          </button>
          <button
            type="button"
            onClick={() => setFormTab('responsaveis')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              formTab === 'responsaveis'
                ? 'bg-white dark:bg-[#1E222E] text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-500" />
            Responsáveis ({responsibles.length})
          </button>
          <button
            type="button"
            onClick={() => setFormTab('comercial')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              formTab === 'comercial'
                ? 'bg-white dark:bg-[#1E222E] text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
            Comercial & Funil
          </button>
        </div>

        {/* TAB 1: INFORMAÇÕES DA EMPRESA */}
        {formTab === 'empresa' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome da Empresa *"
                placeholder="Ex: OdontoClean Estética, NexaLog Transportes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Nicho / Segmento Comercial *"
                placeholder="Ex: Clínicas Odontológicas, Logística, Software B2B"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="País"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Brasil"
              />
              <Input
                label="Estado (UF)"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="SP, RJ, MG..."
              />
              <Input
                label="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo, Campinas..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Endereço Completo"
                placeholder="Rua, Número, Bairro, CEP ou Referência"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input
                label="Website Oficial"
                placeholder="https://suaempresa.com.br"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <Input
              label="Localização Resumida (Exibição nos Cards)"
              placeholder="Ex: São Paulo, SP - Brasil"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        )}

        {/* TAB 2: CONTACTOS */}
        {formTab === 'contatos' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="p-4 rounded-[14px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Canais Principais da Empresa
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Telefone Principal"
                  placeholder="(11) 3456-7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Input
                  label="WhatsApp Comercial"
                  placeholder="(11) 98765-4321"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
                <Input
                  label="E-mail Corporativo"
                  placeholder="contato@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Additional Contacts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Contatos Secundários ou Departamentos
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Recepção, financeiro, operações ou ramais adicionais da empresa.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAdditionalContact}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Adicionar Contato
                </Button>
              </div>

              {additionalContacts.length === 0 ? (
                <div className="p-4 rounded-[12px] border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
                  Nenhum contato secundário cadastrado. Clique no botão acima para adicionar ramais ou telefones alternativos.
                </div>
              ) : (
                <div className="space-y-3">
                  {additionalContacts.map((contact, idx) => (
                    <div
                      key={contact.id || idx}
                      className="p-3.5 rounded-[12px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#635BFF]">
                          Contato #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalContact(idx)}
                          className="text-rose-500 hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        <Input
                          label="Nome"
                          placeholder="Ex: Recepção Central"
                          value={contact.name}
                          onChange={(e) => handleUpdateAdditionalContact(idx, 'name', e.target.value)}
                        />
                        <Input
                          label="Cargo / Área"
                          placeholder="Ex: Administrativo"
                          value={contact.role || ''}
                          onChange={(e) => handleUpdateAdditionalContact(idx, 'role', e.target.value)}
                        />
                        <Input
                          label="Telefone / Whats"
                          placeholder="(11) 99999-9999"
                          value={contact.phone || ''}
                          onChange={(e) => handleUpdateAdditionalContact(idx, 'phone', e.target.value)}
                        />
                        <Input
                          label="E-mail"
                          placeholder="atendimento@empresa.com"
                          value={contact.email || ''}
                          onChange={(e) => handleUpdateAdditionalContact(idx, 'email', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REDES SOCIAIS */}
        {formTab === 'redes' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Links diretos para inteligência e prospecção rápida em redes e perfis públicos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Instagram"
                placeholder="https://instagram.com/empresa ou @empresa"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
              <Input
                label="LinkedIn (Página da Empresa)"
                placeholder="https://linkedin.com/company/empresa"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Google Business Profile (GMB / Google Maps)"
                placeholder="https://maps.google.com/?cid=... ou link da ficha"
                value={googleBusiness}
                onChange={(e) => setGoogleBusiness(e.target.value)}
              />
              <Input
                label="Facebook"
                placeholder="https://facebook.com/empresa"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="TikTok"
                placeholder="https://tiktok.com/@empresa"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
              />
              <Input
                label="Outro Link Relevante (Canal YouTube, Catálogo, etc.)"
                placeholder="https://..."
                value={otherSocial}
                onChange={(e) => setOtherSocial(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* TAB 4: RESPONSÁVEIS / DECISORES */}
        {formTab === 'responsaveis' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Decisores & Responsáveis Comerciais
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Mapeie sócios, diretores ou gerentes com quem as conversas e reuniões acontecerão.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddResponsible}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Adicionar Responsável
              </Button>
            </div>

            <div className="space-y-4">
              {responsibles.map((resp, idx) => (
                <div
                  key={resp.id || idx}
                  className={`p-4 rounded-[14px] border transition-all ${
                    resp.isPrimary
                      ? 'bg-[#635BFF]/5 border-[#635BFF]/40 shadow-xs'
                      : 'bg-white dark:bg-[#161922] border-[#E6E8EC] dark:border-[#232836]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Responsável #{idx + 1}
                      </span>
                      {resp.isPrimary && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#635BFF] text-white">
                          Decisor Principal
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {!resp.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleUpdateResponsible(idx, 'isPrimary', true)}
                          className="text-xs text-[#635BFF] hover:underline font-semibold cursor-pointer"
                        >
                          Definir como Principal
                        </button>
                      )}
                      {responsibles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveResponsible(idx)}
                          className="text-rose-500 hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <Input
                      label="Nome Completo *"
                      placeholder="Ex: Dr. Roberto Alencar"
                      value={resp.name}
                      onChange={(e) => handleUpdateResponsible(idx, 'name', e.target.value)}
                      required
                    />
                    <Input
                      label="Cargo / Função *"
                      placeholder="Ex: Sócio Diretor, Head Comercial"
                      value={resp.role}
                      onChange={(e) => handleUpdateResponsible(idx, 'role', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <Input
                      label="Telefone Direto"
                      placeholder="(11) 98765-4321"
                      value={resp.phone || ''}
                      onChange={(e) => handleUpdateResponsible(idx, 'phone', e.target.value)}
                    />
                    <Input
                      label="WhatsApp"
                      placeholder="(11) 98765-4321"
                      value={resp.whatsapp || ''}
                      onChange={(e) => handleUpdateResponsible(idx, 'whatsapp', e.target.value)}
                    />
                    <Input
                      label="E-mail Individual"
                      placeholder="roberto@empresa.com.br"
                      value={resp.email || ''}
                      onChange={(e) => handleUpdateResponsible(idx, 'email', e.target.value)}
                    />
                  </div>

                  <Input
                    label="Observações sobre o Perfil do Decisor"
                    placeholder="Ex: Foco total em ROI, perfil analítico, prefere mensagens curtas no WhatsApp pela manhã."
                    value={resp.notes || ''}
                    onChange={(e) => handleUpdateResponsible(idx, 'notes', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: INFORMAÇÕES COMERCIAIS */}
        {formTab === 'comercial' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Número de Unidades
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  className="w-full h-9 px-3 rounded-[9px] border border-[#E6E8EC] dark:border-[#232836] bg-white dark:bg-[#12151D] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#635BFF]"
                  value={unitsCount}
                  onChange={(e) => setUnitsCount(parseInt(e.target.value) || 1)}
                />
              </div>

              <Select
                label="Tipo de Negócio"
                options={BUSINESS_TYPE_OPTIONS}
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              />

              <Select
                label="Porte / Tamanho"
                options={SIZE_OPTIONS}
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Fonte do Lead"
                options={LEAD_SOURCE_OPTIONS}
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Funil Atribuído
                </label>
                <select
                  value={funnelId}
                  onChange={(e) => {
                    const newFId = e.target.value;
                    setFunnelId(newFId);
                    const selectedF = funnels.find((f) => f.id === newFId);
                    if (selectedF && selectedF.stages.length > 0) {
                      setFunnelStageId(selectedF.stages[0].id);
                    }
                  }}
                  className="w-full h-9 px-3 rounded-[9px] border border-[#E6E8EC] dark:border-[#232836] bg-white dark:bg-[#12151D] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#635BFF]"
                >
                  {funnels.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.isDefault ? '(Padrão)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Etapa do Funil
                </label>
                <select
                  value={funnelStageId}
                  onChange={(e) => setFunnelStageId(e.target.value)}
                  className="w-full h-9 px-3 rounded-[9px] border border-[#E6E8EC] dark:border-[#232836] bg-white dark:bg-[#12151D] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#635BFF]"
                >
                  {(funnels.find((f) => f.id === funnelId)?.stages || []).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ICP Score */}
            <div className="p-3.5 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" />
                  Pontuação de Aderência ICP: {score}/100
                </label>
                <span className={`text-xs font-bold ${score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-zinc-400'}`}>
                  {score >= 80 ? 'Alta Prioridade' : score >= 60 ? 'Média Aderência' : 'Baixa Aderência'}
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full accent-[#635BFF] cursor-pointer"
              />
            </div>

            {/* Associated Services */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Serviços Associados (O que oferecer a esta empresa?)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map((serv) => {
                  const isChecked = selectedServices.includes(serv.id);
                  return (
                    <div
                      key={serv.id}
                      onClick={() => toggleService(serv.id)}
                      className={`p-3 rounded-[10px] border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                        isChecked
                          ? 'bg-[#635BFF]/10 border-[#635BFF] text-zinc-900 dark:text-zinc-100'
                          : 'bg-white dark:bg-[#161922] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-semibold block">{serv.name}</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                          {serv.standardTicket} • {serv.coreValueProposition}
                        </span>
                      </div>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border mt-0.5 shrink-0 ${
                        isChecked ? 'bg-[#635BFF] border-[#635BFF] text-white' : 'border-zinc-300 dark:border-zinc-700'
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Commercial Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Observações Comerciais & Dores Identificadas
              </label>
              <textarea
                rows={3}
                className="w-full p-3 rounded-[10px] border border-[#E6E8EC] dark:border-[#232836] bg-white dark:bg-[#12151D] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#635BFF] leading-relaxed resize-none"
                placeholder="Ex: Empresa em expansão com 2 novas filiais abertas. Dificuldade de acompanhamento de equipe comercial. Decisor busca automação de ponta a ponta."
                value={commercialNotes}
                onChange={(e) => setCommercialNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
