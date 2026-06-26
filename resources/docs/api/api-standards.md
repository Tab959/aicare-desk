# API 设计规范

## 1. 基础约定

- 基础路径：/api/v1。
- 传输：HTTPS；开发环境允许受控 HTTP。
- JSON 字段：camelCase。
- 时间：UTC ISO-8601，精确到毫秒。
- 对外资源标识：ULID 字符串，不暴露数据库自增顺序。
- 关联 ID：客户端可发送 X-Correlation-ID；服务端校验格式或生成新值，并在响应、日志、事件和 Agent 调用中传播。
- 内容类型：application/json；普通业务接口不直接承载大文件。游戏图片、知识文档等文件类资源优先使用“后端签名、前端直传对象存储、后端确认绑定”的上传模式。
- 接口文档：OpenAPI 是前后端契约源，customer-web 和 staff-web 共用生成客户端。

当前阶段 2 的 OpenAPI 初版契约文件为：

- `resources/docs/api/openapi-v1.yaml`
- `resources/docs/api/frontend-contract-map.md`

## 2. 身份与租户

1. 服务端从认证令牌解析主体和 tenantId，禁止客户端覆盖。
2. 消费者接口执行 own 资源校验；员工接口执行 assigned、tenant 或 system 作用域校验。
3. Agent 工具接口使用服务间身份，并携带不可伪造的委托主体上下文。
4. 认证失败返回 401；角色或资源范围不足返回 403；对消费者需防枚举时返回统一资源不可用响应。

## 3. 资源与动作

- 资源查询和创建使用名词路径，例如 POST /api/v1/conversations。
- 状态机动作使用显式子资源，例如 POST /api/v1/work-orders/{id}/transitions。
- 接入、转派、确认等具有业务语义的动作使用动作端点并要求幂等键。
- 批量接口必须定义单项结果，不使用模糊的全有或全无行为。
- 删除只用于允许删除的配置或草稿；交易记录使用状态变更。

## 4. 分页、过滤和排序

列表默认使用游标分页：

~~~json
{
  "items": [],
  "page": {
    "nextCursor": "opaque-value",
    "hasMore": false
  }
}
~~~

- limit 默认 20，最大 100。
- cursor 是不透明值，客户端不得解析。
- 过滤参数使用明确名称，例如 status、departmentId、createdFrom。
- 排序只允许服务端白名单字段；默认按 createdAt DESC、id DESC 稳定排序。
- 管理后台需要总数时使用独立 count 或统计端点，避免每次列表查询执行昂贵总数。

## 5. 幂等与并发

- 创建会话、转人工、接入会话、创建工单、退款审核、权益补发、账号处置、状态迁移和评价使用 Idempotency-Key。
- 服务端在 tenantId、actorId、operation 和 key 维度保存请求摘要与结果。
- 相同键和相同请求返回首次结果；相同键但请求体不同返回 409。
- 可变聚合响应包含 version；修改命令提交 expectedVersion。
- 乐观锁冲突返回 409，响应包含最新 version 和稳定错误码。

## 6. 错误结构

~~~json
{
  "code": "TICKET_ILLEGAL_STATE_TRANSITION",
  "message": "The work order cannot transition from CLOSED to IN_PROGRESS.",
  "details": [],
  "correlationId": "01JEXAMPLE",
  "timestamp": "2026-06-22T08:00:00.000Z"
}
~~~

| HTTP | 含义 | 示例错误码 |
|---|---|---|
| 400 | 格式、字段或文件校验失败 | VALIDATION_FAILED |
| 401 | 未认证或令牌失效 | AUTHENTICATION_REQUIRED |
| 403 | 角色、租户或资源作用域不足 | ACCESS_DENIED |
| 404 | 可安全公开的资源不存在 | RESOURCE_NOT_FOUND |
| 409 | 状态、版本、幂等或唯一约束冲突 | TICKET_ILLEGAL_STATE_TRANSITION |
| 413 | 上传文件超过限制 | FILE_TOO_LARGE |
| 429 | 频率限制 | RATE_LIMITED |
| 503 | Agent、搜索或消息依赖暂时不可用 | DEPENDENCY_UNAVAILABLE |

