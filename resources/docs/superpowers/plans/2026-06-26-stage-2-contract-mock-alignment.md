# Stage 2 Contract and Mock Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align frontend types, mock data, pages, and API contract with the new Steam game version / purchase method / game offer / multi-delivery entitlement model.

**Architecture:** Keep `digital_entitlement` as the unified entitlement aggregate. Represent delivery-specific data through CDK, gift, account, offline play, and download detail models. Frontend pages should consume shared TypeScript domain types first, then later swap mock data for generated API client responses.

**Tech Stack:** React 18, Vite, TypeScript, pnpm workspace, OpenAPI JSON-as-YAML contract, MySQL draft DDL.

---

## File Map

- Modify: `D:/code/AICareDesk/frontend/packages/shared/src/index.ts`
  - Owns shared TypeScript domain types for game, version, offer, purchase method, entitlement, delivery detail, and work order references.
- Create: `D:/code/AICareDesk/frontend/packages/shared/src/mock-data.ts`
  - Owns reusable mock games, offers, orders, entitlements, and work orders used by both frontends.
- Modify: `D:/code/AICareDesk/frontend/customer-web/src/main.tsx`
  - Replaces local `Game` and order mock structures with shared mock data.
- Modify: `D:/code/AICareDesk/frontend/staff-web/src/main.tsx`
  - Replaces B-side game management mock data with shared `GameProduct` / `GameOffer` structures.
- Modify: `D:/code/AICareDesk/resources/docs/api/openapi-v1.yaml`
  - Completes DTO naming around `purchaseMethod`, `deliveryKind`, `offerId`, and entitlement delivery details.
- Modify: `D:/code/AICareDesk/阶段性文档.md`
  - Records the Stage 2 contract/model adjustment summary.

---

### Task 1: Shared Domain Types

**Files:**

- Modify: `D:/code/AICareDesk/frontend/packages/shared/src/index.ts`

- [ ] **Step 1: Add game commerce and fulfillment types**

Replace the current file content with:

```ts
export const APP_NAME = "GameCare Desk";

export type TenantScopedId = {
  tenantId: string;
  id: string;
};

export type Money = {
  amount: number;
  currency: "CNY" | "USD";
  formatted: string;
};

export type PurchaseMethodCode = "CDK" | "STEAM_GIFT" | "ACCOUNT" | "OFFLINE_PLAY" | "DOWNLOAD";

export type DeliveryKind = PurchaseMethodCode;

export type PurchaseMethod = {
  code: PurchaseMethodCode;
  name: string;
  description: string;
  deliveryHandler: string;
  requiresManualReview: boolean;
};

export type GameOffer = {
  id: string;
  offerCode: string;
  title: string;
  purchaseMethod: PurchaseMethod;
  price: Money;
  originalPrice?: Money;
  stockQuantity: number;
  deliveryKind: DeliveryKind;
  deliveryHandler: string;
  status: "ACTIVE" | "DISABLED" | "SOLD_OUT";
};

export type GameVersion = {
  id: string;
  versionCode: string;
  versionTitle: string;
  description: string;
  status: "ACTIVE" | "DISABLED" | "ARCHIVED";
  offers: GameOffer[];
};

export type GameProduct = {
  id: string;
  steamAppId?: string;
  title: string;
  subtitle: string;
  description: string;
  platform: "Steam";
  publishStatus: "DRAFT" | "LISTED" | "UNLISTED" | "ARCHIVED";
  cover: string;
  tags: string[];
  rating: string;
  discountLabel?: string;
  versions: GameVersion[];
};

export type EntitlementStatus =
  | "PENDING_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "REFUNDED"
  | "REISSUED";

export type DigitalEntitlement = {
  id: string;
  orderId: string;
  orderItemId: string;
  gameId: string;
  versionId: string;
  offerId: string;
  purchaseMethodCode: PurchaseMethodCode;
  deliveryKind: DeliveryKind;
  status: EntitlementStatus;
  displayText: string;
};

export type WorkOrderStatus =
  | "UNASSIGNED"
  | "PENDING"
  | "IN_PROGRESS"
  | "WAITING_CUSTOMER"
  | "WAITING_ADMIN_REVIEW"
  | "COMPLETED"
  | "CLOSED"
  | "REJECTED"
  | "ESCALATED"
  | "TIMED_OUT";

export type WorkOrderReference = {
  orderId: string;
  orderItemId: string;
  entitlementId: string;
  offerId: string;
  purchaseMethodCode: PurchaseMethodCode;
  deliveryKind: DeliveryKind;
};
```

