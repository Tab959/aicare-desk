# 领域事件契约

## 1. 事件信封

所有异步领域事件使用以下字段：

~~~json
{
  "eventId": "01JEVENT",
  "eventType": "WorkOrderCreated",
  "eventVersion": 1,
  "occurredAt": "2026-06-22T08:00:00.000Z",
  "tenantId": "01JTENANT",
  "correlationId": "01JCORRELATION",
  "causationId": "01JCOMMAND",
  "aggregateType": "WorkOrder",
  "aggregateId": "01JWORKORDER",
  "payload": {}
}
~~~

eventId 在租户内唯一。消费者按 eventId 幂等处理。eventVersion 只在兼容性规则允许时递增，既有字段不改变语义。

## 2. 发布可靠性

1. 核心事务和 outbox_event 在同一 MySQL 事务提交。
2. 发布器按 status、availableAt、id 扫描外盒并发送 RabbitMQ。
3. 成功后标记已发布；失败使用有限指数退避。
4. 超过重试阈值进入死信和人工告警。
5. 消费者保存消费幂等记录或使用业务唯一键，重复事件不得重复通知、计数或创建记录。
6. 事件不能携带密码、完整令牌、模型密钥、二进制文件或不必要的个人信息。

## 3. 初始事件

### ConversationHumanHandoffRequested v1

触发：会话从 BOT_ACTIVE 迁移到 WAITING_HUMAN。

payload：conversationId、consumerId、orderId、reasonCode、requestedBy、queuePriority。

消费者：客服队列推送、会话统计、审计投影。

### WorkOrderCreated v1

触发：工单聚合和首条处理记录提交。

payload：workOrderId、categoryCode、priority、sourceType、sourceId、createdBy。

消费者：分派规则、通知、分析投影。

### WorkOrderAssigned v1

触发：新增当前分派并使旧分派失效。

payload：workOrderId、departmentId、assigneeId、assignmentReason、slaDueAt。

消费者：员工通知、客服工作台、SLA 扫描投影。

### WorkOrderStatusChanged v1

触发：合法状态迁移提交。

payload：workOrderId、fromStatus、toStatus、action、actorType、actorId、version、slaEffect。

消费者：消费者进度通知、分析投影、超时与升级处理。

### KnowledgeDocumentUploaded v1

触发：知识文档元数据和对象引用提交。

payload：documentId、knowledgeBaseId、objectKey、contentHash、mediaType、uploadedBy。

消费者：文档解析与索引任务。

### NotificationRequested v1

触发：业务模块需要向特定主体发送通知。

payload：notificationType、recipientId、templateCode、businessType、businessId、deduplicationKey、parameters。

消费者：站内通知投递器，以及后续可插拔的邮件/短信适配器。

## 4. 兼容性规则

- 新增可选字段属于向后兼容变化。
- 删除字段、改变类型、改变枚举含义或改变业务语义需要新 eventVersion。
- 消费者忽略未知可选字段，但拒绝不支持的主版本。
- 生产者在旧消费者迁移完成前保留旧版本发布能力。
- 事件 Schema 在 CI 中校验，并为每个消费者建立契约测试。

## 5. 顺序与一致性

- 同一聚合的事件携带递增 aggregateVersion。
- RabbitMQ 只保证设计范围内的路由和投递，不假设全局顺序。
- 消费者发现版本缺口时暂停该聚合处理并触发补偿或重建。
- 搜索、通知和统计允许最终一致；工单和售后核心状态只以 MySQL 事务结果为准。

