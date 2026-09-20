import React, { useState, useEffect } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { ObjectionEntity, ObjectionSequence, ObjectionStepResponse } from '../../core/types/objection';
import { Company } from '../../core/types/company';
import { interpolateObjectionScript, buildWhatsAppLink, formatObjectionDelay } from '../../core/utils/objectionInterpolator';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  ShieldAlert,
  Send,
  Copy,
  Check,
  Search,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Building2,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  Phone
} from 'lucide-react';

interface ObjectionDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: Company | null;
  actionId?: string;
  initialObjectionId?: string;
  preselectedObjectionId?: string;
}

export const ObjectionDispatchModal: React.FC<ObjectionDispatchModalProps> = ({
  isOpen,
  onClose,
  company: initialCompany,
  actionId,
  initialObjectionId,
  preselectedObjectionId,
}) => {
  const effectiveInitialObjectionId = initialObjectionId || preselectedObjectionId;
  const {
    objectionsEntities,
    companies,
    recordObjectionHandled,
    completeAction,
    userName,
    setActiveNav
  } = useLeadion();

  const { showToast } = useToast();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(initialCompany?.id || companies[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObjectionId, setSelectedObjectionId] = useState<string>(effectiveInitialObjectionId || objectionsEntities[0]?.id || '');
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>('');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [manualPhone, setManualPhone] = useState('');

  // Sincroniza props
  useEffect(() => {
    if (initialCompany?.id) {
      setSelectedCompanyId(initialCompany.id);
    }
    if (effectiveInitialObjectionId) {
      setSelectedObjectionId(effectiveInitialObjectionId);
    }
  }, [initialCompany, effectiveInitialObjectionId, isOpen]);

  const activeCompany = companies.find((c) => c.id === selectedCompanyId) || initialCompany || companies[0];

  // Filtra objeções por busca
  const filteredObjections = objectionsEntities.filter((obj) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      obj.name.toLowerCase().includes(q) ||
      obj.category.toLowerCase().includes(q) ||
      obj.description.toLowerCase().includes(q) ||
      obj.conditions.some((c) => c.toLowerCase().includes(q))
    );
  });

  const currentObjection = objectionsEntities.find((o) => o.id === selectedObjectionId) || filteredObjections[0] || objectionsEntities[0];

  // Sincroniza a sequência ao trocar de objeção
  useEffect(() => {
    if (currentObjection && currentObjection.sequences.length > 0) {
      const defaultSeq = currentObjection.sequences.find((s) => s.isDefault) || currentObjection.sequences[0];
      setSelectedSequenceId(defaultSeq.id);
      setSelectedStepIndex(0);
    } else {
      setSelectedSequenceId('');
      setSelectedStepIndex(0);
    }
  }, [currentObjection]);

  const currentSequence = currentObjection?.sequences.find((s) => s.id === selectedSequenceId) || currentObjection?.sequences[0];
  const currentStep = currentSequence?.steps[selectedStepIndex] || currentSequence?.steps[0];

  // Atualiza mensagem interpolada sempre que muda empresa, step ou sequência
  useEffect(() => {
    if (currentStep) {
      const interpolated = interpolateObjectionScript(currentStep.content, activeCompany, userName);
      setCustomMessage(interpolated);
    }
  }, [currentStep, activeCompany, userName]);

  // Telefone resolvido
  const targetPhone = activeCompany?.phone || activeCompany?.whatsapp || manualPhone;

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    showToast({
      type: 'info',
      title: 'Resposta Copiada!',
      message: 'Script de objeção copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const rawNumber = targetPhone || '';
    const cleanNumber = rawNumber.replace(/\D/g, '');

    if (!cleanNumber && !manualPhone) {
      showToast({
        type: 'warning',
        title: 'Número Ausente',
        message: 'Por favor, informe o número de WhatsApp no campo abaixo para abrir.',
      });
      return;
    }

    const effectiveNumber = cleanNumber || manualPhone.replace(/\D/g, '');

    if (activeCompany) {
      recordObjectionHandled(
        activeCompany.id,
        currentObjection?.name || 'Objeção',
        currentSequence?.name || 'Sequência',
        currentStep?.name || 'Resposta',
        currentStep?.stepType || 'response_1',
        customMessage,
        actionId,
        `Contorno disparado no WhatsApp para ${activeCompany.name}. Decisor: ${activeCompany.decisionMakerName || 'Não especificado'}.`
      );
    }

    // Se houver uma ação da fila de prospecção do dia vinculada, oferece concluir
    if (actionId) {
      completeAction(actionId, `Objeção contornada (${currentObjection?.name}) via WhatsApp.`);
    }

    const waUrl = buildWhatsAppLink(effectiveNumber, customMessage);
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    showToast({
      type: 'success',
      title: 'WhatsApp Aberto com Sucesso!',
      message: `Resposta preparada para ${activeCompany?.name || 'o lead'}. Registrado na timeline.`,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tratamento de Objeções no WhatsApp"
      size="xl"
    >
      <div className="space-y-5">
        
        {/* Banner do Lead Selecionado */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Lead em Atendimento:</span>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.decisionMakerName ? `(${c.decisionMakerName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
                <span>{activeCompany?.city || 'Localidade'} · {activeCompany?.country || 'Moçambique'}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {targetPhone ? `Tel/WA: ${targetPhone}` : 'Sem telefone salvo'}
                </span>
              </p>
            </div>
          </div>

          {!targetPhone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              <input
                type="text"
                placeholder="Digitar WhatsApp (ex: +258 84...)"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 text-xs bg-amber-50/50 dark:bg-amber-950/30 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}
        </div>

        {/* 1. SELEÇÃO DA OBJEÇÃO */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              1. Qual objeção o lead apresentou?
            </label>

            {/* Busca rápida */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar trava (ex: caro, pensar...)"
                className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
              />
            </div>
          </div>

          {/* Grade de Botões de Objeções */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-2">
            {filteredObjections.map((obj) => {
              const isSelected = selectedObjectionId === obj.id;
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => setSelectedObjectionId(obj.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs ring-1 ring-amber-500'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{obj.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                      {obj.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 font-normal">
                    {obj.sequences.length} mini-funis
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. PSICOLOGIA & SELETOR DE SEQUÊNCIA */}
        {currentObjection && (
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
            <div className="flex items-start gap-2 text-xs">
              <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950 dark:text-amber-200">
                  O que o lead realmente quer dizer:
                </span>
                <p className="text-amber-900/90 dark:text-amber-300 italic mt-0.5">
                  &ldquo;{currentObjection.description}&rdquo;
                </p>
              </div>
            </div>

            {/* Seletor de Sequências Disponíveis */}
            {currentObjection.sequences.length > 0 && (
              <div className="pt-2 border-t border-amber-200/50 dark:border-amber-900/40 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  2. Escolha o Mini-Funil / Sequência de Reversão:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentObjection.sequences.map((seq) => {
                    const isSelected = selectedSequenceId === seq.id;
                    return (
                      <button
                        key={seq.id}
                        type="button"
                        onClick={() => {
                          setSelectedSequenceId(seq.id);
                          setSelectedStepIndex(0);
                        }}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[#635BFF] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs'
                            : 'border-amber-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:bg-white'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{seq.name}</div>
                          <div className="text-[10px] text-zinc-500 line-clamp-1">{seq.description}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#635BFF] shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. MINI-FUNIL: NÓS DE ETAPA (Resposta 1 → Nova Reação → Resposta 2 → Follow-up → Próxima Etapa) */}
        {currentSequence && currentSequence.steps.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#635BFF]" />
              3. Selecione a etapa da conversa que deseja enviar agora:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {currentSequence.steps.map((st, idx) => {
                const isSelected = selectedStepIndex === idx;
                const isReaction = st.stepType === 'reaction';
                return (
                  <button
                    key={st.id || idx}
                    type="button"
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#635BFF] bg-[#635BFF]/10 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs ring-1 ring-[#635BFF]'
                        : isReaction
                        ? 'border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {formatObjectionDelay(st.delay)}
                      </span>
                    </div>
                    <span className="text-xs font-semibold line-clamp-1">{st.name}</span>
                    <span className="text-[9px] uppercase font-bold text-zinc-400 mt-1">
                      {st.stepType === 'response_1' && 'Primeiro Desarme'}
                      {st.stepType === 'reaction' && 'Nova Reação'}
                      {st.stepType === 'response_2' && 'Aprofundamento'}
                      {st.stepType === 'followup' && 'Follow-up'}
                      {st.stepType === 'next_stage' && 'Avanço de Etapa'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. PREVISÃO & EDIÇÃO DA RESPOSTA PREPARADA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              4. Mensagem Preparada para {activeCompany?.name} (Edição Livre):
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-[#635BFF] hover:underline flex items-center gap-1 font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF] font-sans leading-relaxed"
          />

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Variáveis substituídas automaticamente com os dados da empresa.</span>
            <span>{customMessage.length} caracteres</span>
          </div>
        </div>

        {/* 5. AÇÕES DO FOOTER COM [ABRIR WHATSAPP] */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copiado' : 'Apenas Copiar'}
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleOpenWhatsApp}
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold shadow-md"
              icon={<Send className="w-4 h-4" />}
            >
              [ABRIR WHATSAPP COM RESPOSTA PREPARADA]
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
};
