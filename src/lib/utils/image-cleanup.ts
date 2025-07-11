import { promises as fs } from "fs";
import path from "path";

/**
 * Clean up temporary chart images older than specified minutes
 * @param maxAgeMinutes Maximum age in minutes (default: 60 minutes)
 */
export async function cleanupTemporaryImages(
  maxAgeMinutes: number = 60,
): Promise<void> {
  try {
    const tempDir = path.join(process.cwd(), "public", "temp-charts");
    const files = await fs.readdir(tempDir);

    const now = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

    for (const file of files) {
      // Skip .gitkeep file
      if (file === ".gitkeep") continue;

      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);

      // Check if file is older than max age
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        console.log(`Cleaned up temporary chart: ${file}`);
      }
    }
  } catch (error) {
    console.error("Error cleaning up temporary images:", error);
  }
}

/**
 * Schedule automatic cleanup of temporary images
 * Runs every hour to clean up files older than 2 hours
 */
export function scheduleImageCleanup(): void {
  // Run cleanup immediately
  cleanupTemporaryImages(120); // 2 hours

  // Schedule cleanup every hour
  setInterval(
    () => {
      cleanupTemporaryImages(120);
    },
    60 * 60 * 1000,
  ); // Every hour

  console.log("Image cleanup scheduler started");
}

/**
 * Delete a specific temporary image
 * @param filename The filename to delete
 */
export async function deleteTemporaryImage(filename: string): Promise<void> {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "temp-charts",
      filename,
    );
    await fs.unlink(filePath);
    console.log(`Deleted temporary chart: ${filename}`);
  } catch (error) {
    console.error(`Error deleting temporary image ${filename}:`, error);
  }
}
