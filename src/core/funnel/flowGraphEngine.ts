import { 
  FunnelEntity, 
  FunnelSequence, 
  SequenceMessage, 
  MessageFollowUp, 
  FlowNode, 
  FlowEdge, 
  FlowNodeType, 
  FollowUpCondition 
} from '../types/funnel';
import { Company } from '../types/company';

/**
 * MOTOR DE GRAFOS DE PROSPECÇÃO & VALIDAÇÃO DO LEADION
 * Gerencia a topologia direcionada do funil, ciclos, layout e validação.
 */

export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationReport {
  isValid: boolean;
  errorsCount: number;
  warningsCount: number;
  issues: ValidationIssue[];
}

/**
 * Detecta se existe algum ciclo infinito no grafo de fluxo.
 * Retorna lista de IDs de nós que participam de ciclos fechados.
 */
export function detectGraphCycles(nodes: FlowNode[], edges: FlowEdge[]): string[][] {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (adj.has(e.sourceNodeId)) {
      adj.get(e.sourceNodeId)!.push(e.targetNodeId);
    }
  });

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[][] = [];
  const currentPath: string[] = [];

  function dfs(nodeId: string) {
    visited.add(nodeId);
    inStack.add(nodeId);
    currentPath.push(nodeId);

    const neighbors = adj.get(nodeId) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        dfs(next);
      } else if (inStack.has(next)) {
        const cycleStartIndex = currentPath.indexOf(next);
        if (cycleStartIndex >= 0) {
          cycles.push(currentPath.slice(cycleStartIndex).concat(next));
        }
      }
    }

    currentPath.pop();
    inStack.delete(nodeId);
  }

  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      dfs(n.id);
    }
  });

  return cycles;
}

/**
 * Validador completo da jornada de prospecção.
 * Checa integridade de sequências, nós órfãos, links quebrados e ciclos.
 */
export function validateFunnelFlow(
  funnel: FunnelEntity,
  availableFunnels: FunnelEntity[] = []
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const sequences = funnel.sequences || [];
  const nodes = funnel.flowNodes || [];
  const edges = funnel.flowEdges || [];

  const nodeMap = new Map<string, FlowNode>(nodes.map((n) => [n.id, n]));
  const funnelsMap = new Map<string, FunnelEntity>(availableFunnels.map((f) => [f.id, f]));

  // 1. Presença de pelo menos uma sequência ou nó de entrada
  if (sequences.length === 0 && nodes.length === 0) {
    issues.push({
      id: 'no-sequences',
      type: 'warning',
      message: 'O funil não possui sequências nem nós cadastrados. Adicione sua primeira sequência.',
    });
  }

  // 2. Checagem de integridade das arestas / conexões
  edges.forEach((edge) => {
    if (!nodeMap.has(edge.sourceNodeId)) {
      issues.push({
        id: `broken-source-${edge.id}`,
        type: 'error',
        message: `A conexão "${edge.label || 'sem rótulo'}" tem uma origem inexistente no fluxo.`,
        edgeId: edge.id,
      });
    }
    if (!nodeMap.has(edge.targetNodeId)) {
      issues.push({
        id: `broken-target-${edge.id}`,
        type: 'error',
        message: `A conexão "${edge.label || 'sem rótulo'}" aponta para um nó de destino inexistente.`,
        edgeId: edge.id,
      });
    }
  });

  // 3. Checagem de nós de Transição para outros funis
  nodes.forEach((node) => {
    if (node.type === 'transition') {
      const targetFunnelId = node.data?.targetFunnelId;
      if (!targetFunnelId) {
        issues.push({
          id: `missing-target-funnel-${node.id}`,
          type: 'error',
          message: `O nó de transição "${node.title}" não possui um funil de destino configurado.`,
          nodeId: node.id,
        });
      } else if (availableFunnels.length > 0 && !funnelsMap.has(targetFunnelId)) {
        issues.push({
          id: `invalid-target-funnel-${node.id}`,
          type: 'error',
          message: `O funil de destino referenciado no nó de transição "${node.title}" não foi encontrado.`,
          nodeId: node.id,
        });
      }
    }
  });

  // 4. Checagem de Follow-ups sem destino
  sequences.forEach((seq) => {
    (seq.messages || []).forEach((msg) => {
      (msg.followUps || []).forEach((fu) => {
        if (!fu.targetId && !fu.targetFunnelId && fu.condition !== 'encerramento') {
          issues.push({
            id: `fu-no-target-${fu.id}`,
            type: 'warning',
            message: `O follow-up "${fu.name}" na mensagem "${msg.internalName}" não possui um próximo destino definido.`,
          });
        }
      });
    });
  });

  // 5. Detecção de ciclos infinitos
  const detectedCycles = detectGraphCycles(nodes, edges);
  if (detectedCycles.length > 0) {
    detectedCycles.forEach((cycle, idx) => {
      const names = cycle
        .map((nid) => nodeMap.get(nid)?.title || nid)
        .join(' → ');
      issues.push({
        id: `cycle-detected-${idx}`,
        type: 'warning',
        message: `Loop detectado no fluxo: ${names}. Certifique-se de que existem condições de saída para não prender o lead em execução infinita.`,
      });
    });
  }

  const errorsCount = issues.filter((i) => i.type === 'error').length;
  const warningsCount = issues.filter((i) => i.type === 'warning').length;

  return {
    isValid: errorsCount === 0,
    errorsCount,
    warningsCount,
    issues,
  };
}

