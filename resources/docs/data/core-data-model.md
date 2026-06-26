# 核心数据模型

## 1. 设计目标

核心事务使用 MySQL，优先保证数据完整性、租户隔离、状态一致性和可追踪性。业务域调整为游戏数字商品后，核心数据从“实物商品/物流/售后申请”转向“游戏商品/数字权益/CDK/礼物/退款/账号处置/工单”。

当前阶段 2 的 MySQL DDL 草案文件为 `resources/docs/data/mysql-schema-v1-draft.sql`。该文件用于反推接口、Mock 数据和后端实体边界，暂不作为 Flyway 正式迁移脚本。

当前 DDL 草案覆盖 MVP 闭环：

- 身份、角色和模块权限。
- 游戏商品、版本、购买方式、可售方案、媒体和分类。
- 上传资产记录与游戏媒体绑定。
- 订单、支付快照和数字权益。
- CDK、礼物交付和权益事件。
- 客服会话、消息和接待队列。
- 工单、处理记录、退款审核、补发记录和账号处置记录。
- 知识库、Agent 调用日志和操作审计。

后续生产化阶段再补充通知、outbox、统计投影、搜索索引同步等非核心真相表。

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
| 删除 | 交易、权益、工单、会话和审计表使用 RESTRICT；配置和知识内容可使用 deleted_at |
| 审计 | 关键聚合保存 created_by、updated_by；不可变记录保存 actor_type、actor_id 和 correlation_id |
| JSON | 只用于版本化事件负载、媒体资源、模型元数据和低频扩展属性，不能替代明确关系字段 |

## 3. 模块与表归属

本节分两层阅读：

1. `3.0 当前 DDL 物理表清单` 是 `mysql-schema-v1-draft.sql` 当前已经设计的完整物理表清单。
2. 后续各模块表格是业务归属说明，其中会标注少量生产化预留表；预留表不一定已经进入当前 DDL。

### 3.0 当前 DDL 物理表清单

当前 DDL 草案共 37 张表：

| 模块 | 当前已落表 |
|---|---|
| identity | tenant、app_user、role、user_role、module_permission、role_module_permission |
| catalog | game_product、game_version、purchase_method、game_offer、game_media、game_category、game_product_category |
| storage | upload_asset |
| order | order_info、order_item、payment_snapshot |
| fulfillment | digital_entitlement、entitlement_event、redemption_code、gift_delivery、account_delivery、offline_play_delivery、download_delivery |
| conversation | conversation、chat_message、service_queue_entry |
| ticket | work_order、work_order_record、refund_review、reissue_record、account_case_record |
| knowledge | knowledge_base、knowledge_document、knowledge_chunk |
| agent 与审计 | agent_call_log、operation_audit |

暂未进入当前 DDL、只作为后续生产化预留的表包括：staff_profile、account_action、work_order_category、sla_policy、notification、satisfaction_rating、outbox_event、analytics_projection。

### identity

| 表 | 作用 | 关键约束 |
|---|---|---|
| tenant | 平台隔离边界 | code 唯一；MVP 只有一个 ACTIVE 租户 |
| app_user | 消费者和员工统一身份 | tenant_id + username 唯一；密码只保存强哈希 |
| role | 租户角色 | tenant_id + code 唯一 |
| user_role | 用户角色关系 | tenant_id + user_id + role_id 唯一 |
| module_permission | 租户内可授权模块配置 | tenant_id + module_code 唯一；由超级管理员维护 |
| role_module_permission | 角色与模块权限关系 | tenant_id + role_id + module_permission_id 唯一；角色和授权模块多对多 |
| staff_profile | 后续预留：员工扩展资料 | tenant_id + user_id 唯一；保存客服状态和管理员标记 |
| account_action | 后续预留：账号处置历史 | user_id + sequence_no 唯一；不可变 |

### catalog

