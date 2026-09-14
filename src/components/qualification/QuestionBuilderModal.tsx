import React, { useState, useEffect } from 'react';
import { 
  X, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Save, 
  Scale, 
  Sliders, 
  Check, 
  Building2, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { 
  QualificationQuestion, 
  QualificationTargetType, 
  QualificationResponseType, 
  QualificationOption 
} from '../../core/types/qualification';
import { ServiceEntity } from '../../core/types/service';

interface QuestionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: QualificationQuestion) => void;
  questionToEdit?: QualificationQuestion | null;
  services: ServiceEntity[];
}

export const QuestionBuilderModal: React.FC<QuestionBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  questionToEdit,
  services,
}) => {
  const [text, setText] = useState('');
  const [targetType, setTargetType] = useState<QualificationTargetType>('client');
  const [serviceId, setServiceId] = useState<string>('all');
  const [category, setCategory] = useState('Presença Digital & Infraestrutura');
  const [responseType, setResponseType] = useState<QualificationResponseType>('boolean');
  const [weight, setWeight] = useState<number>(1.5);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [rationale, setRationale] = useState('');
  
  // Opções e pontos configuráveis
  const [options, setOptions] = useState<QualificationOption[]>([
    { id: 'opt-nao', label: 'Não', value: 'nao', points: 20, isIdeal: true },
    { id: 'opt-sim', label: 'Sim', value: 'sim', points: 0, isIdeal: false },
  ]);
  const [idealResponse, setIdealResponse] = useState('nao');

  useEffect(() => {
    if (questionToEdit) {
      setText(questionToEdit.text);
      setTargetType(questionToEdit.targetType);
      setServiceId(questionToEdit.serviceId || 'all');
      setCategory(questionToEdit.category || 'Geral');
      setResponseType(questionToEdit.responseType);
      setWeight(questionToEdit.weight || 1);
      setStatus(questionToEdit.status);
      setRationale(questionToEdit.rationale || '');
      setOptions(questionToEdit.options.map((o) => ({ ...o })));
      setIdealResponse(questionToEdit.idealResponse);
    } else {
      setText('');
      setTargetType('client');
      setServiceId('all');
      setCategory('Presença Digital & Infraestrutura');
      setResponseType('boolean');
      setWeight(1.5);
      setStatus('active');
      setRationale('');
      setOptions([
        { id: 'opt-nao', label: 'Não', value: 'nao', points: 20, isIdeal: true },
        { id: 'opt-sim', label: 'Sim', value: 'sim', points: 0, isIdeal: false },
      ]);
      setIdealResponse('nao');
    }
  }, [questionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleResponseTypeChange = (type: QualificationResponseType) => {
    setResponseType(type);
    if (type === 'boolean') {
      setOptions([
        { id: 'opt-sim', label: 'Sim', value: 'sim', points: 15, isIdeal: true },
        { id: 'opt-nao', label: 'Não', value: 'nao', points: 0, isIdeal: false },
      ]);
      setIdealResponse('sim');
    } else if (type === 'choice') {
      setOptions([
        { id: 'opt-1', label: 'Alto / Total', value: 'alto', points: 25, isIdeal: true },
        { id: 'opt-2', label: 'Médio / Parcial', value: 'medio', points: 10, isIdeal: false },
        { id: 'opt-3', label: 'Baixo / Inexistente', value: 'baixo', points: 0, isIdeal: false },
      ]);
      setIdealResponse('alto');
    } else if (type === 'scale') {
      setOptions([
        { id: 'opt-s-5', label: 'Excelente (5)', value: '5', points: 25, isIdeal: true },
        { id: 'opt-s-4', label: 'Bom (4)', value: '4', points: 18, isIdeal: false },
        { id: 'opt-s-3', label: 'Regular (3)', value: '3', points: 10, isIdeal: false },
        { id: 'opt-s-2', label: 'Fraco (2)', value: '2', points: 5, isIdeal: false },
        { id: 'opt-s-1', label: 'Crítico (1)', value: '1', points: 0, isIdeal: false },
      ]);
      setIdealResponse('5');
    }
  };

  const handleUpdateOptionPoints = (index: number, points: number) => {
    const updated = [...options];
    updated[index].points = isNaN(points) ? 0 : points;
    setOptions(updated);
  };

  const handleUpdateOptionLabel = (index: number, label: string) => {
    const updated = [...options];
    updated[index].label = label;
    setOptions(updated);
  };

  const handleAddOption = () => {
    const newId = `opt-${Date.now()}`;
    setOptions([
      ...options,
      { id: newId, label: `Nova Opção ${options.length + 1}`, value: newId, points: 5, isIdeal: false },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    if (idealResponse === options[index].value) {
      setIdealResponse(updated[0].value);
    }
  };

  const handleSelectIdeal = (val: string) => {
    setIdealResponse(val);
    setOptions(
      options.map((o) => ({
        ...o,
        isIdeal: o.value === val,
      }))
    );
  };

  const handleSave = () => {
    if (!text.trim()) return;

    const matchedService = services.find((s) => s.id === serviceId);
    const idealOption = options.find((o) => o.value === idealResponse) || options[0];

    const finalQuestion: QualificationQuestion = {
      id: questionToEdit?.id || `q-${Date.now()}`,
      text: text.trim(),
      targetType,
      serviceId: targetType === 'service' ? serviceId : undefined,
      serviceName: targetType === 'service' ? (matchedService ? matchedService.name : 'Todos os Serviços') : undefined,
      category: category.trim() || 'Geral',
      responseType,
      options,
      idealResponse,
      idealPoints: idealOption ? idealOption.points : 20,
      weight: Number(weight) || 1,
      status,
      rationale: rationale.trim(),
      createdAt: questionToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(finalQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        id="question-builder-modal"
        className="bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-[#111319]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                {questionToEdit ? 'Editar Pergunta de Qualificação' : 'Nova Pergunta de Qualificação'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure os pontos de cada resposta, peso ponderado e resposta ideal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* 1. Alvo do Score */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] block">
              1. Tipo de Avaliação
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('client')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  targetType === 'client'
                    ? 'border-[#635BFF] bg-[#635BFF]/5 text-zinc-900 dark:text-white font-bold ring-1 ring-[#635BFF]'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-[#635BFF]" />
                <div>
                  <div className="text-xs">Score do Cliente</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Perfil comercial da empresa</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('service')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  targetType === 'service'
                    ? 'border-[#635BFF] bg-[#635BFF]/5 text-zinc-900 dark:text-white font-bold ring-1 ring-[#635BFF]'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
                }`}
              >
                <Briefcase className="w-4 h-4 text-[#635BFF]" />
                <div>
                  <div className="text-xs">Score do Serviço</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Adequação de oferta específica</div>
                </div>
              </button>
            </div>
          </div>

          {/* Se for serviço, selecionar qual serviço */}
          {targetType === 'service' && (
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] block">
                Serviço Vinculado
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#635BFF]"
              >
                <option value="all">Geral para todos os serviços</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Texto da Pergunta */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] block">
              2. Texto da Pergunta
            </label>
            <input
              type="text"
              placeholder="Ex: Possui website institucional próprio ativo?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium outline-none focus:border-[#635BFF]"
            />
          </div>

          {/* Categoria e Peso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] block">
                Categoria
              </label>
              <input
                type="text"
                placeholder="Ex: Presença Digital, Decisor, Financeiro"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#635BFF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] block">
                Peso Multiplicador ({weight}x)
              </label>
              <select
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#635BFF]"
              >
                <option value={1}>1.0x (Peso Padrão)</option>
                <option value={1.5}>1.5x (Alta Relevância)</option>
                <option value={2}>2.0x (Fator Crítico)</option>
                <option value={3}>3.0x (Critério Decisivo)</option>
              </select>
            </div>
          </div>

          {/* 3. Tipo de Resposta */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] block">
              3. Tipo de Resposta & Pontos Configuráveis
            </label>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleResponseTypeChange('boolean')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  responseType === 'boolean'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Sim / Não
              </button>
              <button
                type="button"
                onClick={() => handleResponseTypeChange('choice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  responseType === 'choice'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Múltipla Escolha
              </button>
              <button
                type="button"
                onClick={() => handleResponseTypeChange('scale')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  responseType === 'scale'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Escala de 1 a 5
              </button>
            </div>

            {/* Lista de Opções com pontos configuráveis */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2.5">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 flex items-center justify-between">
                <span>Defina os pontos atribuídos a cada resposta:</span>
                <span className="text-[10px] text-[#635BFF] font-bold">Marque o círculo para Resposta Ideal</span>
              </div>

              {options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  {/* Seletor de Resposta Ideal */}
                  <button
                    type="button"
                    onClick={() => handleSelectIdeal(opt.value)}
                    title="Definir como Resposta Ideal"
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                      idealResponse === opt.value
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    {idealResponse === opt.value && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  {/* Label da opção */}
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => handleUpdateOptionLabel(idx, e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs outline-none"
                  />

                  {/* Pontos configuráveis */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-zinc-400 font-bold">+</span>
                    <input
                      type="number"
                      value={opt.points}
                      onChange={(e) => handleUpdateOptionPoints(idx, parseInt(e.target.value, 10))}
                      className="w-16 p-2 text-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs outline-none focus:border-[#635BFF]"
                    />
                    <span className="text-[11px] text-zinc-500">pts</span>
                  </div>

                  {/* Excluir opção (se for choice) */}
                  {responseType === 'choice' && options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {responseType === 'choice' && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-1 text-xs text-[#635BFF] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar Opção
                </button>
              )}
            </div>
          </div>

          {/* 4. Racional Explicativo */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] block">
              4. Por que esta pontuação? (Racional Técnico Auditável)
            </label>
            <textarea
              rows={2}
              placeholder="Explique o motivo de negócio pelo qual esta resposta agrega esses pontos..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs outline-none focus:border-[#635BFF]"
            />
          </div>

          {/* Status Ativo/Inativo */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs block">
                Status da Pergunta
              </span>
              <span className="text-[11px] text-zinc-400">
                Apenas perguntas ativas entram na soma ponderada dos scores.
              </span>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#111319] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!text.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5248E2] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Pergunta
          </button>
        </div>
      </div>
    </div>
  );
};
