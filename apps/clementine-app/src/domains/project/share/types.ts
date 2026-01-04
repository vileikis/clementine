/**
 * Type definitions for Project Share Dialog feature
 * Feature: 011-project-share-dialog
 */

/**
 * Guest URL for project access
 * Format: https://{domain}/guest/{projectId}
 */
export type GuestUrl = string & { readonly __brand: 'GuestUrl' }

/**
 * Project identifier from route params
 * Must match Firebase document ID constraints
 */
export type ProjectId = string & { readonly __brand: 'ProjectId' }

/**
 * QR code size in pixels
 * Minimum 512x512 for print quality (SC-004)
 */
export type QRCodeSize = 256 | 512 | 1024

/**
 * QR code error correction level
 * M = Medium (15% damage tolerance) - recommended for events
 */
export type QRCodeErrorLevel = 'L' | 'M' | 'Q' | 'H'

/**
 * Share dialog component props
 */
export interface ShareDialogProps {
  /**
   * Project ID from route params
   * Will be validated against projectIdSchema internally
   */
  projectId: string

  /**
   * Dialog open state (controlled)
   */
  open: boolean

  /**
   * Dialog state change callback
   */
  onOpenChange: (open: boolean) => void
}

/**
 * QR code generation options
 */
export interface QRCodeOptions {
  /**
   * Guest URL to encode in QR code
   */
  value: GuestUrl

  /**
   * QR code size in pixels
   * @default 512
   */
  size?: QRCodeSize

  /**
   * Error correction level
   * @default 'M' (Medium - 15% tolerance)
   */
  level?: QRCodeErrorLevel

  /**
   * Foreground color (QR code modules)
   * @default '#000000' (black)
   */
  fgColor?: string

  /**
   * Background color
   * @default '#FFFFFF' (white)
   */
  bgColor?: string

  /**
   * Random seed for regeneration
   * Used to generate different visual patterns for same URL
   */
  seed?: number
}

/**
 * Clipboard copy result
 */
export interface CopyResult {
  /**
   * Whether copy operation succeeded
   */
  success: boolean

  /**
   * Error message if copy failed
   */
  error?: string
}

/**
 * QR code download options
 */
export interface DownloadOptions {
  /**
   * Filename for downloaded image
   * @default 'qr-code-{projectId}.png'
   */
  filename?: string

  /**
   * Image format
   * @default 'png'
   */
  format?: 'png' | 'svg'
}
