import React from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { BarChart3, Flame, CheckCircle2, MessageSquare, Phone, Linkedin, ArrowRight } from 'lucide-react';

export const StatsView: React.FC = () => {
  const { leads, todayMetrics, setActiveNav } = useLeadion();

  const totalLeads = leads.length;
  const meetingsBooked = leads.filter((l) => l.status === 'meeting_scheduled').length;
  const inCadence = leads.filter((l) => l.status === 'in_cadence').length;
  const pendingAction = leads.filter((l) => l.status === 'pending_action').length;

  const whatsappCount = leads.filter((l) => l.nextAction.channel === 'whatsapp').length;
  const linkedinCount = leads.filter((l) => l.nextAction.channel === 'linkedin').length;
  const phoneCount = leads.filter((l) => l.nextAction.channel === 'phone').length;

  const executionRate = totalLeads > 0 ? Math.round(((totalLeads - todayMetrics.totalDueToday) / totalLeads) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-[15px] bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Estatísticas de Execução Real
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Métricas calculadas a partir dos toques e cadências ativas da esteira. Sem métricas vazias ou vaidade.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveNav('today')}
          icon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Prospectar Hoje
        </Button>
      </div>

      {/* Operational Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-[14px] bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Fila Total Hoje</span>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
            {totalLeads}
          </div>
          <span className="text-[11px] text-zinc-500">Decisores mapeados</span>
        </div>

        <div className="p-4 rounded-[14px] bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] space-y-1">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">Pendentes de Ação</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {todayMetrics.totalDueToday}
          </div>
          <span className="text-[11px] text-zinc-500">Aguardando toque</span>
        </div>

        <div className="p-4 rounded-[14px] bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Reuniões Geradas</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {meetingsBooked}
          </div>
          <span className="text-[11px] text-zinc-500">Passadas para Demo</span>
        </div>

        <div className="p-4 rounded-[14px] bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] space-y-1">
          <span className="text-[11px] font-bold text-[#635BFF] uppercase">Alta Propensão</span>
          <div className="text-2xl font-black text-[#635BFF] dark:text-[#9A94FF] tabular-nums">
            {todayMetrics.highScoreCount}
          </div>
          <span className="text-[11px] text-zinc-500">Ion Score &ge; 90</span>
        </div>
      </div>

      {/* Channel Distribution */}
      <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[15px] p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Distribuição de Esforço por Canal de Contato
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
              </span>
              <span className="text-zinc-500">{whatsappCount} contatos ({totalLeads ? Math.round((whatsappCount/totalLeads)*100) : 0}%)</span>
            </div>
            <Progress value={totalLeads ? (whatsappCount/totalLeads)*100 : 0} variant="success" size="sm" />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-sky-600" /> LinkedIn
              </span>
              <span className="text-zinc-500">{linkedinCount} contatos ({totalLeads ? Math.round((linkedinCount/totalLeads)*100) : 0}%)</span>
            </div>
            <Progress value={totalLeads ? (linkedinCount/totalLeads)*100 : 0} variant="primary" size="sm" />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600" /> Telefone Direto
              </span>
              <span className="text-zinc-500">{phoneCount} contatos ({totalLeads ? Math.round((phoneCount/totalLeads)*100) : 0}%)</span>
            </div>
            <Progress value={totalLeads ? (phoneCount/totalLeads)*100 : 0} variant="warning" size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
