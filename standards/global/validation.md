## Validation Best Practices

### Use Zod for Type-Safe Validation

Clementine uses **Zod** for runtime validation and type inference.

```typescript
import { z } from 'zod'

const EventSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  prompt: z.string().min(10).max(1000),
  settings: z.object({
    maxSubmissions: z.number().int().positive().max(10000),
    allowSharing: z.boolean(),
  }),
})

type Event = z.infer<typeof EventSchema> // TypeScript type from schema
```

### Server-Side Validation (Required)

Always validate on the server - never trust client input.

```typescript
// app/api/events/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = EventSchema.parse(body)

    const event = await createEvent(validated)
    return Response.json(event, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ errors: error.errors }, { status: 400 })
    }
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
```

### Client-Side Validation (for UX)

Use `react-hook-form` with Zod for client-side validation.

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

function EventForm() {
  const form = useForm({
    resolver: zodResolver(EventSchema),
  })

  const onSubmit = async (data) => {
    // Data is already validated by Zod
    await createEvent(data)
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

### File Upload Validation

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large (max 10MB)' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP allowed.' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    return { valid: false, error: 'Invalid file extension' }
  }

  return { valid: true }
}
```

### Validation Principles

- **Fail early:** Validate as soon as possible
- **Specific errors:** Provide clear, field-specific error messages
- **Allow lists:** Define what's allowed, not what's blocked
- **Type safety:** Use Zod schemas for both runtime validation and TypeScript types
- **Consistent validation:** Apply same rules client and server-side
- **Sanitize input:** Prevent injection attacks (XSS, SQL injection)
