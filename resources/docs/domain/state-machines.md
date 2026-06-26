# 业务状态机

所有状态值使用稳定的大写字符串。状态迁移由 Java 应用服务执行并写入不可变历史；前端和 Agent 不能直接修改状态。

## 1. 会话状态机

| 当前状态 | 动作 | 下一状态 | 允许角色 | 守卫条件 | 副作用 |
|---|---|---|---|---|---|
| — | 创建会话 | BOT_ACTIVE | 消费者 | 订单/权益属于消费者；幂等键有效 | 保存会话和创建审计 |
| BOT_ACTIVE | 自动解决 | RESOLVED | 系统 | 已生成有效答复；无需人工 | 记录解决方式 |
| BOT_ACTIVE | 请求转人工 | WAITING_HUMAN | 消费者、Agent、系统 | 不存在活动队列项 | 创建队列项并发布转人工事件 |
| BOT_ACTIVE | 主动关闭 | CLOSED | 消费者 | 没有未完成工单 | 写入关闭记录 |
| WAITING_HUMAN | 客服接入 | HUMAN_ACTIVE | 客服 | 原子占用队列项成功 | 绑定唯一客服并记录接入 |
| WAITING_HUMAN | 取消等待 | BOT_ACTIVE | 消费者 | 尚未被客服接入 | 关闭队列项 |
| HUMAN_ACTIVE | 升级工单 | ESCALATED_TO_TICKET | 当前客服 | 工单草稿有效 | 创建工单并绑定会话 |
| HUMAN_ACTIVE | 问题解决 | RESOLVED | 当前客服 | 没有阻塞中的回复动作 | 写入会话总结 |
| ESCALATED_TO_TICKET | 工单完成 | RESOLVED | 系统 | 关联工单已完成 | 通知消费者 |
| RESOLVED | 消费者继续追问 | HUMAN_ACTIVE | 消费者 | 原客服仍有权或重新分派成功 | 记录重新打开原因 |
| RESOLVED | 关闭会话 | CLOSED | 消费者、当前客服、系统 | 关联任务均已完成 | 写入关闭记录 |
| CLOSED | 任意业务动作 | — | — | 终态 | 拒绝 |

~~~mermaid
stateDiagram-v2
    [*] --> BOT_ACTIVE
    BOT_ACTIVE --> RESOLVED: 自动解决
    BOT_ACTIVE --> WAITING_HUMAN: 请求转人工
    BOT_ACTIVE --> CLOSED: 主动关闭
    WAITING_HUMAN --> HUMAN_ACTIVE: 客服接入
    WAITING_HUMAN --> BOT_ACTIVE: 取消等待
    HUMAN_ACTIVE --> ESCALATED_TO_TICKET: 升级工单
    HUMAN_ACTIVE --> RESOLVED: 客服解决
    ESCALATED_TO_TICKET --> RESOLVED: 工单完成
    RESOLVED --> HUMAN_ACTIVE: 继续追问
    RESOLVED --> CLOSED: 关闭
    CLOSED --> [*]
~~~

## 2. 数字权益交付状态机

| 当前状态 | 动作 | 下一状态 | 允许角色 | 守卫条件 | 副作用 |
|---|---|---|---|---|---|
| — | 创建交付 | PENDING_DELIVERY | 系统 | 订单已支付或演示订单有效 | 创建权益记录 |
| PENDING_DELIVERY | 交付 CDK/礼物 | DELIVERED | 系统、管理员 | 可用库存或演示码存在 | 记录交付时间 |
| DELIVERED | 用户兑换/领取 | REDEEMED | 消费者、系统 | CDK/礼物有效且未使用 | 记录兑换时间 |
| DELIVERED | 交付异常 | DELIVERY_FAILED | 系统、管理员 | 交付失败原因明确 | 创建异常记录 |
| REDEEMED | 标记争议 | DISPUTED | 消费者、客服、管理员 | 存在用户申诉或风控命中 | 可升级工单 |
| DELIVERY_FAILED | 重新交付 | DELIVERED | 管理员 | 管理员工单批准 | 写入补发审计 |
| DISPUTED | 争议解决 | REDEEMED | 管理员 | 处理结果完整 | 写入处理结果 |
| REFUNDED | 任意动作 | — | — | 终态 | 拒绝 |

退款成功后，权益状态由退款工单迁移到 `REFUNDED`，不可再兑换或补发。

## 3. 工单状态机

