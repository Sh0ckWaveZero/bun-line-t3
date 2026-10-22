interface SectionLabelProps {
  num: string;
  title: string;
  hint?: string;
}

export const SectionLabel = ({ num, title, hint }: SectionLabelProps) => {
  return (
    <div className="mt-6 mb-3 flex items-baseline gap-2 first:mt-0 sm:mt-8">
      <span className="bg-foreground text-background rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider">
        {num}
      </span>
      <h2 className="text-foreground text-[13px] font-semibold tracking-tight">
        {title}
      </h2>
      <span className="bg-border hidden h-px flex-1 sm:block" />
      {hint && (
        <span className="text-muted-foreground hidden font-mono text-[11px] sm:inline">
          {hint}
        </span>
      )}
    </div>
  );
};
