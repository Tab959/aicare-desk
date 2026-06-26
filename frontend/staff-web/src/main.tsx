import React from "react";
import ReactDOM from "react-dom/client";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  Gamepad2,
  Headphones,
  KeyRound,
  LockKeyhole,
  MessageSquareText,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  WalletCards,
  Zap
} from "lucide-react";
import {
  createBrowserRouter,
  Link,
  NavLink,
  RouterProvider,
  useParams
} from "react-router-dom";
import { APP_NAME, mockGames } from "@aicare/shared";
import { Button, KpiCard, PageHeader } from "@aicare/ui";
import "@aicare/ui/styles.css";
import "./styles.css";

const pendingConversations = [
  { id: "C-GM-250625-1028", name: "林澈", issue: "CDK 未收到", wait: "02:18", intent: "ENTITLEMENT_NOT_DELIVERED", risk: "中" },
  { id: "C-GM-250625-1031", name: "Mira", issue: "礼物领取失败", wait: "05:44", intent: "GIFT_CLAIM_FAILED", risk: "中" },
  { id: "C-GM-250625-1038", name: "许先生", issue: "游戏已兑换后申请退款", wait: "11:06", intent: "REFUND_REVIEW", risk: "高" }
];

const acceptedConversations = [
  { id: "C-GM-250625-0960", name: "Evan", issue: "兑换码区域不符", wait: "已接待 18 分钟", intent: "CDK_REGION_MISMATCH", risk: "中" },
  { id: "C-GM-250624-0882", name: "阿周", issue: "订单重复扣款", wait: "历史会话", intent: "PAYMENT_DUPLICATED", risk: "高" },
  { id: "C-GM-250623-0412", name: "Nora", issue: "礼物链接过期", wait: "历史会话", intent: "GIFT_LINK_EXPIRED", risk: "低" }
];

const pendingTickets = [
  { id: "WO-GM-250625-004", type: "退款审核", user: "许先生", state: "待处理", sla: "01:24", risk: "高" },
  { id: "WO-GM-250625-006", type: "CDK 补发", user: "林澈", state: "待处理", sla: "03:12", risk: "中" },
  { id: "WO-GM-250624-019", type: "账号冻结复核", user: "Mira", state: "待处理", sla: "05:40", risk: "高" }
];

const resolvedTickets = [
  { id: "WO-GM-250624-011", type: "礼物补发", user: "阿周", state: "已解决", sla: "按时", risk: "中" },
  { id: "WO-GM-250623-022", type: "退款驳回", user: "Nora", state: "已关闭", sla: "按时", risk: "高" },
  { id: "WO-GM-250622-018", type: "账号解封", user: "Evan", state: "已解决", sla: "超时 12 分钟", risk: "高" }
];

const managedGames = mockGames.flatMap((game) =>
  game.versions.flatMap((version) =>
    version.offers.map((offer) => ({
      id: offer.id,
      title: game.title,
      version: version.versionTitle,
      platform: game.platform,
      price: offer.price.formatted,
      delivery: offer.purchaseMethod.name,
      state: game.publishStatus === "LISTED" ? "已上架" : game.publishStatus === "UNLISTED" ? "已下架" : "草稿",
      stock: offer.stockQuantity.toLocaleString("zh-CN")
    }))
  )
);

const roleMatrix = [
  { module: "待接待会话", support: true, admin: true, superAdmin: true },
  { module: "已接待会话", support: true, admin: true, superAdmin: true },
  { module: "会话详情", support: true, admin: true, superAdmin: true },
  { module: "待处理工单", support: false, admin: true, superAdmin: true },
  { module: "已处理工单", support: false, admin: true, superAdmin: true },
  { module: "游戏管理", support: false, admin: true, superAdmin: true },
  { module: "知识库配置", support: false, admin: true, superAdmin: true },
  { module: "退款审核", support: false, admin: true, superAdmin: true },
  { module: "角色权限", support: false, admin: false, superAdmin: true }
];

