import React, { useState, useMemo } from 'react';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Score } from '../ui/Score';
import { Timeline } from '../ui/Timeline';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { 
  MessageSquare, 
  Phone, 
  Linkedin, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  AlertCircle,
  Building2,
  Send,
  User,
  CheckCircle2,
  XCircle,
  Clock4,
  Scale,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { calculateCompanyQualification } from '../../core/qualification/qualificationEngine';
import { WhyThisScoreModal } from '../qualification/WhyThisScoreModal';
import { CompanyQualificationModal } from '../qualification/CompanyQualificationModal';

export const ExecutionDrawer: React.FC = () => {
  const { 
    selectedLead, 
    setSelectedLead, 
    isDrawerOpen, 
    setIsDrawerOpen,
    executeLeadAction,
    updateLeadStatus,
    objections,
    snoozeLead,
    companies,
    services,
    qualificationQuestions,
    qualificationAnswers,
    saveCompanyQualificationAnswers
  } = useLeadion();

  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedObjectionId, setSelectedObjectionId] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [activeTab, setActiveTab] = useState<'execute' | 'objections' | 'history'>('execute');

  const [isWhyScoreModalOpen, setIsWhyScoreModalOpen] = useState(false);
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);

  const matchedCompany = useMemo(() => {
    if (!selectedLead) return null;
    return companies.find((c) => 
      (selectedLead.companyId && c.id === selectedLead.companyId) ||
      c.name.toLowerCase().trim() === selectedLead.company.toLowerCase().trim()
    ) || null;
  }, [selectedLead, companies]);

  const scoreResult = useMemo(() => {
    if (!matchedCompany) return null;
    const answers = qualificationAnswers[matchedCompany.id] || {};
    return calculateCompanyQualification(matchedCompany, qualificationQuestions, services, answers);
  }, [matchedCompany, qualificationQuestions, services, qualificationAnswers]);

  if (!selectedLead) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(selectedLead.script.fullText);
    setCopied(true);
    showToast({
      type: 'info',
      title: 'Script copiado com sucesso!',
      message: 'Texto pronto na sua área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = selectedLead.whatsappNumber.replace(/\D/g, '');
    const encoded = encodeURIComponent(selectedLead.script.fullText);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleOpenLinkedIn = () => {
    if (selectedLead.linkedinUrl) {
      window.open(selectedLead.linkedinUrl, '_blank');
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${selectedLead.phone}`;
  };

  const handleRegisterOutcome = (outcome: 'connected' | 'no_answer' | 'replied_positive' | 'objection' | 'rejected') => {
    executeLeadAction(selectedLead.id, selectedLead.nextAction.channel, outcome, customNote);
    setCustomNote('');
    setIsDrawerOpen(false);
  };

  return (
    <>
    <Drawer
      isOpen={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      width="xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-[#EEF0FF] dark:bg-[#1E1D38] text-[#635BFF] dark:text-[#9A94FF] flex items-center justify-center font-bold text-base">
            {selectedLead.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {selectedLead.name}
              </span>
              <Score score={selectedLead.score} size="sm" showLabel={false} />
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {selectedLead.role} • {selectedLead.company}
            </div>
          </div>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="text-zinc-600 dark:text-zinc-300 font-medium">
            {selectedLead.segment} ({selectedLead.companySize})
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {selectedLead.location}
          </span>
        </div>
      }
    >
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-[#E6E8EC] dark:border-[#232836] pb-3">
        <button
          onClick={() => setActiveTab('execute')}
          className={`px-3 py-1.5 rounded-[9px] text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'execute'
              ? 'bg-[#635BFF] text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Execução Imediata
        </button>
        <button
          onClick={() => setActiveTab('objections')}
          className={`px-3 py-1.5 rounded-[9px] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'objections'
              ? 'bg-[#635BFF] text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Contorno de Objeções
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-[9px] text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#635BFF] text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Histórico ({selectedLead.history.length})
        </button>
      </div>

      {activeTab === 'execute' && (
        <div className="space-y-6">
          {/* Quick Contact Action Bar */}
          <div className="p-3.5 rounded-[12px] bg-[#F7F8FA] dark:bg-[#181C26] border border-[#E6E8EC] dark:border-[#232836] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Disparar canal:
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedLead.whatsappNumber && (
                <Button
                  variant="success"
                  size="sm"
                  icon={<MessageSquare className="w-3.5 h-3.5" />}
                  onClick={handleOpenWhatsApp}
                >
                  WhatsApp Web
                </Button>
              )}
              {selectedLead.linkedinUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Linkedin className="w-3.5 h-3.5 text-sky-600" />}
                  onClick={handleOpenLinkedIn}
                >
                  LinkedIn
                </Button>
              )}
              {selectedLead.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Phone className="w-3.5 h-3.5 text-indigo-600" />}
                  onClick={handleCall}
                >
                  Ligar ({selectedLead.phone})
                </Button>
              )}
            </div>
          </div>

          {/* Inteligência do Motor de Qualificação (0 a 100) */}
          {scoreResult && matchedCompany && (
            <div className="p-4 rounded-[12px] border border-[#635BFF]/30 bg-gradient-to-br from-[#635BFF]/5 via-transparent to-purple-500/5 dark:from-[#635BFF]/10 dark:to-purple-900/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                      Qualificação da Empresa (0 a 100)
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Motor determinístico Leadion
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWhyScoreModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#635BFF] bg-white dark:bg-zinc-800 border border-[#635BFF]/30 hover:bg-[#635BFF]/10 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Por que este score?</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQualifyModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#635BFF] text-white hover:bg-[#5248E5] transition-colors cursor-pointer shadow-xs"
                  >
                    Ajustar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836]">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Score do Cliente
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black font-mono text-zinc-900 dark:text-zinc-100">
                      {scoreResult.clientScore}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">/ 100</span>
                    <span className="text-xs font-bold text-[#635BFF] ml-1.5">
                      ({scoreResult.clientLevel})
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836]">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider">
                    Serviço Recomendado
                  </span>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate mt-1">
                    {scoreResult.recommendedService?.serviceName || 'Nenhum serviço mapeado'}
                  </div>
                  {scoreResult.recommendedService && (
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      Match: <span className="font-bold text-emerald-600 dark:text-emerald-400">{scoreResult.recommendedService.combinationScore}%</span> (Adeq. {scoreResult.recommendedService.suitabilityScore}/100)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* The 6 Core Elements explicitly verified */}
          <div className="space-y-4">
            {/* 1. QUEM */}
            <div className="p-4 rounded-[12px] border border-[#E6E8EC] dark:border-[#232836] bg-white dark:bg-[#161922]">
              <div className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider mb-2">
                1. Quem prospectar
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400 block">Nome & Cargo:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedLead.name} ({selectedLead.role})
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Empresa & Segmento:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedLead.company} • {selectedLead.segment}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Porte / Faturamento:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                    {selectedLead.companySize} • {selectedLead.annualRevenue || 'Sob consulta'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">E-mail Corporativo:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                    {selectedLead.email}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. POR QUE */}
            <div className="p-4 rounded-[12px] border border-[#E6E8EC] dark:border-[#232836] bg-white dark:bg-[#161922]">
              <div className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider mb-2">
                2. Por que prospectar (Gatilho Factual & Dor)
              </div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2 leading-relaxed">
                {selectedLead.why.trigger}
              </p>
              <div className="p-2.5 rounded-[9px] bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200">
                <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                  Dor Operacional Identificada:
                </span>
                {selectedLead.why.painPoint}
              </div>
            </div>

            {/* 3. O QUE OFERECER */}
            <div className="p-4 rounded-[12px] border border-[#E6E8EC] dark:border-[#232836] bg-white dark:bg-[#161922]">
              <div className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider mb-2">
                3. O que oferecer
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedLead.offer.serviceName}
                  </span>
                  <span className="font-bold text-[#635BFF] dark:text-[#9A94FF]">
                    {selectedLead.offer.estimatedTicket}
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {selectedLead.offer.valueProposition}
                </p>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                  Destaque: {selectedLead.offer.deliverablesHighlight}
                </div>
              </div>
            </div>

            {/* 4. O QUE DIZER */}
            <div className="p-4 rounded-[12px] border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-[#141824]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider">
                  4. O que dizer (Script Completo)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  onClick={handleCopyScript}
                >
                  {copied ? 'Copiado!' : 'Copiar Texto'}
                </Button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white dark:bg-[#111319] rounded-[10px] border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                  {selectedLead.script.fullText}
                </div>
              </div>
            </div>

            {/* 5 & 6. QUANDO AGIR E PRÓXIMA AÇÃO */}
            <div className="p-4 rounded-[12px] border border-[#E6E8EC] dark:border-[#232836] bg-white dark:bg-[#161922]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider">
                  5. Quando agir
                </span>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {selectedLead.timing.scheduledDate} às {selectedLead.timing.scheduledTime}
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Cadência: Toque {selectedLead.timing.cadenceStep} de {selectedLead.timing.totalCadenceSteps} • {selectedLead.timing.stepLabel}
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
                <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  6. Registrar Próxima Ação & Resultado Imediato
                </div>
                
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Nota rápida sobre o contato (opcional)..."
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-[9px] border border-[#E6E8EC] dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#635BFF]"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => handleRegisterOutcome('replied_positive')}
                    >
                      Reunião Marcada
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<MessageSquare className="w-3.5 h-3.5 text-indigo-600" />}
                      onClick={() => handleRegisterOutcome('connected')}
                    >
                      Mensagem Enviada
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Clock4 className="w-3.5 h-3.5 text-amber-600" />}
                      onClick={() => handleRegisterOutcome('no_answer')}
                    >
                      Sem Resposta
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleRegisterOutcome('rejected')}
                    >
                      Desqualificar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Contorno de Objeções */}
      {activeTab === 'objections' && (
        <div className="space-y-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Selecione a objeção levantada pelo decisor para ver o roteiro exato de reversão:
          </div>

          <div className="space-y-3">
            {objections.map((obj) => (
              <div
                key={obj.id}
                className="p-3.5 rounded-[12px] border border-[#E6E8EC] dark:border-[#232836] bg-white dark:bg-[#161922] space-y-2.5"
              >
                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  {obj.objectionText}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Psicologia: </span>
                  {obj.corePsychology}
                </div>

                <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  {obj.recommendedResponses.map((resp, i) => (
                    <div key={i} className="p-2.5 rounded-[9px] bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#635BFF] uppercase">
                          {resp.label}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(resp.script);
                            showToast({
                              type: 'info',
                              title: 'Resposta copiada!',
                              message: 'Contorno pronto para enviar.',
                            });
                          }}
                          className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          Copiar
                        </button>
                      </div>
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 italic leading-relaxed">
                        &ldquo;{resp.script}&rdquo;
                      </p>
                      <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 pt-0.5">
                        Pergunta de fechamento: {resp.nextStepQuestion}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Histórico / Timeline */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Cadência e Registro de Toques
          </div>
          <Timeline events={selectedLead.history} />
        </div>
      )}
    </Drawer>

    {/* Modal de Auditoria "Por que este score?" */}
    {scoreResult && (
      <WhyThisScoreModal
        isOpen={isWhyScoreModalOpen}
        onClose={() => setIsWhyScoreModalOpen(false)}
        result={scoreResult}
        onOpenQuestionnaire={() => {
          setIsWhyScoreModalOpen(false);
          setIsQualifyModalOpen(true);
        }}
      />
    )}

    {/* Modal de Ajuste de Perguntas */}
    {matchedCompany && (
      <CompanyQualificationModal
        isOpen={isQualifyModalOpen}
        onClose={() => setIsQualifyModalOpen(false)}
        company={matchedCompany}
        questions={qualificationQuestions}
        services={services}
        savedAnswers={qualificationAnswers[matchedCompany.id] || {}}
        onSaveAnswers={saveCompanyQualificationAnswers}
        onOpenAuditModal={() => {
          setIsQualifyModalOpen(false);
          setIsWhyScoreModalOpen(true);
        }}
      />
    )}
    </>
  );
};
