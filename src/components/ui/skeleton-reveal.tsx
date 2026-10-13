"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const SKELETON_REMOVE_DELAY_MS = 450;

interface SkeletonRevealProps {
  isReady: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SkeletonReveal({
  isReady,
  skeleton,
  children,
  className,
}: SkeletonRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wasReadyRef = useRef(isReady);
  const [skeletonDismissed, setSkeletonDismissed] = useState(isReady);

  useEffect(() => {
    if (!isReady) {
      setSkeletonDismissed(false);
      return;
    }

    if (skeletonDismissed) return;

    const timer = window.setTimeout(
      () => setSkeletonDismissed(true),
      SKELETON_REMOVE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [isReady, skeletonDismissed]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!isReady && wasReadyRef.current && root) {
      root.classList.add("is-resetting");
      const frame = window.requestAnimationFrame(() => {
        void root.offsetWidth;
        root.classList.remove("is-resetting");
      });
      wasReadyRef.current = isReady;
      return () => window.cancelAnimationFrame(frame);
    }

    wasReadyRef.current = isReady;
  }, [isReady]);

  const skeletonMounted = !isReady || !skeletonDismissed;
  const contentIsInteractive = isReady && skeletonDismissed;

  return (
    <div
      ref={rootRef}
      className={cn("t-skel", isReady && "is-revealed", className)}
      data-state={isReady ? "ready" : "loading"}
      aria-busy={!isReady}
    >
      {skeletonMounted && (
        <div className="t-skel-skeleton is-pulsing" aria-hidden="true" inert>
          {skeleton}
        </div>
      )}
      <div
        className="t-skel-content"
        aria-hidden={!isReady}
        inert={!contentIsInteractive}
      >
        {children}
      </div>
    </div>
  );
}
