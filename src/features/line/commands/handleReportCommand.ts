import { db } from '../../../lib/database/db';
import { bubbleTemplate } from '@/lib/validation/line';
import { sendMessage } from '../../../lib/utils/line-utils';
import { flexMessage } from '@/lib/utils/line-message-utils';
import { utils } from '@/lib/validation';
import { handleReportMenu } from './handleReportMenu';

export const handleReportCommand = async (req: any) => {
  const userId = req.body.events[0].source.userId;
  const userAccount = await db.account.findFirst({
    where: { providerAccountId: userId }
  });
  const isPermissionExpired = !userAccount || !userAccount.expires_at || !utils.compareDate(userAccount.expires_at.toString(), new Date().toISOString());
  if (isPermissionExpired) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }

  await handleReportMenu(req);
};
