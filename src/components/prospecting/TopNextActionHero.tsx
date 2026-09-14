import React from 'react';
import { ProspectAction } from '../../core/types/prospectAction';
import { useLeadion } from '../../context/LeadionContext';
import { 
  Building2, 
  Sparkles, 
  Clock, 
  Calendar, 
  MapPin, 
  Phone, 
  Send, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight,
  Target,
  User,
  ExternalLink,
  Flame,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface TopNextActionHeroProps {
  topAction: ProspectAction | null;
  onOpenOutcomeModal: (action: ProspectAction) => void;
  onOpenObjectionModal: (action: ProspectAction) => void;
  onOpenCompanyDetail: (companyId: string) => void;
  onOpenPlanningModal: (companyId: string) => void;
}

export const TopNextActionHero: React.FC<TopNextActionHeroProps> = ({
  topAction,
  onOpenOutcomeModal,
  onOpenObjectionModal,
  onOpenCompanyDetail,
  onOpenPlanningModal,
}) => {
  const { openWhatsAppForCompany, companies } = useLeadion();

  if (!topAction) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-800 mb-6">
        <div className="flex items-center gap-2 mb-2 text-zinc-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Fila Operacional em Dia
        </div>
        <h2 className="text-xl font-bold">Nenhuma ação pendente na fila para este momento.</h2>
        <p className="text-zinc-400 text-sm mt-1 max-w-md">
          Todas as ações agendadas foram concluídas ou o radar aguarda novas oportunidades qualificadas.
        </p>
      </div>
    );
  }

  const company = companies.find((c) => c.id === topAction.companyId);

  // Scores com significado próprio e separado
  const clientScore = topAction.clientScore ?? topAction.score ?? 91;
  const serviceScore = topAction.serviceScore ?? 95;
  const priorityScore = topAction.calculatedPriorityScore ?? 96;

  // Motivos da prioridade
  const reasons = topAction.priorityReasons && topAction.priorityReasons.length > 0 
    ? topAction.priorityReasons 
    : [
        'follow-up atrasado',
        `score cliente ${clientScore}`,
        `serviço ${serviceScore}`,
        topAction.targetContactName ? 'decisor identificado' : 'lead em alta cadência'
      ];

  const handleOpenWhatsApp = () => {
    if (company) {
      openWhatsAppForCompany(company, null, topAction.scriptText, topAction.id);
    } else if (topAction.whatsappNumber) {
      const cleanNum = topAction.whatsappNumber.replace(/\D/g, '');
      const encodedMsg = encodeURIComponent(topAction.scriptText || 'Olá, bom dia!');
      window.open(`https://wa.me/${cleanNum}?text=${encodedMsg}`, '_blank');
    }
  };

  return (
    <div 
      id="top-next-action-hero"
      className="relative overflow-hidden bg-white border-2 border-[#635BFF]/30 rounded-2xl p-5 sm:p-7 shadow-md mb-8 transition-all hover:border-[#635BFF]/50"
    >
      {/* Glow e gradiente de fundo sutil no topo */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#635BFF]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header com o marcador visual exigido: # PRÓXIMA AÇÃO */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#635BFF] text-white text-xs font-black tracking-wider uppercase shadow-xs">
            <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span># PRÓXIMA AÇÃO</span>
          </div>
          
          <span className="text-xs text-zinc-500 font-medium">
            Decisão automatizada pelo Motor de Prioridade LEADION
          </span>
        </div>

        {/* Badge de Horário / Status */}
        <div className="flex items-center gap-2">
          {topAction.status === 'atrasada' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              Atrasada ({topAction.time || '09:30'})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              Hoje às {topAction.time || '09:30'}
            </span>
          )}

          <button
            onClick={() => onOpenCompanyDetail(topAction.companyId)}
            className="text-xs text-zinc-500 hover:text-[#635BFF] flex items-center gap-1 font-medium transition-colors cursor-pointer"
            title="Ver detalhes da conta"
          >
            <span>Ver Conta</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA ESQUERDA: Identificação da Empresa, Ação e Motivos */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Nome da Empresa & Nicho */}
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium mb-1">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>{topAction.niche}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-zinc-400" />
                {topAction.location}
              </span>
            </div>
            
            <h3 
              onClick={() => onOpenCompanyDetail(topAction.companyId)}
              className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight hover:text-[#635BFF] cursor-pointer transition-colors"
            >
              {topAction.companyName}
            </h3>

            {/* Decisor Identificado */}
            {topAction.targetContactName && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 text-xs font-semibold">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>Decisor: <strong>{topAction.targetContactName}</strong></span>
                {topAction.targetContactRole && (
                  <span className="text-zinc-500 font-normal">({topAction.targetContactRole})</span>
                )}
              </div>
            )}
          </div>

          {/* BLOCO DA AÇÃO EXPLICITADA */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
              <span>Ação Imediata</span>
              <span className="text-zinc-400">·</span>
              <span className="font-mono text-[#635BFF]">{topAction.service}</span>
            </div>
            
            <div className="text-lg sm:text-xl font-bold text-zinc-900">
              "{topAction.nextAction}"
            </div>

            {topAction.observation && (
              <p className="text-xs text-zinc-600 mt-1">
                {topAction.observation}
              </p>
            )}
          </div>

          {/* MOTIVOS DA PRIORIZAÇÃO (Formato Canônico do Prompt) */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" />
              <span>Motivos da Prioridade ({priorityScore}):</span>
            </div>
            
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              {reasons.map((reason, idx) => (
                <li 
                  key={idx} 
                  className="flex items-center gap-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200/70 px-2.5 py-1.5 rounded-lg"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF]"></span>
                  <span className="capitalize">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* COLUNA DIREITA: OS 3 SCORES SEPARADOS & BOTÕES DE AÇÃO */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-5 bg-zinc-50/50 p-4 rounded-xl border border-zinc-200/70">
          
          {/* OS 3 SCORES COM SIGNIFICADO PRÓPRIO */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Análise de Scores</span>
              <span className="text-[10px] text-zinc-400">LEADION v2</span>
            </div>

            {/* 1. PRIORIDADE DA AÇÃO */}
            <div className="bg-white border-2 border-[#635BFF] rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#635BFF]">
                    Prioridade da Ação
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Urgência operacional agora
                  </div>
                </div>
                <div className="text-3xl font-black text-[#635BFF] tracking-tight">
                  {priorityScore}
                </div>
              </div>
            </div>

            {/* Grid dos outros dois scores: CLIENTE e SERVIÇO */}
            <div className="grid grid-cols-2 gap-2">
              
              {/* 2. SCORE DO CLIENTE */}
              <div className="bg-white border border-zinc-200 rounded-xl p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 truncate">
                  Score Cliente
                </div>
                <div className="text-xl font-extrabold text-zinc-900 mt-0.5">
                  {clientScore}
                  <span className="text-xs font-normal text-zinc-400">/100</span>
                </div>
                <div className="text-[9px] text-zinc-400 mt-0.5">
                  Fit de Conta & ICP
                </div>
              </div>

              {/* 3. SCORE DO SERVIÇO */}
              <div className="bg-white border border-zinc-200 rounded-xl p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 truncate">
                  Score Serviço
                </div>
                <div className="text-xl font-extrabold text-zinc-900 mt-0.5">
                  {serviceScore}
                  <span className="text-xs font-normal text-zinc-400">/100</span>
                </div>
                <div className="text-[9px] text-zinc-400 mt-0.5">
                  Aderência Comercial
                </div>
              </div>

            </div>
          </div>

          {/* BOTÕES DE EXECUÇÃO */}
          <div className="space-y-2 pt-2 border-t border-zinc-200">
            
            {/* BOTÃO PRINCIPAL SOLICITADO: [ABRIR WHATSAPP] */}
            {topAction.channel === 'whatsapp' ? (
              <button
                type="button"
                id="hero-btn-abrir-whatsapp"
                onClick={handleOpenWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>ABRIR WHATSAPP</span>
              </button>
            ) : topAction.channel === 'phone' ? (
              <button
                type="button"
                id="hero-btn-ligar"
                onClick={() => {
                  if (topAction.phone) window.location.href = `tel:${topAction.phone}`;
                }}
                className="w-full bg-[#635BFF] hover:bg-[#5248E5] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>LIGAR PARA CONTATO</span>
              </button>
            ) : (
              <button
                type="button"
                id="hero-btn-executar"
                onClick={() => onOpenCompanyDetail(topAction.companyId)}
                className="w-full bg-[#635BFF] hover:bg-[#5248E5] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>EXECUTAR {topAction.channel.toUpperCase()}</span>
              </button>
            )}

            {/* BOTÃO DE CONCLUSÃO INTELIGENTE: [CONCLUIR AÇÃO] */}
            <button
              type="button"
              id="hero-btn-concluir-acao"
              onClick={() => onOpenOutcomeModal(topAction)}
              className="w-full bg-zinc-900 hover:bg-black text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CONCLUIR & CALCULAR PRÓXIMA AÇÃO</span>
            </button>

            {/* BOTÕES SECUNDÁRIOS: OBJEÇÃO & FOLLOW-UP */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onOpenObjectionModal(topAction)}
                className="bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-semibold text-[11px] py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                <span>[OBJEÇÃO]</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenOutcomeModal(topAction)}
                className="bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-semibold text-[11px] py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Clock className="w-3 h-3 text-[#635BFF]" />
                <span>[FOLLOW-UP]</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
