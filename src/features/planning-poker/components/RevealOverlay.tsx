import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  EffectLayer,
  type EffectLayerHandle,
} from "@react-cards-opening/effects";
import "@react-cards-opening/effects/styles.css";
import { ArcaneReveal, FX_RARITY_PROFILES } from "./ArcaneReveal";
import {
  resolveFxRarity,
  hashValue,
  FX_RARITIES,
} from "../helpers/fx-rarity";
import { PixelGlyph } from "./PixelGlyph";
import { PixelMatrixCard } from "./PixelMatrixCard";
import { getVoteTier, type VoteTier } from "../helpers/vote-tier";
import type { RoundSummary } from "../types";

/** ไพ่ใบเดียวกลางจอ — ค่าเฉลี่ยถ้ารอบนี้มีเลข ไม่งั้นค่าที่ถูกเลือกมากสุด (เช่น ทุกคนลง ☕) */
interface HeroCard {
  value: string;
  label: string;
}

/** ค่าเฉลี่ยถูกปัดทศนิยม 1 ตำแหน่งมาแล้วจาก summary — จำนวนเต็มไม่ต้องมีจุด */
const formatAverage = (average: number): string =>
  Number.isInteger(average) ? String(average) : average.toFixed(1);

/** distribution เรียงตาม deck อยู่แล้ว — เทียบแบบ > จึงเสมอกันได้ค่าที่อยู่ก่อนใน deck */
const toHeroCard = (summary: RoundSummary | null): HeroCard | null => {
  if (!summary) return null;
  if (summary.average !== null) {
    // มีค่าเฉลี่ย + consensus = ทุกคนลงเลขเดียวกัน → บอกเหตุผลที่อลังบนไพ่เลย
    return {
      value: formatAverage(summary.average),
      label: summary.isConsensus ? "Consensus" : "Average",
    };
  }
  let top: RoundSummary["distribution"][number] | null = null;
  for (const entry of summary.distribution) {
    if (!top || entry.count > top.count) top = entry;
  }
  return top ? { value: top.value, label: "Top pick" } : null;
};

/** จังหวะ: ไพ่โปรยลงพร้อม flash → fx ชุดแรก (480ms ด้านล่าง) → พลิก → fx finale ตอนพลิก → พักให้อ่านเลข
 *  ค่าเวลาส่งเข้า CSS ผ่าน --hero-*-delay ให้ JS เป็นแหล่งเดียว
 *  PLAY_TAIL นับจากเริ่มพลิก: พลิก 680ms + shine จบที่ ~1.7s ที่เหลือคือช่วงเลขนิ่งให้อ่าน (~5s) — คลิกข้ามได้เสมอ */
const HERO_DEAL_DELAY_MS = 120;
const HERO_FLIP_DELAY_MS = 700;
const FINALE_FX_OFFSET_MS = 100;
/** burst ตอนพลิกมีได้หลายชุดตามความหายาก — เว้นห่างกันพอให้แต่ละชุดอ่านออก ไม่ซ้อนเป็นก้อนเดียว */
const FINALE_BURST_GAP_MS = 140;
/** fx ชุดแรกต้องรอให้ backdrop ทึบ (300ms) และวงเวทขึ้นถึงพีค (~430ms) ก่อน ไม่งั้นช่วงสว่างสุดโดนกลบ */
const BASE_FX_DELAY_MS = 480;
/** lib ตั้งหน่วยขนาด fx จากความกว้างของ element ที่ส่งเข้า `at` — stage เต็มจอแล้วจึง pin ไว้เอง
 *  360 ไม่ใช่ 480: beams/nova กว้าง 3-5 เท่าของหน่วยนี้ ตอนเต็มจอไม่มี overflow ของแผงตัดแล้ว
 *  texture เลเยอร์แสงใหญ่ตาม และวาดคู่กับ canvas particle เต็มจอทุกเฟรม — หน่วยใหญ่เกิน = กระตุก */
const FX_UNIT_PX = 360;
const PLAY_TAIL_MS = 5800;
const CLOSE_MS = 400;
/** กองไพ่หลังคว่ำใต้ hero = จำนวนคนโหวต (hero นับเป็นใบบนสุด) — เกิน 6 ใบกองหนาเกิน จึง cap ใบล่างที่ 5 */
const MAX_STACK_BACKS = 5;

