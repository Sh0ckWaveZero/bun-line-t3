import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { SettingsToggleProps } from "../types";

export function SettingsToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: SettingsToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1">
        <Label
          htmlFor={id}
          className="text-foreground cursor-pointer text-sm font-medium"
        >
          {label}
        </Label>
        {description && (
          <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}
