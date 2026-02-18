import type {
  ProceduresResponse,
  PackagesResponse,
  ProcedureGraph,
  ProcedureOverview,
} from "../types";

const BASE = "/kg/api";

export async function fetchHealth(): Promise<{ status: string; database: string }> {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}

export async function fetchProcedures(filters?: {
  domain?: string;
  package?: string;
}): Promise<ProceduresResponse> {
  const params = new URLSearchParams();
  if (filters?.domain) params.set("domain", filters.domain);
  if (filters?.package) params.set("package", filters.package);
  const qs = params.toString();
  const res = await fetch(`${BASE}/store-procedures${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function fetchProcedureGraph(
  name: string,
  pkg?: string
): Promise<ProcedureGraph> {
  const params = new URLSearchParams();
  if (pkg) params.set("package", pkg);
  const qs = params.toString();
  const res = await fetch(
    `${BASE}/store-procedures/${encodeURIComponent(name)}/graph${qs ? `?${qs}` : ""}`
  );
  return res.json();
}

export async function fetchProcedureOverview(
  name: string
): Promise<ProcedureOverview> {
  const res = await fetch(
    `${BASE}/store-procedures/${encodeURIComponent(name)}/overview`
  );
  return res.json();
}

export async function fetchPackages(): Promise<PackagesResponse> {
  const res = await fetch(`${BASE}/packages`);
  return res.json();
}
