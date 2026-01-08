# Component Libraries

This document defines the standard component libraries and patterns for building UI components in the Clementine TanStack Start application.

## Overview

Our UI is built on three foundational libraries:

1. **shadcn/ui** - Component library built on Radix UI
2. **Radix UI** - Unstyled, accessible component primitives
3. **@dnd-kit** - Drag and drop functionality

**Key Principle**: Don't reinvent the wheel. Use these battle-tested libraries for all UI needs.

## Styling Components

**All components MUST use design tokens from the theme system.**

When building or customizing components:
- ✅ Use theme tokens for all colors, spacing, and visual properties
- ✅ Never hard-code colors or bypass the theme system
- ✅ Follow strict compliance rules for design token usage

**See**: `standards/frontend/design-system.md` for complete theming rules, available tokens, and governance.

## Component Library Stack

### 1. shadcn/ui (Primary Component Library)

**What it is:**

- Collection of re-usable components
- Built on top of Radix UI primitives
- Styled with Tailwind CSS
- Copy-paste into your codebase (not an npm dependency)
- Fully customizable

**Installation:**

```bash
cd apps/clementine-app
pnpm dlx shadcn@latest add <component-name>
```

**Available Components:**

- Forms: Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch
- Overlays: Dialog, Sheet, Popover, Tooltip, HoverCard
- Data Display: Table, Card, Badge, Avatar, Separator
- Feedback: Alert, AlertDialog, Toast (via Sonner)
- Navigation: Tabs, DropdownMenu, NavigationMenu, Command
- Layout: Accordion, Collapsible, ScrollArea, AspectRatio

**When to use shadcn/ui:**

- ✅ For ANY standard UI component (buttons, inputs, dialogs, etc.)
- ✅ As the foundation of your `ui-kit/` components
- ✅ Before building a custom component, check if shadcn has it

**Official Docs**: https://ui.shadcn.com

### 2. Radix UI (Underlying Primitives)

**What it is:**

- Unstyled, accessible component primitives
- Powers shadcn/ui under the hood
- Use directly when shadcn/ui doesn't have what you need
- Production-ready, WAI-ARIA compliant

**When to use Radix UI directly:**

- ✅ When shadcn/ui doesn't have the component
- ✅ When you need more control than shadcn provides
- ✅ When building custom components that need accessibility features

**Available Primitives:**

- Form Controls: Checkbox, Radio Group, Select, Slider, Switch, Toggle
- Overlays: Dialog, Popover, Tooltip, Context Menu, Dropdown Menu
- Navigation: Accordion, Tabs, Navigation Menu
- Data: Progress, Scroll Area, Separator, Avatar
- And many more...

**Official Docs**: https://www.radix-ui.com

### 3. @dnd-kit (Drag and Drop)

**What it is:**

- Modern drag and drop toolkit for React
- Performant, accessible, and extensible
- Supports mouse, touch, and keyboard
- Used for reordering, sorting, and complex drag interactions

**Installation:**

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**When to use @dnd-kit:**

- ✅ Reordering lists (steps, tasks, items)
- ✅ Drag to upload files
- ✅ Kanban boards
- ✅ Sortable tables
- ✅ Any drag and drop interaction

**Official Docs**: https://docs.dndkit.com

## Component Organization

### ui-kit/ Components (Design System)

**What goes here:**

- shadcn/ui components (installed via CLI)
- Custom Radix UI components styled for our design system
- Base components with no business logic

**Structure:**

```
ui-kit/
├── ui/
│   ├── index.ts             # Barrel export
│   ├── button.tsx           # shadcn/ui
│   ├── input.tsx            # shadcn/ui
│   ├── dialog.tsx           # shadcn/ui
│   ├── slider.tsx           # Custom Radix component
│   └── ...                  # Other shadcn components
├── theme/
│   └── styles.css           # Theme tokens (CSS variables)
└── README.md

# Note: cn utility is at src/shared/utils/style-utils.ts
```

