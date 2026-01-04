# Research: Project Share Dialog

**Feature**: 011-project-share-dialog
**Date**: 2026-01-04
**Purpose**: Resolve technical unknowns and establish implementation patterns

## Research Tasks

### 1. QR Code Library Selection

**Question**: Which QR code library should we use for client-side generation?

**Options Evaluated**:

| Library | Bundle Size | Features | React Integration | TypeScript Support |
|---------|-------------|----------|-------------------|-------------------|
| qrcode.react | ~10KB | Basic QR generation, customizable colors/size | Native React component | ✅ Yes |
| react-qr-code | ~5KB | Lightweight, SVG-based, simple API | Native React component | ✅ Yes |
| qr-code-styling | ~45KB | Advanced styling (logos, gradients, shapes) | Wrapper needed | ⚠️ Partial |

**Decision**: **react-qr-code**

**Rationale**:
- **Smallest bundle size** (~5KB) - critical for client-side performance
- **SVG-based rendering** - scales perfectly for print (512x512+ requirement)
- **Simple API** - no over-engineering, just generates QR codes
- **TypeScript support** - full type safety
- **Active maintenance** - last updated 2025, well-maintained
- **React 19 compatible** - works with latest React

**Alternatives Considered**:
- **qrcode.react**: Larger bundle (10KB), older API, less maintained
- **qr-code-styling**: Overkill for our needs (45KB), too many features we don't need (logos, gradients). Violates Principle II (Simplicity).

**Implementation Pattern**:
```tsx
import { QRCodeSVG } from 'react-qr-code';

<QRCodeSVG
  value="https://app.clementine.com/guest/projectId"
  size={512}
  level="M"  // Medium error correction (15% damage tolerance)
/>
```

