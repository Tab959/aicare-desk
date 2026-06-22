# 业务状态机

所有状态值使用稳定的大写字符串。状态迁移由 Java 应用服务执行并写入不可变历史；前端和 Agent 不能直接修改状态。

## 1. 会话状态机

| 当前状态 | 动作 | 下一状态 | 允许角色 | 守卫条件 | 副作用 |
|---|---|---|---|---|---|
| — | 创建会话 | BOT_ACTIVE | 消费者 | 订单属于消费者；幂等键有效 | 保存会话和创建审计 |
| BOT_ACTIVE | 自动解决 | RESOLVED | 系统 | 已生成有效答复；无需人工 | 记录解决方式 |
| BOT_ACTIVE | 请求转人工 | WAITING_HUMAN | 消费者、Agent、系统 | 不存在活动队列项 | 创建队列项并发布转人工事件 |
| BOT_ACTIVE | 主动关闭 | CLOSED | 消费者 | 没有未完成售后或工单 | 写入关闭记录 |
| WAITING_HUMAN | 客服接入 | HUMAN_ACTIVE | 人工客服 | 原子占用队列项成功 | 绑定唯一客服并记录接入 |
| WAITING_HUMAN | 取消等待 | BOT_ACTIVE | 消费者 | 尚未被客服接入 | 关闭队列项 |
| HUMAN_ACTIVE | 问题解决 | RESOLVED | 当前客服 | 没有阻塞中的回复动作 | 写入会话总结 |
| RESOLVED | 消费者继续追问 | HUMAN_ACTIVE | 消费者 | 原客服仍有权或重新分派成功 | 记录重新打开原因 |
| RESOLVED | 关闭会话 | CLOSED | 消费者、当前客服、系统 | 关联任务均已完成 | 写入关闭记录 |
| CLOSED | 任意业务动作 | — | — | 终态 | 拒绝 |

~~~mermaid
stateDiagram-v2
    [*] --> BOT_ACTIVE
    BOT_ACTIVE --> RESOLVED: 自动解决
    BOT_ACTIVE --> WAITING_HUMAN: 请求转人工
    BOT_ACTIVE --> CLOSED: 无未完成任务并主动关闭
    WAITING_HUMAN --> HUMAN_ACTIVE: 客服原子接入
    WAITING_HUMAN --> BOT_ACTIVE: 消费者取消等待
    HUMAN_ACTIVE --> RESOLVED: 客服解决
    RESOLVED --> HUMAN_ACTIVE: 消费者继续追问
    RESOLVED --> CLOSED: 关闭
    CLOSED --> [*]
~~~

## 2. 售后申请状态机

| 当前状态 | 动作 | 下一状态 | 允许角色 | 守卫条件 | 副作用 |
|---|---|---|---|---|---|
| — | 提交申请 | SUBMITTED | 消费者、受托客服 | 订单归属、售后窗口、幂等校验通过 | 保存申请和凭证引用 |
| SUBMITTED | 开始审核 | UNDER_REVIEW | 售后人员 | 已分配审核责任 | 写入审核开始记录 |
| SUBMITTED | 消费者取消 | CANCELLED | 消费者 | 尚未开始审核 | 写入取消记录 |
| UNDER_REVIEW | 批准 | APPROVED | 授权售后人员 | 审核材料完整 | 写入不可变批准记录 |
| UNDER_REVIEW | 驳回 | REJECTED | 授权售后人员 | 具有明确原因 | 写入不可变驳回记录 |
| UNDER_REVIEW | 消费者取消 | CANCELLED | 消费者、售后人员 | 尚未产生不可逆处理 | 写入取消记录 |
| APPROVED | 开始执行 | PROCESSING | 售后、仓库、财务 | 对应执行工单已创建或关联 | 记录执行开始 |
| PROCESSING | 执行完成 | COMPLETED | 责任部门 | 处理结果和凭证完整 | 通知消费者 |
| REJECTED | 任意处理 | — | — | 终态 | 拒绝 |
| COMPLETED | 任意处理 | — | — | 终态 | 拒绝 |
| CANCELLED | 任意处理 | — | — | 终态 | 拒绝 |

~~~mermaid
stateDiagram-v2
    [*] --> SUBMITTED
    SUBMITTED --> UNDER_REVIEW: 开始审核
    SUBMITTED --> CANCELLED: 审核前取消
    UNDER_REVIEW --> APPROVED: 批准
    UNDER_REVIEW --> REJECTED: 驳回
    UNDER_REVIEW --> CANCELLED: 可逆阶段取消
    APPROVED --> PROCESSING: 开始执行
    PROCESSING --> COMPLETED: 处理完成
    REJECTED --> [*]
    COMPLETED --> [*]
    CANCELLED --> [*]
