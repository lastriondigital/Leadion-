import React, { useState } from 'react';
import { SyncConflict } from '../../core/storage/offlineEngine';
import { Button } from '../ui/Button';
import { 
  AlertTriangle, 
  Check, 
  X, 
  Smartphone, 
  Cloud, 
  ArrowRight,
  Split,
  Layers,
  History
} from 'lucide-react';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: SyncConflict | null;
  onResolve: (
    conflictId: string,
    strategy: 'keep_local' | 'keep_remote' | 'custom_merge',
    customData?: Record<string, any>
  ) => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflict,
  onResolve,
}) => {
  if (!isOpen || !conflict) return null;

  const [fieldChoices, setFieldChoices] = useState<Record<string, 'local' | 'remote'>>({});

  const toggleFieldChoice = (field: string, choice: 'local' | 'remote') => {
    setFieldChoices((prev) => ({ ...prev, [field]: choice }));
  };

  const handleCustomMerge = () => {
    const merged = { ...conflict.localData };
    conflict.conflictingFields.forEach((field) => {
      const choice = fieldChoices[field] || 'local';
      if (choice === 'remote') {
        merged[field] = conflict.remoteData[field];
      }
    });
    onResolve(conflict.id, 'custom_merge', merged);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return '<vazio>';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#141720] border border-amber-300 dark:border-amber-800/80 rounded-[20px] shadow-2xl max-w-2xl w-full p-6 space-y-5 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header com Alerta de Conflito */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-[#232836]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Conflito de Sincronização Detectado
                </h3>
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                  {conflict.entityType}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Alterações concorrentes em <strong>{conflict.entityTitle}</strong> foram encontradas.
                O Leadion não sobrescreve dados silenciosamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo dos Metadados (Local vs Nuvem) */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
              <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
              <span>Versão Local (Este Dispositivo)</span>
            </div>
            <div className="text-[11px] text-zinc-500">
              Versão #{conflict.localVersion} &bull; Editado: {formatDate(conflict.localTimestamp)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1A1F2C] border border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
              <Cloud className="w-3.5 h-3.5 text-sky-500" />
              <span>Versão Remota (Nuvem / Supabase)</span>
            </div>
            <div className="text-[11px] text-zinc-500">
              Versão #{conflict.remoteVersion} &bull; Salvo: {formatDate(conflict.remoteTimestamp)}
            </div>
          </div>
        </div>

        {/* Comparação Campo a Campo */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
            Campos Divergentes ({conflict.conflictingFields.length}):
          </span>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {conflict.conflictingFields.map((field) => {
              const localVal = conflict.localData[field];
              const remoteVal = conflict.remoteData[field];
              const selectedChoice = fieldChoices[field] || 'local';

              return (
                <div
                  key={field}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#181B24] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 capitalize">
                      {field}
                    </span>
                    <span className="text-[10px] text-zinc-400">Escolha qual valor manter:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Botão Escolha Local */}
                    <button
                      type="button"
                      onClick={() => toggleFieldChoice(field, 'local')}
                      className={`p-2 rounded-lg text-left text-xs border transition-all ${
                        selectedChoice === 'local'
                          ? 'border-[#635BFF] bg-[#635BFF]/10 text-zinc-900 dark:text-zinc-100 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold text-indigo-500 mb-0.5">Local:</div>
                      <div className="truncate font-mono">{formatValue(localVal)}</div>
                    </button>

                    {/* Botão Escolha Nuvem */}
                    <button
                      type="button"
                      onClick={() => toggleFieldChoice(field, 'remote')}
                      className={`p-2 rounded-lg text-left text-xs border transition-all ${
                        selectedChoice === 'remote'
                          ? 'border-sky-500 bg-sky-500/10 text-zinc-900 dark:text-zinc-100 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold text-sky-500 mb-0.5">Nuvem:</div>
                      <div className="truncate font-mono">{formatValue(remoteVal)}</div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé com Estratégias de Resolução */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-[#232836]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResolve(conflict.id, 'keep_local')}
          >
            Manter Versão Local Inteira
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResolve(conflict.id, 'keep_remote')}
            >
              Aceitar Versão da Nuvem
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleCustomMerge}
              icon={<Split className="w-3.5 h-3.5" />}
            >
              Aplicar Mesclagem Escolhida
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
