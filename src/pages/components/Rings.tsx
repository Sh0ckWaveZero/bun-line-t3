import React, { useEffect, useCallback } from "react";
import { Pane } from "tweakpane";
import { CONFIG } from "~/config/config";
import { env } from "~/env.mjs";

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

  const configurePane = (pane: Pane, UPDATE: () => void) => {
    pane.hidden =
      process.env.NEXT_PUBLIC_APP_ENV !== "production" ? false : true;

    pane.addBinding(CONFIG, "radius", {
      min: 0,
      max: 50,
      step: 1,
      label: "Radius",
    });
    pane.addBinding(CONFIG, "distance", {
      min: 5,
      max: 50,
      step: 1,
      label: "Distance (vmin)",
    });
    pane.addBinding(CONFIG, "speed", {
      min: 0.1,
      max: 10,
      step: 0.1,
      label: "Speed (s)",
    });
    pane.addBinding(CONFIG, "alternate", { label: "Alternate" });
    pane.addBinding(CONFIG, "scale", { label: "Animate Scale" });

    const COLOR = pane.addFolder({ title: "Color" });
    COLOR.addBinding(CONFIG, "hue", { label: "Animate Hue" });
    COLOR.addBinding(CONFIG, "lightness", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Lightness",
    });
    COLOR.addBinding(CONFIG, "chroma", {
      min: 0,
      max: 3,
      step: 0.1,
      label: "Chroma",
    });
    COLOR.addBinding(CONFIG, "hueBase", {
      min: 0,
      max: 360,
      step: 1,
      label: "Hue Base",
    });
    const LIMIT = COLOR.addBinding(CONFIG, "hueDestination", {
      min: 0,
      max: 360,
      step: 1,
      label: "Hue Limit",
    });
    LIMIT.disabled = true;

    pane.on("change", UPDATE);
  };

  useEffect(() => {
    const pane = new Pane({ title: "Config", expanded: false });

    pane.hidden =
      process.env.NEXT_PUBLIC_APP_ENV !== "production" ? false : true;

    pane.addBinding(CONFIG, "radius", {
      min: 0,
      max: 50,
      step: 1,
      label: "Radius",
    });
    pane.addBinding(CONFIG, "distance", {
      min: 5,
      max: 50,
      step: 1,
      label: "Distance (vmin)",
    });
    pane.addBinding(CONFIG, "speed", {
      min: 0.1,
      max: 10,
      step: 0.1,
      label: "Speed (s)",
    });
    pane.addBinding(CONFIG, "alternate", { label: "Alternate" });
    pane.addBinding(CONFIG, "scale", { label: "Animate Scale" });

    const COLOR = pane.addFolder({ title: "Color" });
    COLOR.addBinding(CONFIG, "hue", { label: "Animate Hue" });
    COLOR.addBinding(CONFIG, "lightness", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Lightness",
    });
    COLOR.addBinding(CONFIG, "chroma", {
      min: 0,
      max: 3,
      step: 0.1,
      label: "Chroma",
    });
    COLOR.addBinding(CONFIG, "hueBase", {
      min: 0,
      max: 360,
      step: 1,
      label: "Hue Base",
    });
    const LIMIT = COLOR.addBinding(CONFIG, "hueDestination", {
      min: 0,
      max: 360,
      step: 1,
      label: "Hue Limit",
    });
    LIMIT.disabled = true;

    pane.on("change", UPDATE);

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