~~~

## 3. 工单状态机

| 当前状态 | 动作 | 下一状态 | 允许角色 | 守卫条件 | SLA 效果 | 事件 |
|---|---|---|---|---|---|---|
| — | 创建 | UNASSIGNED | 客服、系统 | 分类和幂等校验通过 | 尚未启动处理计时 | WorkOrderCreated |
| UNASSIGNED | 分派 | PENDING | 管理员、规则引擎 | 目标部门有效 | 启动首次响应计时 | WorkOrderAssigned |
| UNASSIGNED | 判定无效 | REJECTED | 管理员 | 有拒绝原因 | 终止 | WorkOrderStatusChanged |
| PENDING | 开始处理 | IN_PROGRESS | 责任人、责任部门 | 分派与版本有效 | 首响完成；继续处理计时 | WorkOrderStatusChanged |
| PENDING | 超过时限 | TIMED_OUT | 系统 | SLA 截止时间已过 | 记录违约 | WorkOrderStatusChanged |
| PENDING | 升级 | ESCALATED | 主管、系统 | 升级规则命中 | 按升级策略重算 | WorkOrderStatusChanged |
| IN_PROGRESS | 等待消费者 | WAITING_CUSTOMER | 责任人 | 明确所需材料 | 暂停处理计时并记录原因 | WorkOrderStatusChanged |
| IN_PROGRESS | 完成处理 | COMPLETED | 责任人 | 结果字段完整 | 停止处理计时 | WorkOrderStatusChanged |
| IN_PROGRESS | 超过时限 | TIMED_OUT | 系统 | SLA 截止时间已过 | 记录违约 | WorkOrderStatusChanged |
| IN_PROGRESS | 升级 | ESCALATED | 主管、系统 | 风险或投诉规则命中 | 按升级策略重算 | WorkOrderStatusChanged |
| WAITING_CUSTOMER | 收到补充 | IN_PROGRESS | 消费者、系统 | 补充材料有效 | 恢复处理计时 | WorkOrderStatusChanged |
| WAITING_CUSTOMER | 等待超时 | TIMED_OUT | 系统 | 客户等待截止时间已过 | 标记客户等待超时 | WorkOrderStatusChanged |
| ESCALATED | 重新分派 | PENDING | 管理员、主管 | 新责任部门有效 | 启动升级后时限 | WorkOrderAssigned |
| TIMED_OUT | 人工接管 | IN_PROGRESS | 管理员、主管 | 记录超时原因和负责人 | 保留违约；启动补救计时 | WorkOrderStatusChanged |
| COMPLETED | 消费者确认 | CLOSED | 消费者、授权客服 | 资源归属和结果可见 | 终止 | WorkOrderStatusChanged |
| REJECTED | 任意处理 | — | — | 终态 | — | 拒绝 |
| CLOSED | 任意处理 | — | — | 终态 | — | 拒绝 |

~~~mermaid
stateDiagram-v2
    [*] --> UNASSIGNED
    UNASSIGNED --> PENDING: 分派
    UNASSIGNED --> REJECTED: 判定无效
    PENDING --> IN_PROGRESS: 开始处理
    PENDING --> TIMED_OUT: SLA 超时
    PENDING --> ESCALATED: 升级
    IN_PROGRESS --> WAITING_CUSTOMER: 等待材料
    WAITING_CUSTOMER --> IN_PROGRESS: 收到补充
    WAITING_CUSTOMER --> TIMED_OUT: 等待超时
    IN_PROGRESS --> COMPLETED: 处理完成
    IN_PROGRESS --> TIMED_OUT: SLA 超时
    IN_PROGRESS --> ESCALATED: 升级
    ESCALATED --> PENDING: 重新分派
    TIMED_OUT --> IN_PROGRESS: 人工接管
    COMPLETED --> CLOSED: 消费者确认
    REJECTED --> [*]
    CLOSED --> [*]
~~~

## 4. 并发与错误规则

1. 所有状态变化提交当前 version，更新语句必须包含版本条件并原子递增。
2. 版本冲突或不在允许迁移表中的动作返回 HTTP 409。
3. 错误码按聚合区分：CONVERSATION_ILLEGAL_STATE_TRANSITION、AFTERSALES_ILLEGAL_STATE_TRANSITION、TICKET_ILLEGAL_STATE_TRANSITION。
4. 失败迁移不得改变聚合、分派、SLA 或处理记录，且不得发布成功事件。
5. 状态记录至少保存旧状态、新状态、动作、操作者、原因、关联 ID 和发生时间。

