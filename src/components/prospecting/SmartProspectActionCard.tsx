import React, { useState } from 'react';
import { ProspectAction } from '../../core/types/prospectAction';
import { useLeadion } from '../../context/LeadionContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Linkedin, 
  Video, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  MapPin, 
  Briefcase, 
  ArrowUpRight, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  XCircle,
  RotateCcw,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface SmartProspectActionCardProps {
  action: ProspectAction;
}

export const SmartProspectActionCard: React.FC<SmartProspectActionCardProps> = ({ action }) => {
  const { 
    completeAction, 
    cancelAction, 
    reopenAction, 
    openWhatsAppAction, 
    openWhatsAppForCompany,
    openObjectionModal,
    openActionOutcomeModal,
    scriptsEntities,
    setIsPlanningModalOpen, 
    setPlanningPreselectedCompany, 
    setQuickViewCompany, 
    companies 
  } = useLeadion();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  // Identifica a empresa correspondente
  const company = companies.find((c) => c.id === action.companyId);

  // Mapeamento de canais com ícones e rótulos
  const getChannelConfig = (ch: string) => {
    switch (ch) {
      case 'whatsapp':
        return {
          label: 'WhatsApp',
          icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          actionLabel: 'ABRIR WHATSAPP',
          actionIcon: <MessageSquare className="w-4 h-4 mr-1.5" />,
          actionBg: 'bg-[#635BFF] hover:bg-[#5248E5] text-white',
        };
      case 'phone':
        return {
          label: 'Telefone / Ligação',
          icon: <Phone className="w-3.5 h-3.5 text-blue-600" />,
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          actionLabel: 'LIGAR AGORA',
          actionIcon: <Phone className="w-4 h-4 mr-1.5" />,
          actionBg: 'bg-[#635BFF] hover:bg-[#5248E5] text-white',
        };
      case 'email':
        return {
          label: 'E-mail',
          icon: <Mail className="w-3.5 h-3.5 text-amber-600" />,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          actionLabel: 'ENVIAR E-MAIL',
          actionIcon: <Mail className="w-4 h-4 mr-1.5" />,
          actionBg: 'bg-[#635BFF] hover:bg-[#5248E5] text-white',
        };
      case 'linkedin':
        return {
          label: 'LinkedIn',
          icon: <Linkedin className="w-3.5 h-3.5 text-indigo-600" />,
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          actionLabel: 'ABRIR LINKEDIN',
          actionIcon: <Linkedin className="w-4 h-4 mr-1.5" />,
          actionBg: 'bg-[#635BFF] hover:bg-[#5248E5] text-white',
        };
      case 'reuniao':
        return {
          label: 'Reunião Virtual',
          icon: <Video className="w-3.5 h-3.5 text-violet-600" />,
          color: 'bg-violet-50 text-violet-700 border-violet-200',
          actionLabel: 'INICIAR REUNIÃO',
          actionIcon: <Video className="w-4 h-4 mr-1.5" />,
          actionBg: 'bg-[#635BFF] hover:bg-[#5248E5] text-white',
        };
      default:
        return {
          label: ch,
          icon: <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />,
          color: 'bg-zinc-50 text-zinc-700 border-zinc-200',
          actionLabel: 'EXECUTAR AÇÃO',
          actionIcon: <MessageSquare className="w-4 h-4 mr-1.5" />,
          actionBg: 'bg-[#635BFF] hover:bg-[#5248E5] text-white',
        };
    }
  };

  const channelConfig = getChannelConfig(action.channel);

  // Formatação de status visual
  const isOverdue = action.status === 'atrasada';
  const isDueToday = action.status === 'hoje';
  const isCompleted = action.status === 'concluida';
  const isCancelled = action.status === 'cancelada';

  // Handler de Abertura Principal (WhatsApp ou Telefone ou Email)
  const handlePrimaryExecution = () => {
    if (action.channel === 'whatsapp') {
      openWhatsAppAction(action.id);
    } else if (action.channel === 'phone') {
      const cleanPhone = (action.phone || action.whatsappNumber || '').replace(/\D/g, '');
      if (cleanPhone) window.open(`tel:${cleanPhone}`);
    } else if (action.channel === 'email') {
      const mailto = action.email ? `mailto:${action.email}?subject=${encodeURIComponent(`Solução ${action.service}`)}&body=${encodeURIComponent(action.scriptText || '')}` : '';
      if (mailto) window.open(mailto);
    } else if (action.channel === 'linkedin' && action.linkedinUrl) {
      window.open(action.linkedinUrl, '_blank');
    } else {
      openWhatsAppAction(action.id);
    }
  };

  // Handler para [PROGRAMAR]
  const handleProgramAction = () => {
    if (company) {
      setPlanningPreselectedCompany(company);
    }
    setIsPlanningModalOpen(true);
  };

  // Handler para [VER EMPRESA]
  const handleViewCompany = () => {
    if (company) {
      setQuickViewCompany(company);
    }
  };

  // Handler para [PROGRAMAR FOLLOW-UP]
  const handleProgramFollowUp = () => {
    if (company) {
      setPlanningPreselectedCompany(company);
    }
    setIsPlanningModalOpen(true);
  };

  // Handler para [OBJEÇÃO]
  const handleOpenObjection = () => {
    openObjectionModal(
      company?.name || action.companyName,
      action.targetContactName || company?.targetContactName,
      (scriptText) => {
        if (company) {
          openWhatsAppForCompany(company, null, scriptText, action.id);
        }
      }
    );
  };

  // Handler para [PRÓXIMA MENSAGEM]
  const handleNextMessage = () => {
    if (company) {
      let nextScript = null;
      if (action.scriptId) {
        const current = scriptsEntities.find((s) => s.id === action.scriptId);
        if (current?.nextScriptId) {
          nextScript = scriptsEntities.find((s) => s.id === current.nextScriptId) || null;
        }
        if (!nextScript && current?.sequenceOrder) {
          nextScript = scriptsEntities.find((s) => (s.sequenceOrder || 0) === current.sequenceOrder + 1) || null;
        }
      }
      if (!nextScript) {
        nextScript = scriptsEntities.find((s) => s.sequenceType === 'followup' || s.sequenceOrder === 2) || scriptsEntities[1] || scriptsEntities[0];
      }
      openWhatsAppForCompany(company, nextScript, undefined, action.id);
    } else {
      openWhatsAppAction(action.id);
    }
  };

  // Handler para confirmação de conclusão
  const handleConfirmCompletion = () => {
    completeAction(action.id, completionNotes);
    setIsCompleting(false);
    setCompletionNotes('');
  };

  return (
    <div 
      id={`action-card-${action.id}`}
      className={`relative bg-white rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
        isOverdue 
          ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200' 
          : isCompleted 
          ? 'border-zinc-200 opacity-75 bg-zinc-50/40' 
          : 'border-zinc-200/80 hover:border-indigo-300'
      }`}
    >
      {/* Faixa superior com score, prioridade e horário */}
      <div className="p-4 sm:p-5">
        
        {/* MOBILE: AÇÃO PRIMEIRO (Atende diretriz de responsividade) */}
        <div className="block sm:hidden mb-4 pb-3 border-b border-zinc-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-bold text-xs bg-[#635BFF] text-white px-2 py-0.5 rounded shadow-xs">
                Prio: {action.calculatedPriorityScore ?? 96}
              </span>
              <span className="font-mono text-[10px] bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200">
                Cliente: {action.clientScore ?? action.score}/100
              </span>
              <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                Serviço: {action.serviceScore ?? 92}/100
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-zinc-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{action.time}</span>
              {isOverdue && (
                <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                  Atrasada
                </span>
              )}
            </div>
          </div>

          {/* Botão de Disparo Primário no topo mobile */}
          {!isCompleted && !isCancelled && (
            <button
              onClick={handlePrimaryExecution}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wide uppercase flex items-center justify-center shadow-sm active:scale-[0.98] transition-all ${channelConfig.actionBg}`}
            >
              {channelConfig.actionIcon}
              <span>{channelConfig.actionLabel}</span>
            </button>
          )}
        </div>

        {/* ESTRUTURA PRINCIPAL (Desktop & Mobile body) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* COLUNA 1: Score & Empresa & Nicho & Localização (Desktop lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-2">
            
            {/* Topo no Desktop: Os 3 Scores Separados com Significado Próprio */}
            <div className="hidden sm:flex flex-wrap items-center gap-1.5">
              
              {/* 1. Prioridade da Ação */}
              <div 
                className="flex items-center gap-1 bg-[#635BFF] text-white px-2 py-0.5 rounded font-mono text-xs font-bold shadow-xs"
                title="Prioridade da Ação: Urgência operacional calculada agora"
              >
                <span className="text-[10px] font-normal uppercase opacity-80">Prioridade</span>
                <span>{action.calculatedPriorityScore ?? 96}</span>
              </div>

              {/* 2. Score do Cliente */}
              <div 
                className="flex items-center gap-1 bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded text-[11px] font-medium"
                title="Score do Cliente: Fit da Conta & ICP (0-100)"
              >
                <span className="text-zinc-400 text-[10px]">Cliente</span>
                <span className="font-bold">{action.clientScore ?? action.score}</span>
              </div>

              {/* 3. Score do Serviço */}
              <div 
                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-medium"
                title="Score do Serviço: Aderência da Solução (0-100)"
              >
                <span className="text-indigo-400 text-[10px]">Serviço</span>
                <span className="font-bold">{action.serviceScore ?? 92}</span>
              </div>

              {isOverdue && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded border border-rose-200 animate-pulse">
                  Atrasada
                </span>
              )}
            </div>

            {/* Nome da Empresa */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#111318] tracking-tight hover:text-[#635BFF] transition-colors cursor-pointer"
                  onClick={handleViewCompany}>
                {action.companyName}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mt-0.5">
                <Briefcase className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{action.niche}</span>
                <span>·</span>
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{action.location}</span>
              </div>
            </div>

            {/* Decisor / Contato se houver */}
            {action.targetContactName && (
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-200/60">
                <User className="w-3 h-3 text-[#635BFF]" />
                <span className="font-semibold text-zinc-900">{action.targetContactName}</span>
                {action.targetContactRole && (
                  <span className="text-zinc-400 text-[11px]">({action.targetContactRole})</span>
                )}
              </div>
            )}
          </div>

          {/* COLUNA 2: Serviço, Próxima Ação, Etapa do Funil, Responsável (Desktop lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-2 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-3 lg:pt-0 lg:pl-4">
            
            {/* Serviço & Etapa */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center text-xs font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200/70 px-2.5 py-0.5 rounded">
                <Sparkles className="w-3 h-3 mr-1 text-[#635BFF]" />
                {action.service}
              </span>

              {action.priceSnapshot ? (
                <span 
                  className="inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded"
                  title={`Preço congelado para ${action.priceSnapshot.country}: ${action.priceSnapshot.formattedMyPrice}`}
                >
                  {action.priceSnapshot.formattedMyPrice}
                </span>
              ) : action.potentialValue ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {action.potentialValue}
                </span>
              ) : null}

              <span className="inline-flex items-center text-[11px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
                {action.funnelStageLabel}
              </span>
            </div>

            {/* Próxima Ação */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Próxima ação
              </div>
              <p className="text-sm font-semibold text-zinc-900 mt-0.5 leading-snug">
                {action.nextAction}
              </p>
            </div>

            {/* Horário & Responsável */}
            <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
              <div className="flex items-center gap-1">
                <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500 font-bold' : 'text-zinc-400'}`} />
                <span className={isOverdue ? 'text-rose-700 font-bold' : ''}>{action.time}</span>
                <span className="text-zinc-400">({action.date})</span>
              </div>

              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>{action.responsible}</span>
              </div>
            </div>
          </div>

          {/* COLUNA 3: Canal & Ações Imediatas (Desktop lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-3 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-3 lg:pt-0 lg:pl-4">
            
            {/* Canal Badge */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${channelConfig.color}`}>
                {channelConfig.icon}
                <span>Canal: <strong>{channelConfig.label}</strong></span>
              </span>

              {/* Botão de toggle detalhes */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-zinc-400 hover:text-zinc-700 inline-flex items-center gap-1 py-1 px-2 rounded hover:bg-zinc-100 transition-colors"
                title="Expandir roteiro e detalhes"
              >
                <span>{isExpanded ? 'Menos' : 'Roteiro'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Desktop: Ações Iniciais Obrigatórias */}
            <div className="space-y-2">
              
              {/* Botão Primário: [ABRIR WHATSAPP] / Ligar */}
              {!isCompleted && !isCancelled && (
                <button
                  onClick={handlePrimaryExecution}
                  className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wide uppercase flex items-center justify-center shadow-sm active:scale-[0.98] transition-all ${channelConfig.actionBg}`}
                >
                  {channelConfig.actionIcon}
                  <span>{channelConfig.actionLabel}</span>
                </button>
              )}

              {/* Sub-botões táticos: [VER EMPRESA] [PROGRAMAR] [CONCLUIR] */}
              <div className="grid grid-cols-3 gap-1.5">
                
                {/* [VER EMPRESA] */}
                <button
                  onClick={handleViewCompany}
                  className="py-1.5 px-2 rounded-md border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-700 flex items-center justify-center gap-1 transition-colors"
                  title="Ver ficha completa da empresa"
                >
                  <Building2 className="w-3 h-3 text-zinc-500" />
                  <span className="truncate">EMPRESA</span>
                </button>

                {/* [PROGRAMAR] */}
                <button
                  onClick={handleProgramAction}
                  className="py-1.5 px-2 rounded-md border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-700 flex items-center justify-center gap-1 transition-colors"
                  title="Programar próxima data e canal"
                >
                  <Calendar className="w-3 h-3 text-indigo-500" />
                  <span className="truncate">PROGRAMAR</span>
                </button>

                {/* [CONCLUIR] ou [REABRIR] */}
                {isCompleted ? (
                  <button
                    onClick={() => reopenAction(action.id)}
                    className="py-1.5 px-2 rounded-md border border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-[11px] font-semibold text-zinc-700 flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 text-zinc-500" />
                    <span>REABRIR</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openActionOutcomeModal(action)}
                    className="py-1.5 px-2 rounded-md border border-emerald-200 hover:border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Concluir atividade & calcular próxima ação"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>CONCLUIR</span>
                  </button>
                )}
              </div>

              {/* AÇÕES DE CADÊNCIA PÓS-PRIMEIRA MENSAGEM */}
              {!isCompleted && !isCancelled && (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Ações de Cadência:
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {/* [PROGRAMAR FOLLOW-UP] */}
                    <button
                      type="button"
                      onClick={handleProgramFollowUp}
                      className="py-1.5 px-1.5 rounded-md border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-[10px] font-bold text-indigo-900 dark:text-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Programar data e hora do follow-up"
                    >
                      <Clock className="w-3 h-3 text-[#635BFF] shrink-0" />
                      <span className="truncate">FOLLOW-UP</span>
                    </button>

                    {/* [OBJEÇÃO] */}
                    <button
                      type="button"
                      onClick={handleOpenObjection}
                      className="py-1.5 px-1.5 rounded-md border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-[10px] font-bold text-amber-900 dark:text-amber-200 dark:bg-amber-950/40 dark:border-amber-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Abrir Matriz de Contorno de Objeções"
                    >
                      <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">OBJEÇÃO</span>
                    </button>

                    {/* [PRÓXIMA MENSAGEM] */}
                    <button
                      type="button"
                      onClick={handleNextMessage}
                      className="py-1.5 px-1.5 rounded-md border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 text-[10px] font-bold text-emerald-900 dark:text-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Avançar para a próxima mensagem da sequência"
                    >
                      <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">PRÓX. MSG</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* MODAL / FORM DE CONCLUSÃO COM OBSERVAÇÃO */}
        {isCompleting && (
          <div className="mt-4 pt-3 border-t border-zinc-100 bg-emerald-50/40 p-3 rounded-lg animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Concluir Ação: {action.nextAction}
              </span>
              <button 
                onClick={() => setIsCompleting(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Cancelar
              </button>
            </div>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Adicionar nota sobre o contato (ex: Decisora pediu retorno amanhã às 15h)..."
              rows={2}
              className="w-full text-xs p-2 rounded border border-emerald-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-2.5"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsCompleting(false)}
                className="px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 rounded"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCompletion}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmar Conclusão
              </button>
            </div>
          </div>
        )}

        {/* DETALHES EXPANDIDOS (Script, Roteiro e Observações) */}
        {isExpanded && (
          <div className="mt-4 pt-3 border-t border-zinc-100 space-y-3 animate-fadeIn">
            
            {/* Script Text */}
            {action.scriptText && (
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200/70">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-[#635BFF]" />
                    Script Sugerido para Abordagem
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(action.scriptText || '');
                    }}
                    className="text-[11px] font-semibold text-[#635BFF] hover:underline"
                  >
                    Copiar Script
                  </button>
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed font-sans italic bg-white p-2.5 rounded border border-zinc-200/60">
                  "{action.scriptText}"
                </p>
              </div>
            )}

            {/* Condições Comerciais Congeladas (Imutabilidade Histórica) */}
            {action.priceSnapshot && (
              <div className="text-xs bg-emerald-50/50 p-2.5 rounded border border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-emerald-950">Condições Comerciais ({action.priceSnapshot.country}): </span>
                  <span className="font-semibold text-emerald-800">{action.priceSnapshot.formattedMyPrice}</span>
                  <span className="text-zinc-400 mx-1.5">|</span>
                  <span className="text-zinc-600">Mercado: {action.priceSnapshot.formattedMarketMin} a {action.priceSnapshot.formattedMarketMax}</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Snapshot v{action.priceSnapshot.serviceVersion} ({action.priceSnapshot.snapshotDate})
                </span>
              </div>
            )}

            {/* Observações Estratégicas */}
            {action.observation && (
              <div className="text-xs text-zinc-600 bg-amber-50/50 p-2.5 rounded border border-amber-200/50">
                <span className="font-bold text-amber-900">Observação Comercial: </span>
                {action.observation}
              </div>
            )}

            {/* Justificativa do Algoritmo de Prioridade */}
            {action.priorityReasons && action.priorityReasons.length > 0 && (
              <div className="text-[11px] text-zinc-500 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-zinc-700">Fatores de Prioridade:</span>
                {action.priorityReasons.map((r, i) => (
                  <span key={i} className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-[10px]">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
