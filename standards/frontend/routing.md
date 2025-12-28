# TanStack Router

This document defines routing patterns and best practices for TanStack Router.

## Core Principles

### 1. File-Based Routing
- Routes defined by file structure in `src/app/`
- Type-safe route definitions
- Automatic route generation

### 2. Thin Routes
- Routes are entry points, not business logic
- Import containers from domains
- Minimal logic in route files

### 3. Type Safety
- Full TypeScript support for params, search, and context
- Type-safe navigation
- Compile-time route validation

## Route Structure

```
src/app/
├── __root.tsx                 # Root layout
├── index.tsx                  # Home page (/)
├── events/
│   ├── index.tsx             # Events list (/events)
│   ├── $eventId.tsx          # Event detail (/events/:eventId)
│   └── $eventId/
│       └── edit.tsx          # Edit event (/events/:eventId/edit)
└── experiences/
    ├── index.tsx             # Experiences list
    └── $experienceId.tsx     # Experience detail
```

**Best practice:** Keep routes thin - import page containers from domains.

## Route File Pattern

```typescript
// src/app/events/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { EventsPage } from '@/domains/events/management/containers/EventsPage'

export const Route = createFileRoute('/events')({
  component: EventsPage,
})
```

**Key principle:** Route files are just wiring. Business logic lives in domains.

## Dynamic Routes

```typescript
// src/app/events/$eventId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { EventDetailPage } from '@/domains/events/management/containers/EventDetailPage'

export const Route = createFileRoute('/events/$eventId')({
  component: EventDetailPage,
})

// In component - access params
function EventDetailPage() {
  const { eventId } = Route.useParams()
  return <div>Event: {eventId}</div>
}
```

## Navigation

### Programmatic Navigation

```typescript
import { useRouter } from '@tanstack/react-router'

function MyComponent() {
  const router = useRouter()

  const handleClick = () => {
    // Type-safe navigation
    router.navigate({
      to: '/events/$eventId',
      params: { eventId: 'evt_123' },
    })
  }
}
```

### Link Component

```typescript
import { Link } from '@tanstack/react-router'

function EventCard({ eventId }: Props) {
  return (
    <Link to="/events/$eventId" params={{ eventId }}>
      View Event
    </Link>
  )
}
```

## Search Params

```typescript
// Route definition
export const Route = createFileRoute('/events')({
  validateSearch: (search) =>
    z.object({
      status: z.enum(['active', 'inactive']).optional(),
      page: z.number().optional().default(1),
    }).parse(search),
  component: EventsPage,
})

// In component
function EventsPage() {
  const { status, page } = Route.useSearch()
  const navigate = useNavigate()

  const handleFilterChange = (newStatus: string) => {
    navigate({
      search: (prev) => ({ ...prev, status: newStatus }),
    })
  }
}
```

## Loading States

```typescript
export const Route = createFileRoute('/events/$eventId')({
  loader: async ({ params }) => {
    return fetchEvent(params.eventId)
  },
  pendingComponent: () => <Spinner />,
  errorComponent: ({ error }) => <ErrorPage error={error} />,
  component: EventDetailPage,
})
```

## Best Practices

### ✅ DO: Keep Routes Thin

```typescript
// ✅ Good - route imports domain container
export const Route = createFileRoute('/events')({
  component: EventsPage, // From domains/events/
})

// ❌ Bad - logic in route file
export const Route = createFileRoute('/events')({
  component: () => {
    const [events, setEvents] = useState([])
    // 100 lines of logic...
  },
})
```

### ✅ DO: Use Type-Safe Params

```typescript
// ✅ Good - TypeScript knows params type
const { eventId } = Route.useParams()

// ❌ Bad - accessing params without type safety
const eventId = window.location.pathname.split('/')[2]
```

### ✅ DO: Validate Search Params

```typescript
// ✅ Good - validated with Zod
validateSearch: (search) => searchSchema.parse(search)

// ❌ Bad - no validation
const { filter } = useSearchParams() // Unknown type
```

## Resources

- [TanStack Router Docs](https://tanstack.com/router)
- [File-Based Routing Guide](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)
