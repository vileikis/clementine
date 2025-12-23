# Performance Standards

Guidelines for building performant user interfaces in the Clementine application.

## Overview

This application must be fast and responsive, especially on mobile devices.

## Core Principles

### 1. Leverage SSR for Initial Load

Use TanStack Start's SSR for critical entry points:

```tsx
// Load critical data server-side for faster initial render
export const Route = createFileRoute('/events/$eventId')({
  loader: async ({ params }) => {
    const eventData = await getEventForSSR(params.eventId)
    return { eventData }
  },
})
```

**When to use SSR:**
- ✅ Entry point pages (landing, event pages)
- ✅ SEO-critical pages
- ❌ Highly interactive pages (use client-side data fetching)

### 2. Code Splitting

Split code by route automatically (TanStack Router does this):

```tsx
// Routes are automatically code-split
// No manual lazy() needed for routes
```

For large components, use dynamic imports:

```tsx
import { lazy } from 'react'

// Split heavy components
const HeavyEditor = lazy(() => import('@/domains/experiences/components/ExperienceEditor'))

function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyEditor />
    </Suspense>
  )
}
```

### 3. Optimize TanStack Query

Use proper query keys and stale times:

```tsx
// ✅ GOOD: Specific query keys, reasonable stale time
function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEvent(eventId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ❌ BAD: Overly broad query key
function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['events'], // Too broad!
    queryFn: () => getEvent(eventId),
  })
}
```

**Prefetch data:**
```tsx
// Prefetch on hover
<Link
  to="/events/$eventId"
  params={{ eventId }}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['event', eventId],
      queryFn: () => getEvent(eventId),
    })
  }}
>
  View Event
</Link>
```

### 4. Image Optimization

Use proper image formats and lazy loading:

```tsx
// ✅ Optimized images
<img
  src={event.coverImage}
  alt={event.name}
  loading="lazy"
  width={800}
  height={600}
  className="object-cover"
/>

// Use Next.js Image if migrating from Next.js patterns
// Or implement similar optimization with native <img> + lazy loading
```

**Image best practices:**
- Use WebP format when possible
- Provide width and height to prevent layout shift
- Use `loading="lazy"` for off-screen images
- Compress images before upload

### 5. Minimize Re-renders

Use proper memoization:

```tsx
import { memo, useMemo, useCallback } from 'react'

// Memoize expensive calculations
function EventsList({ events }) {
  const sortedEvents = useMemo(
    () => events.sort((a, b) => b.createdAt - a.createdAt),
    [events]
  )

  const handleEventClick = useCallback(
    (event) => {
      navigate(`/events/${event.id}`)
    },
    [navigate]
  )

  return sortedEvents.map((event) => (
    <EventCard key={event.id} event={event} onClick={handleEventClick} />
  ))
}

// Memoize components that don't need to re-render
const EventCard = memo(({ event, onClick }) => {
  return <div onClick={() => onClick(event)}>{event.name}</div>
})
```

### 6. Optimize Firestore Queries

Use indexes and limit results:

```tsx
// ✅ GOOD: Limited, indexed query
const q = query(
  collection(firestore, 'events'),
  where('companyId', '==', companyId),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc'),
  limit(20)
)

// ❌ BAD: Fetching all documents
const q = query(collection(firestore, 'events'))
const allEvents = await getDocs(q) // Could be thousands!
```

**Firestore optimization:**
- Always use `limit()` for lists
- Create composite indexes for complex queries
- Use `onSnapshot` for real-time updates (don't poll)
- Minimize document reads (cache with TanStack Query)

### 7. Debounce User Input

For search and filters:

```tsx
import { useDebounce } from '@/shared/hooks/use-debounce'

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { data: results } = useQuery({
    queryKey: ['search', debouncedSearch],
    queryFn: () => searchEvents(debouncedSearch),
    enabled: debouncedSearch.length > 0,
  })

  return <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
}
```

### 8. Virtualize Long Lists

For lists with 100+ items:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualizedList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  })

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ItemRow item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Performance Monitoring

### Web Vitals

Track Core Web Vitals:

```tsx
import { onCLS, onFID, onLCP } from 'web-vitals'

function reportWebVitals() {
  onCLS(console.log)
  onFID(console.log)
  onLCP(console.log)
}
```

### React DevTools Profiler

Profile component renders:
1. Open React DevTools
2. Go to Profiler tab
3. Click Record
4. Interact with app
5. Stop recording
6. Analyze render times

## Bundle Size

### Analyze Bundle

```bash
# Build with analysis
pnpm build --mode analyze
```

### Reduce Bundle Size

- ✅ Use dynamic imports for large dependencies
- ✅ Tree-shake unused code
- ✅ Import only what you need: `import { Button } from '@/ui-kit/components/button'`
- ❌ Avoid barrel imports: `import * as Components from '@/components'`

## Mobile Performance

### Priority for Mobile

This is a mobile-first app. Optimize for mobile devices:

- Test on real mobile devices
- Use Chrome DevTools mobile emulation
- Optimize for 3G/4G networks
- Minimize JavaScript bundle size

### Touch Interactions

Optimize for touch:

```tsx
// Larger touch targets (min 44x44px)
<Button className="h-11 px-6">Touch-friendly button</Button>

// Prevent 300ms click delay (handled by modern browsers, but ensure viewport meta tag)
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

## Checklist

Before deploying:
- [ ] Run Lighthouse audit (Performance > 90)
- [ ] Test on mobile device
- [ ] Check bundle size
- [ ] Verify no unnecessary re-renders (React DevTools Profiler)
- [ ] Optimize images
- [ ] Use lazy loading for heavy components
- [ ] Implement proper loading states

## Resources

- **Web Vitals**: https://web.dev/vitals/
- **TanStack Query**: https://tanstack.com/query/latest/docs/react/guides/performance
- **TanStack Virtual**: https://tanstack.com/virtual/latest
- **React Performance**: https://react.dev/learn/render-and-commit
