import { db } from '@/lib/database';
import { utils } from '@/lib/validation';
import { bubbleTemplate } from '@/lib/validation/line';
import { sendMessage } from '@/lib/utils/line-utils';
import { flexMessage } from '@/lib/utils/line-message-utils';

export const handleCheckOutCommand = async (req: any) => {
  const userId = req.body.events[0].source.userId;
  const userAccount = await db.account.findFirst({
    where: { providerAccountId: userId }
  });
  const isPermissionExpired = !userAccount || !userAccount.expires_at || !utils.compareDate(userAccount.expires_at.toString(), new Date().toISOString());
  if (isPermissionExpired) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }
  if (userAccount?.userId) {
    const { handleCheckOut } = await import('./handleCheckOut');
    await handleCheckOut(req, userAccount.userId);
  }
};
