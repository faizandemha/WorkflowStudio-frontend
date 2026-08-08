import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WorkflowEditor } from "@/components/editor/workflow-editor";
import { api, ApiError, type Workflow } from "@/lib/api";

async function loadWorkflow(id: string): Promise<{ workflow: Workflow } | { error: string }> {
  try {
    const workflow = await api.getWorkflow(id);
    return { workflow };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : "Can't reach the WorkflowStudio API. Make sure the backend is running.";
    return { error: message };
  }
}

export default async function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await loadWorkflow(id);

  if ("error" in result) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-base text-center">
        <p className="text-[14px] text-accent-red">{result.error}</p>
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

  return <WorkflowEditor workflow={result.workflow} />;
}
