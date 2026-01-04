# API Contracts: Project Share Dialog

**Feature**: 011-project-share-dialog
**Date**: 2026-01-04

## Overview

This feature is **entirely client-side** with no API endpoints or server interactions.

**No API Contracts**: The feature does not create, modify, or consume any HTTP/REST/GraphQL APIs.

## Client-Side Contracts

Instead of API contracts, this feature defines **TypeScript interface contracts** between components:

### Component Props Contracts

```typescript
/**
 * ShareDialog Component Contract
 * Public API for the share dialog component
 */
export interface ShareDialogProps {
  /** Project ID from route params (validated) */
  projectId: string;

  /** Dialog open state (controlled component) */
  open: boolean;

  /** Callback when dialog state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * QRCodeDisplay Component Contract
 * Internal component for QR code rendering
 */
export interface QRCodeDisplayProps {
  /** Guest URL to encode in QR code */
  guestUrl: string;

  /** QR code size in pixels */
  size?: 256 | 512 | 1024;

  /** Error correction level */
  level?: 'L' | 'M' | 'Q' | 'H';

  /** Random seed for visual variation */
  seed?: number;

  /** Callback when regenerate button clicked */
  onRegenerate: () => void;

  /** Callback when download button clicked */
  onDownload: () => void;
}

/**
 * ShareLinkSection Component Contract
 * Internal component for link display and copy
 */
export interface ShareLinkSectionProps {
  /** Guest URL to display and copy */
  guestUrl: string;

  /** Callback when copy button clicked */
  onCopy: () => void;

  /** Whether copy operation is in progress */
  copying?: boolean;
}
```

---

### Hook Contracts

```typescript
/**
 * useShareDialog Hook Contract
 * Dialog state management
 */
export interface UseShareDialogReturn {
  /** Current dialog open state */
  open: boolean;

  /** Open the dialog */
  openDialog: () => void;

  /** Close the dialog */
  closeDialog: () => void;

  /** Toggle dialog state */
  toggleDialog: () => void;
}

/**
 * useQRCodeGenerator Hook Contract
 * QR code generation and regeneration logic
 */
export interface UseQRCodeGeneratorReturn {
  /** Current QR code options */
  qrOptions: QRCodeOptions;

  /** Regenerate QR code with new visual pattern */
  regenerateQRCode: () => void;

  /** Download QR code as image */
  downloadQRCode: () => Promise<void>;

  /** Whether download is in progress */
  isDownloading: boolean;
}

/**
 * useCopyToClipboard Hook Contract
 * Clipboard API abstraction
 */
export interface UseCopyToClipboardReturn {
  /** Copy text to clipboard */
  copyToClipboard: (text: string) => Promise<boolean>;

  /** Whether copy operation is in progress */
  isCopying: boolean;

  /** Whether last copy succeeded */
  copySuccess: boolean;

  /** Reset copy success state */
  resetCopyState: () => void;
}
```

---

### Utility Function Contracts

```typescript
/**
 * generateGuestUrl Function Contract
 * Pure function for URL generation
 */
export function generateGuestUrl(projectId: string): string;

/**
 * validateProjectId Function Contract
 * Validates project ID format
 */
export function validateProjectId(id: string): string;

/**
 * downloadImage Function Contract
 * Triggers browser download of image data
 */
export function downloadImage(
  dataUrl: string,
  filename: string
): void;

/**
 * convertSvgToPng Function Contract
 * Converts SVG element to PNG data URL
 */
export function convertSvgToPng(
  svgElement: SVGElement,
  width: number,
  height: number
): Promise<string>;
```

---

## External Library Contracts

### react-qr-code Library Interface

```typescript
/**
 * QRCodeSVG Component (from react-qr-code library)
 * External dependency contract
 */
interface QRCodeSVGProps {
  /** Data to encode in QR code */
  value: string;

  /** QR code size in pixels */
  size?: number;

  /** Foreground color (QR modules) */
  fgColor?: string;

  /** Background color */
  bgColor?: string;

  /** Error correction level */
  level?: 'L' | 'M' | 'Q' | 'H';

  /** CSS class name */
  className?: string;

  /** CSS style object */
  style?: React.CSSProperties;
}
```

