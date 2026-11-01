"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import type { PointerEvent } from "react";
import {
  SIGNATURE_CANVAS_HEIGHT,
  SIGNATURE_CANVAS_WIDTH,
} from "../lib/signature";

export interface SignaturePadHandle {
  clear: () => void;
  /** PNG พื้นโปร่งใส — null เมื่อยังไม่ได้วาด */
  toBlob: () => Promise<Blob | null>;
}

interface SignaturePadProps {
  disabled?: boolean;
  onInkChange?: (hasInk: boolean) => void;
}

const STROKE_COLOR = "#111111";
const STROKE_WIDTH = 3;

/**
 * ช่องวาดลายเซ็นด้วยนิ้ว/ปากกา/เมาส์ (Pointer Events — ใช้ได้ทั้งมือถือ แท็บเล็ต เดสก์ท็อป)
 * พิกัดคำนวณจาก bounding rect จึงวาดตรงตำแหน่งแม้ canvas ถูกย่อ/ขยายด้วย CSS
 */
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ disabled = false, onInkChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const hasInkRef = useRef(false);
    const [isDrawing, setIsDrawing] = useState(false);

    const setHasInk = (value: boolean) => {
      if (hasInkRef.current === value) return;
      hasInkRef.current = value;
      onInkChange?.(value);
    };

    const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
      const canvas = event.currentTarget;
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      };
    };

    const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      const point = getPoint(event);
      lastPointRef.current = point;
      setIsDrawing(true);

      // แตะครั้งเดียวให้เป็นจุด
      const context = event.currentTarget.getContext("2d");
      if (!context) return;
      context.fillStyle = STROKE_COLOR;
      context.beginPath();
      context.arc(point.x, point.y, STROKE_WIDTH / 2, 0, Math.PI * 2);
      context.fill();
      setHasInk(true);
    };

    const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
      const last = lastPointRef.current;
      if (!isDrawing || !last) return;
      const context = event.currentTarget.getContext("2d");
      if (!context) return;

      const point = getPoint(event);
      context.strokeStyle = STROKE_COLOR;
      context.lineWidth = STROKE_WIDTH;
      context.lineCap = "round";
      context.lineJoin = "round";
      // เส้นโค้งผ่านจุดกึ่งกลางเพื่อให้ลายเซ็นไม่เป็นเหลี่ยม
      const midX = (last.x + point.x) / 2;
      const midY = (last.y + point.y) / 2;
      context.beginPath();
      context.moveTo(last.x, last.y);
      context.quadraticCurveTo(last.x, last.y, midX, midY);
      context.lineTo(point.x, point.y);
      context.stroke();
      lastPointRef.current = point;
    };

    const endStroke = () => {
      lastPointRef.current = null;
      setIsDrawing(false);
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        setHasInk(false);
      },
      toBlob: () =>
        new Promise((resolve) => {
          const canvas = canvasRef.current;
          if (!canvas || !hasInkRef.current) {
            resolve(null);
            return;
          }
          canvas.toBlob((blob) => resolve(blob), "image/png");
        }),
    }));

    return (
      // พื้นขาวเสมอ เพราะกระดาษ PDF เป็นสีขาว — ลายเซ็นพื้นโปร่งใสจึงเห็นเหมือนที่จะออกจริง
      <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/20">
        <canvas
          ref={canvasRef}
          width={SIGNATURE_CANVAS_WIDTH}
          height={SIGNATURE_CANVAS_HEIGHT}
          className="block aspect-[3/1] w-full cursor-crosshair touch-none"
          aria-label="พื้นที่เซ็นชื่อ — วาดลายเซ็นด้วยนิ้ว ปากกา หรือเมาส์"
          role="img"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-dashed border-slate-300"
        />
      </div>
    );
  },
);
SignaturePad.displayName = "SignaturePad";
