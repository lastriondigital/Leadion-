import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Clock, 
  MessageSquare, 
  Phone, 
  Mail, 
  Linkedin, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Filter,
  Search,
  Building2,
  Briefcase,
  ArrowRight,
  Play
} from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';
import { ProspectAction } from '../../core/types/prospectAction';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

type AgendaTab = 'todas' | 'atrasadas' | 'hoje' | 'proximas';

export const CalendarView: React.FC = () => {
  const { 
    actions = [], 
    companies = [],
    scriptsEntities = [],
    openWhatsAppForCompany,
    openActionOutcomeModal,
    setSelectedCompany,
    setActiveNav
  } = useLeadion() as any;

  const [activeTab, setActiveTab] = useState<AgendaTab>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Separar as ações por status temporal
  const categorizedActions = useMemo(() => {
    const overdue: ProspectAction[] = [];
    const today: ProspectAction[] = [];
    const upcoming: ProspectAction[] = [];

    actions.forEach((act: ProspectAction) => {
      if (act.status === 'concluida' || act.status === 'cancelada') return;

      if (act.status === 'atrasada') {
        overdue.push(act);
      } else if (act.status === 'hoje') {
        today.push(act);
      } else {
        upcoming.push(act);
      }
    });

    // Ordenação por horário
    const sortByTime = (a: ProspectAction, b: ProspectAction) => {
      const timeA = a.time || '23:59';
      const timeB = b.time || '23:59';
      return timeA.localeCompare(timeB);
    };

    overdue.sort(sortByTime);
    today.sort(sortByTime);
    upcoming.sort((a, b) => {
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      return (a.time || '23:59').localeCompare(b.time || '23:59');
    });

    return { overdue, today, upcoming };
  }, [actions]);

  // Filtragem por busca
  const filterList = (list: ProspectAction[]) => {
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((act) => 
      act.companyName?.toLowerCase().includes(q) ||
      act.nextAction?.toLowerCase().includes(q) ||
      act.service?.toLowerCase().includes(q) ||
      act.channel?.toLowerCase().includes(q)
    );
  };

  const filteredOverdue = filterList(categorizedActions.overdue);
  const filteredToday = filterList(categorizedActions.today);
  const filteredUpcoming = filterList(categorizedActions.upcoming);

  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'ligacao':
      case 'telefone':
        return <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'linkedin':
        return <Linkedin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  const handleExecuteWhatsApp = (e: React.MouseEvent, action: ProspectAction) => {
    e.stopPropagation();
    const company = companies.find((c: any) => c.id === action.companyId || c.name === action.companyName);
    if (!company) return;

    const script = scriptsEntities.find((s: any) => s.id === action.scriptId) || scriptsEntities[0];
    if (openWhatsAppForCompany) {
      openWhatsAppForCompany(company, script, undefined, action.id);
    } else {
      const phone = action.whatsappNumber || company.whatsapp || '';
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone) {
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
      }
    }
  };

  const handleOpenOutcome = (e: React.MouseEvent, action: ProspectAction) => {
    e.stopPropagation();
    if (openActionOutcomeModal) {
      openActionOutcomeModal(action);
    }
  };

  const handleCardClick = (action: ProspectAction) => {
    const company = companies.find((c: any) => c.id === action.companyId || c.name === action.companyName);
    if (company && setSelectedCompany) {
      setSelectedCompany(company);
      setActiveNav('companies');
    }
  };

  // Render individual action item
  const renderActionRow = (action: ProspectAction, isOverdue = false) => {
    const isWhatsApp = action.channel?.toLowerCase() === 'whatsapp';

    return (
      <div
        key={action.id}
        onClick={() => handleCardClick(action)}
        className={`p-3 sm:p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isOverdue
            ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200/80 dark:border-red-900/40 hover:border-red-400'
            : 'bg-white dark:bg-[#141720] border-[#E6E8EC] dark:border-[#232836] hover:border-[#635BFF]/50 shadow-2xs'
        }`}
      >
        {/* Left Side: Time, Company, Action & Service */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          {/* Time Badge */}
          <div className={`flex flex-col items-center justify-center w-13 py-1.5 px-1 rounded-[10px] border shadow-2xs shrink-0 ${
            isOverdue
              ? 'bg-red-100/80 dark:bg-red-900/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-[#635BFF] dark:text-[#9A94FF]'
          }`}>
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
              {action.date === 'Hoje' || !action.date ? 'Hora' : action.date.slice(0, 5)}
            </span>
            <span className="text-xs sm:text-sm font-bold tabular-nums">
              {action.time || '14:00'}
            </span>
          </div>

          {/* Details */}
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {action.companyName}
              </span>
              <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 truncate">
                {action.nextAction}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex-wrap">
              {action.service && (
                <span className="flex items-center gap-1 text-[#635BFF] dark:text-[#9A94FF] font-medium truncate">
                  <Briefcase className="w-3 h-3 shrink-0" />
                  {action.service}
                </span>
              )}
              {action.targetContactName && (
                <span className="text-zinc-400 truncate">
                  ({action.targetContactName})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Channel Badge & Direct Action Trigger */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/60 w-full sm:w-auto shrink-0">
          {/* Channel Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
            {getChannelIcon(action.channel)}
            <span className="capitalize">{action.channel || 'Contato'}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {isWhatsApp && (
              <button
                type="button"
                onClick={(e) => handleExecuteWhatsApp(e, action)}
                className="px-2.5 py-1 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                title="Abrir WhatsApp com mensagem recomendada"
              >
                <MessageSquare className="w-3 h-3" />
                <span>WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => handleOpenOutcome(e, action)}
              className="px-2.5 py-1 rounded-[8px] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Registrar desfecho da ação"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="hidden sm:inline">Desfecho</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const totalOverdue = categorizedActions.overdue.length;
  const totalToday = categorizedActions.today.length;
  const totalUpcoming = categorizedActions.upcoming.length;

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12 w-full min-w-0">
      {/* Top Banner / Summary Card */}
      <div className="p-4 sm:p-5 rounded-[16px] bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#635BFF]" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Agenda de Ações & Toques
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Fila de toques comerciais agendados, follow-ups de cadência e retornos programados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveNav('today')}
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
            className="w-full sm:w-auto"
          >
            Executar Turno de Hoje
          </Button>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#141720] p-3 rounded-[14px] border border-[#E6E8EC] dark:border-[#232836]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'todas'
                ? 'bg-[#635BFF] text-white shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Todas ({totalOverdue + totalToday + totalUpcoming})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('atrasadas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'atrasadas'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
            }`}
          >
            <span>Atrasadas</span>
            {totalOverdue > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'atrasadas' ? 'bg-white text-red-600' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                {totalOverdue}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hoje')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'hoje'
                ? 'bg-[#635BFF] text-white shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span>Hoje</span>
            {totalToday > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'hoje' ? 'bg-white text-[#635BFF]' : 'bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF]'}`}>
                {totalToday}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('proximas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'proximas'
                ? 'bg-[#635BFF] text-white shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span>Próximas</span>
            <span className="text-[10px] opacity-70">({totalUpcoming})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar empresa ou ação..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
          />
        </div>
      </div>

      {/* Main Agenda Lists */}
      <div className="space-y-6">
        {/* Seção 1: ATRASADAS */}
        {(activeTab === 'todas' || activeTab === 'atrasadas') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h3 className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  Atrasadas ({filteredOverdue.length})
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400">
                Toques que perderam o horário planejado
              </span>
            </div>

            {filteredOverdue.length === 0 ? (
              activeTab === 'atrasadas' && (
                <div className="p-8 text-center bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 rounded-[14px]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Nenhuma ação atrasada pendente!
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Todas as cadências estão dentro do cronograma operacional.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {filteredOverdue.map((act) => renderActionRow(act, true))}
              </div>
            )}
          </div>
        )}

        {/* Seção 2: HOJE */}
        {(activeTab === 'todas' || activeTab === 'hoje') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#635BFF]" />
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Hoje ({filteredToday.length})
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400">
                Programadas para execução no turno de hoje
              </span>
            </div>

            {filteredToday.length === 0 ? (
              activeTab === 'hoje' && (
                <div className="p-8 text-center bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 rounded-[14px]">
                  <Clock className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Nenhuma ação restante para hoje
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    A fila de hoje está em dia ou não possui novos toques agendados.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {filteredToday.map((act) => renderActionRow(act, false))}
              </div>
            )}
          </div>
        )}

        {/* Seção 3: PRÓXIMAS */}
        {(activeTab === 'todas' || activeTab === 'proximas') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Próximas ({filteredUpcoming.length})
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400">
                Ações agendadas para os próximos dias
              </span>
            </div>

            {filteredUpcoming.length === 0 ? (
              activeTab === 'proximas' && (
                <div className="p-8 text-center bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 rounded-[14px]">
                  <CalendarDays className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Nenhuma ação futura cadastrada
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Programe novos follow-ups ou abordagens para alimentar a esteira.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {filteredUpcoming.map((act) => renderActionRow(act, false))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
