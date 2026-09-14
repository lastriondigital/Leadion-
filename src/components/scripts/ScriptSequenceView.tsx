import React, { useState, useMemo } from 'react';
import { ScriptEntity } from '../../core/types/script';
import { Company } from '../../core/types/company';
import { useLeadion } from '../../context/LeadionContext';
import { formatScriptDelayLabel, replaceScriptVariables } from '../../core/utils/scriptVariables';
import { 
  MessageSquare, 
  Clock, 
  ArrowDown, 
  ArrowRight, 
  Plus, 
  Edit, 
  Copy, 
  Sparkles, 
  Phone, 
  Mail, 
  Linkedin, 
  Send, 
  ExternalLink,
  Building2,
  CheckCircle2
} from 'lucide-react';

interface ScriptSequenceViewProps {
  onEditScript: (script: ScriptEntity) => void;
  onOpenWhatsApp: (script: ScriptEntity, company: Company) => void;
  onNewScript: () => void;
}

export const ScriptSequenceView: React.FC<ScriptSequenceViewProps> = ({
  onEditScript,
  onOpenWhatsApp,
  onNewScript,
}) => {
  const { scriptsEntities, companies, duplicateScript, services } = useLeadion();

  // Empresa selecionada para teste de prévia rápida
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');

  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;
  }, [companies, selectedCompanyId]);

  // Ordena scripts formando a sequência encadeada
  const orderedSequence = useMemo(() => {
    let filtered = [...scriptsEntities];
    if (selectedChannelFilter !== 'all') {
      filtered = filtered.filter((s) => s.channel === selectedChannelFilter);
    }

    // Se temos a sequência principal de WhatsApp (com sequenceOrder), ordena por sequenceOrder
    filtered.sort((a, b) => {
      const orderA = a.sequenceOrder ?? 99;
      const orderB = b.sequenceOrder ?? 99;
      return orderA - orderB;
    });

    return filtered;
  }, [scriptsEntities, selectedChannelFilter]);

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-amber-600" />;
      case 'linkedin':
        return <Linkedin className="w-3.5 h-3.5 text-blue-600" />;
      case 'phone':
        return <Phone className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Send className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Controles de Visualização da Sequência */}
      <div className="p-4 bg-white dark:bg-[#141720] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Filtro de Canal */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Canal:</span>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
            <button
              onClick={() => setSelectedChannelFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedChannelFilter === 'all'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Todos ({scriptsEntities.length})
            </button>
            <button
              onClick={() => setSelectedChannelFilter('whatsapp')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                selectedChannelFilter === 'whatsapp'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <MessageSquare className="w-3 h-3 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setSelectedChannelFilter('linkedin')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                selectedChannelFilter === 'linkedin'
                  ? 'bg-white dark:bg-zinc-700 text-blue-700 dark:text-blue-400 shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <Linkedin className="w-3 h-3 text-blue-600" />
              <span>LinkedIn</span>
            </button>
          </div>
        </div>

        {/* Empresa para Simulação da Sequência */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
            Lead Simulado:
          </span>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium focus:outline-none"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.country})
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* ESTEIRA VERTICAL DE SEQUÊNCIA (FLOWCHART VISUAL) */}
      <div className="relative space-y-6 max-w-3xl mx-auto py-2">
        
        {orderedSequence.map((script, idx) => {
          const isFollowUp = script.sequenceType === 'followup' || script.name.toLowerCase().includes('follow-up');
          const isFirst = idx === 0;
          const isLast = idx === orderedSequence.length - 1;

          // Mensagem personalizada para o lead selecionado
          const simulatedService = services.find((s) => s.id === script.serviceId) || services[0];
          const resolvedText = replaceScriptVariables(script.content, selectedCompany, simulatedService, 'Manuel Domingos');

          return (
            <div key={script.id} className="relative group">
              
              {/* Card da Mensagem na Sequência */}
              <div className={`p-5 rounded-2xl border transition-all ${
                isFollowUp
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400'
                  : 'bg-white dark:bg-[#141720] border-zinc-200 dark:border-zinc-800 hover:border-[#635BFF]/50 shadow-xs'
              }`}>
                
                {/* Cabeçalho do Passo */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      isFollowUp
                        ? 'bg-amber-500 text-white'
                        : 'bg-[#635BFF] text-white'
                    }`}>
                      {idx + 1}
                    </span>

                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isFollowUp
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                        : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
                    }`}>
                      {isFollowUp ? 'Follow-up' : 'Mensagem'}
                    </span>

                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {script.name}
                    </h4>
                  </div>

                  {/* Canal Badge & País */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                      {getChannelIcon(script.channel)}
                      <span className="capitalize">{script.channel}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px]">
                      {script.country}
                    </span>
                  </div>
                </div>

                {/* Condição de Disparo */}
                {script.condition && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/70 px-3 py-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Condição:</span>
                    <span>{script.condition}</span>
                  </div>
                )}

                {/* Balão de Prévia da Mensagem (com variáveis resolvidas para a empresa de teste) */}
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Prévia com dados reais ({selectedCompany?.name || 'Lead'}):</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {script.channel === 'whatsapp' ? 'WhatsApp Formatted' : 'Direct Message'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans whitespace-pre-line">
                    {resolvedText}
                  </p>
                </div>

                {/* Ações Rápidas do Script */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <span>Variáveis:</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                      {script.variables?.join(' · ') || 'Padrão'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditScript(script)}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Editar script e regras de sequência"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => duplicateScript(script.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Duplicar este modelo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicar</span>
                    </button>

                    {script.channel === 'whatsapp' && selectedCompany && (
                      <button
                        type="button"
                        onClick={() => onOpenWhatsApp(script, selectedCompany)}
                        className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-white" />
                        <span>[ABRIR WHATSAPP]</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* CONECTOR VISUAL ENTRE ETAPAS (COM O TEMPO DE FOLLOW-UP) */}
              {!isLast && (
                <div className="py-3 flex flex-col items-center justify-center relative">
                  
                  {/* Linha vertical */}
                  <div className="w-0.5 h-8 bg-zinc-300 dark:bg-zinc-700 my-1" />

                  {/* Badge de Tempo / Follow-up */}
                  <div className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-full px-3 py-1 shadow-xs flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 z-10">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold">
                      {formatScriptDelayLabel(orderedSequence[idx + 1]?.delay || script.delay)}
                    </span>
                    <ArrowDown className="w-3 h-3 text-zinc-400" />
                  </div>

                  <div className="w-0.5 h-8 bg-zinc-300 dark:bg-zinc-700 my-1" />

                </div>
              )}

            </div>
          );
        })}

        {/* Botão de Adicionar Nova Etapa ao Fim da Sequência */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onNewScript}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#635BFF] text-zinc-600 dark:text-zinc-400 hover:text-[#635BFF] text-xs font-bold transition-all hover:bg-indigo-50/30"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nova Mensagem à Sequência</span>
          </button>
        </div>

      </div>

    </div>
  );
};