- [ ] **Step 2: Verify shared package compiles**

Run:

```powershell
frontend\node_modules\.bin\tsc.cmd -p frontend\packages\shared\tsconfig.json --noEmit
```

Expected: exits with code `0`.

---

### Task 2: Shared Mock Data

**Files:**

- Create: `D:/code/AICareDesk/frontend/packages/shared/src/mock-data.ts`
- Modify: `D:/code/AICareDesk/frontend/packages/shared/src/index.ts`

- [ ] **Step 1: Create reusable mock data**

Create `mock-data.ts` with:

```ts
import type { DigitalEntitlement, GameProduct, PurchaseMethod, WorkOrderReference } from "./index";

export const purchaseMethods: PurchaseMethod[] = [
  {
    code: "CDK",
    name: "CDK",
    description: "自动分配并展示加密库存中的激活码。",
    deliveryHandler: "CDK_AUTO",
    requiresManualReview: false
  },
  {
    code: "STEAM_GIFT",
    name: "Steam 礼物",
    description: "由平台演示发送礼物交付记录。",
    deliveryHandler: "STEAM_GIFT_MANUAL",
    requiresManualReview: true
  },
  {
    code: "ACCOUNT",
    name: "成品账号",
    description: "交付加密保存的账号资料。",
    deliveryHandler: "ACCOUNT_MANUAL",
    requiresManualReview: true
  },
  {
    code: "OFFLINE_PLAY",
    name: "离线账号游玩",
    description: "交付离线账号游玩说明和有效期信息。",
    deliveryHandler: "OFFLINE_PLAY_MANUAL",
    requiresManualReview: true
  },
  {
    code: "DOWNLOAD",
    name: "授权下载资料",
    description: "交付授权或演示资料的受控下载信息。",
    deliveryHandler: "DOWNLOAD_LINK_MANUAL",
    requiresManualReview: true
  }
];

const method = (code: PurchaseMethod["code"]) => {
  const found = purchaseMethods.find((item) => item.code === code);
  if (!found) {
    throw new Error(`Missing purchase method mock: ${code}`);
  }
  return found;
};

export const mockGames: GameProduct[] = [
  {
    id: "elden-ring",
    steamAppId: "1245620",
    title: "Elden Ring",
    subtitle: "开放世界魂系动作 RPG",
    description: "以 Steam 游戏售卖为核心的演示商品，支持不同版本和购买方式。",
    platform: "Steam",
    publishStatus: "LISTED",
    cover: "linear-gradient(135deg, #f59e0b 0%, #4c1d95 48%, #020617 100%)",
    tags: ["RPG", "开放世界", "动作"],
    rating: "特别好评",
    discountLabel: "-35%",
    versions: [
      {
        id: "elden-ring-standard",
        versionCode: "STANDARD",
        versionTitle: "标准版",
        description: "游戏本体。",
        status: "ACTIVE",
        offers: [
          {
            id: "offer-elden-standard-cdk",
            offerCode: "ELDEN_STANDARD_CDK",
            title: "标准版 · CDK",
            purchaseMethod: method("CDK"),
            price: { amount: 198, currency: "CNY", formatted: "¥198" },
            originalPrice: { amount: 298, currency: "CNY", formatted: "¥298" },
            stockQuantity: 12480,
            deliveryKind: "CDK",
            deliveryHandler: "CDK_AUTO",
            status: "ACTIVE"
          },
          {
            id: "offer-elden-standard-gift",
            offerCode: "ELDEN_STANDARD_STEAM_GIFT",
            title: "标准版 · Steam 礼物",
            purchaseMethod: method("STEAM_GIFT"),
            price: { amount: 218, currency: "CNY", formatted: "¥218" },
            stockQuantity: 180,
            deliveryKind: "STEAM_GIFT",
            deliveryHandler: "STEAM_GIFT_MANUAL",
            status: "ACTIVE"
          }
        ]
      },
      {
        id: "elden-ring-deluxe",
        versionCode: "DELUXE",
        versionTitle: "豪华版",
        description: "游戏本体与数字美术设定集。",
        status: "ACTIVE",
        offers: [
          {
            id: "offer-elden-deluxe-account",
            offerCode: "ELDEN_DELUXE_ACCOUNT",
            title: "豪华版 · 成品账号",
            purchaseMethod: method("ACCOUNT"),
            price: { amount: 268, currency: "CNY", formatted: "¥268" },
            stockQuantity: 24,
            deliveryKind: "ACCOUNT",
            deliveryHandler: "ACCOUNT_MANUAL",
            status: "ACTIVE"
          }
        ]
      }
    ]
  },
  {
    id: "cyberpunk-2077",
    steamAppId: "1091500",
    title: "Cyberpunk 2077",
    subtitle: "夜之城开放世界冒险",
    description: "用于展示多版本、多购买方式和售后权益分流的 Steam 商品。",
    platform: "Steam",
    publishStatus: "LISTED",
    cover: "linear-gradient(135deg, #fde047 0%, #0f766e 45%, #020617 100%)",
    tags: ["开放世界", "科幻", "剧情"],
    rating: "多半好评",
    discountLabel: "-50%",
    versions: [
      {
        id: "cyberpunk-ultimate",
        versionCode: "ULTIMATE",
        versionTitle: "终极版",
        description: "游戏本体与资料片合集。",
        status: "ACTIVE",
        offers: [
          {
            id: "offer-cyberpunk-ultimate-offline",
            offerCode: "CYBERPUNK_ULTIMATE_OFFLINE",
            title: "终极版 · 离线账号游玩",
            purchaseMethod: method("OFFLINE_PLAY"),
            price: { amount: 89, currency: "CNY", formatted: "¥89" },
            stockQuantity: 60,
            deliveryKind: "OFFLINE_PLAY",
            deliveryHandler: "OFFLINE_PLAY_MANUAL",
            status: "ACTIVE"
          },
          {
            id: "offer-cyberpunk-ultimate-download",
            offerCode: "CYBERPUNK_ULTIMATE_DOWNLOAD",
            title: "终极版 · 授权下载资料",
            purchaseMethod: method("DOWNLOAD"),
            price: { amount: 58, currency: "CNY", formatted: "¥58" },
            stockQuantity: 999,
            deliveryKind: "DOWNLOAD",
            deliveryHandler: "DOWNLOAD_LINK_MANUAL",
            status: "ACTIVE"
          }
        ]
      }
    ]
  }
];

export const mockEntitlements: DigitalEntitlement[] = [
  {
    id: "ENT-ELDEN-001",
    orderId: "ORD-GM-20260625-018",
    orderItemId: "OI-ELDEN-001",
    gameId: "elden-ring",
    versionId: "elden-ring-standard",
    offerId: "offer-elden-standard-cdk",
    purchaseMethodCode: "CDK",
    deliveryKind: "CDK",
    status: "PENDING_DELIVERY",
    displayText: "CDK 待分配"
  }
];

export const mockWorkOrderReference: WorkOrderReference = {
  orderId: "ORD-GM-20260625-018",
  orderItemId: "OI-ELDEN-001",
  entitlementId: "ENT-ELDEN-001",
  offerId: "offer-elden-standard-cdk",
  purchaseMethodCode: "CDK",
  deliveryKind: "CDK"
};
```

