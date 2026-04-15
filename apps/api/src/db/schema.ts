export const schemaSql = `
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'organization',
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity_providers (
  id UUID PRIMARY KEY,
  provider_type TEXT NOT NULL,
  issuer TEXT NOT NULL,
  audience TEXT NOT NULL,
  jwks_uri TEXT,
  saml_metadata_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY,
  uploader_email TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  ingestion_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id UUID PRIMARY KEY,
  file_id UUID,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion_dead_letters (
  id UUID PRIMARY KEY,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY,
  kpi_key TEXT UNIQUE NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_points (
  id UUID PRIMARY KEY,
  kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  point_time TIMESTAMPTZ NOT NULL,
  point_value DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS extracted_entities (
  id UUID PRIMARY KEY,
  doc_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  ontology_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hitl_corrections (
  id UUID PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES extracted_entities(id) ON DELETE CASCADE,
  reviewer_email TEXT NOT NULL,
  corrected_value TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations_runs (
  id UUID PRIMARY KEY,
  project_id TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  payload JSONB NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_registry (
  id UUID PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  stage TEXT NOT NULL,
  precision_at_3 DOUBLE PRECISION,
  ndcg_at_5 DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_drift_metrics (
  id UUID PRIMARY KEY,
  model_name TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  threshold DOUBLE PRECISION NOT NULL,
  is_breached BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS frameworks (
  id UUID PRIMARY KEY,
  project_id TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS framework_actions (
  id UUID PRIMARY KEY,
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  intervention_id TEXT NOT NULL,
  action_owner TEXT NOT NULL,
  milestone TEXT NOT NULL,
  target_kpi TEXT NOT NULL,
  priority TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artifact_signatures (
  id UUID PRIMARY KEY,
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  file_path TEXT NOT NULL,
  digest_sha256 TEXT NOT NULL,
  immutable_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  locked_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  payload JSONB NOT NULL,
  prev_hash TEXT NOT NULL,
  hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID PRIMARY KEY,
  subject_email TEXT NOT NULL,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS model_approvals (
  id UUID PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  approval_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ml_canary_deployments (
  id UUID PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  traffic_percent INT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ml_retrain_jobs (
  id UUID PRIMARY KEY,
  model_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS feature_validation_reports (
  id UUID PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  report JSONB NOT NULL,
  is_valid BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_events (
  id UUID PRIMARY KEY,
  severity TEXT NOT NULL,
  component TEXT NOT NULL,
  summary TEXT NOT NULL,
  details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS gdpr_fulfillments (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES gdpr_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  evidence JSONB NOT NULL,
  completed_by TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outbox_events_status_created_idx ON outbox_events(status, created_at);
CREATE INDEX IF NOT EXISTS ingestion_jobs_status_created_idx ON ingestion_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS extracted_entities_doc_idx ON extracted_entities(doc_id);
CREATE INDEX IF NOT EXISTS gdpr_requests_status_idx ON gdpr_requests(status, created_at);
`;
