interface BaseResponse {
  success: boolean;
  timestamp: string;
}

interface ErrorResponse extends BaseResponse {
  success: false;
  error: string;
  details?: string;
}

interface SuccessResponse extends BaseResponse {
  success: true;
  message: string;
}

interface SkippedResponse extends SuccessResponse {
  holidayInfo?: {
    nameThai: string;
    nameEnglish: string;
    type: string;
  } | null;
}

interface ReminderSentResponse extends SuccessResponse {
  messageText: string;
  sentUserCount: number;
  failedUserCount: number;
}

/**
 * Creates standardized error response for cron jobs
 */
export function createErrorResponse(
  error: string,
  status: number,
  details?: string,
): Response {
  const response: ErrorResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };

  return Response.json(response, { status });
}

/**
 * Creates standardized success response for skipped operations
 */
export function createSkippedResponse(
  message: string,
  holidayInfo?: any,
): Response {
  const response: SkippedResponse = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    ...(holidayInfo && { holidayInfo }),
  };

  return Response.json(response, { status: 200 });
}

/**
 * Creates standardized success response for reminder sent operations
 */
export function createReminderSentResponse(
  messageText: string,
  sentUserCount: number,
  failedUserCount: number,
): Response {
  const response: ReminderSentResponse = {
    success: true,
    message: "Check-in reminder push sent successfully",
    messageText,
    sentUserCount,
    failedUserCount,
    timestamp: new Date().toISOString(),
  };

  return Response.json(response, { status: 200 });
}

/**
 * Creates standardized success response for no users case
 */
export function createNoUsersResponse(): Response {
  const response: SuccessResponse = {
    success: true,
    message: "ข้ามการส่งแจ้งเตือน ไม่มี LINE userId สำหรับแจ้งเตือน",
    timestamp: new Date().toISOString(),
  };

  return Response.json(response, { status: 200 });
}
