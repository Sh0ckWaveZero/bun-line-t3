import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Local font loader utility
 * Loads font files from public/fonts/ and converts to base64 for SVG embedding
 */

interface FontCache {
  [key: string]: string;
}

class LocalFontLoader {
  private fontCache: FontCache = {};
  private fontsPath = join(process.cwd(), 'public', 'fonts');

  /**
   * Load and cache font file as base64
   */
  private loadFontBase64(filename: string): string {
    if (this.fontCache[filename]) {
      return this.fontCache[filename];
    }

    try {
      const fontPath = join(this.fontsPath, filename);
      const fontBuffer = readFileSync(fontPath);
      const base64 = fontBuffer.toString('base64');
      this.fontCache[filename] = base64;
      return base64;
    } catch (error) {
      console.warn(`Failed to load font ${filename}:`, error);
      return '';
    }
  }

  /**
   * Get Prompt font CSS for SVG embedding
   */
  getPromptFontCSS(): string {
    const regularBase64 = this.loadFontBase64('Prompt-Regular.ttf');
    const mediumBase64 = this.loadFontBase64('Prompt-Medium.ttf');
    const semiBoldBase64 = this.loadFontBase64('Prompt-SemiBold.ttf');

    if (!regularBase64) {
      console.warn('Could not load Prompt fonts, falling back to system fonts');
      return this.getFallbackFontCSS();
    }

    return `
      <style>
        <![CDATA[
          @font-face {
            font-family: 'PromptLocal';
            font-style: normal;
            font-weight: 400;
            src: url('data:font/ttf;base64,${regularBase64}');
          }
          @font-face {
            font-family: 'PromptLocal';
            font-style: normal;
            font-weight: 500;
            src: url('data:font/ttf;base64,${mediumBase64}');
          }
          @font-face {
            font-family: 'PromptLocal';
            font-style: normal;
            font-weight: 600;
            src: url('data:font/ttf;base64,${semiBoldBase64}');
          }
          
          .title { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 26px; 
            font-weight: 600; 
          }
          .axis { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 15px; 
            font-weight: 500; 
          }
          .stats { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 15px; 
            font-weight: 500; 
          }
          .label { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 13px; 
            font-weight: 400; 
          }
          .title-small { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 18px; 
            font-weight: 600; 
          }
          .axis-small { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 12px; 
            font-weight: 400; 
          }
        ]]>
      </style>
    `;
  }

  /**
   * Fallback CSS when fonts can't be loaded
   */
  private getFallbackFontCSS(): string {
    return `
      <style>
        <![CDATA[
          .title { font-family: sans-serif; font-size: 26px; font-weight: 600; }
          .axis { font-family: sans-serif; font-size: 15px; font-weight: 500; }
          .stats { font-family: sans-serif; font-size: 15px; font-weight: 500; }
          .label { font-family: sans-serif; font-size: 13px; font-weight: 400; }
          .title-small { font-family: sans-serif; font-size: 18px; font-weight: 600; }
          .axis-small { font-family: sans-serif; font-size: 12px; font-weight: 400; }
        ]]>
      </style>
    `;
  }

  /**
   * Check if fonts are available
   */
  areFontsAvailable(): boolean {
    try {
      const fontPath = join(this.fontsPath, 'Prompt-Regular.ttf');
      readFileSync(fontPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get optimized font CSS (only loads essential weights)
   */
  getOptimizedPromptFontCSS(): string {
    // Only load Regular and SemiBold to reduce size
    const regularBase64 = this.loadFontBase64('Prompt-Regular.ttf');
    const semiBoldBase64 = this.loadFontBase64('Prompt-SemiBold.ttf');

    if (!regularBase64) {
      return this.getFallbackFontCSS();
    }

    return `
      <style>
        <![CDATA[
          @font-face {
            font-family: 'PromptLocal';
            font-style: normal;
            font-weight: 400;
            src: url('data:font/ttf;base64,${regularBase64}');
          }
          @font-face {
            font-family: 'PromptLocal';
            font-style: normal;
            font-weight: 600;
            src: url('data:font/ttf;base64,${semiBoldBase64}');
          }
          
          .title { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 26px; 
            font-weight: 600; 
          }
          .axis { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 15px; 
            font-weight: 400; 
          }
          .stats { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 15px; 
            font-weight: 400; 
          }
          .label { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 13px; 
            font-weight: 400; 
          }
          .title-small { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 18px; 
            font-weight: 600; 
          }
          .axis-small { 
            font-family: 'PromptLocal', sans-serif; 
            font-size: 12px; 
            font-weight: 400; 
          }
        ]]>
      </style>
    `;
  }
}

// Export singleton instance
export const localFontLoader = new LocalFontLoader();