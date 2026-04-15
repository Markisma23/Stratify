# Stratify Incident Response Runbook

## Sev1 flow
1. Acknowledge alert within 5 minutes.
2. Page platform lead + ML lead.
3. Execute rollback plan from `/api/tls/admin/release/rollback-plan`.
4. Verify `/health`, `/slo`, `/metrics` recovery.
5. Open RCA and attach evidence from audit and incident tables.
