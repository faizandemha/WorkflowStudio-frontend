"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { Zap, Clock, Globe, GitFork, Hourglass, Shuffle, Bell, type LucideIcon } from "lucide-react";
import type { ExecutionStatus } from "@/lib/api";

export type WorkflowNodeType =
  | "trigger"
  | "schedule"
  | "http_request"
  | "condition"
  | "delay"
  | "transform"
  | "notification";

export type WorkflowNodeData = {
  label: string;
  nodeType: WorkflowNodeType;
  config: Record<string, unknown>;
  status?: ExecutionStatus;
};

// Two entry-point types (trigger, schedule) have no target handle — they
// start a workflow, nothing feeds into them. Every other type is a step in
// the middle or end of the graph.
const ENTRY_POINT_TYPES: WorkflowNodeType[] = ["trigger", "schedule"];

const NODE_META: Record<WorkflowNodeType, { icon: LucideIcon; accent: string; label: string }> = {
  trigger: { icon: Zap, accent: "text-accent-amber", label: "Trigger" },
  schedule: { icon: Clock, accent: "text-accent-amber", label: "Schedule" },
  http_request: { icon: Globe, accent: "text-accent-teal", label: "HTTP Request" },
  condition: { icon: GitFork, accent: "text-text-secondary", label: "Condition" },
  delay: { icon: Hourglass, accent: "text-text-secondary", label: "Delay" },
  transform: { icon: Shuffle, accent: "text-accent-teal", label: "Transform" },
  notification: { icon: Bell, accent: "text-accent-teal", label: "Notification" },
};

const STATUS_RING: Record<NonNullable<WorkflowNodeData["status"]>, string> = {
  pending: "",
  running: "ring-2 ring-accent-amber animate-ring-breathe",
  succeeded: "ring-2 ring-accent-teal transition-shadow duration-300",
  failed: "ring-2 ring-accent-red transition-shadow duration-300",
  skipped: "opacity-50 transition-opacity duration-300",
  cancelled: "opacity-50 transition-opacity duration-300",
};

// A single generic node component (rather than one per type) keeps the
// visual language consistent — every node is "icon + type label + title",
// differentiated by accent color and icon, not by inventing a new layout
// per type. New node types plug in by adding one NODE_META entry (and, if
// they branch like condition does, a case in the handle logic below).
export function WorkflowNode({ data, selected }: NodeProps & { data: WorkflowNodeData }) {
  const meta = NODE_META[data.nodeType];
  const Icon = meta.icon;
  const isCondition = data.nodeType === "condition";
  const isEntryPoint = ENTRY_POINT_TYPES.includes(data.nodeType);

  return (
    <div
      className={clsx(
        "min-w-[180px] rounded-lg border bg-surface-raised shadow-lg transition-all duration-150 animate-node-in",
        selected ? "border-accent-amber" : "border-border-strong",
        data.status && STATUS_RING[data.status]
      )}
    >
      {!isEntryPoint && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !border-2 !border-border-strong !bg-surface"
        />
      )}

      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Icon size={14} strokeWidth={2} className={meta.accent} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
          {meta.label}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[13px] font-medium leading-snug text-text-primary">{data.label}</p>
      </div>

      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "38%" }}
            className="!h-2.5 !w-2.5 !border-2 !border-accent-teal !bg-surface"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "68%" }}
            className="!h-2.5 !w-2.5 !border-2 !border-accent-red !bg-surface"
          />
          <div className="flex justify-between px-3 pb-1.5 font-mono text-[9px] text-text-tertiary">
            <span className="text-accent-teal">true</span>
            <span className="text-accent-red">false</span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !border-2 !border-border-strong !bg-surface"
        />
      )}
    </div>
  );
}

export const nodeTypes = { workflowNode: WorkflowNode };
