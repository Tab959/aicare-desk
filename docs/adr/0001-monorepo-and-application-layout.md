# ADR-0001：单仓库与四应用布局

- 状态：Accepted
- 日期：2026-06-22

## 背景

系统包含两个 React 前端、一个 Spring Boot 后端和一个 Python Agent。个人开发需要共享前端设计系统、OpenAPI 契约、基础设施、文档和统一 CI，同时希望四个应用保持独立构建与部署。

## 决策

使用一个 GitHub 仓库 aicare-desk，目录为：

- apps/customer-web
- apps/staff-web
- services/platform-api
- services/agent-service
- packages/ui
- packages/api-client
- packages/shared
- infra
- docs

四个应用使用独立构建产物和部署镜像。仓库名称与应用名称分离，Canonical 应用名称为 aicare-customer-web、aicare-staff-web、aicare-platform-api 和 aicare-agent-service。

## 理由

- OpenAPI、共享类型和跨应用业务变化可以原子提交。
- 两个前端共享设计令牌、组件和 API 客户端，不需要额外发布私有 npm 包。
- 单一 Issues、Projects、CI 和作品入口更适合个人开发与简历展示。
- 统一基础设施和文档降低本地环境及版本漂移。

## 后果

- CI 必须按路径识别受影响应用，避免每次构建全部项目。
- 模块所有权和依赖规则必须通过目录、契约和测试维护，不能因单仓库而随意跨边界引用。
- 仓库权限不能独立分配给某个应用，这是当前单人项目可接受的限制。

## 重新评估条件

当不同团队拥有独立发布节奏、访问权限、合规边界或仓库规模使 CI 明显不可控时，重新评估拆仓。拆仓前必须先把共享契约和包发布流程产品化。

