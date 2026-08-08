"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

type Clause = { field: string; operator: string; value: string };

type ConditionConfig = {
  logic?: string;
  clauses?: { field: string; operator: string; value: unknown }[];
  // Legacy single-clause shape, still accepted by the backend.
  field?: string;
  equals?: unknown;
};

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "contains", label: "contains" },
];

// Values arrive from JSON as string | number | boolean | null. The builder
// only ever shows text inputs (a single input type can't cleanly switch
// between a text field and a checkbox as the user types), so incoming
// values are stringified for editing and re-inferred back to a real type
// on save — see inferValue below. This matters concretely: the backend's
// greater_than/less_than comparison only accepts numeric JSON types, so
// typing "20" has to be saved as the number 20, not the string "20".
function toEditableClauses(config: ConditionConfig): Clause[] {
  if (config.clauses && config.clauses.length > 0) {
    return config.clauses.map((c) => ({
      field: c.field ?? "",
      operator: c.operator || "equals",
      value: c.value === undefined || c.value === null ? "" : String(c.value),
    }));
  }
  if (config.field) {
    return [{ field: config.field, operator: "equals", value: config.equals === undefined ? "" : String(config.equals) }];
  }
  return [{ field: "", operator: "equals", value: "" }];
}

function inferValue(raw: string): unknown {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw.trim() !== "" && !isNaN(Number(raw))) return Number(raw);
  return raw;
}

export function ConditionBuilder({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}) {
  const [logic, setLogic] = useState<"and" | "or">(((config as ConditionConfig).logic as "and" | "or") || "and");
  const [clauses, setClauses] = useState<Clause[]>(() => toEditableClauses(config as ConditionConfig));

  function commit(nextLogic: "and" | "or", nextClauses: Clause[]) {
    setLogic(nextLogic);
    setClauses(nextClauses);
    onChange({
      logic: nextLogic,
      clauses: nextClauses.map((c) => ({ field: c.field, operator: c.operator, value: inferValue(c.value) })),
    });
  }

  function updateClause(index: number, patch: Partial<Clause>) {
    const next = clauses.map((c, i) => (i === index ? { ...c, ...patch } : c));
    commit(logic, next);
  }

  function addClause() {
    commit(logic, [...clauses, { field: "", operator: "equals", value: "" }]);
  }

  function removeClause(index: number) {
    if (clauses.length <= 1) return; // a condition needs at least one clause
    commit(logic, clauses.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {clauses.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-tertiary">Match</span>
          <div className="flex overflow-hidden rounded-md border border-border">
            {(["and", "or"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => commit(opt, clauses)}
                className={
                  logic === opt
                    ? "bg-accent-amber px-2.5 py-1 font-mono text-[11px] font-medium text-base"
                    : "bg-surface-raised px-2.5 py-1 font-mono text-[11px] text-text-secondary hover:bg-surface-hover"
                }
              >
                {opt.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-text-tertiary">of these</span>
        </div>
      )}

      {clauses.map((clause, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-md border border-border bg-base p-2.5">
          <div className="flex items-center gap-1.5">
            <input
              value={clause.field}
              onChange={(e) => updateClause(i, { field: e.target.value })}
              placeholder="field"
              className="min-w-0 flex-1 rounded border border-border bg-surface px-2 py-1.5 font-mono text-[12px] text-text-primary outline-none focus:border-accent-amber"
            />
            {clauses.length > 1 && (
              <button
                onClick={() => removeClause(i)}
                className="shrink-0 rounded p-1 text-text-tertiary transition-colors hover:bg-accent-red-dim hover:text-accent-red"
                aria-label="Remove clause"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <select
            value={clause.operator}
            onChange={(e) => updateClause(i, { operator: e.target.value })}
            className="rounded border border-border bg-surface px-2 py-1.5 text-[12px] text-text-primary outline-none focus:border-accent-amber"
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <input
            value={clause.value}
            onChange={(e) => updateClause(i, { value: e.target.value })}
            placeholder="value"
            className="rounded border border-border bg-surface px-2 py-1.5 font-mono text-[12px] text-text-primary outline-none focus:border-accent-amber"
          />
        </div>
      ))}

      <button
        onClick={addClause}
        className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-[12px] text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-hover"
      >
        <Plus size={13} />
        Add condition
      </button>
    </div>
  );
}
