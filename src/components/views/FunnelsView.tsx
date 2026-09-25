import React, { useState } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { FunnelEntity, FunnelChannel, FunnelObjective } from '../../core/types/funnel';
import { FunnelsListView } from '../funnels/FunnelsListView';
import { FunnelDetailView } from '../funnels/FunnelDetailView';
import { useToast } from '../../context/ToastContext';

export const FunnelsView: React.FC = () => {
  const {
    funnels,
    activeFunnelId,
    setActiveFunnelId,
    companies,
    addFunnel,
    updateFunnel,
    duplicateFunnel,
    archiveFunnel,
    unarchiveFunnel,
    deleteFunnel,
    updateCompany,
    setSelectedCompany,
    userName,
  } = useLeadion();

  const { showToast } = useToast();

  // ID do funil atualmente aberto em modo detalhado / ambiente independente
  const [openedFunnelId, setOpenedFunnelId] = useState<string | null>(null);

  const openedFunnel = funnels.find((f) => f.id === openedFunnelId) || null;

  const handleOpenFunnel = (id: string) => {
    setOpenedFunnelId(id);
    setActiveFunnelId(id);
  };

  const handleCreateFunnel = async (data: {
    name: string;
    description: string;
    channel: FunnelChannel;
    objective: FunnelObjective;
  }): Promise<FunnelEntity | null> => {
    try {
      const newFunnel = addFunnel({
        name: data.name,
        code: `FUN-${Math.floor(10 + Math.random() * 90)}`,
        description: data.description,
        channel: data.channel,
        objective: data.objective,
        status: 'active',
        isDefault: funnels.length === 0,
        stages: [],
        sequences: [],
        flowNodes: [],
        flowEdges: [],
        flowViewport: { x: 40, y: 40, zoom: 1 },
        funnelScripts: [],
      });
      return newFunnel;
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro ao criar funil',
        message: err?.message || 'Não foi possível salvar o funil.',
      });
      return null;
    }
  };

  const handleDuplicate = (id: string) => {
    const copy = duplicateFunnel(id);
    if (copy) {
      setOpenedFunnelId(copy.id);
    }
  };

  const handleDelete = (id: string) => {
    const success = deleteFunnel(id);
    if (success && openedFunnelId === id) {
      setOpenedFunnelId(null);
    }
  };

  if (openedFunnel) {
    return (
      <FunnelDetailView
        funnel={openedFunnel}
        availableFunnels={funnels}
        companies={companies}
        userName={userName}
        onBack={() => setOpenedFunnelId(null)}
        onUpdateFunnel={(updates) => updateFunnel(openedFunnel.id, updates)}
        onDuplicateFunnel={handleDuplicate}
        onArchiveFunnel={archiveFunnel}
        onUnarchiveFunnel={unarchiveFunnel}
        onDeleteFunnel={handleDelete}
        onUpdateCompany={updateCompany}
        onSelectCompany={setSelectedCompany}
        showToast={showToast}
      />
    );
  }

  return (
    <FunnelsListView
      funnels={funnels}
      companies={companies}
      onOpenFunnel={handleOpenFunnel}
      onCreateFunnel={handleCreateFunnel}
      onDuplicateFunnel={handleDuplicate}
      onArchiveFunnel={archiveFunnel}
      onDeleteFunnel={handleDelete}
    />
  );
};
