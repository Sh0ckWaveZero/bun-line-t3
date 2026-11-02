"use client";

// Copyright (c) 2026 David Haz. See LICENSE.md for the MIT + Commons Clause terms.

import { useMemo } from "react";
import type { CSSProperties } from "react";
import { SplitFlapTile } from "./SplitFlapTile";
import type {
  SplitFlapTiming,
  SplitFlapTextProps,
} from "./SplitFlapText.types";
import { normalizePhrase } from "./splitFlapText.utils";
import { useSplitFlapAnimation } from "./useSplitFlapAnimation";
import "./SplitFlapText.css";

export type {
  SplitFlapAlign,
  SplitFlapOrder,
  SplitFlapTextProps,
  SplitFlapTileStyle,
} from "./SplitFlapText.types";

const DEFAULT_WORDS = ["LAUNCH READY", "SYNC ONLINE", "SIGNAL LIVE"];

const CHARSETS: Record<string, string> = {
  alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  numeric: "0123456789",
};

const toCssUnit = (value: number | string) =>
  typeof value === "number" ? `${value}px` : value;

const resolveCharset = (charset: SplitFlapTextProps["charset"]) => {
  if (charset && CHARSETS[charset]) return CHARSETS[charset];
  return typeof charset === "string" && charset.length > 0
    ? charset
    : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
};

const clampUnit = (value: number) =>
  Math.min(1, Math.max(0, Number(value) || 0));

const round = (value: number) => Number(value.toFixed(3));

const SplitFlapText = ({
  words = ["LAUNCH READY", "SYNC ONLINE", "SIGNAL LIVE"],
  text,
  initialText,
  flipDuration = 0.12,
  stagger = 0.06,
  startDelay = 0,
  cycleDelay = 2400,
  charset = "alphanumeric",
  flipsPerChar = 8,
  tileColor = "#111827",
  textColor = "#f8fafc",
  tileRadius = 8,
  gap = 6,
  fontSize = 52,
  loop = true,
  padTo = 12,
  align = "left",
  intro = true,
  glare = 0,
  depth = 0.5,
  order = "left",
  tileStyle = "board",
  className = "",
  style = {},
  ...props
}: SplitFlapTextProps) => {
  const sourceWords =
    Array.isArray(words) && words.length > 0 ? words : DEFAULT_WORDS;
  const phrasesKey =
    typeof text === "string"
      ? text
      : sourceWords.map((word) => String(word ?? "")).join("\u001f");
  const phrases = useMemo(() => phrasesKey.split("\u001f"), [phrasesKey]);

  const width = useMemo(() => {
    const longest = phrases.reduce(
      (max, phrase) => Math.max(max, phrase.length),
      1,
    );
    return Math.max(1, Math.ceil(Number(padTo) || 0), longest);
  }, [padTo, phrases]);

  const normalizedPhrases = useMemo(
    () => phrases.map((phrase) => normalizePhrase(phrase, width, align)),
    [phrases, width, align],
  );

  const timing = useMemo<SplitFlapTiming>(
    () => ({
      flipMs: Math.max(40, (Number(flipDuration) || 0.12) * 1000),
      staggerMs: Math.max(0, (Number(stagger) || 0) * 1000),
      startDelayMs: Math.max(0, Number(startDelay) || 0),
      holdMs: Math.max(400, Number(cycleDelay) || 2400),
      flips: Math.max(0, Math.floor(Number(flipsPerChar) || 0)),
      glyphs: resolveCharset(charset),
      order,
    }),
    [
      flipDuration,
      stagger,
      startDelay,
      cycleDelay,
      flipsPerChar,
      charset,
      order,
    ],
  );

  const { tiles, activeIndex } = useSplitFlapAnimation({
    normalizedPhrases,
    width,
    loop,
    intro,
    initialText,
    align,
    timing,
  });

  const label = String(phrases[activeIndex] ?? phrases[0] ?? "").trim();
  const minimal = tileStyle === "minimal";
  const level = clampUnit(depth);
  const flat = Math.min(1, level * 2);
  const deep = Math.max(0, level - 0.5) * 2;
  const sheen = minimal ? 0 : clampUnit(glare);
  const shaded = !minimal && deep > 0;
  const rootClass = [
    "split-flap-text",
    minimal && "split-flap-text--minimal",
    sheen > 0 && "split-flap-text--glare",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const componentStyle: CSSProperties &
    Record<string, string | number | undefined> = {
    "--split-flap-tile-color": tileColor,
    "--split-flap-text-color": textColor,
    "--split-flap-radius": toCssUnit(tileRadius),
    "--split-flap-gap": toCssUnit(gap),
    "--split-flap-font-size": toCssUnit(fontSize),
    "--split-flap-flip-duration": `${Math.max(0.04, Number(flipDuration) || 0.12)}s`,
    "--split-flap-front-from": round(1 + 0.08 * flat),
    "--split-flap-front-to": round(1 - 0.48 * flat - 0.3 * deep),
    "--split-flap-back-from": round(1 - 0.42 * flat - 0.3 * deep),
    "--split-flap-hinge": `calc(1px + ${round(deep * 0.05)}em)`,
    "--split-flap-hinge-shade": round(0.25 + 0.39 * flat + 0.21 * deep),
    "--split-flap-drop": round(0.28 * flat + 0.2 * deep),
    "--split-flap-lift": round(0.4 + 0.6 * flat + 0.7 * deep),
    "--split-flap-cast": round(deep * 0.62),
    "--split-flap-edge": `${round(deep * 0.035)}em`,
    "--split-flap-split": `${round(0.015 + level * 0.06)}em`,
    "--split-flap-glare": round(sheen * 0.55),
    ...style,
  };

  return (
    <div className={rootClass} style={componentStyle} {...props}>
      <span className="split-flap-text__sr">{label}</span>
      {tiles.map((tile, index) => (
        <SplitFlapTile
          key={`${index}-${tiles.length}`}
          tile={tile}
          index={index}
          minimal={minimal}
          shaded={shaded}
        />
      ))}
    </div>
  );
};

export default SplitFlapText;
