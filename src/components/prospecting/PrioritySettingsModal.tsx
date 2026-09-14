import React, { useState } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { PriorityWeights, DEFAULT_PRIORITY_WEIGHTS } from '../../core/priority/priorityEngine';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Sliders, RotateCcw, Check, Sparkles, AlertTriangle } from 'lucide-react';

export const PrioritySettingsModal: React.FC = () => {
  const { isPriorityModalOpen, setIsPriorityModalOpen, priorityWeights, updatePriorityWeights } = useLeadion();

  const [weights, setWeights] = useState<PriorityWeights>(priorityWeights);

  const handleSliderChange = (key: keyof PriorityWeights, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleReset = () => {
    setWeights(DEFAULT_PRIORITY_WEIGHTS);
  };

  const handleSave = () => {
    updatePriorityWeights(weights);
    setIsPriorityModalOpen(false);
  };

  return (
    <Modal
      isOpen={isPriorityModalOpen}
      onClose={() => setIsPriorityModalOpen(false)}
      title="Motor de Prioridade Inteligente"
      description="Ajuste os pesos dos critérios comerciais para definir a ordem da fila de prospecção."
      size="md"
    >
      <div className="space-y-4 pt-1">
        
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" />
          <p>
            O LEADION calcula em tempo real o score de cada oportunidade combinando atrasos, score ICP, urgência e proximidade horária para colocar a próxima ação de maior impacto no topo.
          </p>
        </div>

        <div className="space-y-3.5">
          
          {/* 1. Ações Atrasadas */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-800 mb-1">
              <span className="flex items-center gap-1 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                Ações Atrasadas (Resolução Imediata)
              </span>
              <span className="font-mono bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[11px]">
                {weights.overdueWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={weights.overdueWeight}
              onChange={(e) => handleSliderChange('overdueWeight', Number(e.target.value))}
              className="w-full accent-[#635BFF] cursor-pointer"
            />
          </div>

          {/* 2. Ações de Hoje */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-800 mb-1">
              <span>Ações Agendadas para Hoje</span>
              <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[11px]">
                {weights.dueTodayWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={weights.dueTodayWeight}
              onChange={(e) => handleSliderChange('dueTodayWeight', Number(e.target.value))}
              className="w-full accent-[#635BFF] cursor-pointer"
            />
          </div>

          {/* 3. Score ICP */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-800 mb-1">
              <span>Score ICP da Empresa (0 a 100)</span>
              <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[11px]">
                {weights.scoreWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              value={weights.scoreWeight}
              onChange={(e) => handleSliderChange('scoreWeight', Number(e.target.value))}
              className="w-full accent-[#635BFF] cursor-pointer"
            />
          </div>

          {/* 4. Urgência Declarada */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-800 mb-1">
              <span>Nível de Urgência (Alta / Média)</span>
              <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[11px]">
                {weights.urgencyWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={weights.urgencyWeight}
              onChange={(e) => handleSliderChange('urgencyWeight', Number(e.target.value))}
              className="w-full accent-[#635BFF] cursor-pointer"
            />
          </div>

          {/* 5. Etapa do Funil */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-800 mb-1">
              <span>Avanço no Funil (Negociação &gt; Proposta &gt; Prospecção)</span>
              <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[11px]">
                {weights.stageWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={weights.stageWeight}
              onChange={(e) => handleSliderChange('stageWeight', Number(e.target.value))}
              className="w-full accent-[#635BFF] cursor-pointer"
            />
          </div>

          {/* 6. Proximidade do Horário */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-800 mb-1">
              <span>Proximidade do Horário Marcado</span>
              <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[11px]">
                {weights.timeProximityWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={weights.timeProximityWeight}
              onChange={(e) => handleSliderChange('timeProximityWeight', Number(e.target.value))}
              className="w-full accent-[#635BFF] cursor-pointer"
            />
          </div>

          {/* 7. Potencial Comercial */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-800 mb-1">
              <span>Potencial Comercial (Ticket Estimado)</span>
              <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[11px]">
                {weights.commercialPotentialWeight} pts
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={weights.commercialPotentialWeight}
              onChange={(e) => handleSliderChange('commercialPotentialWeight', Number(e.target.value))}
              className="w-full accent-[#635BFF] cursor-pointer"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Padrões
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPriorityModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="bg-[#635BFF] hover:bg-[#5248E5] text-white"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Aplicar Regras
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
};
