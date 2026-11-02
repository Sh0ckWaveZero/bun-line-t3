// Copyright (c) 2026 David Haz. See LICENSE.md for the MIT + Commons Clause terms.

import type { HTMLAttributes } from "react";

export interface TileState {
  current: string;
  next: string;
  flipping: boolean;
  tick: number;
}

export interface AnimationPlan {
  index: number;
  from: string;
  target: string;
  sequence: string[];
  start: number;
  step: number;
  done: boolean;
}

export interface TileUpdate {
  index: number;
  current: string;
  next: string;
  done: boolean;
}

export interface SplitFlapTiming {
  flipMs: number;
  staggerMs: number;
  startDelayMs: number;
  holdMs: number;
  flips: number;
  glyphs: string;
  order: SplitFlapOrder;
}

export type SplitFlapAlign = "left" | "center" | "right";

export type SplitFlapOrder = "left" | "right" | "center" | "random";

export type SplitFlapTileStyle = "board" | "minimal";

export interface SplitFlapTextProps extends HTMLAttributes<HTMLDivElement> {
  words?: string[];
  text?: string;
  initialText?: string;
  flipDuration?: number;
  stagger?: number;
  startDelay?: number;
  cycleDelay?: number;
  charset?: "alpha" | "alphanumeric" | "numeric" | (string & {});
  flipsPerChar?: number;
  tileColor?: string;
  textColor?: string;
  tileRadius?: number | string;
  gap?: number | string;
  fontSize?: number | string;
  loop?: boolean;
  padTo?: number;
  align?: SplitFlapAlign;
  intro?: boolean;
  glare?: number;
  depth?: number;
  order?: SplitFlapOrder;
  tileStyle?: SplitFlapTileStyle;
}
