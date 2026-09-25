import React, { useState } from 'react';
import { FunnelEntity, FunnelChannel, FunnelObjective } from '../../core/types/funnel';
import { Company } from '../../core/types/company';
import { NewFunnelModal } from './modals/NewFunnelModal';
import { Button } from '../ui/Button';
import { 
  GitFork, 
  Plus, 
  Search, 
  Layers, 
  MessageSquare, 
  Clock, 
  Building2, 
  ArrowRight, 
  Copy, 
  Trash2, 
  Archive, 
  Folder
} from 'lucide-react';

interface FunnelsListViewProps {
  funnels: FunnelEntity[];
  companies: Company[];
  onOpenFunnel: (funnelId: string) => void;
  onCreateFunnel: (data: {
    name: string;
    description: string;
    channel: FunnelChannel;
    objective: FunnelObjective;
  }) => Promise<FunnelEntity | null>;
  onDuplicateFunnel: (funnelId: string) => void;
  onArchiveFunnel: (funnelId: string) => void;
  onDeleteFunnel: (funnelId: string) => void;
}

export const FunnelsListView: React.FC<FunnelsListViewProps> = ({
  funnels,
  companies,
  onOpenFunnel,
  onCreateFunnel,
  onDuplicateFunnel,
  onArchiveFunnel,
  onDeleteFunnel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');

  const filteredFunnels = funnels.filter((f) => {
    if (filterStatus === 'active' && f.status === 'archived') return false;
    if (filterStatus === 'archived' && f.status !== 'archived') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.name.toLowerCase().includes(term) ||
      f.code?.toLowerCase().includes(term) ||
      f.description?.toLowerCase().includes(term)
    );
  });

  const handleCreate = async (data: {
    name: string;
    description: string;
    channel: FunnelChannel;
    objective: FunnelObjective;
  }) => {
    setIsSubmitting(true);
    try {
      const created = await onCreateFunnel(data);
      if (created) {
        onOpenFunnel(created.id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              FUNIS
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              {funnels.length}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Pastas independentes de prospecção com sequências, mensagens, follow-ups em cadeia e fluxos visuais.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            onClick={() => setIsNewModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Novo funil
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {funnels.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === 'active'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Ativos ({funnels.filter((f) => f.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('archived')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === 'archived'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Arquivados ({funnels.filter((f) => f.status === 'archived').length})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Todos ({funnels.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar funil por nome ou código..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
          </div>
        </div>
      )}

      {/* ZERO FUNNELS EMPTY STATE (Section 3) */}
      {funnels.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <Folder className="w-14 h-14 text-[#635BFF] mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Você ainda não criou nenhum funil.
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-6">
            Crie seu primeiro funil para estruturar sua prospecção em sequências, mensagens e follow-ups em cadeia.
          </p>
          <Button
            variant="primary"
            onClick={() => setIsNewModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Novo funil
          </Button>
        </div>
      ) : filteredFunnels.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            Nenhum funil encontrado para a busca "{searchTerm}".
          </p>
        </div>
      ) : (
        /* FUNNEL CARDS GRID (Section 2) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFunnels.map((funnel) => {
            const sequences = funnel.sequences || [];
            const sequencesCount = sequences.length;
            const messagesCount = sequences.reduce((acc, s) => acc + (s.messages?.length || 0), 0);
            const followUpsCount = sequences.reduce(
              (acc, s) =>
                acc + (s.messages || []).reduce((mAcc, m) => mAcc + (m.followUps?.length || 0), 0),
              0
            );

            const companiesCount = companies.filter(
              (c) => c.funnelId === funnel.id || (!c.funnelId && funnel.isDefault)
            ).length;

            return (
              <div
                key={funnel.id}
                onClick={() => onOpenFunnel(funnel.id)}
                className="group relative p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-[#635BFF] dark:hover:border-[#635BFF] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#635BFF]/10 text-[#635BFF] group-hover:bg-[#635BFF] group-hover:text-white transition-colors">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#635BFF] transition-colors line-clamp-1">
                          {funnel.name}
                        </h3>
                        {funnel.code && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            [{funnel.code}]
                          </span>
                        )}
                      </div>
                    </div>

                    {funnel.isDefault && (
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>

                  {funnel.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-4">
                      {funnel.description}
                    </p>
                  )}

                  {/* Channel & Objective Badges */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {funnel.channel && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#635BFF] bg-[#635BFF]/10 px-2 py-0.5 rounded">
                        {funnel.channel}
                      </span>
                    )}
                    {funnel.objective && (
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {funnel.objective.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Metric Counts */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-100 dark:border-zinc-800/80 text-center">
                    <div>
                      <span className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {sequencesCount}
                      </span>
                      <span className="text-[10px] text-zinc-400">sequências</span>
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {messagesCount}
                      </span>
                      <span className="text-[10px] text-zinc-400">mensagens</span>
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {followUpsCount}
                      </span>
                      <span className="text-[10px] text-zinc-400">follow-ups</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 flex items-center justify-between text-xs text-zinc-500">
                  <span>{companiesCount} empresa(s)</span>

                  <span className="flex items-center gap-1 font-semibold text-[#635BFF] group-hover:translate-x-1 transition-transform">
                    Abrir jornada <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Funnel Modal */}
      <NewFunnelModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
