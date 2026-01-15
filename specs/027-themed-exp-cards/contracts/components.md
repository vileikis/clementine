# Component Contracts: Themed Experience Cards

**Feature**: 027-themed-exp-cards
**Date**: 2026-01-15

## ExperienceCard Component

### Location

`apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx`

### Interface (Updated)

```typescript
import type { Experience } from '@/domains/experience/shared'
import type { Theme } from '@/shared/theming'

export interface ExperienceCardProps {
  /** Experience data to display */
  experience: Experience

  /**
   * Layout mode - affects card dimensions and arrangement
   * - list: Full width, horizontal layout (thumbnail left, name right)
   * - grid: 50% width, vertical layout (thumbnail top, name bottom)
   */
  layout: 'list' | 'grid'

  /**
   * Display mode
   * - edit: Non-interactive, shows enabled state
   * - run: Interactive, calls onClick
   */
  mode: 'edit' | 'run'

  /** Whether experience is enabled (affects opacity in edit mode) */
  enabled?: boolean

  /** Click handler (only used in run mode) */
  onClick?: () => void

  /** Theme override for use without ThemeProvider */
  theme?: Theme  // NEW: Added for consistency with themed primitives
}
```

### Visual Contract

#### Card Container

| Property | List Layout | Grid Layout |
|----------|-------------|-------------|
| Direction | `flex-row` | `flex-col` |
| Gap | `gap-3` (12px) | `gap-3` (12px) |
| Padding | `p-3` (12px) | `p-3` (12px) |
| Min Height | 44px | Auto |
| Border Radius | `rounded-lg` (8px) | `rounded-lg` (8px) |

#### Themed Styles (via inline `style` prop)

```typescript
const cardStyle: CSSProperties = {
  backgroundColor: `color-mix(in srgb, ${theme.text.color} 8%, transparent)`,
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: `color-mix(in srgb, ${theme.text.color} 15%, transparent)`,
  fontFamily: theme.fontFamily ?? undefined,
}
```

#### Thumbnail

| Property | List Layout | Grid Layout |
|----------|-------------|-------------|
| Width | 64px | 100% |
| Height | 64px | aspect-video (16:9) |
| Border Radius | `rounded-md` (6px) | `rounded-md` (6px) |
| Object Fit | `cover` | `cover` |
| Background | Semi-transparent from theme | Semi-transparent from theme |

#### Placeholder (when no media)

```typescript
const placeholderStyle: CSSProperties = {
  backgroundColor: `color-mix(in srgb, ${theme.text.color} 5%, transparent)`,
  color: `color-mix(in srgb, ${theme.text.color} 40%, transparent)`,
}
```

Content: "No image" (small text, centered)

#### Name Text

- Use `ThemedText` component with `variant="body"`
- Or apply `theme.text.color` directly
- Truncate with ellipsis after 1 line (`truncate` class)
- Fallback: "Untitled Experience" when `experience.name` is empty

### State Variations

#### Edit Mode + Disabled

```typescript
// When mode === 'edit' && enabled === false
className="opacity-50"
```

#### Run Mode (Interactive)

```typescript
// When mode === 'run' && onClick provided
const hoverStyle: CSSProperties = {
  // On hover, slightly increase background opacity
  backgroundColor: `color-mix(in srgb, ${theme.text.color} 12%, transparent)`,
}
```

- Renders as `<button>` element
- Keyboard navigation: Enter/Space triggers onClick
- Focus ring using theme primary color

### Removed Elements

The following are removed from the current implementation:

1. ~~`ProfileBadge` component~~ - No longer displayed
2. ~~Profile import~~ - Remove `import { ProfileBadge } from '...'`
3. ~~`bg-card text-card-foreground`~~ - Replace with themed styles
4. ~~`bg-muted`~~ - Replace with themed placeholder styles

### Usage Examples

#### Within ThemeProvider (normal usage)

```tsx
// In WelcomePreview.tsx
<ThemeProvider theme={eventTheme}>
  <ExperienceCard
    experience={experience}
    layout="list"
    mode="edit"
    enabled={true}
  />
</ThemeProvider>
```

#### With Theme Override (testing/preview)

```tsx
// In Storybook or tests
<ExperienceCard
  experience={mockExperience}
  layout="grid"
  mode="run"
  onClick={() => console.log('clicked')}
  theme={mockTheme}  // Direct theme prop
/>
```

### Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Touch target | `min-h-[44px]` on card container |
| Keyboard nav | `tabIndex={0}` when `mode="run"` |
| Focus visible | `focus:ring-2` with theme primary color |
| Role | `<button>` when interactive, `<div>` otherwise |
| Label | Experience name provides accessible text |

### Test Scenarios

1. **Theme Integration**
   - Card renders with theme colors when inside ThemeProvider
   - Card renders with prop theme when ThemeProvider absent
   - Throws error when no theme available

2. **Content Display**
   - Shows experience name
   - Shows media thumbnail when available
   - Shows placeholder when media unavailable
   - Shows "Untitled Experience" when name empty
   - Does NOT show ProfileBadge

3. **Layout Variants**
   - List layout: horizontal arrangement
   - Grid layout: vertical arrangement

4. **Interaction States**
   - Edit mode: non-interactive, respects enabled prop
   - Run mode: interactive, triggers onClick
