import axios from 'axios';
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
    const res = await cmcService.findOne(currencyName.toUpperCase());
    const cmcCurrenciesLogo = `https://s2.coinmarketcap.com/static/img/coins/128x128/${res?.no}.png`;
    let response: any;
    if (!res) {
      response = await axios.get(
        `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/${currencyName}.webp`,
      );
    }

    return res ? cmcCurrenciesLogo : response.config.url;
  } catch (error) {
    return 'https://cryptoicon-api.vercel.app/api/icon/notfound';
  }
};


export const cryptoCurrencyService = {
  mapSymbolsThai,
  getCurrencyLogo,
}