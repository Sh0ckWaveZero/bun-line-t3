// Copyright (c) 2026 David Haz. See LICENSE.md for the MIT + Commons Clause terms.

import type { SplitFlapAlign } from "./SplitFlapText.types";

export const normalizePhrase = (
  phrase: string,
  width: number,
  align: SplitFlapAlign = "left",
) => {
  const safe = String(phrase ?? "").slice(0, width);
  if (align === "right") return safe.padStart(width, " ");
  if (align === "center") {
    return safe
      .padStart(safe.length + Math.floor((width - safe.length) / 2), " ")
      .padEnd(width, " ");
  }
  return safe.padEnd(width, " ");
};
