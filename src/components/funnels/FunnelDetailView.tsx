import React, { useState } from 'react';
import { FunnelEntity, FlowNode, FlowEdge } from '../../core/types/funnel';
import { Company } from '../../core/types/company';
import { FunnelSequencesTab } from './FunnelSequencesTab';
import { FunnelFlowCanvas } from './FunnelFlowCanvas';
import { FunnelScriptsTab } from './FunnelScriptsTab';
import { FunnelCompaniesTab } from './FunnelCompaniesTab';
import { FunnelSettingsTab } from './FunnelSettingsTab';
import { synchronizeFlowGraphWithSequences } from '../../core/funnel/flowGraphEngine';
import { Button } from '../ui/Button';
import { 
  ArrowLeft, 
  GitFork, 
  Layers, 
  FileText, 
  Building2, 
  Settings, 
  Share2, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface FunnelDetailViewProps {
  funnel: FunnelEntity;
  availableFunnels: FunnelEntity[];
  companies: Company[];
  userName?: string;
  onBack: () => void;
  onUpdateFunnel: (updates: Partial<FunnelEntity>) => void;
  onDuplicateFunnel: (funnelId: string) => void;
  onArchiveFunnel: (funnelId: string) => void;
  onUnarchiveFunnel: (funnelId: string) => void;
  onDeleteFunnel: (funnelId: string) => void;
  onUpdateCompany: (companyId: string, updates: Partial<Company>) => void;
  onSelectCompany?: (company: Company) => void;
  showToast: (opts: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string }) => void;
}

export type FunnelTabType = 'sequences' | 'flow' | 'scripts' | 'companies' | 'settings';

export const FunnelDetailView: React.FC<FunnelDetailViewProps> = ({
  funnel,
  availableFunnels,
  companies,
  userName,
  onBack,
  onUpdateFunnel,
  onDuplicateFunnel,
  onArchiveFunnel,
  onUnarchiveFunnel,
  onDeleteFunnel,
  onUpdateCompany,
  onSelectCompany,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<FunnelTabType>('sequences');

  const sequences = funnel.sequences || [];
  const messagesCount = sequences.reduce((acc, s) => acc + (s.messages?.length || 0), 0);
  const followUpsCount = sequences.reduce(
    (acc, s) => acc + (s.messages || []).reduce((mAcc, m) => mAcc + (m.followUps?.length || 0), 0),
    0
  );
  const companiesInFunnelCount = companies.filter(
    (c) => c.funnelId === funnel.id || (!c.funnelId && funnel.isDefault)
  ).length;

  // Auto-sync graph nodes with sequences if flowNodes is empty
  const handleSyncGraphWithSequences = () => {
    const { nodes, edges } = synchronizeFlowGraphWithSequences(funnel);
    onUpdateFunnel({ flowNodes: nodes, flowEdges: edges });
    showToast({
      type: 'success',
      title: 'Fluxo Sincronizado',
      message: 'Nós e arestas alinhados com suas sequências e mensagens cadastradas.',
    });
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <button
                onClick={onBack}
                className="hover:text-[#635BFF] flex items-center gap-1 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Funis</span>
              </button>
              <span>/</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{funnel.name}</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {funnel.name}
              </h2>
              {funnel.code && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {funnel.code}
                </span>
              )}
              {funnel.channel && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#635BFF] bg-[#635BFF]/10 px-2.5 py-0.5 rounded-full">
                  {funnel.channel}
                </span>
              )}
              {funnel.isDefault && (
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  Funil Padrão
                </span>
              )}
            </div>

            {funnel.description && (
              <p className="text-xs text-zinc-500 max-w-2xl line-clamp-2">
                {funnel.description}
              </p>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'flow' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncGraphWithSequences}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                title="Sincroniza nós e conexões com as sequências e mensagens"
              >
                Alinhar com Sequências
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={onBack}
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Voltar aos funis
            </Button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 sm:gap-2 mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('sequences')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              activeTab === 'sequences'
                ? 'bg-[#635BFF] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sequências ({sequences.length})</span>
          </button>

          <button
            onClick={() => {
              // Se os nós estiverem vazios, inicializa com as sequências
              if (!funnel.flowNodes || funnel.flowNodes.length === 0) {
                const { nodes, edges } = synchronizeFlowGraphWithSequences(funnel);
                onUpdateFunnel({ flowNodes: nodes, flowEdges: edges });
              }
              setActiveTab('flow');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              activeTab === 'flow'
                ? 'bg-[#635BFF] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Fluxo Visual (Grafo)</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              activeTab === 'scripts'
                ? 'bg-[#635BFF] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scripts ({funnel.funnelScripts?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              activeTab === 'companies'
                ? 'bg-[#635BFF] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Empresas ({companiesInFunnelCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              activeTab === 'settings'
                ? 'bg-[#635BFF] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações</span>
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'sequences' && (
        <FunnelSequencesTab
          funnel={funnel}
          availableFunnels={availableFunnels}
          onUpdateFunnel={onUpdateFunnel}
        />
      )}

      {activeTab === 'flow' && (
        <FunnelFlowCanvas
          funnel={funnel}
          availableFunnels={availableFunnels}
          onUpdateNodes={(nodes: FlowNode[]) => onUpdateFunnel({ flowNodes: nodes })}
          onUpdateEdges={(edges: FlowEdge[]) => onUpdateFunnel({ flowEdges: edges })}
          onUpdateViewport={(vp) => onUpdateFunnel({ flowViewport: vp })}
        />
      )}

      {activeTab === 'scripts' && (
        <FunnelScriptsTab
          funnel={funnel}
          companies={companies}
          onUpdateFunnel={onUpdateFunnel}
        />
      )}

      {activeTab === 'companies' && (
        <FunnelCompaniesTab
          funnel={funnel}
          companies={companies}
          availableFunnels={availableFunnels}
          userName={userName}
          onUpdateCompany={onUpdateCompany}
          onSelectCompany={onSelectCompany}
          showToast={showToast}
        />
      )}

      {activeTab === 'settings' && (
        <FunnelSettingsTab
          funnel={funnel}
          onUpdateFunnel={onUpdateFunnel}
          onDuplicateFunnel={onDuplicateFunnel}
          onArchiveFunnel={onArchiveFunnel}
          onUnarchiveFunnel={onUnarchiveFunnel}
          onDeleteFunnel={onDeleteFunnel}
        />
      )}
    </div>
  );
};
