import { attendanceService } from "@/features/attendance/services/attendance";
import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";

export const handleCheckIn = async (req: any, userId: string) => {
  try {
    const result = await attendanceService.checkIn(userId);
    if (result.success && result.checkInTime && result.expectedCheckOutTime) {
      if (result.isLateCheckIn) {
        const bubblePayload = bubbleTemplate.workCheckInLateSuccess(
          result.checkInTime,
          result.expectedCheckOutTime,
        );
        await sendMessage(req, flexMessage(bubblePayload));
      } else if (result.isEarlyCheckIn && result.actualCheckInTime) {
        const payload = bubbleTemplate.workCheckInEarlySuccess(
          result.actualCheckInTime,
          result.checkInTime,
          result.expectedCheckOutTime,
        );
        await sendMessage(req, flexMessage(payload));
      } else {
        const bubblePayload = bubbleTemplate.workCheckInSuccess(
          result.checkInTime,
          result.expectedCheckOutTime,
        );
        await sendMessage(req, flexMessage(bubblePayload));
      }
    } else if (
      result.alreadyCheckedIn &&
      result.checkInTime &&
      result.expectedCheckOutTime
    ) {
      const payload = bubbleTemplate.workAlreadyCheckedIn(result.checkInTime);
      await sendMessage(req, flexMessage(payload));
    } else {
      if (result.message.includes("วันหยุดประจำปี")) {
        const payload = bubbleTemplate.workPublicHoliday(result.message);
        await sendMessage(req, flexMessage(payload));
      } else {
        const payload = bubbleTemplate.workError(result.message);
        await sendMessage(req, flexMessage(payload));
      }
    }
  } catch (error) {
    console.error("Error in handleCheckIn:", error);
    const payload = bubbleTemplate.workError("เกิดข้อผิดพลาดในระบบ");
    await sendMessage(req, flexMessage(payload));
  }
};
