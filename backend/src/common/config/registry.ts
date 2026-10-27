export type ConfigType = "string" | "number" | "boolean" | "json";

export interface ConfigDefault {
  key: string;
  type: ConfigType;
  isPublic: boolean;
  category: string;
  label: string;
  value: unknown;
}

export const CONFIG_KEYS = {
  adminPassphrase: "auth.adminPassphrase",
  pinLength: "event.pinLength",
  dinnerTime: "event.dinnerTime",
  timezone: "event.timezone",
  ordersDeadline: "orders.deadline",
  ordersAutoConfirm: "orders.autoConfirm",
  dinnerPriceEditable: "orders.dinnerPriceEditable",
  bannerEnabled: "banner.enabled",
  bannerMessage: "banner.message",
  defaultTableCapacity: "table.defaultCapacity",
  suggestedReactions: "feedback.suggestedReactions",
  featureFeedbackWall: "feature.feedbackWall",
  featureFloorPlan: "feature.floorPlan",
  featureMenu: "feature.ordering",
  featureTables: "feature.tables",
  featureTableCodes: "feature.tableCodes",
} as const;

export const CONFIG_DEFAULTS: ConfigDefault[] = [
  {
    key: CONFIG_KEYS.adminPassphrase,
    type: "string",
    isPublic: false,
    category: "auth",
    label: "Admin passphrase",
    value: process.env.ADMIN_PASSPHRASE ?? "barkbark",
  },
  {
    key: CONFIG_KEYS.pinLength,
    type: "number",
    isPublic: true,
    category: "event",
    label: "Guest PIN length",
    value: 4,
  },
  {
    key: CONFIG_KEYS.dinnerTime,
    type: "string",
    isPublic: true,
    category: "event",
    label: "Dinner time (event time zone)",
    value: "",
  },
  {
    key: CONFIG_KEYS.timezone,
    type: "string",
    isPublic: true,
    category: "event",
    label: "Time zone",
    value: "Asia/Kuala_Lumpur",
  },
  {
    key: CONFIG_KEYS.ordersDeadline,
    type: "string",
    isPublic: true,
    category: "orders",
    label: "Order deadline (event time zone)",
    value: "",
  },
  {
    key: CONFIG_KEYS.ordersAutoConfirm,
    type: "boolean",
    isPublic: true,
    category: "orders",
    label: "Confirm orders at the deadline",
    value: true,
  },
  {
    key: CONFIG_KEYS.dinnerPriceEditable,
    type: "boolean",
    isPublic: true,
    category: "orders",
    label: "Guests can edit prices during dinner",
    value: true,
  },
  {
    key: CONFIG_KEYS.bannerEnabled,
    type: "boolean",
    isPublic: true,
    category: "banner",
    label: "Show banner",
    value: false,
  },
  {
    key: CONFIG_KEYS.bannerMessage,
    type: "string",
    isPublic: true,
    category: "banner",
    label: "Banner message",
    value: "",
  },
  {
    key: CONFIG_KEYS.defaultTableCapacity,
    type: "number",
    isPublic: true,
    category: "tables",
    label: "Default table capacity",
    value: 8,
  },
  {
    key: CONFIG_KEYS.suggestedReactions,
    type: "json",
    isPublic: true,
    category: "feedback",
    label: "Suggested reactions",
    value: ["👍", "❤️", "😂", "🎉", "🔥"],
  },
  {
    key: CONFIG_KEYS.featureFeedbackWall,
    type: "boolean",
    isPublic: true,
    category: "features",
    label: "Feedback wall",
    value: true,
  },
  {
    key: CONFIG_KEYS.featureFloorPlan,
    type: "boolean",
    isPublic: true,
    category: "features",
    label: "Floor-plan map",
    value: true,
  },
  {
    key: CONFIG_KEYS.featureMenu,
    type: "boolean",
    isPublic: true,
    category: "features",
    label: "Menu",
    value: true,
  },
  {
    key: CONFIG_KEYS.featureTables,
    type: "boolean",
    isPublic: true,
    category: "features",
    label: "Tables",
    value: true,
  },
  {
    key: CONFIG_KEYS.featureTableCodes,
    type: "boolean",
    isPublic: true,
    category: "features",
    label: "Table codes",
    value: true,
  },
];

export function parseConfigValue(type: string, raw: string): unknown {
  switch (type) {
    case "number":
      return Number(raw);
    case "boolean":
      return raw === "true";
    case "json":
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    default:
      return raw;
  }
}

export function serializeConfigValue(type: ConfigType, value: unknown): string {
  switch (type) {
    case "number":
      return String(value);
    case "boolean":
      return value ? "true" : "false";
    case "json":
      return JSON.stringify(value);
    default:
      return String(value);
  }
}
