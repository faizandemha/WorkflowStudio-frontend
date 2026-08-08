import Link from "next/link";
import { Plus, Zap, WifiOff, Webhook, GitBranch, Send } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { WorkflowCard } from "@/components/workflow-card";
import { api, ApiError, type Workflow } from "@/lib/api";

export default async function DashboardPage() {
  let workflows: Workflow[];
  let connectionError: string | null = null;

  try {
    const res = await api.listWorkflows();
    workflows = res.workflows;
  } catch (err) {
    workflows = [];
    connectionError =
      err instanceof ApiError
        ? err.message
        : "Can't reach the WorkflowStudio API. Make sure the backend is running on localhost:8080.";
  }

  return (
    <DashboardShell>
      <header className="flex flex-col gap-3 border-b border-border bg-surface px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-text-primary sm:text-3xl">
            Workflows
          </h1>
          <p className="mt-1.5 text-[15px] text-text-secondary">
            {workflows.length > 0
              ? `${workflows.length} workflow${workflows.length === 1 ? "" : "s"}`
              : "Automations built from connected nodes"}
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="btn-3d btn-3d-amber flex items-center justify-center gap-2 rounded-md bg-accent-amber px-5 py-2.5 text-[15px] font-medium text-base"
        >
          <Plus size={18} strokeWidth={2.5} />
          New workflow
        </Link>
      </header>

      <div className="p-4 sm:p-8">
        {connectionError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-accent-red/30 bg-accent-red-dim px-4 py-3 text-[13px] text-accent-red">
            <WifiOff size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Can&apos;t reach the API</p>
              <p className="mt-0.5 text-accent-red/80">{connectionError}</p>
            </div>
          </div>
        )}

        {!connectionError && workflows.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-4 py-16 text-center shadow-sm sm:py-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-amber-dim text-accent-amber ring-8 ring-accent-amber-dim/40">
              <Zap size={22} strokeWidth={2} />
            </div>
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-[18px] font-medium text-text-primary">
              No workflows yet
            </h2>
            <p className="mt-1.5 max-w-xs px-4 text-[13px] leading-relaxed text-text-secondary">
              Build your first automation by connecting triggers, requests, and conditions on the canvas.
            </p>
            <Link
              href="/workflows/new"
              className="btn-3d btn-3d-amber mt-6 flex items-center gap-2 rounded-md bg-accent-amber px-4 py-2 text-[13px] font-medium text-base"
            >
              <Plus size={16} strokeWidth={2.5} />
              Create a workflow
            </Link>
          </div>
        )}

        {!connectionError && workflows.length === 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: Webhook,
                title: "Trigger",
                copy: "Start a run from a webhook, schedule, or manual click.",
              },
              {
                icon: GitBranch,
                title: "Condition",
                copy: "Branch the run based on data from a previous step.",
              },
              {
                icon: Send,
                title: "Action",
                copy: "Call an API, transform data, or notify a channel.",
              },
            ].map(({ icon: Icon, title, copy }) => (
              <div
                key={title}
                className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-raised text-text-secondary">
                  <Icon size={16} strokeWidth={1.75} />
                </div>
                <h3 className="mt-3 text-[13px] font-medium text-text-primary">{title}</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-text-secondary">{copy}</p>
              </div>
            ))}
          </div>
        )}

        {workflows.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {workflows.map((wf, i) => (
                <WorkflowCard key={wf.id} workflow={wf} index={i} />
              ))}
            </div>
        )}
      </div>
    </DashboardShell>
  );
}