| 表 | 作用 | 关键约束 |
|---|---|---|
| game_product | Steam 游戏商品 | tenant_id + public_id 唯一；status 索引 |
| game_version | 游戏版本，例如标准版、豪华版、年度版、DLC 合集 | product_id + version_code 唯一；支持版本上下架 |
| purchase_method | 购买方式字典，例如 CDK、Steam 礼物、成品账号、离线账号游玩、授权下载资料 | tenant_id + code 唯一；支持后续扩展 |
| game_offer | 游戏可售方案，是游戏版本与购买方式的多对多关系表 | version_id + purchase_method_id 唯一；保存库存、价格和交付处理器 |
| game_media | 游戏截图、封面、详情图等业务媒体绑定 | product_id + sort_order 唯一；upload_asset_id 唯一 |
| game_category | 游戏分类/标签 | tenant_id + code 唯一 |
| game_product_category | 商品分类关系 | product_id + category_id 唯一 |

### storage

| 表 | 作用 | 关键约束 |
|---|---|---|
| upload_asset | 阿里云 OSS 上传对象记录 | tenant_id + provider + bucket_name + object_key 唯一；uploader_id 索引 |

管理员上传游戏图片时，Java 后端签发短期上传凭证，B 端浏览器直传 OSS。上传完成后后端校验 OSS object 并写入 upload_asset，再由 game_media 绑定到具体游戏。game_media 是业务可见媒体，upload_asset 是对象存储事实记录，两者分离，避免未绑定临时对象污染商品媒体关系。

### order

| 表 | 作用 | 关键约束 |
|---|---|---|
| order_info | 订单头 | tenant_id + order_no 唯一；consumer_id + created_at 索引 |
| order_item | 订单项快照 | order_id + line_no 唯一；保存成交时游戏、版本、购买方式、平台和价格快照 |
| payment_snapshot | 演示支付快照 | tenant_id + order_id 唯一；不对接真实支付 |

MVP 中一个订单只对应一个订单项，即一个订单只购买一种可售方案；后续如果要支持购物车多商品结算，再移除 order_item(order_id) 的唯一约束。订单表保存交易快照，不依赖 catalog 当前值重建历史。

### fulfillment

| 表 | 作用 | 关键约束 |
|---|---|---|
| digital_entitlement | 数字权益聚合 | tenant_id + public_id 唯一；consumer_id + status 索引 |
| redemption_code | CDK 库存与状态 | tenant_id + code_hash 唯一；明文不落普通日志 |
| gift_delivery | 礼物发送与领取状态 | tenant_id + gift_no 唯一；sender_id、receiver_hint 索引 |
| account_delivery | 成品账号交付状态 | entitlement_id 唯一；账号凭据必须加密保存 |
| offline_play_delivery | 离线账号游玩交付状态 | entitlement_id 唯一；保存离线账号/设备/有效期等交付信息 |
| download_delivery | 授权下载资料交付状态 | entitlement_id 唯一；保存下载链接摘要和过期时间 |
| entitlement_event | 权益交付/兑换/补发历史 | entitlement_id + sequence_no 唯一 |

CDK、账号凭据、离线账号信息和下载链接都属于敏感交付内容，只能在安全边界内短暂展示；数据库保存加密值、哈希、摘要或受控访问引用，具体加密方案在安全实现阶段固化。下载型交付仅用于授权资料或演示资料。

### conversation

| 表 | 作用 | 关键约束 |
|---|---|---|
| conversation | 会话聚合 | tenant_id + public_id 唯一；consumer_id + status + updated_at 索引 |
| chat_message | 不可变消息 | conversation_id + sequence_no 唯一；tenant_id + message_key 唯一 |
| service_queue_entry | 客服等待/占用关系 | conversation_id + active 标识保证至多一个活动项；assignee_id 索引 |

### ticket

| 表 | 作用 | 关键约束 |
|---|---|---|
| work_order | 工单聚合 | tenant_id + public_id 唯一；强制关联 order_id、order_item_id、entitlement_id、offer_id 和 purchase_method_id |
| work_order_record | 不可变处理历史 | work_order_id + sequence_no 唯一；记录状态前后值和动作原因 |
| work_order_category | 后续预留：分类配置 | tenant_id + code 唯一；支持 deleted_at |
| refund_review | 退款审核记录 | work_order_id 唯一；保存规则快照、结论和原因 |
| reissue_record | CDK/礼物补发记录 | work_order_id + sequence_no 唯一 |
| account_case_record | 账号处置工单记录 | work_order_id + sequence_no 唯一 |
| sla_policy | 后续预留：SLA 配置 | tenant_id + category_id + priority 唯一；支持版本和 deleted_at |

