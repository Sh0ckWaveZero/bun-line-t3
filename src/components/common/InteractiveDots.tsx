// src/components/common/InteractiveDots.tsx
// Interactive canvas dot grid — dots repel from cursor and spring back
// Replaces the static CSS home-grid background
"use client";
import { useEffect, useRef } from "react";

// ─── Physics constants ─────────────────────────────────────────────────────
const SPACING = 32;            // grid spacing (px, logical)
const DOT_R = 1.5;             // dot radius (px)
const REPULSION_R = 110;       // mouse influence radius (px)
const REPULSION_F = 5.5;       // push force multiplier
const SPRING = 0.072;          // return spring stiffness
const DAMPING = 0.78;          // velocity damping per frame

interface Dot {
  ox: number; oy: number;      // original (resting) position
  x: number;  y: number;       // current position
  vx: number; vy: number;      // velocity
}

export const InteractiveDots: React.FC = () => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const dotsRef    = useRef<Dot[]>([]);
  const mouseRef   = useRef({ x: -9999, y: -9999 });
  const rafRef     = useRef<number>(0);
  const wRef       = useRef(0); // logical width
  const hRef       = useRef(0); // logical height

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Retina / HiDPI setup ──────────────────────────────────────────────
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      wRef.current = w;
      hRef.current = h;

      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      buildDots(w, h);
    };

    // ── Build dot grid ────────────────────────────────────────────────────
    const buildDots = (w: number, h: number) => {
      const dots: Dot[] = [];
      // offset grid so dots are centred
      const cols = Math.ceil(w / SPACING) + 1;
      const rows = Math.ceil(h / SPACING) + 1;
      const ox   = ((w % SPACING) / 2);
      const oy   = ((h % SPACING) / 2);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = ox + c * SPACING;
          const y = oy + r * SPACING;
          dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
        }
      }
      dotsRef.current = dots;
    };

    // ── Animation loop ────────────────────────────────────────────────────
    const draw = () => {
      const w  = wRef.current;
      const h  = hRef.current;
      const cx = w / 2;
      const cy = h / 2;
      // radial fade: full opacity at center, 0 at ~60% of half-diagonal
      const fadeR = Math.hypot(cx, cy) * 0.62;

      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const dot of dotsRef.current) {
        // ── Mouse repulsion ─────────────────────────────────────────────
        const dx   = dot.x - mx;
        const dy   = dot.y - my;
        const dist = Math.hypot(dx, dy);

        if (dist < REPULSION_R && dist > 0) {
          const force = (1 - dist / REPULSION_R) * REPULSION_F;
          dot.vx += (dx / dist) * force;
          dot.vy += (dy / dist) * force;
        }

        // ── Spring back to origin ───────────────────────────────────────
        dot.vx += (dot.ox - dot.x) * SPRING;
        dot.vy += (dot.oy - dot.y) * SPRING;
        dot.vx *= DAMPING;
        dot.vy *= DAMPING;
        dot.x  += dot.vx;
        dot.y  += dot.vy;

        // ── Radial fade from canvas center ──────────────────────────────
        const distFromCenter = Math.hypot(dot.x - cx, dot.y - cy);
        const centerFade     = Math.max(0, 1 - distFromCenter / fadeR);
        if (centerFade <= 0) continue;

        // ── Color: white at rest → cold teal when displaced ────────────
        const disp     = Math.hypot(dot.x - dot.ox, dot.y - dot.oy);
        const t        = Math.min(disp / 18, 1); // 0 = rest, 1 = max displaced

        // lerp: white (255,255,255) → teal (120,240,220)
        const r = Math.round(255 - t * 135);
        const g = Math.round(255 - t *  15);
        const b = Math.round(255 - t *  35);

        const baseOpacity = 0.04 + t * 0.22;  // subtle at rest, brighter displaced
        const opacity     = baseOpacity * centerFade;

        // ── Draw ────────────────────────────────────────────────────────
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_R + t * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity.toFixed(3)})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    // ── Event listeners ───────────────────────────────────────────────────
    const onMouseMove  = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    const onTouchMove  = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) mouseRef.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd   = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("mousemove",  onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });
    window.addEventListener("touchend",   onTouchEnd);
    window.addEventListener("resize",     resize);

    resize();
    draw();

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener("mousemove",  onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
      window.removeEventListener("resize",     resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
    />
  );
};
