"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// A native confirm() would work, but can't be styled and reads as a
// jarring browser-chrome interruption against everything else here. This
// is the same weight of interaction, just consistent with the rest of the
// product.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={pending ? undefined : onCancel} />
      <div className="relative w-full max-w-sm rounded-lg border border-border bg-surface-raised p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-red-dim text-accent-red">
            <AlertTriangle size={17} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="font-[family-name:var(--font-display)] text-[14px] font-medium text-text-primary">
              {title}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{message}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={pending}
            className="rounded-md border border-border px-3.5 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="flex items-center gap-2 rounded-md bg-accent-red px-3.5 py-2 text-[13px] font-medium text-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
