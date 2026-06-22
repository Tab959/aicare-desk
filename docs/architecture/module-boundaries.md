# Java 模块边界

platform-api 是一个按业务能力组织的 Spring Boot 模块化单体。模块可以共享一个 MySQL 实例，但不能共享私有 Repository、领域对象或可变表所有权。

## 1. 分层规则

~~~text
web adapters -> application services -> domain
infrastructure adapters -> application ports
domain -> no framework or infrastructure dependency
~~~

- Web 适配器负责协议、身份上下文解析、输入校验和响应映射。
- 应用服务负责用例编排、事务边界、授权和跨模块公开接口。
- 领域层负责状态机、不变量和值对象。
- 基础设施适配器实现数据库、缓存、消息、对象存储、搜索和远程 Agent 端口。
- 跨模块写操作只能调用对方公开应用服务或消费领域事件，不允许直接使用对方 Repository。

## 2. 模块清单

### identity

- 负责：租户上下文、用户、员工、角色、权限、部门和认证主体。
- 拥有：tenant、user、role、user_role、department、staff_profile。
- 公开：身份查询、权限判断、部门成员查询。
- 允许依赖：无业务模块。
- 禁止：读取订单、会话或工单私有表。

### catalog

- 负责：演示商品、SKU、商品参数和可售状态。
- 拥有：product、product_sku。
- 公开：商品查询和商品摘要。
- 允许依赖：identity 的租户上下文。
- 禁止：修改订单或知识索引。

### order

- 负责：演示订单、订单项和物流快照。
- 拥有：order_info、order_item、logistics_snapshot。
- 公开：本人订单查询、授权订单摘要、物流状态查询。
- 允许依赖：identity、catalog 的公开查询。
- 禁止：直接创建售后或工单。

### aftersales

- 负责：退款、退货、换货、质量申请、凭证和审核。
- 拥有：aftersales_application、aftersales_evidence、aftersales_review。
- 公开：提交、审核、取消和对外进度查询。
- 允许依赖：identity、order、notification 的公开端口。
- 发布：AfterSalesSubmitted、AfterSalesApproved、AfterSalesCompleted。

### conversation

- 负责：会话、消息、客服队列、接入并发和实时推送。
- 拥有：conversation、chat_message、service_queue_entry。
- 公开：创建会话、发送消息、转人工、接入、关闭和消息游标查询。
- 允许依赖：identity、order、agent-gateway。
- 发布：ConversationHumanHandoffRequested、ConversationResolved。

### ticket

- 负责：工单、分类、分派、状态机、SLA 和处理历史。
- 拥有：work_order、work_order_assignment、work_order_record、work_order_category、sla_policy。
- 公开：建单、分派、转派、处理、关闭和授权进度查询。
- 允许依赖：identity；通过引用 ID 关联 conversation、order 和 aftersales。
- 发布：WorkOrderCreated、WorkOrderAssigned、WorkOrderStatusChanged。

### knowledge

- 负责：知识库、文档元数据、解析状态、索引请求和检索。
- 拥有：knowledge_base、knowledge_document、knowledge_chunk_metadata。
- 公开：上传、发布、检索和来源查询。
- 允许依赖：identity、notification。
- 基础设施：MinIO 和 Elasticsearch 通过端口接入。

### notification

- 负责：站内通知、投递状态、重试和外部通知适配。
- 拥有：notification。
- 公开：请求通知、查询本人通知、确认已读。
- 允许依赖：identity。
- 禁止：反向修改工单或售后状态。

### analytics

- 负责：消费业务事件、生成统计投影和看板查询。
- 拥有：统计投影表；不拥有交易真相。
- 公开：按租户、部门和员工权限过滤的指标查询。
- 允许依赖：事件契约和 identity 权限。
- 禁止：同步阻塞核心事务。

### agent-gateway

- 负责：AgentGateway 端口、Mock 实现、远程实现、超时、重试边界、降级和调用审计。
- 拥有：agent_call_log 和调用配置引用。
- 公开：回答生成、摘要、工单草稿和回复推荐。
- 允许依赖：identity 的委托上下文、knowledge 和 order 的最小查询接口。
- 禁止：让 Agent 直接执行业务写操作。

## 3. 允许依赖图

~~~mermaid
flowchart TD
    Identity[identity]
    Catalog[catalog]
    Order[order]
    Aftersales[aftersales]
    Conversation[conversation]
    Ticket[ticket]
    Knowledge[knowledge]
    Notification[notification]
    Analytics[analytics]
    AgentGateway[agent-gateway]

    Catalog --> Identity
    Order --> Identity
    Order --> Catalog
    Aftersales --> Identity
    Aftersales --> Order
    Aftersales --> Notification
    Conversation --> Identity
    Conversation --> Order
    Conversation --> AgentGateway
    Ticket --> Identity
    Knowledge --> Identity
    Knowledge --> Notification
    AgentGateway --> Identity
    AgentGateway --> Order
    AgentGateway --> Knowledge
    Analytics --> Identity
~~~

ticket 对 conversation、order 和 aftersales 仅保存稳定引用并通过公开查询获取展示数据，避免形成循环依赖。analytics 通过事件构建投影，不被交易模块同步调用。

## 4. 自动化约束

Stage 1 使用 Spring Modulith 验证或 ArchUnit 测试固化模块依赖。任何新增跨模块依赖必须先更新本文件和对应 ADR，再修改架构测试。