- [ ] **Step 2: Export mock data**

Append this line to `index.ts`:

```ts
export * from "./mock-data";
```

- [ ] **Step 3: Verify shared package compiles**

Run:

```powershell
frontend\node_modules\.bin\tsc.cmd -p frontend\packages\shared\tsconfig.json --noEmit
```

Expected: exits with code `0`.

---

### Task 3: Customer Web Mock Alignment

**Files:**

- Modify: `D:/code/AICareDesk/frontend/customer-web/src/main.tsx`

- [ ] **Step 1: Import shared mock data**

Add this import near the existing imports:

```ts
import { mockEntitlements, mockGames } from "@aicare/shared";
```

- [ ] **Step 2: Replace local game mock source**

Remove the local `type Game` and `const games` definitions. Add:

```ts
const games = mockGames;
```

- [ ] **Step 3: Replace old delivery display with offer display**

Use the first active offer for cards and detail summaries:

```ts
function getPrimaryOffer(game: (typeof mockGames)[number]) {
  return game.versions.flatMap((version) => version.offers).find((offer) => offer.status === "ACTIVE") ?? game.versions[0].offers[0];
}
```

Replace direct `game.delivery`, `game.price`, and `game.originalPrice` reads with:

```tsx
const offer = getPrimaryOffer(game);
offer.purchaseMethod.name
offer.price.formatted
offer.originalPrice?.formatted
```

