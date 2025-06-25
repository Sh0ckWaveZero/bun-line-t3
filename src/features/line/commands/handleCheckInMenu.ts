import { checkUserAuthAndAttendance } from '@/lib/attendance-utils';
import { bubbleTemplate } from '@/lib/validation/line';
import { sendMessage } from '../../../lib/utils/line-utils';
import { flexMessage } from '@/lib/utils/line-message-utils';

export const handleCheckInMenu = async (req: any) => {
  const userId = req.body.events[0].source.userId;
  const result = await checkUserAuthAndAttendance(userId);
  if (result.auth.needsSignIn) {
    const payload = bubbleTemplate.signIn();
    await sendMessage(req, flexMessage(payload));
    return;
  }
  if (result.attendance?.hasAttendance) {
    const payload = bubbleTemplate.workStatus(result.attendance.attendance);
    await sendMessage(req, flexMessage(payload));
  } else {
    const payload = bubbleTemplate.workCheckIn();
    await sendMessage(req, flexMessage(payload));
  }
};
