# Digital Planner Production Deployment — Implementation Orchestration

> **Spec ID:** `DIGITAL-PLANNER-PRODUCTION-DEPLOY-V1`
> **Document role:** Deployment execution source of truth
> **Implements:** [`prd.md`](prd.md), [`PROJECT_STATUS.md`](PROJECT_STATUS.md), and owner deployment approval from 2026-08-04
> **Status:** [`PRODUCTION_DEPLOYMENT_STATUS.md`](PRODUCTION_DEPLOYMENT_STATUS.md)
> **Repository instructions:** [`AGENTS.md`](AGENTS.md)

## 1. Objective and boundaries

Plan-and-run deployment of the accepted Daily Planner to one stable HTTPS Vercel URL with existing Supabase magic-link authentication and cloud sync. Weekly/monthly agenda implementation and scheduler expansion are excluded.

## 2. Repository and architecture baseline

The maintained app is React 18/TypeScript/Vite under `frontend/`, with React Router SPA routes and Supabase browser authentication. There is no hosting configuration. The working tree contains substantial intentional uncommitted backend, recurring-schedule, and acceptance-fix work; no destructive cleanup or history rewrite is allowed.

## 3. Agent/model assignment

| Role | Capability tier | Resolved model/effort | Scope | Write ownership |
|---|---|---|---|---|
| Primary deployment integrator | Tier A | Current Codex model, high effort | Production surface, hosting config, verification, Git safety, Vercel/Supabase coordination | All scoped deployment files, sequential |

No subagents: deployment source, Git staging, production environment, and external state are security-sensitive merge points.

## 4. Dependency graph

```text
hide paused routes + add hosting config
                ↓
typecheck/tests/build/browser/deep-link QA
                ↓
full diff review + secret/PII scan
                ↓
owner-approved stage/commit/push
                ↓
Vercel project + public env vars + deploy
                ↓
Supabase Site URL/redirect update
                ↓
production magic-link + two-device acceptance
```

## 5. Phase plan

### P1 — Production surface

Sequential. Confirm the production route/navigation surface contains only accepted planner features. Add Vercel configuration with Vite build/output settings and SPA rewrite. Gate: local deep links and production build pass.

### P2 — Source and security review

Sequential. Review the complete deployment diff, verify ignored environment files, scan all staged candidates for PII/secrets, and produce the exact commit manifest/message. Gate: no secret or unrelated destructive change; owner approves Git batch.

### P3 — Publish source and deploy

Sequential external state. Stage, commit, and push only after Git-skill approval. Create/link Vercel project rooted at `frontend`, configure the two public Supabase variables, and deploy. Gate: permanent HTTPS URL serves root and direct dated routes.

### P4 — Auth and production acceptance

Update Supabase Auth Site URL and exact redirect allowlist after URL is known. Verify magic-link, save/reload, notes/checklists, automatic schedules, direct-route refresh, phone/laptop sync, Realtime, and offline recovery. Gate: owner accepts production URL.

## 6. Parallelization rules

No concurrent writes or production mutations. `.env.local`, database passwords, access tokens, and service-role keys are never staged or copied to Vercel.

## 7. Quality and safety gates

| Criterion | Evidence |
|---|---|
| Only accepted Daily Planner exposed | route/navigation inspection and browser QA |
| Direct SPA routes work | Vercel rewrite plus dated-route HTTP/browser test |
| Cloud config safe | only public URL/publishable key configured in Vercel |
| Source safe | full diff review, ignore check, mandatory PII/secret scan |
| Git controlled | explicit owner approval before add/commit/push |
| Auth works | exact production Site URL/redirect plus magic-link test |
| Cross-device durable | two-client save/Realtime/offline checklist |

## 8. Session continuity

Canonical status is `PRODUCTION_DEPLOYMENT_STATUS.md`; repository summary remains `PROJECT_STATUS.md`. Restart order: `AGENTS.md`, this orchestration, status, `BACKEND_IMPLEMENTATION_STATUS.md`, `DAILY_PLANNER_ACCEPTANCE_FIXES_STATUS.md`, current code, Git evidence, then Vercel/Supabase state.

## 9. Exact kickoff/resume prompt

> Resume `DIGITAL-PLANNER-PRODUCTION-DEPLOY-V1`. Read `AGENTS.md`, `production-deployment-orchestration.md`, `PRODUCTION_DEPLOYMENT_STATUS.md`, `PROJECT_STATUS.md`, backend/acceptance status, and current repository evidence. Continue at the first incomplete gate, preserve unrelated work, use the Git skill for every Git command, never expose secrets, and update deployment status before stopping.
