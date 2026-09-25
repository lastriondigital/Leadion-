import React, { useState, useEffect, useRef } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { ObjectionSequence, ObjectionStepResponse, ObjectionStepType } from '../../core/types/objection';
import { ScriptChannel, ScriptGender, DelayUnit } from '../../core/types/script';
import { interpolateObjectionScript, formatObjectionDelay } from '../../core/utils/objectionInterpolator';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Layers,
  ArrowRight,
  Clock,
  Send,
  Sparkles,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Phone,
  Globe,
  Tag,
  Building2,
  Calendar
} from 'lucide-react';

const STEP_TABS: Array<{ key: ObjectionStepType; label: string; iconNumber: string; subtitle: string }> = [
  { key: 'response_1', label: 'Resposta 1', iconNumber: '1', subtitle: 'Primeiro Desarme' },
  { key: 'reaction', label: 'Nova Reação', iconNumber: '⚡', subtitle: 'Retruco do Lead' },
  { key: 'response_2', label: 'Resposta 2', iconNumber: '2', subtitle: 'Aprofundamento / Prova' },
  { key: 'followup', label: 'Follow-up', iconNumber: '🔄', subtitle: 'Reengajamento' },
  { key: 'next_stage', label: 'Próxima Etapa', iconNumber: '🎯', subtitle: 'Transição no Funil' },
];

const VARIABLE_TAGS = [
  { tag: '{{nome}}', desc: 'Nome do decisor' },
  { tag: '{{empresa}}', desc: 'Nome da empresa' },
  { tag: '{{cidade}}', desc: 'Cidade da empresa' },
  { tag: '{{pais}}', desc: 'País de atuação' },
  { tag: '{{servico}}', desc: 'Serviço ofertado' },
  { tag: '{{preco}}', desc: 'Preço/moeda adaptada' },
  { tag: '{{nicho}}', desc: 'Segmento/Nicho' },
  { tag: '{{responsavel}}', desc: 'Nome do consultor' },
];

