# 核心数据模型

## 1. 设计目标

核心事务使用 MySQL，优先保证数据完整性、租户隔离、状态一致性和可追踪性。OLTP 表按第三范式设计；看板和搜索使用可重建投影，不在事务表中为展示目的复制可变事实。

## 2. 全局约定

| 项目 | 约定 |
|---|---|
| 内部主键 | BIGINT，无业务含义，由应用统一生成 |
| 对外标识 | 暴露给前端的聚合使用 CHAR(26) ULID public_id，并建立租户内唯一约束 |
| 租户字段 | 租户拥有的表必须有 tenant_id，所有唯一键和主要查询索引包含租户维度 |
| 时间 | DATETIME(3)，应用统一写入 UTC |
| 乐观锁 | 可变聚合使用 INT version，更新时比较并递增 |
| 状态 | VARCHAR(32) 稳定大写字符串，与状态机文档一致 |
| 金额 | DECIMAL(19,2) 加 CHAR(3) currency，不使用 FLOAT/DOUBLE |
| 删除 | 交易和历史表使用 RESTRICT，不物理级联删除；配置和知识内容可使用 deleted_at |
| 审计 | 关键聚合保存 created_by、updated_by；不可变记录保存 actor_type、actor_id 和 correlation_id |
| JSON | 只用于版本化事件负载、模型元数据和低频扩展属性，不能替代明确关系字段 |

## 3. 模块与表归属

### identity

| 表 | 作用 | 关键约束 |
|---|---|---|
| tenant | 企业隔离边界 | code 唯一；MVP 只有一个 ACTIVE 租户 |
| user | 消费者和员工统一身份 | tenant_id + username 唯一；密码只保存强哈希 |
| role | 租户角色 | tenant_id + code 唯一 |
| user_role | 用户角色关系 | tenant_id + user_id + role_id 唯一 |
| department | 部门层级 | tenant_id + code 唯一；parent_id 自引用 RESTRICT |
| staff_profile | 员工扩展与主部门 | tenant_id + user_id 唯一；department_id 必填 |

### catalog

| 表 | 作用 | 关键约束 |
|---|---|---|
| product | 演示商品 | tenant_id + public_id 唯一；status 索引 |
| product_sku | 可下单规格 | tenant_id + sku_code 唯一；product_id 外键和索引 |

### order

| 表 | 作用 | 关键约束 |
|---|---|---|
| order_info | 订单头 | tenant_id + order_no 唯一；consumer_id + created_at 索引 |
| order_item | 订单项快照 | order_id + line_no 唯一；保存成交时商品名、SKU 和单价快照 |
| logistics_snapshot | 物流当前快照 | tenant_id + order_id 唯一；tracking_no 索引；保留 last_event_at |

订单表保存交易快照，不依赖 catalog 当前值重建历史。

### aftersales

| 表 | 作用 | 关键约束 |
|---|---|---|
| aftersales_application | 面向消费者的售后申请 | tenant_id + public_id 唯一；order_item_id + status 索引；idempotency_key 唯一 |
| aftersales_evidence | 凭证元数据 | application_id 外键；tenant_id + object_key 唯一；保存 hash、media_type、size |
| aftersales_review | 不可变审核记录 | application_id + created_at 索引；decision 和 reason 必填 |

### conversation

| 表 | 作用 | 关键约束 |
|---|---|---|
| conversation | 会话聚合 | tenant_id + public_id 唯一；consumer_id + status + updated_at 索引 |
| chat_message | 不可变消息 | conversation_id + sequence_no 唯一；tenant_id + message_key 唯一 |
| service_queue_entry | 客服等待/占用关系 | conversation_id + active 标识保证至多一个活动项；assignee_id 索引 |

消息按会话 sequence_no 稳定排序；message_key 用于处理 WebSocket/MQ 重复投递。

### ticket

| 表 | 作用 | 关键约束 |
|---|---|---|
| work_order | 工单聚合 | tenant_id + public_id 唯一；category_id、status、priority、sla_due_at 组合索引 |
| work_order_assignment | 不可变分派历史 | work_order_id + assigned_at 索引；current 标识至多一条 |
| work_order_record | 不可变处理历史 | work_order_id + sequence_no 唯一；记录状态前后值 |
| work_order_category | 分类配置 | tenant_id + code 唯一；支持 deleted_at |
| sla_policy | SLA 配置 | tenant_id + category_id + priority 唯一；支持版本和 deleted_at |

work_order 可保存 conversation_id、order_id、aftersales_application_id 的可空外键，但至少有一个业务来源，并通过 CHECK 或应用级约束验证。

### knowledge

| 表 | 作用 | 关键约束 |
|---|---|---|
| knowledge_base | 知识空间 | tenant_id + code 唯一；支持发布状态 |
| knowledge_document | 原始文档元数据与解析状态 | tenant_id + public_id 唯一；base_id + content_hash 唯一 |
| knowledge_chunk | 分块元数据 | document_id + chunk_no 唯一；保存 Elasticsearch document_id 和 embedding_version |

二进制内容只存 MinIO；全文和向量索引只存 Elasticsearch；MySQL 保存可恢复索引所需的来源与版本。

### notification、analytics 与审计

