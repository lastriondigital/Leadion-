import { Company, CompanyTimelineEvent } from '../types/company';
import { FunnelEntity, FunnelSequence, SequenceMessage, MessageFollowUp } from '../types/funnel';

export type FunnelExecutionState = 
  | 'aguardando_envio'
  | 'whatsapp_aberto'
  | 'mensagem_enviada'
  | 'aguardando_resposta'
  | 'resposta_recebida'
  | 'followup_pendente'
  | 'transicao_realizada'
  | 'encerrado';

export interface CompanyFunnelExecution {
  funnelId: string;
  funnelName: string;
  sequenceId?: string;
  sequenceName?: string;
  messageId?: string;
  messageTitle?: string;
  followUpId?: string;
  followUpTitle?: string;
  nodeId?: string;
  executionState: FunnelExecutionState;
  nextExecutionDate?: string;
  nextExecutionTime?: string;
  lastActionAt?: string;
  notes?: string;
}

/**
 * Cria evento de transição entre funis preservando o histórico da empresa.
 * REGRA: Não duplica a empresa nem cria novo lead.
 */
export function executeFunnelTransition(
  company: Company,
  sourceFunnel: FunnelEntity,
  targetFunnel: FunnelEntity,
  targetSequence?: FunnelSequence | null,
  operatorName: string = 'Consultor Comercial',
  notes?: string
): {
  updatedCompany: Company;
  transitionEvent: CompanyTimelineEvent;
} {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const timestamp = `${dateStr} ${timeStr}`;

  const seqName = targetSequence?.name || (targetFunnel.sequences?.[0]?.name) || 'Sequência Inicial';

  const transitionEvent: CompanyTimelineEvent = {
    id: `evt-funnel-trans-${Date.now()}`,
    timestamp,
    type: 'transicao_funil',
    title: `Transição para "${targetFunnel.name}"`,
    detail: `Jornada transferida de "${sourceFunnel.name}" → "${targetFunnel.name}".\nEntrada na sequência "${seqName}".\nOperador: ${operatorName}${notes ? `\nObservações: ${notes}` : ''}`,
    author: operatorName,
    metadata: {
      sourceFunnelId: sourceFunnel.id,
      sourceFunnelName: sourceFunnel.name,
      targetFunnelId: targetFunnel.id,
      targetFunnelName: targetFunnel.name,
      targetSequenceId: targetSequence?.id || targetFunnel.sequences?.[0]?.id || '',
      targetSequenceName: seqName,
      operator: operatorName,
      date: dateStr,
      time: timeStr,
      notes: notes || null,
    },
  };

  const updatedCompany: Company = {
    ...company,
    funnelId: targetFunnel.id,
    updatedAt: timestamp,
    timeline: [transitionEvent, ...(company.timeline || [])],
  };

  return {
    updatedCompany,
    transitionEvent,
  };
}

/**
 * Registra o estado de execução real no histórico da empresa,
 * diferenciando com precisão 'WhatsApp aberto' de 'Mensagem enviada' e 'Resposta recebida'.
 */
export function recordExecutionStateChange(
  company: Company,
  funnel: FunnelEntity,
  state: FunnelExecutionState,
  details: {
    sequenceName?: string;
    messageName?: string;
    followUpName?: string;
    operatorName?: string;
    content?: string;
    notes?: string;
  }
): {
  updatedCompany: Company;
  timelineEvent: CompanyTimelineEvent;
} {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const timestamp = `${dateStr} ${timeStr}`;
  const operator = details.operatorName || 'Consultor Comercial';

  let title = 'Ação de Prospecção';
  let detail = '';

  switch (state) {
    case 'whatsapp_aberto':
      title = 'WhatsApp Aberto para Envio';
      detail = `Janela do WhatsApp iniciada para ${details.messageName || details.followUpName || 'mensagem'}.\nNota: O envio manual ainda aguarda confirmação.`;
      break;
    case 'mensagem_enviada':
      title = 'Mensagem Enviada no Funil';
      detail = `Mensagem "${details.messageName || details.followUpName || 'Abordagem'}" confirmada como enviada na sequência "${details.sequenceName || 'Jornada'}".${details.content ? `\nConteúdo enviado: "${details.content.substring(0, 120)}..."` : ''}`;
      break;
    case 'resposta_recebida':
      title = 'Resposta Recebida da Empresa';
      detail = `A empresa retornou contato na etapa "${details.sequenceName || 'Jornada'}".${details.notes ? `\nDetalhes da réplica: ${details.notes}` : ''}`;
      break;
    case 'followup_pendente':
      title = `Follow-up Agendado: ${details.followUpName || 'Próximo toque'}`;
      detail = `Aguardando janela de execução de follow-up.${details.notes ? `\nObservação: ${details.notes}` : ''}`;
      break;
    case 'encerrado':
      title = 'Jornada Encerrada no Funil';
      detail = `Execução de prospecção finalizada para este ciclo.${details.notes ? `\nMotivo: ${details.notes}` : ''}`;
      break;
    default:
      title = `Status Atualizado: ${state}`;
      detail = details.notes || 'Status de prospecção atualizado.';
  }

  const timelineEvent: CompanyTimelineEvent = {
    id: `evt-exec-${Date.now()}`,
    timestamp,
    type: state === 'resposta_recebida' ? 'resposta' : state === 'mensagem_enviada' ? 'mensagem_enviada' : 'whatsapp_enviado',
    title,
    detail: `${detail}\nOperador: ${operator}`,
    author: operator,
  };

  const updatedCompany: Company = {
    ...company,
    updatedAt: timestamp,
    timeline: [timelineEvent, ...(company.timeline || [])],
  };

  return {
    updatedCompany,
    timelineEvent,
  };
}
