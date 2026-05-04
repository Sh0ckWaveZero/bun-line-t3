import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";

interface SectionLabelProps {
  num: string;
  title?: string;
  hint?: string;
}

export const SectionLabel = ({ num, title, hint }: SectionLabelProps) => {
  const { t } = useDcaLocale();

  // If title/hint are provided, use them; otherwise use locale defaults based on num
  const displayTitle = title ?? (
    num === "01" ? t.section.overviewTitle :
    num === "02" ? t.section.metricsTitle :
    num === "03" ? t.section.historyTitle :
    title
  );
  const displayHint = hint ?? (
    num === "01" ? t.section.overviewHint :
    num === "02" ? t.section.metricsHint :
    num === "03" ? t.section.historyHint :
    hint
  );

  return (
    <div className="mt-6 mb-3 flex items-baseline gap-2 first:mt-0 sm:mt-8">
      <span className="bg-foreground text-background rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider">
        {num}
      </span>
      <h2 className="text-foreground text-[13px] font-semibold tracking-tight">
        {displayTitle}
      </h2>
      <span className="dca-dots" />
      <span className="text-muted-foreground hidden font-mono text-[11px] sm:inline">
        {displayHint}
      </span>
    </div>
  );
};