const navSections = [
  {
    title: "会话管理",
    items: [
      { to: "/conversations/pending", icon: Headphones, label: "待接待会话" },
      { to: "/conversations/accepted", icon: MessageSquareText, label: "已接待会话" }
    ]
  },
  {
    title: "工单管理",
    items: [
      { to: "/tickets/pending", icon: ClipboardList, label: "待处理工单" },
      { to: "/tickets/resolved", icon: BriefcaseBusiness, label: "已处理工单" }
    ]
  },
  {
    title: "游戏管理",
    items: [
      { to: "/games", icon: PackageCheck, label: "上架 / 下架游戏" },
      { to: "/games/featured", icon: Sparkles, label: "首页精选游戏" },
      { to: "/games/flash-sales", icon: Zap, label: "限时秒杀" }
    ]
  },
  {
    title: "业务管理",
    items: [
      { to: "/refunds", icon: WalletCards, label: "退款审核", badge: "高危" },
      { to: "/entitlements", icon: KeyRound, label: "CDK / 礼物补发", badge: "高危" },
      { to: "/account-actions", icon: ShieldOff, label: "账号处置", badge: "高危" },
      { to: "/knowledge", icon: FileText, label: "知识库配置" },
      { to: "/audit-logs", icon: Eye, label: "审计日志" }
    ]
  },
  {
    title: "用户管理",
    items: [
      { to: "/agents", icon: UsersRound, label: "客服管理" },
      { to: "/roles", icon: SlidersHorizontal, label: "角色权限", badge: "配置" }
    ]
  }
] satisfies Array<{
  title: string;
  items: Array<{ to: string; icon: LucideIcon; label: string; badge?: string }>;
}>;

