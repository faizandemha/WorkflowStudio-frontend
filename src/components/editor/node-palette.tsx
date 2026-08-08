"use client";

import { Zap, Clock, Globe, GitFork, Hourglass, Shuffle, Bell, type LucideIcon } from "lucide-react";
import type { WorkflowNodeType } from "./workflow-node";

type PaletteEntry = {
  type: WorkflowNodeType;
  label: string;
  icon: LucideIcon;
  accent: string;
  description: string;
};

// Grouped the way Samsung Routines (and most consumer automation tools)
// present it: "If" (what starts or gates the routine) vs "Then" (what it
// actually does) — even though under the hood every entry is just a node
// type in the same flat registry. The grouping is a UX choice for the
// palette, not a backend concept.
const TRIGGERS: PaletteEntry[] = [
  { type: "trigger", label: "Trigger", icon: Zap, accent: "text-accent-amber", description: "Starts on a manual run or event" },
  { type: "schedule", label: "Schedule", icon: Clock, accent: "text-accent-amber", description: "Starts on a time-based schedule" },
];

const LOGIC: PaletteEntry[] = [
  { type: "condition", label: "Condition", icon: GitFork, accent: "text-text-secondary", description: "Branches true / false" },
  { type: "delay", label: "Delay", icon: Hourglass, accent: "text-text-secondary", description: "Waits before continuing" },
];

const ACTIONS: PaletteEntry[] = [
  { type: "http_request", label: "HTTP Request", icon: Globe, accent: "text-accent-teal", description: "Calls an external URL" },
  { type: "transform", label: "Transform", icon: Shuffle, accent: "text-accent-teal", description: "Reshapes data for the next step" },
  { type: "notification", label: "Notification", icon: Bell, accent: "text-accent-teal", description: "Sends a message to a webhook" },
];

function PaletteSection({
  title,
  entries,
  onAdd,
}: {
  title: string;
  entries: PaletteEntry[];
  onAdd: (type: WorkflowNodeType) => void;
}) {
  return (
    <div>
      <p className="px-3 pb-1.5 pt-3 font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
        {title}
      </p>
      <div className="flex flex-col gap-1.5 px-3 pb-2">
        {entries.map(({ type, label, icon: Icon, accent, description }) => (
          <button
            key={type}
            onClick={() => onAdd(type)}
            className="group flex items-center gap-3 rounded-md border border-border bg-surface-raised px-3 py-2.5 text-left transition-all duration-150 hover:border-border-strong hover:bg-surface-hover hover:translate-x-0.5 active:scale-[0.98]"
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-base ${accent}`}>
              <Icon size={14} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-text-primary">{label}</p>
              <p className="truncate text-[11px] text-text-tertiary">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function NodePalette({ onAdd }: { onAdd: (type: WorkflowNodeType) => void }) {
  return (
    <div className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface">
      <div className="border-b border-border px-4 py-4">
        <h2 className="font-[family-name:var(--font-display)] text-[13px] font-medium text-text-primary">Nodes</h2>
        <p className="mt-0.5 text-[11px] text-text-tertiary">Click to add to canvas</p>
      </div>
      <PaletteSection title="If — Triggers" entries={TRIGGERS} onAdd={onAdd} />
      <PaletteSection title="Logic" entries={LOGIC} onAdd={onAdd} />
      <PaletteSection title="Then — Actions" entries={ACTIONS} onAdd={onAdd} />
    </div>
  );
}
