"use client";

import { useState } from "react";
import { Trash2, X, Code2 } from "lucide-react";
import type { Node } from "@xyflow/react";
import type { WorkflowNodeData } from "./workflow-node";
import { ConditionBuilder } from "./condition-builder";

type Props = {
  node: Node<WorkflowNodeData> | null;
  onChange: (id: string, data: Partial<WorkflowNodeData>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

// The wrapper doesn't hold any state itself — it just decides whether to
// render the inner form. Keying the inner form by `node.id` is what makes
// switching the selected node reset the form's local state automatically:
// React treats a changed key as a new component instance, no effect
// needed to manually sync state from a changing prop.
export function NodeInspector({ node, onChange, onDelete, onClose }: Props) {
  if (!node) return null;
  return (
    <NodeInspectorForm
      key={node.id}
      node={node}
      onChange={onChange}
      onDelete={onDelete}
      onClose={onClose}
    />
  );
}

function NodeInspectorForm({
  node,
  onChange,
  onDelete,
  onClose,
}: Props & { node: Node<WorkflowNodeData> }) {
  const [label, setLabel] = useState(node.data.label);
  const [configText, setConfigText] = useState(JSON.stringify(node.data.config, null, 2));
  const [configError, setConfigError] = useState<string | null>(null);
  // Condition nodes default to the structured builder; every other type
  // (and anyone who wants to hand-edit a condition's JSON directly) uses
  // the raw textarea. Kept as a toggle rather than two permanently
  // separate UIs so power users aren't blocked by the builder's simpler
  // value-typing heuristics for anything unusual.
  const [rawMode, setRawMode] = useState(node.data.nodeType !== "condition");

  function commitConfig(text: string) {
    setConfigText(text);
    try {
      const parsed = JSON.parse(text);
      setConfigError(null);
      onChange(node.id, { config: parsed });
    } catch {
      setConfigError("Invalid JSON — changes won't be saved until this is fixed.");
    }
  }

  function commitStructuredConfig(config: Record<string, unknown>) {
    setConfigText(JSON.stringify(config, null, 2));
    onChange(node.id, { config });
  }

  const isCondition = node.data.nodeType === "condition";

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <h2 className="font-[family-name:var(--font-display)] text-[13px] font-medium text-text-primary">
          Node settings
        </h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
          aria-label="Close inspector"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
            Label
          </label>
          <input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              onChange(node.id, { label: e.target.value });
            }}
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent-amber"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              {isCondition && !rawMode ? "Conditions" : "Config (JSON)"}
            </label>
            {isCondition && (
              <button
                onClick={() => setRawMode(!rawMode)}
                className="flex items-center gap-1 text-[10.5px] text-text-tertiary transition-colors hover:text-text-secondary"
              >
                <Code2 size={11} />
                {rawMode ? "Use builder" : "Edit JSON"}
              </button>
            )}
          </div>

          {isCondition && !rawMode ? (
            <ConditionBuilder config={node.data.config} onChange={commitStructuredConfig} />
          ) : (
            <>
              <textarea
                value={configText}
                onChange={(e) => commitConfig(e.target.value)}
                rows={10}
                spellCheck={false}
                className="w-full resize-none rounded-md border border-border bg-base px-3 py-2 font-mono text-[12px] leading-relaxed text-text-primary outline-none focus:border-accent-amber"
              />
              {configError && <p className="mt-1.5 text-[11px] text-accent-red">{configError}</p>}
              <ConfigHint nodeType={node.data.nodeType} />
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border p-4">
        <button
          onClick={() => onDelete(node.id)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-accent-red/30 bg-accent-red-dim px-3 py-2 text-[13px] text-accent-red transition-opacity hover:opacity-80"
        >
          <Trash2 size={14} />
          Delete node
        </button>
      </div>
    </div>
  );
}

function ConfigHint({ nodeType }: { nodeType: WorkflowNodeData["nodeType"] }) {
  const hints: Record<WorkflowNodeData["nodeType"], string> = {
    trigger: 'e.g. { "event": "github.pr.opened" }',
    schedule: 'e.g. { "daily_at": "09:00", "timezone": "America/New_York" } or { "interval_seconds": 1800 }',
    http_request: 'e.g. { "url": "https://...", "method": "POST" }',
    condition: 'e.g. { "logic": "and", "clauses": [{ "field": "battery", "operator": "less_than", "value": 20 }] }',
    delay: 'e.g. { "seconds": 300 }',
    transform: 'e.g. { "mappings": { "email": "$.body.user.email" } }',
    notification: 'e.g. { "webhook_url": "https://...", "message": "Battery low" }',
  };
  return <p className="mt-1.5 font-mono text-[10.5px] text-text-tertiary">{hints[nodeType]}</p>;
}
