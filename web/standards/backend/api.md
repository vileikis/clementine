## API Standards (Next.js App Router)

### API Route Structure

```
app/api/
├── events/
│   ├── route.ts         # GET/POST /api/events
│   └── [id]/
│       └── route.ts     # GET/PATCH/DELETE /api/events/:id
├── submissions/
│   └── route.ts         # GET/POST /api/submissions
└── analytics/
    └── route.ts         # GET /api/analytics
```

### RESTful Design

```typescript
// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'

// GET /api/events - List events
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = Number(searchParams.get('limit')) || 20

  const events = await fetchEvents({ status, limit })
  return NextResponse.json(events)
}

// POST /api/events - Create event
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = EventSchema.parse(body)
  const event = await createEvent(validated)
  return NextResponse.json(event, { status: 201 })
}
```

### HTTP Methods

- **GET** - Retrieve resources (no side effects)
- **POST** - Create new resources
- **PATCH** - Update existing resources
- **DELETE** - Remove resources
- **PUT** - Replace entire resource (use PATCH instead)

### HTTP Status Codes

```typescript
return NextResponse.json(data, {
  status: 200, // OK - Success
  status: 201, // Created - Resource created
  status: 204, // No Content - Success with no body
  status: 400, // Bad Request - Validation error
  status: 401, // Unauthorized - Not authenticated
  status: 403, // Forbidden - Not authorized
  status: 404, // Not Found - Resource doesn't exist
  status: 429, // Too Many Requests - Rate limit
  status: 500, // Internal Server Error - Server error
})
```

### Error Responses

```typescript
// ✅ Consistent error format with descriptive messages
try {
  // ...
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        issues: error.issues, // Full details for client-side field-specific errors
      },
      { status: 400 }
    )
  }

  // Don't expose internal errors to clients
  console.error('API error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

**Key points:**
- **Descriptive validation errors**: Include field paths and messages, not just generic "Validation failed"
- **Field-specific errors**: Return full `issues` array so frontend can highlight specific form fields
- **Never expose internals**: Generic error messages for unexpected errors

### Query Parameters

```typescript
// GET /api/events?status=active&limit=10&offset=20
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const filters = {
    status: searchParams.get('status'),
    limit: Number(searchParams.get('limit')) || 20,
    offset: Number(searchParams.get('offset')) || 0,
  }

  const events = await fetchEvents(filters)
  return NextResponse.json({
    data: events,
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      total: await countEvents(filters),
    },
  })
}
```

### Authentication (Firebase - Future)

```typescript
import { auth } from '@/lib/firebase'

async function authenticateRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.split('Bearer ')[1]

  if (!token) {
    return null
  }

  try {
    const decodedToken = await auth.verifyIdToken(token)
    return decodedToken.uid
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const userId = await authenticateRequest(request)

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Proceed with authenticated request
}
```

### Rate Limiting (Future)

```typescript
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Process request
}
```

### Best Practices

- **RESTful design:** Resource-based URLs with HTTP methods
- **Consistent naming:** Lowercase, plural nouns (`/api/events`)
- **Validation:** Always validate input with Zod
- **Error handling:** Consistent error responses, don't expose internals
- **Status codes:** Use appropriate HTTP status codes
- **Query parameters:** For filtering, sorting, pagination
- **Authentication:** Verify tokens on protected routes
- **Rate limiting:** Protect against abuse
