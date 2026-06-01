import type { SettingsSectionProps } from "../types";

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="border-border bg-card rounded-xl border p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-foreground text-base font-semibold sm:text-lg">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
