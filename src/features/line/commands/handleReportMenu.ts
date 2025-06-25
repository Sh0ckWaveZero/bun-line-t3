import { bubbleTemplate } from '@/lib/validation/line';
import { sendMessage } from '../../../lib/utils/line-utils';
import { flexMessage } from '@/lib/utils/line-message-utils';

export const handleReportMenu = async (req: any) => {
  try {
    const payload = [bubbleTemplate.monthlyReportMenu()];
    await sendMessage(req, flexMessage(payload));
  } catch (error) {
    console.error('Error in handleReportMenu:', error);
    const payload = [bubbleTemplate.workError('เกิดข้อผิดพลาดในระบบ')];
    await sendMessage(req, flexMessage(payload));
  }
};