details 是结构化字段错误或冲突上下文，不包含堆栈、SQL、密钥或内部路径。

## 7. AgentGateway 契约

### 7.1 通用请求上下文

~~~json
{
  "tenantId": "01JTENANT",
  "actor": {
    "type": "CONSUMER",
    "id": "01JUSER"
  },
  "conversationId": "01JCONVERSATION",
  "locale": "zh-CN",
  "correlationId": "01JCORRELATION"
}
~~~

### 7.2 操作

| 操作 | 目的 | 关键输入 | 关键输出 |
|---|---|---|---|
| generateAnswer | 生成消费者答复 | 当前消息、授权上下文、可用工具 | answer、citations、handoffRequested、intent |
| summarizeConversation | 生成会话摘要 | 有序消息、业务引用 | summary、facts、openQuestions |
| draftWorkOrder | 生成工单草稿 | 会话摘要、订单/权益摘要、分类候选 | title、description、categoryCode、prioritySuggestion、riskSuggestion |
| recommendReply | 推荐客服回复 | 会话、最新业务结果 | suggestedReply、citations、warnings |

### 7.3 通用响应

响应必须包含 result、citations、modelInfo、promptVersion、latencyMs、finishReason 和 safetyFlags。结果不构成业务写操作；platform-api 重新校验并由消费者或员工确认。

### 7.4 超时与降级

- generateAnswer 总超时 15 秒，其余离线型操作可使用异步任务。
- 超时、429、5xx 或格式无效时，agent-gateway 记录调用失败并返回可预测降级结果。
- 不对非幂等 Agent 工具调用进行隐式无限重试。
- Mock 和远程实现必须满足同一 Java 端口和契约测试。

## 8. WebSocket 与消息恢复

- 连接建立后先校验认证和会话访问权。
- 客户端发送 messageKey，服务端返回持久化 messageId 和 sequenceNo。
- 推送只表示通知，消息列表以持久化查询为准。
- 重连使用 afterSequence 游标补拉，禁止只依赖内存中的未读状态。

## 9. 文件上传与阿里云 OSS

管理员配置游戏封面、截图、详情图时，不通过 Java 后端转发图片文件。标准流程如下：

1. B 端调用 `POST /api/v1/staff/uploads/presign`，提交文件名、contentType、size、purpose 和业务上下文。
2. Java 后端校验员工权限、文件类型、文件大小和上传用途，生成 `uploadId`、`objectKey` 和短期上传凭证。
3. B 端浏览器直传阿里云 OSS Bucket。
4. B 端调用 `POST /api/v1/staff/uploads/{uploadId}/complete`。
5. Java 后端通过 OSS HEAD object 校验对象大小、类型、ETag 或 checksum，写入 `upload_asset`。
6. B 端调用 `POST /api/v1/staff/games/{gameId}/media`，将上传资产绑定为游戏媒体，写入 `game_media` 并记录审计。

约束：

- 禁止把阿里云 AccessKey 明文返回给前端；只允许短期预签名 URL 或 STS 临时凭证。
- OSS Bucket 默认私有；对 C 端展示使用 CDN 域名、签名 URL 或后端生成的可访问 URL。
- objectKey 必须由服务端生成，建议格式：`tenant/{tenantId}/games/{gameId}/media/{ulid}.{ext}`。
- 服务端限制 `image/webp`、`image/jpeg`、`image/png`，并限制单文件大小和单游戏图片数量。
- 上传完成必须执行 complete 校验，不能只相信前端声明。
- 删除游戏图片优先解除业务绑定；OSS 物理删除由异步任务或生命周期策略处理。
