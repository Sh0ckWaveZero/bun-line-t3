import { createFileRoute } from "@tanstack/react-router";
import {
  generateFormattedThaiID,
  generateMultipleThaiIDs,
} from "@/lib/utils/thai-id-generator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get("count") || "1");

  // Validate count
  if (count < 1 || count > 20) {
    return Response.json(
      { error: "Count must be between 1 and 20" },
      { status: 400 },
    );
  }

  try {
    if (count === 1) {
      const id = generateFormattedThaiID();
      return Response.json({ id });
    } else {
      const ids = generateMultipleThaiIDs(count);
      return Response.json({ ids });
    }
  } catch (error) {
    console.error("Error generating Thai ID:", error);
    return Response.json(
      { error: "Failed to generate Thai ID" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/thai-id/generate")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
