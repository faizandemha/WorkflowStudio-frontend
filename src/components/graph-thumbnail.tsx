"use client";

import type { WorkflowDefinition } from "@/lib/api";

// GraphThumbnail is the one deliberate signature element of this design:
// instead of a generic icon or illustration on each workflow card, we
// render the workflow's *actual* nodes and edges, scaled down into a small
// abstract diagram. Every card looks different because every workflow
// really is different — the decoration is the product's own data, not
// invented ornament.
export function GraphThumbnail({
  definition,
  className,
}: {
  definition: WorkflowDefinition;
  className?: string;
}) {
  const { nodes, edges } = definition;

  if (nodes.length === 0) {
    return (
      <svg viewBox="0 0 200 80" className={className} aria-hidden="true">
        <circle cx="100" cy="40" r="3" fill="var(--color-text-tertiary)" opacity="0.5" />
      </svg>
    );
  }

  // Normalize node positions into the 0..200 x 0..80 viewBox regardless of
  // the real canvas coordinates, so every thumbnail fills its space
  // consistently no matter how the actual editor positions were laid out.
  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const pad = 16;
  const scaleX = (x: number) => pad + ((x - minX) / spanX) * (200 - pad * 2);
  const scaleY = (y: number) => pad + ((y - minY) / spanY) * (80 - pad * 2);

  const points = new Map(nodes.map((n) => [n.id, { x: scaleX(n.position.x), y: scaleY(n.position.y) }]));

  return (
    <svg viewBox="0 0 200 80" className={className} aria-hidden="true">
      {edges.map((e) => {
        const from = points.get(e.source);
        const to = points.get(e.target);
        if (!from || !to) return null;
        return (
          <line
            key={e.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="var(--color-border-strong)"
            strokeWidth="1.5"
          />
        );
      })}
      {nodes.map((n) => {
        const p = points.get(n.id)!;
        const isTrigger = n.type === "trigger";
        return (
          <circle
            key={n.id}
            cx={p.x}
            cy={p.y}
            r={isTrigger ? 4 : 3}
            fill={isTrigger ? "var(--color-accent-amber)" : "var(--color-text-secondary)"}
          />
        );
      })}
    </svg>
  );
}
