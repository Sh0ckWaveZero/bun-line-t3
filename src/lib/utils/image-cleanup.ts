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
    // Ensure directory exists
    await fs.mkdir(tempDir, { recursive: true });
    
    const files = await fs.readdir(tempDir);
    totalFiles = files.length;

    console.log(`🧹 Starting image cleanup - Found ${totalFiles} files in temp-charts`);
    console.log(`🕐 Cleaning files older than ${maxAgeMinutes} minutes`);

    const now = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

    for (const file of files) {
      // Skip .gitkeep file
      if (file === ".gitkeep") {
        console.log(`⏭️ Skipping .gitkeep file`);
        continue;
      }

      try {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtime.getTime();
        const fileAgeMinutes = Math.floor(fileAge / (60 * 1000));

        console.log(`📁 File: ${file} - Age: ${fileAgeMinutes} minutes`);

        // Check if file is older than max age
        if (fileAge > maxAge) {
          await fs.unlink(filePath);
          cleaned++;
          console.log(`✅ Cleaned up temporary chart: ${file} (${fileAgeMinutes} minutes old)`);
        } else {
          console.log(`⏳ Keeping file: ${file} (only ${fileAgeMinutes} minutes old)`);
        }
      } catch (fileError) {
        errors++;
        console.error(`❌ Error processing file ${file}:`, fileError);
      }
    }

    console.log(`🧹 Cleanup completed - Cleaned: ${cleaned}, Errors: ${errors}, Total: ${totalFiles}`);
    return { cleaned, errors, totalFiles };
  } catch (error) {
    console.error("❌ Error accessing temp-charts directory:", error);
    return { cleaned, errors: errors + 1, totalFiles };
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
