import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Scale, 
  Save, 
  Layers, 
  Building2, 
  Briefcase, 
  Check, 
  Info
} from 'lucide-react';
import { Company } from '../../core/types/company';
import { ServiceEntity } from '../../core/types/service';
import { QualificationQuestion, CompanyScoreResult } from '../../core/types/qualification';
import { calculateCompanyQualification, inferDefaultAnswerForQuestion } from '../../core/qualification/qualificationEngine';

interface CompanyQualificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  questions: QualificationQuestion[];
  services: ServiceEntity[];
  savedAnswers: Record<string, string>;
  onSaveAnswers: (companyId: string, answers: Record<string, string>) => void;
  onOpenAuditModal: (result: CompanyScoreResult) => void;
}

export const CompanyQualificationModal: React.FC<CompanyQualificationModalProps> = ({
  isOpen,
  onClose,
  company,
  questions,
  services,
  savedAnswers,
  onSaveAnswers,
  onOpenAuditModal,
}) => {
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'client' | 'services'>('client');

  // Inicializa respostas locais quando abrir
  React.useEffect(() => {
    if (company) {
      const initial: Record<string, string> = { ...(savedAnswers || {}) };
      // Preenche defaults caso não respondido
      questions.forEach((q) => {
        if (!initial[q.id]) {
          initial[q.id] = inferDefaultAnswerForQuestion(q, company);
        }
      });
      setLocalAnswers(initial);
    }
  }, [company, questions, savedAnswers, isOpen]);

  if (!isOpen || !company) return null;

  // Recalcula scores em tempo real conforme o operador clica nas respostas
  const liveResult = calculateCompanyQualification(company, questions, services, localAnswers);

  const handleOptionClick = (questionId: string, value: string) => {
    setLocalAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSaveAndClose = () => {
    onSaveAnswers(company.id, localAnswers);
    onClose();
  };

  const clientQuestions = questions.filter((q) => q.targetType === 'client' && q.status === 'active');
  const serviceQuestions = questions.filter((q) => q.targetType === 'service' && q.status === 'active');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        id="company-qualification-modal"
        className="bg-white dark:bg-[#141720] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-[#111319]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-[#635BFF] dark:bg-indigo-950/60 dark:text-indigo-300">
                  Questionário de Qualificação Comercial
                </span>
                <span className="text-xs text-zinc-400">
                  {company.city} • {company.country}
                </span>
              </div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                {company.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Scores Bar */}
        <div className="p-4 bg-zinc-100/60 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Score Cliente */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500">Score Cliente:</span>
              <span className="font-mono font-black text-base px-2.5 py-0.5 rounded-lg bg-[#635BFF] text-white">
                {liveResult.clientScore}/100
              </span>
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold">
                ({liveResult.clientLevel})
              </span>
            </div>

            {/* Score dos Serviços */}
            <div className="flex items-center gap-2 border-l border-zinc-300 dark:border-zinc-700 pl-4">
              <span className="text-xs font-bold text-zinc-500">Serviços:</span>
              {liveResult.serviceScores.slice(0, 3).map((s) => (
                <span 
                  key={s.serviceId}
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                  title={s.serviceName}
                >
                  {s.serviceName.split(' ')[0]}: {s.score}
                </span>
              ))}
            </div>
          </div>

          {/* Botão Por Que Este Score */}
          <button
            type="button"
            onClick={() => onOpenAuditModal(liveResult)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-[#635BFF] text-[#635BFF] dark:text-[#9A94FF] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Por que este score?
          </button>
        </div>

        {/* Section Switcher */}
        <div className="px-5 pt-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 bg-white dark:bg-[#141720]">
          <button
            type="button"
            onClick={() => setActiveSection('client')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'client'
                ? 'border-[#635BFF] text-[#635BFF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Critérios do Cliente ({clientQuestions.length} perguntas)
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('services')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'services'
                ? 'border-[#635BFF] text-[#635BFF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Critérios dos Serviços ({serviceQuestions.length} perguntas)
          </button>
        </div>

        {/* Questions Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeSection === 'client' && (
            <div className="space-y-3">
              {clientQuestions.map((q) => {
                const currentVal = localAnswers[q.id];

                return (
                  <div 
                    key={q.id}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#635BFF] block mb-0.5">
                          {q.category} • Peso {q.weight}x
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {q.text}
                        </h4>
                      </div>
                    </div>

                    {/* Options buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {q.options.map((opt) => {
                        const isSelected = currentVal === opt.value;
                        const isIdeal = opt.value === q.idealResponse;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleOptionClick(q.id, opt.value)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                              isSelected
                                ? 'bg-[#635BFF] text-white border-[#635BFF] shadow-xs'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700/60'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            <span>{opt.label}</span>
                            <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-black/20 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                            }`}>
                              +{opt.points} pts
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {q.rationale && (
                      <p className="text-[11px] text-zinc-400 italic pt-1">
                        Racional: {q.rationale}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeSection === 'services' && (
            <div className="space-y-3">
              {serviceQuestions.map((q) => {
                const currentVal = localAnswers[q.id];

                return (
                  <div 
                    key={q.id}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                          {q.serviceName || 'Geral'} • {q.category} • Peso {q.weight}x
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {q.text}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {q.options.map((opt) => {
                        const isSelected = currentVal === opt.value;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleOptionClick(q.id, opt.value)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700/60'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            <span>{opt.label}</span>
                            <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-black/20 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                            }`}>
                              +{opt.points} pts
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#111319] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-5 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5248E2] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Respostas e Atualizar Scores
          </button>
        </div>
      </div>
    </div>
  );
};
