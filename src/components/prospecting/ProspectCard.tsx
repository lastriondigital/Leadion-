import React, { useState } from 'react';
import { Lead } from '../../core/types/lead';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Score } from '../ui/Score';
import { 
  MessageSquare, 
  Phone, 
  Linkedin, 
  Mail, 
  Copy, 
  Check, 
  Clock, 
  ArrowRight, 
  Calendar, 
  MoreVertical,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  MapPin,
  Building,
  UserCheck
} from 'lucide-react';

interface ProspectCardProps {
  lead: Lead;
  index: number;
}

export const ProspectCard: React.FC<ProspectCardProps> = ({ lead, index }) => {
  const { setSelectedLead, executeLeadAction, snoozeLead } = useLeadion();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showScriptDetails, setShowScriptDetails] = useState(false);

  const handleCopyScript = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(lead.script.fullText);
    setCopied(true);
    showToast({
      type: 'info',
      title: 'Script copiado!',
      message: 'Texto pronto para colar no WhatsApp ou LinkedIn.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecutePrimary = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Open external channel if applicable
    if (lead.nextAction.channel === 'whatsapp' && lead.whatsappNumber) {
      const cleanPhone = lead.whatsappNumber.replace(/\D/g, '');
      const encodedMsg = encodeURIComponent(lead.script.fullText);
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    } else if (lead.nextAction.channel === 'linkedin' && lead.linkedinUrl) {
      window.open(lead.linkedinUrl, '_blank');
    } else if (lead.nextAction.channel === 'phone' && lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    }

    // Also open the drawer so the user can quickly register feedback or view objections
    setSelectedLead(lead);
  };

  const isOverdue = lead.timing.status === 'overdue';
  const isExecuted = lead.timing.status === 'executed';

  return (
    <div
      onClick={() => setSelectedLead(lead)}
      className={`group relative bg-white dark:bg-[#141720] border transition-all duration-200 rounded-[15px] p-5 cursor-pointer ${
        isOverdue
          ? 'border-amber-300/80 dark:border-amber-800/80 shadow-[0_2px_8px_rgba(217,119,6,0.08)]'
          : isExecuted
          ? 'border-emerald-200/80 dark:border-emerald-800/60 opacity-80'
          : 'border-[#E6E8EC] dark:border-[#232836] hover:border-[#635BFF]/50 dark:hover:border-[#635BFF]/50 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md'
      }`}
    >
      {/* Top Bar: Cadence & Timing Badge */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#E6E8EC]/70 dark:border-[#232836]/70">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cadence step */}
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Passo {lead.timing.cadenceStep}/{lead.timing.totalCadenceSteps} • {lead.timing.stepLabel}
          </span>

          {/* Timing indicator */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[6px] ${
              isOverdue
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            <Clock className="w-3 h-3" />
            {lead.timing.timeIndicator}
          </span>
        </div>

        {/* Ion Propensity Score */}
        <Score score={lead.score} size="sm" showLabel={false} />
      </div>

      {/* 6 Questions Grid Layout */}
      <div className="pt-4 space-y-4">
        {/* 1. QUEM PROSPECTAR? */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider">
                1. Quem
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {lead.location}
              </span>
            </div>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#635BFF] dark:group-hover:text-[#8D87FF] transition-colors mt-0.5 truncate">
              {lead.name}
            </h3>

            <div className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{lead.role}</span>
              <span className="text-zinc-400">na</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{lead.company}</span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-zinc-500 dark:text-zinc-400">{lead.segment}</span>
            </div>
          </div>

          <Badge channel={lead.nextAction.channel} size="md">
            {lead.nextAction.channel === 'whatsapp' && <MessageSquare className="w-3.5 h-3.5" />}
            {lead.nextAction.channel === 'linkedin' && <Linkedin className="w-3.5 h-3.5" />}
            {lead.nextAction.channel === 'phone' && <Phone className="w-3.5 h-3.5" />}
            {lead.nextAction.channel === 'email' && <Mail className="w-3.5 h-3.5" />}
            <span className="ml-1 uppercase text-[10px] font-bold">{lead.nextAction.channel}</span>
          </Badge>
        </div>

        {/* 2. POR QUE PROSPECTAR? (Gatilho + Dor) */}
        <div className="bg-[#F7F8FA] dark:bg-[#181C26] rounded-[11px] p-3 border border-[#E6E8EC]/80 dark:border-[#232836]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <span>2. Por que agir agora</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-[#635BFF] dark:text-[#9A94FF] lowercase font-semibold">gatilho factual</span>
          </div>
          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
            {lead.why.trigger}
          </p>
          <div className="mt-1.5 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800 flex items-start gap-1.5">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase shrink-0 mt-0.5">
              Dor Crítica:
            </span>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
              {lead.why.painPoint}
            </p>
          </div>
        </div>

        {/* 3. O QUE OFERECER? */}
        <div className="flex items-start gap-2.5 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-[#635BFF] mt-1.5 shrink-0" />
          <div>
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mr-1.5">
              3. Oferta:
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{lead.offer.serviceName}</span>
            <span className="text-zinc-400 mx-1.5">•</span>
            <span className="text-zinc-600 dark:text-zinc-400">{lead.offer.valueProposition}</span>
          </div>
        </div>

        {/* 4. O QUE DIZER? (Script em destaque) */}
        <div className="bg-white dark:bg-[#12151D] border border-indigo-100 dark:border-indigo-950/80 rounded-[11px] p-3 relative">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider">
              4. O que dizer (Script Validado)
            </span>
            <button
              onClick={handleCopyScript}
              className="text-[11px] font-semibold text-zinc-500 hover:text-[#635BFF] dark:hover:text-[#9A94FF] flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic bg-[#F9F9FB] dark:bg-[#171B24] p-2.5 rounded-[8px] border border-zinc-200/60 dark:border-zinc-800">
            &ldquo;{lead.script.fullText}&rdquo;
          </p>
        </div>

        {/* 5 & 6. QUANDO AGIR E PRÓXIMA AÇÃO */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E6E8EC]/80 dark:border-[#232836]/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              5. Quando:
            </span>
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {lead.timing.scheduledDate} às {lead.timing.scheduledTime}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                snoozeLead(lead.id, 60);
              }}
              className="px-2.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-[10px] transition-colors cursor-pointer"
            >
              Adiar 1h
            </button>

            {/* 6. QUAL É A PRÓXIMA AÇÃO? (Direct CTA) */}
            <Button
              variant="primary"
              size="sm"
              icon={
                lead.nextAction.channel === 'whatsapp' ? <MessageSquare className="w-3.5 h-3.5" /> :
                lead.nextAction.channel === 'phone' ? <Phone className="w-3.5 h-3.5" /> :
                <Linkedin className="w-3.5 h-3.5" />
              }
              iconRight={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={handleExecutePrimary}
              className="shadow-xs max-w-full text-xs"
            >
              6. {lead.nextAction.label}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
