# Research: Experience Preview Controls

**Branch**: `033-exp-preview-controls`
**Date**: 2026-01-20

## Research Summary

This document captures technical research for refactoring `ExperiencePreviewModal` to use the shared `FullscreenOverlay` component from `preview-shell` module.

---

## Decision 1: Refactoring Approach

**Decision**: Use `FullscreenOverlay` directly instead of full `PreviewShell` wrapper

**Rationale**:
- `ExperiencePreviewModal` is already a modal/overlay - it doesn't need the 2-column layout that `PreviewShell` provides
- `FullscreenOverlay` provides exactly what's needed: fullscreen modal + viewport switcher + close button
- Simpler integration with less wrapper nesting
- Preserves existing session creation/error/loading logic without restructuring

**Alternatives Considered**:
1. **Full PreviewShell wrapper**: Would require significant restructuring and introduces unnecessary wrapper layers
2. **Custom implementation**: Current approach - rejected because it duplicates logic already in preview-shell

---

## Decision 2: Viewport State Management

**Decision**: Use `useViewportStore` from preview-shell for persistence + `ViewportProvider` for context

**Rationale**:
- Viewport preference already persists across pages (localStorage via Zustand)
- Same pattern used by ShareEditorPage, ThemeEditorPage, WelcomeEditorPage
- Single source of truth for viewport mode across all preview contexts
- Automatic synchronization when user changes preference

**Pattern**:
```typescript
// Read from global store
const { mode, setMode } = useViewportStore()

// Provide to children via context for viewport-aware rendering
<ViewportProvider mode={mode}>
  <DeviceFrame>
    {/* content */}
  </DeviceFrame>
</ViewportProvider>
```

---

## Decision 3: Layout Structure

**Decision**: Replace `Dialog` component with pure CSS overlay div + `FullscreenOverlay` pattern

**Rationale**:
- Current `Dialog` from shadcn/ui is designed for smaller modals, not fullscreen overlays
- `FullscreenOverlay` provides:
  - Fixed positioning (`fixed inset-0 z-50`)
  - Header with title, viewport switcher, close button
  - Viewport-aware content area (centered for mobile, full-width for desktop)
  - Escape key handling via `useFullscreen` hook
  - Body scroll prevention

**Current Structure** (to be replaced):
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-full h-dvh w-screen p-0 rounded-none">
    {/* Header with close button (absolute positioned) */}
    {/* Content area */}
  </DialogContent>
</Dialog>
```

**New Structure**:
```tsx
<ViewportProvider mode={mode}>
  <FullscreenOverlay
    isOpen={open}
    onClose={handleClose}
    title="Preview Mode"
    showViewportSwitcher
    onModeChange={setMode}
  >
    <DeviceFrame>
      {/* Loading/error/content states */}
    </DeviceFrame>
  </FullscreenOverlay>
</ViewportProvider>
```

---

## Decision 4: Escape Key Handling

**Decision**: Rely on `FullscreenOverlay` + `useFullscreen` hook for Escape key handling

**Rationale**:
- `useFullscreen` hook already handles Escape key to close overlay
- Removes need for manual event listener in ExperiencePreviewModal
- Consistent behavior with other preview overlays

**Note**: The current ExperiencePreviewModal relies on Dialog's built-in Escape handling. With FullscreenOverlay, we need to ensure the `useFullscreen` hook is properly integrated or Escape handling is added to FullscreenOverlay.

**Finding**: FullscreenOverlay does NOT currently handle Escape internally - it expects the parent to use `useFullscreen` hook. The ExperiencePreviewModal should use `useFullscreen` or add Escape handling.

---

## Decision 5: Content Rendering in DeviceFrame

**Decision**: Wrap runtime content in `DeviceFrame` for viewport-aware sizing

**Rationale**:
- `DeviceFrame` automatically adjusts dimensions based on viewport mode:
  - Mobile: Fixed 375x667px (iPhone SE dimensions)
  - Desktop: Full width, flexible height (min 600px)
- Provides consistent visual frame with border, shadow, rounded corners
- Same styling as other preview components

**Content Structure**:
```tsx
<DeviceFrame>
  {/* Loading state */}
  {isLoading && <LoadingSpinner />}

  {/* Error state */}
  {error && <ErrorMessage />}

  {/* Empty state */}
  {!isLoading && !error && steps.length === 0 && <EmptyState />}

  {/* Runtime content */}
  {isReady && steps.length > 0 && (
    <ThemeProvider theme={previewTheme}>
      <ExperienceRuntime {...} />
    </ThemeProvider>
  )}
</DeviceFrame>
```

---

## Decision 6: Preserving Existing Functionality

**Decision**: Keep all existing session/loading/error logic unchanged

**Rationale**:
- Session creation logic (`useCreateSession`, `useSubscribeSession`) is working correctly
- Error handling and toast notifications are well-implemented
- Only the UI wrapper/layout changes, not the business logic

**Preserved Logic**:
- Ghost project fetching
- Session creation on modal open
- Session subscription for real-time updates
- Reset state on modal close
- Completion toast and auto-close
- Error toast on runtime errors

---

## Existing Component Analysis

### FullscreenOverlay Props

```typescript
interface FullscreenOverlayProps {
  isOpen: boolean           // Controls visibility
  onClose: () => void       // Close callback
  children: React.ReactNode // Content to render
  title?: string            // Header title (default: "Preview")
  showViewportSwitcher?: boolean  // Show mobile/desktop toggle
  onModeChange?: (mode: ViewportMode) => void  // Viewport change callback
  className?: string        // Additional styling
}
```

### DeviceFrame Props

```typescript
interface DeviceFrameProps {
  children: React.ReactNode
  className?: string
}
```

### ViewportStore Interface

```typescript
interface ViewportStore {
  mode: ViewportMode  // 'mobile' | 'desktop'
  setMode: (mode: ViewportMode) => void
  toggle: () => void
}
```

---

## Integration Checklist

Based on research, the implementation should:

1. ✅ Import `FullscreenOverlay`, `DeviceFrame`, `ViewportProvider` from `@/shared/preview-shell`
2. ✅ Import `useViewportStore` for persistent viewport state
3. ✅ Remove `Dialog`, `DialogContent`, `DialogTitle` imports
4. ✅ Remove custom fullscreen CSS classes (`max-w-full h-dvh w-screen p-0 rounded-none`)
5. ✅ Remove absolute-positioned header in favor of FullscreenOverlay header
6. ✅ Wrap content in `ViewportProvider` → `FullscreenOverlay` → `DeviceFrame`
7. ✅ Pass `showViewportSwitcher={true}` and `onModeChange` to enable viewport switching
8. ✅ Preserve all session creation/error handling logic
9. ✅ Test Escape key closes modal
10. ✅ Test viewport switching works and persists

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Layout breaks in mobile view | Low | Medium | Test thoroughly on mobile viewport |
| Session state lost on viewport switch | Low | High | DeviceFrame only affects sizing, not React tree |
| Escape key doesn't work | Medium | Low | Add manual handler if needed |
| Theme not applied correctly | Low | Medium | ThemeProvider already wraps content |

---

## Conclusion

The refactoring is straightforward with low risk. All necessary components exist in `preview-shell` module. The main work is replacing the Dialog wrapper with FullscreenOverlay and integrating viewport state management. No new components need to be created.
