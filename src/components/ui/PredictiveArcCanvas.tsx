"use client";

// PredictiveArcCanvas — halftone arc field on Canvas 2D
// Adapted from the ThreeUI "Predictive Arc" background (predictiveArcRenderer):
// a parabolic band of halftone dots with a shimmering violet-to-white core.
// Lifecycle follows the reference host: ResizeObserver, IntersectionObserver
// (pause offscreen), document visibility (pause hidden), DPR capped at 2,
// and a still frame under prefers-reduced-motion.
import { useEffect, useRef } from "react";

export type PredictiveArcMode = "dark" | "light";

export interface PredictiveArcCanvasProps {
  /** Color scene: dark glows violet-white on near-black; light draws deep violet on pale gray */
  mode?: PredictiveArcMode;
  /** Animation speed multiplier (time advances 0.015 * speed per frame) */
  speed?: number;
  /** Grid step between dot centers in CSS pixels */
  spacing?: number;
  /** Base dot size in pixels (scaled by intensity) */
  dotSize?: number;
  /** Arch drop as a fraction of container height */
  archHeight?: number;
  /** Band thickness multiplier around the parabola */
  thickness?: number;
  /** RGB brightness multiplier for the dots */
  brightness?: number;
  /** CSS hue-rotate degrees applied to the canvas */
  hue?: number;
  /** CSS saturation multiplier applied to the canvas */
  saturation?: number;
  className?: string;
}

interface PredictiveArcOptions {
  mode: PredictiveArcMode;
  speed: number;
  spacing: number;
  dotSize: number;
  archHeight: number;
  thickness: number;
  brightness: number;
  hue: number;
  saturation: number;
}

const PREDICTIVE_ARC_DEFAULTS: PredictiveArcOptions = {
  mode: "dark",
  speed: 1,
  spacing: 5,
  dotSize: 6,
  archHeight: 0.7,
  thickness: 1,
  brightness: 1,
  hue: 0,
  saturation: 1,
};

interface PredictiveArcRenderer {
  resize: (width: number, height: number) => void;
  render: () => void;
}

