import { attendanceService } from "@/features/attendance/services/attendance";
import { bubbleTemplate } from "@/lib/validation/line";
import { db } from "@/lib/database";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { sendMessage } from "@/lib/utils/line-utils";

export const handleWorkAttendanceCommand = async (req: any) => {
  const userId = req.body.events[0].source.userId;
  const userAccount = await db.account.findFirst({
    where: { providerAccountId: userId },
  });
  if (!userAccount) {
    const payload = bubbleTemplate.signIn();
    await sendMessage(req, flexMessage(payload));
    return;
  }
  const attendance = await attendanceService.getTodayAttendance(
    userAccount.userId,
  );
  if (attendance) {
    const payload = bubbleTemplate.workStatus(attendance);
    await sendMessage(req, flexMessage(payload));
  } else {
    const payload = bubbleTemplate.workCheckIn();
    await sendMessage(req, flexMessage(payload));
  }
};
