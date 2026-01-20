# Quickstart: Step List Styling Updates

**Feature**: 001-step-list-styling
**Date**: 2026-01-20

## Prerequisites

- Node.js 20+ and pnpm 10.18.1
- Repository cloned and dependencies installed

## Setup

```bash
# Navigate to the app
cd apps/clementine-app

# Install dependencies (if not already done)
pnpm install

# Start dev server
pnpm dev
```

## Testing the Feature

1. **Open the Experience Designer**
   - Navigate to an experience in the app
   - The step list is in the left sidebar

2. **Verify Category Colors in Step List**
   - Add steps of different types
   - Each step should display an icon with a colored wrapper:
     - Information steps → Grey (`muted`) background
     - Input steps → Blue (`info`) subtle background
     - Capture steps → Green (`success`) subtle background
     - Transform steps → Red (`destructive`) subtle background

3. **Verify Add Step Dialog Colors**
   - Click "Add" button
   - Each step type in the dialog should have a matching colored icon wrapper

4. **Verify Drag Behavior**
   - Hover over a step item → cursor should be pointer
   - Click and drag a step item → cursor should change to grabbing
   - Step should be draggable from anywhere on the item (no grip handle needed)
   - Release to reorder

5. **Verify Dark Mode**
   - Toggle dark mode in browser DevTools (add `dark` class to `<html>`)
   - Colors should adapt appropriately

## Files Modified

| File | Changes |
|------|---------|
| `step-utils.ts` | Added `getCategoryColorClasses()` utility |
| `StepListItem.tsx` | Colored icon wrappers, full-item drag, removed grip handle |
| `AddStepDialog.tsx` | Colored icon wrappers |
| `StepList.tsx` | Minor cleanup (removed unused import if applicable) |

## Validation Commands

```bash
# Run all checks
pnpm app:check

# Type check only
pnpm app:type-check

# Lint only
pnpm app:lint
```

## Design System Compliance

This feature uses only design system tokens:
- `muted` / `muted-foreground` for info category
- `info` / `info` with opacity for input category
- `success` / `success` with opacity for capture category
- `destructive` / `destructive` with opacity for transform category

No hard-coded colors are used. All colors adapt automatically to dark mode.
