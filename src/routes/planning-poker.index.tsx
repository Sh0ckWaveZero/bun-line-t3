import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/constants/site";
import { PlanningPokerPage } from "@/features/planning-poker/pages/PlanningPokerPage";

/** social meta ครบทุกเจ้า (OG = Facebook/LINE/Teams, twitter = X, theme-color = Discord stripe) */
const POKER_META = {
  title: "Planning Poker — Point together",
  description:
    "Estimate story points together in real time — hidden votes, revealed all at once. No sign-in needed.",
} as const;

export const Route = createFileRoute("/planning-poker/")({
  component: PlanningPokerPage,
  head: () => ({
    meta: [
      { title: POKER_META.title },
      { name: "description", content: POKER_META.description },
      { property: "og:title", content: POKER_META.title },
      { property: "og:description", content: POKER_META.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/planning-poker") },
      { property: "og:site_name", content: "Bun LINE T3" },
      { property: "og:image", content: absoluteUrl("/og-poker.png") },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Pixel dice, a hidden card, and score cards 3 5 8 13 ?",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: POKER_META.title },
      { name: "twitter:description", content: POKER_META.description },
      { name: "twitter:image", content: absoluteUrl("/og-poker.png") },
      {
        name: "twitter:image:alt",
        content: "Pixel dice, a hidden card, and score cards 3 5 8 13 ?",
      },
      // Discord ใช้ theme-color เป็นแถบสีขอบ embed
      { name: "theme-color", content: "#8a79ab" },
    ],
  }),
});
