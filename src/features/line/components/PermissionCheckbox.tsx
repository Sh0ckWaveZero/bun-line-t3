import type { ChangeEvent } from "react";

interface PermissionCheckboxProps {
  checked: boolean;
  disabled?: boolean;
  ariaLabel: string;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Checkbox พร้อม transition "checkbox-check" (transitions.dev)
 * เช็ควาดขึ้นด้วย stroke path — pathLength=1 ทำให้ dash math เป็น 0→1 เสมอ
 * Timing อ้าง motion tokens ใน src/input.css (กล่องเติมก่อน แล้วเส้นค่อยวาดตาม --duration-micro)
 */
export const PermissionCheckbox = ({
  checked,
  disabled = false,
  ariaLabel,
  onCheckedChange,
}: PermissionCheckboxProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onCheckedChange(event.target.checked);
  };

  return (
    <label className="perm-check">
      <input
        type="checkbox"
        aria-label={ariaLabel}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
      />
      <span className="perm-check-box" aria-hidden="true">
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
          <path
            className="perm-check-path"
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            pathLength={1}
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
};
