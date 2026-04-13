/**
 * API Error Handler - จัดการ errors จาก API routes
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = "ข้อมูลไม่ถูกต้อง", code?: string) {
    super(400, message, code)
    this.name = "BadRequestError"
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "ไม่มีสิทธิ์เข้าถึง") {
    super(401, message)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "ไม่มีสิทธิ์ดำเนินการ") {
    super(403, message)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "ไม่พบข้อมูล") {
    super(404, message)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = "ข้อมูลซ้ำ") {
    super(409, message)
    this.name = "ConflictError"
  }
}

export class ValidationError extends ApiError {
  constructor(public errors: Record<string, string[]>, message: string = "ข้อมูลไม่ถูกต้อง") {
    super(400, message, "VALIDATION_ERROR")
    this.name = "ValidationError"
  }
}

/**
 * สร้าง error response ที่สวยงามและสม่ำเสมอ
 */
export function createErrorResponse(error: unknown): Response {
  console.error("[API Error]", error)

  // ApiError หรือ custom errors
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
      { status: error.statusCode },
    )
  }

  // Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    return Response.json(
      {
        error: "ข้อมูลไม่ถูกต้อง",
        details: (error as { issues: unknown[] }).issues,
      },
      { status: 400 },
    )
  }

  // Generic Error
  if (error instanceof Error) {
    // ใน production ไม่ควรส่ง error message จริงๆ ไปยัง client
    const isDev = process.env.NODE_ENV === "development"
    return Response.json(
      {
        error: isDev ? error.message : "เกิดข้อผิดพลาดในเซิร์ฟเวอร์",
        ...(isDev && { stack: error.stack }),
      },
      { status: 500 },
    )
  }

  // Unknown error
  return Response.json(
    { error: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ" },
    { status: 500 },
  )
}

/**
 * Wrapper สำหรับ API handlers เพื่อจัดการ errors อัตโนมัติ
 */
export function withApiHandler(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      return await handler(request)
    } catch (error) {
      return createErrorResponse(error)
    }
  }
}

/**
 * Log error ไปยัง monitoring service (เช่น Sentry, LogRocket)
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString(),
  }

  console.error("[Error Log]", JSON.stringify(errorLog, null, 2))

  // TODO: Send to monitoring service
  // if (typeof window !== "undefined") {
  //   // Client-side: send to analytics
  // } else {
  //   // Server-side: send to logging service
  // }
}
