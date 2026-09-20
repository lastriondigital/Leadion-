import React, { useState, useEffect } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { ActionChannel, PlanningFormData } from '../../core/types/prospectAction';
import { Company, CompanyFunnelStage } from '../../core/types/company';
import { getServicePriceForCompany, formatServiceCurrency } from '../../core/types/service';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Building2, 
  Sparkles, 
  Layers, 
  MessageSquare, 
  Phone, 
  Mail, 
  Linkedin, 
  Video, 
  Calendar, 
  Clock, 
  User, 
  FileText,
  CheckCircle2,
  AlertCircle,
  Globe
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

const CHANNELS: { id: ActionChannel; label: string; icon: React.ReactNode }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4 text-emerald-600" /> },
  { id: 'phone', label: 'Telefone', icon: <Phone className="w-4 h-4 text-blue-600" /> },
  { id: 'email', label: 'E-mail', icon: <Mail className="w-4 h-4 text-amber-600" /> },
  { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-4 h-4 text-indigo-600" /> },
  { id: 'reuniao', label: 'Reunião Virtual', icon: <Video className="w-4 h-4 text-violet-600" /> },
];

export const ActionPlanningModal: React.FC = () => {
  const { 
    isPlanningModalOpen, 
    setIsPlanningModalOpen, 
    planningPreselectedCompany, 
    setPlanningPreselectedCompany,
    companies, 
    services, 
    userName, 
    planAction 
  } = useLeadion();

  // Active companies only for planning
  const activeCompanies = companies.filter((c) => c.status === 'active');

  // Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [funnelStage, setFunnelStage] = useState<string>('prospeccao');
  const [channel, setChannel] = useState<ActionChannel>('whatsapp');
  const [nextActionTitle, setNextActionTitle] = useState<string>('Primeira abordagem');
  const [date, setDate] = useState<string>('Hoje');
  const [time, setTime] = useState<string>('09:30');
  const [responsible, setResponsible] = useState<string>(userName || 'Manuel Domingos');
  const [observation, setObservation] = useState<string>('');

  // Sincroniza com empresa pré-selecionada se aberta via card
  useEffect(() => {
    if (planningPreselectedCompany) {
      setSelectedCompanyId(planningPreselectedCompany.id);
      setFunnelStage(planningPreselectedCompany.funnelStage || 'prospeccao');
      if (planningPreselectedCompany.nextAction?.channel) {
        setChannel(planningPreselectedCompany.nextAction.channel as ActionChannel);
      }
      if (planningPreselectedCompany.nextAction?.label) {
        setNextActionTitle(planningPreselectedCompany.nextAction.label);
      }
      if (planningPreselectedCompany.associatedServices && planningPreselectedCompany.associatedServices.length > 0) {
        const found = services.find((s) => s.id === planningPreselectedCompany.associatedServices[0]);
        if (found) setSelectedService(found.name);
      }
    } else if (activeCompanies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(activeCompanies[0].id);
    }
  }, [planningPreselectedCompany, activeCompanies, services]);

  // Se nenhum serviço estiver selecionado, seleciona o primeiro
  useEffect(() => {
    if (!selectedService && services.length > 0) {
      setSelectedService(services[0].name);
    }
  }, [selectedService, services]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return;

    const chosenServiceObj = services.find((s) => s.name === selectedService);

    const formData: PlanningFormData = {
      companyId: selectedCompanyId,
      service: selectedService || (services[0]?.name || 'Landing Page'),
      serviceId: chosenServiceObj?.id,
      funnelStage,
      channel,
      nextActionTitle: nextActionTitle.trim() || `Abordagem via ${channel.toUpperCase()}`,
      date,
      time,
      responsible: responsible.trim() || userName,
      observation: observation.trim(),
    };

    planAction(formData);
  };

  const handleClose = () => {
    setIsPlanningModalOpen(false);
    setPlanningPreselectedCompany(null);
  };

  const currentCompany = companies.find((c) => c.id === selectedCompanyId);
  const chosenServiceObj = services.find((s) => s.name === selectedService);
  const activeCountryPrice = chosenServiceObj ? getServicePriceForCompany(chosenServiceObj, currentCompany?.country) : null;

  return (
    <Modal
      isOpen={isPlanningModalOpen}
      onClose={handleClose}
      title="Programar Prospecção Comercial"
      description="Configure a próxima ação estratégica com canal, serviço e agendamento preciso."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        
        {/* 1. Escolher Empresa */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#635BFF]" />
            Empresa Alvo
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              const compId = e.target.value;
              setSelectedCompanyId(compId);
              const found = companies.find((c) => c.id === compId);
              if (found) {
                if (found.associatedServices && found.associatedServices.length > 0) {
                  const s = services.find((serv) => serv.id === found.associatedServices[0]);
                  if (s) {
                    setSelectedService(s.name);
                    if (s.defaultFunnelStage) {
                      setFunnelStage(s.defaultFunnelStage);
                    }
                  }
                } else if (found.funnelStage) {
                  setFunnelStage(found.funnelStage);
                }
              }
            }}
            className="w-full text-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
            required
          >
            <option value="" disabled>Selecione uma empresa cadastrada...</option>
            {activeCompanies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.niche} ({c.country ? `${c.country} · ` : ''}{c.city || c.location || 'Local'}) [Score: {c.score}/100]
              </option>
            ))}
          </select>
          {currentCompany && (
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
              <span>Nicho: <strong>{currentCompany.niche}</strong></span>
              <span>·</span>
              <span>País: <strong>{currentCompany.country || 'Brasil'}</strong></span>
              <span>·</span>
              <span>Score: <strong>{currentCompany.score}/100</strong></span>
            </p>
          )}
        </div>

        {/* 2. Serviço & 3. Funil (Grid 2 cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Serviço */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" />
              Serviço a Oferecer
            </label>
            <select
              value={selectedService}
              onChange={(e) => {
                const serviceName = e.target.value;
                setSelectedService(serviceName);
                const foundServ = services.find((s) => s.name === serviceName);
                if (foundServ && foundServ.defaultFunnelStage) {
                  // Cada serviço pode possuir um funil padrão:
                  // Quando o usuário selecionar o serviço, o Leadion seleciona automaticamente o funil associado.
                  setFunnelStage(foundServ.defaultFunnelStage);
                }
              }}
              className="w-full text-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
              required
            >
              {services.map((s) => {
                const cp = currentCompany ? getServicePriceForCompany(s, currentCompany.country) : (s.countryPrices[0] || null);
                const displayPrice = cp ? formatServiceCurrency(cp.myPrice, cp.currency, cp.currencySymbol) : (s.standardTicket || '');
                return (
                  <option key={s.id} value={s.name}>
                    {s.name} {displayPrice ? `· ${displayPrice}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Etapa do Funil */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              Etapa do Funil (Padrão ou Manual)
            </label>
            <select
              value={funnelStage}
              onChange={(e) => setFunnelStage(e.target.value)}
              className="w-full text-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
            >
              {FUNNEL_STAGES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Painel Contextual de Precificação Multipaís & Multimoeda */}
        {activeCountryPrice && chosenServiceObj && (
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                <Globe className="w-3.5 h-3.5 text-[#635BFF]" />
                <span>Configuração de Preço: <strong>{activeCountryPrice.country}</strong> ({activeCountryPrice.currency})</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                {chosenServiceObj.code} · v{chosenServiceObj.version || 1}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded border border-zinc-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#635BFF] block">
                  Meu Preço
                </span>
                <span className="text-sm font-bold text-zinc-900 block mt-0.5">
                  {formatServiceCurrency(activeCountryPrice.myPrice, activeCountryPrice.currency, activeCountryPrice.currencySymbol)}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-zinc-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                  Mercado Mínimo
                </span>
                <span className="text-xs font-semibold text-zinc-700 block mt-0.5">
                  {formatServiceCurrency(activeCountryPrice.marketMinPrice, activeCountryPrice.currency, activeCountryPrice.currencySymbol)}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-zinc-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                  Mercado Máximo
                </span>
                <span className="text-xs font-semibold text-zinc-700 block mt-0.5">
                  {formatServiceCurrency(activeCountryPrice.marketMaxPrice, activeCountryPrice.currency, activeCountryPrice.currencySymbol)}
                </span>
              </div>
            </div>

            {chosenServiceObj.defaultFunnelStageName && (
              <div className="text-[11px] text-zinc-600 flex items-center justify-between pt-1 border-t border-zinc-200">
                <span>Funil associado: <strong className="text-zinc-800">{chosenServiceObj.defaultFunnelStageName}</strong></span>
                <span className="text-[10px] text-zinc-500 italic">Alteração manual permitida</span>
              </div>
            )}
          </div>
        )}

        {/* 4. Próxima Ação & Canal */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
          <div className="sm:col-span-7">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Título da Próxima Ação
            </label>
            <input
              type="text"
              value={nextActionTitle}
              onChange={(e) => setNextActionTitle(e.target.value)}
              placeholder="Ex: Primeira abordagem, Enviar proposta com minuta..."
              className="w-full text-sm rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
              required
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Canal de Contato
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setChannel(ch.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    channel === ch.id
                      ? 'bg-indigo-50 border-[#635BFF] text-[#635BFF] font-semibold'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {ch.icon}
                  <span className="truncate">{ch.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Data & 6. Hora (com atalhos rápidos) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200/70">
          {/* Data */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              Data
            </label>
            <div className="flex gap-1.5 mb-1.5">
              {['Hoje', 'Amanhã', 'Segunda-feira'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(d)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                    date === d 
                      ? 'bg-[#635BFF] text-white border-[#635BFF]' 
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Ex: Hoje ou DD/MM/AAAA"
              className="w-full text-xs rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
              required
            />
          </div>

          {/* Hora */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              Horário Previsto
            </label>
            <div className="flex gap-1.5 mb-1.5">
              {['09:00', '10:30', '14:00', '16:00'].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTime(h)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                    time === h 
                      ? 'bg-[#635BFF] text-white border-[#635BFF]' 
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="Ex: 09:30"
              className="w-full text-xs rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
              required
            />
          </div>
        </div>

        {/* 7. Responsável */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-zinc-500" />
            Responsável pela Execução
          </label>
          <input
            type="text"
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            placeholder="Nome do operador ou SDR"
            className="w-full text-sm rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
            required
          />
        </div>

        {/* 8. Observação */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            Observações Comerciais & Gancho
          </label>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Ex: Destacar dor de perda de conversão no WhatsApp; citar crescimento recente da empresa..."
            rows={2}
            className="w-full text-xs rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
          />
        </div>

        {/* Footer Buttons */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="bg-[#635BFF] hover:bg-[#5248E5] text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Salvar na fila
          </Button>
        </div>
      </form>
    </Modal>
  );
};
