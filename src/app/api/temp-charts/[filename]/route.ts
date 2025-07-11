import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;

    // Security: Only allow PNG files
    if (!filename.endsWith(".png")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
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
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read and serve file
    const imageBuffer = await fs.readFile(filePath);

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error serving temp chart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
