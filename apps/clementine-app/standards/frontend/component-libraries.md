# Component Libraries

This document defines the standard component libraries and patterns for building UI components in the Clementine TanStack Start application.

## Overview

Our UI is built on three foundational libraries:

1. **shadcn/ui** - Component library built on Radix UI
2. **Radix UI** - Unstyled, accessible component primitives
3. **@dnd-kit** - Drag and drop functionality

**Key Principle**: Don't reinvent the wheel. Use these battle-tested libraries for all UI needs.

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

**Usage:**

```tsx
import { Button } from '@/ui-kit/components/button'
import { Input } from '@/ui-kit/components/input'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from '@/ui-kit/components/dialog'

function MyComponent() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <Input placeholder="Enter text..." />
      </DialogContent>
    </Dialog>
  )
}
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

**Direct Usage (when needed):**

```tsx
import * as RadioGroup from '@radix-ui/react-radio-group'
import * as Slider from '@radix-ui/react-slider'

// Use Radix directly if shadcn doesn't have the component yet
function CustomComponent() {
  return (
    <Slider.Root className="..." defaultValue={[50]} max={100} step={1}>
      <Slider.Track className="...">
        <Slider.Range className="..." />
      </Slider.Track>
      <Slider.Thumb className="..." />
    </Slider.Root>
  )
}
```

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

**Basic Usage (Sortable List):**

```tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

function SortableList({ items, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = items.indexOf(active.id)
      const newIndex = items.indexOf(over.id)
      onReorder(arrayMove(items, oldIndex, newIndex))
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((id) => (
          <SortableItem key={id} id={id}>
            Item {id}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}
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
├── components/
│   ├── button.tsx           # shadcn/ui
│   ├── input.tsx            # shadcn/ui
│   ├── dialog.tsx           # shadcn/ui
│   ├── slider.tsx           # Custom Radix component
│   └── sortable-list.tsx    # @dnd-kit wrapper
├── tokens/
│   ├── colors.ts
│   └── spacing.ts
└── utils/
    └── cn.ts                # tailwind-merge + clsx
```

**Example ui-kit component:**

```tsx
// ui-kit/components/sortable-list.tsx
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface SortableListProps<T> {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T) => React.ReactNode
  getItemId: (item: T) => string
}

export function SortableList<T>({
  items,
  onReorder,
  renderItem,
  getItemId,
}: SortableListProps<T>) {
  // Reusable sortable list component
  // ...
}
```

### shared/ Components (Composed Components)

**What goes here:**

- Components built using ui-kit components
- Business-aware components used across multiple domains
- Complex compositions

**Example shared component:**

```tsx
// shared/components/user-avatar.tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/ui-kit/components/avatar'
import { useCurrentUser } from '@/shared/hooks/use-current-user'

export function UserAvatar() {
  const user = useCurrentUser()

  return (
    <Avatar>
      <AvatarImage src={user.photoURL} />
      <AvatarFallback>{user.initials}</AvatarFallback>
    </Avatar>
  )
}
```

### domains/ Components (Domain-Specific)

**What goes here:**

- Components specific to a business domain
- Use ui-kit and shared components

**Example domain component:**

```tsx
// domains/events/components/event-card.tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/ui-kit/components/card'
import { Badge } from '@/ui-kit/components/badge'
import { Button } from '@/ui-kit/components/button'
import type { Event } from '../types'

interface EventCardProps {
  event: Event
  onEdit: (event: Event) => void
}

export function EventCard({ event, onEdit }: EventCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{event.name}</CardTitle>
        <Badge>{event.status}</Badge>
      </CardHeader>
      <CardContent>
        <p>{event.description}</p>
        <Button onClick={() => onEdit(event)}>Edit Event</Button>
      </CardContent>
    </Card>
  )
}
```

## Best Practices

### 1. Always Check shadcn/ui First

Before building any component:

1. Check shadcn/ui documentation
2. If it exists, install it: `pnpm dlx shadcn@latest add <component>`
3. Use it as-is or customize

**Don't reinvent:**

```tsx
// ❌ DON'T build custom button
function CustomButton({ children, ...props }) {
  return (
    <button className="px-4 py-2 bg-blue-500..." {...props}>
      {children}
    </button>
  )
}

// ✅ DO use shadcn button
import { Button } from '@/ui-kit/components/button'
;<Button>Click me</Button>
```

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
// ui-kit/components/slider.tsx
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/ui-kit/utils/cn'

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

```tsx
// ui-kit/components/sortable-list.tsx
// Generic sortable list component that can be reused across domains
```

```tsx
// domains/experiences/components/steps-editor.tsx
import { SortableList } from '@/ui-kit/components/sortable-list'

function StepsEditor({ steps, onReorder }) {
  return (
    <SortableList
      items={steps}
      onReorder={onReorder}
      getItemId={(step) => step.id}
      renderItem={(step) => <StepCard step={step} />}
    />
  )
}
```

### 5. Compose Components

Build complex UIs by composing simple components:

```tsx
// Complex dialog using shadcn components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui-kit/components/dialog'
import { Button } from '@/ui-kit/components/button'
import { Input } from '@/ui-kit/components/input'
import { Label } from '@/ui-kit/components/label'

function CreateEventDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Event</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Enter the details for your new event.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Event Name</Label>
            <Input id="name" placeholder="My Awesome Event" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Create Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

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

For creating variant-based components:

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input bg-background',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
```

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

### From Material-UI

- Replace `<Button>` with shadcn `<Button>`
- Replace `<TextField>` with shadcn `<Input>`
- Replace `<Dialog>` with shadcn `<Dialog>`

### From Ant Design

- Replace `<Button>` with shadcn `<Button>`
- Replace `<Input>` with shadcn `<Input>`
- Replace `<Modal>` with shadcn `<Dialog>`

### From Chakra UI

- Replace `<Button>` with shadcn `<Button>`
- Replace `<Input>` with shadcn `<Input>`
- Replace `<Modal>` with shadcn `<Dialog>`

**Pattern**: shadcn/ui has equivalents for most common components from other libraries.

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

**Resources:**

- shadcn/ui: https://ui.shadcn.com
- Radix UI: https://www.radix-ui.com
- @dnd-kit: https://docs.dndkit.com
- lucide-react: https://lucide.dev
