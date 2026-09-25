import React, { useState, useEffect } from 'react';
import { FlowEdge, FlowNode, FOLLOWUP_CONDITIONS, FollowUpCondition } from '../../../core/types/funnel';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Trash2 } from 'lucide-react';

interface EdgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  edge: FlowEdge | null;
  nodes: FlowNode[];
  onSave: (edgeId: string, updates: { condition: string; label: string; targetNodeId: string }) => void;
  onDelete: (edgeId: string) => void;
}

export const EdgeModal: React.FC<EdgeModalProps> = ({
  isOpen,
  onClose,
  edge,
  nodes,
  onSave,
  onDelete,
}) => {
  const [condition, setCondition] = useState<string>('nao_respondeu');
  const [label, setLabel] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');

  useEffect(() => {
    if (edge) {
      setCondition(edge.condition || 'nao_respondeu');
      setLabel(edge.label || '');
      setTargetNodeId(edge.targetNodeId || '');
    }
  }, [edge, isOpen]);

  if (!edge) return null;

  const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(edge.id, {
      condition,
      label: label.trim() || condition,
      targetNodeId,
    });
    onClose();
  };

  const handleConditionChange = (newCond: string) => {
    setCondition(newCond);
    const matched = FOLLOWUP_CONDITIONS.find((c) => c.value === newCond);
    if (matched) {
      setLabel(matched.label);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Conexão do Fluxo" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Origem
          </label>
          <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {sourceNode?.title || edge.sourceNodeId} ({sourceNode?.type || 'nó'})
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Condição
          </label>
          <select
            value={condition}
            onChange={(e) => handleConditionChange(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          >
            {FOLLOWUP_CONDITIONS.map((cond) => (
              <option key={cond.value} value={cond.value}>
                {cond.label}
              </option>
            ))}
            <option value="proxima_etapa">Próxima etapa (direta)</option>
            <option value="customizada">Personalizada</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Nó de destino
          </label>
          <select
            value={targetNodeId}
            onChange={(e) => setTargetNodeId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          >
            <option value="">Selecione o destino...</option>
            {nodes
              .filter((n) => n.id !== edge.sourceNodeId)
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title} ({n.type})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Rótulo no canvas visual
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Não respondeu"
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onDelete(edge.id);
              onClose();
            }}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            icon={<Trash2 className="w-4 h-4" />}
          >
            Remover conexão
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
