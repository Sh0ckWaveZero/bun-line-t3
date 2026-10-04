import { createFileRoute } from "@tanstack/react-router";
import { validateThaiID, formatThaiID } from "@/lib/utils/thai-id-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return Response.json(
        { error: "ID is required and must be a string" },
        { status: 400 },
      );
    }

    const isValid = validateThaiID(id);
    let formattedId = id;

    try {
      const cleanId = id.replace(/[-\s]/g, "");
      if (cleanId.length === 13) {
        formattedId = formatThaiID(cleanId);
      }
    } catch {
      formattedId = id;
    }

    return Response.json({
      id: formattedId,
      isValid,
      message: isValid
        ? "เลขบัตรประชาชนถูกต้องตาม Check Digit Algorithm"
        : "เลขบัตรประชาชนไม่ถูกต้อง",
    });
  } catch (error) {
    console.error("Error validating Thai ID:", error);
    return Response.json(
      { error: "Failed to validate Thai ID" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/thai-id/validate")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
