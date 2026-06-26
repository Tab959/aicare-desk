# Repository Layout

本项目采用前后端分区结构。根目录只保留核心入口：`frontend/`、`backend/`、`resources/` 和 `阶段性文档.md`。Git 自身仍需要隐藏的 `.git/`，根目录 `.gitignore` 建议保留用于版本控制忽略规则。

## 一级目录

- `frontend/`：所有前端应用。
  - `frontend/customer-web`：消费者端游戏商城。
  - `frontend/staff-web`：客服与管理端控制台。
  - `frontend/packages`：前端共享 TypeScript 包。
  - `frontend/node_modules`：前端本地依赖。
  - `frontend/package.json`、`frontend/pnpm-workspace.yaml`、`frontend/pnpm-lock.yaml`、`frontend/tsconfig.base.json`：前端 workspace 配置。
- `backend/`：所有后端服务。
  - `backend/platform-api`：Java Spring Boot 核心业务后端。
  - `backend/agent-service`：Python Agent 服务，后续开发。
- `resources/`：资料、部署和脚本。
  - `resources/docs`：产品、架构、阶段、设计和计划文档。
  - `resources/deploy`：部署与 Docker Compose 配置。
  - `resources/scripts`：本地验证、启动、停止和 VM 检查脚本。
  - `resources/config`：通用配置示例和编辑器配置。

## 根目录保留文件

- `阶段性文档.md`：阶段进度记录。
- `.gitignore`：Git 忽略规则，建议保留在仓库根目录。

## 已清理或移动的内容

- 根目录 `node_modules/` 已删除，依赖重建到 `frontend/node_modules/`。
- `.superpowers/` 已删除。
- `.worktrees/` 已删除。
- `docs/`、`deploy/`、`scripts/` 已移动到 `resources/`。
- `packages/` 已移动到 `frontend/packages/`。
