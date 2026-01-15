# Quickstart: Themed Experience Cards

**Feature**: 027-themed-exp-cards
**Date**: 2026-01-15

## Overview

This feature refactors `ExperienceCard` to use the guest-facing theming system and display only experience media and name.

## Prerequisites

- Node.js 20+
- pnpm 10.18.1+
- Clementine development environment set up

## Quick Start

```bash
# 1. Switch to feature branch
git checkout 027-themed-exp-cards

# 2. Install dependencies (if needed)
pnpm install

# 3. Start development server
cd apps/clementine-app
pnpm dev
```

## Development Workflow

### Files to Modify

1. **Primary**: `apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`
   - Add theme integration via `useThemeWithOverride`
   - Add `theme?: Theme` prop to interface
   - Replace hardcoded styles with theme-derived styles
   - Remove `ProfileBadge` import and usage
   - Add fallback for empty experience names

### Testing Changes

```bash
# Navigate to visual test location
# 1. Open app at http://localhost:3000
# 2. Navigate to any event with experiences attached
# 3. Open the Welcome tab to see WelcomePreview
# 4. Verify experience cards use theme colors
# 5. Change theme colors and verify cards update
```

### Run Checks Before Commit

```bash
cd apps/clementine-app
pnpm check        # Format + lint
pnpm type-check   # TypeScript
pnpm test         # Unit tests (if added)
```

## Key Implementation Points

### 1. Import Theming Utilities

```typescript
import { useThemeWithOverride, ThemedText, type Theme } from '@/shared/theming'
```

### 2. Add Theme Prop to Interface

```typescript
export interface ExperienceCardProps {
  // ... existing props
  theme?: Theme  // NEW
}
```

### 3. Use Theme Hook

```typescript
export function ExperienceCard({
  theme: themeOverride,
  // ... other props
}: ExperienceCardProps) {
  const theme = useThemeWithOverride(themeOverride)
  // ...
}
```

### 4. Apply Themed Styles

```typescript
const cardStyle: CSSProperties = {
  backgroundColor: `color-mix(in srgb, ${theme.text.color} 8%, transparent)`,
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: `color-mix(in srgb, ${theme.text.color} 15%, transparent)`,
  fontFamily: theme.fontFamily ?? undefined,
}
```

### 5. Remove ProfileBadge

```diff
- import { ProfileBadge } from '@/domains/experience/library/components/ProfileBadge'

  // In render:
- <ProfileBadge profile={experience.profile} />
```

### 6. Handle Empty Name

```typescript
const displayName = experience.name || 'Untitled Experience'
```

## Verification Checklist

- [ ] Experience cards display with theme colors (not hardcoded bg-card)
- [ ] Cards show only media thumbnail and name
- [ ] ProfileBadge is NOT displayed
- [ ] List layout works correctly
- [ ] Grid layout works correctly
- [ ] Theme changes reflect immediately in cards
- [ ] Empty media shows themed placeholder
- [ ] Empty name shows "Untitled Experience"
- [ ] Interactive mode (run) still works
- [ ] `pnpm check` passes
- [ ] `pnpm type-check` passes

## Common Issues

### "Themed components require ThemeProvider" Error

ExperienceCard must be used within a `ThemeProvider` context OR receive a `theme` prop. In WelcomePreview, this is already satisfied.

### CSS color-mix Not Rendering

Ensure you're using inline `style` prop, not className. The `color-mix()` function works at runtime with dynamic values.

## Related Documentation

- [Spec](./spec.md) - Feature requirements
- [Plan](./plan.md) - Implementation plan
- [Research](./research.md) - Technical decisions
- [Component Contract](./contracts/components.md) - Detailed API
