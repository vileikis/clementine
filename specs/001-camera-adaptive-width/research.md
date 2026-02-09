# Research: Camera Adaptive Width

**Branch**: `001-camera-adaptive-width`
**Date**: 2026-02-09
**Purpose**: Document technical research and decisions for two-zone adaptive camera layout

## Research Topics

### 1. CSS Object-Fit Contain vs Cover Behavior

**Decision**: Use `object-fit: contain` for camera view

**Rationale**:
- `contain` preserves entire aspect ratio, showing letterboxing (black bars) when needed
- `cover` would crop the image to fill the container, losing content
- User requirement explicitly states "contain behavior" to show black bars

**Alternatives Considered**:
- `object-fit: cover` - Rejected: crops content unexpectedly
- Manual aspect ratio calculations - Rejected: CSS `aspect-ratio` property handles this natively

### 2. Safe-Area Inset Handling on iOS

**Decision**: Use CSS `env(safe-area-inset-bottom)` with fallback

**Rationale**:
- Native CSS solution supported by all modern browsers
- Provides fallback for devices without notch/home indicator
- No JavaScript needed

**Implementation**:
```css
padding-bottom: env(safe-area-inset-bottom, 1rem);
```

**Alternatives Considered**:
- JavaScript-based detection - Rejected: Adds complexity, CSS solution is sufficient
- React Native SafeAreaView patterns - Not applicable: This is a web app

### 3. Flexbox Two-Zone Layout Pattern

**Decision**: Use `flex-1 min-h-0` for preview zone + fixed padding for controls

**Rationale**:
- `flex-1` fills remaining vertical space after controls
- `min-h-0` prevents flex children from overflowing when content is larger than available space
- Fixed controls height ensures consistent UX across states

**Pattern**:
```tsx
<div className="flex flex-col h-full">
  {/* Preview Zone - fills remaining space */}
  <div className="flex-1 min-h-0 flex items-center justify-center">
    {/* Content with aspect-ratio constraint */}
  </div>

  {/* Controls Zone - fixed height */}
  <div className="py-6 pb-[env(safe-area-inset-bottom,1.5rem)]">
    {/* Controls */}
  </div>
</div>
```

### 4. Aspect Ratio CSS Property Support

**Decision**: Use native CSS `aspect-ratio` property

**Rationale**:
- Supported by all target browsers (iOS 15+, Chrome 88+, Safari 15+)
- Cleaner than padding-based aspect ratio hacks
- Already used in existing components

**Browser Support** (verified):
- iOS Safari: 15+ ✅
- Chrome Android: 88+ ✅
- Desktop browsers: All modern versions ✅

### 5. CameraView Component Modifications

**Decision**: CameraView already supports aspect ratio; container styling needs adjustment

**Findings from code review**:
- CameraView accepts `aspectRatio` prop and applies CSS `aspect-ratio`
- Video element uses `object-cover` (fills container)
- Container needs `bg-black` to show letterboxing

**No modifications needed to CameraView** - the layout changes are in the parent components (CameraActive, PhotoPreview).

### 6. Orientation Change Handling

**Decision**: CSS flexbox automatically handles orientation changes

**Rationale**:
- Flexbox recalculates on viewport resize
- No JavaScript resize listeners needed
- CSS `aspect-ratio` + `max-width/max-height: 100%` naturally adapts

**Testing Required**:
- iPhone portrait → landscape
- iPad rotation
- Desktop window resize

### 7. Photo Review vs Camera Active Styling Difference

**Decision**: Photo Review removes black container styling, uses transparent background

**Rationale** (from requirements):
- "Review looks cleaner than capture state (no black rounded box)"
- Maintains visual alignment through consistent padding/margins
- Photo itself provides visual boundary

**Implementation**:
- CameraActive: `<div className="bg-black rounded-2xl">` container
- PhotoPreview: No container styling, direct image with `object-contain`

### 8. UploadProgress Layout Consistency

**Decision**: Align UploadProgress with same two-zone pattern

**Current State**:
- Uses centered column layout (`flex-col items-center gap-6`)
- Photo preview with overlay

**Target State**:
- Same two-zone layout as other states
- Preview zone contains photo with overlay
- No controls zone (loading state has no actions)

## Dependencies & Patterns

### Existing Patterns to Preserve

1. **ASPECT_RATIO_CSS mapping** - Already standardized across components:
   ```typescript
   const ASPECT_RATIO_CSS: Record<ExperienceAspectRatio, string> = {
     '1:1': '1 / 1',
     '9:16': '9 / 16',
     '3:2': '3 / 2',
     '2:3': '2 / 3',
   }
   ```

2. **ThemedButton/ThemedIconButton** - Continue using for controls

3. **Tailwind utilities** - All styling via Tailwind classes

### Design System Compliance

**Allowed**:
- `bg-black` - Standard Tailwind color for camera container (appropriate semantic use)
- Arbitrary values for layout: `pb-[env(safe-area-inset-bottom,1.5rem)]`

**Required**:
- Use `text-foreground`, `bg-background` for standard UI elements
- ThemedButton/ThemedIconButton maintain their existing theme integration

## Summary

All unknowns resolved. Implementation can proceed with:
1. CSS flexbox two-zone layout
2. Native CSS `aspect-ratio` and `object-fit: contain`
3. CSS `env()` for safe-area handling
4. No new dependencies required
5. No modifications to CameraView component
