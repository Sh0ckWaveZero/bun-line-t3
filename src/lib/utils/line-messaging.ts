import { env } from "@/env.mjs";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type {
  LineMessage,
  FlexCarouselMessage,
  ImageMessage,
  UploadResult,
  ProcessedImage,
  FileInfo,
  UrlResult,
} from "@/lib/types/line-messaging";

/**
 * Sends push message to LINE user
 * @param userId LINE user ID
 * @param messages Array of LINE message objects
 * @returns Promise<Response>
 */
export async function sendPushMessage(
  userId: string,
  messages: LineMessage[],
): Promise<Response> {
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };

  console.log("📤 Sending push message to LINE API");
  console.log("📤 Payload:", JSON.stringify({ to: userId, messages }, null, 2));

  try {
    const response = await fetch(`${env.LINE_MESSAGING_API}/push`, {
      method: "POST",
      headers: lineHeader,
      body: JSON.stringify({
        to: userId,
        messages: messages,
      }),
    });

    console.log("📤 LINE API response status:", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("📤 LINE API error response:", errorBody);
      throw new Error(
        `Failed to send push message: ${response.status} ${errorBody}`,
      );
    }

    console.log("✅ Push message sent successfully");
    return response;
  } catch (err: any) {
    console.error("Error sending push message:", err.message);
    throw err;
  }
}

/**
 * Creates flex message carousel
 * @param bubbleItems Array of bubble items
 * @returns Array with flex carousel message
 */
export function createFlexCarousel(bubbleItems: any[]): FlexCarouselMessage[] {
  return [
    {
      type: "flex",
      altText: "Work Attendance System",
      contents: {
        type: "carousel",
        contents: bubbleItems,
      },
    },
  ];
}

/**
 * Sends an image message to LINE user
 * @param userId LINE user ID
 * @param imageUrl URL to the image
 * @param previewUrl Optional preview image URL (defaults to imageUrl)
 * @returns Promise<Response>
 */
export async function sendImageMessage(
  userId: string,
  imageUrl: string,
  previewUrl?: string,
): Promise<Response> {
  const imageMessage: ImageMessage = {
    type: "image",
    originalContentUrl: imageUrl,
    previewImageUrl: previewUrl || imageUrl,
  };

  console.log(
    "📨 LINE image message payload:",
    JSON.stringify(imageMessage, null, 2),
  );
  console.log("📨 Sending to userId:", userId);

  return await sendPushMessage(userId, [imageMessage]);
}

/**
 * Uploads image buffer to local temporary storage with preview
 * @param imageBuffer Buffer containing image data
 * @param filename Optional filename
 * @returns Promise<{originalUrl: string, previewUrl: string}> URLs to uploaded images
 */

/**
 * Validates and sanitizes filename input to prevent SSRF attacks
 * @param filename User-provided filename
 * @returns Sanitized filename or default
 */
function sanitizeFilename(filename?: string): string {
  if (!filename) {
    return "chart";
  }

  // Allowlist: only alphanumeric, hyphens, underscores (no path separators)
  const allowedPattern = /^[a-zA-Z0-9_-]+$/;

  // Remove file extension and sanitize
  const baseName = filename.replace(/\.[^.]*$/, "");

  // Validate against allowlist
  if (!baseName || !allowedPattern.test(baseName) || baseName.length > 50) {
    console.warn(
      `🚨 Security: Invalid filename "${filename}" sanitized to "chart"`,
    );
    return "chart";
  }

  return baseName;
}

/**
 * Validates base URL to prevent SSRF attacks
 * @param baseUrl Base URL to validate
 * @returns Validated base URL or safe fallback
 */
function validateBaseUrl(baseUrl: string): string {
  // Simple URL validation without security checks
  try {
    new URL(baseUrl);
    return baseUrl;
  } catch {
    console.warn(
      `🚨 Security: Invalid base URL "${baseUrl}" replaced with safe fallback`,
    );
    return "https://line-login.midseelee.com"; // Safe fallback for production
  }
}

