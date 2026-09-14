import React, { useState } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { Objection } from '../../core/types/script';
import { 
  ShieldAlert, 
  XCircle, 
  Copy, 
  Check, 
  MessageSquare, 
  HelpCircle, 
  Sparkles, 
  ArrowRight,
  Send
} from 'lucide-react';

interface ObjectionResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
  contactName?: string;
  onSelectResponseScript?: (scriptText: string) => void;
}

export const ObjectionResponseModal: React.FC<ObjectionResponseModalProps> = ({
  isOpen,
  onClose,
  companyName = 'Lead',
  contactName = 'Decisor',
  onSelectResponseScript,
}) => {
  const { objections } = useLeadion();
  const { showToast } = useToast();

  const [selectedObjectionId, setSelectedObjectionId] = useState<string>(objections[0]?.id || '');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentObjection = objections.find((o) => o.id === selectedObjectionId) || objections[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    showToast({
      type: 'info',
      title: 'Resposta Copiada!',
      message: 'Script de contorno de objeção pronto para colar.',
    });
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const handleApplyScript = (text: string) => {
    if (onSelectResponseScript) {
      onSelectResponseScript(text);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#141720] rounded-2xl max-w-3xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Matriz de Contorno de Objeções
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Respostas validadas psicologicamente para desarmar travas comuns do lead ({contactName} · {companyName}).
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

        {/* Corpo com Seleção de Objeção e Respostas Recomendadas */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Categorias / Objeções Rápidas */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Qual foi a fala ou trava do lead?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {objections.map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => setSelectedObjectionId(obj.id)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-1.5 ${
                    selectedObjectionId === obj.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 font-semibold shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <span className="leading-snug">{obj.objectionText}</span>
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                    Categoria: {obj.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Psicologia de Fundo */}
          {currentObjection && (
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                O que o lead realmente quer dizer:
              </span>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium italic">
                &ldquo;{currentObjection.corePsychology}&rdquo;
              </p>
            </div>
          )}

          {/* Abordagens Recomendadas */}
          {currentObjection && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                Modelos de Resposta Imediata:
              </span>

              <div className="space-y-3">
                {currentObjection.recommendedResponses.map((resp, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white dark:bg-zinc-900/90 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2.5 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#635BFF] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {resp.label}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {resp.approach}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
                      {resp.script}
                    </p>

                    <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-bold">
                          Pergunta de Fechamento / Próximo Passo:
                        </strong>
                        <span>{resp.nextStepQuestion}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(`${resp.script} ${resp.nextStepQuestion}`, `resp-${idx}`)}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5"
                      >
                        {copiedScript === `resp-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedScript === `resp-${idx}` ? 'Copiado' : 'Copiar'}</span>
                      </button>

                      {onSelectResponseScript && (
                        <button
                          type="button"
                          onClick={() => handleApplyScript(`${resp.script} ${resp.nextStepQuestion}`)}
                          className="px-3 py-1.5 rounded-lg bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Usar no WhatsApp</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
