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
  private cssCache: string | null = null;
  private fallbackCssCache: string | null = null;

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
   * Fallback CSS optimized for Linux containers - Google Fonts with caching
   */
  private getFallbackFontCSS(): string {
    // Return cached fallback CSS if available
    if (this.fallbackCssCache) {
      console.log('📝 Using cached fallback font CSS');
      return this.fallbackCssCache;
    }

    // Generate and cache fallback CSS
    this.fallbackCssCache = `
      <style>
        <![CDATA[
          @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600&subset=thai,latin&display=swap');
          
          .title { 
            font-family: 'Prompt', 'Sarabun', 'Tahoma', sans-serif; 
            font-size: 26px; 
            font-weight: 600; 
          }
          .axis { 
            font-family: 'Prompt', 'Sarabun', 'Tahoma', sans-serif; 
            font-size: 15px; 
            font-weight: 500; 
          }
          .stats { 
            font-family: 'Prompt', 'Sarabun', 'Tahoma', sans-serif; 
            font-size: 15px; 
            font-weight: 500; 
          }
          .label { 
            font-family: 'Prompt', 'Sarabun', 'Tahoma', sans-serif; 
            font-size: 13px; 
            font-weight: 400; 
          }
          .title-small { 
            font-family: 'Prompt', 'Sarabun', 'Tahoma', sans-serif; 
            font-size: 18px; 
            font-weight: 600; 
          }
          .axis-small { 
            font-family: 'Prompt', 'Sarabun', 'Tahoma', sans-serif; 
            font-size: 12px; 
            font-weight: 400; 
          }
        ]]>
        </style>
    `;

    console.log('📝 Generated and cached fallback font CSS');
    return this.fallbackCssCache;
  }

  /**
   * Check if fonts are available and can be loaded
   */
  areFontsAvailable(): boolean {
    try {
      // Check if font directory exists and files are accessible
      const fontPath = join(this.fontsPath, 'Prompt-Regular.ttf');
      const fontBuffer = readFileSync(fontPath);
      
      // Additional check: ensure the font file is not empty and has reasonable size
      if (fontBuffer.length < 1000) {
        console.warn('Font file too small, likely corrupted');
        return false;
      }
      
      console.log('✅ Local fonts available and valid');
      return true;
    } catch (error) {
      console.warn('❌ Local fonts not available:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Get optimized font CSS (only loads essential weights) with caching
   */
  getOptimizedPromptFontCSS(): string {
    // Return cached CSS if available
    if (this.cssCache) {
      console.log('📝 Using cached optimized Prompt font CSS');
      return this.cssCache;
    }

    // Only load Regular and SemiBold to reduce size
    const regularBase64 = this.loadFontBase64('Prompt-Regular.ttf');
    const semiBoldBase64 = this.loadFontBase64('Prompt-SemiBold.ttf');

    if (!regularBase64) {
      return this.getFallbackFontCSS();
    }

    // Generate and cache CSS
    this.cssCache = `
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

    console.log('📝 Generated and cached optimized Prompt font CSS');
    return this.cssCache;
  }

  /**
   * Clear all caches (useful for development or testing)
   */
  clearCaches(): void {
    this.fontCache = {};
    this.cssCache = null;
    this.fallbackCssCache = null;
    console.log('🗑️ Cleared all font and CSS caches');
  }
}

// Export singleton instance
export const localFontLoader = new LocalFontLoader();