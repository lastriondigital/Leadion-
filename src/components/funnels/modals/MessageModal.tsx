import React, { useState, useEffect } from 'react';
import { SequenceMessage, FunnelChannel, FUNNEL_CHANNELS } from '../../../core/types/funnel';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    internalName: string;
    channel: FunnelChannel;
    content: string;
  }) => void;
  message?: SequenceMessage | null;
  defaultChannel?: FunnelChannel;
}

const VARIABLE_TAGS = [
  { tag: '{{contact.first_name}}', label: 'Primeiro nome do contato' },
  { tag: '{{contact.name}}', label: 'Nome completo do contato' },
  { tag: '{{company.name}}', label: 'Nome da empresa' },
  { tag: '{{company.country}}', label: 'País da empresa' },
  { tag: '{{company.city}}', label: 'Cidade da empresa' },
  { tag: '{{service.name}}', label: 'Serviço ofertado' },
  { tag: '{{sender.name}}', label: 'Nome do operador' },
];

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  message,
  defaultChannel = 'whatsapp',
}) => {
  const [internalName, setInternalName] = useState('');
  const [channel, setChannel] = useState<FunnelChannel>(defaultChannel);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setInternalName(message.internalName);
      setChannel(message.channel);
      setContent(message.content);
    } else {
      setInternalName('');
      setChannel(defaultChannel);
      setContent('');
    }
    setError(null);
  }, [message, defaultChannel, isOpen]);

  const insertVariable = (tag: string) => {
    setContent((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + tag + ' ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalName.trim()) {
      setError('O nome interno da mensagem é obrigatório.');
      return;
    }
    if (!content.trim()) {
      setError('O conteúdo da mensagem não pode ficar vazio.');
      return;
    }
    onSubmit({
      internalName: internalName.trim(),
      channel,
      content: content.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={message ? 'Editar Mensagem da Sequência' : 'Nova Mensagem da Sequência'}
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
              Nome interno da mensagem <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={internalName}
              onChange={(e) => setInternalName(e.target.value)}
              placeholder="Ex: Primeira abordagem direta"
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Conteúdo da mensagem <span className="text-red-500">*</span>
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
            placeholder="Olá {{contact.first_name}}, vi que a {{company.name}} tem se destacado no mercado..."
            className="w-full font-mono text-xs px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF] leading-relaxed"
          />

          {/* Variáveis dinâmicas para inserção rápida */}
          <div className="mt-2">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
              Inserir variáveis reais:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLE_TAGS.map(({ tag, label }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertVariable(tag)}
                  title={label}
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
            Salvar mensagem
          </Button>
        </div>
      </form>
    </Modal>
  );
};