- [ ] **Step 4: Update order/entitlement display**

Where the order detail currently displays a string delivery state, read the first mock entitlement:

```tsx
const entitlement = mockEntitlements[0];
```

Render:

```tsx
<InfoPanel icon={PackageCheck} title="权益状态" detail={`${entitlement.deliveryKind} · ${entitlement.status}`} />
```

- [ ] **Step 5: Compile customer web**

Run:

```powershell
frontend\node_modules\.bin\tsc.cmd -p frontend\customer-web\tsconfig.json --noEmit
```

Expected: exits with code `0`.

---

### Task 4: Staff Web Game Management Alignment

**Files:**

- Modify: `D:/code/AICareDesk/frontend/staff-web/src/main.tsx`

- [ ] **Step 1: Import shared mock data**

Add this import near the existing imports:

```ts
import { mockGames } from "@aicare/shared";
```

- [ ] **Step 2: Replace `managedGames` mock**

Replace the current `managedGames` array with:

```ts
const managedGames = mockGames.flatMap((game) =>
  game.versions.flatMap((version) =>
    version.offers.map((offer) => ({
      id: offer.id,
      title: game.title,
      version: version.versionTitle,
      platform: game.platform,
      price: offer.price.formatted,
      delivery: offer.purchaseMethod.name,
      state: game.publishStatus === "LISTED" ? "已上架" : game.publishStatus === "UNLISTED" ? "已下架" : "草稿",
      stock: offer.stockQuantity.toLocaleString("zh-CN")
    }))
  )
);
```

- [ ] **Step 3: Update game management row rendering**

Where the row currently renders `game.title`, append version:

```tsx
<strong>{game.title}<small>{game.version} · {game.id}</small></strong>
```

- [ ] **Step 4: Update flash-sale copy**

Replace “参与 SKU” with:

```ts
"配置秒杀场次、开始结束时间、参与可售方案、秒杀价格和库存锁定策略。"
```

- [ ] **Step 5: Compile staff web**

Run:

```powershell
frontend\node_modules\.bin\tsc.cmd -p frontend\staff-web\tsconfig.json --noEmit
```

Expected: exits with code `0`.

---

### Task 5: API Contract Naming Cleanup

**Files:**

- Modify: `D:/code/AICareDesk/resources/docs/api/openapi-v1.yaml`
- Modify: `D:/code/AICareDesk/resources/docs/api/frontend-contract-map.md`

- [ ] **Step 1: Keep public search query on purchase method**

Confirm `GET /search/games` uses:

```json
{
  "name": "purchaseMethod",
  "in": "query"
}
```

- [ ] **Step 2: Keep filter DTO on purchase methods**

Confirm `GameSearchFilters` contains:

```json
{
  "purchaseMethods": {
    "type": "array",
    "items": {
      "$ref": "#/components/schemas/PurchaseMethod"
    }
  }
}
```

- [ ] **Step 3: Confirm no old delivery terms remain**

Run:

