import { PngConversionOptions, ChartGenerationResult } from "./chart-types";

/**
 * Shared SVG to PNG converter utility class
 * Handles conversion with consistent settings across all chart generators
 */
export class SvgConverter {
  private static instance: SvgConverter;

  // Default conversion options
  private static readonly DEFAULT_OPTIONS: PngConversionOptions = {
    quality: 90,
    compressionLevel: 6,
    density: 150,
    progressive: false,
    palette: false,
    resize: {
      width: 1040,
      height: 1040,
      fit: "contain",
    },
    background: {
      r: 26,
      g: 26,
      b: 26,
      alpha: 1,
    },
  };

  // LINE imagemap compliant dimensions
  private static readonly LINE_COMPATIBLE_WIDTHS = [240, 300, 460, 700, 1040];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): SvgConverter {
    if (!SvgConverter.instance) {
      SvgConverter.instance = new SvgConverter();
    }
    return SvgConverter.instance;
  }

  /**
   * Convert SVG string to PNG buffer with LINE-compliant dimensions
   */
  async convertSvgToPng(
    svgString: string,
    options: Partial<PngConversionOptions> = {},
  ): Promise<ChartGenerationResult> {
    try {
      const mergedOptions = { ...SvgConverter.DEFAULT_OPTIONS, ...options };

      // Validate SVG input
      const cleanSvg = this.cleanSvgString(svgString);
      if (!cleanSvg) {
        throw new Error("Invalid or empty SVG string");
      }

      console.log("🔧 Starting SVG to PNG conversion");
      console.log("📏 SVG string length:", cleanSvg.length);

      // Import sharp dynamically
      const sharp = await this.importSharp();

      // Create base sharp instance
      let sharpInstance = sharp(Buffer.from(cleanSvg), {
        density: mergedOptions.density,
      });

      // Apply PNG options
      sharpInstance = sharpInstance.png({
        quality: mergedOptions.quality,
        compressionLevel: mergedOptions.compressionLevel,
        palette: mergedOptions.palette,
        progressive: mergedOptions.progressive,
      });

      // Apply resize options if specified
      if (mergedOptions.resize) {
        sharpInstance = sharpInstance.resize(
          mergedOptions.resize.width,
          mergedOptions.resize.height,
          {
            fit: mergedOptions.resize.fit || "contain",
            withoutEnlargement: false,
            background: mergedOptions.background,
          },
        );
      }

      // Convert to buffer
      const pngBuffer = await sharpInstance.toBuffer();

      // Validate file size for LINE compatibility
      if (pngBuffer.length > SvgConverter.MAX_FILE_SIZE) {
        console.warn(
          `⚠️ PNG file size (${pngBuffer.length} bytes) exceeds LINE limit (${SvgConverter.MAX_FILE_SIZE} bytes)`,
        );
      }

      console.log("✅ PNG conversion successful");
      console.log("📊 Buffer length:", pngBuffer.length);
      console.log(
        "📐 Dimensions:",
        `${mergedOptions.resize?.width}x${mergedOptions.resize?.height}`,
      );

      return {
        data: pngBuffer,
        format: "png",
        dimensions: {
          width: mergedOptions.resize?.width || 1040,
          height: mergedOptions.resize?.height || 1040,
        },
      };
    } catch (error) {
      console.error("❌ SVG to PNG conversion failed:", error);
      return this.handleConversionError(svgString, error);
    }
  }

  /**
   * Convert SVG with fallback strategies
   */
  async convertSvgToPngWithFallback(
    svgString: string,
    options: Partial<PngConversionOptions> = {},
  ): Promise<ChartGenerationResult> {
    try {
      // Try primary conversion
      return await this.convertSvgToPng(svgString, options);
    } catch {
      console.warn("🔄 Primary conversion failed, trying fallback methods");

      // Try simplified conversion
      try {
        return await this.convertSvgToPngSimplified(svgString);
      } catch {
        console.error("❌ All conversion methods failed");
        return this.returnSvgAsFallback(svgString);
      }
    }
  }

  /**
   * Convert SVG to LINE-compliant dimensions
   */
  async convertForLineMessaging(
    svgString: string,
    preferredWidth: number = 1040,
  ): Promise<ChartGenerationResult> {
    // Ensure width is LINE-compatible
    const validWidth = this.getNearestLineCompatibleWidth(preferredWidth);

    return this.convertSvgToPng(svgString, {
      resize: {
        width: validWidth,
        height: validWidth, // Keep square aspect ratio
        fit: "contain",
      },
    });
  }

  /**
   * Get metadata about the conversion capabilities
   */
  async getConversionCapabilities(): Promise<{
    sharpAvailable: boolean;
    supportedFormats: string[];
    maxFileSize: number;
    lineCompatibleWidths: number[];
  }> {
    try {
      await this.importSharp();
      return {
        sharpAvailable: true,
        supportedFormats: ["png", "svg"],
        maxFileSize: SvgConverter.MAX_FILE_SIZE,
        lineCompatibleWidths: [...SvgConverter.LINE_COMPATIBLE_WIDTHS],
      };
    } catch {
      return {
        sharpAvailable: false,
        supportedFormats: ["svg"],
        maxFileSize: SvgConverter.MAX_FILE_SIZE,
        lineCompatibleWidths: [...SvgConverter.LINE_COMPATIBLE_WIDTHS],
      };
    }
  }

  /**
   * Private helper methods
   */

  private async importSharp() {
    try {
      const sharp = await import("sharp");
      return sharp.default;
    } catch {
      console.error("❌ Failed to import sharp");
      throw new Error("Sharp library not available for image conversion");
    }
  }

  private cleanSvgString(svgString: string): string {
    if (!svgString || typeof svgString !== "string") {
      return "";
    }

    // Remove leading/trailing whitespace
    const cleaned = svgString.trim();

    // Ensure it starts with SVG tag
    if (!cleaned.startsWith("<svg")) {
      throw new Error("Invalid SVG: must start with <svg> tag");
    }

    // Basic validation
    if (!cleaned.includes("</svg>")) {
      throw new Error("Invalid SVG: missing closing </svg> tag");
    }

    return cleaned;
  }

  private async convertSvgToPngSimplified(
    svgString: string,
  ): Promise<ChartGenerationResult> {
    console.log("🔄 Trying simplified Sharp conversion...");

    const sharp = await this.importSharp();
    const cleanSvg = this.cleanSvgString(svgString);

    const pngBuffer = await sharp(Buffer.from(cleanSvg)).png().toBuffer();

    console.log(
      "✅ Simplified conversion successful, buffer length:",
      pngBuffer.length,
    );

    return {
      data: pngBuffer,
      format: "png",
      dimensions: {
        width: 1040,
        height: 1040,
      },
    };
  }

  private handleConversionError(
    svgString: string,
    error: any,
  ): ChartGenerationResult {
    console.error("❌ Conversion error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return this.returnSvgAsFallback(svgString);
  }

  private returnSvgAsFallback(svgString: string): ChartGenerationResult {
    console.warn("⚠️ Returning SVG as fallback");

    return {
      data: Buffer.from(svgString),
      format: "svg",
      dimensions: {
        width: 1040,
        height: 1040,
      },
    };
  }

  private getNearestLineCompatibleWidth(preferredWidth: number): number {
    // Find the closest LINE-compatible width
    return SvgConverter.LINE_COMPATIBLE_WIDTHS.reduce((closest, width) => {
      return Math.abs(width - preferredWidth) <
        Math.abs(closest - preferredWidth)
        ? width
        : closest;
    });
  }
}

// Export singleton instance
export const svgConverter = SvgConverter.getInstance();
