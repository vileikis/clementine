# Architecture Patterns & Standards

## Project Structure

### Monorepo Organization

```
clementine/
├── web/                    # Next.js 16 app (React 19)
│   ├── src/
│   │   ├── app/           # App Router pages & API routes
│   │   ├── components/    # React components
│   │   │   └── ui/       # shadcn/ui components
│   │   ├── lib/          # Utilities & helpers
│   │   ├── hooks/        # Custom React hooks
│   │   └── types/        # TypeScript type definitions
│   ├── public/           # Static assets
│   └── package.json
├── functions/             # Firebase Cloud Functions
│   └── package.json
├── sdd/                   # Spec-driven development docs
│   ├── product/          # Product strategy
│   ├── standards/        # Technical standards (this file)
│   └── specs/            # Project specifications
├── pnpm-workspace.yaml   # Workspace configuration
└── package.json          # Root workspace
```

### Web App Structure

```
web/src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   ├── (creator)/               # Route group for creators
│   │   ├── dashboard/
│   │   └── events/
│   ├── (guest)/                 # Route group for guests
│   │   └── [eventId]/
│   └── api/                     # API routes
│       └── events/
│           └── route.ts
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── layout/                  # Layout components (Header, Footer)
│   ├── events/                  # Event-related components
│   └── shared/                  # Shared/common components
├── lib/
│   ├── utils.ts                 # cn() and utilities
│   ├── api.ts                   # API client functions
│   └── validators.ts            # Validation schemas
├── hooks/
│   ├── use-events.ts            # Event data hooks
│   └── use-media-upload.ts     # Media upload hooks
└── types/
    ├── event.ts                 # Event-related types
    └── api.ts                   # API types
```

## Core Architecture Principles

### 1. Separation of Concerns

**Server Components** (default in App Router)
- Data fetching
- Direct database access (future)
- Heavy computations
- SEO-critical content

**Client Components** (`'use client'`)
- Interactivity (onClick, onChange, etc.)
- Browser APIs (localStorage, geolocation)
- React hooks (useState, useEffect)
- Real-time features

```typescript
// ✅ Server component handles data
// app/events/page.tsx
export default async function EventsPage() {
  const events = await fetchEvents()
  return <EventsList events={events} />
}

// ✅ Client component handles interaction
// components/EventsList.tsx
'use client'

export function EventsList({ events }: { events: Event[] }) {
  const [filter, setFilter] = useState('')
  const filtered = events.filter(e => e.name.includes(filter))

  return (
    <>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {filtered.map(event => <EventCard key={event.id} event={event} />)}
    </>
  )
}
```

### 2. Data Flow

**Unidirectional data flow**
```
Server → Client Component → Child Components → User Actions → State Update → Re-render
```

**Props down, events up**
```typescript
// ✅ Parent manages state, children receive props and emit events
function ParentComponent() {
  const [selected, setSelected] = useState<string>()

  return (
    <ChildComponent
      value={selected}
      onChange={setSelected}
    />
  )
}
```

### 3. Component Composition

**Prefer composition over prop drilling**

```typescript
// ✅ Composition pattern
<Card>
  <CardHeader>
    <CardTitle>Event Name</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// ❌ Avoid prop drilling
<Card
  title="Event Name"
  content={...}
  footer={...}
  showHeader={true}
/>
```

## Design Patterns

### Custom Hooks for Reusable Logic

```typescript
// hooks/use-event-data.ts
export function useEventData(eventId: string) {
  const [data, setData] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchEvent(eventId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [eventId])

  return { data, loading, error }
}

// Usage
function EventPage({ eventId }: Props) {
  const { data, loading, error } = useEventData(eventId)

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  return <EventDetails event={data} />
}
```

### Compound Components

```typescript
// components/EventCard.tsx
export function EventCard({ children }: { children: React.ReactNode }) {
  return <div className="event-card">{children}</div>
}

EventCard.Image = function EventCardImage({ src }: { src: string }) {
  return <img src={src} alt="" />
}

EventCard.Title = function EventCardTitle({ children }: { children: React.ReactNode }) {
  return <h3>{children}</h3>
}

// Usage
<EventCard>
  <EventCard.Image src={event.image} />
  <EventCard.Title>{event.name}</EventCard.Title>
</EventCard>
```

### API Route Handlers

```typescript
// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const events = await fetchEventsFromDB()
    return NextResponse.json(events)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const event = await createEvent(body)
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 400 }
    )
  }
}
```

## State Management

### Local State (useState)

Use for component-specific state:
```typescript
const [isOpen, setIsOpen] = useState(false)
const [formData, setFormData] = useState({ name: '', email: '' })
```

### URL State (useSearchParams)

Use for shareable, bookmarkable state:
```typescript
'use client'
import { useSearchParams, useRouter } from 'next/navigation'

function EventFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const filter = searchParams.get('filter') || 'all'

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams)
    params.set('filter', value)
    router.push(`?${params.toString()}`)
  }

  return <FilterSelector value={filter} onChange={setFilter} />
}
```

### Server State (React Query - Future)

For future consideration when backend is implemented:
```typescript
// Future: Use React Query for server state
import { useQuery } from '@tanstack/react-query'

function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  })
}
```

## Performance Patterns

### Code Splitting

```typescript
// ✅ Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Spinner />,
  ssr: false, // Disable SSR if it uses browser APIs
})
```

### Image Optimization

```typescript
// ✅ Use Next.js Image component
import Image from 'next/image'

<Image
  src={event.image}
  alt={event.name}
  width={800}
  height={600}
  priority={isAboveFold}
/>
```

### Memoization

```typescript
// ✅ Memoize expensive calculations
const sortedEvents = useMemo(() => {
  return events.sort((a, b) => b.createdAt - a.createdAt)
}, [events])

// ✅ Memoize callbacks passed to children
const handleSelect = useCallback((id: string) => {
  setSelected(id)
}, [])
```

## Backend Architecture (n8n Integration)

### Planned Workflow

```
Web App → Firebase Function → n8n Webhook → AI Service → n8n → Firebase → Web App
```

### Event-Driven Architecture

```typescript
// Future: Event handlers for AI generation
interface GenerationRequest {
  eventId: string
  submissionId: string
  imageUrl: string
  prompt: string
}

// Firebase function triggers n8n workflow
export const handleImageSubmission = functions
  .https
  .onCall(async (data: GenerationRequest) => {
    // Trigger n8n webhook
    await triggerWorkflow(data)
    return { status: 'processing' }
  })
```

## Mobile-First Architecture

### Responsive Design Priority

1. **Mobile** (default) - 320px - 768px
2. **Tablet** (md:) - 768px - 1024px
3. **Desktop** (lg:) - 1024px+

### Progressive Enhancement

```typescript
// ✅ Start with mobile experience, enhance for larger screens
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-2/3">Main content</div>
  <div className="w-full md:w-1/3">Sidebar</div>
</div>
```

## Anti-Patterns to Avoid

❌ **Prop drilling** - Use composition or context instead
❌ **Mutating state directly** - Always use setState or state update functions
❌ **Mixing server and client code** - Respect the boundary
❌ **Over-abstracting** - Don't create abstractions for single use cases
❌ **Inline styles** - Use Tailwind classes
❌ **Ignoring loading/error states** - Always handle async states
❌ **Client-side data fetching in Server Components** - Use async components instead
