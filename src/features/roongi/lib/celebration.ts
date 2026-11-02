import type { EffectName } from "@react-cards-opening/effects";

interface CelebrationProfile {
  minimum: number;
  effects: EffectName[];
  tone: string;
  size: number;
}

const profiles: CelebrationProfile[] = [
  {
    minimum: 6_000_000,
    effects: ["fireworks", "confetti", "coins", "stardust"],
    tone: "#fbbf24",
    size: 360,
  },
  {
    minimum: 200_000,
    effects: ["fireworks", "coins", "stardust"],
    tone: "#fbbf24",
    size: 320,
  },
  {
    minimum: 100_000,
    effects: ["fireworks", "confetti", "glitter"],
    tone: "#fbbf24",
    size: 300,
  },
  {
    minimum: 80_000,
    effects: ["starburst", "coins", "glitter"],
    tone: "#c084fc",
    size: 280,
  },
  {
    minimum: 40_000,
    effects: ["confetti", "starburst", "stardust"],
    tone: "#c084fc",
    size: 260,
  },
  {
    minimum: 20_000,
    effects: ["confetti", "glitter", "sparks"],
    tone: "#60a5fa",
    size: 240,
  },
  {
    minimum: 4_000,
    effects: ["confetti", "glitter"],
    tone: "#60a5fa",
    size: 220,
  },
  { minimum: 0, effects: ["confetti", "sparks"], tone: "#c084fc", size: 200 },
];

export function getCelebrationProfile(prize: number): CelebrationProfile {
  return (
    profiles.find((profile) => prize >= profile.minimum) ??
    profiles[profiles.length - 1]!
  );
}