function createPredictiveArcRenderer(
  canvas: HTMLCanvasElement,
  getOptions: () => PredictiveArcOptions,
): PredictiveArcRenderer | null {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;

  let cssWidth = 1;
  let cssHeight = 1;
  let time = 0;

  return {
    resize(nextWidth: number, nextHeight: number) {
      cssWidth = Math.max(1, nextWidth);
      cssHeight = Math.max(1, nextHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    render() {
      const options = getOptions();
      const isLight = options.mode === "light";

      ctx.fillStyle = isLight ? "#eef1f6" : "#030303";
      ctx.fillRect(0, 0, cssWidth, cssHeight);
      time += 0.015 * options.speed;

      const centerX = cssWidth / 2;
      const apexY = cssHeight * 0.35;
      const halfSpan = (cssWidth * 1.5) / 2;
      const drop = cssHeight * options.archHeight;

      // Additive blending makes overlapping dots bloom into the hot white core
      ctx.globalCompositeOperation = isLight ? "source-over" : "lighter";

      for (let x = 0; x < cssWidth; x += options.spacing) {
        const m = (x - centerX) / halfSpan;
        const arcY = apexY + m * m * drop;

        for (let y = 0; y < cssHeight; y += options.spacing) {
          const distance = Math.abs(y - arcY);
          const band = (140 + (1 - Math.abs(m)) * 80) * options.thickness;
          if (distance >= band) continue;

          let intensity = 1 - distance / band;
          const shimmer =
            Math.sin(x * 0.015 + time) * Math.cos(y * 0.02 + time);
          intensity = intensity * 0.7 + shimmer * 0.3 * intensity;
          intensity *= Math.max(0, 1 - Math.pow(Math.abs(m), 2.5));
          if (intensity <= 0.02) continue;

          let r: number;
          let g: number;
          let b: number;
          if (isLight) {
            r = Math.min(255, 48 * intensity + 70 * Math.pow(intensity, 3));
            g = Math.min(255, 28 * intensity + 45 * Math.pow(intensity, 4));
            b = Math.min(255, 120 * intensity + 110 * Math.pow(intensity, 2));
            if (intensity > 0.7) {
              const boost = (intensity - 0.7) * 3.3;
              r = Math.min(255, r + 90 * boost);
              g = Math.min(255, g + 70 * boost);
              b = Math.min(255, b + 110 * boost);
            }
          } else {
            r = Math.min(255, 60 * intensity + 100 * Math.pow(intensity, 3));
            g = Math.min(255, 20 * intensity + 60 * Math.pow(intensity, 4));
            b = Math.min(255, 120 * intensity + 135 * Math.pow(intensity, 2));
            if (intensity > 0.7) {
              const boost = (intensity - 0.7) * 3.3;
              r = Math.min(255, r + 150 * boost);
              g = Math.min(255, g + 150 * boost);
              b = Math.min(255, b + 150 * boost);
            }
          }

          ctx.fillStyle = `rgb(${Math.floor(r * options.brightness)}, ${Math.floor(g * options.brightness)}, ${Math.floor(b * options.brightness)})`;
          ctx.fillRect(
            x,
            y,
            options.dotSize * intensity,
            options.dotSize * intensity,
          );
        }
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };
}

export function PredictiveArcCanvas({
  mode = PREDICTIVE_ARC_DEFAULTS.mode,
  speed = PREDICTIVE_ARC_DEFAULTS.speed,
  spacing = PREDICTIVE_ARC_DEFAULTS.spacing,
  dotSize = PREDICTIVE_ARC_DEFAULTS.dotSize,
  archHeight = PREDICTIVE_ARC_DEFAULTS.archHeight,
  thickness = PREDICTIVE_ARC_DEFAULTS.thickness,
  brightness = PREDICTIVE_ARC_DEFAULTS.brightness,
  hue = PREDICTIVE_ARC_DEFAULTS.hue,
  saturation = PREDICTIVE_ARC_DEFAULTS.saturation,
  className = "",
}: PredictiveArcCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PredictiveArcRenderer | null>(null);
  const optionsRef = useRef<PredictiveArcOptions>({
    mode,
    speed,
    spacing,
    dotSize,
    archHeight,
    thickness,
    brightness,
    hue,
    saturation,
  });

  // Keep the latest options readable by the render loop each frame
  useEffect(() => {
    optionsRef.current = {
      mode,
      speed,
      spacing,
      dotSize,
      archHeight,
      thickness,
      brightness,
      hue,
      saturation,
    };
  });

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const renderer = createPredictiveArcRenderer(
      canvas,
      () => optionsRef.current,
    );
    if (!renderer) return;
    rendererRef.current = renderer;

    const syncSize = () => {
      const rect = host.getBoundingClientRect();
      renderer.resize(rect.width, rect.height);
      renderer.render();
    };

    // Reduced motion: draw the authored still frame, no animation loop
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      const resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(host);
      syncSize();
      return () => {
        resizeObserver.disconnect();
        rendererRef.current = null;
      };
    }

    let frameId = 0;
    let isOnScreen = true;

    // เรซิวเม/หยุดด้วย cancelAnimationFrame จาก observer/visibility เท่านั้น
    // loop จึง schedule ต่อไม่มีเงื่อนไข เพื่อให้ frameId ถูก track ทุกเฟรม
    const loop = () => {
      renderer.render();
      frameId = requestAnimationFrame(loop);
    };

    const resizeObserver = new ResizeObserver(syncSize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isOnScreen = entry?.isIntersecting ?? true;
      if (isOnScreen && !frameId) frameId = requestAnimationFrame(loop);
      if (!isOnScreen && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    });
    const handleVisibility = () => {
      if (document.hidden && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else if (!document.hidden && isOnScreen && !frameId) {
        frameId = requestAnimationFrame(loop);
      }
    };

    resizeObserver.observe(host);
    intersectionObserver.observe(host);
    document.addEventListener("visibilitychange", handleVisibility);
    syncSize();
    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      rendererRef.current = null;
    };
  }, []);

  // Prop changes (e.g. mode switch) apply automatically in the animation loop;
  // under reduced motion there is no loop, so redraw a still frame manually.
  useEffect(() => {
    rendererRef.current?.render();
  }, [mode, speed, spacing, dotSize, archHeight, thickness, brightness]);

  return (
    <div
      ref={hostRef}
      className={`overflow-hidden ${className}`}
      data-mode={mode}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{ filter: `hue-rotate(${hue}deg) saturate(${saturation})` }}
      />
    </div>
  );
}
