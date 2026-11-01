"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Eraser, ImageUp, PenLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignaturePad } from "./SignaturePad";
import type { SignaturePadHandle } from "./SignaturePad";
import {
  ONSITE_REPORT_SIGNATURE_MAX_BYTES,
  SIGNATURE_PARTY_LABELS,
} from "../lib/signature";
import {
  onsiteReportSignatureUrl,
  useOnsiteReportSignatureMutations,
} from "../hooks/useOnsiteReportSignatures";
import type { OnsiteReport, OnsiteReportSignatureParty } from "../types";

interface SignatureCardProps {
  report: OnsiteReport;
  party: OnsiteReportSignatureParty;
  /** ชื่อผู้/หน่วยงานที่เซ็น แสดงใต้ป้ายฝั่ง */
  signerName: string;
  isBusy: boolean;
  onSave: (party: OnsiteReportSignatureParty, file: Blob) => Promise<unknown>;
  onRemove: (party: OnsiteReportSignatureParty) => Promise<unknown>;
}

const ACCEPT = "image/png,image/jpeg";

const SignatureCard = ({
  report,
  party,
  signerName,
  isBusy,
  onSave,
  onRemove,
}: SignatureCardProps) => {
  const padRef = useRef<SignaturePadHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPadOpen, setIsPadOpen] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const signature = report.signatures.find((item) => item.party === party);

  const handleSaveDrawn = async () => {
    const blob = await padRef.current?.toBlob();
    if (!blob) return;
    try {
      await onSave(party, blob);
      setIsPadOpen(false);
      setHasInk(false);
    } catch {
      // toast แจ้งใน mutation แล้ว — คงลายเซ็นที่วาดไว้ให้ลองบันทึกใหม่ได้
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setFileError("รองรับเฉพาะไฟล์ PNG หรือ JPEG");
      return;
    }
    if (file.size > ONSITE_REPORT_SIGNATURE_MAX_BYTES) {
      setFileError(
        `ไฟล์ใหญ่เกิน ${ONSITE_REPORT_SIGNATURE_MAX_BYTES / 1024}KB`,
      );
      return;
    }
    setFileError(null);
    try {
      await onSave(party, file);
    } catch {
      // toast แจ้งใน mutation แล้ว
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
        {SIGNATURE_PARTY_LABELS[party]}
      </p>
      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
        {signerName}
      </p>

      {/* พื้นขาวเสมอ เพราะกระดาษ PDF เป็นสีขาว */}
      <div className="mt-3 flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-2 dark:border-white/20">
        {signature ? (
          <img
            src={onsiteReportSignatureUrl(report.id, signature)}
            alt={`ลายเซ็น${SIGNATURE_PARTY_LABELS[party]}`}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-xs text-slate-400">ยังไม่ได้เซ็น</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label={`อัปโหลดรูปลายเซ็น${SIGNATURE_PARTY_LABELS[party]}`}
        onChange={(event) => void handleFileChange(event)}
        disabled={isBusy}
      />
      {fileError && (
        <p
          role="alert"
          className="mt-1 text-xs text-rose-600 dark:text-rose-400"
        >
          {fileError}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={isBusy} onClick={() => setIsPadOpen(true)}>
          <PenLine aria-hidden="true" />
          {signature ? "เซ็นใหม่" : "เซ็นชื่อ"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageUp aria-hidden="true" />
          อัปโหลดรูป
        </Button>
        {signature && (
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
            disabled={isBusy}
            onClick={() => void onRemove(party).catch(() => undefined)}
          >
            <Trash2 aria-hidden="true" />
            ลบ
          </Button>
        )}
      </div>

      <Dialog
        open={isPadOpen}
        onOpenChange={(open) => {
          setIsPadOpen(open);
          if (!open) setHasInk(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              เซ็นชื่อ — {SIGNATURE_PARTY_LABELS[party]}
            </DialogTitle>
            <DialogDescription>
              วาดลายเซ็นในกรอบด้านล่างด้วยนิ้ว ปากกา หรือเมาส์ แล้วกดบันทึก
            </DialogDescription>
          </DialogHeader>
          <SignaturePad
            ref={padRef}
            disabled={isBusy}
            onInkChange={setHasInk}
          />
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasInk || isBusy}
              onClick={() => padRef.current?.clear()}
            >
              <Eraser aria-hidden="true" />
              ล้าง
            </Button>
            <Button
              size="sm"
              disabled={!hasInk || isBusy}
              onClick={() => void handleSaveDrawn()}
            >
              บันทึกลายเซ็น
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface OnsiteReportSignatureSectionProps {
  report: OnsiteReport;
}

/** ส่วนลายเซ็นของหน้าแก้ไขรายงาน — เซ็นแยก 2 ฝั่ง บันทึกทันทีเมื่อกด (ไม่ต้องกดบันทึกรายงาน) */
export const OnsiteReportSignatureSection = ({
  report,
}: OnsiteReportSignatureSectionProps) => {
  const { saveSignature, removeSignature, isBusy } =
    useOnsiteReportSignatureMutations(report.id);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        ลายเซ็น
      </h2>
      <p className="mt-1 mb-4 text-xs text-slate-500 dark:text-slate-400">
        ลายเซ็นแสดงเหนือเส้นเซ็นใน PDF — บันทึกทันทีเมื่อกดบันทึก ไม่ต้องกด
        &quot;บันทึกรายงาน&quot; ซ้ำ ถ้ายังไม่เซ็น PDF
        จะเว้นช่องไว้ให้เซ็นด้วยปากกา
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SignatureCard
          report={report}
          party="COMPANY"
          signerName={report.companyName}
          isBusy={isBusy}
          onSave={(party, file) => saveSignature({ party, file })}
          onRemove={removeSignature}
        />
        <SignatureCard
          report={report}
          party="CLIENT"
          signerName={report.clientName}
          isBusy={isBusy}
          onSave={(party, file) => saveSignature({ party, file })}
          onRemove={removeSignature}
        />
      </div>
    </section>
  );
};
