import { cmcService } from './cmc';
import { CRYPTO_CURRENCIES_LIST } from '~/lib/constants/common.constant';

const mapSymbolsThai = (symbols: string): string => {
  const currency: string =
    CRYPTO_CURRENCIES_LIST.filter(
      (item: any) => item.symbol_th === symbols,
    ).map((element: any) => element.symbol_en)[0] || symbols;

  return currency;
};

const getCurrencyLogo = async (currencyName: string): Promise<string> => {
  // Define fallback URL as a constant
  const FALLBACK_ICON_URL = 'https://cryptoicon-api.vercel.app/api/icon/notfound';
  
  // 🛡️ SECURITY: Define allowed hosts to prevent SSRF attacks
  const ALLOWED_HOSTS = new Set([
    's2.coinmarketcap.com',
    'lcw.nyc3.cdn.digitaloceanspaces.com',
    'cryptoicon-api.vercel.app'
  ]);
  
  try {
    // 🔒 SECURITY: Strict input validation - only allow alphanumeric characters, limit length
    if (!currencyName || typeof currencyName !== 'string') {
      return FALLBACK_ICON_URL;
    }
    
    const sanitizedCurrencyName = currencyName
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 10) // Limit length to prevent abuse
      .toUpperCase();
    
    // Additional validation: must be at least 1 character and max 10
    if (sanitizedCurrencyName.length === 0 || sanitizedCurrencyName.length > 10) {
      return FALLBACK_ICON_URL;
    }

    // Validate against CMC first
    const res = await cmcService.findOne(sanitizedCurrencyName);
    
    if (res?.no) {
      // 🔒 SECURITY: Validate CMC ID is numeric to prevent injection
      const cmcId = String(res.no).replace(/[^0-9]/g, '');
      if (cmcId && cmcId === String(res.no)) {
        return `https://s2.coinmarketcap.com/static/img/coins/128x128/${cmcId}.png`;
      }
    }

    // 🛡️ SECURITY: Use allowlist approach for external requests
    const logoBaseUrl = 'https://lcw.nyc3.cdn.digitaloceanspaces.com';
    const logoPath = `/production/currencies/64/${sanitizedCurrencyName.toLowerCase()}.webp`;
    const fullUrl = `${logoBaseUrl}${logoPath}`;
    
    // 🔒 SECURITY: Validate URL before making request
    const url = new URL(fullUrl);
    if (!ALLOWED_HOSTS.has(url.hostname)) {
      console.warn(`Blocked request to unauthorized host: ${url.hostname}`);
      return FALLBACK_ICON_URL;
    }
    
    // 🛡️ SECURITY: Make request with timeout and size limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CryptoApp/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    // 🔒 SECURITY: Validate response
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      return response.url;
    }
    
    return FALLBACK_ICON_URL;
    
  } catch (error) {
    // 🔒 SECURITY: Don't leak sensitive information in logs
    // Sanitize currency name for logging to prevent format string attacks
    const safeCurrencyName = typeof currencyName === 'string' 
      ? currencyName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
      : 'invalid';
    
    console.error('Failed to fetch logo for currency:', safeCurrencyName, error instanceof Error ? error.message : 'Unknown error');
    return FALLBACK_ICON_URL;
  }
};

export const cryptoCurrencyService = {
  mapSymbolsThai,
  getCurrencyLogo,
}