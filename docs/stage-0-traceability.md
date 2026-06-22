# Stage 0 需求追踪矩阵

本矩阵把 24 条 MVP 可观察验收结果连接到业务用例、实现边界、接口或事件、数据实体、安全控制和后续自动化测试层。它是阶段 1 至阶段 6 拆分纵向功能切片的入口；接口路径为基线语义，最终以 OpenAPI 契约为准。

| Requirement ID | Use case | Acceptance criterion | Owning module | API/event | Data entities | Security controls | Planned test layer |
|---|---|---|---|---|---|---|---|
| AC-001 | UC-01 订单咨询 | 本人订单创建唯一活动会话并返回 201 | conversation、order | `POST /api/v1/conversations` | order_info、conversation、operation_audit | JWT；tenant 与 consumer 归属；创建幂等 | Spring API 集成测试；customer-web E2E |
| AC-002 | UC-01 订单咨询 | 他人订单不可用于建会话且不泄露字段 | order、conversation | `POST /api/v1/conversations` | order_info、conversation | BOLA 防护；统一资源不可用响应；默认拒绝 | 跨消费者授权集成测试 |
| AC-003 | UC-01 订单咨询 | 重复幂等请求返回同一会话 | conversation | `POST /api/v1/conversations` | conversation、幂等记录 | tenant/actor/operation/key 复合幂等；唯一约束 | 并发与幂等集成测试 |
| AC-004 | UC-02 Mock Agent 回答 | 确定性问题产生并各保存一次问答消息 | conversation、agent-gateway | AgentGateway `generateAnswer` | conversation、chat_message、agent_call_log | 委托上下文；messageKey 去重；输出 Schema 校验 | Mock 契约测试；消息持久化集成测试 |
| AC-005 | UC-02 Mock Agent 回答 | 未命中规则时显示降级答复与转人工入口 | agent-gateway、conversation | AgentGateway `generateAnswer` | chat_message、agent_call_log | 最小业务上下文；确定性安全降级 | Java 单元/契约测试；customer-web 组件测试 |
| AC-006 | UC-02 Mock Agent 回答 | 15 秒超时后不丢消息并记录依赖失败 | agent-gateway、conversation | AgentGateway 超时与降级 | chat_message、agent_call_log、operation_audit | 超时；有限重试；密钥脱敏；correlationId | WireMock/故障注入集成测试 |
| AC-007 | UC-03 转人工 | 状态迁移、唯一队列项和转人工事件原子可见 | conversation | `POST /api/v1/conversations/{id}/handoff`；ConversationHumanHandoffRequested | conversation、service_queue_entry、outbox_event | own 校验；状态守卫；幂等键；事务外盒 | 状态机单元测试；API/事件集成测试 |
| AC-008 | UC-03 转人工 | 重复转人工复用现有队列状态 | conversation | `POST /api/v1/conversations/{id}/handoff` | conversation、service_queue_entry、幂等记录 | own 校验；活动队列唯一约束；请求幂等 | 并发与唯一约束集成测试 |
| AC-009 | UC-03 转人工 | 关闭会话拒绝迁移并返回稳定 409 | conversation | `POST /api/v1/conversations/{id}/handoff` | conversation、operation_audit | own 校验；终态守卫；无部分更新 | 状态机参数化测试；API 契约测试 |
| AC-010 | UC-04 客服接入 | 两名客服并发时只有一个当前接入人 | conversation | `POST /api/v1/conversations/{id}/accept` | conversation、service_queue_entry、operation_audit | conversation:accept；assigned/tenant 范围；乐观锁或原子占用 | Testcontainers 并发集成测试 |
| AC-011 | UC-04 客服接入 | 无接入权限的员工得到 403 且状态不变 | identity、conversation | `POST /api/v1/conversations/{id}/accept` | user_role、conversation、service_queue_entry | RBAC 默认拒绝；资源范围校验；拒绝审计 | 角色矩阵参数化集成测试 |
| AC-012 | UC-04 客服接入 | WebSocket 断线后仍可按游标补拉持久化回复 | conversation | WSS 消息；`GET /api/v1/conversations/{id}/messages?afterSequence=` | chat_message、conversation | 握手和订阅授权；messageKey 去重；序列游标 | WebSocket 集成测试；双前端 E2E |
| AC-013 | UC-05 质量售后 | 合法图片创建 SUBMITTED 申请和隔离对象引用 | aftersales、order | `POST /api/v1/aftersales-applications` | aftersales_application、aftersales_evidence、order_item | own 与售后窗口校验；文件魔数/大小；租户化私有对象键 | 上传边界集成测试；customer-web E2E |
| AC-014 | UC-05 质量售后 | 非法文件返回 400 且无业务或对象孤儿 | aftersales | `POST /api/v1/aftersales-applications` | aftersales_application、aftersales_evidence | MIME/魔数/大小/解压比；解析隔离；失败清理 | 恶意样本与故障注入集成测试 |
| AC-015 | UC-05 质量售后 | 重复提交返回同一有效售后申请 | aftersales | `POST /api/v1/aftersales-applications` | aftersales_application、幂等记录 | tenant 与 actor 绑定幂等键；数据库唯一约束 | 并发幂等集成测试 |
| AC-016 | UC-06 创建工单 | 确认草稿后创建工单、记录、分派和两个事件 | ticket、conversation | `POST /api/v1/work-orders`；WorkOrderCreated；WorkOrderAssigned | work_order、work_order_record、work_order_assignment、outbox_event | assigned 会话权限；草稿 Schema；分类/部门校验；事务外盒 | 聚合集成测试；事件契约测试 |
| AC-017 | UC-06 创建工单 | 无有效部门时保持 UNASSIGNED 并通知管理员 | ticket、notification | `POST /api/v1/work-orders`；NotificationRequested | work_order、work_order_record、notification、outbox_event | ticket:create；分类作用域；不伪造分派 | 规则分支集成测试；消息消费者测试 |
| AC-018 | UC-06 创建工单 | 未经客服确认的 Agent 草稿不形成工单 | agent-gateway、ticket | AgentGateway `draftWorkOrder` | agent_call_log；无 work_order | Agent 无业务写权限；服务端保存建议；人工确认 | AgentGateway 契约测试；负向数据库断言 |
| AC-019 | UC-07 处理工单 | 授权人员开始处理时迁移状态、递增版本并留痕 | ticket | `POST /api/v1/work-orders/{id}/transitions`；WorkOrderStatusChanged | work_order、work_order_record、outbox_event | ticket:process；assigned/department；状态守卫；expectedVersion | 状态机单元测试；API/事件集成测试 |
| AC-020 | UC-07 处理工单 | 非责任人员得到 403 且聚合完全不变 | identity、ticket | `POST /api/v1/work-orders/{id}/transitions` | work_order、work_order_assignment、work_order_record | RBAC；部门/直接分派校验；拒绝审计 | 跨部门授权集成测试 |
| AC-021 | UC-07 处理工单 | 旧版本或非法跳转返回 409 且无部分更新 | ticket | `POST /api/v1/work-orders/{id}/transitions` | work_order、work_order_record、operation_audit | 乐观锁；状态迁移白名单；事务回滚 | 并发冲突测试；状态机参数化测试 |
| AC-022 | UC-08 确认与评价 | 本人确认 COMPLETED 工单后关闭并保存结果 | ticket、conversation | `POST /api/v1/work-orders/{id}/confirm`；WorkOrderStatusChanged | work_order、work_order_record、conversation | consumer 关联归属；COMPLETED 守卫；幂等键 | API 集成测试；customer-web E2E |
| AC-023 | UC-08 确认与评价 | 非 COMPLETED 工单拒绝确认且不创建评价 | ticket | `POST /api/v1/work-orders/{id}/confirm` | work_order、satisfaction_rating | own 校验；状态守卫；事务原子性 | 状态机/API 负向测试 |
| AC-024 | UC-08 确认与评价 | 重复评价复用原记录且统计不重复计数 | ticket、analytics | `POST /api/v1/ratings`；统计投影消费 WorkOrderStatusChanged | satisfaction_rating、analytics_projection、消费幂等记录 | consumer 归属；业务唯一键；eventId 去重 | 幂等 API 集成测试；事件重放测试 |

## 使用规则

1. 新增或改变验收结果时，必须同步更新用例、验收标准、API/OpenAPI、数据迁移和本矩阵。
2. 每个纵向功能切片至少包含表中列出的最低测试层；涉及授权、并发、文件或事件的负向测试不能只由前端测试替代。
3. Agent 相关用例先由 Mock 实现通过同一契约，远程 Agent 接入时复用契约测试并增加安全评测。
4. 统计、通知和搜索属于可重建投影；追踪结果必须以 MySQL 事务真相和 outbox 事件为准。
