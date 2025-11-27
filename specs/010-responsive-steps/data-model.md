# Data Model: Responsive Steps

**Branch**: `010-responsive-steps` | **Date**: 2025-11-27

## Overview

This feature is a **UI-only change** that does not modify the data model. All 11 step types and their schemas remain unchanged.

## Existing Entities (No Changes)

### Step Entity

The Step entity remains unchanged. The responsive implementation only affects how steps are rendered, not how they are stored.

**Location**: `web/src/features/steps/schemas/step.schemas.ts`

**11 Step Types** (unchanged):
1. `info` - Display-only message
2. `short_text` - Single-line text input
3. `long_text` - Multi-line textarea
4. `multiple_choice` - Selection from options
5. `yes_no` - Binary choice
6. `opinion_scale` - Numeric scale (1-5 or 1-10)
7. `email` - Email input
8. `experience-picker` - Experience selection
9. `capture` - Photo/video capture
10. `processing` - Loading/progress display
11. `reward` - Result and sharing

### Theme Entity

The Event theme configuration remains unchanged. Responsive components will continue to use the existing theme system via `useEventTheme()`.

**Location**: `web/src/features/events/schemas/event.schemas.ts`

## New UI State (No Persistence)

The responsive implementation introduces no new persisted state. All responsive behavior is determined at runtime by:

1. **Viewport width**: CSS media queries handle layout switching
2. **Safe area insets**: CSS `env()` provides device-specific values
3. **Scroll position**: Managed by browser, no state required

## Component Props Changes

### StepLayout (Enhanced Props)

```typescript
interface StepLayoutProps {
  children: React.ReactNode;
  mediaUrl?: string;
  action?: React.ReactNode;  // NEW: Slot for ActionBar content
}
```

### ActionBar (New Component)

```typescript
interface ActionBarProps {
  children: React.ReactNode;
}
```

No schema changes required. These are internal component interfaces, not data model entities.

## Summary

- **Data model changes**: None
- **Schema changes**: None
- **Firebase changes**: None
- **New entities**: None
- **New component props**: StepLayout gains `action` slot, ActionBar component created
