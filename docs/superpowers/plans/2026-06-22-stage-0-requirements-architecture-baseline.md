# Stage 0 Requirements and Architecture Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Produce a complete, internally consistent and automatically verifiable product-and-architecture baseline before application scaffolding begins.

**Architecture:** Keep one GitHub monorepo named aicare-desk containing four deployable applications: customer-web, staff-web, platform-api, and agent-service. Stage 0 creates version-controlled product, domain, API, security, data, operations, and ADR documents. A PowerShell quality gate verifies that every required artifact exists and contains no unresolved placeholder text.

**Tech Stack:** Markdown, Mermaid, PowerShell 7, Git; database-schema-designer and security-threat-model Skills for their matching design tasks.

---

## Target repository layout

~~~text
aicare-desk/
├── apps/
│   ├── customer-web/          # Created in Stage 1
│   └── staff-web/             # Created in Stage 1
├── services/
│   ├── platform-api/          # Created in Stage 1
│   └── agent-service/         # Created after Java core; skeleton in Stage 1
├── docs/
│   ├── adr/
│   ├── api/
│   ├── architecture/
│   ├── data/
│   ├── domain/
│   ├── operations/
│   ├── product/
│   ├── security/
│   └── superpowers/
└── scripts/
~~~

Canonical application identifiers:

| Application | Canonical name | Package/artifact identifier |
|---|---|---|
| Consumer frontend | aicare-customer-web | @aicare/customer-web |
| Staff frontend | aicare-staff-web | @aicare/staff-web |
| Java backend | aicare-platform-api | com.aicare:aicare-platform-api |
| Python Agent | aicare-agent-service | aicare_agent_service |

### Task 1: Add the Stage 0 documentation quality gate

**Files:**
- Create: scripts/verify-stage0.ps1
- Reference: docs/superpowers/specs/2026-06-21-ai-after-sales-platform-development-design.md

- [ ] **Step 1: Inspect the current worktree without modifying user changes**

Run:

~~~powershell
git status --short
~~~

Expected: the user-owned move of 项目概要.md may appear as a deletion and an untracked file. Do not stage or reverse it.

- [ ] **Step 2: Create the verifier**

Create scripts/verify-stage0.ps1 with:

~~~powershell
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$requiredFiles = @(
    'docs/product/product-brief.md',
    'docs/product/glossary.md',
    'docs/product/actors-and-capabilities.md',
    'docs/product/use-cases.md',
    'docs/product/acceptance-criteria.md',
    'docs/security/access-control-matrix.md',
    'docs/security/threat-model.md',
    'docs/domain/state-machines.md',
    'docs/architecture/context-and-containers.md',
    'docs/architecture/module-boundaries.md',
    'docs/data/core-data-model.md',
    'docs/api/api-standards.md',
    'docs/api/event-contracts.md',
    'docs/operations/non-functional-requirements.md',
    'docs/adr/0001-monorepo-and-application-layout.md',
    'docs/adr/0002-modular-monolith-and-agent-boundary.md',
    'docs/adr/0003-local-development-topology.md',
    'docs/stage-0-traceability.md'
)

$errors = [System.Collections.Generic.List[string]]::new()
$forbiddenPattern = '(?im)\bTBD\b|\bTODO\b|待定|待补充|稍后决定'