/**
 * Sincroniza a estrutura de nós e arestas visuais com as sequências e mensagens cadastradas,
 * respeitando posições manuais previamente salvas pelo operador.
 */
export function synchronizeFlowGraphWithSequences(funnel: FunnelEntity): {
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  const currentNodes = [...(funnel.flowNodes || [])];
  const currentEdges = [...(funnel.flowEdges || [])];

  const existingNodeMap = new Map<string, FlowNode>();
  currentNodes.forEach((n) => {
    if (n.referenceId) existingNodeMap.set(n.referenceId, n);
    existingNodeMap.set(n.id, n);
  });

  const existingEdgeSet = new Set<string>();
  currentEdges.forEach((e) => {
    existingEdgeSet.add(`${e.sourceNodeId}->${e.targetNodeId}:${e.condition}`);
  });

  const finalNodes: FlowNode[] = [];
  const finalEdges: FlowEdge[] = [...currentEdges];

  const sequences = funnel.sequences || [];
  let currentColX = 60;
  const colSpacingX = 360;
  const rowSpacingY = 160;

  sequences.forEach((seq, seqIdx) => {
    // 1. Nó da Sequência
    const seqNodeId = `node-seq-${seq.id}`;
    const existingSeqNode = existingNodeMap.get(seq.id) || existingNodeMap.get(seqNodeId);
    
    const posX = existingSeqNode ? existingSeqNode.positionX : currentColX;
    const posY = existingSeqNode ? existingSeqNode.positionY : 80;

    const seqNode: FlowNode = {
      id: seqNodeId,
      funnelId: funnel.id,
      type: 'sequence',
      referenceId: seq.id,
      title: seq.name,
      subtitle: `${seq.messages?.length || 0} mensagens · ${(seq.messages || []).reduce((acc, m) => acc + (m.followUps?.length || 0), 0)} follow-ups`,
      positionX: posX,
      positionY: posY,
      data: {
        order: seq.order ?? seqIdx + 1,
        color: seq.color || 'purple',
      },
    };
    finalNodes.push(seqNode);

    // 2. Mensagens dentro da Sequência
    let msgY = posY + 150;
    let prevMsgNodeId = seqNodeId;

    (seq.messages || []).forEach((msg, msgIdx) => {
      const msgNodeId = `node-msg-${msg.id}`;
      const existingMsgNode = existingNodeMap.get(msg.id) || existingNodeMap.get(msgNodeId);

      const mPosX = existingMsgNode ? existingMsgNode.positionX : posX;
      const mPosY = existingMsgNode ? existingMsgNode.positionY : msgY;

      const msgNode: FlowNode = {
        id: msgNodeId,
        funnelId: funnel.id,
        type: 'message',
        referenceId: msg.id,
        title: msg.internalName,
        subtitle: `Canal: ${msg.channel.toUpperCase()}`,
        positionX: mPosX,
        positionY: mPosY,
        data: {
          channel: msg.channel,
          contentPreview: msg.content.substring(0, 75),
          order: msg.order ?? msgIdx + 1,
          sequenceId: seq.id,
        },
      };
      finalNodes.push(msgNode);

      // Conexão implícita do nó anterior para esta mensagem (se ainda não existir)
      const edgeKey = `${prevMsgNodeId}->${msgNodeId}:proxima_etapa`;
      if (!existingEdgeSet.has(edgeKey)) {
        finalEdges.push({
          id: `edge-${prevMsgNodeId}-${msgNodeId}`,
          funnelId: funnel.id,
          sourceNodeId: prevMsgNodeId,
          targetNodeId: msgNodeId,
          condition: 'proxima_etapa',
          label: prevMsgNodeId === seqNodeId ? 'Início' : 'Próxima mensagem',
        });
        existingEdgeSet.add(edgeKey);
      }

      // 3. Follow-ups vinculados a esta mensagem
      let fuX = mPosX + 260;
      let fuY = mPosY;
      let prevFuNodeId = msgNodeId;

      (msg.followUps || []).forEach((fu, fuIdx) => {
        const fuNodeId = `node-fu-${fu.id}`;
        const existingFuNode = existingNodeMap.get(fu.id) || existingNodeMap.get(fuNodeId);

        const fPosX = existingFuNode ? existingFuNode.positionX : fuX;
        const fPosY = existingFuNode ? existingFuNode.positionY : fuY;

        const fuNode: FlowNode = {
          id: fuNodeId,
          funnelId: funnel.id,
          type: 'follow_up',
          referenceId: fu.id,
          title: fu.name,
          subtitle: `+${fu.delayValue} ${fu.delayUnit} (${fu.condition === 'nao_respondeu' ? 'Não respondeu' : fu.condition})`,
          positionX: fPosX,
          positionY: fPosY,
          data: {
            delayText: `+${fu.delayValue} ${fu.delayUnit}`,
            condition: fu.condition,
            contentPreview: fu.content.substring(0, 60),
            order: fu.order ?? fuIdx + 1,
            messageId: msg.id,
            sequenceId: seq.id,
          },
        };
        finalNodes.push(fuNode);

        // Conexão da mensagem ou follow-up anterior para este follow-up
        const fuEdgeKey = `${prevFuNodeId}->${fuNodeId}:${fu.condition}`;
        if (!existingEdgeSet.has(fuEdgeKey)) {
          finalEdges.push({
            id: `edge-${prevFuNodeId}-${fuNodeId}`,
            funnelId: funnel.id,
            sourceNodeId: prevFuNodeId,
            targetNodeId: fuNodeId,
            condition: fu.condition,
            label: `${fu.condition === 'nao_respondeu' ? 'Não respondeu' : 'Condição'} (+${fu.delayValue} ${fu.delayUnit})`,
          });
          existingEdgeSet.add(fuEdgeKey);
        }

        prevFuNodeId = fuNodeId;
        fuY += rowSpacingY;
      });

      prevMsgNodeId = msgNodeId;
      msgY += Math.max(rowSpacingY, (msg.followUps?.length || 1) * rowSpacingY * 0.85);
    });

    currentColX += colSpacingX + 80;
  });

  // Preserva quaisquer nós manuais (como transições, condições, nós adicionados livremente)
  currentNodes.forEach((cn) => {
    if (!finalNodes.some((fn) => fn.id === cn.id)) {
      finalNodes.push(cn);
    }
  });

  return {
    nodes: finalNodes,
    edges: finalEdges,
  };
}

