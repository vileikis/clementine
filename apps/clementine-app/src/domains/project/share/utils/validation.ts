/**
 * Validation utilities for Project Share Dialog
 * Feature: 011-project-share-dialog
 */

import { z } from 'zod'
import type { GuestUrl, ProjectId } from '../types'

/**
 * Project ID validation schema
 * Enforces Firebase document ID constraints
 */
export const projectIdSchema = z
  .string()
  .min(1, 'Project ID cannot be empty')
  .max(1500, 'Project ID exceeds maximum length')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Project ID can only contain letters, numbers, hyphens, and underscores',
  )

/**
 * Guest URL validation schema
 * Ensures HTTPS and proper format
 */
export const guestUrlSchema = z
  .string()
  .url('Invalid URL format')
  .startsWith('https://', 'URL must use HTTPS for security')
  .refine(
    (url) => url.includes('/guest/'),
    'URL must include /guest/ path segment',
  )

/**
 * QR code size validation
 */
export const qrCodeSizeSchema = z.union([
  z.literal(256),
  z.literal(512),
  z.literal(1024),
])

/**
 * QR code error level validation
 */
export const qrCodeErrorLevelSchema = z.enum(['L', 'M', 'Q', 'H'])

/**
 * Share dialog props validation
 */
export const shareDialogPropsSchema = z.object({
  projectId: projectIdSchema,
  open: z.boolean(),
  onOpenChange: z.function().args(z.boolean()).returns(z.void()),
})

/**
 * QR code options validation
 */
export const qrCodeOptionsSchema = z.object({
  value: guestUrlSchema,
  size: qrCodeSizeSchema.optional().default(512),
  level: qrCodeErrorLevelSchema.optional().default('M'),
  fgColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .default('#000000'),
  bgColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .default('#FFFFFF'),
  seed: z.number().int().nonnegative().optional(),
})

/**
 * Download options validation
 */
export const downloadOptionsSchema = z.object({
  filename: z.string().optional(),
  format: z.enum(['png', 'svg']).optional().default('png'),
})

/**
 * Validates and brands a project ID
 * @throws {ZodError} if validation fails
 */
export function validateProjectId(id: string): ProjectId {
  const validated = projectIdSchema.parse(id)
  return validated as ProjectId
}

/**
 * Validates and brands a guest URL
 * @throws {ZodError} if validation fails
 */
export function validateGuestUrl(url: string): GuestUrl {
  const validated = guestUrlSchema.parse(url)
  return validated as GuestUrl
}

/**
 * Safe validation that returns success/error tuple
 */
export function safeValidateProjectId(
  id: string,
): [ProjectId, null] | [null, string] {
  try {
    const validated = validateProjectId(id)
    return [validated, null]
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? (error.errors[0]?.message ?? 'Invalid project ID')
        : 'Unknown validation error'
    return [null, message]
  }
}
