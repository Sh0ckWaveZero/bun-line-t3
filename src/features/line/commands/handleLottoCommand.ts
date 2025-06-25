import { exchangeService } from '@/features/crypto/services/exchange';
import { getFlexMessage } from '@/lib/utils/line-message-utils';

export const handleLottoCommand = async (conditions: any[], req: any) => {
  const promises = [exchangeService.getLotto(conditions)];
  await getFlexMessage(req, promises, 'lotto');
};
