# Stage 0 需求追踪矩阵

本矩阵把 24 条 MVP 可观察验收结果连接到业务用例、实现边界、接口或事件、数据实体、安全控制和后续自动化测试层。它是阶段 1 至阶段 6 拆分纵向功能切片的入口；接口路径为基线语义，最终以 OpenAPI 契约为准。

| Requirement ID | Use case | Acceptance criterion | Owning module | API/event | Data entities | Security controls | Planned test layer |
|---|---|---|---|---|---|---|---|
| AC-001 | UC-01 游戏浏览 | 首页展示导航、搜索、分类、Hero、游戏卡片和用户入口 | catalog | `GET /api/v1/games/home` | game_product、game_version、game_offer、game_category | 公开读；tenant 过滤 | customer-web E2E；组件测试 |
| AC-002 | UC-01 游戏详情 | 点击游戏卡片进入详情并展示版本、购买方式、平台、交付和退款规则 | catalog | `GET /api/v1/games/{id}` | game_product、game_version、game_offer、game_media | 公开读；下架状态过滤 | customer-web E2E |
| AC-003 | UC-01 搜索 | 搜索无结果时展示建议分类和热门游戏 | catalog | `GET /api/v1/games/search` | game_product、game_category | 输入校验；limit 上限 | 组件测试；API 集成测试 |
| AC-004 | UC-02 订单/权益咨询 | 本人订单或权益创建唯一活动会话并返回 201 | conversation、order、fulfillment | `POST /api/v1/conversations` | order_info、digital_entitlement、conversation、operation_audit | JWT；tenant 与 consumer 归属；创建幂等 | Spring API 集成测试；customer-web E2E |
| AC-005 | UC-02 订单/权益咨询 | 他人权益不可用于建会话且不泄露字段 | fulfillment、conversation | `POST /api/v1/conversations` | digital_entitlement、conversation | BOLA 防护；统一资源不可用响应；默认拒绝 | 跨消费者授权集成测试 |
| AC-006 | UC-02 订单/权益咨询 | 重复幂等请求返回同一会话 | conversation | `POST /api/v1/conversations` | conversation、幂等记录 | tenant/actor/operation/key 复合幂等；唯一约束 | 并发与幂等集成测试 |
| AC-007 | UC-03 Mock Agent | CDK 未收到问题产生确定性答复并保存消息 | conversation、agent-gateway、fulfillment | AgentGateway `generateAnswer` | conversation、chat_message、agent_call_log、digital_entitlement | 委托上下文；messageKey 去重；输出 Schema 校验 | Mock 契约测试；消息持久化集成测试 |
| AC-008 | UC-03 Mock Agent | 礼物领取失败返回礼物状态、原因和转人工建议 | conversation、agent-gateway、fulfillment | AgentGateway `generateAnswer` | gift_delivery、chat_message、agent_call_log | 最小上下文；确定性安全降级 | Java 单元/契约测试 |
| AC-009 | UC-03 Mock Agent | Agent 超时后不丢消息并记录依赖失败 | agent-gateway、conversation | AgentGateway 超时与降级 | chat_message、agent_call_log、operation_audit | 超时；有限重试；密钥脱敏；correlationId | WireMock/故障注入集成测试 |
| AC-010 | UC-04 转人工 | 状态迁移、唯一队列项和转人工事件原子可见 | conversation | `POST /api/v1/conversations/{id}/handoff`；ConversationHumanHandoffRequested | conversation、service_queue_entry、outbox_event | own 校验；状态守卫；幂等键；事务外盒 | 状态机单元测试；API/事件集成测试 |
| AC-011 | UC-04 转人工 | 重复转人工复用现有队列状态 | conversation | `POST /api/v1/conversations/{id}/handoff` | conversation、service_queue_entry、幂等记录 | own 校验；活动队列唯一约束；请求幂等 | 并发与唯一约束集成测试 |
| AC-012 | UC-04 转人工 | 关闭会话拒绝迁移并返回稳定 409 | conversation | `POST /api/v1/conversations/{id}/handoff` | conversation、operation_audit | own 校验；终态守卫；无部分更新 | 状态机参数化测试；API 契约测试 |
| AC-013 | UC-05 客服接入 | 两名客服并发时只有一个当前接入人 | conversation | `POST /api/v1/conversations/{id}/accept` | conversation、service_queue_entry、operation_audit | conversation:accept；assigned 范围；乐观锁或原子占用 | Testcontainers 并发集成测试 |
| AC-014 | UC-05 客服回复 | 客服回复可持久化并按游标补拉 | conversation | WSS 消息；`GET /api/v1/conversations/{id}/messages?afterSequence=` | chat_message、conversation | 握手和订阅授权；messageKey 去重；序列游标 | WebSocket 集成测试；双前端 E2E |
| AC-015 | UC-05 升级工单 | 客服创建管理员待处理工单但不能直接退款/账号处置 | ticket、conversation | `POST /api/v1/work-orders`；WorkOrderCreated | work_order、work_order_record、outbox_event | assigned 会话权限；客服动作白名单；Agent 草稿需人工确认 | 聚合集成测试；权限负向测试 |
| AC-016 | UC-06 退款审核 | 管理员处理退款工单并留存审核记录 | ticket | `POST /api/v1/work-orders/{id}/refund-review` | work_order、refund_review、work_order_record | refund:review；状态守卫；二次确认；审计 | API 集成测试；状态机测试 |
| AC-017 | UC-06 权益补发 | 管理员按购买方式补发 CDK、礼物、账号、离线账号或授权下载资料并写入新交付记录 | ticket、fulfillment | `POST /api/v1/work-orders/{id}/reissue`；EntitlementReissued | digital_entitlement、redemption_code、gift_delivery、account_delivery、offline_play_delivery、download_delivery、reissue_record | entitlement:reissue；幂等；敏感交付内容脱敏；审计 | API 集成测试；敏感字段日志测试 |
| AC-018 | UC-06 账号处置 | 冻结/解冻/注销审核必须有原因、确认和审计 | identity、ticket | `POST /api/v1/work-orders/{id}/account-actions`；AccountActionRequested | user、account_action、account_case_record | account:action；二次确认；不可变审计 | 状态机测试；权限负向测试 |
| AC-019 | UC-06 管理员处理 | 客服尝试退款/补发/账号处置返回 403 且聚合不变 | identity、ticket | 高风险动作端点 | work_order、work_order_record | RBAC；模块权限；拒绝审计 | 角色矩阵参数化集成测试 |
| AC-020 | UC-07 模块配置 | 超级管理员修改角色模块生成配置版本和审计 | identity | `PUT /api/v1/admin/role-modules` | role、module_permission、role_module_permission、operation_audit | role-module:manage；system 范围；版本控制 | API 集成测试 |
| AC-021 | UC-07 模块显示 | 客服重新进入系统只显示被授权模块 | identity | `GET /api/v1/me/modules` | role、module_permission、role_module_permission | JWT；角色解析；默认拒绝 | staff-web E2E；API 测试 |
| AC-022 | UC-07 防自锁 | 移除最后系统管理员能力返回 409 | identity | `PUT /api/v1/admin/role-modules` | role、module_permission、role_module_permission、operation_audit | 系统保底规则；状态冲突 | 负向集成测试 |
| AC-023 | UC-08 确认结果 | 本人确认 COMPLETED 工单后关闭并保存结果 | ticket、conversation | `POST /api/v1/work-orders/{id}/confirm`；WorkOrderStatusChanged | work_order、work_order_record、conversation | consumer 关联归属；COMPLETED 守卫；幂等键 | API 集成测试；customer-web E2E |
| AC-024 | UC-08 评价 | 重复评价复用原记录且统计不重复计数 | ticket、analytics | `POST /api/v1/ratings`；统计投影消费 WorkOrderStatusChanged | satisfaction_rating、analytics_projection、消费幂等记录 | consumer 归属；业务唯一键；eventId 去重 | 幂等 API 集成测试；事件重放测试 |

## 使用规则

1. 新增或改变验收结果时，必须同步更新用例、验收标准、API/OpenAPI、数据迁移和本矩阵。
2. 每个纵向功能切片至少包含表中列出的最低测试层；涉及授权、并发、文件、敏感权益或事件的负向测试不能只由前端测试替代。
3. Agent 相关用例先由 Mock 实现通过同一契约，远程 Agent 接入时复用契约测试并增加安全评测。
4. 统计、通知和搜索属于可重建投影；追踪结果必须以 MySQL 事务真相和 outbox 事件为准。
