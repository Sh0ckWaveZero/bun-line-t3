import { exchangeService } from '@/features/crypto/services/exchange';
import { getFlexMessage, replyNotFound } from '@/lib/utils/line-message-utils';

export const handleGasCommand = async (conditions: any[], req: any) => {
  if (conditions.length === 0) return replyNotFound(req);
  const promises = [exchangeService.getGasPrice(conditions[0])];
  await getFlexMessage(req, promises);
};
