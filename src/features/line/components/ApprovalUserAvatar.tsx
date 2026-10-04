"use client";

/**
 * ApprovalUserAvatar
 * รูปโปรไฟล์ผู้ใช้ LINE (fallback เป็นอักษรย่อเมื่อโหลดรูปไม่สำเร็จ)
 */
import { useState } from "react";
import { User } from "lucide-react";

interface ApprovalUserAvatarProps {
  pictureUrl: string | null;
  displayName: string | null;
}

export function ApprovalUserAvatar({
  pictureUrl,
  displayName,
}: ApprovalUserAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const initials = (displayName ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (pictureUrl && !hasImageError) {
    return (
      <img
        src={pictureUrl}
        alt={displayName ?? "user"}
        className="ring-border h-12 w-12 shrink-0 rounded-full object-cover ring-2"
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-200 to-slate-300 text-sm font-semibold text-slate-700 ring-2 ring-slate-300 dark:from-slate-700 dark:to-slate-800 dark:text-slate-200 dark:ring-slate-600"
      aria-label={displayName ?? "ผู้ใช้ LINE"}
    >
      {initials === "?" ? <User className="h-5 w-5" /> : initials}
    </div>
  );
}
