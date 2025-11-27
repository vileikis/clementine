# Quickstart: Responsive Steps

**Branch**: `009-responsive-steps` | **Date**: 2025-11-27

## Prerequisites

- Node.js 18+
- pnpm 8+
- Modern browser with dev tools (Chrome, Firefox, Safari)

## Setup

```bash
# From repository root
pnpm install
pnpm dev
```

The dev server runs at http://localhost:3000

## Testing Responsive Behavior

### Browser Dev Tools

1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Toggle device toolbar (Cmd+Shift+M or Ctrl+Shift+M)
3. Select device presets or set custom dimensions

### Key Viewport Sizes to Test

| Device | Width | Layout |
|--------|-------|--------|
| iPhone SE | 375px | Mobile (fixed bottom CTA) |
| iPhone 14 Pro | 393px | Mobile |
| iPhone 14 Pro Max | 430px | Mobile |
| iPad Mini | 768px | Desktop (centered) |
| Desktop | 1024px+ | Desktop |
| Large Monitor | 2560px | Desktop |

### Testing Fixed Bottom CTA (Mobile)

1. Set viewport to 375px width
2. Navigate to any step with long content
3. Scroll down - CTA should remain fixed at bottom
4. Verify safe area padding on notched device simulation

### Testing Centered Layout (Desktop)

1. Set viewport to 1920px width
2. Navigate to any step
3. Verify content is centered with ~640px max-width
4. CTA should be inline below content, not fixed

## File Locations

### Core Primitives (modify first)

```
web/src/components/step-primitives/
├── ActionBar.tsx     # NEW - create this first
├── StepLayout.tsx    # Major refactor
└── ActionButton.tsx  # Responsive sizing
```

### Step Components (modify after primitives)

```
web/src/features/steps/components/preview/steps/
├── InfoStep.tsx
├── ShortTextStep.tsx
├── LongTextStep.tsx
├── EmailStep.tsx
├── YesNoStep.tsx
├── MultipleChoiceStep.tsx
├── OpinionScaleStep.tsx
├── ExperiencePickerStep.tsx
├── CaptureStep.tsx
├── ProcessingStep.tsx
└── RewardStep.tsx
```

### CSS Custom Properties

```
web/src/app/globals.css   # Add safe area custom properties
```

## Development Workflow

### 1. Start with ActionBar Component

```tsx
// web/src/components/step-primitives/ActionBar.tsx
"use client";

import { cn } from "@/lib/utils";

interface ActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function ActionBar({ children, className }: ActionBarProps) {
  return (
    <div
      className={cn(
        // Mobile: Fixed bottom with safe area
        "fixed bottom-0 inset-x-0 p-4",
        "bg-gradient-to-t from-background via-background/95 to-transparent",
        // Desktop: Inline, no fixed positioning
        "lg:static lg:p-0 lg:bg-transparent lg:mt-6",
        className
      )}
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {children}
    </div>
  );
}
```

### 2. Update StepLayout

Add `action` prop slot and responsive container styles:

```tsx
// Key changes to StepLayout
<div className="min-h-dvh flex flex-col lg:min-h-screen lg:items-center lg:justify-center">
  <div className="flex-1 lg:flex-none lg:max-w-xl lg:w-full px-4 lg:px-6">
    {/* Media and content */}
  </div>
  {action && <ActionBar>{action}</ActionBar>}
</div>
```

### 3. Update Step Components

Change from inline CTA to action slot:

```tsx
// Before
<StepLayout mediaUrl={step.mediaUrl}>
  <div className="flex-1">{/* content */}</div>
  <div className="mt-auto pt-4">
    <ActionButton>{step.ctaLabel}</ActionButton>
  </div>
</StepLayout>

// After
<StepLayout
  mediaUrl={step.mediaUrl}
  action={step.ctaLabel && <ActionButton>{step.ctaLabel}</ActionButton>}
>
  {/* content - no need for flex-1 or mt-auto */}
</StepLayout>
```

## Validation Commands

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# All tests
pnpm test

# Build check
pnpm build
```

## Common Issues

### iOS Input Zoom

**Problem**: iOS Safari zooms page when focusing text inputs
**Solution**: Ensure all `<input>` and `<textarea>` use `text-base` (16px) minimum font size

### Content Hidden Behind Fixed CTA

**Problem**: Content at bottom of scroll is hidden by fixed action bar
**Solution**: Add `pb-20` (80px) padding to content container on mobile

### Safe Area Not Working

**Problem**: Bottom padding doesn't respect notch/home indicator
**Solution**: Ensure `viewport-fit=cover` is set in `<meta name="viewport">`

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

## Resources

- [Tailwind CSS v4 Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [CSS env() Function](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [Safe Area Insets](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Dynamic Viewport Units](https://developer.mozilla.org/en-US/docs/Web/CSS/length#dynamic_viewport_units)
