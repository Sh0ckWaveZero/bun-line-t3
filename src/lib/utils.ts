import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * รวม Tailwind CSS classes ด้วย clsx อย่างปลอดภัย
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
