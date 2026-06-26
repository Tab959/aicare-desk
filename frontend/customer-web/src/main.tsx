import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  Form,
  Link,
  NavLink,
  RouterProvider,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";
import {
  BadgePercent,
  Bell,
  ChevronRight,
  CreditCard,
  Flame,
  Gamepad2,
  Gift,
  Headphones,
  KeyRound,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  UserRound
} from "lucide-react";
import { APP_NAME, mockEntitlements, mockGames, type GameProduct } from "@aicare/shared";
import { PageHeader, SectionTitle, TagRow } from "@aicare/ui";
import "@aicare/ui/styles.css";
import "./styles.css";

const games = mockGames;

function getPrimaryOffer(game: GameProduct) {
  return game.versions.flatMap((version) => version.offers).find((offer) => offer.status === "ACTIVE") ?? game.versions[0].offers[0];
}

const orders = [
  {
    id: "ORD-GM-20260625-018",
    gameId: "elden-ring",
    game: "Elden Ring 标准版 · CDK",
    state: "权益交付异常",
    amount: "¥198",
    delivery: "CDK 待交付",
    support: "CDK 未收到"
  },
  {
    id: "ORD-GM-20260624-072",
    gameId: "elden-ring",
    game: "Elden Ring 标准版 · Steam 礼物",
    state: "已完成",
    amount: "¥218",
    delivery: "Steam 礼物已领取",
    support: "查看会话"
  },
  {
    id: "ORD-GM-20260621-033",
    gameId: "cyberpunk-2077",
    game: "Cyberpunk 2077 终极版 · 授权下载资料",
    state: "可退款",
    amount: "¥58",
    delivery: "授权下载资料已交付",
    support: "申请退款"
  }
];

const salesRanking = games.slice(0, 5).map((game, index) => ({
  rank: index + 1,
  title: game.title,
  sales: ["12,486", "9,204", "7,911", "6,304", "5,280"][index],
  trend: ["+18%", "+12%", "+9%", "+6%", "+4%"][index]
}));

function StoreFrame(props: { children: React.ReactNode }) {
  return (
    <main className="store-shell">
      <StoreHeader />
      {props.children}
    </main>
  );
}