**Library Version**: `react-qr-code@^4.0.0` (to be added as dependency)

---

## Browser API Contracts

### Clipboard API

```typescript
/**
 * Clipboard API Contract
 * Modern clipboard access (requires HTTPS)
 */
interface ClipboardAPI {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
}

// Accessed via: navigator.clipboard
```

### Legacy execCommand (Fallback)

```typescript
/**
 * Legacy clipboard via execCommand
 * Fallback for older browsers
 */
document.execCommand('copy'): boolean;
```

### Canvas API

```typescript
/**
 * Canvas API Contract
 * Used for SVG-to-PNG conversion
 */
interface CanvasRenderingContext2D {
  drawImage(image: HTMLImageElement, x: number, y: number): void;
}

interface HTMLCanvasElement {
  toBlob(
    callback: (blob: Blob | null) => void,
    type?: string,
    quality?: number
  ): void;
}
```

---

## Integration Points

### TanStack Router Integration

```typescript
/**
 * Route Integration Contract
 * ShareDialog integrates with project route
 */

// In: apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx

import { ShareDialog } from '@/domains/project/share';
import { Share } from 'lucide-react';

// Add to TopNavActions:
const actions = [
  // ... existing actions
  {
    icon: Share,
    label: 'Share',
    ariaLabel: 'Share project with guests',
    variant: 'default',
    onClick: () => setShareDialogOpen(true),
  },
];

// Render ShareDialog:
<ShareDialog
  projectId={params.projectId}
  open={shareDialogOpen}
  onOpenChange={setShareDialogOpen}
/>
```

### shadcn/ui Dialog Integration

```typescript
/**
 * Dialog Component Contract
 * Existing shadcn/ui component
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui-kit/components/dialog';

// ShareDialog uses existing Dialog primitive
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Share Project</DialogTitle>
    </DialogHeader>
    {/* ShareDialog content */}
  </DialogContent>
</Dialog>
```

---

## No Server Contracts

This feature has **no server-side contracts**:

- ❌ No REST API endpoints
- ❌ No GraphQL mutations/queries
- ❌ No WebSocket connections
- ❌ No Firebase Cloud Functions
- ❌ No server-side validation
- ❌ No database operations

**All logic is client-side** (FR-012).

---

## Testing Contracts

### Component Testing

```typescript
/**
 * ShareDialog Test Contract
 * Verifies component behavior
 */
describe('ShareDialog', () => {
  it('should open when open prop is true');
  it('should display guest URL');
  it('should copy URL to clipboard on button click');
  it('should show success toast after copy');
  it('should render QR code');
  it('should regenerate QR code on button click');
  it('should trigger download on download button click');
});
```

### Hook Testing

```typescript
/**
 * useQRCodeGenerator Test Contract
 * Verifies hook behavior
 */
describe('useQRCodeGenerator', () => {
  it('should generate QR options with default seed');
  it('should regenerate with new seed');
  it('should handle download success');
  it('should handle download failure');
});
```

### Utility Testing

```typescript
/**
 * shareUrl.utils Test Contract
 * Verifies URL generation
 */
describe('generateGuestUrl', () => {
  it('should generate valid HTTPS URL');
  it('should include project ID in path');
  it('should throw on invalid project ID');
  it('should handle special characters in project ID');
});
```

---

## Summary

### Contract Types

1. **Component Props**: TypeScript interfaces defining component APIs
2. **Hook Returns**: TypeScript interfaces defining hook APIs
3. **Utility Functions**: Type signatures for pure functions
4. **External Libraries**: Type definitions for third-party dependencies
5. **Browser APIs**: Native web API contracts

### No HTTP Contracts

- Feature is entirely client-side
- No API endpoints or server interactions
- All contracts are TypeScript type definitions

### Integration Contracts

- TanStack Router (route params, navigation)
- shadcn/ui Dialog (UI primitive)
- Browser APIs (Clipboard, Canvas)

**Next**: Generate quickstart guide for developers
