import type { DigitalEntitlement, GameProduct, PurchaseMethod, WorkOrderReference } from "./index";

export const purchaseMethods: PurchaseMethod[] = [
  {
    code: "CDK",
    name: "CDK",
    description: "自动分配并展示加密库存中的激活码。",
    deliveryHandler: "CDK_AUTO",
    requiresManualReview: false
  },
  {
    code: "STEAM_GIFT",
    name: "Steam 礼物",
    description: "由平台演示发送礼物交付记录。",
    deliveryHandler: "STEAM_GIFT_MANUAL",
    requiresManualReview: true
  },
  {
    code: "ACCOUNT",
    name: "成品账号",
    description: "交付加密保存的账号资料。",
    deliveryHandler: "ACCOUNT_MANUAL",
    requiresManualReview: true
  },
  {
    code: "OFFLINE_PLAY",
    name: "离线账号游玩",
    description: "交付离线账号游玩说明和有效期信息。",
    deliveryHandler: "OFFLINE_PLAY_MANUAL",
    requiresManualReview: true
  },
  {
    code: "DOWNLOAD",
    name: "授权下载资料",
    description: "交付授权或演示资料的受控下载信息。",
    deliveryHandler: "DOWNLOAD_LINK_MANUAL",
    requiresManualReview: true
  }
];

const method = (code: PurchaseMethod["code"]) => {
  const found = purchaseMethods.find((item) => item.code === code);
  if (!found) {
    throw new Error(`Missing purchase method mock: ${code}`);
  }
  return found;
};

export const mockGames: GameProduct[] = [
  {
    id: "elden-ring",
    steamAppId: "1245620",
    title: "Elden Ring",
    subtitle: "开放世界魂系动作 RPG",
    description: "以 Steam 游戏售卖为核心的演示商品，支持不同版本和购买方式。",
    platform: "Steam",
    publishStatus: "LISTED",
    cover: "linear-gradient(135deg, #f59e0b 0%, #4c1d95 48%, #020617 100%)",
    tags: ["RPG", "开放世界", "动作"],
    rating: "特别好评",
    discountLabel: "-35%",
    versions: [
      {
        id: "elden-ring-standard",
        versionCode: "STANDARD",
        versionTitle: "标准版",
        description: "游戏本体。",
        status: "ACTIVE",
        offers: [
          {
            id: "offer-elden-standard-cdk",
            offerCode: "ELDEN_STANDARD_CDK",
            title: "标准版 · CDK",
            purchaseMethod: method("CDK"),
            price: { amount: 198, currency: "CNY", formatted: "¥198" },
            originalPrice: { amount: 298, currency: "CNY", formatted: "¥298" },
            stockQuantity: 12480,
            deliveryKind: "CDK",
            deliveryHandler: "CDK_AUTO",
            status: "ACTIVE"
          },
          {
            id: "offer-elden-standard-gift",
            offerCode: "ELDEN_STANDARD_STEAM_GIFT",
            title: "标准版 · Steam 礼物",
            purchaseMethod: method("STEAM_GIFT"),
            price: { amount: 218, currency: "CNY", formatted: "¥218" },
            stockQuantity: 180,
            deliveryKind: "STEAM_GIFT",
            deliveryHandler: "STEAM_GIFT_MANUAL",
            status: "ACTIVE"
          }
        ]
      },
      {
        id: "elden-ring-deluxe",
        versionCode: "DELUXE",
        versionTitle: "豪华版",
        description: "游戏本体与数字美术设定集。",
        status: "ACTIVE",
        offers: [
          {
            id: "offer-elden-deluxe-account",
            offerCode: "ELDEN_DELUXE_ACCOUNT",
            title: "豪华版 · 成品账号",
            purchaseMethod: method("ACCOUNT"),
            price: { amount: 268, currency: "CNY", formatted: "¥268" },
            stockQuantity: 24,
            deliveryKind: "ACCOUNT",
            deliveryHandler: "ACCOUNT_MANUAL",
            status: "ACTIVE"
          }
        ]
      }
    ]
  },
  {
    id: "cyberpunk-2077",
    steamAppId: "1091500",
    title: "Cyberpunk 2077",
    subtitle: "夜之城开放世界冒险",
    description: "用于展示多版本、多购买方式和售后权益分流的 Steam 商品。",
    platform: "Steam",
    publishStatus: "LISTED",
    cover: "linear-gradient(135deg, #fde047 0%, #0f766e 45%, #020617 100%)",
    tags: ["开放世界", "科幻", "剧情"],
    rating: "多半好评",
    discountLabel: "-50%",
    versions: [
      {
        id: "cyberpunk-ultimate",
        versionCode: "ULTIMATE",
        versionTitle: "终极版",
        description: "游戏本体与资料片合集。",
        status: "ACTIVE",
        offers: [
          {
            id: "offer-cyberpunk-ultimate-offline",
            offerCode: "CYBERPUNK_ULTIMATE_OFFLINE",
            title: "终极版 · 离线账号游玩",
            purchaseMethod: method("OFFLINE_PLAY"),
            price: { amount: 89, currency: "CNY", formatted: "¥89" },
            stockQuantity: 60,
            deliveryKind: "OFFLINE_PLAY",
            deliveryHandler: "OFFLINE_PLAY_MANUAL",
            status: "ACTIVE"
          },
          {
            id: "offer-cyberpunk-ultimate-download",
            offerCode: "CYBERPUNK_ULTIMATE_DOWNLOAD",
            title: "终极版 · 授权下载资料",
            purchaseMethod: method("DOWNLOAD"),
            price: { amount: 58, currency: "CNY", formatted: "¥58" },
            stockQuantity: 999,
            deliveryKind: "DOWNLOAD",
            deliveryHandler: "DOWNLOAD_LINK_MANUAL",
            status: "ACTIVE"
          }
        ]
      }
    ]
  }
];

export const mockEntitlements: DigitalEntitlement[] = [
  {
    id: "ENT-ELDEN-001",
    orderId: "ORD-GM-20260625-018",
    orderItemId: "OI-ELDEN-001",
    gameId: "elden-ring",
    versionId: "elden-ring-standard",
    offerId: "offer-elden-standard-cdk",
    purchaseMethodCode: "CDK",
    deliveryKind: "CDK",
    status: "PENDING_DELIVERY",
    displayText: "CDK 待分配"
  }
];

export const mockWorkOrderReference: WorkOrderReference = {
  orderId: "ORD-GM-20260625-018",
  orderItemId: "OI-ELDEN-001",
  entitlementId: "ENT-ELDEN-001",
  offerId: "offer-elden-standard-cdk",
  purchaseMethodCode: "CDK",
  deliveryKind: "CDK"
};
