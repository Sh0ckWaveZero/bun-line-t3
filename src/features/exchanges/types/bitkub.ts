export interface BitkubConnectionStatus {
  connected: boolean;
  configured: boolean;
  keyHint: string | null;
  lastSyncedAt: string | null;
}

export interface BitkubBuy {
  id: string;
  externalTradeIdentity: string;
  externalOrderId: string;
  spentTHB: string;
  feeTHB: string;
  receivedBTC: string;
  rate: string;
  executedAt: string;
  imported: boolean;
}

export interface BitkubBuyPage {
  buys: BitkubBuy[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type BitkubBuyStatusFilter = "all" | "ready" | "imported";

export interface BitkubSyncResult {
  cached: number;
  rejected: number;
  nextCursor: string | null;
}

export interface BitkubImportOutcome {
  buyId: string;
  status: "imported" | "already_imported" | "legacy_conflict";
}