/**
 * Interpolação de variáveis com dados reais da empresa e operador.
 * REGRA ABSOLUTA: Se a informação não existir, NÃO inventar dados fictícios.
 */
export function interpolateFunnelVariables(
  template: string,
  company?: Company | null,
  contact?: any,
  service?: any,
  senderName?: string
): string {
  if (!template) return '';

  const primaryContact = contact || company?.responsibles?.find((r) => r.isPrimary) || company?.responsibles?.[0];
  const contactName = primaryContact?.fullName || primaryContact?.name || '';
  const firstName = primaryContact?.firstName || (contactName ? contactName.split(' ')[0] : '');

  const replacements: Record<string, string> = {
    '{{company.name}}': company?.name || '[Empresa não informada]',
    '{{company.country}}': company?.country || '[País não informado]',
    '{{company.region}}': company?.city || company?.location || company?.country || '[Local não informado]',
    '{{company.city}}': company?.city || '[Cidade não informada]',
    '{{company.phone}}': primaryContact?.whatsapp || primaryContact?.phone || company?.whatsapp || company?.phone || '[Telefone não informado]',
    '{{contact.name}}': contactName || '[Responsável não informado]',
    '{{contact.first_name}}': firstName || '[Nome não informado]',
    '{{contact.role}}': primaryContact?.role || '[Cargo não informado]',
    '{{service.name}}': service?.name || '[Serviço não selecionado]',
    '{{service.price}}': service?.price ? `${service.price}` : '[Valor sob consulta]',
    '{{sender.name}}': senderName || 'Consultor Comercial',
  };

  let result = template;
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replaceAll(key, value);
  });

  return result;
}

