# Research: Camera Module Migration

**Feature**: 007-camera-migration
**Date**: 2025-12-30
**Status**: COMPLETE

## Overview

This document resolves all unknowns identified in the implementation plan's Phase 0. Research focused on:
1. TanStack Start image rendering solution (replace `next/image`)
2. shadcn/ui component availability (Switch, Select, Label)
3. SSR handling patterns for browser APIs
4. Browser API compatibility verification

---

## Research Task 1: Image Rendering Solution

### Problem Statement

The Next.js camera module uses `next/image` Image component in PhotoReview for displaying captured photos. TanStack Start does not have Next.js Image optimization. Need to determine the appropriate image rendering solution.

### Investigation

**Existing Implementation (Next.js)**:
```tsx
// PhotoReview.tsx (Next.js)
import Image from "next/image";

<Image
  src={photo.previewUrl}
  alt="Captured photo preview"
  fill
  className="object-contain"
  priority
/>
```

**Key Findings**:
1. PhotoReview displays blob URLs created by `URL.createObjectURL(file)`
2. Blob URLs are temporary object URLs for immediate display (not static images)
3. The app already uses standard `<img>` tags for dimension extraction in `image-utils.ts`
4. No optimization is needed for blob URLs (they're already in memory)

### Decision

**Use standard HTML `<img>` tags for blob URL display**

### Rationale

1. **No optimization needed**: Blob URLs are client-side object URLs that don't benefit from image optimization pipelines
2. **Simplicity**: Standard `<img>` tags require no configuration or special handling
3. **Browser native**: Blob URLs work perfectly with standard HTML image elements
4. **Proven pattern**: The codebase already uses `<img>` for image dimension detection successfully
5. **TanStack Start compatibility**: No special image component is needed in TanStack Start for blob URLs

### Implementation Pattern

**Replace Next.js Image component:**
```tsx
// Before (Next.js)
import Image from "next/image";
<Image src={photo.previewUrl} alt="..." fill className="object-contain" priority />

// After (TanStack Start)
<img
  src={photo.previewUrl}
  alt="Captured photo preview"
  className="w-full h-full object-contain"
/>
```

**Using Tailwind utilities:**
- `w-full h-full` → Replaces `fill` layout prop
- `object-contain` → Same as Next.js (maintains aspect ratio)
- No `priority` needed (blob URLs are already in memory)

### Alternatives Considered

1. **Custom TanStack Start Image component**
   - **Rejected**: Unnecessary abstraction for blob URLs
   - No optimization benefits for client-side object URLs

2. **Third-party image library (react-image, etc.)**
   - **Rejected**: Overkill for simple blob URL display
   - Adds unnecessary dependencies

3. **Keep Next.js Image import**
   - **Rejected**: Not available in TanStack Start
   - Would cause build errors

### Impact

- **Files affected**: `PhotoReview.tsx` (1 file)
- **Breaking changes**: None (internal implementation detail)
- **Testing required**: Visual regression testing (verify image displays correctly)

---

## Research Task 2: shadcn/ui Components

### Problem Statement

Dev-tools testing interface requires Switch, Select, and Label components. Need to verify if these shadcn/ui components are already installed in TanStack Start app.

### Investigation

**Checked locations**:
1. `/apps/clementine-app/src/ui-kit/components/` (component files)
2. `/apps/clementine-app/components.json` (shadcn configuration)
3. `/apps/clementine-app/package.json` (Radix UI dependencies)

### Findings

#### Switch Component ✅

- **Location**: `apps/clementine-app/src/ui-kit/components/switch.tsx`
- **Status**: INSTALLED
- **Built on**: `@radix-ui/react-switch` (v1.2.6)
- **Features**: Keyboard support, accessibility, animated thumb, dark mode
- **Import**: `import { Switch } from '@/ui-kit/components/switch'`

#### Select Component ✅

- **Location**: `apps/clementine-app/src/ui-kit/components/select.tsx`
- **Status**: INSTALLED
- **Built on**: `@radix-ui/react-select` (v2.2.6)
- **Exports**:
  - `Select` (root)
  - `SelectGroup`
  - `SelectValue`
  - `SelectTrigger`
  - `SelectContent`
  - `SelectLabel`
  - `SelectItem`
  - `SelectSeparator`
  - `SelectScrollUpButton`
  - `SelectScrollDownButton`
- **Features**: Size variants (sm, default), scroll buttons, lucide-react icons
- **Import**: `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/ui-kit/components/select'`

#### Label Component ✅

- **Location**: `apps/clementine-app/src/ui-kit/components/label.tsx`
- **Status**: INSTALLED
- **Built on**: `@radix-ui/react-label` (v2.1.8)
- **Features**: Disabled state support, peer-disabled styling
- **Import**: `import { Label } from '@/ui-kit/components/label'`

### Decision

**All required components are already installed. No additional installation needed.**

### Rationale

1. Switch, Select, and Label are already available in `/ui-kit/components/`
2. Radix UI peer dependencies are installed and up-to-date
3. Components follow project conventions (new-york style, slate base color)
4. All components include accessibility features and dark mode support

### Implementation Pattern

**Dev-tools PropControls usage:**

```tsx
import { Switch } from '@/ui-kit/components/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/ui-kit/components/select'
import { Label } from '@/ui-kit/components/label'

export function PropControls({ config, onChange }) {
  return (
    <div className="space-y-4">
      {/* Boolean prop: enableLibrary */}
      <div className="flex items-center justify-between">
        <Label htmlFor="enable-library">Enable Library Picker</Label>
        <Switch
          id="enable-library"
          checked={config.enableLibrary}
          onCheckedChange={(checked) => onChange({ ...config, enableLibrary: checked })}
        />
      </div>

      {/* Enum prop: cameraFacing */}
      <div className="space-y-2">
        <Label htmlFor="camera-facing">Camera Facing</Label>
        <Select
          value={config.cameraFacing}
          onValueChange={(value) => onChange({ ...config, cameraFacing: value })}
        >
          <SelectTrigger id="camera-facing">
            <SelectValue placeholder="Select camera facing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User (Front)</SelectItem>
            <SelectItem value="environment">Environment (Back)</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Enum prop: aspectRatio */}
      <div className="space-y-2">
        <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
        <Select
          value={config.aspectRatio ?? "none"}
          onValueChange={(value) => onChange({ ...config, aspectRatio: value === "none" ? undefined : value })}
        >
          <SelectTrigger id="aspect-ratio">
            <SelectValue placeholder="Select aspect ratio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Full Frame)</SelectItem>
            <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
            <SelectItem value="1:1">1:1 (Square)</SelectItem>
            <SelectItem value="9:16">9:16 (Stories)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

### Alternatives Considered

1. **Install components via `pnpm dlx shadcn@latest add`**
   - **Rejected**: Components already installed
   - Would overwrite existing configurations

2. **Build custom form controls**
   - **Rejected**: Unnecessary duplication
   - shadcn/ui components provide better accessibility and styling

### Impact

- **Files affected**: Dev-tools components (PropControls.tsx, CameraDevTools.tsx)
- **Breaking changes**: None
- **Testing required**: None (components already tested in other features)

---

## Research Task 3: SSR Handling for Browser APIs

### Problem Statement

Camera module uses browser-only APIs (MediaDevices, Canvas, Blob, URL). TanStack Start supports SSR. Need to determine how to handle client-only code safely.

### Investigation

**Browser APIs used by camera module**:
1. `navigator.mediaDevices.getUserMedia()` - Camera access
2. `navigator.mediaDevices.enumerateDevices()` - Device enumeration
3. `navigator.permissions.query()` - Permission state (optional)
4. `HTMLVideoElement` - Video stream display
5. `HTMLCanvasElement` - Photo capture
6. `URL.createObjectURL()` / `revokeObjectURL()` - Blob URL management
7. `FileReader` - File reading (library picker)

**TanStack Start SSR behavior**:
- TanStack Start does NOT use `"use client"` directive (that's a Next.js/React Server Components pattern)
- Components with browser APIs need proper feature detection
- Use `typeof window !== "undefined"` or `typeof navigator !== "undefined"` checks

### Decision

**Remove all `"use client"` directives (Next.js artifact). Use feature detection for browser APIs.**

### Rationale

1. **TanStack Start is not React Server Components**: Does not use `"use client"` directive
2. **Feature detection is the standard pattern**: Check for browser APIs before using them
3. **Simpler than Next.js approach**: No need for special directives
4. **Already implemented correctly**: Existing code has `typeof navigator !== "undefined"` checks
5. **Migration cleanup**: `"use client"` was copied from Next.js and should be removed

### Implementation Pattern

**Remove "use client" directives:**

```tsx
// CameraCapture.tsx - NO "use client" directive needed
import { useState, useEffect } from "react";
import { CameraView } from "./CameraView";
// ... other imports

export function CameraCapture({ onPhoto, onSubmit }: CameraCaptureProps) {
  // Component uses browser APIs (MediaDevices, Canvas)
  // Feature detection handles SSR safety
  // ...
}
```

**Feature detection pattern (already correct in existing code):**

```typescript
// device-utils.ts
export function isMediaDevicesAvailable(): boolean {
  if (typeof navigator === "undefined") return false; // SSR-safe check
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
}

export function isPermissionQueryAvailable(): boolean {
  if (typeof navigator === "undefined") return false; // SSR-safe check
  return !!(
    navigator.permissions &&
    navigator.permissions.query
  );
}
```

**Components handle SSR gracefully:**
- Components check `isMediaDevicesAvailable()` before accessing camera
- Return appropriate UI when browser APIs are unavailable
- No special directives needed

### Migration Action Required

**Remove `"use client"` from these files (Next.js artifact):**
1. ❌ Remove from `CameraCapture.tsx`
2. ❌ Remove from `CameraView.tsx`
3. ❌ Remove from `CameraControls.tsx`
4. ❌ Remove from `PhotoReview.tsx`
5. ❌ Remove from `PermissionPrompt.tsx`
6. ❌ Remove from `ErrorState.tsx`
7. ❌ Remove from `LibraryPicker.tsx`
8. ❌ Remove from `useCameraPermission.ts`
9. ❌ Remove from `useLibraryPicker.ts`

**Keep feature detection (already correct):**
- ✅ Keep `typeof navigator !== "undefined"` checks in `device-utils.ts`
- ✅ Keep `isMediaDevicesAvailable()` checks in components
- ✅ Keep browser API availability checks

### Alternatives Considered

1. **Keep "use client" directives**
   - **Rejected**: Not used in TanStack Start (Next.js pattern only)
   - Would cause confusion

2. **Dynamic imports**
   - **Rejected**: Unnecessary with proper feature detection
   - More complex than needed

3. **Server-side camera component stub**
   - **Rejected**: No benefit to rendering camera UI on server
   - Feature detection handles this cleanly

### Impact

- **Files affected**: All component files (7), all hook files (2)
- **Breaking changes**: None (removing unused directives)
- **Testing required**: Verify build succeeds, no SSR errors

---

## Research Task 4: Browser API Compatibility

### Problem Statement

Camera module relies on modern browser APIs. Need to verify compatibility across target browsers (Chrome, Safari, Firefox) and document any fallbacks needed.

### Investigation

**Target Browsers**:
- Chrome/Edge (desktop + mobile)
- Safari (desktop + iOS)
- Firefox (desktop + mobile)

### Findings

#### MediaDevices API (`getUserMedia`)

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 53+ | ✅ Full | Stable since 2016 |
| Safari 11+ | ✅ Full | iOS requires HTTPS |
| Firefox 47+ | ✅ Full | Stable since 2016 |

**Requirements**:
- HTTPS connection (required by all browsers for security)
- User permission grant
- Camera hardware available

**Fallback**: Library picker (file input) when camera unavailable

#### MediaDevices.enumerateDevices()

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 47+ | ✅ Full | |
| Safari 11+ | ✅ Full | |
| Firefox 39+ | ✅ Full | |

**Usage**: Detect multiple cameras (front/back switching)

**Fallback**: Assume single camera if enumeration fails

#### Navigator.permissions.query()

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 43+ | ✅ Full | |
| Safari 16+ | ⚠️ Limited | iOS 16+ only, macOS 13+ |
| Firefox 46+ | ✅ Full | |

**Usage**: Check camera permission state without prompting user

**Fallback**: Attempt `getUserMedia()` and handle rejection (Expo-style pattern already implements this)

#### Canvas API (Photo Capture)

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | `canvas.toBlob()` supported |
| Safari | ✅ Full | All versions |
| Firefox | ✅ Full | |

**Usage**: Capture photo from video stream with aspect ratio cropping

**No fallback needed**: Universal browser support

#### Blob & File APIs

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | |
| Safari | ✅ Full | |
| Firefox | ✅ Full | |

**Usage**:
- `URL.createObjectURL()` - Create preview URLs
- `URL.revokeObjectURL()` - Cleanup memory
- `Blob` constructor - Create file blobs
- `File` constructor - Create file objects

**No fallback needed**: Universal browser support

#### FileReader API (Library Picker)

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | |
| Safari | ✅ Full | |
| Firefox | ✅ Full | |

**Usage**: Read file from file input

**No fallback needed**: Universal browser support

### Decision

**All required browser APIs are supported across target browsers. No polyfills needed.**

### Rationale

1. **Modern browser baseline**: Chrome 53+, Safari 11+, Firefox 47+ cover >95% of users
2. **Graceful degradation**: Existing code already handles missing APIs (permission query fallback)
3. **Feature detection**: `isMediaDevicesAvailable()` checks prevent runtime errors
4. **Library picker fallback**: Users without cameras can still upload photos

### Implementation Notes

**HTTPS requirement**:
- Development: TanStack Start dev server uses `http://localhost` (exempt from HTTPS requirement)
- Production: Vercel/Firebase Hosting provides HTTPS by default

**Permission prompts**:
- First camera access triggers browser permission prompt (cannot be avoided)
- Permission state persists across sessions (user can revoke in browser settings)
- Denied permissions show clear error UI with instructions

**iOS Safari specifics**:
- Requires HTTPS for camera access (even in private mode)
- Permission query may return "prompt" instead of "undetermined" (handled by fallback)
- Front camera is default (environment camera requires user selection)

### Alternatives Considered

1. **Polyfill for permissions API**
   - **Rejected**: Fallback pattern already implemented
   - Adds bundle size with no real benefit

2. **WebRTC adapter.js for cross-browser compatibility**
   - **Rejected**: Not needed for getUserMedia (native support sufficient)
   - Modern browsers have standardized API

3. **Progressive enhancement (no-JS fallback)**
   - **Rejected**: Camera functionality requires JavaScript
   - Library picker already serves as no-camera fallback

### Impact

- **Files affected**: None (existing code is already compatible)
- **Breaking changes**: None
- **Testing required**: Manual testing on real devices (especially iOS Safari)

---

## Research Task 5: Permission API Patterns

### Problem Statement

Camera module uses Expo-style permission management with states: unknown, undetermined, granted, denied, unavailable. Need to verify this pattern works in TanStack Start and document best practices.

### Investigation

**Expo permission pattern**:
```typescript
type PermissionState =
  | "unknown"        // Initial state
  | "undetermined"   // Not yet requested
  | "granted"        // User granted
  | "denied"         // User denied
  | "unavailable"    // No hardware

const [permission, requestPermission] = useCameraPermission();
```

**Browser permission flow**:
1. Check if `navigator.permissions.query()` is available
2. If available, query current state ("granted", "denied", "prompt")
3. If unavailable, state is "unknown" until first `getUserMedia()` attempt
4. Call `getUserMedia()` to request permission (triggers browser prompt)
5. Handle success (granted) or failure (denied, not found, etc.)

### Findings

#### Current Implementation (`useCameraPermission.ts`)

The existing hook already implements the correct pattern:

```typescript
export function useCameraPermission() {
  const [state, setState] = useState<PermissionState>("unknown");

  useEffect(() => {
    if (!isMediaDevicesAvailable()) {
      setState("unavailable");
      return;
    }

    if (isPermissionQueryAvailable()) {
      // Try permission query API
      navigator.permissions
        .query({ name: "camera" as PermissionName })
        .then((result) => {
          // Map browser states to Expo-style states
          if (result.state === "granted") {
            setState("granted");
          } else if (result.state === "denied") {
            setState("denied");
          } else {
            setState("undetermined");
          }
        })
        .catch(() => {
          // Fallback if query fails
          setState("undetermined");
        });
    } else {
      // Browser doesn't support permission query
      setState("undetermined");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isMediaDevicesAvailable()) {
      return { status: "unavailable" as const };
    }

    try {
      // Attempt to access camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop()); // Cleanup
      setState("granted");
      return { status: "granted" as const };
    } catch (error) {
      const parsedError = parseMediaError(error);
      if (parsedError.code === "PERMISSION_DENIED") {
        setState("denied");
        return { status: "denied" as const };
      }
      setState("unavailable");
      return { status: "unavailable" as const };
    }
  }, []);

  return { state, requestPermission };
}
```

### Decision

**Existing permission pattern is correct. No changes needed.**

### Rationale

1. **Follows Expo conventions**: Familiar API for developers with React Native experience
2. **Graceful fallback**: Works on browsers without permission query API (Safari < 16)
3. **Clear state machine**: Each state has specific UI implications
4. **Separates permission from streaming**: Permission check doesn't trigger camera (important for UX)
5. **Comprehensive error handling**: Distinguishes between denied, unavailable, and other errors

### Permission State Mapping

| Permission State | Browser Behavior | UI Action |
|-----------------|------------------|-----------|
| `unknown` | Initial state, checking availability | Show loading |
| `undetermined` | Permission not yet requested | Show "Allow Camera" button |
| `granted` | User granted permission | Proceed to camera |
| `denied` | User denied permission | Show error + instructions |
| `unavailable` | No camera hardware | Show library picker only |

### Best Practices

**DO**:
- ✅ Check permission state before streaming (avoid unnecessary prompts)
- ✅ Provide clear UI for each permission state
- ✅ Offer library picker as fallback
- ✅ Show instructions for denied permissions
- ✅ Handle "unavailable" gracefully

**DON'T**:
- ❌ Request permission on mount (wait for user action)
- ❌ Retry permission requests repeatedly (respect user's choice)
- ❌ Show generic "camera error" (distinguish permission vs hardware issues)
- ❌ Assume permission query API is available (use fallback)

### Alternatives Considered

1. **Single "granted/denied" boolean**
   - **Rejected**: Doesn't distinguish between undetermined, denied, and unavailable
   - Worse UX (can't show appropriate messages)

2. **Browser native permission state only**
   - **Rejected**: Inconsistent across browsers
   - Safari < 16 doesn't support permission query

3. **Always call getUserMedia() to check permission**
   - **Rejected**: Triggers unnecessary permission prompts
   - Expo pattern is more user-friendly

### Impact

- **Files affected**: None (existing implementation is correct)
- **Breaking changes**: None
- **Testing required**: Manual testing of permission flow (grant, deny, revoke)

---

## Summary

### All Research Tasks Complete ✅

| Task | Status | Decision |
|------|--------|----------|
| Image rendering | ✅ | Use standard `<img>` tags (replace `next/image`) |
| shadcn components | ✅ | All installed (Switch, Select, Label) |
| SSR handling | ✅ | Remove "use client" directives, use feature detection |
| Browser compatibility | ✅ | All APIs supported (no polyfills needed) |
| Permission patterns | ✅ | Existing Expo-style pattern is correct |
| Test collocation | ✅ | Collocate tests with source files |
| Container structure | ✅ | Move CameraCapture to containers/ folder |

### Key Findings

1. **Image Solution**: Standard HTML `<img>` tags work perfectly for blob URLs (no optimization needed)
2. **Components Available**: All required shadcn/ui components already installed
3. **SSR Strategy**: Remove "use client" directives (Next.js artifact). Use feature detection (`typeof navigator !== "undefined"`)
4. **Browser Support**: Universal support for all required APIs (Chrome 53+, Safari 11+, Firefox 47+)
5. **Permission Flow**: Existing Expo-style permission pattern is production-ready
6. **Test Strategy**: Collocate tests with source files (Component.tsx → Component.test.tsx)
7. **Module Structure**: CameraCapture goes in containers/ (orchestrator component), others in components/

### Critical Migration Actions

1. ❌ **Remove all `"use client"` directives** (9 files affected)
2. 📁 **Move CameraCapture to containers/** folder
3. 📝 **Collocate all test files** with source files
4. 🖼️ **Replace `next/image`** with standard `<img>` tags

### No Blockers Identified

All technical unknowns have been resolved. Migration can proceed to Phase 1 (data model and quickstart documentation).

---

**Research Status**: COMPLETE
**Next Phase**: Phase 1 - Generate data-model.md and quickstart.md
**Last Updated**: 2025-12-30
