import * as cheerio from 'cheerio';

import { cmcService } from './cmc';
import { cryptoCurrencyService } from './crypto-currency';
import { CryptoInfo } from '~/interface';
import { utils } from '~/utils';
import { env } from '~/env.mjs';
import { IMAGE_LOTTO_FAIL_URLS, IMAGE_LOTTO_HAPPY_URLS } from '~/config/common.constant';

type CryptoInfoType = CryptoInfo | null;


const getBitkub = async (_currency: any): Promise<CryptoInfoType> => {
  const currency = cryptoCurrencyService.mapSymbolsThai(_currency);
  const response: any = await bitkub(currency);
  if (utils.isEmpty(response)) return null;

  const cryptoInfo = await cmcService.findOne(currency.toUpperCase());
  const logoInfo = await cryptoCurrencyService.getCurrencyLogo(
    _currency.toLowerCase(),
  );

  return {
    exchange: 'Bitkub',
    exchangeLogoUrl:
      'https://s2.coinmarketcap.com/static/img/exchanges/128x128/436.png',
    textColor: '#4CBA64',
    currencyName: cryptoInfo?.name,
    lastPrice: utils.priceFormat(response.last, '฿'),
    highPrice: utils.priceFormat(response.high24hr, '฿'),
    lowPrice: utils.priceFormat(response.low24hr, '฿'),
    volume_change_24h: utils.volumeChangeFormat(response.percentChange),
    priceChangeColor: utils.priceChangeColor(response.percentChange),
    last_updated: utils.lastUpdateFormat(null),
    urlLogo: logoInfo,
  };
};

const getSatangCorp = async (_currency: any): Promise<CryptoInfoType> => {
  const currency = cryptoCurrencyService.mapSymbolsThai(_currency);
  const response: any = await satangCorp(currency);
  if (utils.isEmpty(response)) return null;

  const cryptoInfo = await cmcService.findOne(currency.toUpperCase());
  const logoInfo = await cryptoCurrencyService.getCurrencyLogo(
    _currency.toLowerCase(),
  );

  return {
    exchange: 'Satang Pro',
    exchangeLogoUrl:
      'https://s2.coinmarketcap.com/static/img/exchanges/128x128/325.png',
    textColor: '#1717d1',
    currencyName: cryptoInfo?.name,
    lastPrice: utils.priceFormat(response.lastPrice, '฿'),
    highPrice: utils.priceFormat(response.highPrice, '฿'),
    lowPrice: utils.priceFormat(response.lowPrice, '฿'),
    volume_change_24h: utils.volumeChangeFormat(response.priceChange),
    priceChangeColor: utils.priceChangeColor(response.priceChange),
    last_updated: utils.lastUpdateFormat(null),
    urlLogo: logoInfo,
  };
};

const getBitazza = async (_currency: string): Promise<CryptoInfoType> => {
  const currency = cryptoCurrencyService.mapSymbolsThai(_currency);
  const response: any = await bitazza(currency);
  if (utils.isEmpty(response)) return null;

  const cryptoInfo = await cmcService.findOne(currency.toUpperCase());
  const logoInfo = await cryptoCurrencyService.getCurrencyLogo(
    _currency.toLowerCase(),
  );

  return {
    exchange: 'Bitazza',
    exchangeLogoUrl:
      'https://s2.coinmarketcap.com/static/img/exchanges/128x128/1124.png',
    textColor: '#8FA775',
    currencyName: cryptoInfo?.name,
    lastPrice: utils.expo(response.last_price, '฿'),
    highPrice: utils.priceFormat(response.highest_price_24h, '฿'),
    lowPrice: utils.priceFormat(response.lowest_price_24h, '฿'),
    volume_change_24h: utils.volumeChangeFormat(
      response.price_change_percent_24h,
    ),
    priceChangeColor: utils.priceChangeColor(
      response.price_change_percent_24h,
    ),
    last_updated: utils.lastUpdateFormat(null),
    urlLogo: logoInfo,
  };
};

