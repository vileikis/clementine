# Quickstart: Experience Preview Controls

**Branch**: `033-exp-preview-controls`
**Date**: 2026-01-20

## Overview

This feature refactors `ExperiencePreviewModal` to use the shared `FullscreenOverlay` component from `preview-shell`, adding viewport switching (mobile/desktop) capability.

## Prerequisites

- Node.js 20+
- pnpm 10.18.1+
- Access to the Clementine codebase

## Quick Setup

```bash
# From monorepo root
cd apps/clementine-app
pnpm dev
```

## Key Files

| File | Purpose |
|------|---------|
| `src/domains/experience/preview/containers/ExperiencePreviewModal.tsx` | Component to refactor |
| `src/shared/preview-shell/components/FullscreenOverlay.tsx` | Reusable fullscreen overlay |
| `src/shared/preview-shell/components/DeviceFrame.tsx` | Viewport-aware content frame |
| `src/shared/preview-shell/store/viewportStore.ts` | Persistent viewport state |
| `src/shared/preview-shell/context/ViewportContext.tsx` | Viewport context provider |

## Implementation Steps

### Step 1: Update Imports

```typescript
// Remove
import { Dialog, DialogContent, DialogTitle } from '@/ui-kit/ui/dialog'

// Add
import {
  FullscreenOverlay,
  DeviceFrame,
  ViewportProvider,
  useViewportStore,
} from '@/shared/preview-shell'
```

### Step 2: Add Viewport State

```typescript
export function ExperiencePreviewModal({ ... }) {
  // Add viewport state from global store
  const { mode, setMode } = useViewportStore()

  // ... existing session logic
}
```

### Step 3: Replace Dialog with FullscreenOverlay

```typescript
// Before
return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-full h-dvh ...">
      {/* content */}
    </DialogContent>
  </Dialog>
)

// After
return (
  <ViewportProvider mode={mode}>
    <FullscreenOverlay
      isOpen={open}
      onClose={handleClose}
      title="Preview Mode"
      showViewportSwitcher
      onModeChange={setMode}
    >
      <DeviceFrame>
        {/* content states */}
      </DeviceFrame>
    </FullscreenOverlay>
  </ViewportProvider>
)
```

### Step 4: Remove Custom Header

The custom header with close button is replaced by FullscreenOverlay's built-in header.

```typescript
// Remove this entire block
<div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b">
  <span className="text-sm font-medium text-muted-foreground">Preview Mode</span>
  <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
    <X className="h-4 w-4" />
    <span className="sr-only">Close preview</span>
  </Button>
</div>
```

### Step 5: Simplify Content Wrapper

```typescript
// Remove the pt-14 padding that compensated for absolute header
<div className="h-full pt-14">

// Replace with DeviceFrame content
<DeviceFrame>
  {isLoading && <LoadingState />}
  {error && <ErrorState />}
  {!isLoading && !error && steps.length === 0 && <EmptyState />}
  {isReady && steps.length > 0 && <RuntimeContent />}
</DeviceFrame>
```

## Testing

### Manual Testing Checklist

1. **Open Preview**
   - Click preview button on experience with steps
   - Verify fullscreen overlay opens
   - Verify "Preview Mode" title in header
   - Verify close (X) button visible

2. **Viewport Switching**
   - Verify viewport switcher visible in header
   - Click mobile → content shows in phone-sized frame
   - Click desktop → content fills available space
   - Close and reopen → viewport mode persists

3. **Keyboard Navigation**
   - Press Escape → overlay closes
   - Verify no keyboard traps

4. **State Preservation**
   - Switch viewport mode mid-session
   - Verify session state not lost
   - Verify step progress maintained

5. **Edge Cases**
   - Open with no steps → empty state displays
   - Session creation fails → error state displays
   - Complete experience → toast shows, modal closes

## Validation

```bash
# From apps/clementine-app
pnpm lint        # Check linting
pnpm type-check  # Check types
pnpm check       # Auto-fix format + lint
```

## Related Documentation

- [Feature Spec](./spec.md)
- [Research](./research.md)
- [Preview-Shell Module](../../apps/clementine-app/src/shared/preview-shell/README.md) (if exists)
