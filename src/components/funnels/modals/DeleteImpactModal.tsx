import React from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { AlertTriangle } from 'lucide-react';

interface DeleteImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemTitle: string;
  itemType: 'funil' | 'sequência' | 'mensagem' | 'follow-up' | 'script' | 'nó' | 'conexão';
  impactDetails?: {
    messagesCount?: number;
    followUpsCount?: number;
    connectionsCount?: number;
    companiesCount?: number;
  };
}

export const DeleteImpactModal: React.FC<DeleteImpactModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemTitle,
  itemType,
  impactDetails,
}) => {
  const hasImpact = impactDetails && (
    (impactDetails.messagesCount ?? 0) > 0 ||
    (impactDetails.followUpsCount ?? 0) > 0 ||
    (impactDetails.connectionsCount ?? 0) > 0 ||
    (impactDetails.companiesCount ?? 0) > 0
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">
              Tem certeza que deseja excluir {itemType} "{itemTitle}"?
            </p>
            <p>Esta ação não pode ser desfeita e removerá os dados permanentemente.</p>
          </div>
        </div>

        {hasImpact && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">
              Impacto no fluxo e na prospecção:
            </span>
            <ul className="list-disc pl-4 text-zinc-600 dark:text-zinc-400 space-y-1">
              {impactDetails.companiesCount !== undefined && impactDetails.companiesCount > 0 && (
                <li>
                  <strong>{impactDetails.companiesCount}</strong> empresa(s) vinculada(s) (o histórico da empresa será mantido intacto)
                </li>
              )}
              {impactDetails.messagesCount !== undefined && impactDetails.messagesCount > 0 && (
                <li>
                  <strong>{impactDetails.messagesCount}</strong> mensagem(ns) interna(s) serão excluídas
                </li>
              )}
              {impactDetails.followUpsCount !== undefined && impactDetails.followUpsCount > 0 && (
                <li>
                  <strong>{impactDetails.followUpsCount}</strong> follow-up(s) encadeado(s) serão excluídos
                </li>
              )}
              {impactDetails.connectionsCount !== undefined && impactDetails.connectionsCount > 0 && (
                <li>
                  <strong>{impactDetails.connectionsCount}</strong> conexão(ões) do fluxo visual serão rompidas
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Excluir permanentemente
          </Button>
        </div>
      </div>
    </Modal>
  );
};
