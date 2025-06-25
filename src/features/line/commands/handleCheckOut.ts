import { attendanceService } from "@/features/attendance/services/attendance";
import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";

export const handleCheckOut = async (req: any, userId: string) => {
  try {
    const currentAttendance =
      await attendanceService.getTodayAttendance(userId);
    if (!currentAttendance) {
      const payload = bubbleTemplate.workError("ไม่พบการลงชื่อเข้างานวันนี้");
      await sendMessage(req, flexMessage(payload));
      return;
    }
    if (
      currentAttendance.status === "CHECKED_OUT" ||
      currentAttendance.status === "AUTO_CHECKOUT_MIDNIGHT"
    ) {
      const payload = bubbleTemplate.workCheckOutSuccess(
        currentAttendance.checkInTime,
        currentAttendance.checkOutTime || new Date(),
      );
      await sendMessage(req, flexMessage(payload));
      return;
    }
    const result = await attendanceService.checkOut(userId);
    if (result.success && result.checkInTime && result.expectedCheckOutTime) {
      const payload = bubbleTemplate.workCheckOutSuccess(
        result.checkInTime,
        result.expectedCheckOutTime,
      );
      await sendMessage(req, flexMessage(payload));
    } else if (
      !result.success &&
      result.checkInTime &&
      result.expectedCheckOutTime
    ) {
      const payload = bubbleTemplate.workCheckOutSuccess(
        result.checkInTime,
        result.expectedCheckOutTime,
      );
      await sendMessage(req, flexMessage(payload));
    } else {
      const payload = bubbleTemplate.workError(result.message);
      await sendMessage(req, flexMessage(payload));
    }
  } catch (error) {
    console.error("Error in handleCheckOut:", error);
    const payload = bubbleTemplate.workError("เกิดข้อผิดพลาดในระบบ");
    await sendMessage(req, flexMessage(payload));
  }
};