**Example:** Reusable `SortableList<T>` wrapper component for @dnd-kit.

### shared/ Components (Composed Components)

**What goes here:**

- Components built using ui-kit components
- Business-aware components used across multiple domains
- Complex compositions

**Example:** `UserAvatar` composing ui-kit `Avatar` with user context.

### domains/ Components (Domain-Specific)

**What goes here:**

- Components specific to a business domain
- Use ui-kit and shared components

**Example:** `EventCard` composing `Card`, `Badge`, and `Button` from ui-kit.

## Best Practices

### 1. Always Check shadcn/ui First

Before building any component:

1. Check shadcn/ui documentation
2. If it exists, install it: `pnpm dlx shadcn@latest add <component>`
3. Use it as-is or customize

❌ **DON'T:** Build custom buttons, dialogs, inputs from scratch
✅ **DO:** Use shadcn/ui `Button`, `Dialog`, `Input` components

### 2. Extend shadcn/ui Components

When you need variations, extend shadcn components:

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

### 3. Use Radix for Missing Components

If shadcn doesn't have a component:

```tsx
// ui-kit/ui/slider.tsx
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/shared/utils/style-utils'

export function Slider({ className, ...props }: SliderPrimitive.SliderProps) {
  return (
    <SliderPrimitive.Root
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
}
```

### 4. Wrap @dnd-kit for Reusability

Create reusable drag and drop components:

**Example:** `StepsEditor` using `SortableList` from ui-kit with `<StepCard>` renderer.

### 5. Compose Components

Build complex UIs by composing: `Dialog` + `DialogHeader` + `Input` + `Button` = `CreateEventDialog`.

### 6. Accessibility is Built-In

These libraries handle accessibility:

- ✅ shadcn/ui components are accessible by default
- ✅ Radix UI primitives are WAI-ARIA compliant
- ✅ @dnd-kit supports keyboard navigation

**Don't break accessibility:**

```tsx
// ❌ DON'T remove accessibility features
<Button {...listeners} {...attributes}>
  Drag me
</Button>

// ✅ DO preserve accessibility props
<Button {...listeners} {...attributes} aria-label="Drag to reorder">
  Drag me
</Button>
```

## Additional UI Libraries

### Icons: lucide-react

```tsx
import { Trash2, Edit, Plus, X } from 'lucide-react'
;<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Item
</Button>
```

### Utilities: class-variance-authority (CVA)

For creating variant-based components (size, variant, etc.). shadcn/ui uses CVA internally.

### Styling: tailwind-merge + clsx

Utility for merging Tailwind classes:

```tsx
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
;<div className={cn('px-4 py-2', isActive && 'bg-primary', className)} />
```

## Migration from Other Libraries

shadcn/ui has equivalents for most common components from Material-UI, Ant Design, and Chakra UI.

## Summary

**Component Library Stack:**

1. **shadcn/ui** - First choice for all standard components
2. **Radix UI** - When shadcn doesn't have it, use Radix primitives
3. **@dnd-kit** - For all drag and drop interactions

**Key Principles:**

- ✅ Don't build what already exists in shadcn/ui
- ✅ Extend shadcn components for custom variations
- ✅ Use Radix UI for advanced/missing components
- ✅ Wrap @dnd-kit for reusable drag interactions
- ✅ Accessibility is built-in - don't break it
- ✅ Compose simple components into complex UIs
- ✅ **Always use design tokens for styling** - See `design-system.md`

**Resources:**

- **Component Libraries:**
  - shadcn/ui: https://ui.shadcn.com
  - Radix UI: https://www.radix-ui.com
  - @dnd-kit: https://docs.dndkit.com
  - lucide-react: https://lucide.dev
- **Standards:**
  - Design System: `standards/frontend/design-system.md`
  - UI Kit Guide: `apps/clementine-app/src/ui-kit/README.md`