work_order 必须由订单产生，并绑定到唯一订单项、可售方案和数字权益。conversation_id 只是来源会话，可为空；order_id、order_item_id、entitlement_id、offer_id、purchase_method_id 必须存在，用于把 CDK、礼物、成品账号、离线账号和下载型交付的售后处理分开路由。

### knowledge

| 表 | 作用 | 关键约束 |
|---|---|---|
| knowledge_base | 知识空间 | tenant_id + code 唯一；支持发布状态 |
| knowledge_document | 原始文档元数据与解析状态 | tenant_id + public_id 唯一；base_id + content_hash 唯一 |
| knowledge_chunk | 分块元数据 | document_id + chunk_no 唯一；保存 Elasticsearch document_id 和 embedding_version |

### notification、analytics 与审计

| 表 | 作用 | 关键约束 |
|---|---|---|
| notification | 后续预留：站内通知与投递状态 | recipient_id + status + created_at 索引；deduplication_key 唯一 |
| satisfaction_rating | 后续预留：唯一服务评价 | tenant_id + business_type + business_id + consumer_id 唯一 |
| operation_audit | 不可变操作审计 | tenant_id + occurred_at、actor_id + occurred_at、correlation_id 索引 |
| agent_call_log | Agent 调用审计 | tenant_id + conversation_id + created_at 索引；保存模型、提示版本、耗时、结果状态 |
| outbox_event | 后续预留：事务外盒 | status + available_at 索引；tenant_id + event_id 唯一 |
| analytics_projection | 后续预留：轻量聚合投影 | tenant_id + metric_date + metric_type + dimension_key 唯一 |

## 4. 核心关系图

ER 图改用 Chen 风格，和截图一致：

- 矩形表示实体 Entity。
- 菱形表示关系 Relationship。
- 椭圆表示关键属性 Attribute。
- 边上的 `1`、`n`、`0..1` 表示基数 Cardinality。

当前 DDL 有 37 张表，如果全部塞进一张 Chen 图，可读性会很差。因此本节按业务域拆成 4 张图；实体和关系均使用中英文双语。

### 4.1 身份、权限与上传 Identity / Permission / Upload

~~~mermaid
flowchart LR
    T["租户<br/>TENANT"]
    T_CODE(["编码<br/>code"])
    T_STATUS(["状态<br/>status"])

    U["用户<br/>APP_USER"]
    U_NAME(["用户名<br/>username"])
    U_TYPE(["用户类型<br/>user_type"])

    R["角色<br/>ROLE"]
    R_CODE(["角色编码<br/>code"])

    UR["用户角色关系<br/>USER_ROLE"]
    MP["模块权限<br/>MODULE_PERMISSION"]
    RMP["角色模块权限<br/>ROLE_MODULE_PERMISSION"]
    UA["上传资产<br/>UPLOAD_ASSET"]
    AUDIT["操作审计<br/>OPERATION_AUDIT"]

    REL_TU{"拥有用户<br/>owns users"}
    REL_TR{"拥有角色<br/>owns roles"}
    REL_UR_U{"分配角色<br/>assigns role"}
    REL_UR_R{"引用角色<br/>references role"}
    REL_TM{"配置模块<br/>configures module"}
    REL_RMP_R{"角色绑定权限<br/>role binds permission"}
    REL_RMP_M{"模块被授权<br/>module is granted"}
    REL_UPLOAD{"上传对象<br/>uploads asset"}
    REL_AUDIT{"产生审计<br/>creates audit"}

    T --- T_CODE
    T --- T_STATUS
    U --- U_NAME
    U --- U_TYPE
    R --- R_CODE

    T ---|"1"| REL_TU ---|"n"| U
    T ---|"1"| REL_TR ---|"n"| R
    U ---|"1"| REL_UR_U ---|"n"| UR
    R ---|"1"| REL_UR_R ---|"n"| UR
    T ---|"1"| REL_TM ---|"n"| MP
    R ---|"1"| REL_RMP_R ---|"n"| RMP
    MP ---|"1"| REL_RMP_M ---|"n"| RMP
    U ---|"1"| REL_UPLOAD ---|"n"| UA
    U ---|"1"| REL_AUDIT ---|"n"| AUDIT
~~~

### 4.2 Steam 游戏、版本、购买方式、媒体与订单 Catalog / Version / Offer / Media / Order

