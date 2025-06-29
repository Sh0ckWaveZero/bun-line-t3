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
    <div className="flex min-h-screen flex-col items-center justify-center">
      <span className="mt-2 text-lg font-medium text-white">
        กำลังออกจากระบบ กรุณารอสักครู่...
      </span>
    </div>
  );
}
