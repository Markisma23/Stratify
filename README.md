# Stratify

Enterprise-ready monorepo for strategy diagnostics, recommendation, and execution planning.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript + PostgreSQL
- Shared package: Zod schemas + shared DTOs
- Ops: Docker, docker-compose, CI

## Quick start
```bash
npm install
npm run dev
```

## What is implemented now
### Identity, trust, and session security
- OIDC callback with JWKS-based ID token validation
- Enterprise SAML response validation with metadata refresh, certificate extraction, clock-skew controls, and key rotation support
- Policy-driven MFA and concurrent session controls
- Personal account registration (`/api/tls/auth/register/personal`) so non-organization users can use Stratify for personal work

### Production ML lifecycle
- Remote ML service clients for NLP extraction, KPI analytics, and recommendation ranking
- Local fallback engines still available as resilience mode
- Model approvals, feature validation reports, canary deployment records, retrain job queue, and drift breach metrics

### Async ingestion + outbox reliability
- Job queue + retry + DLQ + outbox processing workers
- Admin enqueue/process routes for jobs and outbox

### Export engine hardening
- JSON, DOCX, and PDF export endpoints
- Branded templating fields for exports
- Artifact signing (SHA-256) + immutable reference persistence
- Immutable artifact persistence path to emulate WORM-style behavior

### End-to-end observability
- Request metrics + worker counters + `/metrics`
- Trace propagation middleware (`traceparent`)
- `/slo` snapshot endpoint for drift/dead-letter risk indicators
- Alert rules, dashboard scaffold, and incident runbook

### Compliance and governance automation
- Immutable-style audit chain
- GDPR request APIs (export/delete)
- GDPR fulfillment automation endpoint with evidence recording
- PII anonymization in document processing

### Testing and DevSecOps execution
- Unit + integration + security + e2e test suites
- Load test script scaffold (k6)
- CI quality, load, SAST, CodeQL, SBOM, and Trivy gates
- Canary deploy stage and rollback planning endpoint

## API highlights
- `POST /api/tls/auth/register/personal`
- `POST /api/tls/auth/oidc/callback`
- `POST /api/tls/auth/saml/callback`
- `POST /api/tls/auth/mfa/setup`
- `POST /api/tls/auth/mfa/verify`
- `POST /api/tls/auth/logout`
- `POST /api/tls/documents/:docId/extract`
- `POST /api/tls/documents/:docId/entities/:entityId/corrections`
- `POST /api/tls/kpis/analyze`
- `POST /api/tls/admin/jobs/enqueue`
- `POST /api/tls/admin/jobs/process`
- `POST /api/tls/admin/outbox/process`
- `POST /api/tls/admin/ml/approvals`
- `POST /api/tls/admin/ml/feature-validation`
- `POST /api/tls/admin/ml/canary`
- `POST /api/tls/admin/ml/retrain`
- `POST /api/tls/admin/incidents`
- `POST /api/tls/compliance/gdpr/request`
- `POST /api/tls/compliance/gdpr/requests/:id/fulfill`
- `GET  /api/tls/compliance/gdpr/requests`
- `GET  /api/tls/frameworks/:id/export?format=pdf|docx|json`

## Remaining work for complete production readiness
1. Complete full SAML XML signature chain and certificate trust-store validation through audited library policies.
2. Integrate real model registry/governance backend and automated canary promotion/rollback.
3. Connect immutable object storage (S3 Object Lock/WORM) and legal template packs for exports.
4. Wire real OpenTelemetry backend with dashboard provisioning and on-call paging.
5. Execute non-placeholder UAT and penetration testing pipelines in isolated staging.
6. Add legal SLA timers and automated data-subject communication workflows.
