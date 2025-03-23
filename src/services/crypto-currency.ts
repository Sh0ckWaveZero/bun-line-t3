import { cmcService } from './cmc';
import { CRYPTO_CURRENCIES_LIST } from '~/config/common.constant';

const mapSymbolsThai = (symbols: string): string => {
  const currency: string =
    CRYPTO_CURRENCIES_LIST.filter(
      (item: any) => item.symbol_th === symbols,
    ).map((element: any) => element.symbol_en)[0] || symbols;

  return currency;
};

const getCurrencyLogo = async (currencyName: string): Promise<any> => {
  try {
    // Sanitize input: only allow alphanumeric characters
    const sanitizedCurrencyName = currencyName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // Validate against CMC first
    const res = await cmcService.findOne(sanitizedCurrencyName);
    const cmcCurrenciesLogo = `https://s2.coinmarketcap.com/static/img/coins/128x128/${res?.no}.png`;

    let response: any;
    if (!res) {
      // Use a fixed hostname and sanitized path
      const logoBaseUrl = 'https://lcw.nyc3.cdn.digitaloceanspaces.com';
      const logoPath = `/production/currencies/64/${sanitizedCurrencyName.toLowerCase()}.webp`;

      response = await fetch(`${logoBaseUrl}${logoPath}`);
    }

    return res ? cmcCurrenciesLogo : response.url;
  } catch (error) {
    return 'https://cryptoicon-api.vercel.app/api/icon/notfound';
  }
};

export const cryptoCurrencyService = {
  mapSymbolsThai,
  getCurrencyLogo,
}