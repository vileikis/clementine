/**
 * Aspect Ratio Utilities
 *
 * Utilities for mapping aspect ratio formats between pipeline and AI providers.
 */

/**
 * Map pipeline aspect ratio to Gemini format
 *
 * @param ratio - Pipeline aspect ratio ('square' or 'story')
 * @returns Gemini aspect ratio string ('1:1' or '9:16')
 */
export function mapAspectRatioToGemini(ratio: 'square' | 'story'): string {
  switch (ratio) {
    case 'square':
      return '1:1';
    case 'story':
      return '9:16';
    default:
      // Fallback to square for unknown values
      return '1:1';
  }
}