const TIER_LABELS: Record<VoteTier, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
  neutral: "",
};

/** โทนสีเอฟเฟกต์ = --primary ของธีมปัจจุบัน (canvas วาด oklch ได้ใน browser ยุคใหม่) */
const readPrimaryTone = (): string => {
  if (typeof window === "undefined") return "#8a79ab";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim();
  return value || "#8a79ab";
};

/**
 * Overlay เปิดไพ่แบบ demo hero: scrim หรี่+เบลอเต็มจอ (เห็นไพ่รายคนใน roster พลิกจาง ๆ ข้างหลัง),
 * วงเวท arcane และเอฟเฟกต์จากคลัง 64 ของ @react-cards-opening/effects เล่นเต็ม viewport ไม่มีกรอบแผง
 * (ขอบเดียวที่ตัดคือขอบจอ) ตามคอมโบของชั้นความหายาก,
 * ไพ่ค่าเฉลี่ยวางบนกองไพ่โหวต (ใบล่าง = คนโหวต) ใบบนสุดยกตัวแล้วพลิกเปิด — คลิกเพื่อข้าม
 * จบเองด้วย timer (มี cleanup); reduced-motion ข้ามทั้ง overlay (lib เองก็ไม่เล่นด้วย)
 * aria-hidden ทั้งก้อน: ข้อมูลจริงประกาศผ่าน role="status" และ ResultsPanel อยู่แล้ว
 */
