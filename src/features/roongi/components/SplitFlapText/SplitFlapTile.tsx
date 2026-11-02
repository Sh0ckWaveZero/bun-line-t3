// Copyright (c) 2026 David Haz. See LICENSE.md for the MIT + Commons Clause terms.

import type { TileState } from "./SplitFlapText.types";

interface SplitFlapTileProps {
  tile: TileState;
  index: number;
  minimal: boolean;
  shaded: boolean;
}

const toGlyph = (char: string) => (char === " " ? " " : char);

export const SplitFlapTile = ({
  tile,
  index,
  minimal,
  shaded,
}: SplitFlapTileProps) => (
  <span
    className={
      tile.flipping
        ? "split-flap-text__tile is-flipping"
        : "split-flap-text__tile"
    }
    aria-hidden="true"
  >
    <span
      className="split-flap-text__half split-flap-text__half--top"
      key={minimal ? `top-${tile.tick}` : "top"}
    >
      <span className="split-flap-text__char">
        {toGlyph(tile.flipping ? tile.next : tile.current)}
      </span>
    </span>
    <span
      className="split-flap-text__half split-flap-text__half--bottom"
      key={minimal ? `bottom-${tile.tick}` : "bottom"}
    >
      <span className="split-flap-text__char">{toGlyph(tile.current)}</span>
    </span>

    {tile.flipping && (
      <>
        {shaded && (
          <>
            <span
              className="split-flap-text__shade split-flap-text__shade--top"
              key={`shade-top-${tile.tick}`}
            />
            <span
              className="split-flap-text__shade split-flap-text__shade--bottom"
              key={`shade-bottom-${tile.tick}`}
            />
          </>
        )}
        <span
          className="split-flap-text__flap split-flap-text__flap--front"
          key={`front-${index}-${tile.tick}`}
        >
          <span className="split-flap-text__char">{toGlyph(tile.current)}</span>
        </span>
        <span
          className="split-flap-text__flap split-flap-text__flap--back"
          key={`back-${index}-${tile.tick}`}
        >
          <span className="split-flap-text__char">{toGlyph(tile.next)}</span>
        </span>
      </>
    )}
  </span>
);
