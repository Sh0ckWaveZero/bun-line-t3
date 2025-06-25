import { db } from '@/lib/database';
import { bubbleTemplate } from '@/lib/validation/line';
import { sendMessage } from '@/lib/utils/line-utils';
import { flexMessage } from '@/lib/utils/line-message-utils';

export const handleLeaveCommandWrapper = async (conditions: any[], req: any) => {
  const userId = req.body.events[0].source.userId;
  const userAccount = await db.account.findFirst({ where: { providerAccountId: userId } });
  if (!userAccount?.userId) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }
  const [date, type, ...reasonArr] = conditions;
  const { handleLeaveCommand } = await import('./handleLeaveCommand');
  const result = await handleLeaveCommand({
    userId: userAccount.userId,
    date,
    type,
    reason: reasonArr?.join(' ')
  });
  if (result.error) {
    const payload = bubbleTemplate.leaveError(result.message);
    return sendMessage(req, flexMessage(payload));
  }
  return sendMessage(req, [{ type: 'text', text: result.message }]);
};
