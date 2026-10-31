import { useState, type ComponentType, type SVGProps } from "react";
import { PixelCheck, PixelCopy } from "@/features/planning-poker/components/pixel-icons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * ปุ่มคัดลอก — icon-only ทุกจอ (หัวห้องแบบ minimal); ชื่อปุ่มอยู่ใน aria-label + Tooltip
 * (ข้อความใน tooltip สะท้อนสถานะ: คัดลอกแล้วเปลี่ยนเป็น "Copied")
 * ต้องมี TooltipProvider ครอบจากผู้เรียก (หน้าห้องครอบแถวปุ่มหัวห้องไว้แล้ว)
 */
export const CopyButton = ({
  label,
  getText,
  id,
  icon: Icon = PixelCopy,
}: {
  label: string;
  getText: () => string;
  id?: string;
  /** ไอคอนทดแทน (เช่น Copy link ใช้ PixelShare กันชนกับ Copy code) */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          id={id}
          aria-label={isCopied ? "Copied" : label}
          className="w-9 px-0"
          onClick={handleCopy}
        >
          {isCopied ? <PixelCheck aria-hidden="true" /> : <Icon aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="poker-tooltip-soft">
        {isCopied ? "Copied" : label}
      </TooltipContent>
    </Tooltip>
  );
};
