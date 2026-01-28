/**
 * Shared types for Lexical mention parsing
 */

/**
 * Mention match result from regex parsing
 * Used when parsing plain text to find @{type:name} patterns
 */
export interface MentionMatch {
  /** Character index where the mention starts */
  index: number
  /** Total length of the mention string (e.g., "@{text:pet}" = 11 chars) */
  length: number
  /** Type of mention: text variable, media input, or reference media */
  type: 'text' | 'input' | 'ref'
  /** Name of the variable or media asset */
  name: string
}
