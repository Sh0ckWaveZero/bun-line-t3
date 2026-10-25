import { useState } from "react";
import { PixelCheck, PixelCopy } from "@/features/planning-poker/components/pixel-icons";
import { Button } from "@/components/ui/button";

export const CopyButton = ({
  label,
  getText,
  id,
}: {
  label: string;
  getText: () => string;
  id?: string;
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1500);
    } catch {
      // clipboard ใช้ไม่ได้ (เช่น ไม่ใช่ HTTPS) — ผู้ใช้ยังคัดลอกเองจากรหัสบนจอได้
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      id={id}
      onClick={handleCopy}
    >
      {isCopied ? <PixelCheck aria-hidden="true" /> : <PixelCopy aria-hidden="true" />}
      {isCopied ? "Copied" : label}
    </Button>
  );
};
