import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useLeadion } from '../../context/LeadionContext';
import { ChannelType, LeadUrgency } from '../../core/types/lead';

export const NewLeadModal: React.FC = () => {
  const { isNewLeadModalOpen, setIsNewLeadModalOpen, addNewLead, services } = useLeadion();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [segment, setSegment] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [trigger, setTrigger] = useState('');
  const [painPoint, setPainPoint] = useState('');
  const [channel, setChannel] = useState<ChannelType>('whatsapp');
  const [scriptHook, setScriptHook] = useState('');
  const [scriptBody, setScriptBody] = useState('');
  const [scriptCta, setScriptCta] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;

    const chosenService = services.find((s) => s.id === selectedServiceId) || services[0];

    const fullScript = `${scriptHook ? scriptHook + ' ' : ''}${scriptBody ? scriptBody + ' ' : ''}${scriptCta ? scriptCta : ''}`.trim() ||
      `Olá ${name}, vi a expansão da ${company}. Temos uma solução para otimizar suas operações. Você teria 10 min esta semana?`;

    addNewLead({
      name,
      role: role || 'Decisor',
      company,
      whatsappNumber,
      phone: whatsappNumber,
      email,
      linkedinUrl,
      segment: segment || 'B2B Geral',
      why: {
        trigger: trigger || 'Oportunidade de mercado identificada no radar comercial.',
        painPoint: painPoint || 'Gargalo operacional e busca por eficiência comercial.',
        urgencyLevel: 'high' as LeadUrgency,
        icpFitReason: 'Perfil compatível com a tese de ICP da oferta.',
      },
      offer: {
        serviceId: chosenService?.id || 'serv-01',
        serviceName: chosenService?.name || 'Otimização Operacional',
        valueProposition: chosenService?.coreValueProposition || 'Redução de custos e ganho de escala.',
        estimatedTicket: chosenService?.standardTicket || 'R$ 5.000/mês',
        deliverablesHighlight: 'Entrega estruturada com acompanhamento.',
      },
      script: {
        channel,
        hook: scriptHook || `Olá ${name}, vi o crescimento recente da ${company}.`,
        body: scriptBody || `Ajudamos empresas com operação semelhante a eliminar custos desnecessários.`,
        cta: scriptCta || `Você teria 10 min na quinta-feira para uma demonstração rápida?`,
        fullText: fullScript,
      },
      nextAction: {
        channel,
        actionType: channel === 'whatsapp' ? 'send_whatsapp' : channel === 'linkedin' ? 'connect_linkedin' : channel === 'phone' ? 'make_call' : 'send_email',
        label: `Enviar ${channel === 'whatsapp' ? 'WhatsApp' : channel === 'linkedin' ? 'LinkedIn' : channel === 'phone' ? 'Ligação' : 'E-mail'} com Script`,
      },
    });

    // Reset and close
    setName('');
    setRole('');
    setCompany('');
    setWhatsappNumber('');
    setEmail('');
    setLinkedinUrl('');
    setSegment('');
    setTrigger('');
    setPainPoint('');
    setScriptHook('');
    setScriptBody('');
    setScriptCta('');
    setIsNewLeadModalOpen(false);
  };

  return (
    <Modal
      isOpen={isNewLeadModalOpen}
      onClose={() => setIsNewLeadModalOpen(false)}
      title="Cadastrar Nova Prospecção"
      description="Preencha os 6 elementos essenciais para transformar este contato em execução direta imediata."
      maxWidth="lg"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewLeadModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim() || !company.trim()}
          >
            Adicionar à fila
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Quem prospectar? */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
            <span className="w-5 h-5 rounded-full bg-[#635BFF] text-white text-[11px] font-bold flex items-center justify-center">
              1
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Quem prospectar?
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nome do Decisor *"
              placeholder="Ex: Roberto Faria"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Cargo / Função"
              placeholder="Ex: Diretor de Operações"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <Input
              label="Empresa *"
              placeholder="Ex: Logix Transportes"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
            <Input
              label="Segmento"
              placeholder="Ex: Logística & Distribuição"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
            />
            <Input
              label="WhatsApp"
              placeholder="Ex: +55 11 98765-4321"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
            <Input
              label="LinkedIn URL"
              placeholder="Ex: https://linkedin.com/in/perfil"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Por que prospectar? */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
            <span className="w-5 h-5 rounded-full bg-[#635BFF] text-white text-[11px] font-bold flex items-center justify-center">
              2
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Por que prospectar? (Gatilho Comercial)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Gatilho Recente (Fato gerador)"
              placeholder="Ex: Abriu 3 novas filiais este mês..."
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
            />
            <Input
              label="Dor Operacional Identificada"
              placeholder="Ex: Atrasos em entregas e custo de rota..."
              value={painPoint}
              onChange={(e) => setPainPoint(e.target.value)}
            />
          </div>
        </div>

        {/* O que oferecer? */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
            <span className="w-5 h-5 rounded-full bg-[#635BFF] text-white text-[11px] font-bold flex items-center justify-center">
              3
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              O que oferecer?
            </span>
          </div>
          <Select
            label="Solução / Serviço Recomendado"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            options={services.map((s) => ({ value: s.id, label: `${s.name} (${s.standardTicket})` }))}
          />
        </div>

        {/* O que dizer? */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
            <span className="w-5 h-5 rounded-full bg-[#635BFF] text-white text-[11px] font-bold flex items-center justify-center">
              4
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              O que dizer? (Canal & Script)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Canal Primário"
              value={channel}
              onChange={(e) => setChannel(e.target.value as ChannelType)}
              options={[
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'phone', label: 'Telefone' },
                { value: 'email', label: 'E-mail' },
              ]}
            />
            <div className="sm:col-span-2">
              <Input
                label="Gancho de Abertura (Hook)"
                placeholder="Ex: Vi que vocês abriram novas unidades..."
                value={scriptHook}
                onChange={(e) => setScriptHook(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Corpo da Mensagem (Proposta de Valor)
            </label>
            <textarea
              rows={2}
              value={scriptBody}
              onChange={(e) => setScriptBody(e.target.value)}
              placeholder="Ex: Ajudamos diretores de operações a cortar 14% do custo de km..."
              className="w-full bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 text-sm border border-[#E6E8EC] dark:border-[#232836] rounded-[11px] p-2.5 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20"
            />
          </div>
          <Input
            label="Chamada para Ação (CTA de fechamento)"
            placeholder="Ex: Você teria 10 min na quinta às 10h para ver os números?"
            value={scriptCta}
            onChange={(e) => setScriptCta(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
