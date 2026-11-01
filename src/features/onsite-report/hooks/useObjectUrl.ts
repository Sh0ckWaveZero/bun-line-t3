import { useEffect, useState } from "react";

/**
 * Blob → object URL ที่ถูกสร้างและคืน (revoke) ใน effect เดียวกัน
 * จึงไม่ค้าง Blob ในหน่วยความจำเมื่อ blob เปลี่ยนหรือ component unmount
 *
 * เก็บ { blob, url } คู่กัน เพื่อไม่คืน URL ของ blob ตัวเก่าที่ถูก revoke ไปแล้วในช่วงที่ blob เพิ่งเปลี่ยน
 * (render นั้นได้ null สั้น ๆ จนกว่า effect จะสร้าง URL ใหม่เสร็จ)
 */
export const useObjectUrl = (blob: Blob | null): string | null => {
  const [entry, setEntry] = useState<{ blob: Blob; url: string } | null>(null);

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    // เก็บ URL ที่เพิ่งสร้างใน effect: เป็นการ sync กับ resource ภายนอก (object URL) ไม่ใช่ state ที่คำนวณจาก props ได้
    // eslint-disable-next-line react/set-state-in-effect
    setEntry({ blob, url });
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return entry !== null && entry.blob === blob ? entry.url : null;
};
