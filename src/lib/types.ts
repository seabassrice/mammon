// Asset type definitions

export type AssetType = "physical" | "digital_game" | "subscription";

export type PhysicalStatus = "in_use" | "idle" | "reselling" | "discarded" | "donated";

export type SubscriptionCycle = "monthly" | "yearly" | "custom" | "once";

export interface BaseAsset {
  id: string;
  type: AssetType;
  name: string;
  category: string;
  tags: string[];
  price: number;
  image?: string;
  image_urls?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicalAsset extends BaseAsset {
  type: "physical";
  purchaseDate: string;
  brand?: string;
  purchaseChannel?: string;
  storageLocation?: string;
  warrantyExpire?: string;
  status: PhysicalStatus;
}

export interface DigitalGameAsset extends BaseAsset {
  type: "digital_game";
  addedDate: string;
  platform: "Steam" | "Epic" | "PS" | "Xbox" | "Other";
  activated: boolean;
  completed: boolean;
}

export interface SubscriptionAsset extends BaseAsset {
  type: "subscription";
  billingCycle: SubscriptionCycle;
  cycleDays?: number; // for custom cycle
  firstBillingDate: string;
  nextBillingDate: string;
  autoRenew: boolean;
}

export type Asset = PhysicalAsset | DigitalGameAsset | SubscriptionAsset;

export const ASSET_CATEGORIES: Record<AssetType, string[]> = {
  physical: [
    "电子产品",
    "服装鞋帽",
    "家具家居",
    "图书文具",
    "运动户外",
    "厨具餐具",
    "美妆个护",
    "玩具模型",
    "收藏品",
    "其他实物",
  ],
  digital_game: [
    "3A大作",
    "独立游戏",
    "休闲游戏",
    "多人竞技",
    "模拟经营",
    "角色扮演",
    "动作冒险",
    "射击游戏",
    "策略游戏",
    "其他游戏",
  ],
  subscription: [
    "视频会员",
    "音乐会员",
    "云存储",
    "AI服务",
    "健身会员",
    "学习会员",
    "游戏订阅",
    "工具软件",
    "新闻资讯",
    "其他订阅",
  ],
};

export const PHYSICAL_STATUS_OPTIONS: { value: PhysicalStatus; label: string }[] = [
  { value: "in_use", label: "在用" },
  { value: "idle", label: "闲置" },
  { value: "reselling", label: "转卖" },
  { value: "discarded", label: "丢弃" },
  { value: "donated", label: "赠送" },
];

export const SUBSCRIPTION_CYCLE_OPTIONS: { value: SubscriptionCycle; label: string }[] = [
  { value: "monthly", label: "月付" },
  { value: "yearly", label: "年付" },
  { value: "custom", label: "自定义" },
  { value: "once", label: "永久/一次性" },
];

export const PLATFORM_OPTIONS = [
  "Steam",
  "Epic",
  "PS",
  "Xbox",
  "Other",
] as const;