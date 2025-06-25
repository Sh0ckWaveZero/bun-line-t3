"use client"
import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()
  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      router.replace('/')
    })
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <span className="text-gray-700 dark:text-gray-300 text-lg font-medium mt-2">กำลังออกจากระบบ กรุณารอสักครู่...</span>
    </div>
  )
}
