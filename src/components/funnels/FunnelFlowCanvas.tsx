import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  FunnelEntity, 
  FlowNode, 
  FlowEdge, 
  FlowNodeType, 
  FOLLOWUP_CONDITIONS,
  FunnelSequence,
  FunnelChannel 
} from '../../core/types/funnel';
import { detectGraphCycles, validateFunnelFlow } from '../../core/funnel/flowGraphEngine';
import { EdgeModal } from './modals/EdgeModal';
import { Button } from '../ui/Button';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Plus, 
  ArrowRight, 
  GitFork, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Move,
  Link,
  ChevronRight,
  ExternalLink,
  Trash2,
  Check
} from 'lucide-react';

interface FunnelFlowCanvasProps {
  funnel: FunnelEntity;
  availableFunnels?: FunnelEntity[];
  onUpdateNodes: (nodes: FlowNode[]) => void;
  onUpdateEdges: (edges: FlowEdge[]) => void;
  onUpdateViewport?: (viewport: { x: number; y: number; zoom: number }) => void;
  onSelectNode?: (node: FlowNode) => void;
  onOpenCreateSequence?: () => void;
}

export const FunnelFlowCanvas: React.FC<FunnelFlowCanvasProps> = ({
  funnel,
  availableFunnels = [],
  onUpdateNodes,
  onUpdateEdges,
  onUpdateViewport,
  onSelectNode,
  onOpenCreateSequence,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport State (Zoom & Pan)
  const [viewport, setViewport] = useState({
    x: funnel.flowViewport?.x ?? 40,
    y: funnel.flowViewport?.y ?? 40,
    zoom: funnel.flowViewport?.zoom ?? 1,
  });

  // Dragging Canvas (Pan)
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging Node
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Selected Elements
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);

  // Connection Creation State
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [isAddNodeMenuOpen, setIsAddNodeMenuOpen] = useState(false);

  const nodes = funnel.flowNodes || [];
  const edges = funnel.flowEdges || [];

  // Validação & Detecção de Ciclos
  const validation = useMemo(() => {
    return validateFunnelFlow(funnel, availableFunnels);
  }, [funnel, availableFunnels]);

  const detectedCycles = useMemo(() => {
    return detectGraphCycles(nodes, edges);
  }, [nodes, edges]);

  // Persist Viewport changes with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (onUpdateViewport) {
        onUpdateViewport(viewport);
      }
    }, 600);
    return () => clearTimeout(handler);
  }, [viewport, onUpdateViewport]);

  // Handle Pan Mouse Events
  const handleMouseDownBackground = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if (connectingSourceId) {
      setConnectingSourceId(null);
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewport((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    } else if (draggingNodeId) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const rawX = (e.clientX - containerRect.left - viewport.x) / viewport.zoom - dragOffset.x;
      const rawY = (e.clientY - containerRect.top - viewport.y) / viewport.zoom - dragOffset.y;

      // Snap to grid of 10px
      const snappedX = Math.round(rawX / 10) * 10;
      const snappedY = Math.round(rawY / 10) * 10;

      const updated = nodes.map((n) =>
        n.id === draggingNodeId ? { ...n, positionX: snappedX, positionY: snappedY } : n
      );
      onUpdateNodes(updated);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node Drag Handler
  const handleNodeMouseDown = (e: React.MouseEvent, node: FlowNode) => {
    e.stopPropagation();
    if (connectingSourceId) {
      // Cria conexão do nó selecionado para este nó se for diferente
      if (connectingSourceId !== node.id) {
        handleCreateEdge(connectingSourceId, node.id);
      }
      setConnectingSourceId(null);
      return;
    }

    setSelectedNodeId(node.id);
    if (onSelectNode) onSelectNode(node);

    setDraggingNodeId(node.id);
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseCanvasX = (e.clientX - containerRect.left - viewport.x) / viewport.zoom;
    const mouseCanvasY = (e.clientY - containerRect.top - viewport.y) / viewport.zoom;

    setDragOffset({
      x: mouseCanvasX - node.positionX,
      y: mouseCanvasY - node.positionY,
    });
  };

  // Touch Support for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: t.clientX - viewport.x, y: t.clientY - viewport.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      const t = e.touches[0];
      setViewport((prev) => ({
        ...prev,
        x: t.clientX - panStart.x,
        y: t.clientY - panStart.y,
      }));
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Zoom helpers
  const handleZoom = (delta: number) => {
    setViewport((prev) => {
      const newZoom = Math.min(Math.max(0.35, prev.zoom + delta), 2.2);
      return { ...prev, zoom: Number(newZoom.toFixed(2)) };
    });
  };

  const handleResetViewport = () => {
    setViewport({ x: 40, y: 40, zoom: 1 });
  };

  const handleCenterFlow = () => {
    if (nodes.length === 0) {
      setViewport({ x: 40, y: 40, zoom: 1 });
      return;
    }
    const minX = Math.min(...nodes.map((n) => n.positionX));
    const minY = Math.min(...nodes.map((n) => n.positionY));
    setViewport({ x: Math.max(30, 80 - minX), y: Math.max(30, 80 - minY), zoom: 1 });
  };

  // Create Connection between two nodes
  const handleCreateEdge = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    // Checa se já existe aresta
    const exists = edges.some((e) => e.sourceNodeId === sourceId && e.targetNodeId === targetId);
    if (exists) return;

    const sourceNode = nodes.find((n) => n.id === sourceId);
    const targetNode = nodes.find((n) => n.id === targetId);

    const defaultCondition = sourceNode?.type === 'follow_up' ? (sourceNode.data?.condition || 'nao_respondeu') : 'proxima_etapa';
    const defaultLabel = defaultCondition === 'nao_respondeu' ? 'Não respondeu' : defaultCondition === 'respondeu' ? 'Respondeu' : 'Avançar';

    const newEdge: FlowEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      funnelId: funnel.id,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      condition: defaultCondition,
      label: defaultLabel,
    };

    onUpdateEdges([...edges, newEdge]);
  };

  // Add Free Node to Canvas
  const handleAddFreeNode = (type: FlowNodeType) => {
    const nextX = Math.max(80, (viewport.x * -1) / viewport.zoom + 120);
    const nextY = Math.max(80, (viewport.y * -1) / viewport.zoom + 120);

    let title = 'Novo Nó';
    let data: any = {};

    switch (type) {
      case 'sequence':
        title = `Sequência ${String((funnel.sequences?.length || 0) + 1).padStart(2, '0')}`;
        data = { color: 'purple' };
        break;
      case 'message':
        title = 'Nova Mensagem';
        data = { channel: 'whatsapp', contentPreview: 'Texto da abordagem...' };
        break;
      case 'follow_up':
        title = 'Follow-up de Reforço';
        data = { delayText: '+2 dias', condition: 'nao_respondeu', contentPreview: 'Checagem de leitura...' };
        break;
      case 'transition':
        title = '↗ TRANSIÇÃO: Iniciar outro funil';
        data = { targetFunnelId: availableFunnels.find((f) => f.id !== funnel.id)?.id || '' };
        break;
      case 'condition':
        title = 'Bifurcação de Decisão';
        data = { condition: 'interesse' };
        break;
      case 'end':
        title = 'Encerramento de Jornada';
        break;
    }

    const newNode: FlowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      funnelId: funnel.id,
      type,
      title,
      positionX: Math.round(nextX / 10) * 10,
      positionY: Math.round(nextY / 10) * 10,
      data,
    };

    onUpdateNodes([...nodes, newNode]);
    setIsAddNodeMenuOpen(false);
  };

  // Delete Node from Canvas
  const handleDeleteNode = (nodeId: string) => {
    const filteredNodes = nodes.filter((n) => n.id !== nodeId);
    const filteredEdges = edges.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId);
    onUpdateNodes(filteredNodes);
    onUpdateEdges(filteredEdges);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Edge editing
  const handleSelectEdge = (e: React.MouseEvent, edge: FlowEdge) => {
    e.stopPropagation();
    setSelectedEdgeId(edge.id);
    setIsEdgeModalOpen(true);
  };

  const handleSaveEdge = (edgeId: string, updates: { condition: string; label: string; targetNodeId: string }) => {
    const updated = edges.map((e) => (e.id === edgeId ? { ...e, ...updates } : e));
    onUpdateEdges(updated);
  };

  const handleDeleteEdge = (edgeId: string) => {
    const filtered = edges.filter((e) => e.id !== edgeId);
    onUpdateEdges(filtered);
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
  };

  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) || null;

  // Render Bezier Curve Edges
  const renderEdgeSvg = (edge: FlowEdge) => {
    const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
    const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
    if (!sourceNode || !targetNode) return null;

    // Node dimensions approximation
    const sourceWidth = 240;
    const sourceHeight = 90;
    const targetWidth = 240;
    const targetHeight = 90;

    const startX = sourceNode.positionX + sourceWidth / 2;
    const startY = sourceNode.positionY + sourceHeight;
    const endX = targetNode.positionX + targetWidth / 2;
    const endY = targetNode.positionY;

    // Control points for smooth organic curve
    const deltaY = endY - startY;
    const cpY1 = startY + Math.max(40, deltaY * 0.45);
    const cpY2 = endY - Math.max(40, deltaY * 0.45);

    const pathD = `M ${startX} ${startY} C ${startX} ${cpY1}, ${endX} ${cpY2}, ${endX} ${endY}`;

    // Midpoint for label
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const isSelected = selectedEdgeId === edge.id;
    const isNegative = edge.condition === 'nao_respondeu' || edge.condition === 'sem_interesse' || edge.condition === 'prazo_expirado';
    const isPositive = edge.condition === 'respondeu' || edge.condition === 'interesse';

    const strokeColor = isSelected 
      ? '#635BFF' 
      : isPositive 
      ? '#10B981' 
      : isNegative 
      ? '#F59E0B' 
      : '#94A3B8';

    return (
      <g key={edge.id} className="cursor-pointer group" onClick={(e) => handleSelectEdge(e, edge)}>
        {/* Invisible wider stroke for easy click target */}
        <path d={pathD} fill="none" stroke="transparent" strokeWidth={24} />
        {/* Visual Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 2}
          strokeDasharray={edge.condition === 'nao_respondeu' ? '6 4' : undefined}
          className="transition-all duration-150 group-hover:stroke-[#635BFF]"
          markerEnd={`url(#arrow-${edge.condition})`}
        />

        {/* Condition / Label Tag */}
        <foreignObject
          x={midX - 70}
          y={midY - 14}
          width={140}
          height={28}
          className="overflow-visible pointer-events-auto"
        >
          <div className="flex items-center justify-center">
            <span
              className={`px-2 py-0.5 text-[10px] font-medium rounded-full shadow-xs border transition-all ${
                isSelected
                  ? 'bg-[#635BFF] text-white border-[#635BFF]'
                  : isPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : isNegative
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 group-hover:border-[#635BFF]'
              }`}
            >
              {edge.label || edge.condition}
            </span>
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className="relative w-full h-[680px] bg-slate-50 dark:bg-[#0B0D11] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-1 gap-1">
          <button
            onClick={() => handleZoom(0.15)}
            title="Aumentar zoom"
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.15)}
            title="Diminuir zoom"
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono px-2 text-zinc-500">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            onClick={handleResetViewport}
            title="Redefinir visualização"
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCenterFlow}
            title="Centralizar fluxo"
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Add Node Menu */}
        <div className="relative">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddNodeMenuOpen(!isAddNodeMenuOpen)}
            icon={<Plus className="w-4 h-4" />}
          >
            Adicionar Nó
          </Button>

          {isAddNodeMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-1.5 z-40 space-y-1 text-xs">
              <button
                onClick={() => handleAddFreeNode('sequence')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-800 dark:text-zinc-200"
              >
                <GitFork className="w-3.5 h-3.5 text-[#635BFF]" />
                <span>Nó de Sequência</span>
              </button>
              <button
                onClick={() => handleAddFreeNode('message')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-800 dark:text-zinc-200"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <span>Nó de Mensagem</span>
              </button>
              <button
                onClick={() => handleAddFreeNode('follow_up')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-800 dark:text-zinc-200"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Nó de Follow-up</span>
              </button>
              <button
                onClick={() => handleAddFreeNode('transition')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-800 dark:text-zinc-200"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                <span>Transição: Outro Funil</span>
              </button>
              <button
                onClick={() => handleAddFreeNode('end')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-800 dark:text-zinc-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Encerramento</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Right Validation Summary */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        {connectingSourceId ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#635BFF] text-white rounded-xl shadow-md text-xs font-medium animate-pulse">
            <Link className="w-3.5 h-3.5" />
            <span>Clique no nó de destino para conectar</span>
            <button
              onClick={() => setConnectingSourceId(null)}
              className="ml-2 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        ) : validation.isValid ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fluxo Válido ({nodes.length} nós · {edges.length} conexões)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-medium shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{validation.errorsCount} problema(s) detectado(s)</span>
          </div>
        )}
      </div>

      {/* Cycle warning toast bar */}
      {detectedCycles.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-700 dark:text-amber-300 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              <strong>Loop detectado:</strong> Verifique se os nós conectados em ciclo possuem saídas com encerramento ou transição de funil.
            </span>
          </div>
        </div>
      )}

      {/* MAIN INTERACTIVE CANVAS AREA */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownBackground}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden`}
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(148, 163, 184, 0.25) 1px, transparent 1px)',
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      >
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          }}
        >
          {/* SVG Connection Layer */}
          <svg className="absolute top-0 left-0 w-[6000px] h-[6000px] pointer-events-none overflow-visible">
            <defs>
              <marker
                id="arrow-proxima_etapa"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#94A3B8" />
              </marker>
              <marker
                id="arrow-respondeu"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#10B981" />
              </marker>
              <marker
                id="arrow-nao_respondeu"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#F59E0B" />
              </marker>
            </defs>

            {edges.map(renderEdgeSvg)}
          </svg>

          {/* Node Cards Layer */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isConnecting = connectingSourceId === node.id;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                style={{
                  transform: `translate(${node.positionX}px, ${node.positionY}px)`,
                  width: '240px',
                }}
                className={`absolute rounded-xl bg-white dark:bg-zinc-900 border shadow-md transition-shadow cursor-move select-none p-3.5 group ${
                  isSelected
                    ? 'ring-2 ring-[#635BFF] border-[#635BFF] shadow-lg'
                    : isConnecting
                    ? 'ring-2 ring-emerald-500 border-emerald-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                {/* Node Header */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {node.type === 'sequence' && (
                      <GitFork className="w-4 h-4 text-[#635BFF]" />
                    )}
                    {node.type === 'message' && (
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                    )}
                    {node.type === 'follow_up' && (
                      <Clock className="w-4 h-4 text-amber-500" />
                    )}
                    {node.type === 'transition' && (
                      <ExternalLink className="w-4 h-4 text-emerald-500" />
                    )}
                    {node.type === 'end' && (
                      <CheckCircle2 className="w-4 h-4 text-rose-500" />
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      {node.type === 'follow_up' ? 'Follow-up' : node.type}
                    </span>
                  </div>

                  {/* Connect Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConnectingSourceId(node.id);
                    }}
                    title="Conectar a outro nó"
                    className="p-1 rounded text-zinc-400 hover:text-[#635BFF] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Link className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Node Title & Details */}
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 mb-1">
                  {node.title}
                </h4>

                {node.subtitle && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-1">
                    {node.subtitle}
                  </p>
                )}

                {node.data?.contentPreview && (
                  <div className="mt-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-800/60 rounded text-[10px] text-zinc-600 dark:text-zinc-300 font-mono line-clamp-2">
                    "{node.data.contentPreview}"
                  </div>
                )}

                {node.type === 'transition' && (
                  <div className="mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Continua a jornada sem duplicar lead
                  </div>
                )}

                {/* Quick Actions on Hover */}
                <div className="mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="font-mono">X:{node.positionX} Y:{node.positionY}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    title="Remover nó"
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edge Edit Modal */}
      {selectedEdge && (
        <EdgeModal
          isOpen={isEdgeModalOpen}
          onClose={() => setIsEdgeModalOpen(false)}
          edge={selectedEdge}
          nodes={nodes}
          onSave={handleSaveEdge}
          onDelete={handleDeleteEdge}
        />
      )}
    </div>
  );
};
