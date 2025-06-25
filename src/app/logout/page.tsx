"use client";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      router.replace("/");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <span className="mt-2 text-lg font-medium text-gray-700 dark:text-gray-300">
        กำลังออกจากระบบ กรุณารอสักครู่...
      </span>
    </div>
  );
}