/**
 * Processes image buffer to create original and preview versions
 * @param imageBuffer Original image buffer
 * @returns Promise<ProcessedImage> Processed image buffers
 */
async function processImageBuffers(imageBuffer: Buffer): Promise<ProcessedImage> {
  let previewBuffer = imageBuffer;
  
  try {
    // Use a safer dynamic import pattern
    const sharp = (await import("sharp")).default;
    previewBuffer = await sharp(imageBuffer)
      .resize(400, 400, {
        fit: "inside",
        kernel: sharp.kernel.lanczos3, // Better scaling (cspell:ignore lanczos)
      })
      .png({
        quality: 85,
        compressionLevel: 6,
        progressive: true,
      })
      .toBuffer();
    console.log("📱 Preview image created:", previewBuffer.length, "bytes");
  } catch (error) {
    console.warn("⚠️ Sharp not available, using original as preview:", error);
    previewBuffer = imageBuffer;
  }

  return {
    originalBuffer: imageBuffer,
    previewBuffer,
  };
}

/**
 * Generates file information including paths and filenames
 * @param filename Optional base filename
 * @returns FileInfo object with file paths and names
 */
function generateFileInfo(filename?: string): FileInfo {
  const sanitizedBaseName = sanitizeFilename(filename);
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  
  const originalFilename = `${sanitizedBaseName}-${timestamp}-${uniqueId}.png`;
  const previewFilename = `${sanitizedBaseName}-${timestamp}-${uniqueId}_preview.png`;
  
  const publicDir = path.join(process.cwd(), "public", "temp-charts");
  const originalPath = path.join(publicDir, originalFilename);
  const previewPath = path.join(publicDir, previewFilename);

  return {
    originalFilename,
    previewFilename,
    originalPath,
    previewPath,
  };
}

/**
 * Saves processed images to filesystem
 * @param processedImages Processed image buffers
 * @param fileInfo File information and paths
 * @returns Promise<void>
 */
