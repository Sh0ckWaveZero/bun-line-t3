import { bubbleTemplate } from '@/lib/validation/line';
import { sendMessage } from '../../../lib/utils/line-utils';
import { flexMessage } from '@/lib/utils/line-message-utils';

export const handlePolicyInfo = async (req: any) => {
  try {
    const payload = [bubbleTemplate.workplacePolicyInfo()];
    await sendMessage(req, flexMessage(payload));
  } catch (error) {
    console.error('Error in handlePolicyInfo:', error);
    const payload = [bubbleTemplate.workError('เกิดข้อผิดพลาดในการแสดงนโยบาย')];
    await sendMessage(req, flexMessage(payload));
  }
};
