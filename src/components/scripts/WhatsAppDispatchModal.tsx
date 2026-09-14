import React, { useState, useMemo } from 'react';
import { Company } from '../../core/types/company';
import { ScriptEntity, WhatsAppDispatchStatus } from '../../core/types/script';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { 
  replaceScriptVariables, 
  buildWhatsAppLink, 
  formatScriptDelayLabel 
} from '../../core/utils/scriptVariables';
import { 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle,
  Calendar,
  ShieldAlert,
  ArrowRight,
  User,
  Building2,
  Phone,
  Sparkles
} from 'lucide-react';

interface WhatsAppDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  script?: ScriptEntity | null;
  customMessage?: string;
  recipientPhoneOverride?: string;
  recipientNameOverride?: string;
  actionId?: string;
  onProgramFollowUp?: () => void;
  onOpenObjection?: () => void;
  onNextMessage?: () => void;
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  isOpen,
  onClose,
  company,
  script,
  customMessage,
  recipientPhoneOverride,
  recipientNameOverride,
  actionId,
  onProgramFollowUp,
  onOpenObjection,
  onNextMessage,
}) => {
  const { services, recordWhatsAppDispatch, completeAction, scriptsEntities } = useLeadion();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<WhatsAppDispatchStatus>('preparado');
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Identifica serviço vinculado
  const linkedService = useMemo(() => {
    if (script?.serviceId && script.serviceId !== 'all') {
      return services.find((s) => s.id === script.serviceId);
    }
    if (company.associatedServices && company.associatedServices.length > 0) {
      return services.find((s) => s.id === company.associatedServices[0]);
    }
    return services[0] || null;
  }, [script, company, services]);

  // Contato destinatário
  const recipientContact = useMemo(() => {
    if (company.responsibles && company.responsibles.length > 0) {
      const primary = company.responsibles.find((r) => r.isPrimary);
      return primary || company.responsibles[0];
    }
    return null;
  }, [company]);

  const recipientName = recipientNameOverride || recipientContact?.name || company.targetContactName || 'Decisor(a)';
  const recipientRole = recipientContact?.role || company.targetContactRole || 'Responsável Comercial';
  const targetPhone = recipientPhoneOverride || recipientContact?.whatsapp || recipientContact?.phone || company.whatsapp || company.phone || '';

  // Mensagem final formatada
  const rawContent = customMessage || script?.content || 'Olá, {{nome}}! Vi a {{empresa}} e gostaria de apresentar nossa proposta.';
  const resolvedMessage = useMemo(() => {
    return replaceScriptVariables(rawContent, company, linkedService, 'Manuel Domingos');
  }, [rawContent, company, linkedService]);

  // Link do WhatsApp
  const whatsappUrl = useMemo(() => {
    return buildWhatsAppLink(targetPhone, resolvedMessage);
  }, [targetPhone, resolvedMessage]);

  if (!isOpen) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(resolvedMessage);
    setCopied(true);
    showToast({
      type: 'info',
      title: 'Mensagem Copiada',
      message: 'Texto copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!targetPhone) {
      showToast({
        type: 'error',
        title: 'Sem Telefone Cadastrado',
        message: 'Esta empresa ou decisor não possui telefone/WhatsApp cadastrado.',
      });
      return;
    }

    setHasOpenedWhatsApp(true);
    setSelectedStatus('aberto');
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    showToast({
      type: 'success',
      title: 'WhatsApp Disparado',
      message: 'A conversa foi aberta no navegador com a mensagem preenchida.',
    });
  };

  const handleConfirmStatus = (statusToSave?: WhatsAppDispatchStatus) => {
    const finalStatus = statusToSave || selectedStatus;
    setIsSubmitting(true);

    recordWhatsAppDispatch(
      company.id,
      script?.id || 'manual',
      finalStatus,
      notes || `Disparo de mensagem via WhatsApp: ${script?.name || 'Manual'} (${finalStatus})`
    );

    // Se estiver associado a uma ação da fila diária e o usuário enviou manualmente, conclui a ação
    if (actionId && (finalStatus === 'enviado_manualmente' || finalStatus === 'aberto')) {
      completeAction(actionId, `Mensagem de WhatsApp realizada com sucesso (${finalStatus})`);
    }

    showToast({
      type: 'success',
      title: 'Registro Salvo no Histórico',
      message: `Status da comunicação: "${finalStatus.replace('_', ' ').toUpperCase()}".`,
    });

    setIsSubmitting(false);
  };

  const handleStatusSelectAndSave = (status: WhatsAppDispatchStatus) => {
    setSelectedStatus(status);
    handleConfirmStatus(status);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#141720] rounded-2xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header com Identidade WhatsApp */}
        <div className="px-5 py-4 bg-[#075E54] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold shadow-xs">
              <MessageSquare className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  Disparo de Conversa WhatsApp
                </h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                  Sem Envio Automático Falso
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                O Leadion prepara o link direto e você envia manualmente no WhatsApp Web / App.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Detalhes do Contato e Prévia de Conversa */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Card de Dados do Destinatário */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#635BFF]" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {recipientName}
                </span>
                <span className="text-[11px] text-zinc-500">
                  ({recipientRole})
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-zinc-400" />
                  <strong>{company.name}</strong>
                </span>
                <span>·</span>
                <span>{company.city || company.location}</span>
                <span>·</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{company.country}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-lg text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{targetPhone || 'Sem telefone'}</span>
              </div>
            </div>
          </div>

          {/* Script Selecionado & Metadados */}
          {script && (
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-500">Roteiro Ativo:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {script.name}
                </span>
              </div>
              {script.delay && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>Delay sugerido: {formatScriptDelayLabel(script.delay)}</span>
                </div>
              )}
            </div>
          )}

          {/* Prévia de Conversa Real (Estilo WhatsApp) */}
          <div className="rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-800 shadow-inner bg-[#EFEAE2] dark:bg-[#0B141A]">
            
            {/* Barra superior de chat simulado */}
            <div className="px-3.5 py-2 bg-[#F0F2F5] dark:bg-[#202C33] border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#128C7E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {recipientName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-zinc-800 dark:text-zinc-100 leading-none">
                    {recipientName}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">online</span>
                </div>
              </div>

              <button
                onClick={handleCopyText}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded hover:bg-zinc-50 transition-colors"
                title="Copiar texto da mensagem"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
              </button>
            </div>

            {/* Área de mensagens do WhatsApp */}
            <div className="p-4 space-y-2 min-h-[140px] flex flex-col justify-end bg-radial from-transparent to-black/5">
              <div className="max-w-[85%] self-end bg-[#D9FDD3] dark:bg-[#005C4B] text-zinc-900 dark:text-zinc-100 rounded-lg rounded-tr-none p-3 shadow-xs text-xs leading-relaxed whitespace-pre-line relative">
                {resolvedMessage}
                <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-zinc-500 dark:text-emerald-200">
                  <span>Hoje, 09:30</span>
                  <span className="font-bold text-[#53BDEB]">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTÃO PRINCIPAL: [ABRIR WHATSAPP] */}
          <div className="pt-1">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 fill-white" />
              <span>ABRIR WHATSAPP</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-center text-zinc-500 dark:text-zinc-400 mt-1.5">
              Abre a conversa oficial no WhatsApp Web ou App para <strong>{targetPhone}</strong> com o texto preenchido.
            </p>
          </div>

          {/* REGISTRO DE STATUS DA MENSAGEM (Obrigatório do Usuário) */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#635BFF]" />
                Registrar Status do Envio:
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Auditoria Comercial
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              
              {/* 1. Preparado */}
              <button
                type="button"
                onClick={() => handleStatusSelectAndSave('preparado')}
                className={`p-2 rounded-lg border text-left text-xs transition-all flex flex-col gap-1 ${
                  selectedStatus === 'preparado'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">1. Preparado</span>
                  {selectedStatus === 'preparado' && <Check className="w-3 h-3 text-blue-600" />}
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight">Texto revisado, pronto</span>
              </button>

              {/* 2. Aberto */}
              <button
                type="button"
                onClick={() => handleStatusSelectAndSave('aberto')}
                className={`p-2 rounded-lg border text-left text-xs transition-all flex flex-col gap-1 ${
                  selectedStatus === 'aberto'
                    ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">2. Aberto</span>
                  {selectedStatus === 'aberto' && <Check className="w-3 h-3 text-amber-600" />}
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight">Janela/App carregado</span>
              </button>

              {/* 3. Enviado Manualmente */}
              <button
                type="button"
                onClick={() => handleStatusSelectAndSave('enviado_manualmente')}
                className={`p-2 rounded-lg border text-left text-xs transition-all flex flex-col gap-1 ${
                  selectedStatus === 'enviado_manualmente'
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">3. Enviado Manual</span>
                  {selectedStatus === 'enviado_manualmente' && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight">Disparo confirmado no WA</span>
              </button>

              {/* 4. Não Enviado */}
              <button
                type="button"
                onClick={() => handleStatusSelectAndSave('nao_enviado')}
                className={`p-2 rounded-lg border text-left text-xs transition-all flex flex-col gap-1 ${
                  selectedStatus === 'nao_enviado'
                    ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">4. Não Enviado</span>
                  {selectedStatus === 'nao_enviado' && <Check className="w-3 h-3 text-rose-600" />}
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight">Desistência ou erro</span>
              </button>
            </div>

            {/* Observações de Envio */}
            <div className="pt-1">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observação opcional (ex: Decisora visualizou imediatamente)..."
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
              />
            </div>
          </div>

          {/* AÇÕES DE PROSPECÇÃO PÓS-MENSAGEM:
              [PROGRAMAR FOLLOW-UP] [OBJEÇÃO] [PRÓXIMA MENSAGEM] */}
          <div className="p-3.5 bg-indigo-50/60 dark:bg-[#1E1D38]/50 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#635BFF]" />
                Ações Imediatas Pós-Mensagem:
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                Próximo Passo na Cadência
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              
              {/* [PROGRAMAR FOLLOW-UP] */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onProgramFollowUp) {
                    onProgramFollowUp();
                  }
                }}
                className="py-2.5 px-3 rounded-lg border border-indigo-200 bg-white dark:bg-zinc-800 hover:bg-indigo-50 text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#635BFF]" />
                <span>PROGRAMAR FOLLOW-UP</span>
              </button>

              {/* [OBJEÇÃO] */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenObjection) {
                    onOpenObjection();
                  }
                }}
                className="py-2.5 px-3 rounded-lg border border-amber-200 bg-white dark:bg-zinc-800 hover:bg-amber-50 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>OBJEÇÃO</span>
              </button>

              {/* [PRÓXIMA MENSAGEM] */}
              <button
                type="button"
                onClick={() => {
                  if (onNextMessage) {
                    onNextMessage();
                  } else {
                    onClose();
                  }
                }}
                className="py-2.5 px-3 rounded-lg border border-[#635BFF] bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>PRÓXIMA MENSAGEM</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>
          </div>

        </div>

        {/* Footer com Fechar & Salvar */}
        <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium"
          >
            Fechar Janela
          </button>

          <button
            type="button"
            onClick={() => {
              handleConfirmStatus();
              onClose();
            }}
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            Salvar e Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
