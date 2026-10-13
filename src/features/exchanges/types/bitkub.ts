export interface BitkubConnectionStatus {
  connected: boolean;
  configured: boolean;
  keyHint: string | null;
  lastSyncedAt: string | null;
}

export interface BitkubBalance {
  currency: string;
  available: string;
  reserved: string;
  total: string;
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
  totalPages: number;
}

export interface BitkubSyncResult {
  cached: number;
  rejected: number;
  nextCursor: string | null;
}

export interface BitkubImportOutcome {
  buyId: string;
  status: "imported" | "already_imported" | "legacy_conflict";
}
