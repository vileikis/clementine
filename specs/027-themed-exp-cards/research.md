# Research: Themed Experience Cards

**Feature**: 027-themed-exp-cards
**Date**: 2026-01-15

## Research Topics

### 1. Guest-Facing Theming System Architecture

**Question**: How does the existing theming system work and how should ExperienceCard integrate with it?

**Findings**:

The codebase has two distinct theming systems:
1. **Admin UI Design System** (`src/ui-kit/theme/`) - Uses CSS variables and Tailwind tokens for the admin dashboard
2. **Guest-Facing Theming** (`src/shared/theming/`) - Dynamic runtime theming for guest experiences

For this feature, we use the **Guest-Facing Theming** system because ExperienceCard appears in the WelcomePreview which is a guest-facing context.

**Key Components**:
- `ThemeProvider` - Provides theme context to component tree
- `useThemeWithOverride(themeOverride?: Theme)` - Hook to access theme, supports prop override
- `ThemedText` - Typography primitive with theme-aware colors
- `ThemedButton` - Button primitive with theme-aware styling
- `ThemedSelectOption` - Selection option with theme-aware colors

**Theme Structure** (from `themeSchema`):
```typescript
{
  fontFamily: string | null,
  primaryColor: string,        // e.g., "#3B82F6"
  text: {
    color: string,             // e.g., "#1E1E1E"
    alignment: 'left' | 'center' | 'right'
  },
  button: {
    backgroundColor: string | null,  // Falls back to primaryColor
    textColor: string,
    radius: 'square' | 'rounded' | 'pill'
  },
  background: {
    color: string,
    image: MediaReference | null,
    overlayOpacity: number
  }
}
```

**Decision**: Use `useThemeWithOverride` hook to access theme and apply inline styles for dynamic coloring.

**Rationale**: This matches the pattern used by all other themed primitives (ThemedText, ThemedButton, ThemedSelectOption).

**Alternatives Considered**:
- Creating a new ThemedCard primitive → Rejected: Over-engineering for single use case
- Using CSS variables at runtime → Rejected: Current system uses inline styles for simplicity

---

### 2. Card Styling Pattern for Theme Integration

**Question**: How should ExperienceCard apply theme colors while maintaining layout flexibility?

**Findings**:

Analyzed existing themed components for patterns:

**ThemedSelectOption Pattern** (most similar to card):
```tsx
const style: CSSProperties = selected
  ? {
      backgroundColor: theme.primaryColor,
      color: theme.button.textColor,
      borderColor: theme.primaryColor,
      borderRadius,
      fontFamily: theme.fontFamily ?? undefined,
    }
  : {
      backgroundColor: 'transparent',
      color: theme.text.color,
      borderColor: `color-mix(in srgb, ${theme.text.color} 30%, transparent)`,
      borderRadius,
      fontFamily: theme.fontFamily ?? undefined,
    }
```

**Key Techniques**:
1. Use `color-mix()` CSS function for semi-transparent variants
2. Apply theme colors via `style` prop, not className
3. Use Tailwind for layout/spacing, inline styles for colors
4. Support `fontFamily` from theme

**Decision**: Apply themed styling pattern to ExperienceCard:
- Card background: Semi-transparent based on text color (`color-mix(in srgb, ${theme.text.color} 10%, transparent)`)
- Card border: Semi-transparent based on text color (`color-mix(in srgb, ${theme.text.color} 20%, transparent)`)
- Card text: Use `ThemedText` component or direct `theme.text.color`
- Interactive state: Use theme primary color for hover/focus effects

**Rationale**: Maintains consistency with other themed components while allowing cards to be subtle and not overpower the content.

**Alternatives Considered**:
- Use primaryColor for card background → Rejected: Too visually heavy, cards should be subtle
- Remove borders entirely → Rejected: Cards need visual definition in various background contexts

---

### 3. Content Simplification Strategy

**Question**: What content should be displayed and what should be removed?

**Findings**:

**Current ExperienceCard Content**:
1. Media thumbnail (image or placeholder)
2. Experience name
3. ProfileBadge component (showing freeform/survey/story badge)

**Spec Requirement (FR-002)**:
> ExperienceCard component MUST display only the experience media thumbnail and experience name - no profile badge, no metadata.

**Decision**:
- Keep: Media thumbnail, Experience name
- Remove: ProfileBadge import and usage
- Add: Fallback text "Untitled Experience" for empty names

**Rationale**: Cleaner guest-facing display focuses on essential information. Profile type is admin metadata not relevant to guests.

---

### 4. Theme Prop for Preview/Testing Flexibility

**Question**: Should ExperienceCard accept a `theme` prop override like other themed components?

**Findings**:

All themed primitives follow this pattern:
```tsx
interface ThemedComponentProps {
  // ... other props
  theme?: Theme  // Optional override
}

function ThemedComponent({ theme: themeOverride, ...props }) {
  const theme = useThemeWithOverride(themeOverride)
  // ...
}
```

This allows:
1. Normal usage within ThemeProvider (context)
2. Preview/testing without ThemeProvider (prop)
3. Storybook/isolated testing

**Decision**: Add optional `theme` prop to ExperienceCard interface.

**Rationale**: Consistency with existing patterns and enables isolated testing.

---

### 5. Accessibility Considerations

**Question**: How to maintain accessibility with dynamic theme colors?

**Findings**:

**Current Accessibility Features**:
- Button element for interactive mode with keyboard handlers
- ARIA attributes inherited from native button

**Theme Accessibility Considerations**:
- Contrast is determined by creator's theme configuration
- System does not enforce contrast (per edge case in spec)
- Touch targets maintained via existing `min-h-[48px]` in ThemedSelectOption

**Decision**:
- Maintain existing keyboard interaction patterns
- Add `min-h-[44px]` to ensure touch targets (per Constitution Principle I)
- Trust creator's theme for contrast (validation is separate concern)

**Rationale**: Constitution mandates 44x44px minimum touch targets. Contrast validation is handled separately in theme editor.

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Theming Integration | Use `useThemeWithOverride` hook | Matches existing primitives pattern |
| Card Background | Semi-transparent via `color-mix()` | Subtle appearance, consistent with ThemedSelectOption |
| Card Text | Use `ThemedText` or `theme.text.color` | Leverage existing primitives |
| Content | Media + Name only | Spec requirement FR-002 |
| Theme Prop | Add optional `theme?: Theme` | Consistency and testing flexibility |
| Touch Targets | Minimum 44x44px | Constitution Principle I |

## Dependencies Verified

- ✅ `useThemeWithOverride` - Available in `@/shared/theming`
- ✅ `ThemedText` - Available in `@/shared/theming`
- ✅ `Theme` type - Available in `@/shared/theming`
- ✅ CSS `color-mix()` - Supported in all modern browsers
