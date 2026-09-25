import React, { useState } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { ObjectionEntity, ObjectionCategory, ObjectionSequence } from '../../core/types/objection';
import { formatObjectionDelay } from '../../core/utils/objectionInterpolator';
import { Button } from '../ui/Button';
import {
  ShieldAlert,
  Plus,
  Search,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  Edit2,
  Trash2,
  CopyPlus,
  Send,
  Building2,
  ListFilter,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

export const ObjectionsView: React.FC = () => {
  const {
    objectionsEntities,
    duplicateObjection,
    deleteObjection,
    setIsObjectionBuilderModalOpen,
    setEditingObjectionEntity,
    setIsObjectionSequenceModalOpen,
    setEditingObjectionSequence,
    openObjectionDispatchModal,
    setActiveNav,
  } = useLeadion();

  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedObjectionIds, setExpandedObjectionIds] = useState<Record<string, boolean>>(() => {
    // Abre a primeira objeção por padrão
    return { 'obj-preco-01': true };
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedObjectionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast({
      type: 'info',
      title: 'Script Copiado',
      message: 'Texto de contorno copiado para a área de transferência.',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateNewObjection = () => {
    setEditingObjectionEntity(null);
    setIsObjectionBuilderModalOpen(true);
  };

  const handleEditObjection = (obj: ObjectionEntity) => {
    setEditingObjectionEntity(obj);
    setIsObjectionBuilderModalOpen(true);
  };

  const handleAddSequence = (obj: ObjectionEntity) => {
    setEditingObjectionSequence({ objectionId: obj.id, sequence: null });
    setIsObjectionSequenceModalOpen(true);
  };

  const handleEditSequence = (obj: ObjectionEntity, seq: ObjectionSequence) => {
    setEditingObjectionSequence({ objectionId: obj.id, sequence: seq });
    setIsObjectionSequenceModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir a objeção "${name}" e todos os seus mini-funis?`)) {
      deleteObjection(id);
      showToast({
        type: 'info',
        title: 'Objeção Removida',
        message: `"${name}" foi excluída da biblioteca.`,
      });
    }
  };

  // Contadores
  const totalObjections = objectionsEntities.length;
  const totalSequences = objectionsEntities.reduce((acc, o) => acc + o.sequences.length, 0);
  const totalResponses = objectionsEntities.reduce(
    (acc, o) => acc + o.sequences.reduce((sAcc, s) => sAcc + s.steps.length, 0),
    0
  );

  // Filtro
  const filteredObjections = objectionsEntities.filter((obj) => {
    if (selectedCategory !== 'all' && obj.category !== selectedCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      obj.name.toLowerCase().includes(q) ||
      obj.description.toLowerCase().includes(q) ||
      obj.conditions.some((c) => c.toLowerCase().includes(q)) ||
      obj.sequences.some(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.steps.some((st) => st.content.toLowerCase().includes(q) || st.name.toLowerCase().includes(q))
      )
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Top Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Biblioteca de Objeções & Mini-Funis
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Mapeamento tático de reversão de atrito: <span className="font-semibold text-zinc-700 dark:text-zinc-300">Objeção → Resposta 1 → Nova Reação → Resposta 2 → Follow-up → Próxima Etapa</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openObjectionDispatchModal()}
            icon={<Send className="w-3.5 h-3.5 text-emerald-500" />}
          >
            Simular Disparo no WhatsApp
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateNewObjection}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Nova Objeção
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Total de Objeções
          </span>
          <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5 block">
            {totalObjections}
          </span>
          <span className="text-[10px] text-zinc-500 mt-1 block">Travas mapeadas</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Mini-Funis Ativos
          </span>
          <span className="text-xl font-black text-[#635BFF] mt-0.5 block">
            {totalSequences}
          </span>
          <span className="text-[10px] text-zinc-500 mt-1 block">Sequências encadeadas</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Respostas & Follow-ups
          </span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {totalResponses}
          </span>
          <span className="text-[10px] text-zinc-500 mt-1 block">Etapas de contorno</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Canal Preferencial
          </span>
          <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5 block">
            WhatsApp
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            Disparo assistido direto
          </span>
        </div>
      </div>

      {/* Barra de Busca e Filtro de Categorias */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Input de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome da objeção, trava do lead, argumento ou psicologia..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ListFilter className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-500 font-medium">Categoria:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 font-medium"
            >
              <option value="all">Todas as Categorias</option>
              <option value="preco">Preço (Está caro)</option>
              <option value="indecisao">Indecisão (Vou pensar)</option>
              <option value="desinteresse">Desinteresse (Não tenho interesse)</option>
              <option value="concorrencia">Concorrência (Já tenho alguém)</option>
              <option value="timing">Timing (Agora não)</option>
              <option value="autoridade">Autoridade (Falar com meu sócio)</option>
              <option value="informacao">Esquiva (Manda informação)</option>
              <option value="outros">Outras</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Objeções */}
      <div className="space-y-4">
        {objectionsEntities.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-zinc-300 mx-auto" />
            <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Nenhuma objeção cadastrada.
            </div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Cadastre objeções reais e argumentos de contorno para guiar sua equipe de vendas.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNewObjection}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Nova Objeção
            </Button>
          </div>
        ) : filteredObjections.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-zinc-300 mx-auto" />
            <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Nenhuma objeção encontrada para a busca
            </div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Tente buscar por outros termos como &ldquo;caro&rdquo;, &ldquo;sócio&rdquo;, &ldquo;pensar&rdquo; ou crie uma nova objeção na biblioteca.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          filteredObjections.map((obj) => {
            const isExpanded = !!expandedObjectionIds[obj.id];

            return (
              <div
                key={obj.id}
                className="rounded-2xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden transition-all"
              >
                {/* Header do Card da Objeção */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(obj.id)}
                      className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 hover:bg-amber-500/20 transition-colors"
                    >
                      <ShieldAlert className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {obj.name}
                        </h3>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                          {obj.category}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          • {obj.sequences.length} {obj.sequences.length === 1 ? 'mini-funil' : 'mini-funis'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {obj.description}
                      </p>
                    </div>
                  </div>

                  {/* Ações da Objeção */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openObjectionDispatchModal(undefined, undefined, obj.id)}
                      className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs"
                      icon={<Send className="w-3 h-3" />}
                    >
                      Disparar Resposta
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSequence(obj)}
                      icon={<Plus className="w-3 h-3" />}
                      className="text-xs"
                    >
                      + Mini-Funil
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleEditObjection(obj)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      title="Editar Objeção"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        duplicateObjection(obj.id);
                        showToast({ type: 'info', title: 'Objeção Duplicada', message: `Cópia de "${obj.name}" criada.` });
                      }}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      title="Duplicar Objeção"
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(obj.id, obj.name)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-500"
                      title="Excluir Objeção"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(obj.id)}
                      className="text-xs font-semibold text-[#635BFF] px-2 py-1 hover:underline"
                    >
                      {isExpanded ? 'Recolher' : 'Ver Mini-Funis'}
                    </button>
                  </div>
                </div>

                {/* Corpo Expansível com os Mini-Funis */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-5">
                    
                    {/* Condições de Disparo da Objeção */}
                    {obj.conditions.length > 0 && (
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-1.5">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Quando esta trava costuma ocorrer:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {obj.conditions.map((cond, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px]"
                            >
                              • {cond}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sequências / Mini-Funis Cadastrados */}
                    <div className="space-y-4">
                      {obj.sequences.map((seq, sIdx) => (
                        <div
                          key={seq.id}
                          className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs space-y-3"
                        >
                          {/* Cabeçalho do Mini-Funil */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-[#635BFF]" />
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                  {seq.name}
                                </h4>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {seq.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                Canal: {seq.channel}
                              </span>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSequence(obj, seq)}
                                icon={<Edit2 className="w-3 h-3" />}
                                className="text-xs"
                              >
                                Editar Mini-Funil
                              </Button>
                            </div>
                          </div>

                          {/* Diagrama Visual do Mini-Funil: Objeção → Resposta 1 → Nova Reação → Resposta 2 → Follow-up → Próxima Etapa */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                              Fluxo Encadeado do Mini-Funil:
                            </span>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                              {seq.steps.map((step, stIdx) => {
                                const isReaction = step.stepType === 'reaction';
                                const isNextStage = step.stepType === 'next_stage';

                                return (
                                  <div
                                    key={step.id}
                                    className={`p-3 rounded-xl border flex flex-col justify-between text-xs space-y-2 transition-all ${
                                      isReaction
                                        ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100'
                                        : isNextStage
                                        ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold">
                                          {stIdx + 1}. {step.stepType === 'response_1' && 'Resposta 1'}
                                          {step.stepType === 'reaction' && 'Nova Reação'}
                                          {step.stepType === 'response_2' && 'Resposta 2'}
                                          {step.stepType === 'followup' && 'Follow-up'}
                                          {step.stepType === 'next_stage' && 'Próxima Etapa'}
                                        </span>

                                        <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                                          <Clock className="w-2.5 h-2.5" />
                                          {formatObjectionDelay(step.delay)}
                                        </span>
                                      </div>

                                      <div className="font-semibold text-xs leading-snug line-clamp-1">
                                        {step.name}
                                      </div>

                                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed italic bg-white/70 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                                        &ldquo;{step.content}&rdquo;
                                      </p>
                                    </div>

                                    <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
                                      <span className="text-zinc-400">
                                        {step.country || 'Todos'}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(`${seq.id}-${step.id}`, step.content)}
                                        className="text-[#635BFF] hover:underline font-semibold flex items-center gap-1"
                                      >
                                        {copiedId === `${seq.id}-${step.id}` ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            <span>Copiado</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copiar</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
