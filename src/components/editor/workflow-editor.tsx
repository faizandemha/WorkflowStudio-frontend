"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Check, CloudOff, Loader2, Blocks, History as HistoryIcon, Trash2 } from "lucide-react";
import { nodeTypes, type WorkflowNodeData, type WorkflowNodeType } from "./workflow-node";
import { NodePalette } from "./node-palette";
import { NodeInspector } from "./node-inspector";
import { ExecutionPanel } from "./execution-panel";
import { ExecutionHistoryPanel } from "./execution-history-panel";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { api, ApiError, type Workflow, type WorkflowDefinition, type ExecutionStep } from "@/lib/api";

type FlowNode = Node<WorkflowNodeData>;

function toFlowNodes(def: WorkflowDefinition): FlowNode[] {
  return def.nodes.map((n) => ({
    id: n.id,
    type: "workflowNode",
    position: n.position,
    data: {
      label: (n.config.label as string) ?? n.type,
      nodeType: n.type as WorkflowNodeData["nodeType"],
      config: n.config,
    },
  }));
}

function toFlowEdges(def: WorkflowDefinition): Edge[] {
  return def.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.source_handle,
    targetHandle: e.target_handle,
    animated: e.source_handle !== undefined,
  }));
}

function toDefinition(nodes: FlowNode[], edges: Edge[]): WorkflowDefinition {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      position: n.position,
      config: n.data.config,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      source_handle: e.sourceHandle ?? undefined,
      target_handle: e.targetHandle ?? undefined,
    })),
  };
}

let nodeIdCounter = 0;
function newNodeId() {
  nodeIdCounter += 1;
  return `node_${Date.now()}_${nodeIdCounter}`;
}

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function WorkflowEditor({ workflow }: { workflow: Workflow }) {
  return (
    <ReactFlowProvider>
      <EditorInner workflow={workflow} />
    </ReactFlowProvider>
  );
}