foreach ($relativePath in $requiredFiles) {
    $absolutePath = Join-Path $repoRoot $relativePath
    if (-not (Test-Path -LiteralPath $absolutePath)) {
        $errors.Add("Missing: $relativePath")
        continue
    }

    $content = Get-Content -Raw -LiteralPath $absolutePath
    if ($content.Length -lt 200) {
        $errors.Add("Too short: $relativePath")
    }
    if ($content -match $forbiddenPattern) {
        $errors.Add("Placeholder text: $relativePath")
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output 'STAGE0_DOCS_OK'
~~~

- [ ] **Step 3: Verify the new gate fails for the missing Stage 0 documents**

Run:

~~~powershell
pwsh -NoProfile -File scripts/verify-stage0.ps1
~~~

Expected: exit code 1 with Missing messages.

- [ ] **Step 4: Commit only the gate and plan**

~~~powershell
git add -- scripts/verify-stage0.ps1 docs/superpowers/plans/2026-06-22-stage-0-requirements-architecture-baseline.md
git commit -m "build: add stage zero documentation gate"
~~~

### Task 2: Define product scope and canonical domain language

**Files:**
- Create: docs/product/product-brief.md
- Create: docs/product/glossary.md
- Reference: docs/superpowers/specs/项目概要.md
- Reference: docs/superpowers/specs/2026-06-21-ai-after-sales-platform-development-design.md

- [ ] **Step 1: Write the product brief**

Include Problem, Users, Product outcome, MVP boundaries, Exclusions and Success measures. State explicitly:

- built-in demo commerce data;
- single-enterprise runtime with tenant-aware data design;
- Mock Agent before real Agent;
- no real payment, marketplace, carrier or local-model hosting;
- the complete consultation-to-work-order path works without a model API key.

- [ ] **Step 2: Write the glossary**

Define Consumer, Conversation, Message, Human handoff, After-sales application, Work order, Work-order record, Assignment, SLA, Knowledge article and Tenant.

State that an after-sales application is customer-facing, while a work order is internal operational coordination.

- [ ] **Step 3: Check canonical terms**

~~~powershell
Select-String -Path docs/product/product-brief.md,docs/product/glossary.md -Pattern 'After-sales application','Work order','Mock Agent','Tenant' -SimpleMatch
~~~

Expected: every canonical concept appears and has one meaning.

- [ ] **Step 4: Commit**

~~~powershell
git add -- docs/product/product-brief.md docs/product/glossary.md
git commit -m "docs: define product scope and domain language"
~~~

### Task 3: Define actors and authorization boundaries

**Files:**
- Create: docs/product/actors-and-capabilities.md
- Create: docs/security/access-control-matrix.md

- [ ] **Step 1: Define actor responsibilities**

Cover Consumer, Customer Service, After-sales, Warehouse, Logistics, Finance, Administrator and Agent. For each, list allowed actions, owned inputs, produced outputs and prohibited actions.

- [ ] **Step 2: Create the RBAC matrix**

Rows must include product:read, order:read-own, conversation:create-own, conversation:accept, conversation:reply, aftersales:create-own, aftersales:review, ticket:create, ticket:assign, ticket:process, ticket:close, knowledge:manage, sla:manage, analytics:read and audit:read.

Columns must cover every human role. Each allowed cell specifies own, assigned, department or tenant scope.

- [ ] **Step 3: Add resource-level rules**

Document mandatory tenant match, consumer ownership, assignment/state guard, Agent delegation context and administrative audit rules.

- [ ] **Step 4: Commit**

~~~powershell
git add -- docs/product/actors-and-capabilities.md docs/security/access-control-matrix.md
git commit -m "docs: define actors and authorization matrix"
~~~

### Task 4: Specify use cases and acceptance criteria

**Files:**
- Create: docs/product/use-cases.md
- Create: docs/product/acceptance-criteria.md

- [ ] **Step 1: Write eight use cases**

For each use case document preconditions, trigger, happy path, alternate paths, authorization and observable outcome:

1. Consumer views an order and starts a consultation.
2. Mock Agent answers a deterministic order question.
3. Conversation is handed to a human queue.
4. Customer service accepts and replies.
5. Consumer submits a quality-related after-sales application with evidence.
6. Customer service creates and assigns a work order.
7. Department specialist processes the work order.
8. Consumer confirms and rates the result.

- [ ] **Step 2: Add failure and concurrency paths**

Cover expired login, wrong owner, duplicate submission, two staff accepting one conversation, illegal transition, unavailable Agent, failed notification and rejected evidence upload.

- [ ] **Step 3: Create exactly 24 Given/When/Then criteria**

Use identifiers AC-001 through AC-024. Every criterion identifies an observable API response, persisted state, emitted event or UI result.

- [ ] **Step 4: Verify count**

~~~powershell
$count = (Select-String -Path docs/product/acceptance-criteria.md -Pattern '^### AC-\d{3}' -CaseSensitive).Count
if ($count -ne 24) { throw "Expected 24 acceptance criteria, found $count" }
~~~

Expected: no output and exit code 0.

- [ ] **Step 5: Commit**

~~~powershell
git add -- docs/product/use-cases.md docs/product/acceptance-criteria.md
git commit -m "docs: specify use cases and acceptance criteria"
~~~

### Task 5: Define state machines

**Files:**
- Create: docs/domain/state-machines.md

- [ ] **Step 1: Define conversation transitions**

States: BOT_ACTIVE, WAITING_HUMAN, HUMAN_ACTIVE, RESOLVED and CLOSED. CLOSED is terminal.

- [ ] **Step 2: Define after-sales transitions**

States: SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, PROCESSING, COMPLETED and CANCELLED. Approval and rejection require an immutable review record.

- [ ] **Step 3: Define work-order transitions**

States: UNASSIGNED, PENDING, IN_PROGRESS, WAITING_CUSTOMER, COMPLETED, CLOSED, REJECTED, ESCALATED and TIMED_OUT. Document transition actor, guard, SLA effect and emitted event.

- [ ] **Step 4: Add three Mermaid stateDiagram-v2 blocks**

State that an illegal transition returns HTTP 409, a stable business code and no partial update.

- [ ] **Step 5: Commit**

~~~powershell
git add -- docs/domain/state-machines.md
git commit -m "docs: define business state machines"
~~~

### Task 6: Define system and module boundaries

**Files:**
- Create: docs/architecture/context-and-containers.md
- Create: docs/architecture/module-boundaries.md

- [ ] **Step 1: Create a Mermaid system-context flowchart**

Show Consumer, Staff, Administrator, both frontends, platform-api, agent-service, model provider, MySQL, Redis, RabbitMQ, MinIO and Elasticsearch.

- [ ] **Step 2: Create the container responsibility table**

For each application list responsibility, owned data, inbound protocol, outbound dependencies and forbidden dependencies. Prohibit browser-to-Agent and Agent-to-MySQL access.

- [ ] **Step 3: Define Java modules**

Define identity, catalog, order, aftersales, conversation, ticket, knowledge, notification, analytics and agent-gateway.

- [ ] **Step 4: Define dependency rules**

Document web adapters -> application services -> domain, infrastructure adapters -> application ports, and domain -> no framework dependency. Prohibit cross-module repository access.

- [ ] **Step 5: Commit**

~~~powershell
git add -- docs/architecture/context-and-containers.md docs/architecture/module-boundaries.md
git commit -m "docs: define system and module boundaries"
~~~

### Task 7: Design the core data model

**Files:**
- Create: docs/data/core-data-model.md

- [ ] **Step 1: Invoke database-schema-designer**

Use it to review entity ownership, normalization, keys, indexes, audit fields and migration safety.

- [ ] **Step 2: Define entities by module**

Include tenant/user/role/department, product/SKU, order/item/logistics, after-sales/evidence/review, conversation/message/queue, work-order/assignment/record/category/SLA, knowledge base/document/chunk, notification/rating/audit/Agent log.

- [ ] **Step 3: Define column conventions**

Tenant-owned mutable tables include id, tenant_id, created_at, updated_at and version. States use stable uppercase strings. Money uses decimal plus currency. Immutable history is never soft-deleted.

- [ ] **Step 4: Add a Mermaid ER diagram and index plan**

Include unique and lookup indexes for order number, active queue entry, idempotency key, work-order state/assignee/deadline and knowledge metadata.

- [ ] **Step 5: Commit**

~~~powershell
git add -- docs/data/core-data-model.md
git commit -m "docs: design core transactional data model"
~~~

### Task 8: Define HTTP, Agent and event contracts

**Files:**
- Create: docs/api/api-standards.md
- Create: docs/api/event-contracts.md

- [ ] **Step 1: Define HTTP conventions**

Use /api/v1, JSON camelCase, UTC ISO-8601 timestamps, correlation IDs, consistent pagination/filtering/sorting and idempotency keys.

- [ ] **Step 2: Define the error envelope**

~~~json
{
  "code": "TICKET_ILLEGAL_STATE_TRANSITION",
  "message": "The work order cannot transition from CLOSED to IN_PROGRESS.",
  "details": [],
  "correlationId": "01JEXAMPLE",
  "timestamp": "2026-06-22T08:00:00Z"
}
~~~

Map validation 400, authentication 401, authorization 403, absent resource 404, conflict 409, rate limit 429 and temporary dependency failure 503.

- [ ] **Step 3: Define AgentGateway operations**

Cover answer generation, conversation summary, work-order draft and reply recommendation. Requests carry tenant, actor, conversation, locale and correlation context. Responses carry answer, citations, handoff request, model metadata and latency.

- [ ] **Step 4: Define the event envelope and initial events**

Envelope fields: eventId, eventType, eventVersion, occurredAt, tenantId, correlationId, causationId and payload.

Events: ConversationHumanHandoffRequested, WorkOrderCreated, WorkOrderAssigned, WorkOrderStatusChanged, KnowledgeDocumentUploaded and NotificationRequested.

- [ ] **Step 5: Commit**

~~~powershell
git add -- docs/api/api-standards.md docs/api/event-contracts.md
git commit -m "docs: define API and event contracts"
~~~

### Task 9: Define measurable quality targets and threat model

**Files:**
- Create: docs/operations/non-functional-requirements.md
- Create: docs/security/threat-model.md

- [ ] **Step 1: Document reproducible laptop targets**

- non-Agent read API p95 below 300 ms at 50 virtual users;
- non-Agent write API p95 below 500 ms at 20 virtual users;
- chat acknowledgement p95 below 500 ms on the local network;
- Agent timeout at 15 seconds with deterministic handoff;
- zero cross-tenant and cross-consumer authorization failures;
- demo RPO 24 hours and RTO 2 hours;
- every request and event carries a correlation ID.

State that these are local acceptance targets, not production-capacity claims.

- [ ] **Step 2: Invoke security-threat-model**

Model browser, reverse proxy, Java API, Agent, model provider, MySQL, Redis, RabbitMQ, MinIO and Elasticsearch as trust zones.

- [ ] **Step 3: Prioritize threats**

Cover object-level authorization, prompt injection, excessive Agent agency, cross-tenant cache leakage, malicious upload, WebSocket hijacking, duplicate message processing, secret leakage, audit tampering and knowledge poisoning. For each record asset, path, preventive control, detective control and verification.

- [ ] **Step 4: Commit**

~~~powershell
git add -- docs/operations/non-functional-requirements.md docs/security/threat-model.md
git commit -m "docs: define quality targets and threat model"
~~~

### Task 10: Record foundational ADRs

**Files:**
- Create: docs/adr/0001-monorepo-and-application-layout.md
- Create: docs/adr/0002-modular-monolith-and-agent-boundary.md
- Create: docs/adr/0003-local-development-topology.md

- [ ] **Step 1: Record one-repository/four-application decision**

ADR 0001 states one GitHub repository aicare-desk, shared frontend packages, atomic contract changes and reconsideration only when teams, release cadences or access boundaries become independent.

- [ ] **Step 2: Record backend and Agent boundaries**

ADR 0002 states Spring Boot modular monolith, separate Python Agent, Java-owned business tools and MockAgentGateway for front/Java-first delivery.

- [ ] **Step 3: Record local topology**

ADR 0003 states Windows host development; Linux VM with 4 vCPU, 6 GB RAM, 4 GB Swap, 120 GB dynamic disk; Compose Profiles core, messaging, search and observe.

- [ ] **Step 4: Commit**

~~~powershell
git add -- docs/adr/0001-monorepo-and-application-layout.md docs/adr/0002-modular-monolith-and-agent-boundary.md docs/adr/0003-local-development-topology.md
git commit -m "docs: record foundational architecture decisions"
~~~

### Task 11: Build traceability and pass the Stage 0 gate

**Files:**
- Create: docs/stage-0-traceability.md
- Modify only when validation exposes defects: documents from Tasks 2-10

- [ ] **Step 1: Create the traceability table**

Columns: Requirement ID, Use case, Acceptance criterion, Owning module, API/event, Data entities, Security controls and Planned test layer. Include AC-001 through AC-024 exactly once.

- [ ] **Step 2: Run the documentation gate**

~~~powershell
pwsh -NoProfile -File scripts/verify-stage0.ps1
~~~

Expected:

~~~text
STAGE0_DOCS_OK
~~~

- [ ] **Step 3: Verify criterion traceability**

~~~powershell
$criteria = 1..24 | ForEach-Object { 'AC-{0:d3}' -f $_ }
$traceability = Get-Content -Raw docs/stage-0-traceability.md
$invalid = $criteria | Where-Object {
    ([regex]::Matches($traceability, [regex]::Escape($_))).Count -ne 1
}
if ($invalid) { throw "Missing or duplicate criteria: $($invalid -join ', ')" }
~~~

Expected: no output and exit code 0.

- [ ] **Step 4: Review scope**

~~~powershell
git status --short
git diff --stat
~~~

Expected: only Stage 0 files plus separately preserved user changes.

- [ ] **Step 5: Commit traceability**

~~~powershell
git add -- docs/stage-0-traceability.md
git commit -m "docs: complete stage zero traceability"
~~~

- [ ] **Step 6: Capture completion evidence**

~~~powershell
git log --oneline --decorate -12
pwsh -NoProfile -File scripts/verify-stage0.ps1
git status --short --branch
~~~

Expected: Stage 0 commits are visible, the verifier prints STAGE0_DOCS_OK, and only explicitly preserved user changes remain uncommitted.

