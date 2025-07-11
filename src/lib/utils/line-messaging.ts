import { env } from "@/env.mjs";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { validateUrl } from "@/lib/security/url-validator";

// Types for LINE messaging
interface LineMessage {
  type: string;
  [key: string]: any;
}

interface FlexCarouselMessage {
  type: "flex";
  altText: string;
  contents: {
    type: "carousel";
    contents: any[];
  };
}

interface ImageMessage {
  type: "image";
  originalContentUrl: string;
  previewImageUrl: string;
}

interface UploadResult {
  originalUrl: string;
  previewUrl: string;
}

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
  const validation = validateUrl(baseUrl);

  if (!validation.isValid) {
    console.warn(
      `🚨 Security: Invalid base URL "${baseUrl}" replaced with safe fallback`,
    );
    return "https://localhost:4325"; // Safe fallback
  }

  return baseUrl;
}

export async function uploadImageToTemporaryHost(
  imageBuffer: Buffer,
  filename?: string,
): Promise<UploadResult> {
  // Sanitize filename input to prevent path traversal and injection
  const sanitizedBaseName = sanitizeFilename(filename);

  // Generate unique filename - always include timestamp and UUID
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  const safeFilename = `${sanitizedBaseName}-${timestamp}-${uniqueId}.png`;
  const previewFilename = `${sanitizedBaseName}-${timestamp}-${uniqueId}_preview.png`;

  // Create file paths
  const publicDir = path.join(process.cwd(), "public", "temp-charts");
  const filePath = path.join(publicDir, safeFilename);
  const previewPath = path.join(publicDir, previewFilename);

  // Ensure directory exists
  await fs.mkdir(publicDir, { recursive: true });

  // Create preview image (smaller size for better performance)
  let previewBuffer = imageBuffer;
  try {
    const { default: sharp } = await import("sharp");
    previewBuffer = await sharp(imageBuffer)
      .resize(400, 400, {
        fit: "inside",
        kernel: sharp.kernel.lanczos3, // Better scaling
      })
      .png({
        quality: 85,
        compressionLevel: 6,
        progressive: true,
      })
      .toBuffer();
    console.log("📱 Preview image created:", previewBuffer.length, "bytes");
  } catch {
    console.warn("⚠️ Sharp not available, using original as preview");
    previewBuffer = imageBuffer;
  }

  // Save both images
  await fs.writeFile(filePath, imageBuffer);
  await fs.writeFile(previewPath, previewBuffer);

  // Verify files are fully written before proceeding
  await fs.access(filePath);
  await fs.access(previewPath);
  console.log("✅ Both image files verified as accessible");

  // Add small delay to ensure file system sync
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Return public URLs via API route - LINE requires HTTPS and accessible domain
  // Validate base URL to prevent SSRF attacks
  const rawBaseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.FRONTEND_URL ||
    "https://localhost:4325";
  const baseUrl = validateBaseUrl(rawBaseUrl);

  // Construct URLs with validated base URL and sanitized filenames
  const originalUrl = `${baseUrl}/api/temp-charts/${safeFilename}`;
  const previewUrl = `${baseUrl}/api/temp-charts/${previewFilename}`;

  // Additional validation of constructed URLs
  const originalUrlValidation = validateUrl(originalUrl);
  const previewUrlValidation = validateUrl(previewUrl);

  if (!originalUrlValidation.isValid || !previewUrlValidation.isValid) {
    console.error(`🚨 Security: Constructed URLs failed validation`);
    console.error(
      `Original URL: ${originalUrl} - Valid: ${originalUrlValidation.isValid}`,
    );
    console.error(
      `Preview URL: ${previewUrl} - Valid: ${previewUrlValidation.isValid}`,
    );
    throw new Error("Failed to generate secure URLs for image upload");
  }

  console.log("📂 Original image saved to:", filePath);
  console.log("📂 Preview image saved to:", previewPath);
  console.log("🌐 Original URL:", originalUrl);
  console.log("🌐 Preview URL:", previewUrl);
  console.log("📏 Original size:", imageBuffer.length, "bytes");
  console.log("📏 Preview size:", previewBuffer.length, "bytes");
  console.log(
    "🔐 URL protocol:",
    originalUrl.startsWith("https")
      ? "HTTPS ✅"
      : "HTTP ❌ (LINE requires HTTPS)",
  );
  console.log(
    "🌍 Domain accessible:",
    originalUrl.includes("localhost")
      ? "Local ❌ (LINE cannot access localhost)"
      : "Public ✅",
  );
  console.log(
    "📋 LINE compliant:",
    imageBuffer.length < 10 * 1024 * 1024 ? "Size ✅" : "Size ❌ (>10MB)",
  );

  return { originalUrl, previewUrl };
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

    // Verify images are accessible
    const testOriginal = await fetch(originalUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": "LINE-Bot-SDK",
      },
    });
    const testPreview = await fetch(previewUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": "LINE-Bot-SDK",
      },
    });
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
