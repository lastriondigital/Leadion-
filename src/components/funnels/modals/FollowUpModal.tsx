import React, { useState, useEffect } from 'react';
import { 
  MessageFollowUp, 
  FollowUpCondition, 
  FOLLOWUP_CONDITIONS, 
  FunnelSequence, 
  FunnelEntity 
} from '../../../core/types/funnel';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    delayValue: number;
    delayUnit: 'dias' | 'horas' | 'minutos' | 'semanas';
    condition: FollowUpCondition;
    content: string;
    targetType?: 'sequence' | 'message' | 'follow_up' | 'transition' | 'end' | 'custom';
    targetId?: string;
    targetFunnelId?: string;
    targetSequenceId?: string;
  }) => void;
  followUp?: MessageFollowUp | null;
  parentMessageName?: string;
  availableSequences?: FunnelSequence[];
  availableFunnels?: FunnelEntity[];
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  followUp,
  parentMessageName,
  availableSequences = [],
  availableFunnels = [],
}) => {
  const [name, setName] = useState('');
  const [delayValue, setDelayValue] = useState<number>(2);
  const [delayUnit, setDelayUnit] = useState<'dias' | 'horas' | 'minutos' | 'semanas'>('dias');
  const [condition, setCondition] = useState<FollowUpCondition>('nao_respondeu');
  const [content, setContent] = useState('');
  
  // Próximo destino
  const [targetType, setTargetType] = useState<'sequence' | 'transition' | 'end' | 'none'>('none');
  const [targetSequenceId, setTargetSequenceId] = useState('');
  const [targetFunnelId, setTargetFunnelId] = useState('');
  const [targetFunnelSeqId, setTargetFunnelSeqId] = useState('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (followUp) {
      setName(followUp.name);
      setDelayValue(followUp.delayValue);
      setDelayUnit(followUp.delayUnit);
      setCondition(followUp.condition);
      setContent(followUp.content);
      
      if (followUp.targetType === 'transition' || followUp.targetFunnelId) {
        setTargetType('transition');
        setTargetFunnelId(followUp.targetFunnelId || '');
        setTargetFunnelSeqId(followUp.targetSequenceId || '');
      } else if (followUp.targetType === 'sequence' || followUp.targetId) {
        setTargetType('sequence');
        setTargetSequenceId(followUp.targetId || '');
      } else if (followUp.condition === 'encerramento' || followUp.targetType === 'end') {
        setTargetType('end');
      } else {
        setTargetType('none');
      }
    } else {
      setName('Follow-up de Reforço');
      setDelayValue(2);
      setDelayUnit('dias');
      setCondition('nao_respondeu');
      setContent('');
      setTargetType('none');
      setTargetSequenceId('');
      setTargetFunnelId('');
      setTargetFunnelSeqId('');
    }
    setError(null);
  }, [followUp, isOpen]);

  const selectedTargetFunnel = availableFunnels.find((f) => f.id === targetFunnelId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do follow-up é obrigatório.');
      return;
    }
    if (!content.trim() && condition !== 'encerramento') {
      setError('O conteúdo da mensagem de follow-up não pode ficar vazio.');
      return;
    }

    let finalTargetType: 'sequence' | 'transition' | 'end' | 'custom' | undefined = undefined;
    let finalTargetId: string | undefined = undefined;
    let finalTargetFunnelId: string | undefined = undefined;
    let finalTargetSequenceId: string | undefined = undefined;

    if (targetType === 'sequence' && targetSequenceId) {
      finalTargetType = 'sequence';
      finalTargetId = targetSequenceId;
    } else if (targetType === 'transition' && targetFunnelId) {
      finalTargetType = 'transition';
      finalTargetFunnelId = targetFunnelId;
      finalTargetSequenceId = targetFunnelSeqId || undefined;
    } else if (targetType === 'end') {
      finalTargetType = 'end';
    }

    onSubmit({
      name: name.trim(),
      delayValue: Math.max(1, Number(delayValue) || 1),
      delayUnit,
      condition,
      content: content.trim(),
      targetType: finalTargetType,
      targetId: finalTargetId,
      targetFunnelId: finalTargetFunnelId,
      targetSequenceId: finalTargetSequenceId,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={followUp ? 'Configuração do Follow-up' : 'Novo Follow-up da Mensagem'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {parentMessageName && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 pb-1 border-b border-zinc-100 dark:border-zinc-800">
            Vinculado à mensagem: <strong className="text-zinc-800 dark:text-zinc-200">{parentMessageName}</strong>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Nome do follow-up <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Follow-up 01 (Gancho de autoridade)"
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Executar depois de
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={365}
                value={delayValue}
                onChange={(e) => setDelayValue(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
              <select
                value={delayUnit}
                onChange={(e) => setDelayUnit(e.target.value as any)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              >
                <option value="dias">dias</option>
                <option value="horas">horas</option>
                <option value="semanas">semanas</option>
                <option value="minutos">minutos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Condição de disparo
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as FollowUpCondition)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              {FOLLOWUP_CONDITIONS.map((cond) => (
                <option key={cond.value} value={cond.value}>
                  {cond.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {condition !== 'encerramento' && (
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Mensagem de follow-up <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Olá {{contact.first_name}}, passando para checar se conseguiu conferir nossa última mensagem sobre a {{company.name}}..."
              className="w-full font-mono text-xs px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF] leading-relaxed"
            />
          </div>
        )}

        {/* Próximo destino */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Próximo destino após este follow-up
          </label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as any)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          >
            <option value="none">Nenhum (aguardar ou encadear no fluxo)</option>
            <option value="sequence">Avançar para outra Sequência deste funil</option>
            <option value="transition">↗ Iniciar outro funil (Transição)</option>
            <option value="end">Encerrar jornada / Descarte</option>
          </select>

          {targetType === 'sequence' && (
            <div className="mt-2">
              <label className="block text-[11px] text-zinc-500 mb-1">Selecione a sequência de destino:</label>
              <select
                value={targetSequenceId}
                onChange={(e) => setTargetSequenceId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="">Selecione uma sequência...</option>
                {availableSequences.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.messages?.length || 0} mensagens)
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'transition' && (
            <div className="mt-2 space-y-2 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Funil de destino:
                </label>
                <select
                  value={targetFunnelId}
                  onChange={(e) => {
                    setTargetFunnelId(e.target.value);
                    setTargetFunnelSeqId('');
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="">Selecione o funil de destino...</option>
                  {availableFunnels.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTargetFunnel && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Sequência de entrada no novo funil:
                  </label>
                  <select
                    value={targetFunnelSeqId}
                    onChange={(e) => setTargetFunnelSeqId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">Sequência inicial padrão</option>
                    {(selectedTargetFunnel.sequences || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
};
