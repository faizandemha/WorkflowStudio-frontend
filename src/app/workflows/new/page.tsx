import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";

// A brand-new workflow starts with one trigger node already on the
// canvas, not a blank grid. An empty canvas with no entry point isn't a
// meaningfully different starting state than "nothing" — you'd have to
// know to add a trigger first anyway, so we just do it.
export default async function NewWorkflowPage() {
  try {
    const workflow = await api.createWorkflow({
      name: "Untitled workflow",
      definition: {
        nodes: [{ id: "trigger_1", type: "trigger", position: { x: 80, y: 160 }, config: {} }],
        edges: [],
      },
    });
    redirect(`/workflows/${workflow.id}`);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err; // let redirect() propagate
    const message =
      err instanceof ApiError
        ? err.message
        : "Can't reach the WorkflowStudio API. Make sure the backend is running.";
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-base text-center">
        <p className="text-[14px] text-accent-red">{message}</p>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-[13px] text-text-secondary hover:bg-surface-hover"
        >
          <ArrowLeft size={14} />
          Back to workflows
        </Link>
      </div>
    );
  }
}
