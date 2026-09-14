import React, { useState, useMemo } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Score } from '../ui/Score';
import { Badge } from '../ui/Badge';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  MessageSquare, 
  Mail, 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  ExternalLink,
  ArrowRight,
  Share2,
  Sparkles,
  HelpCircle,
  Scale
} from 'lucide-react';
import { calculateCompanyQualification } from '../../core/qualification/qualificationEngine';
import { WhyThisScoreModal } from '../qualification/WhyThisScoreModal';
import { CompanyQualificationModal } from '../qualification/CompanyQualificationModal';

export const QuickCompanyModal: React.FC = () => {
  const { 
    quickViewCompany, 
    setQuickViewCompany, 
    setSelectedCompany, 
    setActiveNav,
    setIsPlanningModalOpen,
    setPlanningPreselectedCompany,
    services,
    qualificationQuestions,
    qualificationAnswers,
    saveCompanyQualificationAnswers
  } = useLeadion();

  const [isWhyScoreModalOpen, setIsWhyScoreModalOpen] = useState(false);
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);

  const scoreResult = useMemo(() => {
    if (!quickViewCompany) return null;
    const answers = qualificationAnswers[quickViewCompany.id] || {};
    return calculateCompanyQualification(quickViewCompany, qualificationQuestions, services, answers);
  }, [quickViewCompany, qualificationQuestions, services, qualificationAnswers]);

  if (!quickViewCompany) return null;

  const handleOpenFullCompany = () => {
    setSelectedCompany(quickViewCompany);
    setActiveNav('companies');
    setQuickViewCompany(null);
  };

  const handleProgramAction = () => {
    setPlanningPreselectedCompany(quickViewCompany);
    setIsPlanningModalOpen(true);
    setQuickViewCompany(null);
  };

  return (
    <>
    <Modal
      isOpen={!!quickViewCompany}
      onClose={() => setQuickViewCompany(null)}
      title={quickViewCompany.name}
      description={`${quickViewCompany.niche} · ${quickViewCompany.location}`}
      size="lg"
    >
      <div className="space-y-4 pt-1">
        
        {/* Header Summary */}
        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200/70 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-xs">
              <Building2 className="w-5 h-5 text-[#635BFF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{quickViewCompany.name}</span>
                {scoreResult && (
                  <span className="text-[11px] font-semibold bg-[#635BFF]/10 text-[#635BFF] px-2 py-0.5 rounded">
                    Score {scoreResult.clientScore}/100
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {quickViewCompany.businessType || quickViewCompany.niche}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenFullCompany}
            className="text-xs"
          >
            Ficha Completa <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {/* Inteligência de Qualificação Leadion */}
        {scoreResult && (
          <div className="p-3.5 rounded-xl border border-[#635BFF]/20 bg-[#635BFF]/5 dark:bg-[#635BFF]/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#635BFF]">
                <Scale className="w-4 h-4" />
                <span>Qualificação Leadion (0 a 100)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsWhyScoreModalOpen(true)}
                  className="px-2 py-1 rounded-md text-[11px] font-bold text-[#635BFF] hover:bg-[#635BFF]/10 transition-colors flex items-center gap-1 cursor-pointer border border-[#635BFF]/30"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Por que este score?</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsQualifyModalOpen(true)}
                  className="px-2 py-1 rounded-md text-[11px] font-bold bg-[#635BFF] text-white hover:bg-[#5248E5] transition-colors cursor-pointer"
                >
                  Ajustar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                  1. Score do Cliente
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-black font-mono text-zinc-900 dark:text-zinc-100">
                    {scoreResult.clientScore}
                  </span>
                  <span className="text-[10px] text-zinc-400">/ 100</span>
                  <span className="text-[10px] font-bold text-[#635BFF] ml-1">
                    ({scoreResult.clientLevel})
                  </span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                  2. Serviço Recomendado
                </span>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                  {scoreResult.recommendedService?.serviceName || 'Nenhum avaliado'}
                </div>
                {scoreResult.recommendedService && (
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Match: {scoreResult.recommendedService.combinationScore}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Informações Básicas & Contatos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Contatos da Empresa */}
          <div className="p-3 bg-white rounded-lg border border-zinc-200/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Contatos Principais
            </span>
            <div className="space-y-1.5 text-xs">
              {quickViewCompany.whatsapp && (
                <div className="flex items-center gap-2 text-zinc-700">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>WhatsApp: {quickViewCompany.whatsapp}</span>
                </div>
              )}
              {quickViewCompany.phone && (
                <div className="flex items-center gap-2 text-zinc-700">
                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Telefone: {quickViewCompany.phone}</span>
                </div>
              )}
              {quickViewCompany.email && (
                <div className="flex items-center gap-2 text-zinc-700">
                  <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Email: {quickViewCompany.email}</span>
                </div>
              )}
              {quickViewCompany.website && (
                <div className="flex items-center gap-2 text-zinc-700">
                  <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <a href={quickViewCompany.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-[#635BFF] truncate">
                    {quickViewCompany.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Localização & Porte */}
          <div className="p-3 bg-white rounded-lg border border-zinc-200/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Localização & Porte
            </span>
            <div className="space-y-1.5 text-xs text-zinc-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{quickViewCompany.location}</span>
              </div>
              {quickViewCompany.address && (
                <div className="text-zinc-500 text-[11px] pl-5">
                  {quickViewCompany.address}
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Tamanho: {quickViewCompany.size || '10-50 colaboradores'}</span>
              </div>
              {quickViewCompany.unitsCount && (
                <div className="text-zinc-500 text-[11px] pl-5">
                  {quickViewCompany.unitsCount} unidade(s)
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Responsáveis */}
        {quickViewCompany.responsibles && quickViewCompany.responsibles.length > 0 && (
          <div className="p-3 bg-white rounded-lg border border-zinc-200/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Decisores Mapeados ({quickViewCompany.responsibles.length})
            </span>
            <div className="space-y-2">
              {quickViewCompany.responsibles.map((r) => (
                <div key={r.id} className="p-2.5 bg-zinc-50 rounded-md border border-zinc-200/60 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-zinc-900">{r.name}</span>
                      <span className="text-[11px] text-zinc-500">· {r.role}</span>
                      {r.isPrimary && (
                        <span className="text-[9px] font-bold uppercase bg-indigo-50 text-[#635BFF] px-1.5 py-0.2 rounded">
                          Decisor Principal
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                      {r.whatsapp && <span>Wpp: {r.whatsapp}</span>}
                      {r.email && <span>Email: {r.email}</span>}
                    </div>
                    {r.notes && (
                      <p className="text-[11px] text-zinc-600 mt-1 italic">
                        "{r.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próxima Ação Atual */}
        {quickViewCompany.nextAction && (
          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#635BFF] block">
                Próxima Ação Definida
              </span>
              <p className="text-xs font-semibold text-zinc-900 mt-0.5">
                {quickViewCompany.nextAction.label}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{quickViewCompany.nextAction.dueDate} às {quickViewCompany.nextAction.dueTime}</span>
                <span>·</span>
                <span>Canal: {quickViewCompany.nextAction.channel}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleProgramAction}
              className="text-xs"
            >
              Reagendar
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickViewCompany(null)}
          >
            Fechar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleProgramAction}
            >
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Programar Ação
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenFullCompany}
              className="bg-[#635BFF] hover:bg-[#5248E5] text-white"
            >
              Abrir Perfil Completo
            </Button>
          </div>
        </div>

      </div>
    </Modal>

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

    {/* Modal de Preenchimento / Ajuste de Perguntas */}
    {quickViewCompany && (
      <CompanyQualificationModal
        isOpen={isQualifyModalOpen}
        onClose={() => setIsQualifyModalOpen(false)}
        company={quickViewCompany}
        questions={qualificationQuestions}
        services={services}
        savedAnswers={qualificationAnswers[quickViewCompany.id] || {}}
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
