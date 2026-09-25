import React, { useState, useEffect } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { ObjectionEntity, ObjectionCategory } from '../../core/types/objection';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ShieldAlert, Plus, Trash2, HelpCircle, ListFilter, Sparkles } from 'lucide-react';

const CATEGORY_OPTIONS: Array<{ value: ObjectionCategory; label: string; description: string }> = [
  { value: 'preco', label: 'Preço / Valor (Está caro)', description: 'Lead questiona investimento, ROI ou falta de verba.' },
  { value: 'indecisao', label: 'Indecisão (Vou pensar)', description: 'Lead adia a decisão com receio oculto.' },
  { value: 'desinteresse', label: 'Desinteresse (Não tenho interesse)', description: 'Lead corta o contato inicial de forma reativa.' },
  { value: 'concorrencia', label: 'Concorrência (Já tenho alguém)', description: 'Lead já tem fornecedor, funcionário ou parceiro.' },
  { value: 'timing', label: 'Timing (Agora não / Sem tempo)', description: 'Momento inoportuno ou urgências concorrentes.' },
  { value: 'autoridade', label: 'Autoridade (Falar com meu sócio)', description: 'Necessidade de aprovação compartilhada ou escudo.' },
  { value: 'informacao', label: 'Esquiva (Manda informação)', description: 'Despacho rápido pedindo material por e-mail/WhatsApp.' },
  { value: 'outros', label: 'Outras Objeções Personalizadas', description: 'Objeções específicas do nicho ou modelo de negócio.' },
];

export const ObjectionBuilderModal: React.FC = () => {
  const {
    isObjectionBuilderModalOpen,
    setIsObjectionBuilderModalOpen,
    editingObjectionEntity,
    setEditingObjectionEntity,
    addObjection,
    updateObjection,
  } = useLeadion();

  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ObjectionCategory>('preco');
  const [description, setDescription] = useState('');
  const [conditions, setConditions] = useState<string[]>(['']);
  const [newConditionInput, setNewConditionInput] = useState('');

  useEffect(() => {
    if (editingObjectionEntity) {
      setName(editingObjectionEntity.name);
      setCategory(editingObjectionEntity.category);
      setDescription(editingObjectionEntity.description);
      setConditions(editingObjectionEntity.conditions.length > 0 ? editingObjectionEntity.conditions : ['']);
    } else {
      setName('');
      setCategory('preco');
      setDescription('');
      setConditions(['']);
    }
    setNewConditionInput('');
  }, [editingObjectionEntity, isObjectionBuilderModalOpen]);

  const handleAddCondition = () => {
    if (!newConditionInput.trim()) return;
    setConditions([...conditions.filter((c) => c.trim().length > 0), newConditionInput.trim()]);
    setNewConditionInput('');
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast({ type: 'warning', title: 'Atenção', message: 'O nome da objeção é obrigatório (ex: "Está caro").' });
      return;
    }

    if (!description.trim()) {
      showToast({ type: 'warning', title: 'Atenção', message: 'A descrição da psicologia do lead é importante para guiar o time.' });
      return;
    }

    const validConditions = conditions.filter((c) => c.trim().length > 0);
    if (newConditionInput.trim()) {
      validConditions.push(newConditionInput.trim());
    }

    if (editingObjectionEntity) {
      updateObjection(editingObjectionEntity.id, {
        name: name.trim(),
        category,
        description: description.trim(),
        conditions: validConditions,
      });
      showToast({
        type: 'success',
        title: 'Objeção Atualizada',
        message: `"${name}" foi atualizada na Biblioteca de Objeções.`,
      });
    } else {
      addObjection({
        name: name.trim(),
        category,
        description: description.trim(),
        conditions: validConditions,
        sequences: [],
      });
      showToast({
        type: 'success',
        title: 'Objeção Criada',
        message: `"${name}" adicionada. Agora você pode estruturar os mini-funis de respostas.`,
      });
    }

    setIsObjectionBuilderModalOpen(false);
    setEditingObjectionEntity(null);
  };

  return (
    <Modal
      isOpen={isObjectionBuilderModalOpen}
      onClose={() => {
        setIsObjectionBuilderModalOpen(false);
        setEditingObjectionEntity(null);
      }}
      title={editingObjectionEntity ? `Editar Objeção: ${editingObjectionEntity.name}` : 'Cadastrar Nova Objeção na Biblioteca'}
      size="lg"
    >
      <div className="space-y-5">
        {/* Banner Informativo */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold block">Biblioteca de Objeções vs. Scripts Convencionais</span>
            <p className="leading-relaxed opacity-90">
              Objeções representam travas psicológicas e atritos de vendas. Cada objeção abriga seus próprios mini-funis com sequências táticas de reversão: 
              <span className="font-semibold text-amber-800 dark:text-amber-300"> Resposta 1 → Nova Reação → Resposta 2 → Follow-up → Próxima Etapa</span>.
            </p>
          </div>
        </div>

        {/* Nome da Objeção */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            Nome da Objeção / Trava do Lead <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Ex: "Está caro", "Vou pensar", "Não tenho interesse", "Já tenho alguém"...'
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-[#635BFF]" />
            Categoria Psicológica <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                  category === cat.value
                    ? 'border-[#635BFF] bg-[#635BFF]/5 dark:bg-[#635BFF]/10 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{cat.label}</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">{cat.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Descrição & Psicologia de Fundo */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            Psicologia do Lead / O que ele realmente quer dizer <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: O lead não entendeu a relação custo vs benefício e está com receio de perder margem. Quer segurança de que o investimento se paga rapidamente..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        {/* Condições e Gatilhos de Disparo */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Condições de Disparo / Quando esta objeção costuma acontecer:
          </label>
          
          <div className="space-y-2 mb-2">
            {conditions.filter(c => c.trim().length > 0).map((cond, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-800 dark:text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                  <span>{cond}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCondition(index)}
                  className="text-zinc-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newConditionInput}
              onChange={(e) => setNewConditionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCondition();
                }
              }}
              placeholder="Adicionar condição (ex: Lead recebeu proposta de valor elevado...)"
              className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Adicionar
            </Button>
          </div>
        </div>

        {/* Ações do Footer */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsObjectionBuilderModalOpen(false);
              setEditingObjectionEntity(null);
            }}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            className="w-full sm:w-auto"
          >
            {editingObjectionEntity ? 'Salvar Alterações' : 'Criar Objeção'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
