import { exchangeService } from '@/features/crypto/services/exchange';
import { getFlexMessage } from '@/lib/utils/line-message-utils';

export const handleExchangeCommand = async (command: string, conditions: any[], req: any) => {
  const promises: any[] = [];
  const options = '';
  switch (command) {
    case 'bk':
    case 'bitkub':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBitkub(condition));
      });
      break;
    case 'st':
    case 'satang':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getSatangCorp(condition));
      });
      break;
    case 'btz':
    case 'bitazza':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBitazza(condition));
      });
      break;
    case 'bn':
    case 'binance':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBinance(condition, 'USDT'));
      });
      break;
    case 'bnbusd':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBinance(condition, 'BUSD'));
      });
      break;
    case 'gate':
    case 'gateio':
    case 'gt':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getGeteio(condition));
      });
      break;
    case 'mexc':
    case 'mx':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getMexc(condition));
      });
      break;
    case 'cmc':
    case 'coinmarketcap':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getCoinMarketCap(condition));
      });
      break;
    default:
      return false;
  }
  await getFlexMessage(req, promises, options);
  return true;
};