~~~mermaid
flowchart LR
    GP["Steam游戏商品<br/>GAME_PRODUCT"]
    GP_TITLE(["标题<br/>title"])
    GP_STATUS(["上架状态<br/>status"])
    GP_STEAM(["Steam AppID<br/>steam_app_id"])

    GV["游戏版本<br/>GAME_VERSION"]
    GV_CODE(["版本编码<br/>version_code"])
    GV_TITLE(["版本名称<br/>version_title"])

    PM["购买方式<br/>PURCHASE_METHOD"]
    PM_CODE(["方式编码<br/>code"])
    PM_HANDLER(["默认处理器<br/>default_handler"])

    GO["游戏可售方案<br/>GAME_OFFER"]
    GO_CODE(["方案编码<br/>offer_code"])
    GO_PRICE(["价格<br/>price_amount"])
    GO_STOCK(["库存<br/>stock_quantity"])
    GO_HANDLER(["交付处理器<br/>delivery_handler"])

    GM["游戏媒体<br/>GAME_MEDIA"]
    GM_TYPE(["媒体类型<br/>media_type"])

    GC["游戏分类<br/>GAME_CATEGORY"]
    GPC["商品分类关系<br/>GAME_PRODUCT_CATEGORY"]
    UA["上传资产<br/>UPLOAD_ASSET"]

    U["用户<br/>APP_USER"]
    O["订单<br/>ORDER_INFO"]
    O_NO(["订单号<br/>order_no"])
    O_STATUS(["订单状态<br/>status"])

    OI["订单项<br/>ORDER_ITEM"]
    PAY["支付快照<br/>PAYMENT_SNAPSHOT"]

    REL_VERSION{"拥有版本<br/>has version"}
    REL_OFFER_VERSION{"版本配置可售方案<br/>version configures offer"}
    REL_OFFER_METHOD{"使用购买方式<br/>uses method"}
    REL_MEDIA{"展示媒体<br/>displays media"}
    REL_BIND{"绑定媒体<br/>binds media"}
    REL_CAT1{"归入分类<br/>classified as"}
    REL_CAT2{"包含商品<br/>contains product"}
    REL_ORDER{"创建订单<br/>places order"}
    REL_ITEM{"包含订单项<br/>contains item"}
    REL_PRODUCT_SNAPSHOT{"形成商品快照<br/>product snapshot"}
    REL_VERSION_SNAPSHOT{"形成版本快照<br/>version snapshot"}
    REL_OFFER_SNAPSHOT{"形成方案快照<br/>offer snapshot"}
    REL_PAY{"生成支付快照<br/>payment snapshot"}

    GP --- GP_TITLE
    GP --- GP_STATUS
    GP --- GP_STEAM
    GV --- GV_CODE
    GV --- GV_TITLE
    PM --- PM_CODE
    PM --- PM_HANDLER
    GO --- GO_CODE
    GO --- GO_PRICE
    GO --- GO_STOCK
    GO --- GO_HANDLER
    GM --- GM_TYPE
    O --- O_NO
    O --- O_STATUS

    GP ---|"1"| REL_VERSION ---|"n"| GV
    GV ---|"1"| REL_OFFER_VERSION ---|"n"| GO
    PM ---|"1"| REL_OFFER_METHOD ---|"n"| GO
    GP ---|"1"| REL_MEDIA ---|"n"| GM
    UA ---|"1"| REL_BIND ---|"0..1"| GM
    GP ---|"1"| REL_CAT1 ---|"n"| GPC
    GC ---|"1"| REL_CAT2 ---|"n"| GPC
    U ---|"1"| REL_ORDER ---|"n"| O
    O ---|"1"| REL_ITEM ---|"n"| OI
    GP ---|"1"| REL_PRODUCT_SNAPSHOT ---|"n"| OI
    GV ---|"1"| REL_VERSION_SNAPSHOT ---|"n"| OI
    GO ---|"1"| REL_OFFER_SNAPSHOT ---|"n"| OI
    O ---|"1"| REL_PAY ---|"0..1"| PAY
~~~

### 4.3 数字权益与多交付方式 Fulfillment / Delivery Details

