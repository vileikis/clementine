## Component Best Practices

### Component Structure

```typescript
// ✅ Well-structured component
interface EventCardProps {
  event: Event
  onSelect?: (id: string) => void
  variant?: 'default' | 'compact'
  className?: string
}

export function EventCard({
  event,
  onSelect,
  variant = 'default',
  className,
}: EventCardProps) {
  // 1. Hooks
  const [isHovered, setIsHovered] = useState(false)

  // 2. Derived state
  const formattedDate = formatDate(event.createdAt)

  // 3. Event handlers
  const handleClick = () => onSelect?.(event.id)

  // 4. Render
  return (
    <div
      className={cn('event-card', className)}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* JSX */}
    </div>
  )
}
```

### Single Responsibility

Each component should do one thing well:

```typescript
// ✅ Focused components
<EventCard event={event} />
<EventList events={events} />
<EventFilters onFilterChange={setFilter} />

// ❌ God component
<EventDashboard
  events={events}
  showFilters={true}
  showStats={true}
  showChart={true}
  // ... 20 more props
/>
```

### Composition Over Configuration

```typescript
// ✅ Composition pattern (shadcn/ui style)
<Card>
  <CardHeader>
    <CardTitle>Event Name</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// ❌ Too many props
<Card
  title="Event Name"
  description="Description"
  content={<p>Content</p>}
  footer={<Button>Action</Button>}
  showHeader={true}
  showFooter={true}
/>
```

### Props Interface

```typescript
// ✅ Clear, documented props
interface EventFormProps {
  /** Initial event data (for editing) */
  initialData?: Partial<Event>

  /**
   * Called when form is successfully submitted
   * @param event - The created or updated event
   */
  onSubmit: (event: Event) => void | Promise<void>

  /**
   * Display mode
   * @default 'create'
   */
  mode?: 'create' | 'edit'

  /** Additional CSS classes */
  className?: string
}
```

### Server vs Client Components

```typescript
// ✅ Server component (default)
// No 'use client' directive = server component
export default async function EventPage({ params }: Props) {
  const event = await fetchEvent(params.id)
  return <EventDetails event={event} />
}

// ✅ Client component (when needed)
'use client'

export function EventForm() {
  const [name, setName] = useState('')
  // Interactive features require client component
  return <form>...</form>
}
```

### State Management

Keep state as local as possible:

```typescript
// ✅ Local state
function EventCard({ event }: Props) {
  const [isHovered, setIsHovered] = useState(false)
  // Only this component needs to know about hover state
}

// ✅ Lifted state when shared
function EventList({ events }: Props) {
  const [selected, setSelected] = useState<string>()

  return events.map(event => (
    <EventCard
      key={event.id}
      event={event}
      isSelected={event.id === selected}
      onSelect={setSelected}
    />
  ))
}
```

### Reusable Components

```typescript
// ✅ Reusable with variants
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'btn',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

### Component File Organization

```
components/
├── ui/                    # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── layout/               # Layout components
│   ├── Header.tsx
│   └── Footer.tsx
├── events/              # Feature-specific
│   ├── EventCard.tsx
│   ├── EventForm.tsx
│   └── EventList.tsx
└── shared/              # Shared/common
    ├── LoadingSpinner.tsx
    └── ErrorBoundary.tsx
```

### shadcn/ui Integration

```typescript
// ✅ Use shadcn/ui components as primitives
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Build feature components on top
export function EventCard({ event }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{event.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleView}>View</Button>
      </CardContent>
    </Card>
  )
}
```

### Best Practices

- **Single responsibility:** One clear purpose per component
- **Composition:** Combine small components instead of large props lists
- **Clear props:** Documented interface with TypeScript
- **Server by default:** Use client components only when needed
- **Local state:** Keep state close to where it's used
- **Reusable:** Design for reuse across contexts
- **Consistent naming:** PascalCase for components
- **Co-locate tests:** Component tests next to component files
