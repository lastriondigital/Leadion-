import React, { useState, useEffect } from 'react';
import { ProspectAction, ActionOutcomeType, ActionChannel } from '../../core/types/prospectAction';
import { useLeadion } from '../../context/LeadionContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  MessageSquare, 
  Clock, 
  ShieldAlert, 
  Trophy, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  Building2, 
  User, 
  CheckCircle2,
  AlertTriangle,
  Send,
  Check
} from 'lucide-react';

interface ActionOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: ProspectAction | null;
}

export const ActionOutcomeModal: React.FC<ActionOutcomeModalProps> = ({
  isOpen,
  onClose,
  action,
}) => {
  const { 
    resolveActionWithOutcome, 
    openObjectionModal, 
    openWhatsAppForCompany,
    scriptsEntities,
    companies,
    userName 
  } = useLeadion();

  const [selectedOutcome, setSelectedOutcome] = useState<ActionOutcomeType>('respondeu');
  const [notes, setNotes] = useState('');
  
  // Próxima Ação Sugerida pelo Motor
  const [suggestedActionTitle, setSuggestedActionTitle] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('Amanhã');
  const [suggestedTime, setSuggestedTime] = useState('09:30');
  const [suggestedChannel, setSuggestedChannel] = useState<ActionChannel>('whatsapp');
  const [suggestedScriptText, setSuggestedScriptText] = useState('');
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');

  // Perda
  const [lostReason, setLostReason] = useState('Preço muito alto / Fora do orçamento');

  // Ganho
  const [wonValue, setWonValue] = useState(action?.potentialValue || '10.000 MT');

  const company = companies.find((c) => c.id === action?.companyId);

  // Calcula sugestões automáticas ao mudar o outcome ou action
  useEffect(() => {
    if (!action) return;

    if (selectedOutcome === 'respondeu') {
      // 1. Sugerir próximo script da sequência
      const isFirstTouch = action.nextAction.toLowerCase().includes('primeira') || 
                           action.nextAction.toLowerCase().includes('toque 1') ||
                           action.nextAction.toLowerCase().includes('abordagem');

      const nextTitle = isFirstTouch 
        ? 'Enviar Script #2: Proposta de Valor & Demonstração' 
        : 'Enviar Apresentação Comercial Detalhada';

      setSuggestedActionTitle(nextTitle);
      setSuggestedDate('Hoje');
      setSuggestedTime('14:30');
      setSuggestedChannel('whatsapp');

      // Encontra próximo script relevante
      const nextScript = scriptsEntities.find((s) => s.sequenceOrder === 2 || s.sequenceType === 'qualificacao') || scriptsEntities[1] || scriptsEntities[0];
      if (nextScript) {
        setSelectedScriptId(nextScript.id);
        const contactName = action.targetContactName || 'Dra.';
        setSuggestedScriptText(
          `Excelente ${contactName}! Fico feliz com seu retorno. Conforme comentei, podemos agendar 15 minutos rápidos amanhã às 10h para eu demonstrar na prática os resultados?`
        );
      }
    } else if (selectedOutcome === 'nao_respondeu') {
      // 2. Sugerir follow-up automático
      let followUpNumber = 1;
      if (action.nextAction.toLowerCase().includes('follow-up #1') || action.nextAction.toLowerCase().includes('followup #1')) {
        followUpNumber = 2;
      } else if (action.nextAction.toLowerCase().includes('follow-up #2')) {
        followUpNumber = 3;
      }

      setSuggestedActionTitle(`Enviar Follow-up #${followUpNumber}`);
      setSuggestedDate('Em 2 dias (D+2)');
      setSuggestedTime('09:30');
      setSuggestedChannel(action.channel || 'whatsapp');
      setSuggestedScriptText(
        `Olá ${action.targetContactName || 'tudo bem'}? Passando rapidamente para saber se conseguiu dar uma olhada na mensagem anterior sobre a solução para a ${action.companyName}.`
      );
    } else if (selectedOutcome === 'ganhou') {
      setWonValue(action.potentialValue || '10.000 MT');
    }
  }, [action, selectedOutcome, scriptsEntities]);

  if (!action) return null;

  const handleConfirm = () => {
    if (selectedOutcome === 'objecao') {
      // Abre modal de objeções
      onClose();
      openObjectionModal(
        action.companyName,
        action.targetContactName,
        (scriptText) => {
          if (company) {
            openWhatsAppForCompany(company, null, scriptText, action.id);
          }
        }
      );
      return;
    }

    resolveActionWithOutcome(action.id, {
      outcome: selectedOutcome,
      notes: notes.trim(),
      lostReason: selectedOutcome === 'perdeu' ? lostReason : undefined,
      wonValue: selectedOutcome === 'ganhou' ? wonValue : undefined,
      nextActionTitle: (selectedOutcome === 'respondeu' || selectedOutcome === 'nao_respondeu') ? suggestedActionTitle : undefined,
      nextFollowUpDate: (selectedOutcome === 'respondeu' || selectedOutcome === 'nao_respondeu') ? suggestedDate : undefined,
      nextFollowUpTime: (selectedOutcome === 'respondeu' || selectedOutcome === 'nao_respondeu') ? suggestedTime : undefined,
      nextChannel: suggestedChannel,
      nextScriptId: selectedScriptId,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Concluir Ação & Calcular Próximo Passo"
      description={`Registre o resultado do contato com ${action.companyName} para o motor calcular a próxima ação.`}
      size="lg"
    >
      <div className="space-y-5 pt-1">
        
        {/* Resumo da Ação Atual */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-[#635BFF]" />
              <span className="font-bold text-sm text-zinc-900">{action.companyName}</span>
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs text-zinc-500">{action.niche}</span>
            </div>
            <div className="text-xs text-zinc-600 mt-1 flex items-center gap-2">
              <span>Ação executada: <strong>{action.nextAction}</strong></span>
              {action.targetContactName && (
                <>
                  <span>·</span>
                  <span className="text-zinc-500">Decisor: {action.targetContactName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
            <span className="text-[11px] font-mono font-bold bg-zinc-200/70 text-zinc-800 px-2 py-0.5 rounded">
              Score: {action.clientScore ?? action.score}/100
            </span>
            <span className="text-[11px] font-bold uppercase bg-[#635BFF]/10 text-[#635BFF] px-2 py-0.5 rounded">
              Prioridade {action.calculatedPriorityScore ?? 96}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* AS 5 VIAS DE DESFECHO SOLICITADAS:                                        */}
        {/* 1. Cliente Respondeu   -> sugerir próximo script                          */}
        {/* 2. Não Respondeu       -> sugerir follow-up                               */}
        {/* 3. Objeção             -> abrir biblioteca de objeções                    */}
        {/* 4. Ganhou              -> encerrar prospecção / cliente conquistado       */}
        {/* 5. Perdeu              -> registrar motivo                                */}
        {/* ========================================================================= */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Qual foi o desfecho desta abordagem?
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            
            {/* 1. Cliente Respondeu */}
            <button
              type="button"
              onClick={() => setSelectedOutcome('respondeu')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedOutcome === 'respondeu'
                  ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-zinc-900 leading-tight">
                Cliente Respondeu
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Interagiu ou pediu detalhes
              </p>
            </button>

            {/* 2. Não Respondeu */}
            <button
              type="button"
              onClick={() => setSelectedOutcome('nao_respondeu')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedOutcome === 'nao_respondeu'
                  ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-zinc-900 leading-tight">
                Não Respondeu
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Aguardando retorno
              </p>
            </button>

            {/* 3. Objeção */}
            <button
              type="button"
              onClick={() => setSelectedOutcome('objecao')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedOutcome === 'objecao'
                  ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20 shadow-xs'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-zinc-900 leading-tight">
                Apresentou Objeção
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Barreira de preço/tempo
              </p>
            </button>

            {/* 4. Ganhou */}
            <button
              type="button"
              onClick={() => setSelectedOutcome('ganhou')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedOutcome === 'ganhou'
                  ? 'border-violet-500 bg-violet-50/80 ring-2 ring-violet-500/20 shadow-xs'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center mb-2">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-zinc-900 leading-tight">
                Ganhou / Fechou
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Contrato firmado
              </p>
            </button>

            {/* 5. Perdeu */}
            <button
              type="button"
              onClick={() => setSelectedOutcome('perdeu')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedOutcome === 'perdeu'
                  ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 shadow-xs'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2">
                <XCircle className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-zinc-900 leading-tight">
                Perdeu / Desistiu
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Desqualificado / Sem fit
              </p>
            </button>

          </div>
        </div>

        {/* PAINEL DINÂMICO: CÁLCULO AUTOMÁTICO DA PRÓXIMA AÇÃO */}
        {selectedOutcome === 'respondeu' && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                Leadion Auto-Engine: Próximo Script Sugerido
              </h4>
            </div>

            <p className="text-xs text-emerald-800">
              Como o cliente respondeu, a cadência deve avançar para o próximo script de validação de valor ou agendamento de diagnóstico.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Título da Próxima Ação
                </label>
                <input
                  type="text"
                  value={suggestedActionTitle}
                  onChange={(e) => setSuggestedActionTitle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Data Agendada
                  </label>
                  <input
                    type="text"
                    value={suggestedDate}
                    onChange={(e) => setSuggestedDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="text"
                    value={suggestedTime}
                    onChange={(e) => setSuggestedTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {suggestedScriptText && (
              <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                <div className="text-[11px] font-bold text-emerald-900 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                  Roteiro de Resposta Rápida (WhatsApp)
                </div>
                <p className="text-xs text-zinc-700 italic">
                  "{suggestedScriptText}"
                </p>
              </div>
            )}
          </div>
        )}

        {selectedOutcome === 'nao_respondeu' && (
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#635BFF] shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Leadion Auto-Engine: Follow-up Inteligente Sugerido
              </h4>
            </div>

            <p className="text-xs text-indigo-800">
              O sistema calcula automaticamente o melhor intervalo de follow-up (D+2 dias úteis) para reativar o decisor sem parecer insistente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Ação de Cadência
                </label>
                <input
                  type="text"
                  value={suggestedActionTitle}
                  onChange={(e) => setSuggestedActionTitle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-[#635BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Data Programada
                  </label>
                  <input
                    type="text"
                    value={suggestedDate}
                    onChange={(e) => setSuggestedDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-[#635BFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="text"
                    value={suggestedTime}
                    onChange={(e) => setSuggestedTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-[#635BFF]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedOutcome === 'objecao' && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Abertura da Matriz de Objeções
              </h4>
            </div>
            <p className="text-xs text-amber-800">
              Ao confirmar, a <strong>Biblioteca de Objeções</strong> do LEADION será aberta para você selecionar a objeção levantada (Preço, Concorrente, Falta de Tempo, Já temos agência) e disparar o roteiro de contorno validado diretamente no WhatsApp.
            </p>
          </div>
        )}

        {selectedOutcome === 'ganhou' && (
          <div className="bg-violet-50/70 border border-violet-200 rounded-xl p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-violet-600 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-violet-950">
                Comemoração & Encerramento da Prospecção
              </h4>
            </div>
            <p className="text-xs text-violet-800">
              A empresa será movida para <strong>Cliente Conquistado</strong>. A cadência de prospecção será encerrada com vitória registrada no histórico comercial.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Valor Total Fechado
              </label>
              <input
                type="text"
                value={wonValue}
                onChange={(e) => setWonValue(e.target.value)}
                placeholder="Ex: 10.000 MT ou R$ 4.500"
                className="w-full sm:w-64 text-xs p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 font-mono font-bold focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        )}

        {selectedOutcome === 'perdeu' && (
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                Registrar Motivo da Perda
              </h4>
            </div>
            <p className="text-xs text-rose-800">
              Registrar o motivo é fundamental para o aprendizado do algoritmo e relatórios de inteligência de vendas.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Motivo Principal do Descarte
              </label>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-rose-500"
              >
                <option value="Preço muito alto / Fora do orçamento">Preço muito alto / Fora do orçamento</option>
                <option value="Optou por concorrente">Optou por concorrente</option>
                <option value="Sem interesse na solução / Não vê valor">Sem interesse na solução / Não vê valor</option>
                <option value="Sem resposta após cadência completa (5+ toques)">Sem resposta após cadência completa (5+ toques)</option>
                <option value="Perfil não atende ICP (Sem fit)">Perfil não atende ICP (Sem fit)</option>
                <option value="Momento inadequado (reavaliar em 6 meses)">Momento inadequado (reavaliar em 6 meses)</option>
                <option value="Outro motivo">Outro motivo</option>
              </select>
            </div>
          </div>
        )}

        {/* Observações Gerais */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Nota de Feedback Operacional (Opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Decisora foi muito receptiva, pediu para retornar no início da tarde..."
            rows={2}
            className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
          />
        </div>

        {/* Rodapé / Botões de Ação */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-800 font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Cancelar
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            className="bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 px-4 py-2"
          >
            {selectedOutcome === 'objecao' ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Ver objeções</span>
              </>
            ) : selectedOutcome === 'ganhou' ? (
              <>
                <Trophy className="w-4 h-4" />
                <span>Confirmar ganho</span>
              </>
            ) : selectedOutcome === 'perdeu' ? (
              <>
                <XCircle className="w-4 h-4" />
                <span>Confirmar perda</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar e agendar</span>
              </>
            )}
          </Button>
        </div>

      </div>
    </Modal>
  );
};
