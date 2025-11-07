# Performance Standards

## Performance Goals

Based on product requirements:

- **AI transformation**: < 60 seconds (product requirement)
- **Page load**: < 2 seconds (initial page load)
- **Time to Interactive (TTI)**: < 3 seconds
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Cumulative Layout Shift (CLS)**: < 0.1

## Mobile-First Performance

Primary target: **4G mobile connections** (not just desktop/WiFi)

### Mobile Optimization Priorities

1. **Image optimization** - Responsive images, modern formats
2. **Code splitting** - Load only what's needed
3. **Minimal JavaScript** - Keep bundle size small
4. **Fast server responses** - API routes < 200ms
5. **Caching strategies** - Aggressive caching for static assets

## Bundle Size Budgets

### JavaScript Bundles

```
Initial page load:
- Total JS: < 200KB (gzipped)
- Main bundle: < 150KB (gzipped)
- CSS: < 50KB (gzipped)

Route-specific bundles:
- Per route: < 100KB (gzipped)
```

### Monitoring Bundle Size

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true pnpm build"
  }
}
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... other config
})
```

## Image Optimization

### Use Next.js Image Component

```typescript
import Image from 'next/image'

// ✅ Automatic optimization
<Image
  src="/event-photo.jpg"
  alt="Event photo"
  width={800}
  height={600}
  quality={85}                    // 85 is good balance
  placeholder="blur"              // Show blur while loading
  priority={isAboveFold}         // Preload critical images
/>

// ✅ Responsive images
<Image
  src="/hero.jpg"
  alt="Hero"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  style={{ objectFit: 'cover' }}
/>
```

### Image Format Best Practices

- **WebP/AVIF**: Use modern formats (Next.js handles this automatically)
- **Compression**: Balance quality vs size (85% quality is usually sufficient)
- **Dimensions**: Always specify width/height to prevent layout shift
- **Lazy loading**: Default behavior, disable with `loading="eager"` only for above-fold

### Image Upload Optimization

```typescript
// Compress images before upload
async function compressImage(file: File): Promise<File> {
  // Target: < 2MB for uploads
  const maxSizeKB = 2048

  if (file.size / 1024 < maxSizeKB) {
    return file
  }

  // Use browser-image-compression or similar
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }

  return await imageCompression(file, options)
}
```

## Code Splitting

### Route-Based Splitting

Next.js does this automatically, but be aware of what gets bundled:

```typescript
// ✅ Each route gets its own bundle
app/
├── dashboard/
│   └── page.tsx        # Separate bundle
└── events/
    └── page.tsx        # Separate bundle
```

### Component-Level Splitting

```typescript
import dynamic from 'next/dynamic'

// ✅ Lazy load heavy components
const AnalyticsChart = dynamic(() => import('@/components/AnalyticsChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Skip SSR for client-only components
})

// ✅ Conditional loading
function Dashboard() {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <>
      <BasicStats />
      {showAdvanced && <AnalyticsChart />}
    </>
  )
}
```

### Library Code Splitting

```typescript
// ✅ Import only what you need
import { Button } from '@/components/ui/button'
// Not: import * as UI from '@/components/ui'

// ✅ Dynamic imports for large libraries
const handleExport = async () => {
  const { exportToCSV } = await import('heavy-csv-library')
  exportToCSV(data)
}
```

## Caching Strategies

### Static Assets

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

### API Route Caching

```typescript
// app/api/events/route.ts
export async function GET() {
  const events = await fetchEvents()

  return new Response(JSON.stringify(events), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
    },
  })
}
```

### Client-Side Caching

```typescript
// Use SWR or React Query for data fetching (future)
import useSWR from 'swr'

function EventList() {
  const { data, error } = useSWR('/api/events', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  })

  // ...
}
```

## React Performance

### Memoization

```typescript
// ✅ Memoize expensive calculations
const sortedEvents = useMemo(() => {
  return events
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter(e => e.status === 'active')
}, [events])

// ✅ Memoize callbacks
const handleSelect = useCallback((id: string) => {
  setSelected(id)
  trackEvent('event_selected', { id })
}, [])

// ⚠️ Don't over-memoize
// Memoization has overhead - only use for expensive operations
```

### Avoid Unnecessary Renders

```typescript
// ✅ Split components to isolate state updates
function ParentComponent() {
  return (
    <>
      <StaticHeader />
      <DynamicContent />  {/* Only this re-renders */}
    </>
  )
}

function DynamicContent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Virtual Lists for Long Lists

```typescript
// For lists > 100 items, use virtualization
import { useVirtualizer } from '@tanstack/react-virtual'

function EventList({ events }: { events: Event[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated row height
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.index} style={{ height: `${virtualRow.size}px` }}>
            <EventCard event={events[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Database/API Performance

### Efficient Queries (Future)

```typescript
// ✅ Select only needed fields
const events = await db.events.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    // Don't fetch large fields like images unless needed
  },
})

// ✅ Use pagination
const events = await db.events.findMany({
  take: 20,
  skip: page * 20,
})

// ✅ Eager load relationships
const event = await db.event.findUnique({
  where: { id },
  include: {
    submissions: true,  // Load related data in one query
  },
})
```

### Response Compression

```typescript
// Compress API responses (Next.js handles this automatically)
// For large JSON responses, consider:
export async function GET() {
  const data = await getLargeDataset()

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
    },
  })
}
```

## Monitoring Performance

### Web Vitals

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Custom Performance Tracking

```typescript
// lib/performance.ts
export function measurePageLoad() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const perfData = window.performance.timing
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart

    // Track to analytics
    trackEvent('page_load', {
      duration: pageLoadTime,
      page: window.location.pathname,
    })
  }
}
```

### Lighthouse CI (Future)

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://preview.clementine.app
          configPath: './lighthouserc.json'
```

## Performance Checklist

Before deploying:

- [ ] Images are optimized and use Next.js Image component
- [ ] Bundle size is within budget (< 200KB initial load)
- [ ] Heavy components are lazy loaded
- [ ] API routes return responses in < 200ms
- [ ] Core Web Vitals meet targets (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Mobile performance tested on real devices or throttled connection
- [ ] Lighthouse score > 90 for Performance
- [ ] No console errors or warnings in production

## Resources

- [Next.js Performance Documentation](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
