/**
 * Simple Bitkub symbol mapping without duplicates
 */
export const BITKUB_SYMBOL_MAP: { [key: string]: string } = {
  // Major cryptocurrencies
  BTC: "BTC_THB",
  ETH: "ETH_THB",
  ADA: "ADA_THB",
  DOT: "DOT_THB",
  LINK: "LINK_THB",
  LTC: "LTC_THB",
  XRP: "XRP_THB",
  BCH: "BCH_THB",
  ETC: "ETC_THB",
  XLM: "XLM_THB",
  ZIL: "ZIL_THB",
  OMG: "OMG_THB",
  UNI: "UNI_THB",
  USDT: "USDT_THB",
  USDC: "USDC_THB",
  BAND: "BAND_THB",
  ALPHA: "ALPHA_THB",
  NEAR: "NEAR_THB",
  AVAX: "AVAX_THB",
  MATIC: "MATIC_THB",
  ATOM: "ATOM_THB",
  ALGO: "ALGO_THB",
  SAND: "SAND_THB",
  MANA: "MANA_THB",
  DOGE: "DOGE_THB",
  SHIB: "SHIB_THB",
  AXS: "AXS_THB",
  BNB: "BNB_THB",
  CAKE: "CAKE_THB",
  GALA: "GALA_THB",
  SOL: "SOL_THB",
  LUNA: "LUNA_THB",
  TRX: "TRX_THB",
  APE: "APE_THB",
  GMT: "GMT_THB",
  PEPE: "PEPE_THB",
  FLOKI: "FLOKI_THB",
  SUI: "SUI_THB",
  ARB: "ARB_THB",
  MAGIC: "MAGIC_THB",
  IMX: "IMX_THB",
  PENDLE: "PENDLE_THB",
  // Thai projects
  JFIN: "JFIN_THB",
  SIX: "SIX_THB",
  // Gaming tokens
  SLP: "SLP_THB",
  SKILL: "SKILL_THB",
  ALICE: "ALICE_THB",
  // DeFi tokens
  AAVE: "AAVE_THB",
  COMP: "COMP_THB",
  MKR: "MKR_THB",
  SUSHI: "SUSHI_THB",
  CRV: "CRV_THB",
  SNX: "SNX_THB",
  GRT: "GRT_THB",
  DYDX: "DYDX_THB",
  // Layer 2 & Infrastructure
  SCRT: "SCRT_THB",
  KSM: "KSM_THB",
  KDA: "KDA_THB",
  FLOW: "FLOW_THB",
  EGLD: "EGLD_THB",
  // Meme coins
  RACA: "RACA_THB",
  SUPER: "SUPER_THB",
  HIGH: "HIGH_THB",
  // Others
  VET: "VET_THB",
  CHZ: "CHZTHB",
  ENJ: "ENJ_THB",
  FTT: "FTT_THB",
  LOOKS: "LOOKS_THB",
};

/**
 * Convert crypto symbol to Bitkub THB pair format
 */
export function convertToThbPair(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  return BITKUB_SYMBOL_MAP[upperSymbol] || `${upperSymbol}_THB`;
}

/**
 * Get list of all supported symbols
 */
export function getSupportedSymbols(): string[] {
  return Object.keys(BITKUB_SYMBOL_MAP);
}

/**
 * Check if symbol is supported by Bitkub
 */
export function isSymbolSupported(symbol: string): boolean {
  return symbol.toUpperCase() in BITKUB_SYMBOL_MAP;
}
