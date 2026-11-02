// Copyright (c) 2026 David Haz. See LICENSE.md for the MIT + Commons Clause terms.

import { useEffect, useRef, useState } from "react";
import type {
  AnimationPlan,
  SplitFlapAlign,
  SplitFlapTiming,
  TileState,
  TileUpdate,
} from "./SplitFlapText.types";
import { normalizePhrase } from "./splitFlapText.utils";

const createTiles = (phrase: string): TileState[] =>
  phrase.split("").map((char) => ({
    current: char,
    next: char,
    flipping: false,
    tick: 0,
  }));

const sampleChar = (charset: string) =>
  charset.charAt(Math.floor(Math.random() * charset.length)) || " ";

const buildSequence = (target: string, flips: number, charset: string) => {
  const steps: string[] = [];
  for (let i = 0; i < flips; i += 1) {
    steps.push(sampleChar(charset));
  }
  steps.push(target);
  return steps;
};

const shuffleIndices = (count: number) => {
  const list = Array.from({ length: count }, (_, index) => index);
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const left = list[i];
    const right = list[j];
    if (left !== undefined && right !== undefined)
      [list[i], list[j]] = [right, left];
  }
  return list;
};

const cascadeStep = (
  index: number,
  width: number,
  order: SplitFlapTiming["order"],
  randomOrder: number[] | null,
) => {
  if (order === "right") return width - 1 - index;
  if (order === "center") return Math.floor(Math.abs(index - (width - 1) / 2));
  if (order === "random" && randomOrder) return randomOrder[index] ?? index;
  return index;
};

const getReducedMotion = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

const usePrefersReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(getReducedMotion);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReduced(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReduced;
};

interface UseSplitFlapAnimationOptions {
  normalizedPhrases: string[];
  width: number;
  loop: boolean;
  intro: boolean;
  initialText: string | undefined;
  align: SplitFlapAlign;
  timing: SplitFlapTiming;
}

export const useSplitFlapAnimation = ({
  normalizedPhrases,
  width,
  loop,
  intro,
  initialText,
  align,
  timing,
}: UseSplitFlapAnimationOptions) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rafRef = useRef<number | null>(null);
  const shownRef = useRef<string | null>(null);
  const fromRef = useRef<string | null>(null);
  const indexRef = useRef(0);
  const phrasesRef = useRef<string[] | null>(null);

  const [tiles, setTiles] = useState<TileState[]>(() =>
    createTiles(
      prefersReducedMotion
        ? (normalizedPhrases[0] ?? "")
        : initialText !== undefined
          ? normalizePhrase(initialText, width, align)
          : intro
            ? " ".repeat(width)
            : (normalizedPhrases[0] ?? ""),
    ),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const timingRef = useRef(timing);

  useEffect(() => {
    timingRef.current = timing;
  }, [timing]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const stopFrame = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const animateTo = (target: string) => {
      const {
        flipMs,
        staggerMs,
        startDelayMs,
        flips,
        glyphs,
        order: cascade,
      } = timingRef.current;
      const from = normalizePhrase(shownRef.current ?? target, target.length);
      const randomOrder =
        cascade === "random" ? shuffleIndices(target.length) : null;

      stopFrame();
      shownRef.current = target;
      fromRef.current = null;

      const plans: AnimationPlan[] = [];
      if (!prefersReducedMotion) {
        for (let index = 0; index < target.length; index += 1) {
          const fromChar = from[index];
          const targetChar = target[index];
          if (
            fromChar === undefined ||
            targetChar === undefined ||
            (fromChar === targetChar && initialText === undefined)
          )
            continue;
          plans.push({
            index,
            from: fromChar,
            target: targetChar,
            sequence: buildSequence(targetChar, flips, glyphs),
            start:
              startDelayMs +
              cascadeStep(index, target.length, cascade, randomOrder) *
                staggerMs,
            step: -1,
            done: false,
          });
        }
      }

      if (!plans.length) {
        setTiles(createTiles(target));
        return 0;
      }

      fromRef.current = from;
      setTiles(createTiles(from));

      const totalDuration = plans.reduce(
        (max, plan) =>
          Math.max(max, plan.start + plan.sequence.length * flipMs),
        0,
      );
      const startedAt = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;

        const elapsed = now - startedAt;
        const updates: TileUpdate[] = [];
        let running = false;

        plans.forEach((plan) => {
          const localElapsed = elapsed - plan.start;

          if (localElapsed < 0) {
            running = true;
            return;
          }

          const step = Math.floor(localElapsed / flipMs);

          if (step < plan.sequence.length) {
            running = true;

            if (step !== plan.step) {
              plan.step = step;
              updates.push({
                index: plan.index,
                current:
                  step === 0
                    ? plan.from
                    : (plan.sequence[step - 1] ?? plan.target),
                next: plan.sequence[step] ?? plan.target,
                done: false,
              });
            }
          } else if (!plan.done) {
            plan.done = true;
            updates.push({
              index: plan.index,
              current: plan.target,
              next: plan.target,
              done: true,
            });
          }
        });

        if (updates.length > 0) {
          setTiles((previous) => {
            const nextTiles = [...previous];
            updates.forEach((update) => {
              const tile = nextTiles[update.index];
              if (!tile) return;

              nextTiles[update.index] = {
                current: update.current,
                next: update.next,
                flipping: !update.done,
                tick: tile.tick + 1,
              };
            });
            return nextTiles;
          });
        }

        if (running) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          fromRef.current = null;
        }
      };

      rafRef.current = requestAnimationFrame(tick);
      return totalDuration;
    };

    const show = (index: number) => {
      indexRef.current = index;
      setActiveIndex(index);
      return animateTo(normalizedPhrases[index] ?? "");
    };

    const scheduleNext = (delay: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;

        if (document.hidden) {
          scheduleNext(timingRef.current.holdMs);
          return;
        }

        const nextIndex = indexRef.current + 1;
        if (nextIndex >= normalizedPhrases.length && !loop) return;

        const duration = show(nextIndex % normalizedPhrases.length);
        scheduleNext(timingRef.current.holdMs + duration);
      }, delay);
    };

    const samePhrases = phrasesRef.current === normalizedPhrases;
    phrasesRef.current = normalizedPhrases;

    if (shownRef.current === null) {
      shownRef.current = prefersReducedMotion
        ? (normalizedPhrases[0] ?? "")
        : initialText !== undefined
          ? normalizePhrase(initialText, width, align)
          : intro
            ? " ".repeat(width)
            : (normalizedPhrases[0] ?? "");
    }

    if (!samePhrases || indexRef.current >= normalizedPhrases.length) {
      indexRef.current = 0;
    } else if (fromRef.current !== null) {
      shownRef.current = fromRef.current;
    }

    let startDuration = 0;
    if (shownRef.current === normalizedPhrases[indexRef.current]) {
      stopFrame();
      fromRef.current = null;
      setActiveIndex(indexRef.current);
      setTiles(createTiles(shownRef.current));
    } else {
      startDuration = show(indexRef.current);
    }

    if (normalizedPhrases.length > 1) {
      scheduleNext(timingRef.current.holdMs + startDuration);
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopFrame();
    };
  }, [
    normalizedPhrases,
    width,
    loop,
    intro,
    initialText,
    align,
    prefersReducedMotion,
  ]);

  return { tiles, activeIndex };
};
