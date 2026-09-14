import React, { useState } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { 
  FunnelStage, 
  FunnelSemanticColor, 
  FUNNEL_COLOR_PRESETS, 
  StageType 
} from '../../core/types/funnel';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Palette, 
  Sparkles, 
  Clock, 
  Check, 
  AlertTriangle,
  HelpCircle,
  FileText
} from 'lucide-react';

const COLOR_OPTIONS: { id: FunnelSemanticColor; label: string; bg: string; border: string; text: string }[] = [
  { id: 'zinc', label: 'Cinza / Neutro', bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-300', text: 'text-zinc-700 dark:text-zinc-300' },
  { id: 'blue', label: 'Azul (Toque / Abordagem)', bg: 'bg-blue-100 dark:bg-blue-950', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300' },
  { id: 'cyan', label: 'Ciano (Qualificação)', bg: 'bg-cyan-100 dark:bg-cyan-950', border: 'border-cyan-400', text: 'text-cyan-700 dark:text-cyan-300' },
  { id: 'purple', label: 'Roxo (LEADION / Diagnóstico)', bg: 'bg-purple-100 dark:bg-purple-950', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300' },
  { id: 'orange', label: 'Laranja (Oferta / Proposta)', bg: 'bg-orange-100 dark:bg-orange-950', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300' },
  { id: 'amber', label: 'Âmbar (Negociação / Espera)', bg: 'bg-amber-100 dark:bg-amber-950', border: 'border-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  { id: 'emerald', label: 'Esmeralda (Ganho / Fechado)', bg: 'bg-emerald-100 dark:bg-emerald-950', border: 'border-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' },
  { id: 'rose', label: 'Rosa / Vermelho (Perdido)', bg: 'bg-rose-100 dark:bg-rose-950', border: 'border-rose-400', text: 'text-rose-700 dark:text-rose-300' },
];

const STAGE_TYPES: { id: StageType; label: string }[] = [
  { id: 'open', label: 'Abertura (Entrada de novos leads)' },
  { id: 'in_progress', label: 'Em Andamento (Cadência / Negociação)' },
  { id: 'won', label: 'Ganho (Sucesso / Fechado)' },
  { id: 'lost', label: 'Perdido (Descarte / Sem Fit)' },
  { id: 'archived', label: 'Arquivado (Standby)' },
];

export const FunnelStagesModal: React.FC = () => {
  const {
    isFunnelStagesModalOpen,
    setIsFunnelStagesModalOpen,
    activeFunnelForStages,
    setActiveFunnelForStages,
    funnels,
    addFunnelStage,
    updateFunnelStage,
    removeFunnelStage,
    reorderFunnelStages,
  } = useLeadion();

  // Find the fresh funnel from state
  const funnel = funnels.find((f) => f.id === activeFunnelForStages?.id) || activeFunnelForStages;

  // New stage form state
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState<FunnelSemanticColor>('blue');
  const [newStageType, setNewStageType] = useState<StageType>('in_progress');
  const [newStageDescription, setNewStageDescription] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Edit stage form state
  const [editingStageId, setEditingStageId] = useState<string | null>(null);

  if (!funnel) return null;

  const handleClose = () => {
    setIsFunnelStagesModalOpen(false);
    setActiveFunnelForStages(null);
    setIsAddingNew(false);
    setEditingStageId(null);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const stageIds = funnel.stages.map((s) => s.id);
    const temp = stageIds[index];
    stageIds[index] = stageIds[index - 1];
    stageIds[index - 1] = temp;
    reorderFunnelStages(funnel.id, stageIds);
  };

  const handleMoveDown = (index: number) => {
    if (index >= funnel.stages.length - 1) return;
    const stageIds = funnel.stages.map((s) => s.id);
    const temp = stageIds[index];
    stageIds[index] = stageIds[index + 1];
    stageIds[index + 1] = temp;
    reorderFunnelStages(funnel.id, stageIds);
  };

  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    addFunnelStage(funnel.id, {
      name: newStageName.trim(),
      color: newStageColor,
      stageType: newStageType,
      description: newStageDescription.trim() || undefined,
    });

    setNewStageName('');
    setNewStageDescription('');
    setNewStageColor('blue');
    setNewStageType('in_progress');
    setIsAddingNew(false);
  };

  return (
    <Modal
      isOpen={isFunnelStagesModalOpen}
      onClose={handleClose}
      title={`Gerenciar Etapas: ${funnel.name}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Total de <strong>{funnel.stages.length} etapas</strong> configuradas nesta esteira comercial.
            </span>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Reordene, altere cores semânticas ou adicione etapas personalizadas com regras de avanço.
            </p>
          </div>

          {!isAddingNew && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddingNew(true)}
            >
              Nova Etapa
            </Button>
          )}
        </div>

        {/* Add New Stage Box */}
        {isAddingNew && (
          <form
            onSubmit={handleCreateStage}
            className="p-4 rounded-xl border-2 border-dashed border-[#635BFF]/40 bg-[#635BFF]/5 dark:bg-[#635BFF]/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#635BFF]" />
                Adicionar Nova Etapa ao Funil
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da Etapa *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Ex: Demonstração de Prototipagem"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Classificação / Tipo
                </label>
                <select
                  value={newStageType}
                  onChange={(e) => setNewStageType(e.target.value as StageType)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  {STAGE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Cor Semântica do Estado
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewStageColor(c.id)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 ${
                      newStageColor === c.id
                        ? `${c.bg} ${c.border} ${c.text} ring-2 ring-[#635BFF]/40 font-bold`
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: FUNNEL_COLOR_PRESETS[c.id].accent }}
                    />
                    {c.label.split(' ')[0]}
                    {newStageColor === c.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Descrição ou Ação Recomendada (Opcional)
              </label>
              <input
                type="text"
                value={newStageDescription}
                onChange={(e) => setNewStageDescription(e.target.value)}
                placeholder="Ex: Realizar call de 15 min focada em levantar as dores de automação."
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsAddingNew(false)}
              >
                Descartar
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Adicionar Etapa
              </Button>
            </div>
          </form>
        )}

        {/* Existing Stages List */}
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {funnel.stages.map((stage, index) => {
            const isEditing = editingStageId === stage.id;
            const colorPreset = FUNNEL_COLOR_PRESETS[stage.color || 'zinc'];

            return (
              <div
                key={stage.id}
                className={`p-3 rounded-xl border transition-all ${
                  isEditing
                    ? 'border-[#635BFF] bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {!isEditing ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Step Number Badge */}
                      <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {/* Color indicator */}
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: colorPreset.accent }}
                      />

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {stage.name}
                          </h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorPreset.bg} ${colorPreset.border} ${colorPreset.text}`}
                          >
                            {stage.stageType === 'won'
                              ? 'Ganho'
                              : stage.stageType === 'lost'
                              ? 'Perdido'
                              : stage.stageType === 'open'
                              ? 'Entrada'
                              : 'Em Andamento'}
                          </span>
                        </div>
                        {stage.description && (
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                            {stage.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Reorder, Edit, Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveUp(index)}
                        title="Subir ordem"
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === funnel.stages.length - 1}
                        onClick={() => handleMoveDown(index)}
                        title="Descer ordem"
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingStageId(stage.id)}
                        className="text-[11px] h-7 px-2"
                      >
                        Editar
                      </Button>

                      <button
                        type="button"
                        disabled={funnel.stages.length <= 1}
                        onClick={() => removeFunnelStage(funnel.id, stage.id)}
                        title="Excluir etapa"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Inline Edit Mode */
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                          Renomear Etapa
                        </label>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) =>
                            updateFunnelStage(funnel.id, stage.id, { name: e.target.value })
                          }
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                          Tipo de Fechamento
                        </label>
                        <select
                          value={stage.stageType || 'in_progress'}
                          onChange={(e) =>
                            updateFunnelStage(funnel.id, stage.id, {
                              stageType: e.target.value as StageType,
                            })
                          }
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                        >
                          {STAGE_TYPES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                        Cor Semântica do Estado
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {COLOR_OPTIONS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              updateFunnelStage(funnel.id, stage.id, { color: c.id })
                            }
                            className={`text-[10px] px-2 py-1 rounded-md border flex items-center gap-1 ${
                              stage.color === c.id
                                ? `${c.bg} ${c.border} ${c.text} font-bold ring-1 ring-[#635BFF]`
                                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: FUNNEL_COLOR_PRESETS[c.id].accent }}
                            />
                            {c.label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                        Descrição / Ação Recomendada
                      </label>
                      <input
                        type="text"
                        value={stage.description || ''}
                        onChange={(e) =>
                          updateFunnelStage(funnel.id, stage.id, { description: e.target.value })
                        }
                        placeholder="Orientações para o operador..."
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setEditingStageId(null)}
                        className="text-[11px] h-7 px-3"
                      >
                        Concluir Edição
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            A esteira comercial está sincronizada em tempo real com as empresas.
          </span>
          <Button variant="primary" size="sm" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
