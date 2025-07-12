import { localFontLoader } from './local-font-loader';

/**
 * Font utilities for SVG charts
 * Provides embedded local fonts with fallback to system fonts
 */

/**
 * Generate font CSS with embedded local Prompt fonts
 * Falls back to system fonts if local fonts can't be loaded
 */
export function generateWebSafeFontCSS(): string {
  try {
    // Try to use local Prompt fonts first
    if (localFontLoader.areFontsAvailable()) {
      console.log('📝 Using embedded Prompt fonts for SVG charts');
      return localFontLoader.getOptimizedPromptFontCSS();
    }
  } catch (error) {
    console.warn('⚠️ Failed to load local fonts, using fallback:', error);
  }

  // Fallback to system fonts
  console.log('📝 Using system fonts for SVG charts');
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