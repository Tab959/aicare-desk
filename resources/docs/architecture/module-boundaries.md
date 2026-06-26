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

- 负责：租户上下文、用户、员工、角色、权限、模块可见性、账号状态和认证主体。
- 拥有：tenant、app_user、role、user_role、module_permission、role_module_permission、staff_profile、account_action。
- 公开：身份查询、权限判断、模块菜单查询、账号状态查询。
- 允许依赖：无业务模块。
- 禁止：读取订单、权益、会话或工单私有表。

### catalog

- 负责：Steam 游戏、游戏版本、购买方式、可售方案、分类、媒体资源和可售状态。
- 拥有：game_product、game_version、purchase_method、game_offer、game_media、game_category、game_product_category。
- 公开：游戏查询、版本与可售方案查询、分类查询、首页推荐。
- 允许依赖：identity 的租户上下文。
- 禁止：修改订单、权益或知识索引。

### order

- 负责：演示订单、订单项和支付快照。
- 拥有：order_info、order_item、payment_snapshot。
- 公开：本人订单查询、授权订单摘要、订单项快照查询。
- 允许依赖：identity、catalog 的公开查询。
- 禁止：直接创建权益、退款或工单。

### fulfillment

- 负责：数字权益、CDK 分配、礼物发送/领取、成品账号交付、离线账号交付、授权下载资料交付、交付异常和补发历史。
- 拥有：digital_entitlement、redemption_code、gift_delivery、account_delivery、offline_play_delivery、download_delivery、entitlement_event。
- 公开：权益查询、交付状态查询、管理员补发、权益争议标记。
- 允许依赖：identity、order、notification 的公开端口。
- 发布：EntitlementCreated、EntitlementDelivered、EntitlementReissued、EntitlementDisputed。

### conversation

- 负责：会话、消息、客服队列、接入并发和实时推送。
- 拥有：conversation、chat_message、service_queue_entry。
- 公开：创建会话、发送消息、转人工、接入、关闭、升级工单和消息游标查询。
- 允许依赖：identity、order、fulfillment、agent-gateway。
- 发布：ConversationHumanHandoffRequested、ConversationEscalatedToTicket、ConversationResolved。

### ticket

- 负责：业务工单、分类、状态机、SLA、退款审核、权益补发记录和账号处置工单记录。
- 拥有：work_order、work_order_record、work_order_category、refund_review、reissue_record、account_case_record、sla_policy。
- 公开：建单、处理、关闭、退款审核、补发、账号处置和授权进度查询。
- 允许依赖：identity；通过引用 ID 关联 conversation、order 和 fulfillment。
- 发布：WorkOrderCreated、WorkOrderStatusChanged、RefundReviewed、EntitlementReissueRequested、AccountActionRequested。

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
- 禁止：反向修改工单、权益或账号状态。

### analytics

- 负责：消费业务事件、生成统计投影和看板查询。
- 拥有：统计投影表；不拥有交易真相。
- 公开：按角色、模块和员工权限过滤的指标查询。
- 允许依赖：事件契约和 identity 权限。
- 禁止：同步阻塞核心事务。

### agent-gateway

- 负责：AgentGateway 端口、Mock 实现、远程实现、超时、重试边界、降级和调用审计。
- 拥有：agent_call_log 和调用配置引用。
- 公开：回答生成、摘要、工单草稿、回复推荐和风险建议。
- 允许依赖：identity 的委托上下文、knowledge、order 和 fulfillment 的最小查询接口。
- 禁止：让 Agent 直接执行业务写操作。

## 3. 允许依赖图

~~~mermaid
flowchart TD
    Identity[identity]
    Catalog[catalog]
    Order[order]
    Fulfillment[fulfillment]
    Conversation[conversation]
    Ticket[ticket]
    Knowledge[knowledge]
    Notification[notification]
    Analytics[analytics]
    AgentGateway[agent-gateway]

    Catalog --> Identity
    Order --> Identity
    Order --> Catalog
    Fulfillment --> Identity
    Fulfillment --> Order
    Fulfillment --> Notification
    Conversation --> Identity
    Conversation --> Order
    Conversation --> Fulfillment
    Conversation --> AgentGateway
    Ticket --> Identity
    Knowledge --> Identity
    Knowledge --> Notification
    AgentGateway --> Identity
    AgentGateway --> Order
    AgentGateway --> Fulfillment
    AgentGateway --> Knowledge
    Analytics --> Identity
~~~

ticket 对 conversation、order 和 fulfillment 仅保存稳定引用并通过公开查询获取展示数据，避免形成循环依赖。analytics 通过事件构建投影，不被交易模块同步调用。

## 4. 自动化约束

Stage 2 后续需要同步 Java 包边界和架构测试：旧 `aftersales` 包不再作为核心方向，新的业务语义应落到 `fulfillment`、`ticket` 和 `identity/account` 相关包中。任何新增跨模块依赖必须先更新本文件和对应 ADR，再修改架构测试。
