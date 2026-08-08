import { Settings as SettingsIcon } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

// A genuine placeholder, not a fake settings form — there's nothing
// configurable yet (no auth, no per-user preferences), so pretending
// otherwise with disabled-looking form fields would be more misleading
// than an honest "not built yet" state.
export default function SettingsPage() {
  return (
    <DashboardShell>
      <header className="border-b border-border px-4 py-4 sm:px-8 sm:py-6">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight text-text-primary sm:text-2xl">
          Settings
        </h1>
      </header>

      <div className="p-4 sm:p-8">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center sm:py-24">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-amber-dim text-accent-amber">
            <SettingsIcon size={20} strokeWidth={2} />
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[17px] font-medium text-text-primary">
            Nothing to configure yet
          </h2>
          <p className="mt-1.5 max-w-sm px-4 text-[13px] text-text-secondary">
            WorkflowStudio doesn&apos;t have user accounts or per-user preferences
            yet — every workflow is currently shared across everyone using this
            instance.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
