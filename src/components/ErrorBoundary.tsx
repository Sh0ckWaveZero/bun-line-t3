/**
 * ErrorBoundary — จัดการ JavaScript errors ใน React components
 * ป้องกันไม่ให้ทั้งหน้าจอ crash เมื่อเกิด error ใน child components
 */

import { Component, ReactNode } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // TODO: Send error to monitoring service (e.g., Sentry)
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-lg dark:border-red-800 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>

            <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              เกิดข้อผิดพลาด
            </h1>

            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              ขออภัย ระบบเกิดข้อผิดพลาดบางอย่าง
            </p>

            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  ดูรายละเอียด error
                </summary>
                <pre className="mt-2 overflow-auto rounded-lg bg-gray-100 p-3 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500"
              >
                <RefreshCw className="h-4 w-4" />
                ลองใหม่
              </button>
              <button
                type="button"
                onClick={() => window.location.href = "/"}
                className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                กลับหน้าแรก
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ─────────────────────────────────────────────
// Specialized Error Boundaries
// ─────────────────────────────────────────────

interface AsyncErrorBoundaryProps {
  children: ReactNode
  loadingFallback?: ReactNode
  errorFallback?: ReactNode
}

/**
 * AsyncErrorBoundary - สำหรับจัดการ errors จาก async operations
 * เหมาะสำหรับใช้กับ data fetching, mutations
 */
export function AsyncErrorBoundary({
  children,
  loadingFallback,
  errorFallback,
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        errorFallback || (
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                เกิดข้อผิดพลาดในการโหลดข้อมูล
              </p>
            </div>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  )
}
