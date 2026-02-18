// ── Types for the SF-Dash API ──

export interface Procedure {
  id: number;
  procedure_name: string;
  package_name: string;
  version: string;
  domain: string;
  created_at: string;
  updated_at: string;
  table_count: number;
  called_procedures_count: number;
}

export interface ProceduresResponse {
  total: number;
  filters: { domain: string | null; package: string | null };
  procedures: Procedure[];
}

export interface Package {
  id: number;
  package_name: string;
  created_at: string;
  procedure_count: number;
  domains: string;
}

export interface PackagesResponse {
  total: number;
  packages: Package[];
}

export interface Parameter {
  parameter_name: string;
  parameter_type: string;
  direction: string;
}

export interface Table {
  table_name: string;
  schema_name: string;
  operations: string;
  columns: string[];
}

export interface Query {
  query_type: string;
  raw_query: string;
  conditions: string[];
  inline_views: string[];
  tables: string[];
}

export interface PackageRelation {
  package_name: string;
  relation_type: string;
}

export interface ProcedureGraph {
  procedure: {
    id: number;
    procedure_name: string;
    package_name: string;
    version: string;
    domain: string;
    created_at: string;
    updated_at: string;
  };
  parameters: Parameter[];
  tables: Table[];
  queries: Query[];
  called_procedures: string[];
  packages: PackageRelation[];
  functions: string[];
  exception_handlers: string[];
  detail?: string;
}

export interface ProcedureOverview {
  procedure_id: string;
  procedure_name: string;
  procedure_overview: string;
  detail?: string;
}