const getBinance = async (
  _currency: string,
  pairCurrency: string,
): Promise<CryptoInfo | null> => {
  const currency = cryptoCurrencyService.mapSymbolsThai(_currency);
  const response: any = await binance(currency, pairCurrency);
  if (utils.isEmpty(response)) return null;

  const cryptoInfo = await cmcService.findOne(currency.toUpperCase());
  const logoInfo = await cryptoCurrencyService.getCurrencyLogo(
    _currency.toLowerCase(),
  );

  return {
    exchange: 'Binance',
    exchangeLogoUrl:
      'https://s2.coinmarketcap.com/static/img/exchanges/128x128/270.png',
    textColor: '#F0B909',
    currencyName: cryptoInfo?.name,
    lastPrice: utils.priceFormat(response.lastPrice, '$'),
    highPrice: utils.priceFormat(response.highPrice, '$'),
    lowPrice: utils.priceFormat(response.lowPrice, '$'),
    volume_change_24h: utils.volumeChangeFormat(
      response.priceChangePercent,
    ),
    priceChangeColor: utils.priceChangeColor(response.priceChangePercent),
    last_updated: utils.lastUpdateFormat(null),
    urlLogo: logoInfo,
  };
};

const getGeteio = async (_currency: string): Promise<CryptoInfoType> => {
  const currency = cryptoCurrencyService.mapSymbolsThai(_currency);
  const response: any = await geteIO(currency);
  if (utils.isEmpty(response)) return null;

  const cryptoInfo = await cmcService.findOne(currency.toUpperCase());
  const logoInfo = await cryptoCurrencyService.getCurrencyLogo(
    _currency.toLowerCase(),
  );

  return {
    exchange: 'Gate.io',
    exchangeLogoUrl:
      'https://s2.coinmarketcap.com/static/img/exchanges/128x128/302.png',
    textColor: '#CE615E',
    currencyName: cryptoInfo?.name,
    lastPrice: utils.priceFormat(response.last, '$'),
    highPrice: utils.priceFormat(response.high_24h, '$'),
    lowPrice: utils.priceFormat(response.low_24h, '$'),
    volume_change_24h: utils.volumeChangeFormat(
      response.change_percentage,
    ),
    priceChangeColor: utils.priceChangeColor(response.change_percentage),
    last_updated: utils.lastUpdateFormat(null),
    urlLogo: logoInfo,
  };
};

const getMexc = async (_currency: string): Promise<CryptoInfoType> => {
  const currency = cryptoCurrencyService.mapSymbolsThai(_currency);
  const response: any = await mexc(currency);
  if (utils.isEmpty(response)) return null;

  const cryptoInfo = await cmcService.findOne(currency.toUpperCase());
  const logoInfo = await cryptoCurrencyService.getCurrencyLogo(
    _currency.toLowerCase(),
  );

  return {
    exchange: 'MEXC',
    exchangeLogoUrl:
      'https://s2.coinmarketcap.com/static/img/exchanges/128x128/544.png',
    textColor: '#47DC90',
    currencyName: cryptoInfo?.name,
    lastPrice: utils.priceFormat(response.last, '$'),
    highPrice: utils.priceFormat(response.high, '$'),
    lowPrice: utils.priceFormat(response.low, '$'),
    volume_change_24h: utils.volumeChangeFormat(response.change_rate),
    priceChangeColor: utils.priceChangeColor(response.change_rate),
    last_updated: utils.lastUpdateFormat(null),
    urlLogo: logoInfo,
  };
};

const getCoinMarketCap = async (_currency: string): Promise<CryptoInfoType> => {
  const currency = cryptoCurrencyService.mapSymbolsThai(_currency);
  const response: any = await cmc(currency);
  if (utils.isEmpty(response)) return null;

  const quote = response.quote.USD;
  const logoInfo = await cryptoCurrencyService.getCurrencyLogo(
    _currency.toLowerCase(),
  );

  return {
    exchange: 'CoinMarketCap',
    exchangeLogoUrl: 'https://coinmarketcap.com/apple-touch-icon.png',
    textColor: '#3861FB',
    currencyName: response.name,
    lastPrice: utils.expo(quote.price, '$'),
    volume_24h: utils.expo(quote.volume_24h, '$'),
    cmc_rank: response.cmc_rank,
    volume_change_24h: utils.volumeChangeFormat(quote.percent_change_24h),
    priceChangeColor: utils.priceChangeColor(quote.percent_change_24h),
    last_updated: utils.lastUpdateFormat(quote.last_updated),
    urlLogo: logoInfo,
  };
};

const getCmcList = async (start: number, limit: number) => {
  const res: any = await cmcList(start, limit);
  await cmcService.addCoinsList(res);
};


const bitkub = async (currencyName: string): Promise<any> => {
  try {
    const response = await fetch(
      `https://api.bitkub.com/api/market/ticker?sym=THB_${currencyName.toUpperCase()}`
    );
    const data = await response.json();
    for (const key of Object.keys(data)) {
      const value = data[key];
      return value;
    }
  } catch (error) {
    console.error(error);
  }
};

