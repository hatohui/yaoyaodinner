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
  featureTableRoast: "feature.tableRoast",
  featureGuestRoast: "feature.guestRoast",
  roastDirtyChance: "roast.dirtyChance",
  roastTableCooldown: "roast.tableCooldownSeconds",
  roastPersonCooldown: "roast.personCooldownSeconds",
  roastPersonDailyLimit: "roast.personDailyLimit",
  roastDailyLimit: "roast.dailyLimit",
  roastMaxMembers: "roast.maxMembers",
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
    label: "Pre-order deadline (event time zone)",
    value: "",
  },
  {
    key: CONFIG_KEYS.ordersAutoConfirm,
    type: "boolean",
    isPublic: true,
    category: "orders",
    label: "Confirm pre-orders at the deadline",
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
  {
    key: CONFIG_KEYS.featureTableRoast,
    type: "boolean",
    isPublic: true,
    category: "features",
    label: "Table roasts",
    value: true,
  },
  {
    key: CONFIG_KEYS.featureGuestRoast,
    type: "boolean",
    isPublic: true,
    category: "features",
    label: "Guest roasts",
    value: true,
  },
  {
    key: CONFIG_KEYS.roastDirtyChance,
    type: "number",
    isPublic: false,
    category: "roast",
    label: "Dirty roast chance (0.0 to 1.0)",
    value: 0.5,
  },
  {
    key: CONFIG_KEYS.roastTableCooldown,
    type: "number",
    isPublic: false,
    category: "roast",
    label: "Table roast cooldown (seconds)",
    value: 90,
  },
  {
    key: CONFIG_KEYS.roastPersonCooldown,
    type: "number",
    isPublic: false,
    category: "roast",
    label: "Guest roast cooldown (seconds)",
    value: 15,
  },
  {
    key: CONFIG_KEYS.roastPersonDailyLimit,
    type: "number",
    isPublic: false,
    category: "roast",
    label: "Roasts per guest per day",
    value: 4,
  },
  {
    key: CONFIG_KEYS.roastDailyLimit,
    type: "number",
    isPublic: false,
    category: "roast",
    label: "Total roasts per day",
    value: Number(process.env.ROAST_DAILY_LIMIT) || 1_500,
  },
  {
    key: CONFIG_KEYS.roastMaxMembers,
    type: "number",
    isPublic: false,
    category: "roast",
    label: "Max guests per table roast",
    value: 16,
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
