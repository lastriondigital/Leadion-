import React, { useState } from 'react';
import { FunnelEntity, FunnelChannel, FunnelObjective, FUNNEL_CHANNELS, FUNNEL_OBJECTIVES } from '../../../core/types/funnel';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { GitFork, MessageSquare } from 'lucide-react';

interface NewFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    channel: FunnelChannel;
    objective: FunnelObjective;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const NewFunnelModal: React.FC<NewFunnelModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState<FunnelChannel>('whatsapp');
  const [objective, setObjective] = useState<FunnelObjective>('primeiro_contacto');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do funil é obrigatório.');
      return;
    }
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        channel,
        objective,
      });
      setName('');
      setDescription('');
      setChannel('whatsapp');
      setObjective('primeiro_contacto');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar funil.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Funil de Prospecção" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Nome do funil <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Prospecção Inicial Outbound"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Descrição (opcional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Cadência multicanal focada em decisores com follow-up automático"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Canal principal
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

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Objetivo
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as FunnelObjective)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              {FUNNEL_OBJECTIVES.map((obj) => (
                <option key={obj.value} value={obj.value}>
                  {obj.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Criar funil
          </Button>
        </div>
      </form>
    </Modal>
  );
};