| 表 | 作用 | 关键约束 |
|---|---|---|
| notification | 站内通知与投递状态 | recipient_id + status + created_at 索引；deduplication_key 唯一 |
| satisfaction_rating | 唯一服务评价 | tenant_id + business_type + business_id + consumer_id 唯一 |
| operation_audit | 不可变操作审计 | tenant_id + occurred_at、actor_id + occurred_at、correlation_id 索引 |
| agent_call_log | Agent 调用审计 | tenant_id + conversation_id + created_at 索引；保存模型、提示版本、耗时、结果状态 |
| outbox_event | 事务外盒 | status + available_at 索引；tenant_id + event_id 唯一 |
| analytics_projection | 轻量聚合投影 | tenant_id + metric_date + metric_type + dimension_key 唯一 |

## 4. 核心关系图

~~~mermaid
erDiagram
    TENANT ||--o{ USER : owns
    TENANT ||--o{ DEPARTMENT : owns
    USER ||--o| STAFF_PROFILE : has
    USER ||--o{ ORDER_INFO : places
    ORDER_INFO ||--|{ ORDER_ITEM : contains
    ORDER_INFO ||--o| LOGISTICS_SNAPSHOT : tracks

    USER ||--o{ CONVERSATION : starts
    CONVERSATION ||--o{ CHAT_MESSAGE : contains
    CONVERSATION ||--o{ SERVICE_QUEUE_ENTRY : queues

    ORDER_ITEM ||--o{ AFTERSALES_APPLICATION : requests
    AFTERSALES_APPLICATION ||--o{ AFTERSALES_EVIDENCE : attaches
    AFTERSALES_APPLICATION ||--o{ AFTERSALES_REVIEW : reviews

    WORK_ORDER_CATEGORY ||--o{ WORK_ORDER : classifies
    WORK_ORDER ||--o{ WORK_ORDER_ASSIGNMENT : assigns
    WORK_ORDER ||--o{ WORK_ORDER_RECORD : records
    SLA_POLICY ||--o{ WORK_ORDER : governs
    CONVERSATION o|--o{ WORK_ORDER : originates
    AFTERSALES_APPLICATION o|--o{ WORK_ORDER : follows

    KNOWLEDGE_BASE ||--o{ KNOWLEDGE_DOCUMENT : contains
    KNOWLEDGE_DOCUMENT ||--o{ KNOWLEDGE_CHUNK : splits

    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ SATISFACTION_RATING : submits
    CONVERSATION ||--o{ AGENT_CALL_LOG : audits
~~~

## 5. 关键访问模式与索引

| 访问模式 | 索引 |
|---|---|
| 消费者按时间查看订单 | order_info(tenant_id, consumer_id, created_at DESC, id) |
| 按订单号查询 | UNIQUE order_info(tenant_id, order_no) |
| 消费者查看活动会话 | conversation(tenant_id, consumer_id, status, updated_at DESC) |
| 消息游标补拉 | UNIQUE chat_message(conversation_id, sequence_no) |
| 客服等待队列 | service_queue_entry(tenant_id, status, enqueued_at, id) |
| 防止活动队列重复 | conversation_id 与活动标识的受控唯一策略 |
| 售后重复提交 | UNIQUE aftersales_application(tenant_id, idempotency_key) |
| 部门工单列表 | work_order(tenant_id, current_department_id, status, priority, updated_at DESC) |
| SLA 扫描 | work_order(tenant_id, status, sla_due_at) |
| 工单时间线 | UNIQUE work_order_record(work_order_id, sequence_no) |
| 知识文档去重 | UNIQUE knowledge_document(knowledge_base_id, content_hash) |
| 通知去重 | UNIQUE notification(tenant_id, deduplication_key) |
| 外盒投递 | outbox_event(status, available_at, id) |
| 审计关联查询 | operation_audit(tenant_id, correlation_id, occurred_at) |

MySQL 无通用部分唯一索引时，活动队列项和当前分派使用独立 current_slot 表、生成列或事务内锁策略实现，具体方案在数据库 PoC 后由 ADR 固化。

## 6. 外键与删除策略

1. 所有外键列建立索引。
2. 订单、售后、会话、工单、消息、处理记录、审计和 Agent 日志使用 ON DELETE RESTRICT。
3. user_role 等纯关系表可在删除尚未产生业务历史的测试账号时使用受控 CASCADE。
4. 已参与业务历史的 user、department、category 不删除，改为禁用。
5. 知识文档删除先标记 deleted_at 并发布索引删除事件，对象存储清理由保留策略异步执行。
6. 跨模块外键只表达稳定聚合引用，不允许通过 ORM 自动级联更新整个对象图。

## 7. 迁移安全

- 使用 Flyway 版本化迁移；已应用迁移不可修改。
- 新增必填列采用“先可空或带安全默认值、回填、代码双写/读取、最后收紧约束”的扩展-收缩流程。
- 大表索引在验证执行计划和锁影响后上线。
- 状态枚举扩展必须保持旧版本可读取，新旧应用滚动期间不得复用既有状态含义。
- 每次迁移在 Testcontainers MySQL 上从空库执行，并从上一版本快照升级验证。
- 备份恢复与索引重建流程在 Stage 7 演练。

## 8. 设计检查结论

- 所有表有主键，所有关系字段有外键或明确的跨存储引用策略。
- 所有外键和高频过滤字段具有索引计划。
- 金额、时间、状态、租户、乐观锁和审计字段有统一约定。
- 交易历史不依赖软删除或级联删除。
- 搜索和统计是可重建投影，不成为核心业务真相。

