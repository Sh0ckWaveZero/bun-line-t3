/**
 * 🛡️ Zod Error Formatter Utility
 * Provides consistent error formatting for API responses
 * Handles Zod v4 error structure properly
 */

import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * Formatted validation error issue
 */
export interface FormattedValidationIssue {
  field: string;
  message: string;
  code: string;
  type?: "validation" | "type" | "custom";
}

/**
 * Formatted validation error response
 */
export interface FormattedValidationError {
  success: false;
  error: "Validation failed";
  details: FormattedValidationIssue[];
  issueCount: number;
}

/**
 * Format Zod errors into a consistent structure
 * @param zodError - Zod validation error
 * @returns Formatted error details
 */
export function formatZodErrors(zodError: z.ZodError): FormattedValidationError {
  const details: FormattedValidationIssue[] = zodError.issues.map((issue) => {
    // Build nested field path (e.g., "user.email" for nested objects)
    const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "root";

    return {
      field: fieldPath,
      message: issue.message,
      code: issue.code,
      type: issue.code === "invalid_type" ? "type" : "validation",
    };
  });

  return {
    success: false,
    error: "Validation failed",
    details,
    issueCount: zodError.issues.length,
  };
}

/**
 * Create a NextResponse with formatted Zod error
 * @param error - Zod validation error
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with formatted error
 */
export function zodErrorResponse(
  error: z.ZodError,
  status: number = 400,
): NextResponse {
  const formattedError = formatZodErrors(error);
  return NextResponse.json(formattedError, { status });
}

/**
 * Zod error handler for API routes
 * Simplifies error handling in POST/PUT endpoints
 *
 * @example
 * try {
 *   const data = mySchema.parse(body);
 *   // process data
 * } catch (error) {
 *   return handleZodError(error);
 * }
 */
export function handleZodError(
  error: unknown,
  defaultStatus: number = 400,
): NextResponse | null {
  if (error instanceof z.ZodError) {
    return zodErrorResponse(error, defaultStatus);
  }
  return null; // Not a Zod error, let caller handle it
}

/**
 * Check if error is a Zod validation error
 */
export function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

/**
 * Get the first error message from Zod error
 * Useful for simple error messages
 */
export function getFirstZodErrorMessage(error: z.ZodError): string {
  if (error.issues.length === 0) return "Validation error";
  const firstIssue = error.issues[0]!;
  const field = firstIssue.path.length > 0 ? `${firstIssue.path.join(".")}: ` : "";
  return `${field}${firstIssue.message}`;
}

/**
 * Validation error response builder
 * Fluent API for building validation error responses
 */
export class ValidationErrorBuilder {
  private issues: FormattedValidationIssue[] = [];

  /**
   * Add a validation issue
   */
  addIssue(field: string, message: string, code: string = "invalid_input"): this {
    this.issues.push({ field, message, code });
    return this;
  }

  /**
   * Add multiple issues at once
   */
  addIssues(issues: FormattedValidationIssue[]): this {
    this.issues.push(...issues);
    return this;
  }

  /**
   * Get the formatted error response
   */
  build(): FormattedValidationError {
    return {
      success: false,
      error: "Validation failed",
      details: this.issues,
      issueCount: this.issues.length,
    };
  }

  /**
   * Get NextResponse
   */
  toResponse(status: number = 400): NextResponse {
    return NextResponse.json(this.build(), { status });
  }
}

/**
 * Predefined error builders for common scenarios
 */
export const ValidationErrors = {
  /**
   * Build validation error from Zod error
   */
  fromZodError: (zodError: z.ZodError) => {
    const builder = new ValidationErrorBuilder();
    return builder.addIssues(formatZodErrors(zodError).details);
  },

  /**
   * Build validation error with single issue
   */
  single: (field: string, message: string) => {
    return new ValidationErrorBuilder().addIssue(field, message);
  },

  /**
   * Build validation error for missing field
   */
  missingField: (fieldName: string) => {
    return new ValidationErrorBuilder().addIssue(fieldName, `${fieldName} is required`);
  },

  /**
   * Build validation error for invalid type
   */
  invalidType: (fieldName: string, expectedType: string, receivedType: string) => {
    return new ValidationErrorBuilder().addIssue(
      fieldName,
      `Expected ${expectedType}, got ${receivedType}`,
      "invalid_type",
    );
  },

  /**
   * Build validation error for out of range
   */
  outOfRange: (fieldName: string, min: number, max: number) => {
    return new ValidationErrorBuilder().addIssue(
      fieldName,
      `Value must be between ${min} and ${max}`,
      "invalid_value",
    );
  },
};
