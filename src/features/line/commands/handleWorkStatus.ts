import { attendanceService } from "@/features/attendance/services/attendance";
import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";

export const handleWorkStatus = async (req: any, userId: string) => {
  try {
    const attendance = await attendanceService.getTodayAttendance(userId);
    if (attendance) {
      const payload = bubbleTemplate.workStatus(attendance);
      await sendMessage(req, flexMessage(payload));
    } else {
      const payload = bubbleTemplate.workCheckIn();
      await sendMessage(req, flexMessage(payload));
    }
  } catch (error) {
    console.error("Error in handleWorkStatus:", error);
    const payload = bubbleTemplate.workError("เกิดข้อผิดพลาดในระบบ");
    await sendMessage(req, flexMessage(payload));
  }
};
