import React, { useState } from 'react';
import { FunnelEntity, FunnelScript, FunnelSequence } from '../../core/types/funnel';
import { Company } from '../../core/types/company';
import { interpolateFunnelVariables } from '../../core/funnel/flowGraphEngine';
import { FunnelScriptModal } from './modals/FunnelScriptModal';
import { DeleteImpactModal } from './modals/DeleteImpactModal';
import { Button } from '../ui/Button';
import { 
  Plus, 
  FileText, 
  Edit2, 
  Trash2, 
  Copy, 
  Check, 
  Building2, 
  Sparkles, 
  MessageSquare,
  Eye,
  EyeOff
} from 'lucide-react';

interface FunnelScriptsTabProps {
  funnel: FunnelEntity;
  companies?: Company[];
  onUpdateFunnel: (updates: Partial<FunnelEntity>) => void;
}

export const FunnelScriptsTab: React.FC<FunnelScriptsTabProps> = ({
  funnel,
  companies = [],
  onUpdateFunnel,
}) => {
  const scripts = funnel.funnelScripts || [];
  const sequences = funnel.sequences || [];

  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<FunnelScript | null>(null);

  // Preview Mode with real company
  const [previewCompanyId, setPreviewCompanyId] = useState<string>(companies[0]?.id || '');
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  const [deleteModalData, setDeleteModalData] = useState<{
    isOpen: boolean;
    script: FunnelScript | null;
  }>({
    isOpen: false,
    script: null,
  });

  const selectedPreviewCompany = companies.find((c) => c.id === previewCompanyId) || null;

  const handleOpenCreateScript = () => {
    setEditingScript(null);
    setIsScriptModalOpen(true);
  };

  const handleOpenEditScript = (s: FunnelScript) => {
    setEditingScript(s);
    setIsScriptModalOpen(true);
  };

  const handleSaveScript = (data: {
    title: string;
    content: string;
    channel: any;
    sequenceId?: string;
    messageId?: string;
    situation?: string;
  }) => {
    const nowIso = new Date().toISOString();
    if (editingScript) {
      const updated = scripts.map((s) =>
        s.id === editingScript.id ? { ...s, ...data, updatedAt: nowIso } : s
      );
      onUpdateFunnel({ funnelScripts: updated });
    } else {
      const newScript: FunnelScript = {
        id: `fscript-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        funnelId: funnel.id,
        title: data.title,
        content: data.content,
        channel: data.channel,
        sequenceId: data.sequenceId,
        messageId: data.messageId,
        situation: data.situation,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      onUpdateFunnel({ funnelScripts: [...scripts, newScript] });
    }
  };

  const handleDeleteScript = (script: FunnelScript) => {
    const filtered = scripts.filter((s) => s.id !== script.id);
    onUpdateFunnel({ funnelScripts: filtered });
  };

  const handleCopyInterpolated = (script: FunnelScript) => {
    const text = selectedPreviewCompany
      ? interpolateFunnelVariables(script.content, selectedPreviewCompany)
      : script.content;

    navigator.clipboard.writeText(text);
    setCopiedScriptId(script.id);
    setTimeout(() => setCopiedScriptId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & New Script Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Scripts Específicos do Funil
          </h3>
          <p className="text-xs text-zinc-500">
            Respostas a objeções, mensagens de abordagem e quebras de gelo parametrizadas para este funil.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {companies.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="hidden sm:inline">Prévia com empresa:</span>
              <select
                value={previewCompanyId}
                onChange={(e) => setPreviewCompanyId(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city ? `${c.city} · ` : ''}{c.country || 'Sem país'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleOpenCreateScript}
            icon={<Plus className="w-4 h-4" />}
          >
            Novo script
          </Button>
        </div>
      </div>

      {/* Script List or Empty */}
      {scripts.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <FileText className="w-12 h-12 text-[#635BFF] mx-auto mb-3" />
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Nenhum script associado a este funil
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            Crie scripts personalizados para responder dúvidas recorrentes de clientes durante as etapas deste funil.
          </p>
          <Button variant="primary" onClick={handleOpenCreateScript} icon={<Plus className="w-4 h-4" />}>
            Criar primeiro script
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scripts.map((script) => {
            const boundSeq = sequences.find((s) => s.id === script.sequenceId);
            const interpolatedContent = selectedPreviewCompany
              ? interpolateFunnelVariables(script.content, selectedPreviewCompany)
              : null;

            return (
              <div
                key={script.id}
                className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#635BFF]/10 text-[#635BFF]">
                        {script.channel}
                      </span>
                      {boundSeq && (
                        <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          {boundSeq.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyInterpolated(script)}
                        title="Copiar com dados da empresa selecionada"
                        className="p-1.5 text-zinc-400 hover:text-emerald-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        {copiedScriptId === script.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEditScript(script)}
                        title="Editar script"
                        className="p-1.5 text-zinc-400 hover:text-[#635BFF] rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteModalData({ isOpen: true, script })}
                        title="Excluir script"
                        className="p-1.5 text-zinc-400 hover:text-red-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    {script.title}
                  </h4>

                  {script.situation && (
                    <div className="text-[11px] text-zinc-500 mb-2 italic">
                      Situação: "{script.situation}"
                    </div>
                  )}

                  {/* Script Text */}
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 font-mono text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed border border-zinc-200 dark:border-zinc-700/60">
                    {interpolatedContent || script.content}
                  </div>
                </div>

                {selectedPreviewCompany && (
                  <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span>Prévia calculada com: {selectedPreviewCompany.name}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Dados reais</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      <FunnelScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onSubmit={handleSaveScript}
        script={editingScript}
        sequences={sequences}
        defaultChannel={funnel.channel || 'whatsapp'}
      />

      <DeleteImpactModal
        isOpen={deleteModalData.isOpen}
        onClose={() => setDeleteModalData({ isOpen: false, script: null })}
        onConfirm={() => {
          if (deleteModalData.script) handleDeleteScript(deleteModalData.script);
        }}
        title="Excluir Script?"
        itemTitle={deleteModalData.script?.title || ''}
        itemType="script"
      />
    </div>
  );
};