~~~mermaid
flowchart LR
    O["订单<br/>ORDER_INFO"]
    OI["订单项<br/>ORDER_ITEM"]
    DE["数字权益<br/>DIGITAL_ENTITLEMENT"]
    DE_STATUS(["权益状态<br/>status"])
    DE_KIND(["交付类型<br/>delivery_kind"])
    DE_HANDLER(["交付处理器<br/>delivery_handler"])

    EE["权益事件<br/>ENTITLEMENT_EVENT"]
    EE_ACTION(["事件动作<br/>action"])

    GO["游戏可售方案<br/>GAME_OFFER"]
    GV["游戏版本<br/>GAME_VERSION"]
    PM["购买方式<br/>PURCHASE_METHOD"]
    RC["CDK兑换码<br/>REDEMPTION_CODE"]
    RC_STATUS(["CDK状态<br/>status"])

    GD["礼物交付<br/>GIFT_DELIVERY"]
    GD_NO(["礼物编号<br/>gift_no"])

    AD["成品账号交付<br/>ACCOUNT_DELIVERY"]
    AD_STATUS(["账号交付状态<br/>status"])

    OPD["离线账号游玩交付<br/>OFFLINE_PLAY_DELIVERY"]
    OPD_STATUS(["离线交付状态<br/>status"])

    DD["授权下载资料交付<br/>DOWNLOAD_DELIVERY"]
    DD_STATUS(["下载交付状态<br/>status"])

    REL_ORDER_ITEM{"订单确定订单项<br/>order owns item"}
    REL_GRANT{"授予权益<br/>grants entitlement"}
    REL_EVENT{"记录事件<br/>records event"}
    REL_OFFER{"权益对应可售方案<br/>entitlement offer"}
    REL_METHOD{"权益对应购买方式<br/>entitlement method"}
    REL_VERSION{"权益对应版本<br/>entitlement version"}
    REL_CDK_STOCK{"CDK方案拥有库存<br/>CDK offer stocks code"}
    REL_CDK{"CDK交付详情<br/>CDK delivery detail"}
    REL_GIFT{"生成礼物交付<br/>creates gift delivery"}
    REL_ACCOUNT{"生成成品账号交付<br/>creates account delivery"}
    REL_OFFLINE{"生成离线账号交付<br/>creates offline play delivery"}
    REL_DOWNLOAD{"生成下载资料交付<br/>creates download delivery"}

    DE --- DE_STATUS
    DE --- DE_KIND
    DE --- DE_HANDLER
    EE --- EE_ACTION
    RC --- RC_STATUS
    GD --- GD_NO
    AD --- AD_STATUS
    OPD --- OPD_STATUS
    DD --- DD_STATUS

    O ---|"1"| REL_ORDER_ITEM ---|"1"| OI
    OI ---|"1"| REL_GRANT ---|"1"| DE
    DE ---|"1"| REL_EVENT ---|"n"| EE
    GV ---|"1"| REL_VERSION ---|"n"| DE
    GO ---|"1"| REL_OFFER ---|"n"| DE
    PM ---|"1"| REL_METHOD ---|"n"| DE
    GO ---|"1"| REL_CDK_STOCK ---|"n"| RC
    DE ---|"1"| REL_CDK ---|"0..1"| RC
    DE ---|"1"| REL_GIFT ---|"0..1"| GD
    DE ---|"1"| REL_ACCOUNT ---|"0..1"| AD
    DE ---|"1"| REL_OFFLINE ---|"0..1"| OPD
    DE ---|"1"| REL_DOWNLOAD ---|"0..1"| DD
~~~

### 4.4 会话、工单、知识库与 Agent Conversation / Ticket / Knowledge / Agent

