import { promises as fs } from "fs";
import path from "path";

/**
 * Clean up temporary chart images older than specified minutes
 * @param maxAgeMinutes Maximum age in minutes (default: 60 minutes)
 * @returns Promise<{cleaned: number, errors: number}> Cleanup statistics
 */
export async function cleanupTemporaryImages(
  maxAgeMinutes: number = 60,
): Promise<{ cleaned: number; errors: number; totalFiles: number }> {
  const tempDir = path.join(process.cwd(), "public", "temp-charts");
  let cleaned = 0;
  let errors = 0;
  let totalFiles = 0;

  try {
    await fs.mkdir(tempDir, { recursive: true });

    const files = await fs.readdir(tempDir);
    totalFiles = files.length;

    const now = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000;

    for (const file of files) {
      if (file === ".gitkeep") {
        continue;
      }

      try {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtime.getTime();

        if (fileAge > maxAge) {
          await fs.unlink(filePath);
          cleaned++;
        }
      } catch {
        errors++;
      }
    }

    return { cleaned, errors, totalFiles };
  } catch {
    return { cleaned, errors: errors + 1, totalFiles };
  }
}

export function scheduleImageCleanup(): void {
  cleanupTemporaryImages(120);

  setInterval(
    () => {
      cleanupTemporaryImages(120);
    },
    60 * 60 * 1000,
  );
}

export async function deleteTemporaryImage(filename: string): Promise<void> {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "temp-charts",
      filename,
    );
    await fs.unlink(filePath);
  } catch {
    // Silently fail
  }
}
