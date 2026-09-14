import React, { useState, useEffect } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { FunnelEntity, FunnelStage } from '../../core/types/funnel';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Layers, Sparkles, AlertCircle } from 'lucide-react';

export const FunnelFormModal: React.FC = () => {
  const {
    isFunnelModalOpen,
    setIsFunnelModalOpen,
    editingFunnel,
    setEditingFunnel,
    addFunnel,
    updateFunnel,
  } = useLeadion();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [isDefault, setIsDefault] = useState(false);
  const [template, setTemplate] = useState<'standard_b2b' | 'agile_lp' | 'blank'>('standard_b2b');

  useEffect(() => {
    if (editingFunnel) {
      setName(editingFunnel.name);
      setCode(editingFunnel.code);
      setDescription(editingFunnel.description || '');
      setStatus(editingFunnel.status);
      setIsDefault(Boolean(editingFunnel.isDefault));
    } else {
      setName('');
      setCode(`FUN-${Math.floor(10 + Math.random() * 90)}`);
      setDescription('');
      setStatus('active');
      setIsDefault(false);
      setTemplate('standard_b2b');
    }
  }, [editingFunnel, isFunnelModalOpen]);

  const handleClose = () => {
    setIsFunnelModalOpen(false);
    setEditingFunnel(null);
  };

  const generateTemplateStages = (): FunnelStage[] => {
    if (template === 'agile_lp') {
      return [
        { id: `stg-${Date.now()}-1`, name: 'Mapeamento Digital', order: 0, color: 'zinc', stageType: 'open', description: 'Identificação do site e gargalos de conversão.' },
        { id: `stg-${Date.now()}-2`, name: 'Abordagem WhatsApp', order: 1, color: 'blue', stageType: 'in_progress', description: 'Mensagem com gancho direto e diagnóstico.' },
        { id: `stg-${Date.now()}-3`, name: 'Demonstração de Modelo', order: 2, color: 'purple', stageType: 'in_progress', description: 'Apresentação de modelo de alta conversão.' },
        { id: `stg-${Date.now()}-4`, name: 'Proposta Fechada', order: 3, color: 'orange', stageType: 'in_progress', description: 'Envio de preço fixo e escopo.' },
        { id: `stg-${Date.now()}-5`, name: 'Cliente Fechado', order: 4, color: 'emerald', stageType: 'won', description: 'Contrato fechado e kickoff.' },
        { id: `stg-${Date.now()}-6`, name: 'Descartado / Sem Verba', order: 5, color: 'rose', stageType: 'lost', description: 'Sem interesse ou verba no momento.' },
      ];
    }

    if (template === 'blank') {
      return [
        { id: `stg-${Date.now()}-1`, name: 'Novo Lead', order: 0, color: 'zinc', stageType: 'open', description: 'Entrada no funil' },
        { id: `stg-${Date.now()}-2`, name: 'Contato Inicial', order: 1, color: 'blue', stageType: 'in_progress', description: 'Primeiro contato' },
        { id: `stg-${Date.now()}-3`, name: 'Negociação', order: 2, color: 'amber', stageType: 'in_progress', description: 'Alinhamento de valores' },
        { id: `stg-${Date.now()}-4`, name: 'Ganho', order: 3, color: 'emerald', stageType: 'won', description: 'Fechamento' },
        { id: `stg-${Date.now()}-5`, name: 'Perdido', order: 4, color: 'rose', stageType: 'lost', description: 'Perda' },
      ];
    }

    // Default standard B2B: as specified in user requirement
    return [
      { id: `stg-${Date.now()}-0`, name: 'Novo', order: 0, color: 'zinc', stageType: 'open', description: 'Empresa mapeada e pronta para triagem' },
      { id: `stg-${Date.now()}-1`, name: 'Qualificação', order: 1, color: 'cyan', stageType: 'in_progress', description: 'Triagem de perfil e decisor' },
      { id: `stg-${Date.now()}-2`, name: 'Primeira abordagem', order: 2, color: 'blue', stageType: 'in_progress', description: 'Disparo da primeira mensagem' },
      { id: `stg-${Date.now()}-3`, name: 'Aguardando resposta', order: 3, color: 'amber', stageType: 'in_progress', description: 'Mensagem entregue aguardando réplica' },
      { id: `stg-${Date.now()}-4`, name: 'Conversando', order: 4, color: 'purple', stageType: 'in_progress', description: 'Diálogo ativo e levantamento de necessidades' },
      { id: `stg-${Date.now()}-5`, name: 'Necessidade identificada', order: 5, color: 'purple', stageType: 'in_progress', description: 'Problema confirmado e solução alinhada' },
      { id: `stg-${Date.now()}-6`, name: 'Oferta', order: 6, color: 'orange', stageType: 'in_progress', description: 'Apresentação da solução' },
      { id: `stg-${Date.now()}-7`, name: 'Proposta', order: 7, color: 'orange', stageType: 'in_progress', description: 'Proposta comercial formal enviada' },
      { id: `stg-${Date.now()}-8`, name: 'Negociação', order: 8, color: 'amber', stageType: 'in_progress', description: 'Ajustes finos de escopo e contrato' },
      { id: `stg-${Date.now()}-9`, name: 'Ganho', order: 9, color: 'emerald', stageType: 'won', description: 'Venda concretizada' },
      { id: `stg-${Date.now()}-10`, name: 'Perdido', order: 10, color: 'rose', stageType: 'lost', description: 'Desistência ou sem fit' },
    ];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingFunnel) {
      updateFunnel(editingFunnel.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        status,
        isDefault,
      });
    } else {
      const initialStages = generateTemplateStages();
      addFunnel({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        status,
        isDefault,
        stages: initialStages,
      });
    }

    handleClose();
  };

  return (
    <Modal
      isOpen={isFunnelModalOpen}
      onClose={handleClose}
      title={editingFunnel ? 'Editar Funil Comercial' : 'Criar Novo Funil de Vendas'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Nome do Funil *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Funil Consultivo B2B, Funil Landing Pages, Outbound Frotas"
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Código / Sigla
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FUN-01"
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Status Operacional
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}
              className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            >
              <option value="active">Ativo (Em Operação)</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Descrição do Objetivo & Estratégia
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Esteira comercial para prestação de serviços digitais e consultoria de alto ticket."
            className="w-full text-xs px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 resize-none"
          />
        </div>

        {!editingFunnel && (
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#635BFF]" />
              Estrutura Inicial de Etapas
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`p-2.5 rounded-xl border cursor-pointer text-left transition-all ${
                  template === 'standard_b2b'
                    ? 'border-[#635BFF] bg-[#635BFF]/5 text-zinc-900 dark:text-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value="standard_b2b"
                  checked={template === 'standard_b2b'}
                  onChange={() => setTemplate('standard_b2b')}
                  className="sr-only"
                />
                <span className="block text-xs font-bold">Padrão B2B (11 Etapas)</span>
                <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Novo até Ganho/Perdido completo
                </span>
              </label>

              <label
                className={`p-2.5 rounded-xl border cursor-pointer text-left transition-all ${
                  template === 'agile_lp'
                    ? 'border-[#635BFF] bg-[#635BFF]/5 text-zinc-900 dark:text-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value="agile_lp"
                  checked={template === 'agile_lp'}
                  onChange={() => setTemplate('agile_lp')}
                  className="sr-only"
                />
                <span className="block text-xs font-bold">Ágil LP (6 Etapas)</span>
                <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Ciclo de fechamento rápido
                </span>
              </label>

              <label
                className={`p-2.5 rounded-xl border cursor-pointer text-left transition-all ${
                  template === 'blank'
                    ? 'border-[#635BFF] bg-[#635BFF]/5 text-zinc-900 dark:text-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value="blank"
                  checked={template === 'blank'}
                  onChange={() => setTemplate('blank')}
                  className="sr-only"
                />
                <span className="block text-xs font-bold">Enxuto (5 Etapas)</span>
                <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Estrutura essencial
                </span>
              </label>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#635BFF]" />
              Você poderá adicionar, renomear, reordenar ou remover qualquer etapa depois.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-zinc-300 text-[#635BFF] focus:ring-[#635BFF]"
            />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Definir como funil padrão do sistema
            </span>
          </label>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingFunnel ? 'Salvar Alterações' : 'Criar Funil'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
