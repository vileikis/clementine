# Data Model: Project Share Dialog

**Feature**: 011-project-share-dialog
**Date**: 2026-01-04
**Purpose**: Define data structures, types, and validation schemas

## Overview

This feature is **entirely client-side** with no database persistence. All data structures are ephemeral (in-memory only) and used solely for UI state management and validation.

**No Firebase Integration**: No Firestore reads/writes, no Storage operations, no data persistence.

## Type Definitions

### Core Types

```typescript
// domains/project/share/types.ts

/**
 * Guest URL for project access
 * Format: https://{domain}/guest/{projectId}
 */
export type GuestUrl = string & { readonly __brand: 'GuestUrl' };

/**
 * Project identifier from route params
 * Must match Firebase document ID constraints
 */
export type ProjectId = string & { readonly __brand: 'ProjectId' };

/**
 * QR code size in pixels
 * Minimum 512x512 for print quality (SC-004)
 */
export type QRCodeSize = 256 | 512 | 1024;

/**
 * QR code error correction level
 * M = Medium (15% damage tolerance) - recommended for events
 */
export type QRCodeErrorLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * Share dialog component props
 */
export interface ShareDialogProps {
  /**
   * Project ID from route params
   * Validated against projectIdSchema
   */
  projectId: ProjectId;

  /**
   * Dialog open state (controlled)
   */
  open: boolean;

  /**
   * Dialog state change callback
   */
  onOpenChange: (open: boolean) => void;
}

/**
 * QR code generation options
 */
export interface QRCodeOptions {
  /**
   * Guest URL to encode in QR code
   */
  value: GuestUrl;

  /**
   * QR code size in pixels
   * @default 512
   */
  size?: QRCodeSize;

  /**
   * Error correction level
   * @default 'M' (Medium - 15% tolerance)
   */
  level?: QRCodeErrorLevel;

  /**
   * Foreground color (QR code modules)
   * @default '#000000' (black)
   */
  fgColor?: string;

  /**
   * Background color
   * @default '#FFFFFF' (white)
   */
  bgColor?: string;

  /**
   * Random seed for regeneration
   * Used to generate different visual patterns for same URL
   */
  seed?: number;
}

/**
 * Clipboard copy result
 */
export interface CopyResult {
  /**
   * Whether copy operation succeeded
   */
  success: boolean;

  /**
   * Error message if copy failed
   */
  error?: string;
}

/**
 * QR code download options
 */
export interface DownloadOptions {
  /**
   * Filename for downloaded image
   * @default 'qr-code-{projectId}.png'
   */
  filename?: string;

  /**
   * Image format
   * @default 'png'
   */
  format?: 'png' | 'svg';
}
```

---

## Validation Schemas

### Zod Schemas

```typescript
// domains/project/share/utils/validation.ts

import { z } from 'zod';

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
    'Project ID can only contain letters, numbers, hyphens, and underscores'
  );

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
    'URL must include /guest/ path segment'
  );

/**
 * QR code size validation
 */
export const qrCodeSizeSchema = z.union([
  z.literal(256),
  z.literal(512),
  z.literal(1024),
]);

/**
 * QR code error level validation
 */
export const qrCodeErrorLevelSchema = z.enum(['L', 'M', 'Q', 'H']);

/**
 * Share dialog props validation
 */
export const shareDialogPropsSchema = z.object({
  projectId: projectIdSchema,
  open: z.boolean(),
  onOpenChange: z.function().args(z.boolean()).returns(z.void()),
});

/**
 * QR code options validation
 */
export const qrCodeOptionsSchema = z.object({
  value: guestUrlSchema,
  size: qrCodeSizeSchema.optional().default(512),
  level: qrCodeErrorLevelSchema.optional().default('M'),
  fgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#000000'),
  bgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#FFFFFF'),
  seed: z.number().int().nonnegative().optional(),
});

/**
 * Download options validation
 */
export const downloadOptionsSchema = z.object({
  filename: z.string().optional(),
  format: z.enum(['png', 'svg']).optional().default('png'),
});
```

### Runtime Validation Helpers

```typescript
// domains/project/share/utils/validation.ts

import type { ProjectId, GuestUrl } from '../types';

/**
 * Validates and brands a project ID
 * @throws {ZodError} if validation fails
 */
export function validateProjectId(id: string): ProjectId {
  const validated = projectIdSchema.parse(id);
  return validated as ProjectId;
}

/**
 * Validates and brands a guest URL
 * @throws {ZodError} if validation fails
 */
export function validateGuestUrl(url: string): GuestUrl {
  const validated = guestUrlSchema.parse(url);
  return validated as GuestUrl;
}

/**
 * Safe validation that returns success/error tuple
 */
export function safeValidateProjectId(
  id: string
): [ProjectId, null] | [null, string] {
  try {
    const validated = validateProjectId(id);
    return [validated, null];
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.errors[0]?.message ?? 'Invalid project ID'
      : 'Unknown validation error';
    return [null, message];
  }
}
```

---

## State Management

### Component State

```typescript
// ShareDialog component state
interface ShareDialogState {
  // QR code regeneration seed (randomized on regenerate button click)
  qrSeed: number;

  // Copy success state (for toast notification)
  copySuccess: boolean;

  // Download in progress (prevent double-clicks)
  downloadInProgress: boolean;
}

// Initial state
const initialState: ShareDialogState = {
  qrSeed: Date.now(),
  copySuccess: false,
  downloadInProgress: false,
};
```

### No Global State

