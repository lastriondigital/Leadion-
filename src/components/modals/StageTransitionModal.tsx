import React, { useState, useEffect } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { Company } from '../../core/types/company';
import { FunnelEntity, FunnelStage, FUNNEL_COLOR_PRESETS } from '../../core/types/funnel';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ShieldCheck,
  Trophy
} from 'lucide-react';

interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  funnel: FunnelEntity | null;
  initialTargetStageId?: string;
}

export const StageTransitionModal: React.FC<StageTransitionModalProps> = ({
  isOpen,
  onClose,
  company,
  funnel,
  initialTargetStageId,
}) => {
  const { userName, transitionCompanyStage } = useLeadion();

  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');
  const [transitionDate, setTransitionDate] = useState<string>('');
  const [transitionTime, setTransitionTime] = useState<string>('');
  const [dealValue, setDealValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (company && funnel && isOpen) {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      setTransitionDate(`${d}/${m}/${y}`);
      setTransitionTime(`${hh}:${mm}`);
      setResponsible(userName || 'Manuel Domingos');
      setDealValue(company.dealValue || company.estimatedRevenue || 'R$ 6.800');
      setNotes('');

      if (initialTargetStageId) {
        setSelectedStageId(initialTargetStageId);
      } else {
        // Pick the stage immediately after the current one if possible
        const currentIndex = funnel.stages.findIndex((s) => s.id === company.funnelStageId);
        if (currentIndex !== -1 && currentIndex + 1 < funnel.stages.length) {
          setSelectedStageId(funnel.stages[currentIndex + 1].id);
        } else if (funnel.stages.length > 0) {
          setSelectedStageId(funnel.stages[0].id);
        }
      }
    }
  }, [company, funnel, initialTargetStageId, isOpen, userName]);

  if (!company || !funnel) return null;

  const currentStage = funnel.stages.find((s) => s.id === company.funnelStageId);
  const targetStage = funnel.stages.find((s) => s.id === selectedStageId);
  const isWonStage = targetStage?.id === 'cliente' || 
    targetStage?.name?.toLowerCase().includes('cliente') || 
    targetStage?.name?.toLowerCase().includes('ganho');

  const currentColor = currentStage ? FUNNEL_COLOR_PRESETS[currentStage.color || 'zinc'] : FUNNEL_COLOR_PRESETS.zinc;
  const targetColor = targetStage ? FUNNEL_COLOR_PRESETS[targetStage.color || 'zinc'] : FUNNEL_COLOR_PRESETS.zinc;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageId) return;

    transitionCompanyStage({
      companyId: company.id,
      targetStageId: selectedStageId,
      targetFunnelId: funnel.id,
      responsibleName: responsible.trim() || userName || 'Manuel Domingos',
      notes: notes.trim() || undefined,
      dealValue: isWonStage ? (dealValue.trim() || 'R$ 6.800') : undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transição de Etapa no Funil"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company context header */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Empresa em Negociação
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {company.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {company.niche} • {company.city} ({company.country})
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Funil Atual</span>
              <span className="text-xs font-bold text-[#635BFF]">{funnel.name}</span>
            </div>
          </div>
        </div>

        {/* Transition Visual Flow: Previous -> Next */}
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">
            Fluxo da Transição
          </label>
          <div className="flex items-center justify-between gap-2">
            {/* Previous Stage */}
            <div className="flex-1 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
              <span className="text-[10px] text-zinc-400 block font-medium">Etapa Anterior</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: currentColor.accent }}
                />
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                  {currentStage?.name || company.funnelStageName || 'Inicial'}
                </span>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />

            {/* Target Stage */}
            <div className={`flex-1 p-2.5 rounded-lg border ${targetColor.border} ${targetColor.bg}`}>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-medium">
                Nova Etapa
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: targetColor.accent }}
                />
                <span className={`text-xs font-bold ${targetColor.text} truncate`}>
                  {targetStage?.name || 'Selecione a etapa'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Select Target Stage */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#635BFF]" />
            Selecione a Nova Etapa do Funil *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {funnel.stages.map((stage, idx) => {
              const isSelected = selectedStageId === stage.id;
              const isCurrent = company.funnelStageId === stage.id;
              const col = FUNNEL_COLOR_PRESETS[stage.color || 'zinc'];

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-[#635BFF] bg-[#635BFF]/10 text-zinc-900 dark:text-zinc-100 ring-2 ring-[#635BFF]/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: col.accent }}
                    />
                    <span className="text-xs font-bold truncate">{stage.name}</span>
                  </div>

                  {isCurrent ? (
                    <span className="text-[10px] text-zinc-400 font-medium shrink-0">Atual</span>
                  ) : isSelected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#635BFF] shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audit / Transition Metadata: Data, Hora, Responsável */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-400" />
              Data *
            </label>
            <input
              type="text"
              required
              value={transitionDate}
              onChange={(e) => setTransitionDate(e.target.value)}
              placeholder="DD/MM/AAAA"
              className="w-full text-xs font-mono px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" />
              Hora *
            </label>
            <input
              type="text"
              required
              value={transitionTime}
              onChange={(e) => setTransitionTime(e.target.value)}
              placeholder="HH:mm"
              className="w-full text-xs font-mono px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-zinc-400" />
              Responsável *
            </label>
            <input
              type="text"
              required
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Nome do operador"
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Won Stage Deal Value Registration (Updates Statistics) */}
        {isWonStage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1.5 animate-in fade-in duration-150">
            <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Valor do Negócio Fechado / Contrato *
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                Atualiza Estatísticas
              </span>
            </label>
            <input
              type="text"
              required
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="Ex: R$ 6.800, 10.000 MT, etc."
              className="w-full text-xs font-bold font-mono px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-zinc-900 text-emerald-900 dark:text-emerald-100 focus:ring-2 focus:ring-emerald-500/30"
            />
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
              Este valor será consolidado automaticamente na taxa de conversão e receita fechada das estatísticas.
            </p>
          </div>
        )}

        {/* Transition Observation / Notes */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3 text-zinc-400" />
            Observação da Transição (Salva na Linha do Tempo)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Decisor pediu envio de proposta detalhada e reunião na quinta-feira."
            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 resize-none"
          />
        </div>

        {/* Recommended action tip (future scripts/automations architecture) */}
        {targetStage?.conditionalRules?.recommendedAction && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2 text-amber-800 dark:text-amber-300 text-xs">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Ação Recomendada para a Nova Etapa:</span>
              <p className="text-[11px] mt-0.5">{targetStage.conditionalRules.recommendedAction}</p>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Histórico auditável registrado
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Confirmar Transição
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
