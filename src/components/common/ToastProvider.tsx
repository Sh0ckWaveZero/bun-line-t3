"use client"
import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"

interface ToastData {
  title: string
  description?: string
  type?: "success" | "error" | "info" | "warning"
  duration?: number
}

interface ToastContextProps {
  showToast: (data: ToastData) => void
}

const ToastContext = React.createContext<ToastContextProps | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  const [toast, setToast] = React.useState<ToastData | null>(null)
  const timerRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  const showToast = React.useCallback((data: ToastData) => {
    setToast(data)
    setOpen(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setOpen(true), 10)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        <ToastPrimitive.Root
          open={open}
          onOpenChange={setOpen}
          duration={toast?.duration ?? 3500}
          className={`z-[9999] fixed top-4 right-4 min-w-[220px] max-w-xs rounded-lg px-4 py-3 shadow-lg border-2 transition-all
            bg-background text-high-contrast border-gray-200 dark:bg-gray-900 dark:text-high-contrast dark:border-gray-600
            ${toast?.type === "success" ? "border-green-500 text-green-700 dark:text-green-300" : ""}
            ${toast?.type === "error" ? "border-red-500 text-red-700 dark:text-red-300" : ""}
            ${toast?.type === "info" ? "border-blue-500 text-blue-700 dark:text-blue-300" : ""}
            ${toast?.type === "warning" ? "border-yellow-500 text-yellow-700 dark:text-yellow-300" : ""}
          `}
        >
          <ToastPrimitive.Title className="font-semibold">
            {toast?.title}
          </ToastPrimitive.Title>
          {toast?.description && (
            <ToastPrimitive.Description className="text-sm mt-1">
              {toast.description}
            </ToastPrimitive.Description>
          )}
        </ToastPrimitive.Root>
        <ToastPrimitive.Viewport className="fixed top-0 right-0 z-[9999] flex flex-col gap-2 p-4 w-auto max-w-xs outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast ต้องใช้ภายใน <ToastProvider>")
  return ctx
}
