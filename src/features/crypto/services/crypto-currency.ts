import { CRYPTO_CURRENCIES_LIST } from "@/lib/constants/common.constant";
import { cmcService } from "./cmc";

const mapSymbolsThai = (symbols: string): string => {
  const currency: string =
    CRYPTO_CURRENCIES_LIST.filter(
      (item: any) => item.symbol_th === symbols,
    ).map((element: any) => element.symbol_en)[0] || symbols;

  return currency;
};

// SSRF Protection: Hardcoded allowlist of trusted hosts
const TRUSTED_IMAGE_HOSTS = Object.freeze([
  "s2.coinmarketcap.com",
  "lcw.nyc3.cdn.digitaloceanspaces.com",
  "cryptoicon-api.vercel.app",
] as const);

// SSRF Protection: Validate URL is safe to fetch
const isUrlSafeToFetch = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);

    // Only allow HTTPS protocol
    if (url.protocol !== "https:") {
      return false;
    }

    // Check against hardcoded allowlist
    if (
      !TRUSTED_IMAGE_HOSTS.includes(
        url.hostname as (typeof TRUSTED_IMAGE_HOSTS)[number],
      )
    ) {
      return false;
    }

    // Block internal/private IP addresses
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname.endsWith(".local") ||
      hostname.includes("internal")
    ) {
      return false;
    }

    // Ensure no credentials in URL
    if (url.username || url.password) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

const getCurrencyLogo = async (currencyName: string): Promise<string> => {
  // Hardcoded fallback URL (not user-controlled)
  const FALLBACK_ICON_URL =
    "https://cryptoicon-api.vercel.app/api/icon/notfound";

  try {
    // SSRF Protection: Strict input validation
    if (!currencyName || typeof currencyName !== "string") {
      return FALLBACK_ICON_URL;
    }

    // SSRF Protection: Sanitize input - only alphanumeric, limited length
    const sanitizedCurrencyName = currencyName
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 10)
      .toUpperCase();

    if (
      sanitizedCurrencyName.length === 0 ||
      sanitizedCurrencyName.length > 10
    ) {
      return FALLBACK_ICON_URL;
    }

    // Try CMC first (returns hardcoded URL pattern, not user-controlled)
    const res = await cmcService.findOne(sanitizedCurrencyName);

    if (res?.no) {
      // SSRF Protection: Validate CMC ID is numeric
      const cmcId = String(res.no).replace(/[^0-9]/g, "");
      if (cmcId && cmcId === String(res.no)) {
        // Hardcoded URL template - safe from SSRF
        return `https://s2.coinmarketcap.com/static/img/coins/128x128/${cmcId}.png`;
      }
    }

    // SSRF Protection: Generate URL using hardcoded template
    // Only the currency name (alphanumeric, max 10 chars) is interpolated
    const imageUrl = `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/${sanitizedCurrencyName.toLowerCase()}.webp`;

    // SSRF Protection: Final URL validation before fetch
    if (!isUrlSafeToFetch(imageUrl)) {
      return FALLBACK_ICON_URL;
    }

    // SSRF Protection: Validate path pattern
    const url = new URL(imageUrl);
    const expectedPathPattern =
      /^\/production\/currencies\/64\/[a-z0-9]{1,10}\.webp$/;
    if (!expectedPathPattern.test(url.pathname)) {
      return FALLBACK_ICON_URL;
    }

    // SSRF Protection: Fetch with strict controls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        method: "GET",
        headers: {
          "User-Agent": "CryptoApp/1.0",
          Accept: "image/webp,image/*,*/*;q=0.8",
        },
        redirect: "error", // Prevent redirect-based SSRF
        referrerPolicy: "no-referrer",
      });

      clearTimeout(timeoutId);

      // SSRF Protection: Strict response validation
      if (
        response.ok &&
        response.status === 200 &&
        response.headers.get("content-type")?.startsWith("image/") &&
        response.url === imageUrl // Ensure no redirects occurred
      ) {
        return response.url;
      }

      return FALLBACK_ICON_URL;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // SSRF Protection: Sanitize error logging
    const safeCurrencyName =
      typeof currencyName === "string"
        ? currencyName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)
        : "invalid";

    console.error(
      "Failed to fetch logo for currency:",
      safeCurrencyName,
      error instanceof Error ? error.message : "Unknown error",
    );
    return FALLBACK_ICON_URL;
  }
};

export const cryptoCurrencyService = {
  mapSymbolsThai,
  getCurrencyLogo,
};
