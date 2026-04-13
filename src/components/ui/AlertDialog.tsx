"use client"

/**
 * AlertDialog — Modal ยืนยันการทำงานที่สำคัญ (เช่น ลบข้อมูล)
 * ใช้แทน window.confirm() / window.alert() เพื่อ UX ที่ดีกว่า
 */

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { X } from "lucide-react"

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={className}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={className}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props} />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props} />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={className} {...props} />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={className} {...props} />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} className={className} {...props} />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel ref={ref} className={className} {...props} />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

// ─────────────────────────────────────────────
// Preset Components
// ─────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  variant?: "danger" | "default" | "warning"
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const variantStyles = {
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    default: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 flex justify-end gap-3">
          <AlertDialogCancel asChild>
            <button
              type="button"
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {cancelLabel}
            </button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <button
              type="button"
              onClick={handleConfirm}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]}`}
            >
              {confirmLabel}
            </button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode
}

export const AlertDialogBox = ({
  open,
  onOpenChange,
  title,
  description,
  children,
}: AlertDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <AlertDialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
            <AlertDialogPrimitive.Cancel asChild>
              <button
                type="button"
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </AlertDialogPrimitive.Cancel>
          </div>
        </AlertDialogHeader>

        {children && <div className="mt-4">{children}</div>}
      </AlertDialogContent>
    </AlertDialog>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
