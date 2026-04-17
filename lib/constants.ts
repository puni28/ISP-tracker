export const ASSET_TYPES = ["POLE", "NODE", "AMPLIFIER", "SPLITTER", "COUPLER"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const CABLE_TYPES = ["F2", "F4", "F6", "F8", "COAX", "AERIAL"] as const;
export type CableType = (typeof CABLE_TYPES)[number];

export const CABLE_STATUS = ["ACTIVE", "FAULTY", "DECOMMISSIONED"] as const;
export type CableStatus = (typeof CABLE_STATUS)[number];

export const SPLIT_RATIOS = ["1:2", "1:4", "1:8", "1:16", "1:32"] as const;

export const ASSET_COLORS: Record<AssetType, string> = {
  POLE: "#6b7280",
  NODE: "#7c3aed",
  AMPLIFIER: "#dc2626",
  SPLITTER: "#16a34a",
  COUPLER: "#2563eb",
};

export const CABLE_COLORS: Record<CableType, string> = {
  F2: "#fde047",
  F4: "#f97316",
  F6: "#ea580c",
  F8: "#dc2626",
  COAX: "#3b82f6",
  AERIAL: "#22c55e",
};

export const CABLE_UNITS: Record<CableType, string> = {
  F2: "dBm",
  F4: "dBm",
  F6: "dBm",
  F8: "dBm",
  COAX: "dBmV",
  AERIAL: "dBmV",
};

export const ASSET_LABELS: Record<AssetType, string> = {
  POLE: "Pole",
  NODE: "Node",
  AMPLIFIER: "Amplifier",
  SPLITTER: "Splitter",
  COUPLER: "Coupler",
};

export const CABLE_LABELS: Record<CableType, string> = {
  F2: "2F Fiber",
  F4: "4F Fiber",
  F6: "6F Fiber",
  F8: "8F Fiber",
  COAX: "Coaxial",
  AERIAL: "Aerial",
};
