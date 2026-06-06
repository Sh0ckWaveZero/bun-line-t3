"use client";

import { useEffect, useRef } from "react";

export function ParticleWaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    let animId: number;
    let t = 0;

    function setSize() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    setSize();

    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);

    const COLS = 22;
    const ROWS = 14;

    const mesh = Array.from({ length: COLS * ROWS }, (_, i) => {
      const c = Math.floor(i / ROWS);
      const r = i % ROWS;
      return {
        c,
        r,
        nx: (c / (COLS - 1)) * 1.2 - 0.1,
        ny: 0.18 + (r / (ROWS - 1)) * 0.82,
        dotR: 0.7 + Math.random() * 1.3,
        phA: Math.random() * Math.PI * 2,
        phB: Math.random() * Math.PI * 2,
        spd: 0.32 + Math.random() * 0.38,
      };
    });

    function tick() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;

      // Brand dark indigo-violet (DESIGN.md dark palette)
      const bgGrad = ctx!.createLinearGradient(w * 0.85, 0, 0, h * 1.05);
      bgGrad.addColorStop(0, "#110f22");
      bgGrad.addColorStop(0.35, "#1e1b33");
      bgGrad.addColorStop(0.7, "#241d3b");
      bgGrad.addColorStop(1, "#1e1b33");
      ctx!.fillStyle = bgGrad;
      ctx!.fillRect(0, 0, w, h);

      if (!prefersReducedMotion) t += 0.005;

      const pos: [number, number][] = mesh.map((p) => {
        const bx = p.nx * w;
        const by = p.ny * h;
        const dy =
          Math.sin(t * p.spd + p.phA + p.c * 0.32) * h * 0.047 +
          Math.cos(t * p.spd * 0.55 + p.phB + p.r * 0.28) * h * 0.022;
        const dx = Math.sin(t * p.spd * 0.75 + p.phB * 0.7) * w * 0.013;
        return [bx + dx, by + dy];
      });

      ctx!.lineWidth = 0.55;
      for (let ci = 0; ci < COLS; ci++) {
        for (let ri = 0; ri < ROWS; ri++) {
          const idx = ci * ROWS + ri;
          const [x1, y1] = pos[idx]!;

          if (ci < COLS - 1) {
            const [x2, y2] = pos[(ci + 1) * ROWS + ri]!;
            const d = Math.hypot(x2 - x1, y2 - y1);
            const a = Math.max(0, 0.095 - d / 3800);
            if (a > 0) {
              ctx!.strokeStyle = `rgba(140, 110, 200, ${a})`;
              ctx!.beginPath();
              ctx!.moveTo(x1, y1);
              ctx!.lineTo(x2, y2);
              ctx!.stroke();
            }
          }

          if (ri < ROWS - 1) {
            const [x2, y2] = pos[ci * ROWS + ri + 1]!;
            const d = Math.hypot(x2 - x1, y2 - y1);
            const a = Math.max(0, 0.075 - d / 3800);
            if (a > 0) {
              ctx!.strokeStyle = `rgba(140, 110, 200, ${a})`;
              ctx!.beginPath();
              ctx!.moveTo(x1, y1);
              ctx!.lineTo(x2, y2);
              ctx!.stroke();
            }
          }
        }
      }

      ctx!.fillStyle = "rgba(180, 155, 225, 0.65)";
      mesh.forEach((p, i) => {
        const [x, y] = pos[i]!;
        ctx!.beginPath();
        ctx!.arc(x, y, p.dotR, 0, Math.PI * 2);
        ctx!.fill();
      });

      animId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