- **No Zustand**: Feature is entirely self-contained, no shared state needed
- **No TanStack Query**: No server data fetching
- **No React Context**: State is local to ShareDialog component

---

## Computed Values

### Guest URL Generation

```typescript
// domains/project/share/utils/shareUrl.utils.ts

import type { ProjectId, GuestUrl } from '../types';
import { validateProjectId, validateGuestUrl } from './validation';

/**
 * Generates guest URL for a project
 * Validates inputs and output
 *
 * @param projectId - Project identifier (from route params)
 * @returns Validated guest URL
 * @throws {ZodError} if projectId is invalid or URL generation fails
 *
 * @example
 * const url = generateGuestUrl('abc123'); // https://app.clementine.com/guest/abc123
 */
export function generateGuestUrl(projectId: string): GuestUrl {
  // Validate input
  const validatedId = validateProjectId(projectId);

  // Get current origin (handles dev/staging/prod)
  const origin = window.location.origin;

  // Construct guest URL
  const url = `${origin}/guest/${validatedId}`;

  // Validate output
  const validatedUrl = validateGuestUrl(url);

  return validatedUrl;
}

/**
 * Extracts project ID from guest URL
 * Useful for testing and validation
 *
 * @param url - Guest URL
 * @returns Project ID or null if invalid
 */
export function extractProjectIdFromGuestUrl(
  url: GuestUrl
): ProjectId | null {
  try {
    const match = url.match(/\/guest\/([^/?]+)/);
    if (!match?.[1]) return null;

    return validateProjectId(match[1]);
  } catch {
    return null;
  }
}
```

### QR Code Data URL

```typescript
// QR code is rendered as SVG by react-qr-code
// Download converts SVG to PNG data URL

interface QRCodeDataUrl {
  /**
   * Base64-encoded PNG data URL
   * Format: data:image/png;base64,{base64Data}
   */
  dataUrl: string;

  /**
   * Blob for download trigger
   */
  blob: Blob;
}
```

---

## Error Handling

### Validation Errors

```typescript
/**
 * Custom error for share feature failures
 */
export class ShareFeatureError extends Error {
  constructor(
    message: string,
    public readonly code: ShareErrorCode,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ShareFeatureError';
  }
}

export enum ShareErrorCode {
  INVALID_PROJECT_ID = 'INVALID_PROJECT_ID',
  INVALID_URL = 'INVALID_URL',
  CLIPBOARD_FAILED = 'CLIPBOARD_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  QR_GENERATION_FAILED = 'QR_GENERATION_FAILED',
}
```

### Error Boundaries

```typescript
// ShareDialog wrapped in error boundary (existing app-level boundary)
// Displays user-friendly message if validation or rendering fails

// Example error messages:
// - "Unable to generate share link. Please try again."
// - "Failed to copy link. Please copy manually: {url}"
// - "QR code download failed. Right-click the QR code to save."
```

---

## Performance Considerations

### Memoization

```typescript
// useMemo for guest URL (expensive window.location access)
const guestUrl = useMemo(
  () => generateGuestUrl(projectId),
  [projectId]
);

// useMemo for QR code options (prevent re-renders)
const qrOptions = useMemo(
  () => ({
    value: guestUrl,
    size: 512,
    level: 'M' as const,
    seed: qrSeed,
  }),
  [guestUrl, qrSeed]
);
```

### Lazy Loading

```typescript
// Lazy load QR library to reduce initial bundle
const QRCodeDisplay = React.lazy(() =>
  import('./QRCodeDisplay').then((m) => ({ default: m.QRCodeDisplay }))
);

// Suspend while loading
<Suspense fallback={<QRCodeSkeleton />}>
  <QRCodeDisplay {...props} />
</Suspense>
```

---

## Testing Data

### Test Fixtures

```typescript
// domains/project/share/__tests__/fixtures.ts

export const TEST_PROJECT_IDS = {
  valid: 'test-project-123',
  empty: '',
  tooLong: 'a'.repeat(1501),
  invalidChars: 'test@project#123',
  withSpaces: 'test project 123',
};

export const TEST_GUEST_URLS = {
  valid: 'https://app.clementine.com/guest/test-project-123',
  http: 'http://app.clementine.com/guest/test-project-123', // Invalid
  noGuest: 'https://app.clementine.com/test-project-123', // Invalid
  malformed: 'not-a-url',
};

export const TEST_QR_OPTIONS = {
  minimal: { value: TEST_GUEST_URLS.valid },
  full: {
    value: TEST_GUEST_URLS.valid,
    size: 512 as const,
    level: 'M' as const,
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    seed: 12345,
  },
};
```

---

## Summary

### Data Entities

1. **GuestUrl**: Branded string type for validated guest URLs
2. **ProjectId**: Branded string type for validated project identifiers
3. **QRCodeOptions**: Configuration for QR code generation
4. **ShareDialogProps**: Component props with validation

### Validation

- **Zod schemas** for all external inputs (projectId from route params)
- **Runtime validation** before URL generation and QR encoding
- **Branded types** for type safety (prevent mixing validated/unvalidated strings)

### State

- **Local component state only**: No global state management needed
- **Computed values**: Guest URL, QR code data URL
- **Ephemeral**: No persistence, state resets on dialog close

### Performance

- **Memoization**: Guest URL and QR options
- **Lazy loading**: QR code library code-split
- **Efficient re-renders**: Only re-generate QR when seed changes

**Next**: Generate API contracts (minimal - feature is client-only)
