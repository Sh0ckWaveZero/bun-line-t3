import React, { useEffect, useCallback } from "react";
import { Pane } from "tweakpane";
import { CONFIG } from "~/config/config";

interface RingProps {
  count: number;
}

const Rings: React.FC<RingProps> = ({ count }) => {
  const UPDATE = useCallback(() => {
    document.documentElement.style.setProperty(
      "--radius",
      CONFIG.radius.toString(),
    );
    document.documentElement.style.setProperty(
      "--base",
      CONFIG.hueBase.toString(),
    );
    document.documentElement.style.setProperty(
      "--chroma",
      CONFIG.chroma.toString(),
    );
    document.documentElement.style.setProperty(
      "--lightness",
      CONFIG.lightness.toString(),
    );
    document.documentElement.style.setProperty(
      "--limit",
      CONFIG.hueDestination.toString(),
    );
    document.documentElement.style.setProperty(
      "--speed",
      CONFIG.speed.toString(),
    );
    document.documentElement.style.setProperty(
      "--distance",
      CONFIG.distance.toString(),
    );
    document.documentElement.dataset.hue = CONFIG.hue.toString();
    document.documentElement.dataset.scale = CONFIG.scale.toString();
    document.documentElement.dataset.alternate = CONFIG.alternate.toString();
  }, []);

  useEffect(() => {
    const CTRL = new Pane({ title: "Config", expanded: false });

    CTRL.addBinding(CONFIG, "radius", {
      min: 0,
      max: 50,
      step: 1,
      label: "Radius",
    });

    CTRL.on("change", UPDATE);

    UPDATE();
  }, [UPDATE]);

  return (
    <div className="rings" style={{ "--count": count } as React.CSSProperties}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="ring"
          style={
            {
              "--index": i + 1,
              "--tw-ring-color": "transparent",
            } as React.CSSProperties
          }
        ></div>
      ))}
    </div>
  );
};

export default Rings;
