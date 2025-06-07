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

    // Validate against allowlist of known currency names
    const ALLOWED_CURRENCY_NAMES = new Set(['BTC', 'ETH', 'BNB', 'ADA', 'DOGE']); // Example allowlist
    if (!ALLOWED_CURRENCY_NAMES.has(sanitizedCurrencyName)) {
      console.warn('Currency name not in allowlist:', sanitizedCurrencyName);
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

    // 🛡️ SECURITY: Use predefined URL patterns to prevent SSRF
    const SAFE_URL_PATTERNS = {
      'lcw': (currency: string) => `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/${currency.toLowerCase()}.webp`,
      'generic': () => FALLBACK_ICON_URL
    };
    
    // 🔒 SECURITY: Generate URL using safe pattern only
    const safeUrl = SAFE_URL_PATTERNS.lcw(sanitizedCurrencyName);
    
    // 🛡️ SECURITY: Double-check URL is still in allowlist
    const url = new URL(safeUrl);
    if (!ALLOWED_HOSTS.has(url.hostname)) {
      console.warn('Generated URL hostname not in allowlist');
      return FALLBACK_ICON_URL;
    }
    
    // 🔒 SECURITY: Additional URL validation - ensure path matches expected pattern
    const expectedPathPattern = /^\/production\/currencies\/64\/[a-z0-9]{1,10}\.webp$/;
    if (!expectedPathPattern.test(url.pathname)) {
      console.warn('Generated URL path does not match expected pattern');
      return FALLBACK_ICON_URL;
    }
    
    // 🛡️ SECURITY: Make request with strict controls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(safeUrl, {
        signal: controller.signal,
        method: 'GET', // Explicitly set to GET only
        headers: {
          'User-Agent': 'CryptoApp/1.0',
          'Accept': 'image/webp,image/*,*/*;q=0.8'
        },
        redirect: 'error', // Don't follow redirects to prevent redirect-based attacks
        referrerPolicy: 'no-referrer'
      });
      
      clearTimeout(timeoutId);
      
      // 🔒 SECURITY: Strict response validation
      if (response.ok && 
          response.status === 200 &&
          response.headers.get('content-type')?.startsWith('image/') &&
          response.url === safeUrl) { // Ensure no redirects occurred
        return response.url;
      }
      
      return FALLBACK_ICON_URL;
      
    } finally {
      clearTimeout(timeoutId);
    }
    
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