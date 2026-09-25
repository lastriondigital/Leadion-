import React, { useState } from 'react';
import { Company } from '../../core/types/company';
import { FunnelEntity, FunnelSequence, SequenceMessage, MessageFollowUp } from '../../core/types/funnel';
import { 
  executeFunnelTransition, 
  recordExecutionStateChange, 
  FunnelExecutionState 
} from '../../core/funnel/funnelExecutionEngine';
import { FunnelTransitionModal } from './modals/FunnelTransitionModal';
import { Button } from '../ui/Button';
import { 
  Building2, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Phone, 
  Search,
  Check,
  Send,
  UserCheck
} from 'lucide-react';

interface FunnelCompaniesTabProps {
  funnel: FunnelEntity;
  companies: Company[];
  availableFunnels: FunnelEntity[];
  userName?: string;
  onUpdateCompany: (companyId: string, updates: Partial<Company>) => void;
  onSelectCompany?: (company: Company) => void;
  showToast: (opts: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string }) => void;
}

export const FunnelCompaniesTab: React.FC<FunnelCompaniesTabProps> = ({
  funnel,
  companies,
  availableFunnels,
  userName = 'Consultor Comercial',
  onUpdateCompany,
  onSelectCompany,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [transitionTargetCompany, setTransitionTargetCompany] = useState<Company | null>(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);

  // Filter companies that are in this funnel
  const companiesInFunnel = companies.filter((c) => {
    const isInFunnel = c.funnelId === funnel.id || (!c.funnelId && funnel.isDefault);
    if (!isInFunnel) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.city?.toLowerCase().includes(term) ||
      c.niche?.toLowerCase().includes(term)
    );
  });

  const sequences = funnel.sequences || [];

  // Open WhatsApp Link without falsely marking as sent
  const handleOpenWhatsApp = (comp: Company) => {
    const rawPhone = comp.whatsapp || comp.phone || comp.responsibles?.[0]?.whatsapp || comp.responsibles?.[0]?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');

    if (!cleanPhone) {
      showToast({
        type: 'warning',
        title: 'Sem número de telefone',
        message: 'Cadastre o WhatsApp da empresa ou do responsável para iniciar o contato.',
      });
      return;
    }

    const firstMsg = sequences[0]?.messages?.[0]?.content || `Olá, gostaria de falar sobre a solução para a ${comp.name}.`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(firstMsg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Registra que a conversa foi aberta no WhatsApp, sem mentir que a mensagem foi enviada
    const { updatedCompany } = recordExecutionStateChange(comp, funnel, 'whatsapp_aberto', {
      sequenceName: sequences[0]?.name || 'Entrada',
      messageName: sequences[0]?.messages?.[0]?.internalName || 'Abordagem Inicial',
      operatorName: userName,
    });
    onUpdateCompany(comp.id, updatedCompany);

    showToast({
      type: 'info',
      title: 'WhatsApp Aberto',
      message: `Conversa aberta. Confirme o envio manualmente quando a mensagem for disparada.`,
    });
  };

  // Explicit confirmation that message was sent
  const handleConfirmSent = (comp: Company) => {
    const firstSeq = sequences[0];
    const firstMsg = firstSeq?.messages?.[0];

    const { updatedCompany } = recordExecutionStateChange(comp, funnel, 'mensagem_enviada', {
      sequenceName: firstSeq?.name || 'Prospecção',
      messageName: firstMsg?.internalName || 'Abordagem',
      content: firstMsg?.content,
      operatorName: userName,
    });

    onUpdateCompany(comp.id, updatedCompany);
    showToast({
      type: 'success',
      title: 'Envio Confirmado',
      message: `Status atualizado para "Mensagem enviada". Aguardando resposta do decisor.`,
    });
  };

  // Register that client replied
  const handleRegisterReply = (comp: Company) => {
    const { updatedCompany } = recordExecutionStateChange(comp, funnel, 'resposta_recebida', {
      sequenceName: sequences[0]?.name || 'Prospecção',
      operatorName: userName,
      notes: 'Empresa respondeu positivamente ao contato inicial.',
    });

    onUpdateCompany(comp.id, updatedCompany);
    showToast({
      type: 'success',
      title: 'Resposta Registrada',
      message: `${comp.name}: resposta computada na timeline da empresa.`,
    });
  };

  // Execute transition to another funnel
  const handleExecuteTransition = (
    targetFunnel: FunnelEntity,
    targetSeq?: FunnelSequence | null,
    notes?: string
  ) => {
    if (!transitionTargetCompany) return;

    const { updatedCompany } = executeFunnelTransition(
      transitionTargetCompany,
      funnel,
      targetFunnel,
      targetSeq,
      userName,
      notes
    );

    onUpdateCompany(transitionTargetCompany.id, updatedCompany);
    showToast({
      type: 'success',
      title: 'Transição Concluída',
      message: `${transitionTargetCompany.name} transferida para "${targetFunnel.name}" sem duplicação de dados.`,
    });
    setTransitionTargetCompany(null);
    setIsTransitionModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Empresas Nesta Jornada ({companiesInFunnel.length})
          </h3>
          <p className="text-xs text-zinc-500">
            Acompanhe o estado de execução real de cada empresa sem duplicar leads ou registros.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar empresa..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>
      </div>

      {/* Companies List */}
      {companiesInFunnel.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <Building2 className="w-12 h-12 text-[#635BFF] mx-auto mb-3" />
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Nenhuma empresa vinculada a este funil
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            Vincule empresas da sua base comercial a este funil pela lista de Empresas ou inicie uma nova prospecção.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {companiesInFunnel.map((comp) => {
            const primaryContact = comp.responsibles?.find((r) => r.isPrimary) || comp.responsibles?.[0];
            const lastEvent = comp.timeline?.[0];

            return (
              <div
                key={comp.id}
                className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      onClick={() => onSelectCompany && onSelectCompany(comp)}
                      className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-[#635BFF] cursor-pointer"
                    >
                      {comp.name}
                    </span>
                    {comp.niche && (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {comp.niche}
                      </span>
                    )}
                    {comp.country && (
                      <span className="text-[11px] text-zinc-500">
                        {comp.city ? `${comp.city} · ` : ''}{comp.country}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                    {primaryContact?.name && (
                      <span>Contato: <strong>{primaryContact.name}</strong> {primaryContact.role ? `(${primaryContact.role})` : ''}</span>
                    )}
                    {comp.whatsapp && (
                      <span>WhatsApp: {comp.whatsapp}</span>
                    )}
                  </div>

                  {lastEvent && (
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg mt-1">
                      <strong>Último registro ({lastEvent.timestamp}):</strong> {lastEvent.title}
                    </div>
                  )}
                </div>

                {/* Real Execution Action Controls */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenWhatsApp(comp)}
                    icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                    title="Abre o WhatsApp sem marcar automaticamente como enviado"
                    className="text-xs"
                  >
                    Abrir WhatsApp
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConfirmSent(comp)}
                    icon={<Send className="w-3.5 h-3.5 text-blue-500" />}
                    title="Confirma manualmente que a mensagem foi disparada"
                    className="text-xs"
                  >
                    Confirmar Envio
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRegisterReply(comp)}
                    icon={<UserCheck className="w-3.5 h-3.5 text-purple-500" />}
                    title="Registra que a empresa retornou contato"
                    className="text-xs"
                  >
                    Registrar Resposta
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setTransitionTargetCompany(comp);
                      setIsTransitionModalOpen(true);
                    }}
                    icon={<ExternalLink className="w-3.5 h-3.5 text-[#635BFF]" />}
                    title="Transferir para outro funil sem duplicar o lead"
                    className="text-xs text-[#635BFF] hover:bg-[#635BFF]/10"
                  >
                    Transição
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transition Modal */}
      {transitionTargetCompany && (
        <FunnelTransitionModal
          isOpen={isTransitionModalOpen}
          onClose={() => {
            setIsTransitionModalOpen(false);
            setTransitionTargetCompany(null);
          }}
          company={transitionTargetCompany}
          currentFunnel={funnel}
          availableFunnels={availableFunnels}
          onExecuteTransition={handleExecuteTransition}
        />
      )}
    </div>
  );
};