const binance = async (
  currencyName: string,
  pairs = 'USDT',
): Promise<any> => {
  try {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${currencyName.toUpperCase()}${pairs.toUpperCase()}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

const bitazza = async (currencyName: string): Promise<any> => {
  try {
    const response = await fetch(
      `https://apexapi.bitazza.com:8443/AP/summary`
    );
    const data = await response.json();
    for (const key in data) {
      const value = data[key];
      if (value.trading_pairs === `${currencyName.toUpperCase()}_THB`) {
        return value;
      }
    }
  } catch (error) {
    console.error('bitazza is error: ', error);
  }
};

const geteIO = async (currencyName: string) => {
  try {
    const response = await fetch(
      `https://api.gateio.ws/api/v4/spot/tickers`
    );
    const data = await response.json();
    return data.filter(
      (val: any) =>
        val.currency_pair === `${currencyName.toUpperCase()}_USDT`,
    );
  } catch (error) {
    console.error(`gateio error: ${error}`);
  }
};


const mexc = async (currencyName: string): Promise<any> => {
  try {
    const response = await fetch(
      `https://www.mexc.com/open/api/v2/market/ticker?symbol=${currencyName}_USDT`
    );
    const data = await response.json();
    return data.data[0];
  } catch (error) {
    console.error('mexc is error: ', error);
  }
};

const cmc = async (currencyName: string): Promise<any> => {
  try {
    const coin = currencyName.toUpperCase();
    const cryptoInfo = await cmcService.findOne(coin);
    const url = `${env.CMC_URL}/v1/cryptocurrency/quotes/latest?id=${cryptoInfo?.id}`;
    const headers = {
      'X-CMC_PRO_API_KEY': env.CMC_API_KEY,
    };
    const response = await fetch(url, { headers });
    const data = await response.json();
    return data.data?.[`${cryptoInfo}`];
  } catch (error) {
    console.error('CoinMarkerCap is error: ', error);
  }
};

const cmcList = async (start: number, limit: number): Promise<any> => {
  try {
    const url = `${env.CMC_URL}/v1/cryptocurrency/map?start=${start}&limit=${limit}`;
    const headers = {
      'X-CMC_PRO_API_KEY': env.CMC_API_KEY,
    };
    const response = await fetch(url, { headers });
    const data = await response.json();
    console.log(data?.data);
    return data?.data;
  } catch (error) {
    console.error('CoinMarkerCap is error: ', error);
  }
};


const satangCorp = async (currencyName: string): Promise<any> => {
  try {
    const response = await fetch(
      `https://satangcorp.com/api/v3/ticker/24hr?symbol=${currencyName}_thb`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

const getGoldPrice = async (): Promise<any> => {
  try {
    const goldPrice: any = {};
    // Fetch HTML
    const response: any = await fetch('https://xn--42cah7d0cxcvbbb9x.com/');
    const data = await response.text();
    // Load HTML
    const $: any = cheerio.load(data);

    const goldBarPrices = $('div.divgta.goldshopf td:contains("ทองคำแท่ง")').parent().children();
    const getGoldBarColors = utils.getGoldPricesColors($, goldBarPrices);
    const goldJewelryPrices = $('div.divgta.goldshopf td:contains("ทองรูปพรรณ")').parent().children();
    const getGoldJewelryColors = utils.getGoldPricesColors($, goldJewelryPrices);
    const goldTodayChangePrices = $('div.divgta.goldshopf td:contains("วันนี้")').parent().children();
    const goldUpdatePrices = $('div.divgta.goldshopf tr td.span.bg-span.txtd.al-r').parent().children();

    const goldTodayChange: any = {};
    goldTodayChangePrices.each((index: any, el: any) => {
      if (index === 0) {
        const className = $(el).attr('class');
        if (className === 'span bg-span g-u') {
          goldTodayChange.color = "#0F8000";
          goldTodayChange.symbol = "🟢";
        } else if (className === 'span bg-span g-d') {
          goldTodayChange.color = "#E20303";
          goldTodayChange.symbol = "🔴";
        } else {
          goldTodayChange.color = "#444";
          goldTodayChange.symbol = "🟰";
        }
      }
    });

    // Select div items
    goldPrice.barSell = goldBarPrices.eq(1).text();
    goldPrice.barSellColor = getGoldBarColors[0];
    goldPrice.barBuy = goldBarPrices.eq(2).text();
    goldPrice.barBuyColor = getGoldBarColors[1];
    goldPrice.jewelrySell = goldJewelryPrices.eq(1).text();
    goldPrice.jewelrySellColor = getGoldJewelryColors[0];
    goldPrice.jewelryBuy = goldJewelryPrices.eq(2).text();
    goldPrice.jewelryBuyColor = getGoldJewelryColors[1];
    goldPrice.change = goldTodayChange.symbol + " " + goldTodayChangePrices.eq(2).text();
    goldPrice.changeColor = goldTodayChange.color;
    goldPrice.updateAt = goldUpdatePrices.eq(0).text() + ' ' + goldUpdatePrices.eq(1).text() + ' ' + goldUpdatePrices.eq(2).text();

    return goldPrice;
  } catch (error) {
    console.error(error);
  }
};

const getGasPrice = async (provider: string): Promise<any> => {
  try {
    // Fetch HTML
    const response = await fetch('http://gasprice.kapook.com/gasprice.php');
    const data = await response.text();
    // Load HTML
    const $: any = cheerio.load(data);
    // Select div items
    const gasPrice: any = [];
    // Select div items
    const providerName = $(
      `article.gasprice.${provider} > header > h3`,
    ).text();
    $(`article.gasprice.${provider} > ul > li`).each((i: any, elem: any) => {
      gasPrice.push({
        name: $(elem).find('span').text(),
        value: $(elem).find('em').text(),
      });
    });
    return {
      providerName: providerName,
      gasPrice: gasPrice,
    };
  } catch (error) {
    console.error(error);
  }
};



const getLotto = async (lottoNo: string[]): Promise<any> => {
  try {
    const requestOptions: RequestInit = {
      method: 'POST',
      redirect: 'follow',
    };

    const response = await fetch('https://www.glo.or.th/api/lottery/getLatestLottery', requestOptions);
    const data = await response.json();

    const lottoData = data?.response?.data;
    const lottoDate = data?.response?.date;
    const lottoAt = `วันที่ ${new Date(lottoDate).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;
    const options = {
      style: 'currency',
      currency: 'THB',
    };

    const prizes = [
      { name: 'รางวัลที่ 1', data: lottoData?.first, value: lottoData?.first?.number },
      { name: 'รางวัลที่ 2', data: lottoData?.second, value: lottoData?.second?.number },
      { name: 'รางวัลที่ 3', data: lottoData?.third, value: lottoData?.third?.number },
      { name: 'รางวัลที่ 4', data: lottoData?.fourth, value: lottoData?.fourth?.number },
      { name: 'รางวัลที่ 5', data: lottoData?.fifth, value: lottoData?.fifth?.number },
      { name: 'รางวัลเลขข้างเคียงรางวัลที่ 1', data: lottoData?.near1, value: lottoData?.near1?.number },
      { name: 'รางวัลเลขท้าย 2 ตัว', data: lottoData?.last2, value: lottoData?.last2?.number },
      { name: 'รางวัลเลขท้าย 3 ตัว', data: lottoData?.last3b, value: lottoData?.last3b?.number },
      { name: 'รางวัลเลขหน้า 3 ตัว', data: lottoData?.last3f, value: lottoData?.last3f?.number },
    ];

    const prizeValues = await Promise.all(prizes.map(async (prize) => {
      const matchingNumbers = prize.value?.filter((number: any) => lottoNo.includes(number?.value));
      const formattedNumber = Number(prize.data?.price).toLocaleString('en-US', options);
      return {
        name: `สลากของคุณถูก${prize.name} \nมูลค่า ${formattedNumber}\n\nขอแสดงความยินดีด้วยค่ะ 🎉`,
        value: matchingNumbers?.map((number: any) => number?.value)[0],
        price: prize.data?.price,
        lottoAt: lottoAt,
        image: utils.randomItems(IMAGE_LOTTO_HAPPY_URLS),
      };
    }));

    const lotto = prizeValues.filter((prize) => prize.value?.length);

    if (lotto.length === 0) {
      return lottoNo.map((item) => ({
        name: 'สลากของคุณไม่ถูกรางวัล... เสียใจด้วยนะค่ะ 😭',
        value: item,
        price: '',
        lottoAt: lottoAt,
        image: utils.randomItems(IMAGE_LOTTO_FAIL_URLS),
      }));
    }

    return lotto;
  } catch (error) {
    console.error(error);
  }
};

export const exchangeService = {
  getBitkub,
  getSatangCorp,
  getBitazza,
  getBinance,
  getGeteio,
  getMexc,
  getCoinMarketCap,
  getCmcList,
  getGoldPrice,
  getGasPrice,
  getLotto,
};