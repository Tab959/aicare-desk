export const APP_NAME = "GameCare Desk";

export type TenantScopedId = {
  tenantId: string;
  id: string;
};

export type Money = {
  amount: number;
  currency: "CNY" | "USD";
  formatted: string;
};

export type PurchaseMethodCode = "CDK" | "STEAM_GIFT" | "ACCOUNT" | "OFFLINE_PLAY" | "DOWNLOAD";

export type DeliveryKind = PurchaseMethodCode;

export type PurchaseMethod = {
  code: PurchaseMethodCode;
  name: string;
  description: string;
  deliveryHandler: string;
  requiresManualReview: boolean;
};

export type GameOffer = {
  id: string;
  offerCode: string;
  title: string;
  purchaseMethod: PurchaseMethod;
  price: Money;
  originalPrice?: Money;
  stockQuantity: number;
  deliveryKind: DeliveryKind;
  deliveryHandler: string;
  status: "ACTIVE" | "DISABLED" | "SOLD_OUT";
};

export type GameVersion = {
  id: string;
  versionCode: string;
  versionTitle: string;
  description: string;
  status: "ACTIVE" | "DISABLED" | "ARCHIVED";
  offers: GameOffer[];
};

export type GameProduct = {
  id: string;
  steamAppId?: string;
  title: string;
  subtitle: string;
  description: string;
  platform: "Steam";
  publishStatus: "DRAFT" | "LISTED" | "UNLISTED" | "ARCHIVED";
  cover: string;
  tags: string[];
  rating: string;
  discountLabel?: string;
  versions: GameVersion[];
};

export type EntitlementStatus =
  | "PENDING_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "REFUNDED"
  | "REISSUED";

export type DigitalEntitlement = {
  id: string;
  orderId: string;
  orderItemId: string;
  gameId: string;
  versionId: string;
  offerId: string;
  purchaseMethodCode: PurchaseMethodCode;
  deliveryKind: DeliveryKind;
  status: EntitlementStatus;
  displayText: string;
};

export type WorkOrderStatus =
  | "UNASSIGNED"
  | "PENDING"
  | "IN_PROGRESS"
  | "WAITING_CUSTOMER"
  | "WAITING_ADMIN_REVIEW"
  | "COMPLETED"
  | "CLOSED"
  | "REJECTED"
  | "ESCALATED"
  | "TIMED_OUT";

export type WorkOrderReference = {
  orderId: string;
  orderItemId: string;
  entitlementId: string;
  offerId: string;
  purchaseMethodCode: PurchaseMethodCode;
  deliveryKind: DeliveryKind;
};

export * from "./mock-data";