~~~mermaid
flowchart LR
    U["用户<br/>APP_USER"]
    C["客服会话<br/>CONVERSATION"]
    C_STATUS(["会话状态<br/>status"])

    M["聊天消息<br/>CHAT_MESSAGE"]
    Q["接待队列<br/>SERVICE_QUEUE_ENTRY"]

    WO["工单<br/>WORK_ORDER"]
    WO_STATUS(["工单状态<br/>status"])
    WO_PRIORITY(["优先级<br/>priority"])

    WOR["工单处理记录<br/>WORK_ORDER_RECORD"]
    RR["退款审核<br/>REFUND_REVIEW"]
    REI["补发记录<br/>REISSUE_RECORD"]
    ACR["账号处置记录<br/>ACCOUNT_CASE_RECORD"]

    O["订单<br/>ORDER_INFO"]
    OI["订单项<br/>ORDER_ITEM"]
    DE["数字权益<br/>DIGITAL_ENTITLEMENT"]
    GO["游戏可售方案<br/>GAME_OFFER"]
    PM["购买方式<br/>PURCHASE_METHOD"]

    KB["知识库<br/>KNOWLEDGE_BASE"]
    KD["知识文档<br/>KNOWLEDGE_DOCUMENT"]
    KC["知识分块<br/>KNOWLEDGE_CHUNK"]

    ACL["Agent调用日志<br/>AGENT_CALL_LOG"]

    REL_START{"发起会话<br/>starts conversation"}
    REL_MSG{"包含消息<br/>contains message"}
    REL_QUEUE{"进入队列<br/>queues service"}
    REL_TO_TICKET{"产生工单<br/>creates ticket"}
    REL_ORDER_TICKET{"关联订单<br/>relates order"}
    REL_ITEM_TICKET{"关联订单项<br/>relates order item"}
    REL_ENT_TICKET{"关联权益<br/>relates entitlement"}
    REL_OFFER_TICKET{"关联可售方案<br/>relates offer"}
    REL_METHOD_TICKET{"关联购买方式<br/>relates method"}
    REL_RECORD{"记录处理<br/>records handling"}
    REL_REFUND{"触发退款审核<br/>triggers refund review"}
    REL_REISSUE{"触发补发<br/>triggers reissue"}
    REL_ACCOUNT{"触发账号处置<br/>triggers account action"}
    REL_DOC{"包含文档<br/>contains document"}
    REL_CHUNK{"切分知识块<br/>splits chunk"}
    REL_AGENT_C{"调用Agent<br/>invokes Agent"}
    REL_AGENT_W{"工单使用Agent<br/>uses Agent"}

    C --- C_STATUS
    WO --- WO_STATUS
    WO --- WO_PRIORITY

    U ---|"1"| REL_START ---|"n"| C
    C ---|"1"| REL_MSG ---|"n"| M
    C ---|"1"| REL_QUEUE ---|"n"| Q
    C ---|"0..1"| REL_TO_TICKET ---|"n"| WO
    O ---|"1"| REL_ORDER_TICKET ---|"n"| WO
    OI ---|"1"| REL_ITEM_TICKET ---|"n"| WO
    DE ---|"1"| REL_ENT_TICKET ---|"n"| WO
    GO ---|"1"| REL_OFFER_TICKET ---|"n"| WO
    PM ---|"1"| REL_METHOD_TICKET ---|"n"| WO
    WO ---|"1"| REL_RECORD ---|"n"| WOR
    WO ---|"1"| REL_REFUND ---|"0..1"| RR
    WO ---|"1"| REL_REISSUE ---|"n"| REI
    WO ---|"1"| REL_ACCOUNT ---|"n"| ACR
    KB ---|"1"| REL_DOC ---|"n"| KD
    KD ---|"1"| REL_CHUNK ---|"n"| KC
    C ---|"1"| REL_AGENT_C ---|"n"| ACL
    WO ---|"0..1"| REL_AGENT_W ---|"n"| ACL
~~~

### 4.5 ER 图阅读说明

- `APP_USER` 同时表示消费者、客服、管理员和超级管理员，通过 `ROLE`、`USER_ROLE`、`MODULE_PERMISSION`、`ROLE_MODULE_PERMISSION` 控制 B 端模块显示与操作权限。
- `UPLOAD_ASSET` 记录 OSS 对象事实；`GAME_MEDIA` 记录游戏业务媒体。这样未绑定、上传失败或后续要清理的对象不会直接污染游戏商品。
- `GAME_PRODUCT` 表示 Steam 游戏本体；`GAME_VERSION` 表示标准版、豪华版、年度版、DLC 合集等版本；`PURCHASE_METHOD` 是购买方式字典，例如 CDK、Steam 礼物、成品账号、离线账号游玩、授权下载资料；`GAME_OFFER` 是游戏版本和购买方式的多对多关系表，承载价格、库存、状态和交付处理器。
- `ORDER_INFO` 与 `ORDER_ITEM` 保存交易快照。MVP 中一个订单只对应一个订单项，即只购买一种可售方案，便于售后工单精确绑定。
- `DIGITAL_ENTITLEMENT` 是售后核心对象。不同购买方式通过 `delivery_kind` 分流到 `REDEMPTION_CODE`、`GIFT_DELIVERY`、`ACCOUNT_DELIVERY`、`OFFLINE_PLAY_DELIVERY`、`DOWNLOAD_DELIVERY`。
- `WORK_ORDER` 是高风险业务处理统一入口，必须关联订单、订单项、数字权益、可售方案和购买方式，退款审核、补发和账号处置都通过它产生处理记录和审计。
- `KNOWLEDGE_*` 与 `AGENT_CALL_LOG` 是 Agent 后续扩展点，当前先保留边界和审计链路。

