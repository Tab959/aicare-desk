# 访问控制矩阵

## 1. 作用域说明

- `own`：仅主体本人拥有的消费者资源。
- `assigned`：明确分派给当前员工的资源。
- `department`：分派给当前员工所属部门的资源。
- `tenant`：当前企业租户范围内的管理或汇总资源。
- `—`：默认拒绝。

## 2. RBAC 矩阵

| 权限 | 消费者 | 人工客服 | 售后 | 仓库 | 物流 | 财务 | 管理员 |
|---|---|---|---|---|---|---|---|
| `product:read` | tenant | tenant | tenant | tenant | tenant | tenant | tenant |
| `order:read-own` | own | assigned | department | department | department | department | tenant |
| `conversation:create-own` | own | — | — | — | — | — | — |
| `conversation:accept` | — | assigned | — | — | — | — | tenant |
| `conversation:reply` | own | assigned | — | — | — | — | tenant |
| `aftersales:create-own` | own | assigned | — | — | — | — | tenant |
| `aftersales:review` | — | — | assigned/department | — | — | — | tenant |
| `ticket:create` | — | assigned | department | department | department | department | tenant |
| `ticket:assign` | — | — | department | department | department | department | tenant |
| `ticket:process` | — | assigned | assigned/department | assigned/department | assigned/department | assigned/department | tenant |
| `ticket:close` | — | assigned | assigned/department | assigned/department | assigned/department | assigned/department | tenant |
| `knowledge:manage` | — | — | — | — | — | — | tenant |
| `sla:manage` | — | — | — | — | — | — | tenant |
| `analytics:read` | — | assigned | department | department | department | department | tenant |
| `audit:read` | — | — | — | — | — | — | tenant |

表中的角色权限是必要条件，不是充分条件。每次业务访问还必须通过以下资源级规则。

## 3. 资源级授权规则

### 3.1 租户边界

- 请求上下文必须包含服务端解析的有效 `tenant_id`。
- 查询条件、缓存键、对象存储路径和异步事件必须包含同一租户边界。
- 客户端传入的租户标识只能用于一致性校验，不能覆盖认证上下文。

### 3.2 消费者资源归属

- 订单、会话、售后申请、凭证和评价必须校验 `consumer_id`。
- 工单对外进度通过售后申请或会话关联关系授权，不直接暴露内部工单查询。
- 资源不存在与无权访问时，对消费者返回一致的资源不可用响应，避免枚举。

### 3.3 员工分派与部门

- 员工修改会话或工单前必须满足本人分派、部门分派或管理员租户权限之一。
- 当前状态机必须允许该动作；拥有角色但状态不允许时返回业务冲突。
- 转派操作记录原责任人、新责任人、原因、时间和操作者。

### 3.4 Agent 委托

- Agent 工具调用携带原始消费者或员工主体、租户、会话和关联 ID。
- Java 对每次工具调用重新执行 RBAC、资源归属、状态机和幂等校验。
- 高风险动作只返回可确认的草稿或建议，需由消费者或授权员工确认后执行。

### 3.5 管理与审计

- 角色、部门、SLA、知识发布和 Agent 配置变更必须产生审计事件。
- 管理员不能删除或覆盖审计事件、聊天消息和工单处理历史。
- 导出和汇总查询必须应用租户过滤和字段脱敏。

## 4. 默认策略

系统采用默认拒绝。未在矩阵中明确授予、缺少资源作用域、缺少有效租户上下文或状态不允许的操作全部拒绝，并记录关联 ID 和安全审计信息。
