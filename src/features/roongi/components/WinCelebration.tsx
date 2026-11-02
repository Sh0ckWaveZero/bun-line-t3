import { useEffect, useRef } from "react";
import {
  EffectLayer,
  type EffectLayerHandle,
} from "@react-cards-opening/effects";
import "@react-cards-opening/effects/styles.css";
import { getCelebrationProfile } from "../lib/celebration";

export default function WinCelebration({ prize }: { prize: number }) {
  const layerRef = useRef<EffectLayerHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const layer = layerRef.current;
    const stage = stageRef.current;
    if (!layer || !stage) return;
    const profile = getCelebrationProfile(prize);
    const timeline = layer.play(profile.effects, {
      at: stage,
      size: Math.min(profile.size, window.innerWidth * 0.9),
      tone: profile.tone,
    });
    const stopForReducedMotion = () => {
      if (preference.matches) {
        timeline?.kill();
        layer.clear();
      }
    };
    preference.addEventListener("change", stopForReducedMotion);
    return () => {
      preference.removeEventListener("change", stopForReducedMotion);
      timeline?.kill();
      layer.clear();
    };
  }, [prize]);

  return (
    <div
      ref={stageRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
    >
      <EffectLayer
        handle={layerRef}
        tone={getCelebrationProfile(prize).tone}
        theme={{ bg: "transparent" }}
      />
    </div>
  );
}
