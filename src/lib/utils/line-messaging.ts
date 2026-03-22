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

  try {
    const response = await fetch(`${env.LINE_MESSAGING_API}/push`, {
      method: "POST",
      headers: lineHeader,
      body: JSON.stringify({
        to: userId,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to send push message: ${response.status} ${errorBody}`,
      );
    }

    return response;
  } catch (err: any) {
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

  const allowedPattern = /^[a-zA-Z0-9_-]+$/;
  const baseName = filename.replace(/\.[^.]*$/, "");

  if (!baseName || !allowedPattern.test(baseName) || baseName.length > 50) {
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
  try {
    new URL(baseUrl);
    return baseUrl;
  } catch {
    return "https://line-login.midseelee.com";
  }
}

/**
 * Processes image buffer to create original and preview versions
 * @param imageBuffer Original image buffer
 * @returns Promise<ProcessedImage> Processed image buffers
 */
async function processImageBuffers(
  imageBuffer: Buffer,
): Promise<ProcessedImage> {
  let previewBuffer = imageBuffer;

  try {
    const sharp = (await import("sharp")).default;
    previewBuffer = await sharp(imageBuffer)
      .resize(400, 400, {
        fit: "inside",
        kernel: sharp.kernel.lanczos3,
      })
      .png({
        quality: 85,
        compressionLevel: 6,
        progressive: true,
      })
      .toBuffer();
  } catch {
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

  await fs.mkdir(publicDir, { recursive: true });

  await fs.writeFile(fileInfo.originalPath, processedImages.originalBuffer);
  await fs.writeFile(fileInfo.previewPath, processedImages.previewBuffer);

  await fs.access(fileInfo.originalPath);
  await fs.access(fileInfo.previewPath);

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

export async function uploadImageToTemporaryHost(
  imageBuffer: Buffer,
  filename?: string,
): Promise<UploadResult> {
  try {
    const fileInfo = generateFileInfo(filename);
    const processedImages = await processImageBuffers(imageBuffer);
    await saveImageFiles(processedImages, fileInfo);
    const urls = generateImageUrls(fileInfo);

    return urls;
  } catch (error) {
    throw new Error(
      `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
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
    if (filename && typeof filename !== "string") {
      throw new Error("Invalid filename parameter");
    }

    const { originalUrl, previewUrl } = await uploadImageToTemporaryHost(
      chartBuffer,
      filename,
    );

    const fetchOptions = {
      method: "HEAD" as const,
      headers: {
        "User-Agent": "LINE-Bot-SDK",
      },
    };

    try {
      const testOriginal = await fetch(originalUrl, fetchOptions);
      const testPreview = await fetch(previewUrl, fetchOptions);

      if (!testOriginal.ok || !testPreview.ok) {
        throw new Error("Image not accessible");
      }
    } catch {
      // Continue even if verification fails
    }

    return await sendImageMessage(userId, originalUrl, previewUrl);
  } catch (error) {
    throw error;
  }
}
