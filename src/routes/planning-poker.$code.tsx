import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/constants/site";
import { PlanningPokerRoomPage } from "@/features/planning-poker/pages/PlanningPokerRoomPage";

export const Route = createFileRoute("/planning-poker/$code")({
  component: PlanningPokerRoomPage,
  head: ({ params }) => {
    // ทำความสะอาดรหัสก่อนยัดลง meta (รูปแบบเดียวกับห้องจริง)
    const code = (params.code ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    const title = `Planning Poker · ${code}`;
    const description = `Room ${code} is estimating story points — join with the code, vote in secret, reveal at once. No sign-in needed.`;
    const image = absoluteUrl("/og-poker.png");
    const url = absoluteUrl(`/planning-poker/${code}`);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "Bun LINE T3" },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        {
          property: "og:image:alt",
          content: "Pixel dice, a hidden card, and score cards 3 5 8 13 ?",
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        {
          name: "twitter:image:alt",
          content: "Pixel dice, a hidden card, and score cards 3 5 8 13 ?",
        },
        { name: "theme-color", content: "#8a79ab" },
      ],
    };
  },
});
