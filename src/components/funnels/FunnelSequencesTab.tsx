import React, { useState } from 'react';
import { 
  FunnelEntity, 
  FunnelSequence, 
  SequenceMessage, 
  MessageFollowUp, 
  FunnelChannel 
} from '../../core/types/funnel';
import { SequenceModal } from './modals/SequenceModal';
import { MessageModal } from './modals/MessageModal';
import { FollowUpModal } from './modals/FollowUpModal';
import { DeleteImpactModal } from './modals/DeleteImpactModal';
import { Button } from '../ui/Button';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  MessageSquare, 
  Clock, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Copy, 
  ArrowDown, 
  ArrowUp, 
  CornerDownRight, 
  ExternalLink,
  GitFork,
  ArrowRight
} from 'lucide-react';

interface FunnelSequencesTabProps {
  funnel: FunnelEntity;
  availableFunnels?: FunnelEntity[];
  onUpdateFunnel: (updates: Partial<FunnelEntity>) => void;
}

export const FunnelSequencesTab: React.FC<FunnelSequencesTabProps> = ({
  funnel,
  availableFunnels = [],
  onUpdateFunnel,
}) => {
  const sequences = funnel.sequences || [];

  // Expanded sequences set
  const [expandedSequenceIds, setExpandedSequenceIds] = useState<Set<string>>(
    () => new Set(sequences.map((s) => s.id))
  );

  // Modals state
  const [isSeqModalOpen, setIsSeqModalOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<FunnelSequence | null>(null);

  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [targetSequenceForMsg, setTargetSequenceForMsg] = useState<FunnelSequence | null>(null);
  const [editingMessage, setEditingMessage] = useState<SequenceMessage | null>(null);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [targetMessageForFollowUp, setTargetMessageForFollowUp] = useState<SequenceMessage | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState<MessageFollowUp | null>(null);

  // Delete impact modal
  const [deleteModalData, setDeleteModalData] = useState<{
    isOpen: boolean;
    title: string;
    itemTitle: string;
    itemType: 'sequência' | 'mensagem' | 'follow-up';
    impactDetails?: any;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    itemTitle: '',
    itemType: 'sequência',
    onConfirm: () => {},
  });

  const toggleExpand = (seqId: string) => {
    setExpandedSequenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(seqId)) next.delete(seqId);
      else next.add(seqId);
      return next;
    });
  };

  // ==========================================
  // SEQUENCE CRUD
  // ==========================================
  const handleOpenCreateSequence = () => {
    setEditingSequence(null);
    setIsSeqModalOpen(true);
  };

  const handleOpenEditSequence = (seq: FunnelSequence) => {
    setEditingSequence(seq);
    setIsSeqModalOpen(true);
  };

  const handleSaveSequence = (data: { name: string; description?: string; objective?: string }) => {
    const nowIso = new Date().toISOString();
    if (editingSequence) {
      const updated = sequences.map((s) =>
        s.id === editingSequence.id ? { ...s, ...data, updatedAt: nowIso } : s
      );
      onUpdateFunnel({ sequences: updated });
    } else {
      const newSeq: FunnelSequence = {
        id: `seq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        funnelId: funnel.id,
        name: data.name,
        description: data.description,
        objective: data.objective,
        order: sequences.length,
        messages: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const updated = [...sequences, newSeq];
      onUpdateFunnel({ sequences: updated });
      setExpandedSequenceIds((prev) => new Set(prev).add(newSeq.id));
    }
  };

  const handleMoveSequence = (seqId: string, direction: 'up' | 'down') => {
    const idx = sequences.findIndex((s) => s.id === seqId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sequences.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const reordered = [...sequences];
    const temp = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const updated = reordered.map((s, i) => ({ ...s, order: i }));
    onUpdateFunnel({ sequences: updated });
  };

  const handleDeleteSequence = (seq: FunnelSequence) => {
    const totalMsgs = seq.messages?.length || 0;
    const totalFus = (seq.messages || []).reduce((acc, m) => acc + (m.followUps?.length || 0), 0);
    const affectedEdges = (funnel.flowEdges || []).filter(
      (e) => e.sourceNodeId === `node-seq-${seq.id}` || e.targetNodeId === `node-seq-${seq.id}`
    ).length;

    setDeleteModalData({
      isOpen: true,
      title: 'Excluir Sequência?',
      itemTitle: seq.name,
      itemType: 'sequência',
      impactDetails: {
        messagesCount: totalMsgs,
        followUpsCount: totalFus,
        connectionsCount: affectedEdges,
      },
      onConfirm: () => {
        const remainingSeqs = sequences
          .filter((s) => s.id !== seq.id)
          .map((s, i) => ({ ...s, order: i }));
        // Clean related flow edges & nodes
        const seqNodeId = `node-seq-${seq.id}`;
        const msgNodeIds = new Set((seq.messages || []).map((m) => `node-msg-${m.id}`));
        const fuNodeIds = new Set(
          (seq.messages || []).flatMap((m) => (m.followUps || []).map((fu) => `node-fu-${fu.id}`))
        );

        const cleanNodes = (funnel.flowNodes || []).filter(
          (n) => n.id !== seqNodeId && !msgNodeIds.has(n.id) && !fuNodeIds.has(n.id)
        );
        const cleanEdges = (funnel.flowEdges || []).filter(
          (e) =>
            e.sourceNodeId !== seqNodeId &&
            e.targetNodeId !== seqNodeId &&
            !msgNodeIds.has(e.sourceNodeId) &&
            !msgNodeIds.has(e.targetNodeId) &&
            !fuNodeIds.has(e.sourceNodeId) &&
            !fuNodeIds.has(e.targetNodeId)
        );

        onUpdateFunnel({
          sequences: remainingSeqs,
          flowNodes: cleanNodes,
          flowEdges: cleanEdges,
        });
      },
    });
  };

  // ==========================================
  // MESSAGE CRUD
  // ==========================================
  const handleOpenCreateMessage = (seq: FunnelSequence) => {
    setTargetSequenceForMsg(seq);
    setEditingMessage(null);
    setIsMsgModalOpen(true);
  };

  const handleOpenEditMessage = (seq: FunnelSequence, msg: SequenceMessage) => {
    setTargetSequenceForMsg(seq);
    setEditingMessage(msg);
    setIsMsgModalOpen(true);
  };

  const handleSaveMessage = (data: {
    internalName: string;
    channel: FunnelChannel;
    content: string;
  }) => {
    if (!targetSequenceForMsg) return;
    const nowIso = new Date().toISOString();

    const updatedSequences = sequences.map((seq) => {
      if (seq.id !== targetSequenceForMsg.id) return seq;
      const msgs = seq.messages || [];

      if (editingMessage) {
        return {
          ...seq,
          messages: msgs.map((m) =>
            m.id === editingMessage.id ? { ...m, ...data, updatedAt: nowIso } : m
          ),
          updatedAt: nowIso,
        };
      } else {
        const newMsg: SequenceMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sequenceId: seq.id,
          funnelId: funnel.id,
          internalName: data.internalName,
          channel: data.channel,
          content: data.content,
          order: msgs.length,
          followUps: [],
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        return {
          ...seq,
          messages: [...msgs, newMsg],
          updatedAt: nowIso,
        };
      }
    });

    onUpdateFunnel({ sequences: updatedSequences });
  };

  const handleDuplicateMessage = (seq: FunnelSequence, msg: SequenceMessage) => {
    const nowIso = new Date().toISOString();
    const duplicated: SequenceMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      internalName: `${msg.internalName} (Cópia)`,
      order: (seq.messages || []).length,
      createdAt: nowIso,
      updatedAt: nowIso,
      followUps: (msg.followUps || []).map((fu) => ({
        ...fu,
        id: `fu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      })),
    };

    const updatedSequences = sequences.map((s) =>
      s.id === seq.id ? { ...s, messages: [...s.messages, duplicated], updatedAt: nowIso } : s
    );
    onUpdateFunnel({ sequences: updatedSequences });
  };

  const handleDeleteMessage = (seq: FunnelSequence, msg: SequenceMessage) => {
    const fusCount = msg.followUps?.length || 0;
    setDeleteModalData({
      isOpen: true,
      title: 'Excluir Mensagem?',
      itemTitle: msg.internalName,
      itemType: 'mensagem',
      impactDetails: {
        followUpsCount: fusCount,
      },
      onConfirm: () => {
        const updatedSequences = sequences.map((s) => {
          if (s.id !== seq.id) return s;
          const filtered = s.messages.filter((m) => m.id !== msg.id).map((m, i) => ({ ...m, order: i }));
          return { ...s, messages: filtered };
        });
        onUpdateFunnel({ sequences: updatedSequences });
      },
    });
  };

  // ==========================================
  // FOLLOW-UP CRUD
  // ==========================================
  const handleOpenCreateFollowUp = (seq: FunnelSequence, msg: SequenceMessage) => {
    setTargetSequenceForMsg(seq);
    setTargetMessageForFollowUp(msg);
    setEditingFollowUp(null);
    setIsFollowUpModalOpen(true);
  };

  const handleOpenEditFollowUp = (
    seq: FunnelSequence,
    msg: SequenceMessage,
    fu: MessageFollowUp
  ) => {
    setTargetSequenceForMsg(seq);
    setTargetMessageForFollowUp(msg);
    setEditingFollowUp(fu);
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = (data: {
    name: string;
    delayValue: number;
    delayUnit: 'dias' | 'horas' | 'minutos' | 'semanas';
    condition: any;
    content: string;
    targetType?: any;
    targetId?: string;
    targetFunnelId?: string;
    targetSequenceId?: string;
  }) => {
    if (!targetSequenceForMsg || !targetMessageForFollowUp) return;
    const nowIso = new Date().toISOString();

    const updatedSequences = sequences.map((seq) => {
      if (seq.id !== targetSequenceForMsg.id) return seq;
      return {
        ...seq,
        messages: seq.messages.map((m) => {
          if (m.id !== targetMessageForFollowUp.id) return m;
          const fus = m.followUps || [];

          if (editingFollowUp) {
            return {
              ...m,
              followUps: fus.map((fu) =>
                fu.id === editingFollowUp.id ? { ...fu, ...data, updatedAt: nowIso } : fu
              ),
              updatedAt: nowIso,
            };
          } else {
            const newFu: MessageFollowUp = {
              id: `fu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              messageId: m.id,
              sequenceId: seq.id,
              funnelId: funnel.id,
              name: data.name,
              delayValue: data.delayValue,
              delayUnit: data.delayUnit,
              condition: data.condition,
              content: data.content,
              targetType: data.targetType,
              targetId: data.targetId,
              targetFunnelId: data.targetFunnelId,
              targetSequenceId: data.targetSequenceId,
              order: fus.length,
              createdAt: nowIso,
              updatedAt: nowIso,
            };
            return {
              ...m,
              followUps: [...fus, newFu],
              updatedAt: nowIso,
            };
          }
        }),
      };
    });

    onUpdateFunnel({ sequences: updatedSequences });
  };

  const handleDeleteFollowUp = (
    seq: FunnelSequence,
    msg: SequenceMessage,
    fu: MessageFollowUp
  ) => {
    setDeleteModalData({
      isOpen: true,
      title: 'Excluir Follow-up?',
      itemTitle: fu.name,
      itemType: 'follow-up',
      onConfirm: () => {
        const updatedSequences = sequences.map((s) => {
          if (s.id !== seq.id) return s;
          return {
            ...s,
            messages: s.messages.map((m) => {
              if (m.id !== msg.id) return m;
              return {
                ...m,
                followUps: m.followUps.filter((f) => f.id !== fu.id).map((f, i) => ({ ...f, order: i })),
              };
            }),
          };
        });
        onUpdateFunnel({ sequences: updatedSequences });
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & New Sequence Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Sequências do Funil
          </h3>
          <p className="text-xs text-zinc-500">
            Estruture mensagens ordenadas e ramificações de follow-up específicas desta jornada.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateSequence}
          icon={<Plus className="w-4 h-4" />}
        >
          Nova sequência
        </Button>
      </div>

      {/* Empty State */}
      {sequences.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <GitFork className="w-12 h-12 text-[#635BFF] mx-auto mb-3" />
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Nenhuma sequência criada neste funil
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            Crie sua primeira sequência para cadastrar mensagens e configurar prazos de resposta.
          </p>
          <Button variant="primary" onClick={handleOpenCreateSequence} icon={<Plus className="w-4 h-4" />}>
            Criar primeira sequência
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sequences.map((seq, seqIdx) => {
            const isExpanded = expandedSequenceIds.has(seq.id);
            const messages = seq.messages || [];
            const followUpsCount = messages.reduce((acc, m) => acc + (m.followUps?.length || 0), 0);

            return (
              <div
                key={seq.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs transition-shadow hover:shadow-sm"
              >
                {/* Sequence Bar Header */}
                <div
                  onClick={() => toggleExpand(seq.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                      {String(seqIdx + 1).padStart(2, '0')}
                    </span>

                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        {seq.name}
                        {seq.objective && (
                          <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                            · {seq.objective}
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                        <span>{messages.length} mensagem(ns)</span>
                        <span>·</span>
                        <span>{followUpsCount} follow-up(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleMoveSequence(seq.id, 'up')}
                      disabled={seqIdx === 0}
                      title="Mover para cima"
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveSequence(seq.id, 'down')}
                      disabled={seqIdx === sequences.length - 1}
                      title="Mover para baixo"
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditSequence(seq)}
                      title="Editar sequência"
                      className="p-1.5 text-zinc-400 hover:text-[#635BFF] rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSequence(seq)}
                      title="Excluir sequência"
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
                    <button
                      onClick={() => toggleExpand(seq.id)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Messages & Follow-ups */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4">
                    {messages.length === 0 ? (
                      <div className="py-6 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                        <p className="text-xs text-zinc-500 mb-2">
                          Esta sequência ainda não possui mensagens cadastradas.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenCreateMessage(seq)}
                          icon={<Plus className="w-3.5 h-3.5" />}
                        >
                          Adicionar mensagem
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-3">
                        {messages.map((msg, msgIdx) => {
                          const followUps = msg.followUps || [];

                          return (
                            <div
                              key={msg.id}
                              className="p-3.5 bg-zinc-50/70 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3"
                            >
                              {/* Message Header */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] font-semibold text-zinc-400 bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                                    {String(msgIdx + 1).padStart(2, '0')}
                                  </span>
                                  <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" />
                                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                    {msg.internalName}
                                  </span>
                                  <span className="text-[10px] uppercase font-semibold text-[#635BFF] bg-[#635BFF]/10 px-2 py-0.5 rounded">
                                    {msg.channel}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenCreateFollowUp(seq, msg)}
                                    icon={<Plus className="w-3 h-3" />}
                                    className="text-[11px] h-7 px-2"
                                  >
                                    Adicionar follow-up
                                  </Button>
                                  <button
                                    onClick={() => handleOpenEditMessage(seq, msg)}
                                    title="Editar mensagem"
                                    className="p-1.5 text-zinc-400 hover:text-[#635BFF] rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateMessage(seq, msg)}
                                    title="Duplicar mensagem"
                                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(seq, msg)}
                                    title="Excluir mensagem"
                                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Message Content Preview */}
                              <div className="text-xs text-zinc-600 dark:text-zinc-300 font-mono bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 line-clamp-3">
                                {msg.content}
                              </div>

                              {/* In-Line Follow-ups Chain */}
                              {followUps.length > 0 && (
                                <div className="pl-4 border-l-2 border-amber-300 dark:border-amber-700/60 space-y-2 mt-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                                    Cadeia de Follow-ups desta mensagem:
                                  </span>

                                  {followUps.map((fu, fuIdx) => {
                                    return (
                                      <div
                                        key={fu.id}
                                        className="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-200/80 dark:border-amber-800/40 text-xs space-y-1.5"
                                      >
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <div className="flex items-center gap-2">
                                            <CornerDownRight className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                              {fu.name}
                                            </span>
                                            <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                                              +{fu.delayValue} {fu.delayUnit}
                                            </span>
                                            <span className="text-[11px] text-zinc-500">
                                              ({fu.condition === 'nao_respondeu' ? 'Se não respondeu' : fu.condition})
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => handleOpenEditFollowUp(seq, msg, fu)}
                                              title="Editar follow-up"
                                              className="p-1 text-zinc-400 hover:text-amber-600 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteFollowUp(seq, msg, fu)}
                                              title="Excluir follow-up"
                                              className="p-1 text-zinc-400 hover:text-red-600 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>

                                        {fu.content && (
                                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono bg-white/70 dark:bg-zinc-900/50 p-1.5 rounded line-clamp-2">
                                            "{fu.content}"
                                          </p>
                                        )}

                                        {fu.targetFunnelId && (
                                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                            <ExternalLink className="w-3 h-3" />
                                            <span>
                                              Destino: Iniciar funil "
                                              {availableFunnels.find((f) => f.id === fu.targetFunnelId)?.name || 'Outro funil'}
                                              "
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add message button at bottom of sequence */}
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenCreateMessage(seq)}
                            icon={<Plus className="w-3.5 h-3.5" />}
                            className="text-xs text-[#635BFF] hover:bg-[#635BFF]/5"
                          >
                            Adicionar mensagem à sequência {seq.name}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      <SequenceModal
        isOpen={isSeqModalOpen}
        onClose={() => setIsSeqModalOpen(false)}
        onSubmit={handleSaveSequence}
        sequence={editingSequence}
      />

      <MessageModal
        isOpen={isMsgModalOpen}
        onClose={() => setIsMsgModalOpen(false)}
        onSubmit={handleSaveMessage}
        message={editingMessage}
        defaultChannel={funnel.channel || 'whatsapp'}
      />

      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        onSubmit={handleSaveFollowUp}
        followUp={editingFollowUp}
        parentMessageName={targetMessageForFollowUp?.internalName}
        availableSequences={sequences}
        availableFunnels={availableFunnels}
      />

      <DeleteImpactModal
        isOpen={deleteModalData.isOpen}
        onClose={() => setDeleteModalData((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalData.onConfirm}
        title={deleteModalData.title}
        itemTitle={deleteModalData.itemTitle}
        itemType={deleteModalData.itemType}
        impactDetails={deleteModalData.impactDetails}
      />
    </div>
  );
};
