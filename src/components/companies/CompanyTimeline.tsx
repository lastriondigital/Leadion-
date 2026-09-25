import React, { useState } from 'react';
import { CompanyTimelineEvent } from '../../core/types/company';
import { 
  Building2, 
  Package, 
  TrendingUp, 
  GitCommit, 
  PhoneCall, 
  FileText, 
  Calendar, 
  Send, 
  Plus, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';

interface CompanyTimelineProps {
  events: CompanyTimelineEvent[];
  companyId: string;
  onAddEvent: (companyId: string, event: Omit<CompanyTimelineEvent, 'id' | 'timestamp'>) => void;
  className?: string;
}

export const CompanyTimeline: React.FC<CompanyTimelineProps> = ({
  events,
  companyId,
  onAddEvent,
  className = '',
}) => {
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    onAddEvent(companyId, {
      type: 'nota_adicionada',
      title: 'Nota comercial adicionada',
      detail: newNote.trim(),
      author: 'Você (Operador)',
    });

    setNewNote('');
    setIsAddingNote(false);
  };

  const getEventConfig = (type: CompanyTimelineEvent['type']) => {
    switch (type) {
      case 'empresa_criada':
        return {
          icon: <Building2 className="w-3.5 h-3.5 text-[#635BFF]" />,
          badgeClass: 'bg-[#635BFF]/10 text-[#635BFF] border-[#635BFF]/20',
          label: 'Cadastro',
        };
      case 'servico_selecionado':
        return {
          icon: <Package className="w-3.5 h-3.5 text-indigo-500" />,
          badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
          label: 'Serviço Vinculado',
        };
      case 'qualificacao':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
          badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
          label: 'Qualificação ICP',
        };
      case 'alteracao_etapa':
        return {
          icon: <GitCommit className="w-3.5 h-3.5 text-sky-500" />,
          badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
          label: 'Avanço de Funil',
        };
      case 'contato_realizado':
        return {
          icon: <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />,
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
          label: 'Contato',
        };
      case 'reuniao_agendada':
        return {
          icon: <Calendar className="w-3.5 h-3.5 text-purple-500" />,
          badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
          label: 'Reunião',
        };
      case 'proposta_enviada':
        return {
          icon: <Send className="w-3.5 h-3.5 text-emerald-600" />,
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          label: 'Proposta Comercial',
        };
      case 'nota_adicionada':
      default:
        return {
          icon: <FileText className="w-3.5 h-3.5 text-zinc-500" />,
          badgeClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
          label: 'Anotação',
        };
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Add Note Header */}
      <div className="p-3.5 rounded-[12px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs">
        {!isAddingNote ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <MessageSquare className="w-3.5 h-3.5 text-[#635BFF]" />
              <span>Registrar nota ou observação sobre esta empresa no histórico</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNote(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Nova Anotação
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSaveNote} className="space-y-3">
            <textarea
              rows={2}
              className="w-full p-2.5 rounded-[9px] border border-[#E6E8EC] dark:border-[#232836] bg-zinc-50 dark:bg-[#12151D] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#635BFF] resize-none"
              placeholder="Digite o resumo do alinhamento, objeção ou gatilho desta empresa..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote('');
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newNote.trim()}
              >
                Salvar no Histórico
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Events List */}
      {!events || events.length === 0 ? (
        <div className="p-6 text-center rounded-[12px] bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-[#E6E8EC] dark:border-zinc-800 text-xs text-zinc-400">
          Nenhuma atividade registrada.
        </div>
      ) : (
        <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">
          {events.map((event) => {
            const config = getEventConfig(event.type);
            return (
              <div key={event.id} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-6 top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-[#161922] border border-zinc-200 dark:border-zinc-700 shadow-xs">
                  {config.icon}
                </div>

                <div className="flex flex-col gap-1.5 bg-white dark:bg-[#161922] p-3.5 rounded-[12px] border border-[#E6E8EC] dark:border-[#232836] shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
                        {config.label}
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {event.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 tabular-nums">
                      {event.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {event.detail}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[10px] text-zinc-400">
                    <span>Registrado por: <strong>{event.author}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
