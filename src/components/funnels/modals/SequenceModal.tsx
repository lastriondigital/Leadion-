import React, { useState, useEffect } from 'react';
import { FunnelSequence } from '../../../core/types/funnel';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

interface SequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; objective?: string }) => void;
  sequence?: FunnelSequence | null;
}

export const SequenceModal: React.FC<SequenceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sequence,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sequence) {
      setName(sequence.name);
      setDescription(sequence.description || '');
      setObjective(sequence.objective || '');
    } else {
      setName('');
      setDescription('');
      setObjective('');
    }
    setError(null);
  }, [sequence, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da sequência é obrigatório.');
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      objective: objective.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sequence ? 'Editar Sequência' : 'Nova Sequência'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Nome da sequência <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Primeiro contacto"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Objetivo (opcional)
          </label>
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Ex: Obter resposta ou qualificar decisor"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
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
            placeholder="Orientações e contexto operacional para esta sequência..."
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {sequence ? 'Salvar alterações' : 'Criar sequência'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
