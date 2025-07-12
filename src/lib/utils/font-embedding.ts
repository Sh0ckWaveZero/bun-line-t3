import { localFontLoader } from './local-font-loader';

/**
 * Font utilities for SVG charts
 * Provides embedded local fonts with fallback to system fonts
 */

/**
 * Generate font CSS with embedded local Prompt fonts
 * Falls back to comprehensive Thai-compatible font stack for production
 */
export function generateWebSafeFontCSS(): string {
  // Always use embedded local fonts
  try {
    console.log('📝 Using embedded local Prompt fonts for SVG charts');
    return localFontLoader.getOptimizedPromptFontCSS();
  } catch (error) {
    console.error('❌ Failed to load local fonts:', error);
    // If local fonts fail, still try to use them but log the error
    return localFontLoader.getOptimizedPromptFontCSS();
  }
}

/**
 * Container-optimized font CSS for Linux deployments
 * Prioritizes Google Fonts with container-safe fallbacks
 */
function getProductionSafeFontCSS(): string {
  return `
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
}