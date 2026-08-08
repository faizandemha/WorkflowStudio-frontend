// Types deliberately mirror internal/models/models.go on the backend field
// for field — this is the contract between the two halves of the project.
// If a field is renamed on one side without the other, TypeScript catches
// it here at compile time instead of it surfacing as a silent `undefined`
// in the UI.

export type NodePosition = { x: number; y: number };

export type WorkflowNode = {
  id: string;
  type: string;
  position: NodePosition;
  config: Record<string, unknown>;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  source_handle?: string;
  target_handle?: string;
};

export type WorkflowDefinition = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type Workflow = {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkflowListResponse = {
  workflows: Workflow[];
  total: number;
  limit: number;
  offset: number;
};

export type ExecutionStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "skipped";

export type Execution = {
  id: string;
  workflow_id: string;
  status: ExecutionStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
};

export type ExecutionWithWorkflow = Execution & { workflow_name: string };

export type ExecutionListResponse = {
  executions: ExecutionWithWorkflow[];
  total: number;
  limit: number;
  offset: number;
};

export type ExecutionStep = {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: string;
  status: ExecutionStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  started_at?: string;
  finished_at?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ApiError carries the HTTP status alongside the message, so callers can
// distinguish "workflow not found" (404 — show an empty state) from
// "backend unreachable" (network error — show a connection warning) rather
// than treating every failure identically.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listWorkflows: (limit = 50, offset = 0) =>
    request<WorkflowListResponse>(`/workflows?limit=${limit}&offset=${offset}`),

  getWorkflow: (id: string) => request<Workflow>(`/workflows/${id}`),

  createWorkflow: (input: { name: string; description?: string; definition: WorkflowDefinition }) =>
    request<Workflow>("/workflows", { method: "POST", body: JSON.stringify(input) }),

  updateWorkflow: (
    id: string,
    input: Partial<{ name: string; description: string; definition: WorkflowDefinition; is_active: boolean }>
  ) => request<Workflow>(`/workflows/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

  deleteWorkflow: (id: string) => request<void>(`/workflows/${id}`, { method: "DELETE" }),

  triggerExecution: (workflowId: string, input?: Record<string, unknown>) =>
    request<Execution>(`/workflows/${workflowId}/executions`, {
      method: "POST",
      body: JSON.stringify({ input }),
    }),

  listExecutions: (workflowId: string, limit = 20) =>
    request<Execution[]>(`/workflows/${workflowId}/executions?limit=${limit}`),

  getExecution: (id: string) => request<Execution>(`/executions/${id}`),

  getExecutionSteps: (executionId: string) =>
    request<ExecutionStep[]>(`/executions/${executionId}/steps`),

  listAllExecutions: (limit = 50, offset = 0) =>
    request<ExecutionListResponse>(`/executions?limit=${limit}&offset=${offset}`),
};
