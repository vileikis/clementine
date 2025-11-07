# Code Style & Conventions

## TypeScript

### Configuration
- **Strict mode enabled** - All TypeScript strict checks are enforced
- **No implicit any** - All types must be explicitly defined
- **Strict null checks** - Handle null/undefined explicitly

### Naming Conventions

```typescript
// Components: PascalCase
export function EventCard() {}

// Functions/variables: camelCase
const fetchEventData = () => {}
const isActive = true

// Types/Interfaces: PascalCase
type EventData = {}
interface UserProfile {}

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5_000_000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Files: kebab-case for utilities, PascalCase for components
// ✅ utils/format-date.ts
// ✅ components/EventCard.tsx
// ❌ utils/FormatDate.ts
// ❌ components/event-card.tsx
```

### Import Organization

```typescript
// 1. External dependencies
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. Internal aliases
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

// 3. Relative imports
import { EventCard } from './EventCard'
import type { Event } from './types'
```

### Type Definitions

```typescript
// ✅ Prefer interfaces for object shapes
interface Event {
  id: string
  name: string
  createdAt: Date
}

// ✅ Use type for unions, intersections, utilities
type Status = 'active' | 'inactive' | 'pending'
type EventWithAnalytics = Event & { views: number }

// ✅ Export types alongside implementation
export type { Event, Status }
```

## React

### Component Structure

```typescript
// ✅ Functional components with TypeScript
interface EventCardProps {
  event: Event
  onSelect?: (id: string) => void
}

export function EventCard({ event, onSelect }: EventCardProps) {
  // 1. Hooks
  const [isHovered, setIsHovered] = useState(false)

  // 2. Derived state
  const formattedDate = formatDate(event.createdAt)

  // 3. Event handlers
  const handleClick = () => {
    onSelect?.(event.id)
  }

  // 4. Render
  return (
    <div onClick={handleClick}>
      {/* JSX */}
    </div>
  )
}
```

### Hooks Best Practices

```typescript
// ✅ Custom hooks start with 'use'
function useEventData(eventId: string) {
  const [data, setData] = useState<Event | null>(null)
  // ...
  return { data, loading, error }
}

// ✅ Dependency arrays should be complete
useEffect(() => {
  fetchData(eventId)
}, [eventId]) // Include all dependencies

// ❌ Avoid inline object creation in deps
useEffect(() => {
  // ...
}, [{ id: eventId }]) // Creates new object every render
```

## Next.js App Router

### File Conventions

```
app/
├── layout.tsx           # Root layout
├── page.tsx            # Home page
├── events/
│   ├── page.tsx        # /events
│   ├── [id]/
│   │   └── page.tsx    # /events/:id
│   └── layout.tsx      # Shared layout for /events/*
└── api/
    └── events/
        └── route.ts    # API route handler
```

### Server vs Client Components

```typescript
// ✅ Server component (default)
// app/events/page.tsx
export default async function EventsPage() {
  const events = await fetchEvents() // Direct async call
  return <EventsList events={events} />
}

// ✅ Client component (when needed)
// components/EventForm.tsx
'use client'

export function EventForm() {
  const [name, setName] = useState('')
  // Interactive UI with hooks
}
```

### Import Aliases

Use configured path aliases:
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/types` → `src/types`

```typescript
// ✅ Use aliases
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ❌ Avoid relative paths for src/
import { Button } from '../../../components/ui/button'
```

## Tailwind CSS

### Class Ordering

Use the `cn()` utility from `@/lib/utils` for conditional classes:

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  'flex items-center gap-2',  // Layout
  'px-4 py-2',                // Spacing
  'bg-white text-black',      // Colors
  'rounded-lg shadow-sm',     // Effects
  isActive && 'bg-primary',   // Conditional
  className                    // Override prop
)} />
```

### Responsive Design (Mobile-First)

```typescript
// ✅ Mobile-first approach
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Starts full width, adjusts for larger screens */}
</div>

// ❌ Desktop-first
<div className="w-1/3 md:w-1/2 sm:w-full">
```

### Custom Colors

Use CSS variables for theming (defined in `app/globals.css`):

```typescript
// ✅ Use semantic color names
<div className="bg-background text-foreground" />
<Button variant="primary" />

// ❌ Avoid hardcoded colors for themed elements
<div className="bg-white text-black" /> // Only for truly fixed colors
```

## shadcn/ui

### Component Usage

```typescript
// ✅ Import from @/components/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// ✅ Use variant prop for styling
<Button variant="default">Click me</Button>
<Button variant="outline">Secondary</Button>

// ✅ Extend with className when needed
<Button className="w-full">Full Width</Button>
```

### Adding New Components

```bash
cd web
pnpm dlx shadcn@latest add [component-name]
```

Components are installed to `src/components/ui/` and can be customized.

## Comments & Documentation

```typescript
// ✅ Use JSDoc for public APIs
/**
 * Fetches event data by ID
 * @param eventId - The unique event identifier
 * @returns Event data or null if not found
 */
export async function getEvent(eventId: string): Promise<Event | null> {
  // Implementation
}

// ✅ Explain "why", not "what"
// Debounce to avoid excessive API calls during typing
const debouncedSearch = useDebouncedValue(searchQuery, 300)

// ❌ Obvious comments add no value
// Set the name to the event name
const name = event.name
```

## Error Handling

```typescript
// ✅ Type errors explicitly
try {
  await uploadPhoto(file)
} catch (error) {
  if (error instanceof Error) {
    console.error('Upload failed:', error.message)
  } else {
    console.error('Unknown error:', error)
  }
}

// ✅ Use error boundaries for React
// app/error.tsx
'use client'

export default function Error({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## Async/Await

```typescript
// ✅ Prefer async/await over .then()
async function fetchData() {
  try {
    const response = await fetch('/api/events')
    const data = await response.json()
    return data
  } catch (error) {
    console.error(error)
  }
}

// ✅ Handle loading states explicitly
const [loading, setLoading] = useState(false)

async function handleSubmit() {
  setLoading(true)
  try {
    await submitData()
  } finally {
    setLoading(false)
  }
}
```