function StaffFrame(props: { children: React.ReactNode }) {
  return (
    <main className="staff-shell">
      <aside className="side-rail">
        <Link className="brand-panel" to="/">
          <span>
            <Gamepad2 size={22} aria-hidden="true" />
          </span>
          <div>
            <strong>{APP_NAME}</strong>
            <small>Staff Console</small>
          </div>
        </Link>

        <nav className="module-nav" aria-label="后台模块导航">
          {navSections.map((section) => (
            <NavSection key={section.title} title={section.title}>
              {section.items.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </NavSection>
          ))}
        </nav>
      </aside>

      <section className="console">
        <header className="console-header">
          <div>
            <p className="eyebrow">Service desk operations</p>
            <h1>客服会话与工单处理台</h1>
            <span>客服负责会话和升级；管理员处理退款、补发、账号处置；超级管理员配置角色模块。</span>
          </div>
          <label className="command-search">
            <Search size={16} aria-hidden="true" />
            <input aria-label="搜索会话、订单、CDK、工单或用户" placeholder="搜索会话 / 订单 / CDK / 工单 / 用户" />
          </label>
        </header>
        {props.children}
      </section>
    </main>
  );
}

function DashboardPage() {
  return (
    <StaffFrame>
      <section className="kpi-grid" aria-label="运营指标">
        <KpiCard icon={<Headphones size={20} aria-hidden="true" />} label="待接待会话" value="9" detail="客服只处理会话与升级" tone="info" />
        <KpiCard icon={<Zap size={20} aria-hidden="true" />} label="Agent 命中" value="76%" detail="通过客服会话体现 Agent 能力" tone="primary" />
        <KpiCard icon={<ClipboardList size={20} aria-hidden="true" />} label="待处理工单" value="14" detail="管理员处理退款、补发、账号问题" tone="warning" />
        <KpiCard icon={<ShieldCheck size={20} aria-hidden="true" />} label="高风险动作" value="5" detail="必须由管理员确认并审计" tone="danger" />
      </section>

      <section className="dashboard-grid">
        <ConversationListPanel title="待接待会话" conversations={pendingConversations} link="/conversations/pending" />
        <TicketListPanel title="待处理工单" tickets={pendingTickets} link="/tickets/pending" />
        <RoleBoundaryPanel />
      </section>
    </StaffFrame>
  );
}

function ConversationListPage(props: { mode: "pending" | "accepted" }) {
  const isPending = props.mode === "pending";
  const list = isPending ? pendingConversations : acceptedConversations;

  return (
    <StaffFrame>
      <PageTitle
        kicker="Conversations"
        title={isPending ? "待接待会话" : "已接待会话"}
        detail={isPending ? "客服从这里接入排队用户，处理不了的业务升级为工单。" : "查看当前客服已接待和历史会话，支持回看上下文。"}
      />
      <ConversationListPanel title={isPending ? "排队列表" : "已接待与历史会话"} conversations={list} />
    </StaffFrame>
  );
}

function ConversationDetailPage() {
  const { id = "C-GM-250625-1028" } = useParams();
  const current = [...pendingConversations, ...acceptedConversations].find((item) => item.id === id) ?? pendingConversations[0];

  return (
    <StaffFrame>
      <section className="detail-layout">
        <article className="panel conversation-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Conversation {current.id}</p>
              <h2>{current.name} · {current.issue}</h2>
            </div>
            <span className="live-pill">
              <BadgeCheck size={14} aria-hidden="true" />
              客服接待中
            </span>
          </div>

          <div className="chat-stream">
            <Message author="消费者" text="我购买后订单显示完成，但没有看到激活码。" />
            <Message author="Agent 建议" text="识别为 CDK 未交付。订单已支付，权益状态 PENDING_DELIVERY，建议客服先安抚并升级补发工单。" agent />
            <Message author="客服" text="我先帮你确认交付状态。如果系统分配失败，会转管理员补发新的 CDK。" />
          </div>

          <div className="agent-suggestion">
            <Sparkles size={18} aria-hidden="true" />
            <div>
              <strong>客服边界</strong>
              <p>客服可以回复用户并升级工单；不能直接退款、补发 CDK、处理账号或配置知识库。</p>
            </div>
            <Link to="/tickets/pending">
              升级工单
              <ChevronRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </article>

        <aside className="panel context-card">
          <h3>订单与权益上下文</h3>
          <dl>
            <div>
              <dt>订单</dt>
              <dd>ORD-GM-20260625-018</dd>
            </div>
            <div>
              <dt>商品</dt>
              <dd>Neon Frontier 2099 豪华版</dd>
            </div>
            <div>
              <dt>权益</dt>
              <dd>PENDING_DELIVERY</dd>
            </div>
            <div>
              <dt>交付</dt>
              <dd>CDK 即时交付 · 异常重试 1 次</dd>
            </div>
          </dl>
        </aside>
      </section>
    </StaffFrame>
  );
}

function TicketListPage(props: { mode: "pending" | "resolved" }) {
  const isPending = props.mode === "pending";
  const tickets = isPending ? pendingTickets : resolvedTickets;

  return (
    <StaffFrame>
      <PageTitle
        kicker="Tickets"
        title={isPending ? "待处理工单" : "已处理工单"}
        detail={isPending ? "管理员处理退款审核、CDK/礼物补发、账号处置等业务工单。" : "查看已解决、已关闭或已驳回的历史工单。"}
      />
      <TicketListPanel title={isPending ? "待处理列表" : "已处理列表"} tickets={tickets} />
    </StaffFrame>
  );
}

function TicketDetailPage() {
  const { id = "WO-GM-250625-006" } = useParams();
  const ticket = [...pendingTickets, ...resolvedTickets].find((item) => item.id === id) ?? pendingTickets[1];

  return (
    <StaffFrame>
      <section className="detail-layout">
        <article className="panel ticket-detail">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Work Order {ticket.id}</p>
              <h2>{ticket.type} · {ticket.user}</h2>
            </div>
            <b className={`risk-badge risk-badge--${ticket.risk}`}>{ticket.risk}</b>
          </div>
          <div className="state-timeline">
            <Step title="客服升级" detail="从会话 C-GM-250625-1028 创建工单" done />
            <Step title="管理员处理" detail="核对订单、权益、风控和平台规则" done={ticket.state !== "待处理"} />
            <Step title="通知用户" detail="处理完成后回写会话并通知消费者" done={ticket.state !== "待处理"} />
          </div>
          <div className="danger-zone">
            <strong>高风险动作</strong>
            <p>退款、补发、账号处置都必须记录处理原因，并写入审计日志。</p>
            <Button variant="danger">确认处理</Button>
          </div>
        </article>

        <aside className="panel context-card">
          <h3>关联上下文</h3>
          <dl>
            <div>
              <dt>用户</dt>
              <dd>{ticket.user}</dd>
            </div>
            <div>
              <dt>工单状态</dt>
              <dd>{ticket.state}</dd>
            </div>
            <div>
              <dt>SLA</dt>
              <dd>{ticket.sla}</dd>
            </div>
            <div>
              <dt>关联订单</dt>
              <dd>ORD-GM-20260625-018</dd>
            </div>
          </dl>
        </aside>
      </section>
    </StaffFrame>
  );
}

function OperationPage(props: { kind: "refund" | "entitlement" | "account" | "knowledge" | "agents" | "audit" | "featured" | "flashSale" | "login" }) {
  const configs = {
    refund: ["退款审核", WalletCards, "检查是否已兑换、游戏时长、购买时间、异常记录和退款规则。", "审核退款"],
    entitlement: ["CDK / 礼物补发", RefreshCw, "废弃异常权益引用，生成补发记录并通知用户。", "执行补发"],
    account: ["账号处置", ShieldOff, "冻结、解冻或注销审核必须填写原因并二次确认。", "进入处置"],
    knowledge: ["知识库配置", FileText, "管理员维护 CDK 未交付 SOP、退款规则、礼物领取失败 FAQ。客服只读取命中内容。", "保存知识"],
    agents: ["客服管理", UsersRound, "管理员可查看客服接待量、满意度、在线状态和会话质量。", "查看客服"],
    audit: ["审计日志", Eye, "记录退款、补发、账号处置、权限配置等高风险操作。", "导出日志"],
    featured: ["首页精选游戏", Sparkles, "配置 C 端首页精选区展示的游戏、排序、展示文案和生效时间。", "保存精选"],
    flashSale: ["限时秒杀", Zap, "配置秒杀场次、开始结束时间、参与可售方案、秒杀价格和库存锁定策略。", "创建场次"],
    login: ["登录页", ShieldCheck, "阶段 2 轻量占位，后续接入真实认证和权限系统。", "进入系统"]
  } as const;
  const [title, Icon, detail, action] = configs[props.kind];

  return (
    <StaffFrame>
      <PageTitle kicker="Admin Module" title={title} detail={detail} />
      <section className="action-grid">
        <ActionCard icon={Icon} title={title} detail={detail} action={action} />
        <ActionCard icon={ClipboardList} title="关联工单" detail="业务处理入口来自工单详情，当前页面提供聚合处理视角。" action="查看工单" />
        <ActionCard icon={Eye} title="审计记录" detail="所有高风险操作都需要原因、处理人、时间和关联资源。" action="查看审计" />
      </section>
    </StaffFrame>
  );
}

function GameManagementPage() {
  return (
    <StaffFrame>
      <PageTitle
        kicker="Catalog Admin"
        title="游戏管理"
        detail="管理员维护游戏商品、版本、价格、折扣、交付方式和上下架状态。第一版先做静态原型，后续接入商品 API。"
      />
      <article className="panel game-admin-panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Game Catalog</p>
            <h2>游戏商品列表</h2>
          </div>
          <Button variant="primary" className="admin-primary">
            <PackageCheck size={16} aria-hidden="true" />
            新建游戏
          </Button>
        </div>
        <div className="game-admin-table" role="table" aria-label="游戏商品管理列表">
          <div className="game-admin-row game-admin-head" role="row">
            <span role="columnheader">游戏</span>
            <span role="columnheader">平台</span>
            <span role="columnheader">价格</span>
            <span role="columnheader">交付</span>
            <span role="columnheader">状态</span>
            <span role="columnheader">库存/权益</span>
            <span role="columnheader">操作</span>
          </div>
          {managedGames.map((game) => (
            <div className="game-admin-row" role="row" key={game.id}>
              <strong>{game.title}<small>{game.version} · {game.id}</small></strong>
              <span>{game.platform}</span>
              <span>{game.price}</span>
              <span>{game.delivery}</span>
              <b className={game.state === "已上架" ? "state-pill is-live" : game.state === "已下架" ? "state-pill is-offline" : "state-pill"}>{game.state}</b>
              <span>{game.stock}</span>
              <span className="row-actions">
                <Button size="sm">编辑</Button>
                <Button size="sm" variant={game.state === "已上架" ? "danger" : "secondary"}>{game.state === "已上架" ? "下架" : "上架"}</Button>
              </span>
            </div>
          ))}
        </div>
      </article>
    </StaffFrame>
  );
}

function RolesPage() {
  return (
    <StaffFrame>
      <PageTitle kicker="Super Admin" title="角色与模块权限配置" detail="通过角色控制系统模块显示。第一版先做静态配置矩阵，后续接入权限 API。" />
      <article className="panel matrix-panel">
        <div className="matrix-table" role="table" aria-label="角色模块权限矩阵">
          <div className="matrix-row matrix-head" role="row">
            <span role="columnheader">模块</span>
            <span role="columnheader">客服</span>
            <span role="columnheader">管理员</span>
            <span role="columnheader">超级管理员</span>
          </div>
          {roleMatrix.map((row) => (
            <div className="matrix-row" role="row" key={row.module}>
              <strong>{row.module}</strong>
              <Check enabled={row.support} />
              <Check enabled={row.admin} />
              <Check enabled={row.superAdmin} />
            </div>
          ))}
        </div>
      </article>
    </StaffFrame>
  );
}

function ConversationListPanel(props: { title: string; conversations: typeof pendingConversations; link?: string }) {
  return (
    <article className="panel list-card">
      <PanelTitle kicker="Support" title={props.title} action={props.link ? "进入列表" : undefined} link={props.link} />
      <div className="queue-list">
        {props.conversations.map((item) => (
          <Link className="queue-item" to={`/conversations/${item.id}`} key={item.id}>
            <span className={`risk-dot risk-dot--${item.risk}`}>{item.risk}</span>
            <div>
              <strong>{item.name}</strong>
              <p>{item.issue}</p>
              <small>{item.intent}</small>
            </div>
            <b>{item.wait}</b>
          </Link>
        ))}
      </div>
    </article>
  );
}

function TicketListPanel(props: { title: string; tickets: typeof pendingTickets; link?: string }) {
  return (
    <article className="panel ticket-panel">
      <PanelTitle kicker="Work Orders" title={props.title} action={props.link ? "进入列表" : undefined} link={props.link} />
      <div className="ticket-table" role="table" aria-label="业务工单列表">
        <div className="ticket-row ticket-head" role="row">
          <span role="columnheader">编号</span>
          <span role="columnheader">类型</span>
          <span role="columnheader">用户</span>
          <span role="columnheader">状态</span>
          <span role="columnheader">SLA</span>
          <span role="columnheader">风险</span>
        </div>
        {props.tickets.map((ticket) => (
          <Link className="ticket-row" to={`/tickets/${ticket.id}`} role="row" key={ticket.id}>
            <span>{ticket.id}</span>
            <span>{ticket.type}</span>
            <span>{ticket.user}</span>
            <span>{ticket.state}</span>
            <span>{ticket.sla}</span>
            <b className={`risk-badge risk-badge--${ticket.risk}`}>{ticket.risk}</b>
          </Link>
        ))}
      </div>
    </article>
  );
}

function RoleBoundaryPanel() {
  return (
    <aside className="panel permission-panel">
      <PanelTitle kicker="Permission Boundary" title="模块权限边界" />
      <div className="module-summary">
        <div>
          <strong>2</strong>
          <span>客服模块</span>
        </div>
        <div>
          <strong>8</strong>
          <span>管理员模块</span>
        </div>
      </div>
      <div className="hidden-list">
        <span>客服：仅会话功能</span>
        <span>知识库：管理员配置</span>
        <span>工单：管理员处理</span>
      </div>
    </aside>
  );
}

function NavSection(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="nav-section" aria-labelledby={`nav-section-${props.title}`}>
      <h2 className="nav-section-title" id={`nav-section-${props.title}`}>{props.title}</h2>
      <div className="nav-section-items">
        {props.children}
      </div>
    </section>
  );
}

