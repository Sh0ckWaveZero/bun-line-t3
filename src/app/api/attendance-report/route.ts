import { NextRequest } from 'next/server';
import { attendanceService } from '~/features/attendance/services/attendance';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');

    if (!userId || !month) {
      return Response.json({ 
        error: 'Missing required parameters: userId and month' 
      }, { status: 400 });
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return Response.json({ 
        error: 'Invalid month format. Use YYYY-MM' 
      }, { status: 400 });
    }

    const report = await attendanceService.getMonthlyAttendanceReport(userId, month);

    if (!report) {
      return Response.json({ 
        error: 'Failed to generate attendance report' 
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      data: report
    }, { status: 200 });

  } catch (error) {
    console.error('Error in attendance report API:', error);
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