```powershell
$patterns = @('学' + '习版', '盗' + '版', 'LEARN' + 'ING', 'GIFT' + '_LINK', 'ACCOUNT' + '_ENTITLEMENT')
$hits = Get-ChildItem -Path .\resources\docs -Recurse -File | Select-String -Pattern $patterns
if ($hits) { $hits | Select-Object Path,LineNumber,Line } else { 'NO_RISK_OR_OLD_DELIVERY_TERMS' }
```

Expected:

```text
NO_RISK_OR_OLD_DELIVERY_TERMS
```

- [ ] **Step 4: Validate OpenAPI references**

Run:

```powershell
node -e "const fs=require('fs'); const o=JSON.parse(fs.readFileSync('resources/docs/api/openapi-v1.yaml','utf8')); function walk(x,refs=[]){ if(Array.isArray(x)) x.forEach(v=>walk(v,refs)); else if(x&&typeof x==='object'){ if(x['$ref']) refs.push(x['$ref']); Object.values(x).forEach(v=>walk(v,refs)); } return refs;} const schemas=o.components.schemas; const missing=[...new Set(walk(o).filter(r=>r.startsWith('#/components/schemas/')).map(r=>r.split('/').pop()).filter(n=>!schemas[n]))]; console.log('missing='+JSON.stringify(missing)); process.exit(missing.length ? 1 : 0);"
```

Expected:

```text
missing=[]
```

---

### Task 6: Stage Document Update and Verification

**Files:**

- Modify: `D:/code/AICareDesk/阶段性文档.md`

- [ ] **Step 1: Append Stage 2 contract alignment summary**

Append:

```markdown
## 阶段 2 补充：契约与 Mock 数据对齐

- 将游戏售卖模型统一为 game_product、game_version、purchase_method、game_offer。
- 将数字权益交付统一为 digital_entitlement 主表 + CDK、礼物、成品账号、离线账号、授权下载资料详情表。
- 将 C 端和 B 端 Mock 数据迁移到 frontend/packages/shared，避免两个前端各自维护一套旧字段。
- 将搜索筛选、游戏详情、购物车和下单入口统一使用 offerId / purchaseMethod / deliveryKind。
- 校验 customer-web、staff-web 和 shared TypeScript 类型编译。
```

- [ ] **Step 2: Run final TypeScript checks**

Run:

```powershell
frontend\node_modules\.bin\tsc.cmd -p frontend\packages\shared\tsconfig.json --noEmit
frontend\node_modules\.bin\tsc.cmd -p frontend\customer-web\tsconfig.json --noEmit
frontend\node_modules\.bin\tsc.cmd -p frontend\staff-web\tsconfig.json --noEmit
```

Expected: all three commands exit with code `0`.

- [ ] **Step 3: Run SQL documentation check**

Run:

```powershell
$tableCount=(Select-String -Path .\resources\docs\data\mysql-schema-v1-draft.sql -Pattern '^CREATE TABLE ').Count
$tableCommentCount=(Select-String -Path .\resources\docs\data\mysql-schema-v1-draft.sql -Pattern '^\) COMMENT=').Count
$missing = @()
foreach ($line in Get-Content .\resources\docs\data\mysql-schema-v1-draft.sql) {
  $t=$line.Trim()
  if ($t -match '^[a-zA-Z_][a-zA-Z0-9_]*\s+' -and $t -notmatch '^CREATE\s+TABLE' -and $t -notmatch '^(UNIQUE|KEY|CONSTRAINT)\s+' -and $t -notmatch '^\)' -and $t -notmatch '^--' -and $t -notmatch '\sCOMMENT\s') {
    $missing += $t
  }
}
"SQL_OK tables=$tableCount table_comments=$tableCommentCount missing_column_comments=$($missing.Count)"
```

Expected:

```text
SQL_OK tables=37 table_comments=37 missing_column_comments=0
```

---

## Self-Review

- Spec coverage: covers the new data model, multi-delivery entitlement handling, frontend mock alignment, and contract naming cleanup.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps.
- Type consistency: uses `purchaseMethod`, `deliveryKind`, `offerId`, `versionId`, and `WorkOrderReference` consistently across shared types and frontend mock usage.
