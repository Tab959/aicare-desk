# Stage 1 Engineering and Environment Baseline Implementation Plan

> **For agentic workers:** Implement this plan step by step and update `阶段性文档.md` when the stage is complete.

**Goal:** Create a runnable monorepo baseline for two React frontends, one Java Spring Boot backend, one Python FastAPI Agent placeholder, and a lightweight Docker Compose core environment.

**Architecture:** Keep application code inside one repository. Run application processes on the Windows host during development and run stateful middleware in the Linux VM or local Docker through Compose profiles. Keep the Agent service minimal in Stage 1 because real Agent logic is intentionally deferred.

**Tech Stack:** pnpm workspace, Vite, React, TypeScript, Java 17, Spring Boot 3.x, Maven, Python 3.11+, FastAPI, Docker Compose.

---

## Target Layout

```text
aicare-desk/
├── apps/
│   ├── customer-web/
│   └── staff-web/
├── packages/
│   ├── api-client/
│   ├── shared/
│   └── ui/
├── services/
│   ├── platform-api/
│   └── agent-service/
├── resources/deploy/
│   └── compose/
├── resources/scripts/
└── resources/docs/
```

## Tasks

### Task 1: Monorepo Root

- Create root workspace files: `package.json`, `pnpm-workspace.yaml`, `.editorconfig`, `.env.example`.
- Add shared TypeScript config in `tsconfig.base.json`.
- Extend `.gitignore` for generated frontend, Java, Python and Compose artifacts.

### Task 2: Frontend Skeletons

- Create `frontend/customer-web` and `frontend/staff-web` as Vite React TypeScript apps.
- Add minimal route-free dashboard shells that can render independently.
- Create `frontend/packages/ui`, `frontend/packages/shared` and `frontend/packages/api-client` placeholders with type-safe exports.

### Task 3: Java Backend Skeleton

- Create `backend/platform-api` Maven project.
- Use Java 17 and Spring Boot 3.x.
- Add domain-oriented package roots for `identity`, `catalog`, `order`, `aftersales`, `conversation`, `ticket`, `knowledge`, `notification`, `analytics` and `agentgateway`.
- Add `/actuator/health` support and a versioned `/api/v1/system/health` endpoint.
- Add a context-load test.

### Task 4: Python Agent Skeleton

- Create `backend/agent-service` FastAPI package.
- Add `/health` and `/api/v1/agent/health`.
- Keep implementation intentionally minimal and independent from model providers.

### Task 5: Core Compose Environment

- Create Docker Compose `core` profile for MySQL and Redis.
- Add environment examples without real secrets.
- Add PowerShell helper scripts for starting and stopping the core profile.

### Task 6: Stage Gate

- Add `resources/scripts/verify-stage1.ps1`.
- Verify required files exist and no unfinished marker remains in Stage 1 files.
- Run available build or syntax checks based on installed local tools.
- Update `阶段性文档.md` with Stage 1 progress when enough baseline work is complete.