function StoreHeader() {
  const navigate = useNavigate();

  return (
    <header className="store-header">
      <Link className="brand-lockup" to="/" aria-label={`${APP_NAME} 首页`}>
        <span className="brand-orb">
          <Gamepad2 size={22} aria-hidden="true" />
        </span>
        <strong>{APP_NAME}</strong>
      </Link>

      <nav className="store-nav" aria-label="主导航">
        <NavLink to="/categories">分类</NavLink>
        <NavLink to="/deals">优惠</NavLink>
        <NavLink to="/flash-sale">限时秒杀</NavLink>
        <NavLink to="/orders">订单</NavLink>
        <NavLink to="/support">客服</NavLink>
        <NavLink to="/announcements">公告</NavLink>
      </nav>

      <Form className="global-search" action="/search" role="search">
        <Search size={16} aria-hidden="true" />
        <input name="q" aria-label="搜索游戏" placeholder="搜索游戏" />
        <button type="submit">搜索</button>
      </Form>

      <div className="header-actions" aria-label="用户操作">
        <button type="button" aria-label="通知">
          <Bell size={18} aria-hidden="true" />
        </button>
        <button type="button" aria-label="购物车" onClick={() => navigate("/cart")}>
          <ShoppingCart size={18} aria-hidden="true" />
        </button>
        <button type="button" aria-label="个人信息" onClick={() => navigate("/profile")}>
          <UserRound size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function HomePage() {
  const recommendedGame = games[0];
  const recommendedOffer = getPrimaryOffer(recommendedGame);

  return (
    <StoreFrame>
      <section className="home-hero">
        <article className="recommend-card">
          <div className="recommend-copy">
            <span className="eyebrow">
              <Sparkles size={15} aria-hidden="true" />
              为你推荐 · 基于浏览与购买行为
            </span>
            <h1>{recommendedGame.title}</h1>
            <p>根据你最近浏览的赛博朋克、开放世界和中文配音游戏推荐。</p>
            <TagRow tags={recommendedGame.tags} />
            <div className="hero-actions">
              <Link className="primary-button" to={`/games/${recommendedGame.id}`}>
                查看详情
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
              <Link className="ghost-button" to="/cart">
                <ShoppingCart size={18} aria-hidden="true" />
                加入购物车
              </Link>
            </div>
          </div>

          <Link className="recommend-cover" to={`/games/${recommendedGame.id}`} style={{ background: recommendedGame.cover }}>
            <span className="game-badge">{recommendedGame.discountLabel}</span>
            <div>
              <p>{recommendedGame.platform} · {recommendedOffer.purchaseMethod.name}</p>
              <h2>{recommendedGame.subtitle}</h2>
              <strong>
                {recommendedOffer.price.formatted}
                {recommendedOffer.originalPrice ? <del>{recommendedOffer.originalPrice.formatted}</del> : null}
              </strong>
            </div>
          </Link>
        </article>

        <SalesRanking />
      </section>

      <FeaturedGames title="精选游戏" games={games} />
    </StoreFrame>
  );
}

function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const filtered = q
    ? games.filter((game) => `${game.title} ${game.subtitle} ${game.tags.join(" ")} ${game.platform}`.toLowerCase().includes(q.toLowerCase()))
    : games;

  return (
    <StoreFrame>
      <section className="page-hero compact-hero">
        <div>
          <p className="eyebrow">Game Search</p>
          <h2>搜索游戏</h2>
          <span>搜索范围仅限游戏商品。后续接入后端搜索 API，现在先使用静态演示数据。</span>
        </div>
        <div className="hero-stat">
          <strong>{filtered.length}</strong>
          <span>条结果</span>
        </div>
      </section>

      <section className="content-grid search-grid">
        <aside className="filter-panel">
          <h2>筛选</h2>
          <FilterChip label="平台" values={["Steam"]} />
          <FilterChip label="购买方式" values={["CDK", "Steam 礼物", "成品账号", "离线账号游玩", "授权下载资料"]} />
          <FilterChip label="价格" values={["¥0-99", "¥100-199", "¥200+"]} />
        </aside>
        <div>
          <SectionTitle
            className="section-title"
            kicker="Search Results"
            title={q ? `“${q}” 的搜索结果` : "全部游戏"}
            action={<Link to="/deals">只看优惠</Link>}
          />
          <div className="search-result-list">
            {filtered.map((game) => (
              <SearchResultItem game={game} key={game.id} />
            ))}
          </div>
        </div>
      </section>
    </StoreFrame>
  );
}

function GameDetailPage() {
  const params = useParams();
  const game = games.find((item) => item.id === params.id) ?? games[0];
  const offer = getPrimaryOffer(game);

  return (
    <StoreFrame>
      <section className="detail-hero">
        <div className="detail-cover" style={{ background: game.cover }}>
          <span>{game.discountLabel}</span>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{game.platform} · {offer.purchaseMethod.name}</p>
          <h1>{game.title}</h1>
          <p>{game.description}</p>
          <TagRow tags={game.tags} />
          <div className="price-module">
            <strong>{offer.price.formatted}</strong>
            {offer.originalPrice ? <del>{offer.originalPrice.formatted}</del> : null}
            <span>{game.rating}</span>
          </div>
          <div className="hero-actions">
            <Link className="primary-button" to="/cart">
              <ShoppingCart size={18} aria-hidden="true" />
              加入购物车
            </Link>
            <Link className="ghost-button" to="/support">
              <Headphones size={18} aria-hidden="true" />
              咨询客服
            </Link>
          </div>
        </div>
      </section>

      <section className="detail-panels">
        <InfoPanel icon={KeyRound} title="数字权益" detail={`${offer.purchaseMethod.name} · ${offer.deliveryHandler}。异常场景可通过客服会话升级补发工单。`} />
        <InfoPanel icon={ShieldCheck} title="退款资格" detail="是否可退取决于权益是否兑换、购买时间、风控记录和平台规则。" />
        <InfoPanel icon={Gift} title="购买方式" detail="支持 CDK、Steam 礼物、成品账号、离线账号游玩和授权下载资料等演示交付方式。" />
      </section>
    </StoreFrame>
  );
}

function OrdersPage() {
  return (
    <StoreFrame>
      <PageHeading kicker="Orders" title="我的订单" detail="查看游戏订单、CDK/礼物权益交付状态，并从订单上下文进入客服。" />
      <section className="list-panel">
        {orders.map((order) => (
          <Link className="order-row" to={`/orders/${order.id}`} key={order.id}>
            <PackageCheck size={22} aria-hidden="true" />
            <div>
              <strong>{order.game}</strong>
              <span>{order.id}</span>
            </div>
            <b>{order.state}</b>
            <span>{order.amount}</span>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        ))}
      </section>
    </StoreFrame>
  );
}

function OrderDetailPage() {
  const params = useParams();
  const order = orders.find((item) => item.id === params.id) ?? orders[0];
  const entitlement = mockEntitlements[0];

  return (
    <StoreFrame>
      <PageHeading kicker="Order Detail" title={order.game} detail={`订单号：${order.id}`} />
      <section className="detail-panels">
        <InfoPanel icon={CreditCard} title="支付金额" detail={order.amount} />
        <InfoPanel icon={PackageCheck} title="权益状态" detail={`${entitlement.deliveryKind} · ${entitlement.status}`} />
        <InfoPanel icon={Headphones} title="售后入口" detail={order.support} />
      </section>
      <section className="support-card">
        <div>
          <h2>围绕该订单发起客服会话</h2>
          <p>客服会看到订单、游戏、权益和历史会话上下文。Agent 建议只通过客服会话体现。</p>
        </div>
        <Link className="primary-button" to="/support/sessions/C-GM-250625-1028">进入会话</Link>
      </section>
    </StoreFrame>
  );
}

function SupportPage() {
  const issues = ["CDK 未收到", "兑换失败", "礼物领取失败", "退款申请", "账号异常", "订单支付问题"];

  return (
    <StoreFrame>
      <PageHeading kicker="Support" title="客服中心" detail="选择问题类型后进入客服会话。客服负责沟通和升级，管理员处理退款、补发和账号处置。" />
      <section className="issue-grid">
        {issues.map((issue) => (
          <Link className="issue-card" to="/support/sessions/C-GM-250625-1028" key={issue}>
            <Headphones size={22} aria-hidden="true" />
            <strong>{issue}</strong>
            <span>进入会话</span>
          </Link>
        ))}
      </section>
    </StoreFrame>
  );
}

function SupportSessionPage() {
  return (
    <StoreFrame>
      <section className="session-layout">
        <article className="chat-panel">
          <PageHeading kicker="Session C-GM-250625-1028" title="Elden Ring CDK 未收到" detail="Agent 先识别意图并给客服建议，必要时客服升级工单。" />
          <Message author="我" text="我购买后订单显示完成，但没有看到激活码。" />
          <Message author="AI 助手" text="已识别为 CDK 未交付问题。建议转人工核对权益交付状态。" agent />
          <Message author="客服" text="我已看到订单，当前权益为待交付。我会帮你升级补发工单。" />
          <div className="reply-box">
            <input aria-label="输入消息" placeholder="输入消息，当前为静态原型" />
            <button type="button">发送</button>
          </div>
        </article>
        <aside className="context-panel">
          <h2>订单上下文</h2>
          <p>ORD-GM-20260625-018</p>
          <p>Elden Ring 标准版 · CDK</p>
          <p>权益状态：PENDING_DELIVERY</p>
          <Link className="ghost-button" to="/orders/ORD-GM-20260625-018">查看订单</Link>
        </aside>
      </section>
    </StoreFrame>
  );
}

function DealsPage() {
  return <StoreFrame><FeaturedGames title="优惠游戏" games={games.filter((game) => Boolean(getPrimaryOffer(game).originalPrice))} /></StoreFrame>;
}

function FlashSalePage() {
  return (
    <StoreFrame>
      <section className="page-hero compact-hero">
        <div>
          <p className="eyebrow">Flash Sale</p>
          <h2>限时秒杀</h2>
          <span>静态演示：后续接入活动库存、倒计时和下单限流。</span>
        </div>
        <div className="hero-stat">
          <strong>03:42:18</strong>
          <span>距离本场结束</span>
        </div>
      </section>
      <FeaturedGames title="本场秒杀" games={games.slice(0, 3)} />
    </StoreFrame>
  );
}

function CartPage() {
  return (
    <StoreFrame>
      <PageHeading kicker="Cart" title="购物车" detail="第一版只做静态下单演示，不接入真实支付。" />
      <section className="support-card">
        <div>
          <h2>Elden Ring 标准版</h2>
          <p>Elden Ring 标准版 · CDK · 支付完成后生成数字权益记录。</p>
        </div>
        <strong className="cart-total">¥198</strong>
        <button className="primary-button" type="button">提交演示订单</button>
      </section>
    </StoreFrame>
  );
}

function ProfilePage() {
  return (
    <StoreFrame>
      <PageHeading kicker="Profile" title="个人中心" detail="展示账号、订单、权益和客服入口。后续接入登录后替换为真实用户数据。" />
      <section className="detail-panels">
        <InfoPanel icon={UserRound} title="账号" detail="demo-player-01" />
        <InfoPanel icon={PackageCheck} title="订单" detail="3 个近期订单" />
        <InfoPanel icon={Headphones} title="客服" detail="1 个进行中会话" />
      </section>
    </StoreFrame>
  );
}

function ReservedPage(props: { title: string; detail: string }) {
  return (
    <StoreFrame>
      <PageHeading kicker="Reserved" title={props.title} detail={props.detail} />
      <section className="empty-card">该入口已保留，阶段 2 暂不做完整页面。</section>
    </StoreFrame>
  );
}

function FeaturedGames(props: { title: string; games: GameProduct[] }) {
  return (
    <section className="featured-section">
      <SectionTitle
        className="section-title"
        kicker="Featured Games"
        title={props.title}
        action={(
          <Link to="/search">
          查看全部
          <ChevronRight size={16} aria-hidden="true" />
          </Link>
        )}
      />

      <div className="game-cards">
        {props.games.map((game) => (
          <GameCard game={game} key={game.id} />
        ))}
      </div>
    </section>
  );
}

function GameCard(props: { game: GameProduct }) {
  const game = props.game;
  const offer = getPrimaryOffer(game);

  return (
    <Link className="game-card" to={`/games/${game.id}`}>
      <span className="cover-art" style={{ background: game.cover }}>
        <BadgePercent size={18} aria-hidden="true" />
        <b>{game.discountLabel}</b>
      </span>
      <span className="game-meta">
        <strong>{game.title}</strong>
        <small>{game.subtitle}</small>
      </span>
      <TagRow tags={game.tags.slice(0, 3)} />
      <span className="price-row">
        <b>{offer.price.formatted}</b>
        {offer.originalPrice ? <del>{offer.originalPrice.formatted}</del> : null}
      </span>
    </Link>
  );
}

function SearchResultItem(props: { game: GameProduct }) {
  const game = props.game;
  const offer = getPrimaryOffer(game);

  return (
    <Link className="search-result-item" to={`/games/${game.id}`}>
      <span className="result-cover" style={{ background: game.cover }}>
        <b>{game.discountLabel}</b>
      </span>
      <span className="result-main">
        <strong>{game.title}</strong>
        <small>{game.subtitle}</small>
        <span>{game.description}</span>
        <TagRow tags={game.tags.slice(0, 4)} />
      </span>
      <span className="result-side">
        <em>{game.platform}</em>
        <b>{offer.price.formatted}</b>
        {offer.originalPrice ? <del>{offer.originalPrice.formatted}</del> : null}
      </span>
    </Link>
  );
}

function SalesRanking() {
  return (
    <aside className="sales-ranking" aria-label="过去24小时销量榜">
      <div className="ranking-heading">
        <span>
          <Flame size={16} aria-hidden="true" />
          Sales Ranking
        </span>
        <strong>过去 24h 销量榜</strong>
      </div>
      <ol>
        {salesRanking.map((item) => (
          <li key={item.title}>
            <b>{item.rank}</b>
            <div>
              <strong>{item.title}</strong>
              <small>{item.sales} 份 · {item.trend}</small>
            </div>
            <TrendingUp size={17} aria-hidden="true" />
          </li>
        ))}
      </ol>
    </aside>
  );
}

function PageHeading(props: { kicker: string; title: string; detail: string }) {
  return <PageHeader className="page-heading" kicker={props.kicker} title={props.title} detail={props.detail} />;
}

function InfoPanel(props: { icon: React.ElementType; title: string; detail: string }) {
  const Icon = props.icon;
  return (
    <article className="info-panel">
      <Icon size={22} aria-hidden="true" />
      <strong>{props.title}</strong>
      <p>{props.detail}</p>
    </article>
  );
}

function FilterChip(props: { label: string; values: string[] }) {
  return (
    <div className="filter-group">
      <strong>{props.label}</strong>
      <div>
        {props.values.map((value) => (
          <button type="button" key={value}>{value}</button>
        ))}
      </div>
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

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/search", element: <SearchPage /> },
  { path: "/games/:id", element: <GameDetailPage /> },
  { path: "/deals", element: <DealsPage /> },
  { path: "/flash-sale", element: <FlashSalePage /> },
  { path: "/orders", element: <OrdersPage /> },
  { path: "/orders/:id", element: <OrderDetailPage /> },
  { path: "/support", element: <SupportPage /> },
  { path: "/support/sessions/:id", element: <SupportSessionPage /> },
  { path: "/cart", element: <CartPage /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/categories", element: <ReservedPage title="分类" detail="分类入口保留，第一版暂不开发完整分类页。" /> },
  { path: "/announcements", element: <ReservedPage title="公告" detail="公告入口保留，第一版暂不开发完整公告页。" /> },
  { path: "*", element: <ReservedPage title="页面不存在" detail="请从顶部导航回到已实现的阶段 2 原型页面。" /> }
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
