# Feature: Responsive Steps

## Overview

Make the Steps feature (`web/src/features/steps/`) fully responsive to render appropriately on both mobile and desktop devices. The goal is to provide distinct but cohesive user experiences optimized for each platform.

## Problem Statement

Currently, step components are designed primarily for a fixed preview frame (375px mobile, 900px desktop). When used in the actual guest runtime across real devices, they need proper responsive behavior that adapts to:

- Various mobile screen sizes (320px - 428px width)
- Tablet sizes (768px - 1024px)
- Desktop sizes (1024px+)
- Large displays (24"+ monitors)

## Design Philosophy

### Mobile: Native App-Like Experience

The mobile experience should feel like a native mobile app:

- **Fixed bottom actions**: CTAs and action buttons pinned to the bottom of the viewport
- **Content flows top-down**: Main content starts from the top and scrolls naturally
- **Full-width utilization**: Content uses the full screen width with appropriate padding
- **Thumb-friendly**: Primary actions within easy thumb reach at the bottom
- **Safe areas**: Respect device safe areas (notches, home indicators)

### Desktop: Typeform-Style Centered Experience

The desktop experience should be focused and centered:

- **Centered content container**: Content in the center of the viewport
- **Max-width constraint**: Limit content width (max 640px-720px) to prevent stretching on large screens
- **Vertical centering**: Content and CTA grouped close together, vertically centered
- **Comfortable reading width**: Optimal line length for readability
- **Generous whitespace**: Use empty space to focus attention

## Specifications

### Breakpoints

```
Mobile:    < 768px   (sm breakpoint)
Tablet:    768px - 1023px (md breakpoint)
Desktop:   >= 1024px (lg breakpoint)
```

### Mobile Layout

```
┌─────────────────────────────────┐
│ [Logo/Header]                   │  ← Optional, fixed top
├─────────────────────────────────┤
│                                 │
│ [Hero Media - if present]       │  ← Scrollable content area
│                                 │
│ [Title]                         │
│ [Description]                   │
│                                 │
│ [Step-specific content]         │
│ - Form inputs                   │
│ - Options                       │
│ - Media                         │
│                                 │
│         (scrollable)            │
│                                 │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │  ← Fixed bottom container
│ │    [Primary CTA Button]     │ │    with safe-area padding
│ └─────────────────────────────┘ │
│         [Secondary actions]     │
└─────────────────────────────────┘
```

**Mobile Specifications:**

- Content padding: `px-4` (16px sides)
- Bottom action bar: Fixed position, `pb-safe` for safe area
- Action bar background: Subtle gradient or blur for scroll visibility
- CTA button: Full width minus padding
- Min touch targets: 44px height
- Content scroll: Natural overflow with momentum scrolling

### Desktop Layout

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                                                                  │
│              ┌────────────────────────────────┐                  │
│              │                                │                  │
│              │   [Hero Media - if present]    │                  │
│              │                                │                  │
│              │   [Title]                      │                  │
│              │   [Description]                │                  │
│              │                                │                  │
│              │   [Step-specific content]      │                  │
│              │                                │                  │
│              │   ┌────────────────────────┐   │                  │
│              │   │   [Primary CTA Button] │   │                  │
│              │   └────────────────────────┘   │                  │
│              │                                │                  │
│              └────────────────────────────────┘                  │
│                         max-width: 640px                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Desktop Specifications:**

- Container: `max-w-xl` (640px) or `max-w-2xl` (672px)
- Horizontal centering: `mx-auto`
- Vertical centering: Flexbox center or `min-h-screen` with centering
- Content padding: `px-6` to `px-8` (24-32px sides)
- CTA button: Inline with content, not fixed
- Generous vertical spacing between sections

### Component-Specific Responsive Behavior

#### StepLayout (Base Container)

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Width | 100% | max-w-xl mx-auto |
| Min Height | 100dvh | min-h-screen |
| Padding | px-4 pt-4 pb-0 | px-6 py-8 |
| Content alignment | Flex column | Flex column, centered |
| CTA placement | Fixed bottom | Inline, below content |

#### ActionButton (CTA)

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Width | Full width (w-full) | Auto width (min-w-[200px]) or full |
| Position | Fixed in bottom bar | Static, inline with content |
| Size | Large (py-4) | Medium (py-3) |

#### TextInput / TextArea

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Width | Full width | Full width (within container) |
| Font size | 16px min (prevent iOS zoom) | 16px |
| Padding | px-4 py-3 | px-4 py-3 |

#### MultipleChoice Options

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Layout | Single column (space-y-2) | 2 columns if > 4 options |
| Button width | Full width | Auto, equal sizing |

#### OpinionScale

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Layout | Flex wrap | Flex row, no wrap |
| Button size | 44x44px | 48x48px |
| Spacing | gap-2 | gap-3 |

#### ExperiencePicker

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Grid layout | 2 columns | 3 columns |
| List layout | Full width stack | Full width stack |
| Carousel | Horizontal scroll | Horizontal scroll or grid |

#### Reward/Result

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Image width | ~70% centered | ~50% centered, max 300px |
| Share buttons | 3-column grid | Inline row |
| Social buttons | Flex wrap | Inline row |

#### Processing

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Spinner size | 48px | 64px |
| Progress bar | 80% width | 60% width, max 400px |

### Implementation Approach

#### 1. Update StepLayout Primitive

Create a responsive wrapper that handles the fundamental mobile vs desktop layout:

```tsx
// Pseudo-code structure
<div className="min-h-dvh lg:min-h-screen flex flex-col lg:items-center lg:justify-center">
  {/* Content container */}
  <div className="flex-1 lg:flex-none lg:max-w-xl lg:w-full">
    {/* Scrollable content area */}
    <div className="flex-1 overflow-y-auto lg:overflow-visible px-4 lg:px-6">
      {children}
    </div>
  </div>

  {/* Mobile: Fixed bottom bar */}
  {/* Desktop: Inline with content */}
  <div className="fixed bottom-0 left-0 right-0 lg:static lg:mt-6">
    {actionSlot}
  </div>
</div>
```

#### 2. Create ActionBar Component

New component for the fixed bottom action area on mobile:

```tsx
// Mobile: Fixed with safe area padding
// Desktop: Static inline container
<div className="
  fixed bottom-0 inset-x-0 p-4 pb-safe bg-gradient-to-t from-background
  lg:static lg:p-0 lg:bg-transparent
">
  {children}
</div>
```

#### 3. Update Individual Step Components

Each step component needs responsive adjustments:

- Use responsive Tailwind classes (`lg:` prefix for desktop)
- Move CTA to ActionBar slot on mobile
- Adjust spacing and sizing per breakpoint

#### 4. CSS Custom Properties for Safe Areas

```css
:root {
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
}

.pb-safe {
  padding-bottom: max(1rem, var(--safe-area-inset-bottom));
}
```

### Files to Modify

**Core Primitives:**
- `web/src/components/step-primitives/StepLayout.tsx` - Major refactor for responsive container
- `web/src/components/step-primitives/ActionButton.tsx` - Responsive sizing

**New Components:**
- `web/src/components/step-primitives/ActionBar.tsx` - Fixed bottom container for mobile

**Step Components (all need responsive updates):**
- `web/src/features/steps/components/preview/steps/InfoStep.tsx`
- `web/src/features/steps/components/preview/steps/ShortTextStep.tsx`
- `web/src/features/steps/components/preview/steps/LongTextStep.tsx`
- `web/src/features/steps/components/preview/steps/MultipleChoiceStep.tsx`
- `web/src/features/steps/components/preview/steps/YesNoStep.tsx`
- `web/src/features/steps/components/preview/steps/OpinionScaleStep.tsx`
- `web/src/features/steps/components/preview/steps/EmailStep.tsx`
- `web/src/features/steps/components/preview/steps/ExperiencePickerStep.tsx`
- `web/src/features/steps/components/preview/steps/CaptureStep.tsx`
- `web/src/features/steps/components/preview/steps/ProcessingStep.tsx`
- `web/src/features/steps/components/preview/steps/RewardStep.tsx`

**Preview System:**
- `web/src/features/steps/components/preview/DeviceFrame.tsx` - May need updates for testing responsive behavior

### Accessibility Considerations

- Maintain 44px minimum touch targets on all interactive elements
- Ensure proper focus management when layout changes
- Keyboard navigation should work identically across breakpoints
- Screen reader announcements should be consistent
- Respect `prefers-reduced-motion` for any animations

### Testing Requirements

1. **Device Testing:**
   - iPhone SE (375px) - smallest supported
   - iPhone 14/15 Pro (393px) - common size
   - iPhone 14/15 Pro Max (430px) - large phone
   - iPad Mini (768px) - tablet
   - Desktop 1920px - standard desktop
   - Desktop 2560px+ - large monitor

2. **Orientation:**
   - Portrait (primary for mobile)
   - Landscape (should work, not optimized)

3. **Safe Areas:**
   - Notched devices (iPhone X+)
   - Home indicator devices
   - Android navigation bar variants

4. **Interaction Testing:**
   - Touch interactions on mobile
   - Mouse/keyboard on desktop
   - Form input focus and virtual keyboard behavior

### Success Criteria

- [ ] Mobile layout matches app-like design with fixed bottom CTAs
- [ ] Desktop layout is centered with max-width constraint
- [ ] All 11 step types render correctly on both layouts
- [ ] No horizontal scroll on any device
- [ ] Touch targets meet 44px minimum
- [ ] Safe areas respected on all devices
- [ ] Forms don't trigger unwanted zoom on iOS
- [ ] Smooth transitions when resizing (not required, but nice-to-have)
- [ ] Theme colors apply correctly on both layouts

### Out of Scope

- Tablet-specific optimizations (will use mobile or desktop based on width)
- Landscape-specific layouts
- Animation/transition between mobile and desktop
- Responsive preview in Journey Editor (existing preview system is separate)

### Dependencies

- Tailwind CSS v4 responsive utilities
- CSS `env()` for safe area insets
- `dvh` unit support (fallback to `vh`)

### Timeline Estimate

This is a medium-complexity refactor touching core primitives and all step components. Recommend implementing in phases:

1. **Phase 1**: StepLayout + ActionBar primitives
2. **Phase 2**: Simple steps (info, short_text, email, yes_no)
3. **Phase 3**: Complex steps (multiple_choice, opinion_scale, experience_picker)
4. **Phase 4**: Special steps (capture, processing, reward)
5. **Phase 5**: Testing and polish

---

## References

- [Typeform Design](https://www.typeform.com/) - Desktop centered form inspiration
- [Apple HIG - Layout](https://developer.apple.com/design/human-interface-guidelines/layout) - Mobile safe areas
- [Material Design - Responsive Layout](https://m3.material.io/foundations/layout/understanding-layout) - Breakpoint guidance
