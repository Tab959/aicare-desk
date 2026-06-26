# Shared UI Design System

## Purpose

本文档记录阶段 2 抽取出的共享 UI 组件和设计令牌。当前目标不是一次性做完整组件库，而是先把两个前端中高频、稳定、低业务耦合的 UI 模式收敛到 `frontend/packages/ui`，降低后续页面扩展和 API 接入时的维护成本。

## Package

共享 UI 包路径：

```text
frontend/packages/ui
```

导入方式：

```ts
import { Button, PageHeader, SectionTitle, TagRow } from "@aicare/ui";
import "@aicare/ui/styles.css";
```

## Design Tokens

令牌定义在：

```text
frontend/packages/ui/src/tokens.ts
frontend/packages/ui/src/styles.css
```

当前令牌覆盖：

- 深色背景、面板、边框、文本、辅助文本。
- 主品牌紫色、信息青色、成功绿色、警告金色、危险玫红。
- 圆角等级。
- 面板阴影、卡片阴影、品牌 glow。
- 动效时长。

## Components

当前已抽取：

| Component | Purpose |
| --- | --- |
| `Button` | 普通按钮、主按钮、危险按钮、幽灵按钮 |
| `Panel` | 通用玻璃质感面板容器 |
| `Badge` | 小型标签 |
| `StatusPill` | 状态标签 |
| `PageHeader` | 页面标题区 |
| `SectionTitle` | 区块标题区 |
| `TagRow` | 游戏标签或业务标签行 |
| `KpiCard` | 后台指标卡 |
| `EmptyState` | 空状态 |

## Current Usage

C 端已使用：

- `PageHeader`
- `SectionTitle`
- `TagRow`

B 端已使用：

- `PageHeader`
- `KpiCard`
- `Button`

## Rules

- `@aicare/ui` 不依赖 `react-router-dom`，避免共享包耦合具体应用路由。
- 路由跳转仍由业务前端自己使用 `Link` / `NavLink` 实现。
- 共享组件只承担稳定视觉结构，不放业务数据和业务状态机。
- 对于强业务组件，先在业务应用内稳定两轮，再决定是否上移到共享包。
- 所有新组件需要满足：可键盘聚焦、可读文本对比、触控目标不小于 44px、支持 `prefers-reduced-motion`。

## Next Candidates

后续可继续抽取：

- C 端：`GameCard`、`GameListItem`、`PriceBlock`。
- B 端：`SideNav`、`RiskBadge`、`StateTimeline`、`PermissionMatrix`、`DataTable`。