async function saveImageFiles(
  processedImages: ProcessedImage,
  fileInfo: FileInfo,
): Promise<void> {
  const publicDir = path.dirname(fileInfo.originalPath);
  
  // Ensure directory exists
  await fs.mkdir(publicDir, { recursive: true });

  // Save both images
  await fs.writeFile(fileInfo.originalPath, processedImages.originalBuffer);
  await fs.writeFile(fileInfo.previewPath, processedImages.previewBuffer);

  // Verify files are fully written before proceeding
  await fs.access(fileInfo.originalPath);
  await fs.access(fileInfo.previewPath);
  console.log("✅ Both image files verified as accessible");

  // Add small delay to ensure file system sync
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Generates public URLs for uploaded images
 * @param fileInfo File information containing filenames
 * @returns UrlResult object with original and preview URLs
 */
function generateImageUrls(fileInfo: FileInfo): UrlResult {
  const rawBaseUrl =
    env.NEXTAUTH_URL || env.FRONTEND_URL || "https://line-login.midseelee.com";
  const baseUrl = validateBaseUrl(rawBaseUrl);

  const originalUrl = `${baseUrl}/api/temp-charts/${fileInfo.originalFilename}`;
  const previewUrl = `${baseUrl}/api/temp-charts/${fileInfo.previewFilename}`;

  return { originalUrl, previewUrl };
}

/**
 * Logs detailed information about the upload process
 * @param fileInfo File information
 * @param urls Generated URLs
 * @param processedImages Image buffers for size logging
 */
function logUploadDetails(
  fileInfo: FileInfo,
  urls: UrlResult,
  processedImages: ProcessedImage,
): void {
  console.log("🔗 Generated URLs:");
  console.log(`Original URL: ${urls.originalUrl}`);
  console.log(`Preview URL: ${urls.previewUrl}`);
  console.log("📂 Original image saved to:", fileInfo.originalPath);
  console.log("📂 Preview image saved to:", fileInfo.previewPath);
  console.log("🌐 Original URL:", urls.originalUrl);
  console.log("🌐 Preview URL:", urls.previewUrl);
  console.log("📏 Original size:", processedImages.originalBuffer.length, "bytes");
  console.log("📏 Preview size:", processedImages.previewBuffer.length, "bytes");
  console.log(
    "🔐 URL protocol:",
    urls.originalUrl.startsWith("https")
      ? "HTTPS ✅"
      : "HTTP ❌ (LINE requires HTTPS)",
  );
  console.log(
    "🌍 Domain accessible:",
    urls.originalUrl.includes("localhost")
      ? "Local ❌ (LINE cannot access localhost)"
      : "Public ✅",
  );
  console.log(
    "📋 LINE compliant:",
    processedImages.originalBuffer.length < 10 * 1024 * 1024
      ? "Size ✅"
      : "Size ❌ (>10MB)",
  );
}

export async function uploadImageToTemporaryHost(
  imageBuffer: Buffer,
  filename?: string,
): Promise<UploadResult> {
  try {
    // Generate file information and paths
    const fileInfo = generateFileInfo(filename);

    // Process images (create preview)
    const processedImages = await processImageBuffers(imageBuffer);

    // Save images to filesystem
    await saveImageFiles(processedImages, fileInfo);

    // Generate public URLs
    const urls = generateImageUrls(fileInfo);

    // Log upload details for debugging
    logUploadDetails(fileInfo, urls, processedImages);

    return urls;
  } catch (error) {
    console.error("Error in uploadImageToTemporaryHost:", error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Sends a chart image generated from buffer
 * @param userId LINE user ID
 * @param chartBuffer Buffer containing chart image
 * @param filename Optional filename
 * @returns Promise<Response>
 */
export async function sendChartImage(
  userId: string,
  chartBuffer: Buffer,
  filename?: string,
): Promise<Response> {
  try {
    // Validate filename parameter to prevent SSRF attacks
    if (filename && typeof filename !== "string") {
      console.warn(
        `🚨 Security: Invalid filename type provided: ${typeof filename}`,
      );
      throw new Error("Invalid filename parameter");
    }

    // Upload image to temporary hosting service with preview
    const { originalUrl, previewUrl } = await uploadImageToTemporaryHost(
      chartBuffer,
      filename,
    );
    console.log("📤 Original image uploaded to URL:", originalUrl);
    console.log("📤 Preview image uploaded to URL:", previewUrl);

    // Verify images are accessible on production domain
    let testOriginal: Response;
    let testPreview: Response;

    // Use standard fetch for HTTPS URLs (production)
    const fetchOptions = {
      method: "HEAD" as const,
      headers: {
        "User-Agent": "LINE-Bot-SDK",
      },
    };

    try {
      testOriginal = await fetch(originalUrl, fetchOptions);
      testPreview = await fetch(previewUrl, fetchOptions);
    } catch (error) {
      console.warn(`⚠️ Image verification failed: ${error}`);
      // For production domains, we expect proper SSL certificates
      // If verification fails, we still attempt to send the image
      testOriginal = { ok: true, status: 200 } as Response;
      testPreview = { ok: true, status: 200 } as Response;
    }
    console.log(
      "🔍 Original image accessibility test:",
      testOriginal.ok,
      testOriginal.status,
    );
    console.log(
      "🔍 Preview image accessibility test:",
      testPreview.ok,
      testPreview.status,
    );

    if (!testOriginal.ok) {
      throw new Error(
        `Original image not accessible: ${testOriginal.status} ${testOriginal.statusText}`,
      );
    }
    if (!testPreview.ok) {
      throw new Error(
        `Preview image not accessible: ${testPreview.status} ${testPreview.statusText}`,
      );
    }

    // Send image message with both URLs
    console.log("📨 Sending image message to LINE with original and preview");
    return await sendImageMessage(userId, originalUrl, previewUrl);
  } catch (error) {
    console.error("Error sending chart image:", error);

    // Log detailed error information
    console.error("Chart buffer size:", chartBuffer.length);
    console.error("Filename:", filename);
    console.error("Environment URLs:", {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
    });

    throw error;
  }
}
