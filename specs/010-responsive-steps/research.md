# Research: Responsive Steps

**Branch**: `010-responsive-steps` | **Date**: 2025-11-27

## Research Topics

### 1. CSS Safe Area Insets for Mobile Devices

**Decision**: Use CSS `env()` function with safe-area-inset variables

**Rationale**:
- Native CSS solution supported by all modern browsers (Safari 11.1+, Chrome 69+, Firefox 63+)
- Works with iOS notch devices (iPhone X and later)
- Works with Android devices with navigation gestures
- No JavaScript required, pure CSS implementation
- Fallback value ensures compatibility with older devices

**Implementation**:
```css
/* In globals.css */
:root {
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
}

/* Custom utility class */
.pb-safe {
  padding-bottom: max(1rem, var(--safe-area-inset-bottom));
}
```

**Alternatives Considered**:
- JavaScript-based detection: Rejected - unnecessary complexity, CSS solution sufficient
- Fixed padding values: Rejected - doesn't adapt to actual device safe areas

---

### 2. Dynamic Viewport Height (dvh) Units

**Decision**: Use `min-h-dvh` with `min-h-screen` fallback

**Rationale**:
- `dvh` accounts for mobile browser chrome (address bar, toolbar)
- Prevents content being hidden behind mobile browser UI
- Supported in all modern browsers (Safari 15.4+, Chrome 108+, Firefox 108+)
- Fallback to `vh` ensures older browser support

**Implementation**:
```css
/* Tailwind CSS v4 supports dvh units natively */
.min-h-dvh {
  min-height: 100dvh;
}

/* Fallback for older browsers */
@supports not (min-height: 100dvh) {
  .min-h-dvh {
    min-height: 100vh;
  }
}
```

**Alternatives Considered**:
- JavaScript viewport height calculation: Rejected - CSS solution more performant
- Fixed 100vh: Rejected - causes content clipping on mobile browsers

---

### 3. Fixed Bottom Action Bar Pattern

**Decision**: Use CSS position fixed with responsive override

**Rationale**:
- Common mobile app pattern (iOS, Android native apps)
- Keeps primary CTA accessible at all times during scroll
- Gradient background maintains visibility over content
- Responsive breakpoint switches to inline on desktop

**Implementation**:
```tsx
// ActionBar component
<div className="
  fixed bottom-0 inset-x-0 p-4 pb-safe
  bg-gradient-to-t from-background via-background/95 to-transparent
  lg:static lg:p-0 lg:bg-transparent lg:mt-6
">
  {children}
</div>
```

**Alternatives Considered**:
- Sticky positioning: Rejected - doesn't provide same mobile app feel
- Always inline: Rejected - poor mobile UX, CTA hidden when scrolling long content

---

### 4. Tailwind CSS v4 Responsive Breakpoints

**Decision**: Use `lg:` (1024px) as primary mobile/desktop breakpoint

**Rationale**:
- Aligns with spec requirement (desktop >= 1024px)
- Tailwind v4 breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Mobile-first approach: base styles are mobile, `lg:` adds desktop overrides
- Tablet devices (768px-1023px) receive desktop layout per spec

**Implementation**:
```tsx
// Mobile-first with lg: desktop override
<div className="
  w-full px-4                    // Mobile: full width, 16px padding
  lg:max-w-xl lg:mx-auto lg:px-6 // Desktop: 640px max, centered, 24px padding
">
```

**Alternatives Considered**:
- `md:` breakpoint (768px): Rejected - would apply desktop layout to small tablets
- Custom breakpoint: Rejected - standard Tailwind breakpoints sufficient

---

### 5. iOS Input Zoom Prevention

**Decision**: Ensure all text inputs use minimum 16px font size

**Rationale**:
- iOS Safari zooms page when focusing inputs with font-size < 16px
- This zoom disrupts user experience and fixed positioning
- Using `text-base` (16px) prevents this behavior
- No impact on desktop experience

**Implementation**:
```tsx
// TextInput and TextArea components
<input className="text-base ..." />  // 16px font prevents iOS zoom
<textarea className="text-base ..." />
```

