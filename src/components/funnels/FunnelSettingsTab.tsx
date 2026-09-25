import React, { useState, useEffect } from 'react';
import { 
  FunnelEntity, 
  FunnelChannel, 
  FunnelObjective, 
  FUNNEL_CHANNELS, 
  FUNNEL_OBJECTIVES 
} from '../../core/types/funnel';
import { DeleteImpactModal } from './modals/DeleteImpactModal';
import { Button } from '../ui/Button';
import { Copy, Archive, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';

interface FunnelSettingsTabProps {
  funnel: FunnelEntity;
  onUpdateFunnel: (updates: Partial<FunnelEntity>) => void;
  onDuplicateFunnel: (funnelId: string) => void;
  onArchiveFunnel: (funnelId: string) => void;
  onUnarchiveFunnel: (funnelId: string) => void;
  onDeleteFunnel: (funnelId: string) => void;
}

export const FunnelSettingsTab: React.FC<FunnelSettingsTabProps> = ({
  funnel,
  onUpdateFunnel,
  onDuplicateFunnel,
  onArchiveFunnel,
  onUnarchiveFunnel,
  onDeleteFunnel,
}) => {
  const [name, setName] = useState(funnel.name);
  const [description, setDescription] = useState(funnel.description || '');
  const [channel, setChannel] = useState<FunnelChannel>(funnel.channel || 'whatsapp');
  const [objective, setObjective] = useState<FunnelObjective>(funnel.objective || 'primeiro_contacto');
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    setName(funnel.name);
    setDescription(funnel.description || '');
    setChannel(funnel.channel || 'whatsapp');
    setObjective(funnel.objective || 'primeiro_contacto');
  }, [funnel]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFunnel({
      name: name.trim(),
      description: description.trim(),
      channel,
      objective,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const totalSequences = funnel.sequences?.length || 0;
  const totalMessages = (funnel.sequences || []).reduce((acc, s) => acc + (s.messages?.length || 0), 0);
  const totalFollowUps = (funnel.sequences || []).reduce(
    (acc, s) => acc + (s.messages || []).reduce((mAcc, m) => mAcc + (m.followUps?.length || 0), 0),
    0
  );
  const totalConnections = funnel.flowEdges?.length || 0;

  return (
    <div className="max-w-3xl space-y-6">
      {/* General Settings Form */}
      <form onSubmit={handleSave} className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Configurações Gerais do Funil
            </h3>
            <p className="text-xs text-zinc-500">
              Identificação, canal principal e objetivo operacional desta jornada.
            </p>
          </div>

          {isSaved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Nome do funil <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Descrição do funil
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o propósito desta esteira..."
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="pt-3 flex justify-end">
          <Button type="submit" variant="primary">
            Salvar configurações
          </Button>
        </div>
      </form>

      {/* Advanced Operations & Danger Zone */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          Gerenciamento & Ações do Funil
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg">
          <div>
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Duplicar Funil
            </h4>
            <p className="text-[11px] text-zinc-500">
              Gera uma cópia completa com novas sequências, mensagens e fluxo visual desvinculado. Não duplica empresas.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDuplicateFunnel(funnel.id)}
            icon={<Copy className="w-3.5 h-3.5" />}
          >
            Duplicar funil
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg">
          <div>
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {funnel.status === 'archived' ? 'Reativar Funil' : 'Arquivar Funil'}
            </h4>
            <p className="text-[11px] text-zinc-500">
              {funnel.status === 'archived'
                ? 'Restaura este funil para a esteira comercial ativa.'
                : 'Oculta o funil da operação diária mantendo todo o histórico intacto.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              funnel.status === 'archived'
                ? onUnarchiveFunnel(funnel.id)
                : onArchiveFunnel(funnel.id)
            }
            icon={funnel.status === 'archived' ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          >
            {funnel.status === 'archived' ? 'Reativar' : 'Arquivar'}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-lg">
          <div>
            <h4 className="text-xs font-bold text-red-700 dark:text-red-300">
              Excluir Funil Permanentemente
            </h4>
            <p className="text-[11px] text-red-600/80 dark:text-red-400/80">
              Remove todas as sequências, mensagens, follow-ups e topologia visual do funil.
            </p>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Excluir funil
          </Button>
        </div>
      </div>

      {/* Delete Impact Modal */}
      <DeleteImpactModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => onDeleteFunnel(funnel.id)}
        title="Excluir Funil de Prospecção?"
        itemTitle={funnel.name}
        itemType="funil"
        impactDetails={{
          messagesCount: totalMessages,
          followUpsCount: totalFollowUps,
          connectionsCount: totalConnections,
        }}
      />
    </div>
  );
};
