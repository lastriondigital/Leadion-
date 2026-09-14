import React, { useState } from 'react';
import { CompanyActivity } from '../../core/types/company';
import { 
  CheckSquare, 
  Square, 
  Phone, 
  Calendar, 
  MessageSquare, 
  Send, 
  Clock, 
  Plus, 
  Check, 
  User,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface CompanyActivitiesProps {
  activities: CompanyActivity[];
  companyId: string;
  onToggleActivity: (companyId: string, activityId: string) => void;
  onAddActivity: (companyId: string, activity: Omit<CompanyActivity, 'id' | 'createdAt'>) => void;
  className?: string;
}

const ACTIVITY_TYPE_OPTIONS = [
  { value: 'ligacao', label: 'Ligação Telefônica' },
  { value: 'reuniao', label: 'Reunião Comercial / Demo' },
  { value: 'whatsapp', label: 'Follow-up WhatsApp' },
  { value: 'proposta', label: 'Envio / Apresentação de Proposta' },
  { value: 'tarefa', label: 'Tarefa Interna / Pesquisa' },
];

export const CompanyActivities: React.FC<CompanyActivitiesProps> = ({
  activities,
  companyId,
  onToggleActivity,
  onAddActivity,
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CompanyActivity['type']>('whatsapp');
  const [dueDate, setDueDate] = useState('Hoje');
  const [assignedTo, setAssignedTo] = useState('Você (Operador)');
  const [notes, setNotes] = useState('');

  const filteredActivities = (activities || []).filter((act) => {
    if (filter === 'pending') return !act.completed;
    if (filter === 'completed') return act.completed;
    return true;
  });

  const pendingCount = (activities || []).filter((a) => !a.completed).length;
  const completedCount = (activities || []).filter((a) => a.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddActivity(companyId, {
      title: title.trim(),
      type,
      dueDate: dueDate.trim() || 'Hoje',
      assignedTo: assignedTo.trim() || 'Você (Operador)',
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setNotes('');
    setDueDate('Hoje');
    setIsFormOpen(false);
  };

  const getActivityIcon = (actType: CompanyActivity['type']) => {
    switch (actType) {
      case 'ligacao':
        return <Phone className="w-3.5 h-3.5 text-indigo-500" />;
      case 'reuniao':
        return <Calendar className="w-3.5 h-3.5 text-purple-500" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case 'proposta':
        return <Send className="w-3.5 h-3.5 text-sky-500" />;
      case 'tarefa':
      default:
        return <CheckSquare className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[12px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-[8px] text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Todas ({activities?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-2.5 py-1 rounded-[8px] text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'pending'
                ? 'bg-[#635BFF] text-white'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-2.5 py-1 rounded-[8px] text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Concluídas ({completedCount})
          </button>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsFormOpen(!isFormOpen)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          {isFormOpen ? 'Fechar Formulário' : 'Nova Atividade'}
        </Button>
      </div>

      {/* New Activity Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-[14px] bg-zinc-50 dark:bg-[#141720] border border-[#635BFF]/40 shadow-xs space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#635BFF] uppercase tracking-wider">
              Criar Tarefa ou Follow-up Comercial
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Título da Ação *"
              placeholder="Ex: Disparar script 2 de cadência no WhatsApp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Select
              label="Tipo de Atividade"
              options={ACTIVITY_TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value as CompanyActivity['type'])}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Prazo / Vencimento"
              placeholder="Hoje, Amanhã 14:00, 18/10..."
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Input
              label="Responsável Atribuído"
              placeholder="Ex: Você (Operador), Especialista B2B"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
          </div>

          <Input
            label="Detalhes / Script / Observações"
            placeholder="Ex: Reforçar o ganho de 35% de produtividade comprovado no nicho."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!title.trim()}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Agendar Atividade
            </Button>
          </div>
        </form>
      )}

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="p-8 text-center rounded-[14px] bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-[#E6E8EC] dark:border-zinc-800 space-y-2">
          <Clock className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Nenhuma atividade {filter !== 'all' ? `(${filter})` : ''} encontrada.
          </p>
          <p className="text-[11px] text-zinc-400">
            Adicione uma nova tarefa comercial para garantir follow-up sem esquecimentos.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              className={`p-3.5 rounded-[12px] border transition-all flex items-start justify-between gap-3 ${
                act.completed
                  ? 'bg-zinc-50/80 dark:bg-zinc-900/30 border-zinc-200/60 dark:border-zinc-800/60 opacity-70'
                  : 'bg-white dark:bg-[#161922] border-[#E6E8EC] dark:border-[#232836] shadow-xs hover:border-[#635BFF]/30'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleActivity(companyId, act.id)}
                  className="mt-0.5 text-zinc-400 hover:text-[#635BFF] transition-colors cursor-pointer"
                  title={act.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                >
                  {act.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800">
                      {getActivityIcon(act.type)}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        act.completed
                          ? 'line-through text-zinc-400 dark:text-zinc-500'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {act.title}
                    </span>
                  </div>

                  {act.notes && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {act.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 pt-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-[#635BFF]" />
                      Vencimento: <strong className="text-zinc-700 dark:text-zinc-300">{act.dueDate}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {act.assignedTo}
                    </span>
                    {act.completed && act.completedAt && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Concluída em {act.completedAt}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  act.completed 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-indigo-500/10 text-[#635BFF] border border-[#635BFF]/20'
                }`}>
                  {act.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
