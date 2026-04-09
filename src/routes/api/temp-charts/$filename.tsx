import { createFileRoute } from "@tanstack/react-router";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;

    // Security: Only allow PNG files
    if (!filename.endsWith(".png")) {
      return Response.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Security: Prevent directory traversal
    const safePath = path.basename(filename);
    const filePath = path.join(
      process.cwd(),
      "public",
      "temp-charts",
      safePath,
    );

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    // Read and serve file
    const imageBuffer = await fs.readFile(filePath);

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error serving temp chart:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/temp-charts/$filename")({
  server: {
    handlers: {
      GET: ({ params, request }) =>
        GET(request, {
          params: Promise.resolve({ filename: params.filename }),
        }),
    },
  },
});
