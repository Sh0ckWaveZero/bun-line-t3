interface CryptoInfo {
  exchange?: string;
  exchangeLogoUrl?: string;
  textColor?: string;
  currencyName?: string;
  lastPrice?: string;
  lastPriceRaw?: number;
  highPrice?: string;
  lowPrice?: string;
  changePrice?: string;
  changePriceOriginal?: number;
  urlLogo: string;
  volume_24h?: string;
  volume_change_24h?: string;
  market_cap?: string;
  last_updated?: string;
  priceChangeColor?: string;
  cmc_rank?: string;
}

interface CryptoCurrency {
  symbol_th: string;
  symbol_en: string;
}

export type { CryptoCurrency, CryptoInfo };
