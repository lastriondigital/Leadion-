import React from 'react';
import { LeadTimelineEvent } from '../../core/types/lead';
import { MessageSquare, Phone, Linkedin, Mail, Calendar, AlertCircle, FileText, Check } from 'lucide-react';
import { Badge } from './Badge';

interface TimelineProps {
  events: LeadTimelineEvent[];
  emptyMessage?: string;
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  emptyMessage = 'Nenhuma atividade registrada ainda nesta cadência.',
  className = '',
}) => {
  if (!events || events.length === 0) {
    return (
      <div className={`p-4 text-center rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-[#E6E8EC] dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  const getEventIcon = (type: LeadTimelineEvent['type']) => {
    switch (type) {
      case 'whatsapp_sent':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'call_made':
        return <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      case 'linkedin_connected':
        return <Linkedin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      case 'email_sent':
        return <Mail className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />;
      case 'meeting_scheduled':
        return <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'objection_logged':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  const getResultBadge = (result?: LeadTimelineEvent['result']) => {
    if (!result) return null;
    switch (result) {
      case 'connected':
        return <Badge variant="success" size="sm" icon={<Check className="w-2.5 h-2.5" />}>Conectado</Badge>;
      case 'replied_positive':
        return <Badge variant="success" size="sm">Respondeu Positivo</Badge>;
      case 'objection':
        return <Badge variant="warning" size="sm">Objeção Levantada</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">Sem Interesse</Badge>;
      case 'no_answer':
        return <Badge variant="neutral" size="sm">Sem Resposta</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800 ${className}`}>
      {events.map((event) => (
        <div key={event.id} className="relative group">
          {/* Node dot */}
          <div className="absolute -left-6 top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xs">
            {getEventIcon(event.type)}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {event.title}
              </span>
              <div className="flex items-center gap-2">
                {getResultBadge(event.result)}
                <span className="text-[11px] text-zinc-400 tabular-nums">
                  {event.timestamp}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-[10px] border border-zinc-200/60 dark:border-zinc-800/60 mt-0.5">
              {event.detail}
            </p>

            <span className="text-[10px] text-zinc-400 pl-1">
              Por: {event.author}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