## 5. 关键访问模式与索引

| 访问模式 | 索引 |
|---|---|
| 首页按分类展示游戏 | game_product_category(tenant_id, category_id, product_id) |
| 游戏购买方式展示 | game_version(tenant_id, product_id, status)、game_offer(tenant_id, version_id, status)、purchase_method(tenant_id, code) |
| 游戏图片展示 | game_media(tenant_id, product_id)、upload_asset(tenant_id, provider, bucket_name, object_key) |
| 搜索游戏 | game_product(tenant_id, status, title)；全文搜索后续接 Elasticsearch |
| 消费者按时间查看订单 | order_info(tenant_id, consumer_id, created_at DESC, id) |
| 按订单号查询 | UNIQUE order_info(tenant_id, order_no) |
| 消费者查看数字权益 | digital_entitlement(tenant_id, consumer_id, status, updated_at DESC) |
| CDK 状态校验 | redemption_code(tenant_id, code_hash) |
| 礼物领取查询 | gift_delivery(tenant_id, gift_no) |
| 成品账号交付查询 | account_delivery(tenant_id, entitlement_id) |
| 离线账号交付查询 | offline_play_delivery(tenant_id, entitlement_id) |
| 下载资料交付查询 | download_delivery(tenant_id, entitlement_id) |
| 消费者查看活动会话 | conversation(tenant_id, consumer_id, status, updated_at DESC) |
| 消息游标补拉 | UNIQUE chat_message(conversation_id, sequence_no) |
| 客服等待队列 | service_queue_entry(tenant_id, status, enqueued_at, id) |
| 工单列表 | work_order(tenant_id, status, priority, updated_at DESC) |
| 按权益/购买方式定位工单 | work_order(tenant_id, entitlement_id)、work_order(tenant_id, purchase_method_id, status) |
| SLA 扫描 | work_order(tenant_id, status, sla_due_at) |
| 角色模块加载 | role_module_permission(tenant_id, role_id, module_permission_id)、module_permission(tenant_id, module_code) |
| 审计关联查询 | operation_audit(tenant_id, correlation_id, occurred_at) |

## 6. 外键与删除策略

1. 所有外键列建立索引。
2. 订单、权益、CDK/礼物/账号/离线/下载交付、会话、工单、消息、处理记录、审计和 Agent 日志使用 ON DELETE RESTRICT。
3. 已参与业务历史的 user、role、category 不删除，改为禁用。
4. 账号注销在 MVP 中做状态和脱敏，不做物理删除。
5. 知识文档删除先标记 deleted_at 并发布索引删除事件，对象存储清理由保留策略异步执行。
6. 跨模块外键只表达稳定聚合引用，不允许通过 ORM 自动级联更新整个对象图。

## 7. 迁移安全

- 使用 Flyway 版本化迁移；已应用迁移不可修改。
- 新增必填列采用“先可空或带安全默认值、回填、代码双写/读取、最后收紧约束”的扩展-收缩流程。
- 状态枚举扩展必须保持旧版本可读取，新旧应用滚动期间不得复用既有状态含义。
- 每次迁移在 Testcontainers MySQL 上从空库执行，并从上一版本快照升级验证。
- 备份恢复与索引重建流程在 Stage 7 演练。

## 8. 设计检查结论

- 数据模型已从实物电商调整为游戏数字商品交易与售后。
- 数字权益、CDK、礼物、成品账号、离线账号、下载型交付、退款审核、账号处置和模块权限已有独立表归属。
- 交易历史不依赖软删除或级联删除。
- 搜索和统计是可重建投影，不成为核心业务真相。
