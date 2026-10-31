import { useEffect, useRef, useState } from "react";
import { PixelClock } from "@/features/planning-poker/components/pixel-icons";

interface RoundTimerProps {
  roundStartedAt: number;
  /** เวลาที่เปิดไพ่ — ถ้ามีค่า ตัวจับเวลาจะหยุดที่เวลานี้ */
  revealedAt: number | null;
  /** เวลาของ server ตอนตอบล่าสุด ใช้ชดเชยนาฬิกาเครื่องที่ไม่ตรงกัน */
  serverNow: number;
}

const formatElapsed = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const RoundTimer = ({
  roundStartedAt,
  revealedAt,
  serverNow,
}: RoundTimerProps) => {
  // ส่วนต่างระหว่างนาฬิกา server กับเครื่องนี้ ณ ตอนที่รับข้อมูลล่าสุด
  const clockOffset = useRef(0);
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    clockOffset.current = serverNow - Date.now();
    setNow(serverNow);
  }, [serverNow]);

  useEffect(() => {
    if (revealedAt !== null) return;
    const timer = window.setInterval(
      () => setNow(Date.now() + clockOffset.current),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [revealedAt]);

  const elapsed = (revealedAt ?? now) - roundStartedAt;

  return (
    // role="timer" + aria-live="off": เวลาเดินทุกวินาทีจึงไม่ควรให้ screen reader อ่านออกเสียงเอง
    <p
      id="poker-round-timer"
      role="timer"
      aria-live="off"
      aria-label={`This round's time ${formatElapsed(elapsed)}`}
      className="text-muted-foreground flex items-center gap-1.5 text-sm tabular-nums"
    >
      <PixelClock className="h-4 w-4" aria-hidden="true" />
      {/* min-w 8ch = ความกว้างเลข 0 แปดตัว — ฟอนต์ pixel ไม่มี tabular figures (เลข 1 แคบกว่า 0)
          ทำให้แท็กหายใจทุกวินาทีเวลาเปลี่ยน; ล็อกกว้างไว้แล้วส่วนถัดไปจึงไม่เลื่อน */}
      <span aria-hidden="true" className="min-w-[8ch]">
        {formatElapsed(elapsed)}
      </span>
    </p>
  );
};
