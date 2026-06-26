# Repository Layout Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean the repository root by separating frontend and backend source code, removing generated local artifacts, and keeping resources/docs/resources/scripts/configs discoverable.

**Architecture:** Keep the project as a single monorepo, but rename the top-level source buckets from generic scaffolding names to product-facing folders: `frontend/` for browser applications and `backend/` for Java/Python services. Keep shared TypeScript packages in `packages/`, documentation in `resources/docs/`, deployment assets in `resources/deploy/`, and scripts in `resources/scripts/`.

**Tech Stack:** pnpm workspace, Vite React frontends, Spring Boot backend, FastAPI agent service, PowerShell scripts.

---

### Task 1: Clean generated local artifacts

**Files/directories:**
- Delete: root dev server logs: `customer-web.dev.log`, `customer-web.dev.err.log`, `staff-web.dev.log`, `staff-web.dev.err.log`
- Delete: frontend build/cache artifacts: `apps/*/dist`, `apps/*/node_modules/.vite`
- Delete: backend build/test artifacts: `backend/platform-api/target`, `backend/agent-service/.pytest_cache`, source-level `__pycache__`
- Keep: root `node_modules`, Python `.venv`, `.superpowers`, `.worktrees`

- [ ] Remove only reproducible generated artifacts.
- [ ] Re-list root directory and confirm no screenshot/dev-log files remain.

### Task 2: Move source buckets

**Files/directories:**
- Move: `frontend/customer-web` -> `frontend/customer-web`
- Move: `frontend/staff-web` -> `frontend/staff-web`
- Move: `backend/platform-api` -> `backend/platform-api`
- Move: `backend/agent-service` -> `backend/agent-service`
- Remove: empty `apps`, `services`

- [ ] Create `frontend/` and `backend/`.
- [ ] Move directories with PowerShell `Move-Item`.
- [ ] Confirm moved directories exist.

### Task 3: Update workspace and scripts

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `package.json`
- Modify: `resources/scripts/verify-stage1.ps1`

- [ ] Change pnpm workspace package glob from `apps/*` to `frontend/*`.
- [ ] Keep `packages/*`.
- [ ] Update any script paths that reference `services/` to `backend/`.
- [ ] Keep command names `dev:customer` and `dev:staff` unchanged.

### Task 4: Update documentation references

**Files:**
- Modify: `阶段性文档.md`
- Modify: docs under `resources/docs/`

- [ ] Replace `frontend/customer-web` with `frontend/customer-web`.
- [ ] Replace `frontend/staff-web` with `frontend/staff-web`.
- [ ] Replace `backend/platform-api` with `backend/platform-api`.
- [ ] Replace `backend/agent-service` with `backend/agent-service`.
- [ ] Add a short repository layout note to `阶段性文档.md`.

### Task 5: Verify

**Commands:**
- `pnpm.cmd install --lockfile-only`
- `pnpm.cmd -r --if-present check`
- `pnpm.cmd -r --if-present build`
- `pwsh -NoProfile -File resources/scripts/verify-stage1.ps1`

- [ ] Run workspace install metadata update if the lockfile still points at old workspace paths.
- [ ] Run TypeScript checks.
- [ ] Run frontend builds.
- [ ] Run stage 1 verification if local Java/Python paths still match.