**Package**: `react-qr-code` (NPM: https://www.npmjs.com/package/react-qr-code)

---

### 2. Zod Validation for URL Generation

**Question**: Do we need runtime validation for projectId and guest URL generation?

**Decision**: **Yes - Validate projectId format**

**Rationale**:
- **Security**: Prevent malformed projectIds from creating broken URLs
- **Type safety**: projectId comes from route params (external input)
- **Principle III**: "Runtime validation with Zod for all external inputs"
- **Fail fast**: Better to catch invalid IDs early than render broken QR codes

**Validation Schema**:
```typescript
import { z } from 'zod';

// Project ID validation (Firebase document ID format)
export const projectIdSchema = z
  .string()
  .min(1, 'Project ID cannot be empty')
  .max(1500, 'Project ID too long')  // Firestore limit
  .regex(/^[a-zA-Z0-9_-]+$/, 'Project ID contains invalid characters');

// Guest URL validation
export const guestUrlSchema = z
  .string()
  .url('Invalid URL format')
  .startsWith('https://', 'URL must use HTTPS');

// Share dialog props validation
export const shareDialogPropsSchema = z.object({
  projectId: projectIdSchema,
  open: z.boolean(),
  onOpenChange: z.function().args(z.boolean()).returns(z.void()),
});
```

**Usage**:
- Validate `projectId` when ShareDialog opens
- Validate generated guest URL before QR code generation
- Throw descriptive errors if validation fails (caught by React Error Boundary)

**Alternatives Considered**:
- **No validation**: Rejected - violates Principle III, risks broken QR codes
- **TypeScript-only validation**: Rejected - doesn't catch runtime issues from route params

---

### 3. Domain Structure Location

**Question**: Should share functionality be `domains/project/share/` (new subdomain) or integrated into existing `domains/project/` structure?

**Current Project Domain Structure Analysis**:

```bash
# Research existing project domain organization
apps/clementine-app/src/domains/project/
├── events/           # Subdomain: Project event management
│   ├── components/
│   ├── containers/
│   ├── hooks/
│   └── index.ts
└── [other subdomains if any]
```

**Decision**: **Create new subdomain `domains/project/share/`**

**Rationale**:
- **Existing pattern**: Project domain already uses subdomains (e.g., `events/`)
- **Self-contained feature**: Share has distinct functionality (URL generation, QR codes, clipboard)
- **Vertical slice**: Keeps all share-related code together (components, hooks, utils)
- **Discoverability**: Clear location - developers know where to find share features
- **Future extensibility**: Room to add share analytics, social sharing, etc.

**Structure**:
```text
domains/project/share/
├── components/
│   ├── ShareDialog.tsx              # Main dialog
│   ├── ShareDialog.test.tsx
│   ├── QRCodeDisplay.tsx            # QR rendering + download
│   ├── QRCodeDisplay.test.tsx
│   └── ShareLinkSection.tsx         # URL display + copy
├── hooks/
│   ├── useShareDialog.tsx           # Dialog state
│   ├── useShareDialog.test.tsx
│   ├── useQRCodeGenerator.tsx       # QR generation logic
│   └── useCopyToClipboard.tsx       # Clipboard abstraction
├── utils/
│   ├── shareUrl.utils.ts            # Guest URL generation
│   ├── shareUrl.utils.test.ts
│   └── validation.ts                # Zod schemas
├── types.ts                         # TypeScript types
└── index.ts                         # Barrel export
```

**Alternatives Considered**:
- **Add to `domains/project/` root**: Rejected - would clutter root directory, no clear organization
- **Create `domains/sharing/`**: Rejected - too broad, share is specific to projects

---

### 4. Clipboard API and Browser Compatibility

**Research**: Best practices for clipboard copy with fallback

**Decision**: **Use Clipboard API with fallback to legacy `execCommand`**

**Implementation**:
```typescript
async function copyToClipboard(text: string): Promise<boolean> {
  // Modern browsers - Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard API failed:', err);
      // Fall through to fallback
    }
  }

  // Fallback for older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}
```

**Rationale**:
- **Progressive enhancement**: Modern API first, graceful degradation
- **Wide browser support**: Clipboard API (95%+ browsers), execCommand as safety net
- **Security context aware**: Checks for HTTPS (required for Clipboard API)
- **User feedback**: Returns boolean for success/failure toast notifications

**Browser Support**:
- Clipboard API: Chrome 63+, Firefox 53+, Safari 13.1+, Edge 79+
- execCommand: All browsers (legacy support)

---

### 5. QR Code Download Implementation

**Research**: How to trigger QR code image download client-side

**Decision**: **Canvas-based download using SVG-to-PNG conversion**

**Implementation Pattern**:
```typescript
function downloadQRCode(svgElement: SVGElement, filename: string) {
  // 1. Convert SVG to data URL
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  // 2. Create canvas and draw SVG
  const canvas = document.createElement('canvas');
  canvas.width = 512;  // Print quality
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.onload = () => {
    ctx?.drawImage(img, 0, 0);
    URL.revokeObjectURL(svgUrl);

    // 3. Convert to PNG and trigger download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  img.src = svgUrl;
}
```

**Rationale**:
- **PNG format**: Widely supported for print (SC-004: 512x512 minimum)
- **High quality**: Canvas rendering at full resolution
- **No server processing**: Meets FR-012 (client-side only)
- **Memory efficient**: Uses blob URLs, cleans up after download

**Alternatives Considered**:
- **Direct SVG download**: Rejected - many design tools don't import SVG QR codes well
- **External service**: Rejected - violates FR-012 (no server processing)

---

### 6. Guest URL Construction

**Research**: How to construct guest URL from project route context

**Decision**: **Use TanStack Router's `useRouter` hook to get base URL**

**Implementation**:
```typescript
import { useRouter } from '@tanstack/react-router';

function useGuestUrl(projectId: string): string {
  const router = useRouter();

  // Get current origin (handles dev/staging/prod automatically)
  const origin = window.location.origin;

  // Construct guest URL
  const guestUrl = `${origin}/guest/${projectId}`;

  // Validate with Zod
  const validated = guestUrlSchema.parse(guestUrl);

  return validated;
}
```

**Rationale**:
- **Environment-agnostic**: Works in dev (localhost:3000), staging, production
- **HTTPS enforcement**: Zod schema validates protocol (SC-006: security)
- **Type-safe**: projectId validated before URL construction
- **No hardcoding**: Domain determined from runtime context

**Edge Case Handling**:
- **Missing projectId**: Caught by Zod validation, error boundary shows fallback
- **Invalid URL**: Validation throws descriptive error
- **Non-HTTPS in prod**: Caught by schema validation

---

## Implementation Recommendations

### Dependencies to Add

```bash
pnpm add react-qr-code --filter @clementine/app
```

**Justification**: Only new dependency needed. All other functionality uses existing libraries.

### Component Architecture

```
ShareDialog (Main Container)
├── ShareLinkSection
│   ├── Input (read-only guest URL)
│   └── Button (Copy Link)
└── QRCodeDisplay
    ├── QRCodeSVG (from react-qr-code)
    ├── Button (Regenerate QR)
    └── Button (Download QR)
```

### State Management

- **Dialog open state**: Managed by parent route component, passed as prop
- **QR code seed**: Local state in QRCodeDisplay (for regeneration)
- **Copy success**: Local state for toast notification
- **No global state**: Feature is entirely self-contained (Zustand not needed)

### Performance Considerations

- **Lazy load QR library**: Use React.lazy() to code-split react-qr-code
- **Memoize URL generation**: Use useMemo to prevent unnecessary recalculations
- **Debounce regenerate**: Prevent rapid clicking causing performance issues

---

## Summary

All NEEDS CLARIFICATION items resolved:

1. ✅ **QR Library**: react-qr-code (5KB, SVG-based, TypeScript, React 19 compatible)
2. ✅ **Zod Validation**: Yes - validate projectId and guest URL (security + type safety)
3. ✅ **Domain Structure**: `domains/project/share/` (follows existing subdomain pattern)
4. ✅ **Clipboard API**: Use modern API with execCommand fallback
5. ✅ **Download**: Canvas-based SVG-to-PNG conversion (512x512 PNG)
6. ✅ **URL Construction**: TanStack Router + window.location.origin

**Ready for Phase 1**: Data model and contracts definition.