function NavItem(props: { to: string; icon: LucideIcon; label: string; badge?: string }) {
  const Icon = props.icon;
  return (
    <NavLink to={props.to}>
      <Icon size={18} aria-hidden="true" />
      <span>{props.label}</span>
      {props.badge ? <b>{props.badge}</b> : null}
    </NavLink>
  );
}

function PageTitle(props: { kicker: string; title: string; detail: string }) {
  return <PageHeader className="page-title" kicker={props.kicker} title={props.title} detail={props.detail} />;
}

function PanelTitle(props: { kicker: string; title: string; action?: string; link?: string }) {
  return (
    <div className="panel-title">
      <div>
        <p className="eyebrow">{props.kicker}</p>
        <h2>{props.title}</h2>
      </div>
      {props.action && props.link ? (
        <Link className="panel-action" to={props.link}>
          {props.action}
          <ChevronRight size={15} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function Message(props: { author: string; text: string; agent?: boolean }) {
  return (
    <div className={props.agent ? "chat-message is-agent" : "chat-message"}>
      <span>{props.author}</span>
      <p>{props.text}</p>
    </div>
  );
}

function ActionCard(props: { icon: LucideIcon; title: string; detail: string; action: string }) {
  const Icon = props.icon;
  return (
    <article className="action-card">
      <Icon size={22} aria-hidden="true" />
      <div>
        <strong>{props.title}</strong>
        <p>{props.detail}</p>
      </div>
      <Button>{props.action}</Button>
    </article>
  );
}

function Step(props: { title: string; detail: string; done?: boolean }) {
  return (
    <div className={props.done ? "step is-done" : "step"}>
      <span>{props.done ? <ShieldCheck size={15} aria-hidden="true" /> : <LockKeyhole size={15} aria-hidden="true" />}</span>
      <div>
        <strong>{props.title}</strong>
        <p>{props.detail}</p>
      </div>
    </div>
  );
}

function Check(props: { enabled: boolean }) {
  return props.enabled ? (
    <span className="check is-on">
      <ShieldCheck size={14} aria-hidden="true" />
      显示
    </span>
  ) : (
    <span className="check">
      <LockKeyhole size={14} aria-hidden="true" />
      隐藏
    </span>
  );
}

const router = createBrowserRouter([
  { path: "/", element: <DashboardPage /> },
  { path: "/login", element: <OperationPage kind="login" /> },
  { path: "/conversations/pending", element: <ConversationListPage mode="pending" /> },
  { path: "/conversations/accepted", element: <ConversationListPage mode="accepted" /> },
  { path: "/conversations/:id", element: <ConversationDetailPage /> },
  { path: "/tickets/pending", element: <TicketListPage mode="pending" /> },
  { path: "/tickets/resolved", element: <TicketListPage mode="resolved" /> },
  { path: "/tickets/:id", element: <TicketDetailPage /> },
  { path: "/games", element: <GameManagementPage /> },
  { path: "/games/featured", element: <OperationPage kind="featured" /> },
  { path: "/games/flash-sales", element: <OperationPage kind="flashSale" /> },
  { path: "/refunds", element: <OperationPage kind="refund" /> },
  { path: "/entitlements", element: <OperationPage kind="entitlement" /> },
  { path: "/account-actions", element: <OperationPage kind="account" /> },
  { path: "/knowledge", element: <OperationPage kind="knowledge" /> },
  { path: "/agents", element: <OperationPage kind="agents" /> },
  { path: "/roles", element: <RolesPage /> },
  { path: "/audit-logs", element: <OperationPage kind="audit" /> },
  { path: "*", element: <DashboardPage /> }
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
