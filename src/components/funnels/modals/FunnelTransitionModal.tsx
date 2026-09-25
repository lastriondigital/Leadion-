import React, { useState } from 'react';
import { Company } from '../../../core/types/company';
import { FunnelEntity, FunnelSequence } from '../../../core/types/funnel';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { ArrowRight, GitFork, Building2 } from 'lucide-react';

interface FunnelTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  currentFunnel: FunnelEntity;
  availableFunnels: FunnelEntity[];
  onExecuteTransition: (targetFunnel: FunnelEntity, targetSequence?: FunnelSequence | null, notes?: string) => void;
}

export const FunnelTransitionModal: React.FC<FunnelTransitionModalProps> = ({
  isOpen,
  onClose,
  company,
  currentFunnel,
  availableFunnels,
  onExecuteTransition,
}) => {
  const [targetFunnelId, setTargetFunnelId] = useState<string>('');
  const [targetSequenceId, setTargetSequenceId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const candidateFunnels = availableFunnels.filter((f) => f.id !== currentFunnel.id && f.status === 'active');
  const selectedFunnel = candidateFunnels.find((f) => f.id === targetFunnelId);
  const targetSequences = selectedFunnel?.sequences || [];

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFunnel) {
      setError('Selecione o funil de destino.');
      return;
    }
    const targetSeq = targetSequences.find((s) => s.id === targetSequenceId) || targetSequences[0] || null;
    onExecuteTransition(selectedFunnel, targetSeq, notes.trim() || undefined);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transição de Empresa para Outro Funil"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleExecute} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Informações da Empresa & Funil Atual */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#635BFF]" />
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {company?.name || 'Empresa em prospecção'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <span>Funil atual: <strong>{currentFunnel.name}</strong></span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[#635BFF] font-medium">Novo funil de destino</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Funil de destino <span className="text-red-500">*</span>
          </label>
          <select
            value={targetFunnelId}
            onChange={(e) => {
              setTargetFunnelId(e.target.value);
              setTargetSequenceId('');
            }}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          >
            <option value="">Selecione o funil para onde a empresa será enviada...</option>
            {candidateFunnels.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.sequences?.length || 0} sequências)
              </option>
            ))}
          </select>
        </div>

        {selectedFunnel && (
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Sequência de entrada no novo funil
            </label>
            <select
              value={targetSequenceId}
              onChange={(e) => setTargetSequenceId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              <option value="">Primeira sequência do funil (padrão)</option>
              {targetSequences.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  {String(idx + 1).padStart(2, '0')} - {s.name} ({s.messages?.length || 0} msgs)
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Motivo / Notas da transição (opcional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Empresa respondeu demonstrando interesse em reunião diagnóstica."
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
          ✓ A empresa <strong>não será duplicada</strong>. Todo o histórico de mensagens, interações e timeline anterior será mantido e registrado.
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!selectedFunnel}>
            Executar transição
          </Button>
        </div>
      </form>
    </Modal>
  );
};