function EditorInner({ workflow }: { workflow: Workflow }) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(toFlowNodes(workflow.definition));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(toFlowEdges(workflow.definition));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [name, setName] = useState(workflow.name);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Panel visibility. On desktop (lg+) the palette and inspector are always
  // visible as fixed columns — these flags only control the drawer overlay
  // behavior on smaller screens, applied via responsive classes below
  // rather than by conditionally rendering different markup per
  // breakpoint. History is a drawer at every screen size, since it's an
  // occasional lookup, not something you want permanently eating canvas
  // space even on a wide monitor.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRefreshSignal, setHistoryRefreshSignal] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  async function handleDeleteWorkflow() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteWorkflow(workflow.id);
      // If there's an unsaved autosave in flight, it would otherwise land
      // after the DELETE and recreate confusion (a PATCH to an ID that no
      // longer exists) — clearing the pending timer here means "delete"
      // truly wins over any in-flight save.
      if (saveTimer.current) clearTimeout(saveTimer.current);
      router.push("/");
    } catch (err) {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteError(err instanceof ApiError ? err.message : "Couldn't delete this workflow.");
    }
  }

  const scheduleSave = useCallback(
    (nextNodes: FlowNode[], nextEdges: Edge[], nextName: string) => {
      setSaveState("dirty");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaveState("saving");
        try {
          await api.updateWorkflow(workflow.id, {
            name: nextName,
            definition: toDefinition(nextNodes, nextEdges),
          });
          setSaveState("saved");
        } catch (err) {
          setSaveState("error");
          console.error(err instanceof ApiError ? err.message : err);
        }
      }, 1000);
    },
    [workflow.id]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, id: `edge_${Date.now()}`, animated: !!connection.sourceHandle }, eds)
      );
    },
    [setEdges]
  );

  // Every new node starts with a working default config, not `{}` — an
  // empty condition or transform node would fail validation the instant
  // it ran, forcing a trip to the inspector just to make the node
  // functional at all. Defaults are deliberately conservative (a delay of
  // 0s, a condition that's trivially true) so dropping a node on the
  // canvas never breaks an otherwise-working workflow.
  const DEFAULT_LABELS: Record<WorkflowNodeType, string> = {
    trigger: "New trigger",
    schedule: "New schedule",
    http_request: "New request",
    condition: "New condition",
    delay: "New delay",
    transform: "New transform",
    notification: "New notification",
  };
  const DEFAULT_CONFIGS: Record<WorkflowNodeType, Record<string, unknown>> = {
    trigger: {},
    schedule: { interval_seconds: 3600 },
    http_request: { url: "", method: "GET" },
    condition: { logic: "and", clauses: [{ field: "", operator: "equals", value: "" }] },
    delay: { seconds: 5 },
    transform: { mappings: {} },
    notification: { webhook_url: "", message: "" },
  };

  function handleAddNode(type: WorkflowNodeType) {
    const id = newNodeId();
    const node: FlowNode = {
      id,
      type: "workflowNode",
      position: { x: 120 + Math.random() * 200, y: 120 + Math.random() * 200 },
      data: {
        label: DEFAULT_LABELS[type],
        nodeType: type,
        config: DEFAULT_CONFIGS[type],
      },
    };
    setNodes((nds) => [...nds, node]);
    setPaletteOpen(false); // on mobile, adding a node is a natural moment to get the drawer out of the way
  }

  function handleNodeDataChange(id: string, data: Partial<WorkflowNodeData>) {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)));
  }

  function handleDeleteNode(id: string) {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
  }

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    scheduleSave(nodes, edges, name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, name]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border bg-surface px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <ArrowLeft size={16} />
          </Link>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 bg-transparent font-[family-name:var(--font-display)] text-[14px] font-medium text-text-primary outline-none focus:border-b focus:border-accent-amber sm:text-[15px] sm:flex-initial"
          />
          <SaveIndicator state={saveState} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary lg:hidden"
            aria-label="Add node"
          >
            <Blocks size={15} />
          </button>
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            aria-label="Run history"
          >
            <HistoryIcon size={15} />
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:border-accent-red/30 hover:bg-accent-red-dim hover:text-accent-red"
            aria-label="Delete workflow"
          >
            <Trash2 size={15} />
          </button>
          <ExecutionPanel
            workflowId={workflow.id}
            onRunStart={() => {
              setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: undefined } })));
              setHistoryRefreshSignal((n) => n + 1);
            }}
            onSteps={(steps: ExecutionStep[]) => {
              const statusByNode = new Map(steps.map((s) => [s.node_id, s.status]));
              setNodes((nds) =>
                nds.map((n) =>
                  statusByNode.has(n.id)
                    ? { ...n, data: { ...n.data, status: statusByNode.get(n.id) } }
                    : n
                )
              );
            }}
          />
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Backdrop for mobile drawers */}
        {(paletteOpen || selectedNode) && (
          <div
            className="absolute inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => {
              setPaletteOpen(false);
              setSelectedNodeId(null);
            }}
          />
        )}

        <div
          className={clsx(
            "absolute inset-y-0 left-0 z-30 transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0",
            paletteOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <NodePalette onAdd={handleAddNode} />
        </div>

        <div className="min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            colorMode="dark"
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="var(--color-border)" gap={20} />
            <Controls className="!border !border-border !bg-surface [&>button]:!border-border [&>button]:!bg-surface [&>button]:!fill-text-secondary [&>button]:hover:!bg-surface-hover" />
            <MiniMap
              className="!hidden !border !border-border !bg-surface sm:!flex"
              maskColor="rgba(16,19,26,0.7)"
              nodeColor="var(--color-border-strong)"
            />
          </ReactFlow>
        </div>

        <div
          className={clsx(
            "absolute inset-y-0 right-0 z-30 transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0",
            selectedNode ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          )}
        >
          {selectedNode ? (
            <NodeInspector
              node={selectedNode}
              onChange={handleNodeDataChange}
              onDelete={handleDeleteNode}
              onClose={() => setSelectedNodeId(null)}
            />
          ) : (
            // On lg+ the column is always in the layout (so the canvas
            // doesn't jump width when a node gets selected/deselected);
            // on mobile it's translated fully offscreen and 0-width isn't
            // needed since position is absolute either way.
            <div className="hidden w-80 lg:block" />
          )}
        </div>
      </div>

      <ExecutionHistoryPanel
        workflowId={workflow.id}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        refreshSignal={historyRefreshSignal}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete this workflow?"
        message={`"${name}" and its entire run history will be permanently deleted. This can't be undone.`}
        pending={deleting}
        onConfirm={handleDeleteWorkflow}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
      {deleteError && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-accent-red/30 bg-accent-red-dim px-4 py-2 text-[13px] text-accent-red shadow-lg">
          {deleteError}
        </div>
      )}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const map: Record<Exclude<SaveState, "idle">, { icon: React.ReactNode; text: string; color: string }> = {
    dirty: { icon: <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary" />, text: "Unsaved", color: "text-text-tertiary" },
    saving: { icon: <Loader2 size={12} className="animate-spin" />, text: "Saving…", color: "text-text-tertiary" },
    saved: { icon: <Check size={12} />, text: "Saved", color: "text-accent-teal" },
    error: { icon: <CloudOff size={12} />, text: "Save failed", color: "text-accent-red" },
  };
  const { icon, text, color } = map[state];
  return (
    <span
      key={state}
      className={`hidden animate-[fade-in_0.25s_ease-out] items-center gap-1.5 font-mono text-[11px] sm:flex ${color}`}
    >
      {icon}
      {text}
    </span>
  );
}
