import React, { useState, useEffect } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { 
  ServiceEntity, 
  ServiceCountryPrice, 
  ServiceQualificationCriterion, 
  ServiceQualificationQuestion,
  COUNTRY_CURRENCY_PRESETS,
  CountryCurrencyPreset,
  formatServiceCurrency
} from '../../core/types/service';
import { CompanyFunnelStage } from '../../core/types/company';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Sparkles, 
  Globe, 
  Layers, 
  Plus, 
  Trash2, 
  Coins, 
  HelpCircle, 
  CheckCircle2, 
  Tag, 
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';

const FUNNEL_STAGES: { id: CompanyFunnelStage; label: string }[] = [
  { id: 'prospeccao', label: 'Prospecção (Primeiro Toque)' },
  { id: 'contato_feito', label: 'Contato Feito (Em Conversa)' },
  { id: 'qualificacao', label: 'Qualificação (Validando Dor/ICP)' },
  { id: 'reuniao_agendada', label: 'Reunião Agendada (Demo/Diagnóstico)' },
  { id: 'proposta', label: 'Proposta Apresentada' },
  { id: 'negociacao', label: 'Negociação (Alinhamento de Contrato)' },
  { id: 'cliente', label: 'Cliente Conquistado' },
];

export const ServiceFormModal: React.FC = () => {
  const { 
    isServiceModalOpen, 
    setIsServiceModalOpen, 
    editingService, 
    setEditingService,
    addService,
    updateService,
    funnels
  } = useLeadion();

  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'qualification'>('info');

  // Basic Info Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'archived' | 'draft'>('active');
  const [defaultFunnelId, setDefaultFunnelId] = useState<string>('');
  const [defaultFunnelStageId, setDefaultFunnelStageId] = useState<string>('');
  const [defaultFunnelStage, setDefaultFunnelStage] = useState<CompanyFunnelStage>('prospeccao');
  const [idealCustomerProfile, setIdealCustomerProfile] = useState('');
  const [deliverablesText, setDeliverablesText] = useState('');

  // Country Pricing Form State
  const [countryPrices, setCountryPrices] = useState<ServiceCountryPrice[]>([]);

  // Qualification Form State
  const [criteria, setCriteria] = useState<ServiceQualificationCriterion[]>([]);
  const [questions, setQuestions] = useState<ServiceQualificationQuestion[]>([]);

  // Load editing service or reset
  useEffect(() => {
    const fallbackFunnel = funnels.find((f) => f.isDefault) || funnels[0];

    if (editingService) {
      setName(editingService.name || '');
      setCode(editingService.code || '');
      setDescription(editingService.description || '');
      setStatus(editingService.status || 'active');
      const fId = editingService.defaultFunnelId || fallbackFunnel?.id || '';
      setDefaultFunnelId(fId);
      const chosenFunnel = funnels.find((f) => f.id === fId) || fallbackFunnel;
      setDefaultFunnelStageId(editingService.defaultFunnelStageId || chosenFunnel?.stages[0]?.id || '');
      setDefaultFunnelStage(editingService.defaultFunnelStage || 'prospeccao');
      setIdealCustomerProfile(editingService.idealCustomerProfile || '');
      setDeliverablesText((editingService.deliverables || []).join('\n'));
      setCountryPrices(editingService.countryPrices ? JSON.parse(JSON.stringify(editingService.countryPrices)) : []);
      setCriteria(editingService.qualificationCriteria ? JSON.parse(JSON.stringify(editingService.qualificationCriteria)) : []);
      setQuestions(editingService.qualificationQuestions ? JSON.parse(JSON.stringify(editingService.qualificationQuestions)) : []);
    } else {
      // Default new service with standard presets
      setName('');
      setCode(`SERV-${Math.floor(10 + Math.random() * 90)}`);
      setDescription('');
      setStatus('active');
      setDefaultFunnelId(fallbackFunnel?.id || '');
      setDefaultFunnelStageId(fallbackFunnel?.stages[0]?.id || '');
      setDefaultFunnelStage('prospeccao');
      setIdealCustomerProfile('');
      setDeliverablesText('');
      
      // Presets padrão: Moçambique, Portugal e Brasil
      setCountryPrices([
        {
          id: `cp-${Date.now()}-1`,
          country: 'Moçambique',
          countryCode: 'MZ',
          currency: 'MT',
          currencySymbol: 'MT',
          myPrice: 10000,
          marketMinPrice: 6000,
          marketMaxPrice: 25000,
          notes: 'Preço base para Moçambique'
        },
        {
          id: `cp-${Date.now()}-2`,
          country: 'Portugal',
          countryCode: 'PT',
          currency: 'EUR',
          currencySymbol: '€',
          myPrice: 137,
          marketMinPrice: 90,
          marketMaxPrice: 450,
          notes: 'Preço para Portugal e União Europeia'
        },
        {
          id: `cp-${Date.now()}-3`,
          country: 'Brasil',
          countryCode: 'BR',
          currency: 'BRL',
          currencySymbol: 'R$',
          myPrice: 597,
          marketMinPrice: 350,
          marketMaxPrice: 1800,
          notes: 'Preço de entrada no Brasil'
        }
      ]);

      setCriteria([
        {
          id: `qc-${Date.now()}-1`,
          label: 'Decisor direto acessível (Sócio, Dono ou Gerente Comercial)',
          importance: 'obrigatorio',
          description: 'Sem acesso ao decisor final o ciclo congela.'
        }
      ]);

      setQuestions([
        {
          id: `qq-${Date.now()}-1`,
          question: 'Qual é o principal desafio comercial da empresa para bater a meta deste mês?',
          expectedAnswerInsight: 'Mapeia gargalo operacional e nível de prioridade imediata.',
          category: 'dor'
        }
      ]);
    }
    setActiveTab('info');
  }, [editingService, isServiceModalOpen]);

  // Country Price Handlers
  const handleAddCountryPreset = (preset: CountryCurrencyPreset) => {
    // Check if country already exists
    const exists = countryPrices.some(
      (cp) => cp.country.toLowerCase() === preset.country.toLowerCase()
    );
    if (exists) return;

    const newCp: ServiceCountryPrice = {
      id: `cp-${Date.now()}-${Math.random()}`,
      country: preset.country,
      countryCode: preset.countryCode,
      currency: preset.currency,
      currencySymbol: preset.currencySymbol,
      myPrice: preset.currency === 'EUR' ? 150 : preset.currency === 'USD' ? 200 : preset.currency === 'MT' ? 10000 : 600,
      marketMinPrice: preset.currency === 'EUR' ? 100 : preset.currency === 'USD' ? 150 : preset.currency === 'MT' ? 6000 : 350,
      marketMaxPrice: preset.currency === 'EUR' ? 500 : preset.currency === 'USD' ? 600 : preset.currency === 'MT' ? 25000 : 2000,
      notes: `Configuração para ${preset.country}`
    };

    setCountryPrices([...countryPrices, newCp]);
  };

  const handleAddCustomCountry = () => {
    const newCp: ServiceCountryPrice = {
      id: `cp-${Date.now()}-${Math.random()}`,
      country: 'Novo País',
      countryCode: 'XX',
      currency: 'USD',
      currencySymbol: '$',
      myPrice: 500,
      marketMinPrice: 300,
      marketMaxPrice: 1500,
      notes: ''
    };
    setCountryPrices([...countryPrices, newCp]);
  };

  const handleUpdateCountryPrice = (id: string, field: keyof ServiceCountryPrice, value: any) => {
    setCountryPrices(
      countryPrices.map((cp) => (cp.id === id ? { ...cp, [field]: value } : cp))
    );
  };

  const handleRemoveCountry = (id: string) => {
    if (countryPrices.length <= 1) {
      alert('O serviço deve possuir ao menos 1 país configurado.');
      return;
    }
    setCountryPrices(countryPrices.filter((cp) => cp.id !== id));
  };

  // Qualification Handlers
  const handleAddCriterion = () => {
    const newCrit: ServiceQualificationCriterion = {
      id: `qc-${Date.now()}-${Math.random()}`,
      label: '',
      importance: 'obrigatorio',
      description: ''
    };
    setCriteria([...criteria, newCrit]);
  };

  const handleUpdateCriterion = (id: string, field: keyof ServiceQualificationCriterion, value: any) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteria(criteria.filter((c) => c.id !== id));
  };

  const handleAddQuestion = () => {
    const newQ: ServiceQualificationQuestion = {
      id: `qq-${Date.now()}-${Math.random()}`,
      question: '',
      expectedAnswerInsight: '',
      category: 'dor'
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (id: string, field: keyof ServiceQualificationQuestion, value: any) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // Save Service
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (countryPrices.length === 0) {
      alert('Adicione ao menos um país e moeda para a precificação do serviço.');
      setActiveTab('pricing');
      return;
    }

    const deliverables = deliverablesText
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);

    const funnelStageObj = FUNNEL_STAGES.find((s) => s.id === defaultFunnelStage);
    const selectedFunnel = funnels.find((f) => f.id === defaultFunnelId);
    const selectedStage = selectedFunnel?.stages.find((s) => s.id === defaultFunnelStageId);

    const servicePayload: Omit<ServiceEntity, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      name: name.trim(),
      code: code.trim() || `SERV-${Date.now()}`,
      description: description.trim(),
      status,
      countryPrices,
      defaultFunnelId,
      defaultFunnelStageId,
      defaultFunnelStage,
      defaultFunnelStageName: selectedStage?.name || funnelStageObj?.label || 'Prospecção',
      deliverables,
      idealCustomerProfile: idealCustomerProfile.trim(),
      qualificationCriteria: criteria.filter((c) => c.label.trim().length > 0),
      qualificationQuestions: questions.filter((q) => q.question.trim().length > 0),
      // Campos de retrocompatibilidade
      standardTicket: countryPrices[0] 
        ? formatServiceCurrency(countryPrices[0].myPrice, countryPrices[0].currency, countryPrices[0].currencySymbol)
        : '',
      shortDescription: description.trim().slice(0, 120),
    };

    if (editingService) {
      updateService(editingService.id, servicePayload);
    } else {
      addService(servicePayload);
    }

    setIsServiceModalOpen(false);
    setEditingService(null);
  };

  const handleClose = () => {
    setIsServiceModalOpen(false);
    setEditingService(null);
  };

  return (
    <Modal
      isOpen={isServiceModalOpen}
      onClose={handleClose}
      title={editingService ? `Editar Serviço: ${editingService.name}` : 'Cadastrar Novo Serviço'}
      description="Configure proposta comercial, precificação multipaís com moedas locais, funil padrão e critérios de qualificação."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#635BFF] text-[#635BFF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            1. Informações & Funil
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'pricing'
                ? 'border-[#635BFF] text-[#635BFF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            2. Países & Preços ({countryPrices.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qualification')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'qualification'
                ? 'border-[#635BFF] text-[#635BFF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            3. Qualificação & Perguntas ({criteria.length + questions.length})
          </button>
        </div>

        {/* TAB 1: Informações Gerais & Funil Padrão */}
        {activeTab === 'info' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Nome do Serviço <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Landing Page de Alta Conversão"
                  className="w-full text-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                  required
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Código Interno
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: LP-CONV-01"
                  className="w-full text-sm font-mono rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Descrição da Solução
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Explique o que o serviço entrega e qual dor resolve na empresa contratante..."
                className="w-full text-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#635BFF]" />
                  Funil Padrão Associado
                </label>
                <select
                  value={defaultFunnelId}
                  onChange={(e) => {
                    const newFId = e.target.value;
                    setDefaultFunnelId(newFId);
                    const chosenF = funnels.find((f) => f.id === newFId);
                    if (chosenF && chosenF.stages.length > 0) {
                      setDefaultFunnelStageId(chosenF.stages[0].id);
                    }
                  }}
                  className="w-full text-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                >
                  {funnels.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.isDefault ? ' (Padrão)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Funil ativado quando este serviço for atribuído a um lead.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Etapa Inicial Recomendada
                </label>
                <select
                  value={defaultFunnelStageId}
                  onChange={(e) => setDefaultFunnelStageId(e.target.value)}
                  className="w-full text-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                >
                  {(funnels.find((f) => f.id === defaultFunnelId)?.stages || []).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Etapa onde o lead inicia ao selecionar este serviço.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Status Comercial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                >
                  <option value="active">Ativo (Pronto para prospecção)</option>
                  <option value="draft">Rascunho (Em estruturação)</option>
                  <option value="archived">Arquivado (Inativo)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Perfil de Cliente Ideal (ICP)
              </label>
              <input
                type="text"
                value={idealCustomerProfile}
                onChange={(e) => setIdealCustomerProfile(e.target.value)}
                placeholder="Ex: Clínicas estéticas, consultórios de alto padrão e negócios locais com alta margem"
                className="w-full text-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Entregáveis Principais (1 por linha)
              </label>
              <textarea
                value={deliverablesText}
                onChange={(e) => setDeliverablesText(e.target.value)}
                rows={3}
                placeholder="Estrutura de alta velocidade&#10;Copywriting persuasivo focado em WhatsApp&#10;Painel de métricas e conversão"
                className="w-full text-sm font-mono text-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
              />
            </div>
          </div>
        )}

        {/* TAB 2: Países & Precificação Multimoeda */}
        {activeTab === 'pricing' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#635BFF]" />
                  Precificação Multipaís & Multimoeda
                </span>
                <p className="text-zinc-500">
                  Adicione quantos países desejar. A moeda é associada a cada país.
                </p>
              </div>

              {/* Botões rápidos de preset */}
              <div className="flex flex-wrap gap-1.5">
                {COUNTRY_CURRENCY_PRESETS.slice(0, 4).map((p) => {
                  const alreadyAdded = countryPrices.some(
                    (cp) => cp.country.toLowerCase() === p.country.toLowerCase()
                  );
                  if (alreadyAdded) return null;
                  return (
                    <button
                      key={p.countryCode}
                      type="button"
                      onClick={() => handleAddCountryPreset(p)}
                      className="px-2 py-1 bg-white border border-zinc-300 hover:border-[#635BFF] text-zinc-700 hover:text-[#635BFF] rounded text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      + {p.country} ({p.currency})
                    </button>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomCountry}
                  icon={<Plus className="w-3 h-3" />}
                >
                  Outro País
                </Button>
              </div>
            </div>

            {/* Lista de Países e Preços */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {countryPrices.map((cp, index) => (
                <div
                  key={cp.id}
                  className="p-3.5 bg-white border border-zinc-200 rounded-lg shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#635BFF]/10 text-[#635BFF] text-[10px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={cp.country}
                        onChange={(e) => handleUpdateCountryPrice(cp.id, 'country', e.target.value)}
                        placeholder="Nome do País (Ex: Moçambique)"
                        className="text-xs font-bold text-zinc-900 border border-transparent hover:border-zinc-300 focus:border-[#635BFF] rounded px-1.5 py-0.5"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Moeda:</span>
                        <input
                          type="text"
                          value={cp.currency}
                          onChange={(e) => handleUpdateCountryPrice(cp.id, 'currency', e.target.value.toUpperCase())}
                          placeholder="MT"
                          className="w-14 text-xs font-mono font-bold text-zinc-800 border border-zinc-300 rounded px-1.5 py-0.5 uppercase"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Símbolo:</span>
                        <input
                          type="text"
                          value={cp.currencySymbol}
                          onChange={(e) => handleUpdateCountryPrice(cp.id, 'currencySymbol', e.target.value)}
                          placeholder="MT"
                          className="w-12 text-xs font-bold text-zinc-800 border border-zinc-300 rounded px-1.5 py-0.5"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCountry(cp.id)}
                        className="text-zinc-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        title="Remover país"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Os 3 Valores Obrigatórios: Meu Preço, Mínimo Mercado, Máximo Mercado */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Meu Preço */}
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                        Meu Preço ({cp.currency}) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={cp.myPrice || ''}
                        onChange={(e) => handleUpdateCountryPrice(cp.id, 'myPrice', parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 10000"
                        className="w-full text-sm font-bold text-emerald-900 bg-white rounded border border-emerald-300 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                      <span className="text-[10px] text-emerald-700 mt-1 block">
                        Formatado: <strong>{formatServiceCurrency(cp.myPrice, cp.currency, cp.currencySymbol)}</strong>
                      </span>
                    </div>

                    {/* Preço Mínimo de Mercado */}
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                        Preço Mínimo de Mercado ({cp.currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={cp.marketMinPrice || ''}
                        onChange={(e) => handleUpdateCountryPrice(cp.id, 'marketMinPrice', parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 6000"
                        className="w-full text-sm font-semibold text-zinc-800 bg-white rounded border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                      />
                      <span className="text-[10px] text-zinc-500 mt-1 block">
                        Formatado: <strong>{formatServiceCurrency(cp.marketMinPrice, cp.currency, cp.currencySymbol)}</strong>
                      </span>
                    </div>

                    {/* Preço Máximo de Mercado */}
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                        Preço Máximo de Mercado ({cp.currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={cp.marketMaxPrice || ''}
                        onChange={(e) => handleUpdateCountryPrice(cp.id, 'marketMaxPrice', parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 25000"
                        className="w-full text-sm font-semibold text-zinc-800 bg-white rounded border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                      />
                      <span className="text-[10px] text-zinc-500 mt-1 block">
                        Formatado: <strong>{formatServiceCurrency(cp.marketMaxPrice, cp.currency, cp.currencySymbol)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Notas locais do país */}
                  <div>
                    <input
                      type="text"
                      value={cp.notes || ''}
                      onChange={(e) => handleUpdateCountryPrice(cp.id, 'notes', e.target.value)}
                      placeholder="Observações de mercado para este país (ex: modelo para PMEs em Maputo)..."
                      className="w-full text-[11px] text-zinc-600 border border-zinc-200 rounded px-2.5 py-1 focus:border-[#635BFF] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Preservação Histórica:</strong> Alterar estes preços agora NÃO altera propostas antigas já enviadas ou registradas nas empresas.
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: Qualificação & Perguntas */}
        {activeTab === 'qualification' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200 max-h-[420px] overflow-y-auto pr-1">
            {/* Critérios de Qualificação */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Critérios de Qualificação
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    O que a empresa PRECISA ter para ser qualificada para este serviço.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCriterion}
                  icon={<Plus className="w-3 h-3" />}
                >
                  Critério
                </Button>
              </div>

              {criteria.map((crit, idx) => (
                <div key={crit.id} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400">#{idx + 1}</span>
                    <input
                      type="text"
                      value={crit.label}
                      onChange={(e) => handleUpdateCriterion(crit.id, 'label', e.target.value)}
                      placeholder="Ex: Decisor direto acessível (Sócio ou Diretor)"
                      className="flex-1 text-xs font-semibold text-zinc-900 bg-white border border-zinc-300 rounded px-2 py-1"
                    />
                    <select
                      value={crit.importance}
                      onChange={(e) => handleUpdateCriterion(crit.id, 'importance', e.target.value as any)}
                      className="text-xs font-semibold rounded border border-zinc-300 bg-white px-2 py-1"
                    >
                      <option value="obrigatorio">Obrigatório</option>
                      <option value="desejavel">Desejável</option>
                      <option value="eliminatorio">Eliminatório</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(crit.id)}
                      className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={crit.description || ''}
                    onChange={(e) => handleUpdateCriterion(crit.id, 'description', e.target.value)}
                    placeholder="Justificativa ou dica para o operador comercial..."
                    className="w-full text-[11px] text-zinc-600 bg-white border border-zinc-200 rounded px-2 py-0.5"
                  />
                </div>
              ))}
            </div>

            {/* Perguntas de Qualificação */}
            <div className="space-y-2 pt-3 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#635BFF]" />
                    Perguntas Investigativas de Qualificação
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Perguntas que o prospectador deve fazer ao lead para diagnosticar dor e orçamento.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuestion}
                  icon={<Plus className="w-3 h-3" />}
                >
                  Pergunta
                </Button>
              </div>

              {questions.map((q, idx) => (
                <div key={q.id} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400">P{idx + 1}</span>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => handleUpdateQuestion(q.id, 'question', e.target.value)}
                      placeholder="Pergunta formulada para o decisor..."
                      className="flex-1 text-xs font-semibold text-zinc-900 bg-white border border-zinc-300 rounded px-2 py-1"
                    />
                    <select
                      value={q.category || 'dor'}
                      onChange={(e) => handleUpdateQuestion(q.id, 'category', e.target.value as any)}
                      className="text-xs rounded border border-zinc-300 bg-white px-2 py-1"
                    >
                      <option value="dor">Dor / Problema</option>
                      <option value="orcamento">Orçamento / ROI</option>
                      <option value="decisao">Decisão / Timing</option>
                      <option value="timing">Urgência</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={q.expectedAnswerInsight || ''}
                    onChange={(e) => handleUpdateQuestion(q.id, 'expectedAnswerInsight', e.target.value)}
                    placeholder="O que escutar / Insight da resposta (ex: se responder X, a dor é alta)..."
                    className="w-full text-[11px] text-zinc-600 bg-white border border-zinc-200 rounded px-2 py-0.5"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            {activeTab !== 'qualification' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab(activeTab === 'info' ? 'pricing' : 'qualification')}
              >
                Próxima Etapa →
              </Button>
            )}

            <Button type="submit" variant="primary" size="sm">
              {editingService ? 'Salvar Alterações do Serviço' : 'Criar Serviço no Catálogo'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
