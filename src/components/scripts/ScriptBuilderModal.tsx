import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  ScriptEntity, 
  ScriptChannel, 
  ScriptGender, 
  ScriptStatus, 
  DelayUnit, 
  DelayEvent 
} from '../../core/types/script';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { 
  SCRIPT_AVAILABLE_VARIABLES, 
  extractScriptVariables, 
  replaceScriptVariables, 
  buildWhatsAppLink,
  formatScriptDelayLabel
} from '../../core/utils/scriptVariables';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Linkedin, 
  Instagram, 
  ExternalLink, 
  Sparkles, 
  Copy, 
  Check, 
  Clock, 
  Building2, 
  User, 
  HelpCircle, 
  Plus, 
  XCircle, 
  Save, 
  Trash2,
  ArrowRight,
  ArrowLeft,
  Calendar
} from 'lucide-react';

interface ScriptBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingScript?: ScriptEntity | null;
}

export const ScriptBuilderModal: React.FC<ScriptBuilderModalProps> = ({
  isOpen,
  onClose,
  editingScript,
}) => {
  const { 
    services, 
    funnels, 
    companies, 
    scriptsEntities, 
    createScript, 
    updateScript, 
    deleteScript 
  } = useLeadion();
  const { showToast } = useToast();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<ScriptChannel>('whatsapp');
  const [country, setCountry] = useState('Moçambique');
  const [gender, setGender] = useState<ScriptGender>('all');
  const [niche, setNiche] = useState('Clínicas & Saúde Estética');
  const [serviceId, setServiceId] = useState('all');
  const [funnelId, setFunnelId] = useState('all');
  const [content, setContent] = useState('');
  const [previousScriptId, setPreviousScriptId] = useState<string>('');
  const [nextScriptId, setNextScriptId] = useState<string>('');
  const [condition, setCondition] = useState('Sem resposta à mensagem anterior');
  const [status, setStatus] = useState<ScriptStatus>('active');
  const [sequenceType, setSequenceType] = useState<'message' | 'followup'>('message');

  // Delay Config
  const [delayValue, setDelayValue] = useState<number>(2);
  const [delayUnit, setDelayUnit] = useState<DelayUnit>('days');
  const [delayCustomLabel, setDelayCustomLabel] = useState('');
  const [delayEvent, setDelayEvent] = useState<DelayEvent>('previous_sent');

  // Preview state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [previewCopied, setPreviewCopied] = useState(false);

  // Preenche dados se estiver editando
  useEffect(() => {
    if (editingScript) {
      setName(editingScript.name);
      setChannel(editingScript.channel);
      setCountry(editingScript.country || 'Todos');
      setGender(editingScript.gender || 'all');
      setNiche(editingScript.niche || 'Geral B2B');
      setServiceId(editingScript.serviceId || 'all');
      setFunnelId(editingScript.funnelId || 'all');
      setContent(editingScript.content);
      setPreviousScriptId(editingScript.previousScriptId || '');
      setNextScriptId(editingScript.nextScriptId || '');
      setCondition(editingScript.condition || 'Sem resposta');
      setStatus(editingScript.status || 'active');
      setSequenceType(editingScript.sequenceType || 'message');

      if (editingScript.delay) {
        setDelayValue(editingScript.delay.value);
        setDelayUnit(editingScript.delay.unit);
        setDelayCustomLabel(editingScript.delay.customLabel || '');
        setDelayEvent(editingScript.delay.event);
      }
    } else {
      // Defaults para novo script
      setName('');
      setChannel('whatsapp');
      setCountry('Moçambique');
      setGender('all');
      setNiche('Clínicas & Saúde Estética');
      setServiceId(services[0]?.id || 'all');
      setFunnelId(funnels[0]?.id || 'all');
      setContent(
        'Olá, {{nome}}! Vi a {{empresa}} em {{cidade}} e notei que vocês ainda não possuem uma {{servico}} otimizada para captação direta.\n\nNotamos que {{problema}}. Temos uma condição exclusiva de {{preco}} ({{moeda}}) para a sua região.\n\nTeria 5 minutos para conversarmos nesta quinta-feira às 10h?'
      );
      setPreviousScriptId('');
      setNextScriptId('');
      setCondition('Primeira abordagem');
      setStatus('active');
      setSequenceType('message');
      setDelayValue(2);
      setDelayUnit('days');
      setDelayEvent('previous_sent');
    }
  }, [editingScript, isOpen, services, funnels]);

  // Define empresa de teste para a prévia (preferencialmente Clínica Aurora)
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      const aurora = companies.find((c) => c.name.toLowerCase().includes('aurora'));
      setSelectedCompanyId(aurora ? aurora.id : companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const testCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;
  }, [companies, selectedCompanyId]);

  const testService = useMemo(() => {
    if (serviceId !== 'all') {
      return services.find((s) => s.id === serviceId) || null;
    }
    return services[0] || null;
  }, [services, serviceId]);

  // Mensagem resolvida em tempo real
  const resolvedPreview = useMemo(() => {
    return replaceScriptVariables(content, testCompany, testService, 'Manuel Domingos');
  }, [content, testCompany, testService]);

  // Variáveis detectadas no texto
  const usedVariables = useMemo(() => {
    return extractScriptVariables(content);
  }, [content]);

  if (!isOpen) return null;

  // Inserção de variável no cursor
  const handleInsertVariable = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + ' ' + tag);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + tag + content.substring(end);
    setContent(newContent);

    // Reposiciona o cursor após a tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(resolvedPreview);
    setPreviewCopied(true);
    showToast({
      type: 'info',
      title: 'Prévia Copiada',
      message: 'Mensagem com variáveis preenchidas copiada.',
    });
    setTimeout(() => setPreviewCopied(false), 2000);
  };

  const handleTestWhatsApp = () => {
    const targetPhone = testCompany?.whatsapp || testCompany?.phone || '+258841234567';
    const url = buildWhatsAppLink(targetPhone, resolvedPreview);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({
        type: 'error',
        title: 'Nome Obrigatório',
        message: 'Por favor, informe um nome para identificar este script.',
      });
      return;
    }

    if (!content.trim()) {
      showToast({
        type: 'error',
        title: 'Conteúdo Obrigatório',
        message: 'O script precisa ter um texto ou roteiro estruturado.',
      });
      return;
    }

    const targetService = services.find((s) => s.id === serviceId);
    const targetFunnel = funnels.find((f) => f.id === funnelId);

    const scriptPayload: Omit<ScriptEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      channel,
      country,
      gender,
      niche,
      serviceId,
      serviceName: targetService?.name,
      funnelId,
      funnelName: targetFunnel?.name,
      variables: usedVariables,
      content: content.trim(),
      previousScriptId: previousScriptId || null,
      nextScriptId: nextScriptId || null,
      condition,
      delay: {
        value: Number(delayValue) || 0,
        unit: delayUnit,
        customLabel: delayCustomLabel,
        event: delayEvent,
      },
      status,
      sequenceType,
    };

    if (editingScript) {
      updateScript(editingScript.id, scriptPayload);
      showToast({
        type: 'success',
        title: 'Script Atualizado',
        message: `O script "${name}" foi atualizado com sucesso.`,
      });
    } else {
      createScript(scriptPayload);
      showToast({
        type: 'success',
        title: 'Script Criado',
        message: `O script "${name}" foi adicionado à sequência.`,
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (!editingScript) return;
    if (window.confirm(`Tem certeza que deseja excluir o script "${editingScript.name}"?`)) {
      deleteScript(editingScript.id);
      showToast({
        type: 'info',
        title: 'Script Excluído',
        message: 'O modelo de script foi removido com sucesso.',
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#141720] rounded-2xl max-w-5xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#635BFF] text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {editingScript ? 'Editar Script & Sequência' : 'Construtor de Script & Sequência'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Crie fluxos contínuos de mensagens com variáveis dinâmicas, prévia realista de WhatsApp e regras de follow-up.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-lg"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Grid 2 Colunas (Editor vs Prévia Real) */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUNA ESQUERDA: Configurações & Editor de Conteúdo (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Linha 1: Nome do Script e Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Nome do Script *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Mensagem 1: Primeira Abordagem Clínica..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#635BFF] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Tipo na Sequência
                  </label>
                  <select
                    value={sequenceType}
                    onChange={(e) => setSequenceType(e.target.value as 'message' | 'followup')}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#635BFF] focus:outline-none"
                  >
                    <option value="message">Mensagem Principal</option>
                    <option value="followup">Follow-up / Retomada</option>
                  </select>
                </div>
              </div>

              {/* Linha 2: Canal, País, Gênero e Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Canal
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as ScriptChannel)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#635BFF] focus:outline-none"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="phone">Telefone / Ligação</option>
                    <option value="instagram">Instagram Direct</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    País Alvo
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#635BFF] focus:outline-none"
                  >
                    <option value="Todos">Todos os Países</option>
                    <option value="Moçambique">Moçambique</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Brasil">Brasil</option>
                    <option value="Angola">Angola</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Gênero
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as ScriptGender)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#635BFF] focus:outline-none"
                  >
                    <option value="all">Neutro / Ambos</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ScriptStatus)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#635BFF] focus:outline-none"
                  >
                    <option value="active">Ativo na Cadência</option>
                    <option value="draft">Rascunho</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
              </div>

              {/* Linha 3: Nicho, Serviço e Funil */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Nicho / Segmento
                  </label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Ex: Clínicas, B2B, Logística..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#635BFF] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Serviço Vinculado
                  </label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#635BFF] focus:outline-none"
                  >
                    <option value="all">Qualquer Serviço</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Funil Vinculado
                  </label>
                  <select
                    value={funnelId}
                    onChange={(e) => setFunnelId(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#635BFF] focus:outline-none"
                  >
                    <option value="all">Qualquer Funil</option>
                    {funnels.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* EDITOR DE CONTEÚDO COM TOOLBAR DE VARIÁVEIS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#635BFF]" />
                    Conteúdo do Script com Tags Dinâmicas *
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Clique na variável abaixo para inseri-la no cursor
                  </span>
                </div>

                {/* Toolbar de Inserção de Variáveis (MANDATÓRIO) */}
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Inserir Variáveis Dinâmicas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SCRIPT_AVAILABLE_VARIABLES.map((v) => (
                      <button
                        key={v.tag}
                        type="button"
                        onClick={() => handleInsertVariable(v.tag)}
                        className="px-2 py-1 bg-white dark:bg-zinc-800 hover:bg-[#635BFF]/10 hover:border-[#635BFF] border border-zinc-200 dark:border-zinc-700 rounded-md text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-1 shadow-2xs"
                        title={`${v.label}: ${v.description} (Ex: ${v.example})`}
                      >
                        <Plus className="w-2.5 h-2.5 text-[#635BFF]" />
                        <span>{v.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  required
                  rows={7}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva seu script utilizando as variáveis acima. Ex: Olá, {{nome}}! Vi a {{empresa}} em {{cidade}}..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#635BFF] focus:outline-none leading-relaxed"
                />

                {/* Variáveis Detectadas */}
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span>Variáveis ativas neste script ({usedVariables.length}):</span>
                  {usedVariables.length > 0 ? (
                    usedVariables.map((uv) => (
                      <span key={uv} className="font-mono text-[#635BFF] bg-[#635BFF]/10 px-1 rounded">
                        {uv}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-400 italic">Nenhuma variável detectada</span>
                  )}
                </div>
              </div>

              {/* SEQUÊNCIA & ENCADEMENTO & FOLLOW-UP RULES */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Regras de Sequência & Follow-up
                  </span>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    Fluxo Encadeado
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Script Anterior */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3 text-zinc-400" />
                      Script Anterior
                    </label>
                    <select
                      value={previousScriptId}
                      onChange={(e) => setPreviousScriptId(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="">Nenhum (Início da Sequência)</option>
                      {scriptsEntities
                        .filter((s) => !editingScript || s.id !== editingScript.id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Próximo Script */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <span>Próximo Script</span>
                      <ArrowRight className="w-3 h-3 text-zinc-400" />
                    </label>
                    <select
                      value={nextScriptId}
                      onChange={(e) => setNextScriptId(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="">Nenhum (Fim da Sequência)</option>
                      {scriptsEntities
                        .filter((s) => !editingScript || s.id !== editingScript.id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Condição de Disparo */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Condição para Avanço / Próxima Mensagem
                  </label>
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="Ex: Sem resposta à mensagem 1, Mensagem visualizada, Pediu detalhes..."
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Delay & Evento de Tempo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Tempo de Espera (Valor)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={delayValue}
                      onChange={(e) => setDelayValue(Number(e.target.value))}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Unidade de Tempo
                    </label>
                    <select
                      value={delayUnit}
                      onChange={(e) => setDelayUnit(e.target.value as DelayUnit)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="minutes">Minutos</option>
                      <option value="hours">Horas</option>
                      <option value="days">Dias</option>
                      <option value="weeks">Semanas</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Calculado a partir de:
                    </label>
                    <select
                      value={delayEvent}
                      onChange={(e) => setDelayEvent(e.target.value as DelayEvent)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="previous_sent">Envio da mensagem anterior</option>
                      <option value="opened">Mensagem visualizada</option>
                      <option value="no_reply">Se permanecer sem resposta</option>
                      <option value="manual">Manual / sob demanda</option>
                    </select>
                  </div>
                </div>

                {delayUnit === 'custom' && (
                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Rótulo Personalizado de Delay
                    </label>
                    <input
                      type="text"
                      value={delayCustomLabel}
                      onChange={(e) => setDelayCustomLabel(e.target.value)}
                      placeholder="Ex: No início da próxima semana útil..."
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* COLUNA DIREITA: PRÉVIA DE CONVERSA REAL COM DADOS DA EMPRESA (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Seletor de Empresa de Teste */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#635BFF]" />
                    Empresa para Teste de Prévia
                  </label>
                  <span className="text-[10px] text-zinc-400">Substituição Instantânea</span>
                </div>
                
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city || c.location}) — {c.country}
                    </option>
                  ))}
                </select>

                {testCompany && (
                  <div className="text-[11px] text-zinc-500 space-y-0.5 pt-1">
                    <div>
                      Decisor: <strong>{testCompany.targetContactName || testCompany.responsibles?.[0]?.name || 'Dr(a). Samira'}</strong> ({testCompany.targetContactRole || 'Diretoria'})
                    </div>
                    <div>
                      País: <strong>{testCompany.country}</strong> · Telefone: <strong>{testCompany.whatsapp || testCompany.phone || 'N/D'}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* SIMULADOR DE CONVERSA REAL (Visual WhatsApp) */}
              <div className="rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-md overflow-hidden bg-[#EFEAE2] dark:bg-[#0B141A]">
                
                {/* WhatsApp Topbar */}
                <div className="px-4 py-2.5 bg-[#075E54] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {testCompany?.name.charAt(0) || 'C'}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight truncate max-w-[160px]">
                        {testCompany?.targetContactName || testCompany?.name || 'Decisor'}
                      </div>
                      <span className="text-[10px] text-emerald-200">online no WhatsApp</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPreview}
                    className="text-xs bg-white/15 hover:bg-white/25 px-2 py-1 rounded text-white font-medium flex items-center gap-1 transition-colors"
                  >
                    {previewCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{previewCopied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                {/* Balão de Mensagem */}
                <div className="p-4 space-y-3 min-h-[220px] flex flex-col justify-end bg-radial from-transparent to-black/5">
                  <div className="max-w-[92%] self-end bg-[#D9FDD3] dark:bg-[#005C4B] text-zinc-900 dark:text-zinc-100 rounded-xl rounded-tr-none p-3.5 shadow-xs text-xs leading-relaxed whitespace-pre-line relative">
                    {resolvedPreview}
                    
                    <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-zinc-500 dark:text-emerald-200">
                      <span>Agora</span>
                      <span className="font-bold text-[#53BDEB]">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* Ação de Teste de Disparo WhatsApp */}
                <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" />
                    <span>[ABRIR WHATSAPP DE TESTE]</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] text-center text-zinc-400 mt-1">
                    Gera link direto <strong>wa.me</strong> para o número de {testCompany?.name}.
                  </p>
                </div>

              </div>

              {/* Informação sobre os dados calculados */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <span className="font-bold block flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Substituição Regional em Tempo Real
                </span>
                <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                  Ao mudar a empresa de teste, o Leadion recalcula o preço ({testCompany?.country}), a moeda e o decisor automaticamente.
                </p>
              </div>

            </div>

          </div>

          {/* Footer com Botões */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            {editingScript ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Script</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingScript ? 'Salvar Alterações' : 'Criar Script na Sequência'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
