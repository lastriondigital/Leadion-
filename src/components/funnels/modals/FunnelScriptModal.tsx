import React, { useState, useEffect } from 'react';
import { FunnelScript, FunnelChannel, FUNNEL_CHANNELS, FunnelSequence } from '../../../core/types/funnel';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

interface FunnelScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    channel: FunnelChannel;
    sequenceId?: string;
    messageId?: string;
    situation?: string;
  }) => void;
  script?: FunnelScript | null;
  sequences?: FunnelSequence[];
  defaultChannel?: FunnelChannel;
}

const VARIABLE_TAGS = [
  '{{contact.first_name}}',
  '{{contact.name}}',
  '{{contact.role}}',
  '{{company.name}}',
  '{{company.country}}',
  '{{company.city}}',
  '{{company.phone}}',
  '{{service.name}}',
  '{{sender.name}}',
];

export const FunnelScriptModal: React.FC<FunnelScriptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  script,
  sequences = [],
  defaultChannel = 'whatsapp',
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState<FunnelChannel>(defaultChannel);
  const [sequenceId, setSequenceId] = useState('');
  const [messageId, setMessageId] = useState('');
  const [situation, setSituation] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (script) {
      setTitle(script.title);
      setContent(script.content);
      setChannel(script.channel);
      setSequenceId(script.sequenceId || '');
      setMessageId(script.messageId || '');
      setSituation(script.situation || '');
    } else {
      setTitle('');
      setContent('');
      setChannel(defaultChannel);
      setSequenceId('');
      setMessageId('');
      setSituation('');
    }
    setError(null);
  }, [script, defaultChannel, isOpen]);

  const selectedSeq = sequences.find((s) => s.id === sequenceId);

  const insertVariable = (tag: string) => {
    setContent((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + tag + ' ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título do script é obrigatório.');
      return;
    }
    if (!content.trim()) {
      setError('O conteúdo do script não pode ficar vazio.');
      return;
    }

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      channel,
      sequenceId: sequenceId || undefined,
      messageId: messageId || undefined,
      situation: situation.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={script ? 'Editar Script do Funil' : 'Novo Script do Funil'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Título do script <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Resposta para 'mande mais informações'"
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Canal
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as FunnelChannel)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              {FUNNEL_CHANNELS.map((ch) => (
                <option key={ch.value} value={ch.value}>
                  {ch.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Vincular a uma sequência (opcional)
            </label>
            <select
              value={sequenceId}
              onChange={(e) => {
                setSequenceId(e.target.value);
                setMessageId('');
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              <option value="">Geral do Funil</option>
              {sequences.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Situação / Condição (opcional)
            </label>
            <input
              type="text"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Ex: Não tenho interesse / Quanto custa?"
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Texto do script <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-zinc-400">
              {content.length} caracteres
            </span>
          </div>

          <textarea
            rows={5}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Perfeito, {{contact.first_name}}. Entendo totalmente o momento da {{company.name}}..."
            className="w-full font-mono text-xs px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF] leading-relaxed"
          />

          <div className="mt-2">
            <span className="text-[11px] font-medium text-zinc-500 block mb-1">
              Inserir variáveis reais:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertVariable(tag)}
                  className="px-2 py-0.5 text-[11px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-[#635BFF]/10 hover:text-[#635BFF] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Salvar script
          </Button>
        </div>
      </form>
    </Modal>
  );
};
