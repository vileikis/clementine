# UI Kit

The `ui-kit` directory contains the **design system foundation** for the Clementine application, including reusable UI components and the theme system.

## Overview

The UI Kit serves two primary purposes:

1. **Component Library** - shadcn/ui components and custom Radix UI primitives
2. **Theme System** - Design tokens (colors, radius, etc.) for consistent styling

**Key Principle**: All UI components should be built using ui-kit components and theme tokens to ensure consistency, accessibility, and maintainability.

## Structure

```
ui-kit/
├── components/         # UI components (shadcn/ui, custom Radix)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
└── theme/             # Theme system (design tokens)
    └── styles.css     # CSS variables and Tailwind config
```

## Components

### shadcn/ui Components

The majority of components in `ui-kit/components/` are from [shadcn/ui](https://ui.shadcn.com), a collection of beautiful, accessible components built on Radix UI.

**Installing new components:**

```bash
cd apps/clementine-app
pnpm dlx shadcn@latest add <component-name>
```

This will install the component into `src/ui-kit/components/`.

**Available components:**

- **Forms**: Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Label
- **Overlays**: Dialog, Sheet, Popover, Tooltip, HoverCard, AlertDialog
- **Data Display**: Table, Card, Badge, Avatar, Separator
- **Feedback**: Alert, Toast (via Sonner)
- **Navigation**: Tabs, DropdownMenu, NavigationMenu, Command
- **Layout**: Accordion, Collapsible, ScrollArea, AspectRatio

See the [shadcn/ui docs](https://ui.shadcn.com/docs/components/accordion) for full component catalog.

### Custom Components

You can also create custom components in `ui-kit/components/` by:

1. **Extending shadcn/ui components** - Build on existing components
2. **Styling Radix UI primitives** - Use Radix for components shadcn doesn't have
3. **Creating composite components** - Combine multiple ui-kit components

**Example: Custom Icon Button**

```tsx
// ui-kit/components/icon-button.tsx
import { Button, type ButtonProps } from './button'
import type { LucideIcon } from 'lucide-react'

interface IconButtonProps extends ButtonProps {
  icon: LucideIcon
  label: string
}

export function IconButton({ icon: Icon, label, ...props }: IconButtonProps) {
  return (
    <Button {...props} aria-label={label}>
      <Icon className="h-4 w-4" />
    </Button>
  )
}
```

**Standards**: See `standards/frontend/component-libraries.md` for component library usage patterns.

## Theme System

The theme system provides **design tokens** (colors, spacing, radius) as CSS variables, integrated with Tailwind CSS v4.

### Color Tokens

#### Base Colors

- `background` / `foreground` - Main app background and text
- `card` / `card-foreground` - Card/panel backgrounds
- `popover` / `popover-foreground` - Popover/dropdown backgrounds

#### Brand Colors

- `primary` / `primary-foreground` - Primary brand color (dark gray)
- `secondary` / `secondary-foreground` - Secondary color (light gray)
- `accent` / `accent-foreground` - Interactive elements, hover states
- `muted` / `muted-foreground` - Subtle backgrounds, disabled states

#### Semantic Colors

- `destructive` / `destructive-foreground` - Errors, delete actions (red)
- `success` / `success-foreground` - Success messages, confirmations (green)
- `info` / `info-foreground` - Informational messages (blue)
- `warning` / `warning-foreground` - Warnings, cautions (amber)

#### UI Elements

- `border` - Default border color
- `input` - Input field borders
- `ring` - Focus ring color

#### Sidebar-Specific

- `sidebar` / `sidebar-foreground` - Sidebar background and text
- `sidebar-primary` / `sidebar-primary-foreground` - Sidebar primary elements
- `sidebar-accent` / `sidebar-accent-foreground` - Sidebar accent elements
- `sidebar-border` - Sidebar border color
- `sidebar-ring` - Sidebar focus ring

#### Chart Colors

- `chart-1` through `chart-5` - Data visualization colors

### Radius Tokens

- `radius-sm` - Small border radius
- `radius-md` - Medium border radius
- `radius-lg` - Large border radius
- `radius-xl` - Extra large border radius

## Usage Examples

### Success Message

```tsx
<div className="bg-success text-success-foreground p-4 rounded-lg">
  ✓ Settings saved successfully!
</div>
```

### Warning Banner

```tsx
<div className="bg-warning text-warning-foreground p-4 rounded-lg">
  ⚠️ Your trial expires in 3 days
</div>
```

### Info Tooltip

```tsx
<div className="bg-info text-info-foreground px-3 py-2 rounded-md text-sm">
  💡 Pro tip: Use keyboard shortcuts for faster navigation
</div>
```

### Error State

```tsx
<div className="bg-destructive text-destructive-foreground p-4 rounded-lg">
  ✗ Failed to save changes. Please try again.
</div>
```

### Button Variants

```tsx
// Success button
<button className="bg-success text-success-foreground hover:bg-success/90 px-4 py-2 rounded-lg">
  Confirm
</button>

// Warning button
<button className="bg-warning text-warning-foreground hover:bg-warning/90 px-4 py-2 rounded-lg">
  Proceed with Caution
</button>

// Destructive button (shadcn/ui Button has this built-in)
<Button variant="destructive">Delete Account</Button>
```

### Badges

```tsx
// Success badge
<span className="bg-success/10 text-success px-2 py-1 rounded-md text-xs font-medium">
  Active
</span>

// Info badge
<span className="bg-info/10 text-info px-2 py-1 rounded-md text-xs font-medium">
  New
</span>

// Warning badge
<span className="bg-warning/10 text-warning px-2 py-1 rounded-md text-xs font-medium">
  Pending
</span>
```

### Cards

```tsx
<div className="bg-card text-card-foreground border-border rounded-lg p-6">
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-muted-foreground">Card description</p>
</div>
```

### Toast Notifications

When using `sonner` or custom toasts:

```tsx
import { toast } from 'sonner'

// Success toast
toast.custom((t) => (
  <div className="bg-success text-success-foreground p-4 rounded-lg shadow-lg">
    ✓ Settings saved!
  </div>
))

// Error toast
toast.custom((t) => (
  <div className="bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg">
    ✗ Something went wrong
  </div>
))
```

## Best Practices

### ✅ DO

- **Use theme tokens** - `bg-success`, `text-destructive-foreground`
- **Pair background with foreground** - `bg-primary text-primary-foreground`
- **Use semantic colors semantically** - `success` for success, `destructive` for errors
- **Use opacity modifiers** - `bg-success/10`, `bg-info/20` for subtle backgrounds
- **Use shadcn/ui components** - Don't reinvent the wheel
- **Extend ui-kit components** - Build on existing components

### ❌ DON'T

- **Don't hard-code colors** - ~~`bg-green-500`~~, ~~`text-red-600`~~
- **Don't use arbitrary values** - ~~`bg-[#ff0000]`~~ (without adding to theme)
- **Don't mix foreground colors incorrectly** - ~~`bg-success text-destructive-foreground`~~
- **Don't bypass the theme system** - All colors should come from tokens
- **Don't create duplicate components** - Check shadcn/ui and ui-kit first

## Dark Mode Support

The theme system includes dark mode variants (defined in `theme/styles.css`).

**All theme tokens automatically work in dark mode:**

```tsx
// This component works in both light and dark mode
<div className="bg-background text-foreground">
  Content adapts automatically
</div>
```

**Enabling dark mode** (future implementation):

```tsx
// Add 'dark' class to html element
document.documentElement.classList.add('dark')
```

## Customizing the Theme

To customize colors or other tokens, edit `src/ui-kit/theme/styles.css`:

```css
:root {
  /* Change success color from green to teal */
  --success: oklch(0.65 0.15 180); /* Teal instead of green */

  /* Make info color brighter */
  --info: oklch(0.7 0.15 250); /* Brighter blue */
}
```

**All components using these tokens will automatically update!**

### OKLCH Color Space

The theme uses **OKLCH color space** for perceptually uniform colors:

```css
--color: oklch(L C H);
```

- **L (Lightness)**: 0-1 (0 = black, 1 = white)
- **C (Chroma)**: 0-0.4 (0 = gray, higher = saturated)
- **H (Hue)**: 0-360 degrees (red = 0, green = 150, blue = 250)

**Example:**
```css
--success: oklch(0.65 0.15 150);
/* 0.65 = medium-light
   0.15 = moderate saturation
   150 = green hue */
```

**OKLCH Color Picker**: https://oklch.com/

## Adding New Components

### Installing shadcn/ui Components

```bash
cd apps/clementine-app
pnpm dlx shadcn@latest add <component-name>
```

Components are automatically added to `src/ui-kit/components/`.

### Creating Custom Components

**Step 1: Check if it exists**
- Does shadcn/ui have it? Install it.
- Does Radix UI have a primitive? Use it.
- Can you compose existing ui-kit components? Do that.

**Step 2: Create the component**

```tsx
// ui-kit/components/custom-component.tsx
import * as Primitive from '@radix-ui/react-primitive'
import { cn } from '@/shared/utils'

export function CustomComponent({ className, ...props }) {
  return (
    <Primitive.Root
      className={cn(
        // Use theme tokens
        'bg-background text-foreground border-border',
        'rounded-lg p-4',
        className
      )}
      {...props}
    />
  )
}
```

**Step 3: Use theme tokens**

Always use theme tokens for colors, spacing, and other design properties.

**Step 4: Export the component**

Export from the component file and use throughout the app.

## Adding New Design Tokens

**⚠️ Important**: Before adding new tokens, check `standards/frontend/design-system.md` for the complete process and governance rules.

**Quick process:**

1. **Verify need** - Check if existing tokens can work
2. **Define token** - Choose semantic name, light/dark values
3. **Add to theme** - Edit `theme/styles.css`
4. **Document** - Update this README and the standard
5. **Use the token** - Now available as Tailwind utilities

**Example:**

```css
/* theme/styles.css */
:root {
  --highlight: oklch(0.7 0.12 180);
  --highlight-foreground: oklch(0.985 0 0);
}

.dark {
  --highlight: oklch(0.5 0.12 180);
  --highlight-foreground: oklch(0.985 0 0);
}

@theme inline {
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
}
```

Now use it:
```tsx
<div className="bg-highlight text-highlight-foreground" />
```

## Integration with Domains

**ui-kit components are used throughout the app:**

```tsx
// Domain component using ui-kit
import { Button } from '@/ui-kit/components/button'
import { Card } from '@/ui-kit/components/card'

export function EventCard({ event }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold">{event.name}</h3>
      <p className="text-muted-foreground">{event.description}</p>
      <Button variant="default" className="mt-4">
        View Details
      </Button>
    </Card>
  )
}
```

**Domain components should:**
- ✅ Use ui-kit components as building blocks
- ✅ Use theme tokens for all styling
- ✅ Extend ui-kit components for domain-specific needs
- ❌ Never hard-code colors or create duplicate components

## Resources

### Component Libraries

- **shadcn/ui**: https://ui.shadcn.com
- **Radix UI**: https://www.radix-ui.com
- **Lucide Icons**: https://lucide.dev

### Theming

- **OKLCH Color Picker**: https://oklch.com/
- **Tailwind CSS**: https://tailwindcss.com/docs/customizing-colors
- **shadcn/ui Theming**: https://ui.shadcn.com/docs/theming

### Standards

- **Design System**: `standards/frontend/design-system.md` - Theme governance and strict compliance rules
- **Component Libraries**: `standards/frontend/component-libraries.md` - Which libraries to use and when
- **Accessibility**: `standards/frontend/accessibility.md` - Ensuring accessible components

## Summary

**ui-kit provides:**
- 🎨 **Components** - shadcn/ui components and custom Radix primitives
- 🎨 **Theme System** - Design tokens for consistent, maintainable styling
- 🌓 **Dark Mode** - Automatic dark mode support
- ♿ **Accessibility** - Built-in accessibility via shadcn/ui and Radix
- 📦 **Reusability** - Shared components used across all domains

**Key principles:**
1. Use ui-kit components before building custom ones
2. Always use theme tokens, never hard-code colors
3. Pair background and foreground tokens correctly
4. Extend and compose, don't duplicate

**For detailed standards, see**: `standards/frontend/design-system.md` and `standards/frontend/component-libraries.md`
