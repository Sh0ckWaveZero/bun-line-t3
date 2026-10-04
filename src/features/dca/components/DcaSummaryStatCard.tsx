import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DcaSummaryStatCardProps {
  /** ส่วนของ id เช่น "total-spent" → id="dca-summary-total-spent-card" */
  idBase: string;
  icon: LucideIcon;
  iconBoxClassName: string;
  iconClassName: string;
  label: string;
  value: string;
  unit: string;
}

/** การ์ดสถิติพื้นฐานของส่วนสรุป DCA (ไอคอน + ป้าย + ค่า + หน่วย) */
export const DcaSummaryStatCard = ({
  idBase,
  icon: Icon,
  iconBoxClassName,
  iconClassName,
  label,
  value,
  unit,
}: DcaSummaryStatCardProps) => (
  <Card id={`dca-summary-${idBase}-card`} className="border-border">
    <CardContent id={`dca-summary-${idBase}-content`} className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBoxClassName}`}
        >
          <Icon className={`h-5 w-5 ${iconClassName}`} />
        </div>
        <div>
          <p
            id={`dca-summary-${idBase}-label`}
            className="text-muted-foreground text-xs"
          >
            {label}
          </p>
          <p id={`dca-summary-${idBase}-value`} className="text-lg font-bold">
            {value}{" "}
            <span className="text-muted-foreground text-sm font-normal">
              {unit}
            </span>
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);
