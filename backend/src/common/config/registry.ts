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
  defaultTableCapacity: "table.defaultCapacity",
  suggestedReactions: "feedback.suggestedReactions",
  featureFeedbackWall: "feature.feedbackWall",
  featureFloorPlan: "feature.floorPlan",
  featureOrdering: "feature.ordering",
  featureTables: "feature.tables",
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
    key: CONFIG_KEYS.featureOrdering,
    type: "boolean",
    isPublic: true,
    category: "features",
    label: "Ordering",
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
