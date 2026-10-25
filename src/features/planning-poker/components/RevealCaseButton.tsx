import { PixelGlyph } from "./PixelGlyph";

interface RevealCaseButtonProps {
  onClick: () => void;
  disabled?: boolean;
  /** id ของปุ่ม — แยกตำแหน่ง mobile/desktop ที่ render สองจุด (ใช้เป็น anchor/QA hook ได้) */
  id?: string;
}

/**
 * ปุ่มเปิดไพ่รูปกล่องสมบัติ (อิง LootCase ของ react-cards-opening) — ตัวกล่องทั้งก้อนคือปุ่ม
 * จุดยึดกลางกล่องเรืองแสงเป็นจังหวะ, hover แล้วกล่องสั่น (motion-reduce ปิดใน input.css)
 * ค่าเฉลี่ยสีใช้ --primary ของธีม arcane แทนสี tier ของไพ่ถัดไปแบบ demo (เราไม่รู้ไพ่ถัดไปล่วงหน้า)
 */
export const RevealCaseButton = ({
  onClick,
  disabled = false,
  id,
}: RevealCaseButtonProps) => (
  <button
    type="button"
    id={id}
    className="poker-case"
    aria-label="Open the case — reveal every card at once"
    title="Open the case — reveal every card at once"
    disabled={disabled}
    onClick={onClick}
  >
    <span className="poker-case-lid" aria-hidden="true">
      <span className="poker-case-strap" />
      <span className="poker-case-strap poker-case-strap--right" />
    </span>
    <span className="poker-case-body" aria-hidden="true">
      <span className="poker-case-strap" />
      <span className="poker-case-strap poker-case-strap--right" />
      <span className="poker-case-grid" />
      <span className="poker-case-glyph">
        <PixelGlyph value="?" />
      </span>
    </span>
    <span className="poker-case-clasp" aria-hidden="true" />
  </button>
);
