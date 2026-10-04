import type { CoPayTab } from "@/features/expenses/hooks/useThaiHelpCalculator";

interface ThaiHelpTabNavProps {
  activeTab: CoPayTab;
  onChange: (tab: CoPayTab) => void;
  statsCount: number;
}

/** แถบปุ่มเลือก tab ของเครื่องคำนวณ (split/topup/stats) */
export function ThaiHelpTabNav({
  activeTab,
  onChange,
  statsCount,
}: ThaiHelpTabNavProps) {
  return (
    <div
      id="thai-help-tabs"
      className="bg-muted/60 relative mb-5 flex rounded-lg p-1"
    >
      {(["split", "topup", "stats"] as const).map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`relative z-10 flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-[color,background-color,box-shadow] duration-200 ${
              isActive
                ? "bg-card text-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "split" && "แยกบิล (60/40)"}
            {tab === "topup" && "ต้องเติมเท่าไหร่"}
            {tab === "stats" && `สถิติเดือนนี้ (${statsCount})`}
          </button>
        );
      })}
    </div>
  );
}