export const RevealOverlay = ({
  summary,
  round,
  streak = 0,
}: {
  summary: RoundSummary | null;
  /** เลขรอบ — ผสมใน hash เพื่อหมุนโชว์ในโซนให้ต่างกันทุกรอบ */
  round: number;
  /** จำนวนรอบดีติดกันก่อนรอบนี้ — ไต่ชั้น epic → legendary → mythic */
  streak?: number;
}) => {
  const [isReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [phase, setPhase] = useState<"play" | "close" | "gone">("play");
  const layerRef = useRef<EffectLayerHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const heroCard = toHeroCard(summary);
  // QA hook (dev only): /planning-poker/CODE?fx=rare&fxSeed=7 — บังคับชั้น/seed ดูคอมโบได้ทุกแบบ
  // (ไม่ใส่พารามิเตอร์ = สุ่มตามปกติ; production build ไม่อ่าน)
  const devFx = (() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    const rarity = FX_RARITIES.find((candidate) => candidate === params.get("fx"));
    const rawSeed = params.get("fxSeed");
    const seed =
      rawSeed !== null && rawSeed !== "" && Number.isFinite(Number(rawSeed))
        ? Number(rawSeed)
        : undefined;
    return { rarity, seed };
  })();
  // ชั้นความอลัง: ค่าเฉลี่ยของรอบ = ลายเซ็นทั้งหมด (ยิ่งต่ำยิ่งอลัง, consensus = สูงสุด) — ไม่มีสุ่ม
  // QA hook (dev only): ?fx=rare บังคับชั้น, ?fxSeed=7 บังคับคอมโบในชั้น
  const [fxRarity] = useState(() =>
    devFx.rarity ??
    resolveFxRarity(
      heroCard?.value ?? "?",
      summary?.isConsensus ?? false,
      streak,
    ),
  );
  // โชว์ในโซน: hash(ค่า:รอบ) — ทีมที่ประมาณใกล้เคียงกันทุกรอบจะเห็นโชว์หมุนเวียนในโซน
  // (ค่าเดิม+รอบเดิมยัง deterministic; seed override เฉพาะ QA)
  const [fxSeed] = useState(() =>
    devFx.seed ?? hashValue(`${heroCard?.value ?? "?"}:${round}`),
  );

  useEffect(() => {
    if (phase !== "play") return;
    const { combos, finaleBursts } = FX_RARITY_PROFILES[fxRarity];
    const tone = readPrimaryTone();
    const playCombo = (comboIndex: number, delayMs: number) => {
      const combo = combos[comboIndex % combos.length];
      if (!combo) return;
      layerRef.current?.play([...combo], {
        at: stageRef.current ?? undefined,
        size: FX_UNIT_PX,
        tone,
        delay: delayMs / 1000,
      });
    };

    // ชุดแรกตอนวงเวทขึ้น (delay ผ่าน lib เพื่อให้ timeline เดียวจัดจังหวะ)
    playCombo(fxSeed, BASE_FX_DELAY_MS);
    // burst ตอนไพ่พลิก — จำนวนชุดตามความหายาก เว้นห่างกันทีละ gap
    const timers = Array.from({ length: finaleBursts }, (_, index) =>
      window.setTimeout(
        () => playCombo(fxSeed + index + 1, 0),
        HERO_FLIP_DELAY_MS + FINALE_FX_OFFSET_MS + index * FINALE_BURST_GAP_MS,
      ),
    );
    timers.push(
      window.setTimeout(
        () => setPhase("close"),
        HERO_FLIP_DELAY_MS + PLAY_TAIL_MS,
      ),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase, fxRarity, fxSeed]);

  useEffect(() => {
    if (phase !== "close") return;
    const timer = window.setTimeout(() => setPhase("gone"), CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (isReducedMotion || phase === "gone" || !heroCard) {
    return null;
  }

  const tier = getVoteTier(heroCard.value);
  const tierLabel = TIER_LABELS[tier];
  // จังหวะส่งเข้า CSS ที่ wrapper กอง ให้ทั้งใบล่าง (ลงก่อน 60ms) และ hero (ลง → ยก → พลิก) อ่านค่าเดียวกัน
  const stackStyle = {
    "--hero-deal-delay": `${HERO_DEAL_DELAY_MS}ms`,
    "--hero-flip-delay": `${HERO_FLIP_DELAY_MS}ms`,
  } as CSSProperties;
  // Center the backing cards around the hero so odd stack counts stay balanced.
  const stackBackCount = Math.min(
    Math.max((summary?.voteCount ?? 1) - 1, 0),
    MAX_STACK_BACKS,
  );
  const fanOffsets = Array.from(
    { length: stackBackCount },
    (_, index) => index - (stackBackCount - 1) / 2,
  );
  const stackBacks = fanOffsets
    .map((offset) => ({
      depth: Math.ceil(Math.abs(offset)) + 1,
      offset,
      tilt: offset * 5,
    }))
    // Draw the outer cards first so the centered inner card covers both sides evenly.
    .sort((left, right) => Math.abs(right.offset) - Math.abs(left.offset));

  return (
    <div
      className={cn(
        "poker-spot-backdrop",
        phase === "close" && "poker-spot-backdrop--closing",
      )}
      aria-hidden="true"
      onClick={() => setPhase("close")}
    >
      <div className="poker-spot-stage" ref={stageRef}>
        <ArcaneReveal rarity={fxRarity} seed={fxSeed} />
        {/* เลเยอร์เอฟเฟกต์จากคลัง 64 — วางก่อนกองไพ่เพื่อให้เอฟเฟกต์อยู่หลังไพ่ (ตาม docs)
            bg โปร่งใสเพื่อไม่ให้เห็นขอบสี่เหลี่ยมของ canvas บน backdrop โปร่งของเรา */}
        <EffectLayer
          handle={layerRef}
          tone={readPrimaryTone()}
          theme={{ bg: "transparent" }}
        />
        <div className="poker-hero-group">
          <div className="poker-hero-stack" style={stackStyle}>
            {stackBacks.map((back) => (
              <div
                key={back.offset}
                className="poker-hero-under"
                style={
                  {
                    "--u": back.depth,
                    /* px ไม่ใช่ vmin — fan เคยกว้างถึง ±24vmin จนบังคับให้ฉากต้องกว้าง 660px */
                    "--fan-x": `${back.offset * 10}px`,
                    "--tilt": `${back.tilt}deg`,
                  } as CSSProperties
                }
              />
            ))}
            <div className="poker-hero poker-flip-scene">
              <div className="poker-flip poker-flip--revealed">
                <div className="poker-flip-face poker-flip-face--back border-primary bg-primary text-primary-foreground">
                  <PixelGlyph value="?" />
                </div>
                <div
                  className={cn(
                    "poker-flip-face poker-flip-face--front",
                    `poker-tier--${tier}`,
                  )}
                >
                  <PixelMatrixCard value={heroCard.value} cell={210 / 9} />
                </div>
              </div>
            </div>
          </div>
          <div className="poker-hero-caption">
            <span className="poker-hero-label">{heroCard.label}</span>
            {tierLabel ? (
              <span className="poker-hero-tier">{tierLabel}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
