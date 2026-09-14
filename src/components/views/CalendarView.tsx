import React from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { Badge } from '../ui/Badge';
import { Score } from '../ui/Score';
import { Button } from '../ui/Button';
import { CalendarDays, Clock, MessageSquare, Phone, Linkedin, ArrowRight } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { leads, setSelectedLead, setActiveNav } = useLeadion();

  // Group leads by timing
  const todayLeads = leads.filter((l) => l.timing.scheduledDate === 'Hoje');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-[15px] bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Calendário de Toques & Agendamentos
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Horários programados para cadência outbound e reuniões comerciais agendadas.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveNav('today')}
          icon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Executar Hoje
        </Button>
      </div>

      {/* Schedule Timeline */}
      <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[15px] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#635BFF]" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Agenda do Turno de Hoje
            </h3>
          </div>
          <span className="text-xs text-zinc-500">
            {todayLeads.length} compromissos operacionais
          </span>
        </div>

        <div className="space-y-3">
          {todayLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className="p-3.5 rounded-[12px] border border-zinc-200/80 dark:border-zinc-800 hover:border-[#635BFF]/50 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between gap-4 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-14 py-1 rounded-[8px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Horário</span>
                  <span className="text-xs font-bold text-[#635BFF] dark:text-[#9A94FF] tabular-nums">
                    {lead.timing.scheduledTime}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {lead.name}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {lead.company}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {lead.timing.stepLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge channel={lead.nextAction.channel} size="sm">
                  {lead.nextAction.channel.toUpperCase()}
                </Badge>
                <Score score={lead.score} size="sm" showLabel={false} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