| 当前状态 | 动作 | 下一状态 | 允许角色 | 守卫条件 | SLA 效果 | 事件 |
|---|---|---|---|---|---|---|
| — | 创建 | PENDING | 客服、系统、管理员 | 分类和幂等校验通过 | 启动首次处理计时 | WorkOrderCreated |
| PENDING | 开始处理 | IN_PROGRESS | 管理员、超级管理员 | 版本有效；有处理权限 | 首响完成；继续处理计时 | WorkOrderStatusChanged |
| PENDING | 判定无效 | REJECTED | 管理员、超级管理员 | 有拒绝原因 | 终止 | WorkOrderStatusChanged |
| PENDING | 超过时限 | TIMED_OUT | 系统 | SLA 截止时间已过 | 记录违约 | WorkOrderStatusChanged |
| IN_PROGRESS | 等待消费者 | WAITING_CUSTOMER | 管理员、超级管理员 | 明确所需材料 | 暂停处理计时 | WorkOrderStatusChanged |
| IN_PROGRESS | 等待管理员复核 | WAITING_ADMIN_REVIEW | 管理员、超级管理员 | 高风险动作需要复核 | 按复核策略计时 | WorkOrderStatusChanged |
| IN_PROGRESS | 完成处理 | COMPLETED | 管理员、超级管理员 | 处理结果和审计字段完整 | 停止处理计时 | WorkOrderStatusChanged |
| IN_PROGRESS | 升级 | ESCALATED | 管理员、系统 | 风险或投诉规则命中 | 按升级策略重算 | WorkOrderStatusChanged |
| WAITING_CUSTOMER | 收到补充 | IN_PROGRESS | 消费者、系统 | 补充材料有效 | 恢复处理计时 | WorkOrderStatusChanged |
| WAITING_ADMIN_REVIEW | 复核通过 | IN_PROGRESS | 超级管理员、授权管理员 | 复核意见有效 | 恢复处理计时 | WorkOrderStatusChanged |
| ESCALATED | 管理员接管 | IN_PROGRESS | 管理员、超级管理员 | 记录接管原因 | 启动升级后时限 | WorkOrderStatusChanged |
| TIMED_OUT | 人工接管 | IN_PROGRESS | 管理员、超级管理员 | 记录超时原因和负责人 | 保留违约；启动补救计时 | WorkOrderStatusChanged |
| COMPLETED | 消费者确认 | CLOSED | 消费者、系统 | 资源归属和结果可见 | 终止 | WorkOrderStatusChanged |
| REJECTED | 任意处理 | — | — | 终态 | — | 拒绝 |
| CLOSED | 任意处理 | — | — | 终态 | — | 拒绝 |

~~~mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> IN_PROGRESS: 管理员开始处理
    PENDING --> REJECTED: 判定无效
    PENDING --> TIMED_OUT: SLA 超时
    IN_PROGRESS --> WAITING_CUSTOMER: 等待用户补充
    IN_PROGRESS --> WAITING_ADMIN_REVIEW: 高风险复核
    IN_PROGRESS --> COMPLETED: 完成处理
    IN_PROGRESS --> ESCALATED: 升级
    WAITING_CUSTOMER --> IN_PROGRESS: 收到补充
    WAITING_ADMIN_REVIEW --> IN_PROGRESS: 复核通过
    ESCALATED --> IN_PROGRESS: 管理员接管
    TIMED_OUT --> IN_PROGRESS: 人工接管
    COMPLETED --> CLOSED: 用户确认
    REJECTED --> [*]
    CLOSED --> [*]
~~~

## 4. 账号状态机

| 当前状态 | 动作 | 下一状态 | 允许角色 | 守卫条件 | 副作用 |
|---|---|---|---|---|---|
| ACTIVE | 冻结 | FROZEN | 管理员、超级管理员 | 有工单、原因和二次确认 | 写入账号处置审计 |
| FROZEN | 解冻 | ACTIVE | 管理员、超级管理员 | 复核通过 | 写入账号处置审计 |
| ACTIVE | 发起注销审核 | CLOSURE_PENDING | 管理员、超级管理员、消费者 | 无未完成订单/工单或已有处置说明 | 限制部分操作 |
| CLOSURE_PENDING | 取消注销 | ACTIVE | 消费者、管理员 | 尚未完成注销 | 写入取消记录 |
| CLOSURE_PENDING | 完成注销 | CLOSED | 超级管理员、系统 | 复核通过且保留审计 | 脱敏个人字段 |
| CLOSED | 任意动作 | — | — | 终态 | 拒绝 |

MVP 页面只演示受控账号处置，不做真实物理删除。

## 5. 并发与错误规则

1. 所有状态变化提交当前 version，更新语句必须包含版本条件并原子递增。
2. 版本冲突或不在允许迁移表中的动作返回 HTTP 409。
3. 错误码按聚合区分：CONVERSATION_ILLEGAL_STATE_TRANSITION、ENTITLEMENT_ILLEGAL_STATE_TRANSITION、TICKET_ILLEGAL_STATE_TRANSITION、ACCOUNT_ILLEGAL_STATE_TRANSITION。
4. 失败迁移不得改变聚合、分派、SLA 或处理记录，且不得发布成功事件。
5. 高风险动作至少保存旧状态、新状态、动作、操作者、原因、二次确认标识、关联 ID 和发生时间。