**Alternatives Considered**:
- `user-scalable=no` meta tag: Rejected - accessibility concern, prevents all zoom
- Transform scale hack: Rejected - complex, affects layout calculations

---

### 6. Scroll Behavior with Fixed Elements

**Decision**: Use flex layout with overflow-y-auto on content container

**Rationale**:
- Content area needs independent scroll from fixed action bar
- Flex layout with `flex-1` allows content to fill available space
- `-webkit-overflow-scrolling: touch` for smooth momentum scrolling on iOS
- Natural scroll behavior on desktop (no fixed elements)

**Implementation**:
```tsx
// StepLayout structure
<div className="min-h-dvh flex flex-col lg:min-h-screen lg:items-center lg:justify-center">
  <div className="flex-1 overflow-y-auto lg:overflow-visible lg:flex-none">
    {/* Scrollable content */}
  </div>
  <ActionBar>{cta}</ActionBar>  // Fixed on mobile, inline on desktop
</div>
```

**Alternatives Considered**:
- Body scroll with position:sticky: Rejected - complex interaction with safe areas
- JavaScript scroll management: Rejected - unnecessary complexity

---

### 7. Responsive Grid Layouts

**Decision**: Use CSS Grid with responsive column counts

**Rationale**:
- CSS Grid provides clean responsive layout control
- Tailwind's `grid-cols-*` utilities with breakpoint prefixes
- Maintains consistent gap spacing across breakpoints
- Works well with variable content counts

**Implementation**:
```tsx
// ExperiencePickerStep grid
<div className="grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-3">
  {experiences.map(...)}
</div>

// MultipleChoiceStep (>4 options)
<div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
  {options.map(...)}
</div>
```

**Alternatives Considered**:
- Flexbox with wrapping: Viable but Grid provides more control
- CSS columns: Rejected - doesn't maintain item order as expected

---

## Browser Compatibility Matrix

| Feature | Safari | Chrome | Firefox | Edge |
|---------|--------|--------|---------|------|
| Safe area insets | 11.1+ | 69+ | 63+ | 79+ |
| dvh units | 15.4+ | 108+ | 108+ | 108+ |
| CSS Grid | 10.1+ | 57+ | 52+ | 16+ |
| Tailwind v4 | ✓ | ✓ | ✓ | ✓ |

All target browsers for Clementine (modern mobile and desktop) support required features.

---

## Existing Codebase Patterns

### Current StepLayout Implementation
- Uses flex column with optional hero media
- Content padding is fixed at `p-4`
- No responsive breakpoints currently
- CTA positioned with `mt-auto` (pushes to bottom of flex container)

### Current ActionButton Implementation
- Full width (`w-full`)
- Fixed sizing (`px-6 py-3`)
- Theme-aware colors
- 44px minimum height for touch target

### Current Step Components Pattern
```tsx
<StepLayout mediaUrl={step.mediaUrl}>
  <div className="flex-1">
    {/* Content */}
  </div>
  {step.ctaLabel && (
    <div className="mt-auto pt-4">
      <ActionButton>{step.ctaLabel}</ActionButton>
    </div>
  )}
</StepLayout>
```

This pattern will be updated to:
```tsx
<StepLayout mediaUrl={step.mediaUrl} action={
  step.ctaLabel && <ActionButton>{step.ctaLabel}</ActionButton>
}>
  {/* Content - no need for flex-1 or mt-auto, handled by StepLayout */}
</StepLayout>
```

---

## Summary

All technical unknowns have been resolved:

1. **Safe areas**: CSS `env()` with custom utility class
2. **Viewport height**: `dvh` units with `vh` fallback
3. **Fixed bottom bar**: Position fixed with lg: responsive override
4. **Breakpoints**: `lg:` (1024px) for desktop, mobile-first default
5. **iOS zoom**: Minimum 16px font on inputs
6. **Scroll behavior**: Flex layout with overflow-y-auto
7. **Responsive grids**: CSS Grid with Tailwind utilities

No clarifications needed. Ready for Phase 1 design artifacts.
