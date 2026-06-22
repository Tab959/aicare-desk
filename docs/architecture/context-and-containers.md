# 系统上下文与容器边界

## 1. 系统上下文

~~~mermaid
flowchart LR
    Consumer[消费者]
    Staff[客服与部门人员]
    Admin[管理员]

    CustomerWeb[customer-web]
    StaffWeb[staff-web]
    Platform[platform-api]
    Agent[agent-service]
    Model[OpenAI-compatible 模型服务]

    MySQL[(MySQL)]
    Redis[(Redis)]
    Rabbit[(RabbitMQ)]
    MinIO[(MinIO)]
    Search[(Elasticsearch)]

    Consumer --> CustomerWeb
    Staff --> StaffWeb
    Admin --> StaffWeb
    CustomerWeb -->|HTTPS / WebSocket| Platform
    StaffWeb -->|HTTPS / WebSocket| Platform
    Platform -->|版本化 HTTPS| Agent
    Agent -->|受控工具 HTTPS| Platform
    Agent -->|HTTPS| Model
    Platform --> MySQL
    Platform --> Redis
    Platform --> Rabbit
    Platform --> MinIO
    Platform --> Search
~~~

浏览器的所有业务请求都进入 platform-api。浏览器不得直接调用 Agent；Agent 不得直接访问核心数据库和消息中间件。

## 2. 容器职责

| 容器 | 核心职责 | 拥有的数据 | 入站 | 出站依赖 | 禁止依赖 |
|---|---|---|---|---|---|
| customer-web | 消费者商品、订单、咨询、售后、进度和评价体验 | 浏览器短期 UI 状态；不拥有业务真相 | 浏览器导航 | platform-api 的 HTTPS/WebSocket | agent-service、数据库、中间件 |
| staff-web | 客服工作台、工单、知识库、组织权限和看板 | 浏览器短期 UI 状态；不拥有业务真相 | 浏览器导航 | platform-api 的 HTTPS/WebSocket | agent-service、数据库、中间件 |
| platform-api | 身份、业务规则、事务、授权、审计、工单、消息和 Agent 网关 | 全部事务记录、业务状态和审计事实 | 两个前端、Agent 工具调用、运维探针 | MySQL、Redis、RabbitMQ、MinIO、Elasticsearch、agent-service | 直接依赖具体前端实现 |
| agent-service | 意图、RAG、工作流、摘要、工单草稿和回复建议 | Agent 工作流检查点、提示版本、非业务真相评测数据 | platform-api | platform-api 工具、模型服务 | MySQL 核心表、员工权限表、浏览器直接调用 |

## 3. 通信规则

1. 前端只信任 platform-api 返回的授权结果，不在客户端决定资源权限。
2. platform-api 与 agent-service 使用版本化契约、短超时、关联 ID 和显式降级。
3. Agent 工具调用返回最少必要字段，敏感数据默认脱敏。
4. 核心事务先提交数据库，再通过事务外盒或等价机制可靠发布异步事件。
5. WebSocket 用于体验增强；消息持久化和游标补拉保证断线后恢复。
6. Elasticsearch 是搜索投影，不是业务真相；索引可从事务数据和对象存储重建。
7. MinIO 保存二进制对象，MySQL 保存对象引用、哈希、归属、状态和审计信息。

## 4. 部署视图

开发期，四个应用在 Windows 主机按需运行，Linux 虚拟机承载基础设施。集成期，应用构建为容器并通过反向代理统一访问。单虚拟机用于可复现演示，不声称多节点高可用。
