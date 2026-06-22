# ADR-0003：本地开发与虚拟机拓扑

- 状态：Accepted
- 日期：2026-06-22

## 背景

开发主机为 14 核 i7-13650HX、16 GB 内存和 1 TB SSD。完整同时运行应用、中间件、可观测性和本地模型会造成内存压力。开发又需要 IDE 调试、热更新和可复现 Linux 基础设施。

## 决策

- 前端、Java 和 Python 代码在 Windows 主机运行与调试。
- Linux Server 虚拟机配置为 4 vCPU、6 GB 内存、4 GB Swap 和 120 GB 动态磁盘。
- 基础设施使用 Docker Compose Profiles：
  - core：MySQL、Redis；
  - messaging：RabbitMQ、MinIO；
  - search：Elasticsearch；
  - observe：Prometheus、Grafana 和日志组件。
- 日常只启动当前业务切片需要的 Profile。
- 集成和演示阶段再将四个应用容器化部署到虚拟机。
- 首版使用云端 OpenAI-compatible 模型，不在本机长期托管大模型。

## 理由

- Windows 主机保留更快的构建、调试和热更新循环。
- 无桌面 Linux 虚拟机提供接近部署环境的容器和网络行为。
- Profile 避免 16 GB 主机长期同时承载全部服务。
- 同一 Compose 结构可用于本地联调和最终演示。

## 后果

- 应用配置必须支持主机访问虚拟机服务地址，防火墙只开放必要端口。
- Elasticsearch 与 observe Profile 不默认常驻。
- 单虚拟机不声称真实高可用；SLO 结果标记为本地验收数据。
- 若主机升级到 32 GB，可提高虚拟机内存并扩大同时运行范围。

## 重新评估条件

需要公网长期运行、多节点高可用、团队共享环境或云端部署时，新增部署 ADR 并评估托管服务或容器编排。