export const ObjectionSequenceModal: React.FC = () => {
  const {
    isObjectionSequenceModalOpen,
    setIsObjectionSequenceModalOpen,
    editingObjectionSequence,
    setEditingObjectionSequence,
    objectionsEntities,
    services,
    companies,
    addSequenceToObjection,
    updateSequenceInObjection,
  } = useLeadion();

  const { showToast } = useToast();

  const objectionId = editingObjectionSequence?.objectionId;
  const currentObjection = objectionsEntities.find((o) => o.id === objectionId);

  const [sequenceName, setSequenceName] = useState('');
  const [sequenceDescription, setSequenceDescription] = useState('');
  const [sequenceChannel, setSequenceChannel] = useState<ScriptChannel>('whatsapp');
  const [sequenceServiceId, setSequenceServiceId] = useState('all');

  // Mini-funil estruturado
  const [activeStepType, setActiveStepType] = useState<ObjectionStepType>('response_1');
  const [stepsData, setStepsData] = useState<Record<ObjectionStepType, Partial<ObjectionStepResponse>>>({
    response_1: {
      name: 'Resposta 1: Primeiro Desarme',
      content: '',
      channel: 'whatsapp',
      country: 'Todos',
      gender: 'all',
      serviceId: 'all',
      delay: { value: 0, unit: 'minutes', event: 'manual' },
      nextStageTarget: 'Identificação de Dores',
    },
    reaction: {
      name: 'Nova Reação do Lead',
      content: '',
      channel: 'whatsapp',
      country: 'Todos',
      gender: 'all',
      serviceId: 'all',
      delay: { value: 2, unit: 'hours', event: 'opened' },
      reactionHypothesis: 'O que o lead retrucou após a primeira resposta.',
    },
    response_2: {
      name: 'Resposta 2: Aprofundamento e Prova Social',
      content: '',
      channel: 'whatsapp',
      country: 'Todos',
      gender: 'all',
      serviceId: 'all',
      delay: { value: 15, unit: 'minutes', event: 'previous_sent' },
      nextStageTarget: 'Agendamento de Demonstração',
    },
    followup: {
      name: 'Follow-up de Objeção',
      content: '',
      channel: 'whatsapp',
      country: 'Todos',
      gender: 'all',
      serviceId: 'all',
      delay: { value: 1, unit: 'days', event: 'no_reply' },
      nextStageTarget: 'Reativação de Contato',
    },
    next_stage: {
      name: 'Próxima Etapa no Funil',
      content: '',
      channel: 'whatsapp',
      country: 'Todos',
      gender: 'all',
      serviceId: 'all',
      delay: { value: 0, unit: 'minutes', event: 'manual' },
      nextStageTarget: 'Reunião Agendada / Diagnóstico',
    },
  });

  const [previewCompanyId, setPreviewCompanyId] = useState<string>(companies[0]?.id || '');
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingObjectionSequence?.sequence) {
      const seq = editingObjectionSequence.sequence;
      setSequenceName(seq.name);
      setSequenceDescription(seq.description || '');
      setSequenceChannel(seq.channel || 'whatsapp');
      setSequenceServiceId(seq.serviceId || 'all');

      const mapped: Record<ObjectionStepType, Partial<ObjectionStepResponse>> = { ...stepsData };
      seq.steps.forEach((st) => {
        mapped[st.stepType] = { ...st };
      });
      setStepsData(mapped);
    } else {
      setSequenceName(`Mini-Funil de Reversão: ${currentObjection?.name || 'Objeção'}`);
      setSequenceDescription('Sequência estruturada com desarme, nova reação, aprofundamento, follow-up e avanço de etapa.');
      setSequenceChannel('whatsapp');
      setSequenceServiceId('all');

      // Templates de exemplo
      setStepsData({
        response_1: {
          name: 'Resposta 1: Primeiro Desarme',
          content: 'Compreendo perfeitamente, {{nome}}. É natural priorizar o orçamento da {{empresa}}.\n\nMas me permita uma pergunta rápida: se eu te mostrar como essa solução de {{servico}} recupera o valor nos primeiros 30 dias, faria sentido dar uma olhada?',
          channel: 'whatsapp',
          country: 'Todos',
          gender: 'all',
          serviceId: 'all',
          delay: { value: 0, unit: 'minutes', event: 'manual' },
          nextStageTarget: 'Abertura de Diálogo',
        },
        reaction: {
          name: 'Nova Reação do Lead',
          content: '[Retruco do lead]: "Ainda assim o valor parece alto para este mês."',
          channel: 'whatsapp',
          country: 'Todos',
          gender: 'all',
          serviceId: 'all',
          delay: { value: 2, unit: 'hours', event: 'opened' },
          reactionHypothesis: 'Lead pondera mas quer segurança de baixo risco.',
        },
        response_2: {
          name: 'Resposta 2: Prova Social & Comparativo',
          content: 'Faz todo sentido, {{nome}}! Outros diretores tinham essa mesma preocupação antes de implementarem {{servico}} conosco.\n\nO que fizemos foi dividir a entrega em módulos para que o resultado inicial pague as próximas etapas.\n\nPodemos fazer uma conversa de 8 minutos para te mostrar como fica?',
          channel: 'whatsapp',
          country: 'Todos',
          gender: 'all',
          serviceId: 'all',
          delay: { value: 15, unit: 'minutes', event: 'previous_sent' },
          nextStageTarget: 'Agendamento de Demonstração',
        },
        followup: {
          name: 'Follow-up de Objeção (após 24h)',
          content: 'Oi {{nome}}, tudo bem?\n\nPassando só para saber se conseguiu avaliar o modelo que te enviei para a {{empresa}}. Se o timing não for este agora, sem problemas! Mas se quiser simular uma condição especial, me avise.',
          channel: 'whatsapp',
          country: 'Todos',
          gender: 'all',
          serviceId: 'all',
          delay: { value: 1, unit: 'days', event: 'no_reply' },
          nextStageTarget: 'Reativação de Contato',
        },
        next_stage: {
          name: 'Próxima Etapa: Reunião Marcada',
          content: 'Excelente {{nome}}! Reunião alinhada para amanhã às 14h. Te envio o link da sala agora mesmo.',
          channel: 'whatsapp',
          country: 'Todos',
          gender: 'all',
          serviceId: 'all',
          delay: { value: 0, unit: 'minutes', event: 'manual' },
          nextStageTarget: 'Reunião Agendada no Funil',
        },
      });
    }
  }, [editingObjectionSequence, isObjectionSequenceModalOpen, currentObjection]);

  const currentStep = stepsData[activeStepType];

  const updateCurrentStep = (updates: Partial<ObjectionStepResponse>) => {
    setStepsData((prev) => ({
      ...prev,
      [activeStepType]: {
        ...prev[activeStepType],
        ...updates,
      },
    }));
  };

  const handleInsertVariable = (tag: string) => {
    const textarea = contentInputRef.current;
    if (!textarea) {
      updateCurrentStep({ content: (currentStep.content || '') + ' ' + tag });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const oldText = currentStep.content || '';
    const newText = oldText.substring(0, start) + tag + oldText.substring(end);

    updateCurrentStep({ content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const handleSave = () => {
    if (!objectionId) return;

    if (!sequenceName.trim()) {
      showToast({ type: 'warning', title: 'Atenção', message: 'O nome da sequência é obrigatório.' });
      return;
    }

    // Monta os 5 steps ordenados do mini-funil
    const finalSteps: ObjectionStepResponse[] = [
      {
        id: stepsData.response_1.id || `step-${Date.now()}-1`,
        name: stepsData.response_1.name || 'Resposta 1: Primeiro Desarme',
        stepType: 'response_1',
        channel: sequenceChannel,
        country: stepsData.response_1.country || 'Todos',
        gender: stepsData.response_1.gender || 'all',
        serviceId: sequenceServiceId,
        variables: ['{{nome}}', '{{empresa}}', '{{servico}}'],
        content: stepsData.response_1.content || '',
        previousScriptId: null,
        nextScriptId: stepsData.reaction.id || `step-${Date.now()}-2`,
        delay: stepsData.response_1.delay || { value: 0, unit: 'minutes', event: 'manual' },
        nextStageTarget: stepsData.response_1.nextStageTarget,
        order: 1,
      },
      {
        id: stepsData.reaction.id || `step-${Date.now()}-2`,
        name: stepsData.reaction.name || 'Nova Reação do Lead',
        stepType: 'reaction',
        channel: sequenceChannel,
        country: stepsData.reaction.country || 'Todos',
        gender: stepsData.reaction.gender || 'all',
        serviceId: sequenceServiceId,
        variables: ['{{nome}}'],
        content: stepsData.reaction.content || '',
        previousScriptId: stepsData.response_1.id || `step-${Date.now()}-1`,
        nextScriptId: stepsData.response_2.id || `step-${Date.now()}-3`,
        delay: stepsData.reaction.delay || { value: 2, unit: 'hours', event: 'opened' },
        reactionHypothesis: stepsData.reaction.reactionHypothesis,
        order: 2,
      },
      {
        id: stepsData.response_2.id || `step-${Date.now()}-3`,
        name: stepsData.response_2.name || 'Resposta 2: Aprofundamento e Prova',
        stepType: 'response_2',
        channel: sequenceChannel,
        country: stepsData.response_2.country || 'Todos',
        gender: stepsData.response_2.gender || 'all',
        serviceId: sequenceServiceId,
        variables: ['{{nome}}', '{{empresa}}', '{{servico}}'],
        content: stepsData.response_2.content || '',
        previousScriptId: stepsData.reaction.id || `step-${Date.now()}-2`,
        nextScriptId: stepsData.followup.id || `step-${Date.now()}-4`,
        delay: stepsData.response_2.delay || { value: 15, unit: 'minutes', event: 'previous_sent' },
        nextStageTarget: stepsData.response_2.nextStageTarget,
        order: 3,
      },
      {
        id: stepsData.followup.id || `step-${Date.now()}-4`,
        name: stepsData.followup.name || 'Follow-up de Objeção',
        stepType: 'followup',
        channel: sequenceChannel,
        country: stepsData.followup.country || 'Todos',
        gender: stepsData.followup.gender || 'all',
        serviceId: sequenceServiceId,
        variables: ['{{nome}}', '{{empresa}}'],
        content: stepsData.followup.content || '',
        previousScriptId: stepsData.response_2.id || `step-${Date.now()}-3`,
        nextScriptId: stepsData.next_stage.id || `step-${Date.now()}-5`,
        delay: stepsData.followup.delay || { value: 1, unit: 'days', event: 'no_reply' },
        nextStageTarget: stepsData.followup.nextStageTarget,
        order: 4,
      },
      {
        id: stepsData.next_stage.id || `step-${Date.now()}-5`,
        name: stepsData.next_stage.name || 'Próxima Etapa no Funil',
        stepType: 'next_stage',
        channel: sequenceChannel,
        country: stepsData.next_stage.country || 'Todos',
        gender: stepsData.next_stage.gender || 'all',
        serviceId: sequenceServiceId,
        variables: ['{{nome}}'],
        content: stepsData.next_stage.content || '',
        previousScriptId: stepsData.followup.id || `step-${Date.now()}-4`,
        nextScriptId: null,
        delay: stepsData.next_stage.delay || { value: 0, unit: 'minutes', event: 'manual' },
        nextStageTarget: stepsData.next_stage.nextStageTarget || 'Reunião Agendada',
        order: 5,
      },
    ];

    if (editingObjectionSequence?.sequence) {
      updateSequenceInObjection(objectionId, editingObjectionSequence.sequence.id, {
        name: sequenceName.trim(),
        description: sequenceDescription.trim(),
        channel: sequenceChannel,
        serviceId: sequenceServiceId,
        steps: finalSteps,
      });
      showToast({
        type: 'success',
        title: 'Mini-Funil Atualizado',
        message: `"${sequenceName}" salvo com 5 etapas estruturadas.`,
      });
    } else {
      addSequenceToObjection(objectionId, {
        name: sequenceName.trim(),
        description: sequenceDescription.trim(),
        channel: sequenceChannel,
        serviceId: sequenceServiceId,
        isDefault: false,
        steps: finalSteps,
      });
      showToast({
        type: 'success',
        title: 'Mini-Funil Criado',
        message: `Nova sequência adicionada para a objeção "${currentObjection?.name}".`,
      });
    }

    setIsObjectionSequenceModalOpen(false);
    setEditingObjectionSequence(null);
  };

  const previewComp = companies.find((c) => c.id === previewCompanyId) || companies[0];
  const interpolatedText = interpolateObjectionScript(currentStep?.content || '', previewComp);

  return (
    <Modal
      isOpen={isObjectionSequenceModalOpen}
      onClose={() => {
        setIsObjectionSequenceModalOpen(false);
        setEditingObjectionSequence(null);
      }}
      title={`Configurar Mini-Funil de Objeção: ${currentObjection?.name || ''}`}
      size="xl"
    >
      <div className="space-y-6">
        
        {/* Metadados Gerais da Sequência */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Nome do Mini-Funil / Sequência
            </label>
            <input
              type="text"
              value={sequenceName}
              onChange={(e) => setSequenceName(e.target.value)}
              placeholder="Ex: Mini-Funil Principal: Desarme → Retruco → Prova Social → Reunião"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Canal de Disparo
            </label>
            <select
              value={sequenceChannel}
              onChange={(e) => setSequenceChannel(e.target.value as ScriptChannel)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Telefone / Ligação</option>
              <option value="email">E-mail Corporativo</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram Direct</option>
            </select>
          </div>
        </div>

        {/* Diagrama Visual do Mini-Funil com Abas Interativas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#635BFF]" />
              Estrutura do Mini-Funil (5 Etapas Conectadas)
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Clique nas etapas para editar cada resposta e retruco
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {STEP_TABS.map((tab, idx) => {
              const isActive = activeStepType === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveStepType(tab.key)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isActive
                      ? 'border-[#635BFF] bg-[#635BFF]/10 text-zinc-900 dark:text-zinc-100 shadow-xs ring-1 ring-[#635BFF]'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive
                          ? 'bg-[#635BFF] text-white'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {tab.iconNumber}
                    </span>
                    {idx < 4 && (
                      <ArrowRight className="w-3 h-3 text-zinc-400 hidden sm:block" />
                    )}
                  </div>
                  <div className="text-xs font-bold truncate">{tab.label}</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    {tab.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor da Etapa Selecionada */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#635BFF]" />
                Editando {STEP_TABS.find((t) => t.key === activeStepType)?.label} ({STEP_TABS.find((t) => t.key === activeStepType)?.subtitle})
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Configure os parâmetros de canal, país, delay e o script com variáveis dinâmicas.
              </p>
            </div>

            {/* Delay da Etapa */}
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs">
              <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Delay:</span>
              <input
                type="number"
                min="0"
                value={currentStep.delay?.value ?? 0}
                onChange={(e) =>
                  updateCurrentStep({
                    delay: {
                      value: parseInt(e.target.value) || 0,
                      unit: currentStep.delay?.unit || 'minutes',
                      event: currentStep.delay?.event || 'manual',
                    },
                  })
                }
                className="w-12 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 text-center text-xs font-mono"
              />
              <select
                value={currentStep.delay?.unit || 'minutes'}
                onChange={(e) =>
                  updateCurrentStep({
                    delay: {
                      value: currentStep.delay?.value || 0,
                      unit: e.target.value as DelayUnit,
                      event: currentStep.delay?.event || 'manual',
                    },
                  })
                }
                className="bg-transparent text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="minutes">minutos</option>
                <option value="hours">horas</option>
                <option value="days">dias</option>
                <option value="weeks">semanas</option>
              </select>
            </div>
          </div>

          {/* Configuração de País, Gênero e Serviço */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3" /> País Alvo
              </label>
              <select
                value={currentStep.country || 'Todos'}
                onChange={(e) => updateCurrentStep({ country: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200"
              >
                <option value="Todos">Todos os Países</option>
                <option value="Moçambique">Moçambique (MT)</option>
                <option value="Portugal">Portugal (€)</option>
                <option value="Brasil">Brasil (R$)</option>
                <option value="Angola">Angola (Kz)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Gênero do Decisor
              </label>
              <select
                value={currentStep.gender || 'all'}
                onChange={(e) => updateCurrentStep({ gender: e.target.value as ScriptGender })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200"
              >
                <option value="all">Qualquer / Neutro</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Serviço Relacionado
              </label>
              <select
                value={currentStep.serviceId || 'all'}
                onChange={(e) => updateCurrentStep({ serviceId: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200"
              >
                <option value="all">Geral / Todos os Serviços</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inserção Rápida de Variáveis */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#635BFF]" />
              Clique para Inserir Variável Dinâmica:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLE_TAGS.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleInsertVariable(v.tag)}
                  className="px-2 py-1 rounded-md bg-zinc-100 hover:bg-[#635BFF]/10 dark:bg-zinc-800 hover:text-[#635BFF] text-zinc-700 dark:text-zinc-300 text-[11px] font-mono border border-zinc-200 dark:border-zinc-700 transition-colors flex items-center gap-1"
                >
                  <span>{v.tag}</span>
                  <span className="text-[9px] text-zinc-400 font-sans">({v.desc})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Texto do Script */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Conteúdo do Script ({STEP_TABS.find((t) => t.key === activeStepType)?.label})
            </label>
            <textarea
              ref={contentInputRef}
              rows={5}
              value={currentStep.content || ''}
              onChange={(e) => updateCurrentStep({ content: e.target.value })}
              placeholder="Escreva a resposta persuasiva com as variáveis dinâmicas..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#635BFF] font-mono leading-relaxed"
            />
          </div>

          {/* Previsão de Nova Reação / Próxima Etapa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Hipótese de Reação do Lead
              </label>
              <input
                type="text"
                value={currentStep.reactionHypothesis || ''}
                onChange={(e) => updateCurrentStep({ reactionHypothesis: e.target.value })}
                placeholder="Ex: Lead diz que precisa ver como fica o caixa..."
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Próxima Etapa / Objetivo Tático
              </label>
              <input
                type="text"
                value={currentStep.nextStageTarget || ''}
                onChange={(e) => updateCurrentStep({ nextStageTarget: e.target.value })}
                placeholder="Ex: Agendamento de Reunião de 10 minutos..."
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* Prévia Realista Simulada no WhatsApp com Empresa Real */}
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Simulação em Tempo Real no WhatsApp:
            </span>

            {/* Seletor de Empresa para teste */}
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">Empresa de Teste:</span>
              <select
                value={previewCompanyId}
                onChange={(e) => setPreviewCompanyId(e.target.value)}
                className="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200"
              >
                {companies.length === 0 ? (
                  <option value="">Nenhuma empresa cadastrada</option>
                ) : (
                  companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.decisionMakerName || c.responsibles?.[0]?.name || 'Sem decisor'})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Balão de Chat WhatsApp */}
          <div className="p-4 rounded-xl bg-[#EFEAE2] dark:bg-[#111B21] border border-zinc-200 dark:border-zinc-800 flex justify-end">
            <div className="max-w-md bg-[#D9FDD3] dark:bg-[#005C4B] text-zinc-900 dark:text-zinc-100 p-3.5 rounded-2xl rounded-tr-xs shadow-xs text-xs whitespace-pre-wrap leading-relaxed">
              {interpolatedText || (
                <span className="italic text-zinc-400 dark:text-zinc-300">
                  Escreva o texto acima para visualizar a interpolação ao vivo...
                </span>
              )}
              <div className="text-[10px] text-zinc-500 dark:text-zinc-300 text-right mt-1.5 flex items-center justify-end gap-1">
                <span>10:42</span>
                <span>✓✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsObjectionSequenceModalOpen(false);
              setEditingObjectionSequence(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Salvar Mini-Funil Completo
          </Button>
        </div>

      </div>
    </Modal>
  );
};
