import { attendanceService } from '@/features/attendance/services/attendance';
import { bubbleTemplate } from '@/lib/validation/line';
import { sendMessage } from '../../../lib/utils/line-utils';
import { flexMessage } from '@/lib/utils/line-message-utils';

export const handleMonthlyReport = async (req: any, userId: string, monthType: string | null) => {
  try {
    let month: string;
    const now = new Date();
    if (monthType === 'current') {
      month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    } else if (monthType === 'previous') {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      month = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}`;
    } else {
      month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    const report = await attendanceService.getMonthlyAttendanceReport(userId, month);
    if (report && report.attendanceRecords.length > 0) {
      const payload = [bubbleTemplate.monthlyReportSummary(report)];
      const detailMessage = {
        type: 'text',
        text: '💡 สามารถดูรายงานแบบละเอียดพร้อมกราฟวิเคราะห์ได้ที่เว็บไซต์ โดยคลิกที่ปุ่ม "ดูรายละเอียดทั้งหมด" ด้านล่าง'
      };
      await sendMessage(req, [detailMessage, ...flexMessage(payload)]);
    } else {
      const payload = [bubbleTemplate.workError('ไม่พบข้อมูลการเข้างานในเดือนที่เลือก')];
      await sendMessage(req, flexMessage(payload));
    }
  } catch (error) {
    console.error('Error in handleMonthlyReport:', error);
    const payload = [bubbleTemplate.workError('เกิดข้อผิดพลาดในการสร้างรายงาน')];
    await sendMessage(req, flexMessage(payload));
  }
};
