import React, { useState } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { ScriptSequenceView } from '../scripts/ScriptSequenceView';
import { Button } from '../ui/Button';
import { 
  Plus, 
  Layers, 
  BookOpen, 
  Send, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Copy as DuplicateIcon, 
  ArrowRight,
  Filter,
  Search,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { ScriptEntity } from '../../core/types/script';

export const ScriptsView: React.FC = () => {
  const { 
    scriptsEntities, 
    setIsScriptModalOpen, 
    setEditingScript, 
    duplicateScript, 
    deleteScript,
    openWhatsAppForCompany,
    companies,
    setActiveNav 
  } = useLeadion();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sequence' | 'library'>('sequence');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast({
      type: 'info',
      title: 'Script Copiado',
      message: 'Texto copiado para a área de transferência.',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewScript = () => {
    setEditingScript(null);
    setIsScriptModalOpen(true);
  };

  const handleEditScript = (script: ScriptEntity) => {
    setEditingScript(script);
    setIsScriptModalOpen(true);
  };

  const handleTestDispatch = (script: ScriptEntity) => {
    const demoCompany = companies[0];
    if (demoCompany) {
      openWhatsAppForCompany(demoCompany, script);
    } else {
      showToast({
        type: 'error',
        title: 'Nenhuma Empresa Cadastrada',
        message: 'Cadastre ao menos uma empresa para testar a substituição de variáveis.',
      });
    }
  };

  const filteredScripts = scriptsEntities.filter((s) => {
    const matchesChannel = channelFilter === 'all' || s.channel === channelFilter;
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.niche && s.niche.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesChannel && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#635BFF] border border-indigo-100 dark:border-indigo-900/50">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Construtor de Scripts & Sequências
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Crie cadências completas com variáveis dinâmicas, delays, condições e auditoria de envio manual.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveNav('today')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Fila de Prospecção
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleNewScript}
            icon={<Plus className="w-4 h-4" />}
          >
            Novo Script
          </Button>
        </div>
      </div>

      {/* Navigation Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap max-w-full pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('sequence')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'sequence'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-[#635BFF] shrink-0" />
            <span>Sequência Completa de Cadência</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-mono font-bold">
              {scriptsEntities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'library'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Biblioteca em Cartões</span>
          </button>
        </div>

        {activeTab === 'library' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por nome, nicho..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-64"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              <option value="all">Todos os Canais</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="linkedin">LinkedIn</option>
              <option value="telefone">Telefone</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'sequence' ? (
        <ScriptSequenceView
          onEditScript={handleEditScript}
          onNewScript={handleNewScript}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScripts.map((script) => (
            <div
              key={script.id}
              className="bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                      {script.channel.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {script.sequenceType === 'message' ? `Mensagem ${script.sequenceOrder}` : `Follow-up ${script.sequenceOrder}`}
                    </span>
                    {script.niche && (
                      <span className="text-[10px] font-semibold text-zinc-500">
                        {script.niche}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => duplicateScript(script.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="Duplicar script"
                    >
                      <DuplicateIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditScript(script)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="Editar script"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Excluir script "${script.name}"?`)) {
                          deleteScript(script.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="Excluir script"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                  {script.name}
                </h3>

                {/* Delay & Condition */}
                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                  <span>
                    Delay: <strong className="text-zinc-700 dark:text-zinc-300">{script.delay.value} {script.delay.unit}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Condição: <strong className="text-zinc-700 dark:text-zinc-300">{script.condition}</strong>
                  </span>
                </div>

                {/* Content Box */}
                <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans">
                  {script.content}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(script.id, script.content)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"
                >
                  {copiedId === script.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTestDispatch(script)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Testar no WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
