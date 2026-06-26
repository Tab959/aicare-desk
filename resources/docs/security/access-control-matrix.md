# 访问控制矩阵

## 1. 作用域说明

- `own`：仅主体本人拥有的消费者资源。
- `assigned`：明确分派给当前员工的会话或任务。
- `tenant`：当前平台租户范围内的管理或汇总资源。
- `system`：超级管理员或系统级配置范围。
- `—`：默认拒绝。

## 2. RBAC 矩阵

| 权限 | 消费者 | 客服 | 管理员 | 超级管理员 |
|---|---|---|---|---|
| `game:read` | tenant | tenant | tenant | tenant |
| `order:read-own` | own | assigned | tenant | tenant |
| `entitlement:read-own` | own | assigned | tenant | tenant |
| `conversation:create-own` | own | — | — | — |
| `conversation:accept` | — | assigned | tenant | tenant |
| `conversation:reply` | own | assigned | tenant | tenant |
| `conversation:view-all` | — | — | tenant | tenant |
| `ticket:create` | — | assigned | tenant | tenant |
| `ticket:process` | — | — | tenant | tenant |
| `refund:review` | — | — | tenant | tenant |
| `entitlement:reissue` | — | — | tenant | tenant |
| `account:action` | — | — | tenant | tenant |
| `staff:manage` | — | — | tenant | tenant |
| `knowledge:manage` | — | — | tenant | tenant |
| `analytics:read` | — | assigned | tenant | tenant |
| `role-module:manage` | — | — | — | system |
| `sla:manage` | — | — | — | system |
| `audit:read` | — | — | tenant | system |
| `agent-config:manage` | — | — | — | system |

表中的角色权限是必要条件，不是充分条件。每次业务访问还必须通过资源级规则、状态机、幂等和审计校验。

## 3. 模块可见性矩阵

| 模块 | 客服 | 管理员 | 超级管理员 |
|---|---:|---:|---:|
| 接待队列 | 是 | 是 | 是 |
| 当前会话 | 是 | 是 | 是 |
| 会话监控 | 否 | 是 | 是 |
| 工单中心 | 只可创建/查看本人升级 | 是 | 是 |
| 退款审核 | 否 | 是 | 是 |
| CDK/礼物补发 | 否 | 是 | 是 |
| 账号处置 | 否 | 是 | 是 |
| 客服管理 | 否 | 是 | 是 |
| 知识库 | 只读/命中 | 管理 | 管理 |
| 运营看板 | 个人指标 | 全量 | 全量 |
| 角色模块配置 | 否 | 否 | 是 |
| 系统审计 | 否 | 部分 | 全量 |
| Agent 配置 | 否 | 否 | 是 |

模块可见性由超级管理员配置；默认配置如上。

## 4. 资源级授权规则

### 4.1 租户边界

- 请求上下文必须包含服务端解析的有效 `tenant_id`。
- 查询条件、缓存键、对象存储路径和异步事件必须包含同一租户边界。
- 客户端传入的租户标识只能用于一致性校验，不能覆盖认证上下文。

### 4.2 消费者资源归属

- 订单、数字权益、CDK、礼物、会话、凭证和评价必须校验 `consumer_id`。
- 工单对外进度通过订单、权益或会话关联关系授权，不直接暴露内部工单查询。
- 资源不存在与无权访问时，对消费者返回一致的资源不可用响应，避免枚举。

### 4.3 员工角色边界

- 客服修改会话前必须满足本人接入或当前分派关系。
- 客服可以创建或升级工单，但不能处理退款、补发和账号处置动作。
- 管理员处理高风险动作前必须满足模块权限、动作权限、状态机和二次确认。
- 超级管理员修改角色模块配置时必须保留至少一个拥有系统配置能力的主体。

### 4.4 Agent 委托

- Agent 工具调用携带原始消费者或员工主体、租户、会话和关联 ID。
- Java 对每次工具调用重新执行 RBAC、资源归属、状态机和幂等校验。
- 高风险动作只返回可确认的草稿或建议，需由授权管理员确认后执行。

### 4.5 管理与审计

- 角色模块、退款、权益补发、账号处置、知识发布和 Agent 配置变更必须产生审计事件。
- 管理员和超级管理员不能删除或覆盖审计事件、聊天消息和工单处理历史。
- 导出和汇总查询必须应用租户过滤和字段脱敏。

## 5. 默认策略

系统采用默认拒绝。未在矩阵中明确授予、缺少资源作用域、缺少有效租户上下文或状态不允许的操作全部拒绝，并记录关联 ID 和安全审计信息。
