"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onsiteReportFormSchema } from "../lib/onsite-report-form";
import type { OnsiteReportFormInput } from "../lib/onsite-report-form";

/**
 * loading = กำลังสร้าง · ready = ตัวอย่างตรงกับที่กรอก
 * incomplete = ตัวอย่างแสดงอยู่ แต่ฟอร์มยังกรอกไม่ครบ (บันทึกไม่ได้จนกว่าจะครบ)
 * error = สร้างตัวอย่างไม่สำเร็จ (แสดงตัวอย่างล่าสุดค้างไว้)
 */
type PreviewStatus = "loading" | "ready" | "incomplete" | "error";

const STATUS_TEXT: Record<PreviewStatus, string> = {
  loading: "กำลังสร้างตัวอย่าง...",
  ready: "อัปเดตอัตโนมัติตามที่กรอก",
  incomplete: "ยังกรอกไม่ครบ — ตัวอย่างอัปเดตตามที่กรอก",
  error: "สร้างตัวอย่างไม่สำเร็จ — แสดงตัวอย่างล่าสุด",
};

const STATUS_CLASS: Record<PreviewStatus, string> = {
  loading: "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300",
  ready: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  incomplete: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  error: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const DEBOUNCE_MS = 600;

/**
 * ซ่อน UI ของ PDF viewer (แถบเครื่องมือ/แผงภาพย่อ/แถบเลื่อน) ให้เห็นเฉพาะหน้าเอกสาร และขยายพอดีความกว้างกรอบ
 * Chrome/Edge ใช้ toolbar/navpanes/scrollbar/view, Firefox (pdf.js) ใช้ pagemode — Safari อาจไม่รองรับ (ยังเห็นตัวอย่างได้)
 * ลิงก์ "เปิดในแท็บใหม่" ใช้ URL เดิมที่ไม่มี fragment จึงยังได้ viewer เต็มสำหรับซูม/พิมพ์/ดาวน์โหลด
 */
const VIEWER_FRAGMENT =
  "#toolbar=0&navpanes=0&scrollbar=0&view=FitH&pagemode=none";

/** ตัวอย่างเอกสาร PDF แบบ WYSIWYG — เรนเดอร์ด้วย pipeline เดียวกับไฟล์ดาวน์โหลดจริง */
export const OnsiteReportPreview = ({
  values,
  reportId,
  signatureVersion = "",
}: {
  values: OnsiteReportFormInput;
  /** รายงานที่บันทึกแล้ว (หน้าแก้ไข) — ให้ตัวอย่างแสดงลายเซ็นที่เซ็นไว้ */
  reportId?: string;
  /** เปลี่ยนค่าเมื่อลายเซ็นเปลี่ยน เพื่อให้ตัวอย่างโหลดใหม่ */
  signatureVersion?: string;
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [renderState, setRenderState] = useState<"loading" | "ok" | "error">(
    "loading",
  );
  const isComplete = useMemo(
    () => onsiteReportFormSchema.safeParse(values).success,
    [values],
  );
  const status: PreviewStatus =
    renderState === "loading"
      ? "loading"
      : renderState === "error"
        ? "error"
        : isComplete
          ? "ready"
          : "incomplete";
  const urlRef = useRef<string | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const seq = ++seqRef.current;
      let cancelled = false;
      void (async () => {
        try {
          const response = await fetch("/api/onsite-reports/preview-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...values, reportId }),
          });
          if (cancelled || seq !== seqRef.current) return;
          if (!response.ok) throw new Error("preview failed");
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          urlRef.current = url;
          setBlobUrl(url);
          setRenderState("ok");
        } catch {
          if (!cancelled && seq === seqRef.current) setRenderState("error");
        }
      })();
      return () => {
        cancelled = true;
      };
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // signatureVersion ไม่ถูกใช้ในตัว effect โดยตั้งใจ — มีไว้เป็นตัวกระตุ้นให้ตัวอย่างโหลดใหม่เมื่อลายเซ็นเปลี่ยน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, reportId, signatureVersion]);

  // เคลียร์ blob URL สุดท้ายตอน unmount
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  return (
    <aside
      aria-label="ตัวอย่างเอกสาร PDF"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          ตัวอย่างเอกสาร
        </h2>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_CLASS[status]}`}
        >
          {STATUS_TEXT[status]}
        </span>
      </div>
      <div className="aspect-[210/297] w-full overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/[0.1]">
        {blobUrl ? (
          // ไม่ใส่ sandbox โดยตั้งใจ: Chrome/Chromium (รวม Dia) ไม่ render PDF viewer
          // ใน iframe ที่ sandboxed โดยไม่มี allow-scripts และใส่คู่กับ allow-same-origin
          // จะโดนกฎ react/iframe-missing-sandbox — เนื้อหาคือ PDF ที่เรา generate เอง
          // (react-pdf ไม่ฝัง /JavaScript) จึงไม่มีพื้นผิวโจมตีแบบ sandbox escape
          // eslint-disable-next-line react/iframe-missing-sandbox
          <iframe
            src={`${blobUrl}${VIEWER_FRAGMENT}`}
            title="ตัวอย่าง Onsite Service Report"
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-white/[0.05]" />
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
        ถ้าตัวอย่างไม่แสดง (เบราว์เซอร์บางตัวบล็อก PDF ฝัง) —{" "}
        <a
          href={blobUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-emerald-700 dark:hover:text-emerald-300"
        >
          เปิดในแท็บใหม่
        </a>
      </p>
    </aside>
  );
};