/**
 * Duplicação de funil com novos IDs para sequências, mensagens, follow-ups e arestas.
 * NÃO duplica empresas nem histórico de execuções.
 */
export function duplicateFunnelWithCleanGraph(
  original: FunnelEntity,
  existingFunnels: FunnelEntity[]
): FunnelEntity {
  const newFunnelId = `funnel-${Date.now()}`;
  const nowIso = new Date().toISOString();

  // Mapeamento de IDs antigos para novos IDs
  const idMap = new Map<string, string>();
  idMap.set(original.id, newFunnelId);

  // Duplicar sequências, mensagens e follow-ups
  const duplicatedSequences: FunnelSequence[] = (original.sequences || []).map((seq, sIdx) => {
    const newSeqId = `seq-${Date.now()}-${sIdx}-${Math.random().toString(36).substring(2, 6)}`;
    idMap.set(seq.id, newSeqId);
    idMap.set(`node-seq-${seq.id}`, `node-seq-${newSeqId}`);

    const newMessages: SequenceMessage[] = (seq.messages || []).map((msg, mIdx) => {
      const newMsgId = `msg-${Date.now()}-${mIdx}-${Math.random().toString(36).substring(2, 6)}`;
      idMap.set(msg.id, newMsgId);
      idMap.set(`node-msg-${msg.id}`, `node-msg-${newMsgId}`);

      const newFollowUps: MessageFollowUp[] = (msg.followUps || []).map((fu, fIdx) => {
        const newFuId = `fu-${Date.now()}-${fIdx}-${Math.random().toString(36).substring(2, 6)}`;
        idMap.set(fu.id, newFuId);
        idMap.set(`node-fu-${fu.id}`, `node-fu-${newFuId}`);

        return {
          ...fu,
          id: newFuId,
          messageId: newMsgId,
          sequenceId: newSeqId,
          funnelId: newFunnelId,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
      });

      return {
        ...msg,
        id: newMsgId,
        sequenceId: newSeqId,
        funnelId: newFunnelId,
        followUps: newFollowUps,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    });

    return {
      ...seq,
      id: newSeqId,
      funnelId: newFunnelId,
      messages: newMessages,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  });

  // Remapeia destinos dos follow-ups
  duplicatedSequences.forEach((seq) => {
    seq.messages.forEach((msg) => {
      msg.followUps.forEach((fu) => {
        if (fu.targetId && idMap.has(fu.targetId)) {
          fu.targetId = idMap.get(fu.targetId);
        }
        if (fu.targetSequenceId && idMap.has(fu.targetSequenceId)) {
          fu.targetSequenceId = idMap.get(fu.targetSequenceId);
        }
      });
    });
  });

  // Duplica FlowNodes
  const duplicatedNodes: FlowNode[] = (original.flowNodes || []).map((node) => {
    const newNodeId = idMap.get(node.id) || `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newRefId = node.referenceId ? (idMap.get(node.referenceId) || node.referenceId) : undefined;
    return {
      ...node,
      id: newNodeId,
      funnelId: newFunnelId,
      referenceId: newRefId,
      data: {
        ...(node.data || {}),
        sequenceId: node.data?.sequenceId ? (idMap.get(node.data.sequenceId) || node.data.sequenceId) : undefined,
        messageId: node.data?.messageId ? (idMap.get(node.data.messageId) || node.data.messageId) : undefined,
      },
    };
  });

  // Duplica FlowEdges
  const duplicatedEdges: FlowEdge[] = (original.flowEdges || []).map((edge) => {
    const newSource = idMap.get(edge.sourceNodeId) || edge.sourceNodeId;
    const newTarget = idMap.get(edge.targetNodeId) || edge.targetNodeId;
    return {
      ...edge,
      id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      funnelId: newFunnelId,
      sourceNodeId: newSource,
      targetNodeId: newTarget,
    };
  });

  const duplicatedStages = (original.stages || []).map((stg) => ({
    ...stg,
    id: `stg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  }));

  const copyNumber = existingFunnels.filter((f) => f.name.startsWith(original.name)).length;

  return {
    ...original,
    id: newFunnelId,
    name: `${original.name} (Cópia${copyNumber > 0 ? ` ${copyNumber + 1}` : ''})`,
    code: `${original.code || 'FUN'}-CPY`,
    isDefault: false,
    sequences: duplicatedSequences,
    flowNodes: duplicatedNodes,
    flowEdges: duplicatedEdges,
    stages: duplicatedStages,
    flowViewport: original.flowViewport || { x: 0, y: 0, zoom: 1 },
    version: 1,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
