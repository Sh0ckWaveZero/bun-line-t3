/**
 * ErrorBoundary — จัดการ JavaScript errors ใน React components
 * ป้องกันไม่ให้ทั้งหน้าจอ crash เมื่อเกิด error ใน child components
 */

import { Component, ReactNode } from "react"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, showDetails: false }
  }

  static getDerivedStateFromError(error: Error): Omit<State, "showDetails"> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, showDetails: false })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            {/* icon */}
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-7 w-7 text-red-500 dark:text-red-400" />
            </div>

            {/* title */}
            <h1 className="mb-2 text-center text-lg font-bold text-gray-900 dark:text-white">
              เกิดข้อผิดพลาด
            </h1>
            <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
              ขออภัย ระบบเกิดข้อผิดพลาดบางอย่าง
            </p>

            {/* actions */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <RefreshCw className="h-4 w-4" />
                ลองใหม่
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = "/")}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Home className="h-4 w-4" />
                กลับหน้าแรก
              </button>
            </div>

            {/* error details — collapsible */}
            {this.state.error && (
              <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                  className="flex w-full items-center justify-between text-xs font-medium text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <span>รายละเอียด error</span>
                  <span className="text-[10px]">{this.state.showDetails ? "▲" : "▼"}</span>
                </button>
                {this.state.showDetails && (
                  <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-600 dark:bg-gray-800/60 dark:text-gray-400">
                    {this.state.error.message}
                  </pre>
                )}
              </div>
            )}
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
  errorFallback,
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        errorFallback || (
          <div className="flex min-h-[200px] items-center justify-center px-4">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
