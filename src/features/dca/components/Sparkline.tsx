"use client";

import { useMemo } from "react";
import { defineChart, lineY } from "@tanstack/charts";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { Chart } from "@tanstack/charts/react";

interface SparklineProps {
  values: number[];
  color: string;
}

const WIDTH = 56;
const HEIGHT = 18;

export const Sparkline = ({ values, color }: SparklineProps) => {
  const definition = useMemo(() => {
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || Math.abs(max) * 0.02 || 1;
    const points = values.map((value, index) => ({ index, value }));

    return defineChart({
      margin: 0,
      guides: false,
      marks: [
        lineY(points, {
          x: "index",
          y: "value",
          stroke: color,
          strokeWidth: 1.3,
        }),
      ],
      scales: {
        x: {
          scale: scalePoint<number>().domain(
            points.map((point) => point.index),
          ),
          axis: false,
        },
        y: {
          scale: scaleLinear().domain([min - range * 0.05, max + range * 0.05]),
          axis: false,
          grid: false,
        },
      },
      pointer: false,
      keyboard: false,
      focus: false,
      tooltip: false,
    });
  }, [color, values]);

  if (!definition) return null;

  return (
    <span
      className="pointer-events-none absolute top-2 right-2 z-0 opacity-45 sm:top-3.5 sm:right-3.5"
      aria-hidden="true"
    >
      <Chart
        definition={definition}
        ariaLabel="Decorative DCA trend sparkline"
        width={WIDTH}
        height={HEIGHT}
        tabIndex={-1}
        style={{ width: WIDTH, height: HEIGHT }}
      />
    </span>
  );
};
