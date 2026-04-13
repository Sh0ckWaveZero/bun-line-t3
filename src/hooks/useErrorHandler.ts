/**
 * useErrorHandler - Hook สำหรับจัดการ errors ใน React components
 */

import { useState, useCallback } from "react"
import { logError } from "@/lib/errors/api-error"

interface ErrorState {
  error: Error | null
  showError: (error: Error) => void
  clearError: () => void
}

export function useErrorHandler(): ErrorState {
  const [error, setError] = useState<Error | null>(null)

  const showError = useCallback((error: Error) => {
    logError(error)
    setError(error)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, showError, clearError }
}

/**
 * useAsyncError - Hook สำหรับจัดการ errors จาก async operations
 */
export function useAsyncError() {
  const [error, setError] = useState<Error | null>(null)

  const runAsync = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T | null> => {
      try {
        setError(null)
        return await asyncFn()
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        logError(error)
        setError(error)
        return null
      }
    },
    [],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, runAsync, clearError }
}

/**
 * Error ที่เกิดจาก API calls
 */
export class ApiCallError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message)
    this.name = "ApiCallError"
  }
}

/**
 * Wrapper สำหรับ fetch API ที่จัดการ errors อัตโนมัติ
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new ApiCallError(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data,
      )
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiCallError) {
      throw error
    }
    throw new ApiCallError(
      error instanceof Error ? error.message : "Network error",
      undefined,
      error,
    )
  }
}
