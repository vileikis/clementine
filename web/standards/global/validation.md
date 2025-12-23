## Validation Best Practices

### Use Zod for Type-Safe Validation

Clementine uses **Zod v4** for runtime validation and type inference.

```typescript
import { z } from 'zod'

const eventSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional().default(null),
  prompt: z.string().min(10).max(1000),
  settings: z.object({
    maxSubmissions: z.number().int().positive().max(10000),
    allowSharing: z.boolean(),
  }),
})

type Event = z.infer<typeof eventSchema> // TypeScript type from schema
```

### Schema Naming Convention

Use **camelCase** for schema variable names (not PascalCase):

```typescript
// ✅ Good
const eventSchema = z.object({...});
const createEventInputSchema = z.object({...});

// ❌ Bad
const EventSchema = z.object({...});
const CreateEventInputSchema = z.object({...});
```

**Why?** Schemas are values, not types. Use PascalCase only for inferred types.

### Firestore-Safe Optional Fields

For optional fields in Firestore documents, use `.nullable().optional().default(null)` to prevent `undefined` values (Firestore doesn't allow undefined).

```typescript
const eventSchema = z.object({
  title: z.string(), // Required field
  description: z.string().nullable().optional().default(null), // Optional field
  contactEmail: z.email().nullable().optional().default(null),
})

// Parsing a document without optional fields
const oldDoc = { title: "Event" };
const parsed = eventSchema.parse(oldDoc);
// Result: { title: "Event", description: null, contactEmail: null }

// ✅ Safe to write to Firestore (no undefined values)
await db.collection('events').doc().set(parsed);
```

**Why all three?**
- `.nullable()` - Allows `null` values (Firestore-compatible)
- `.optional()` - Field not required during parsing (dev-friendly for new fields)
- `.default(null)` - Converts missing fields to `null`, not `undefined`

### Server-Side Validation (Required)

Always validate on the server - never trust client input.

```typescript
// features/events/actions/events.actions.ts
"use server";

import { eventSchema } from '../schemas';
import { createEvent } from '../repositories';

export async function createEventAction(input: unknown) {
  try {
    const validated = eventSchema.parse(input);
    const event = await createEvent(validated);
    return { success: true, data: event };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, error: 'Invalid request' };
  }
}
```

### Client-Side Validation (for UX)

Use `react-hook-form` with Zod for client-side validation.

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema } from '@/features/events/schemas'

function EventForm() {
  const form = useForm({
    resolver: zodResolver(eventSchema),
  })

  const onSubmit = async (data) => {
    // Data is already validated by Zod
    await createEventAction(data)
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

### Extract Nested Object Schemas

For nested objects, create separate named schemas instead of inlining them. This improves reusability, readability, and testability.

```typescript
// ❌ Bad: Inline nested schema
const eventSchema = z.object({
  title: z.string(),
  welcome: z.object({
    headline: z.string(),
    body: z.string(),
    ctaLabel: z.string(),
  }),
});

// ✅ Good: Separate schema
const welcomeScreenSchema = z.object({
  headline: z.string(),
  body: z.string(),
  ctaLabel: z.string(),
});

const eventSchema = z.object({
  title: z.string(),
  welcome: welcomeScreenSchema,
});
```

### Use Constants for Validation Constraints

Extract magic numbers to constants to make them reusable across schemas, UI, and error messages.

```typescript
// features/events/constants.ts
export const EVENT_CONSTRAINTS = {
  TITLE_LENGTH: { min: 1, max: 100 },
  DESCRIPTION_LENGTH: { max: 500 },
} as const;

// features/events/schemas/events.schemas.ts
import { EVENT_CONSTRAINTS } from '../constants';

const eventSchema = z.object({
  title: z.string()
    .min(EVENT_CONSTRAINTS.TITLE_LENGTH.min)
    .max(EVENT_CONSTRAINTS.TITLE_LENGTH.max),
  description: z.string()
    .max(EVENT_CONSTRAINTS.DESCRIPTION_LENGTH.max)
    .nullable()
    .optional()
    .default(null),
});
```

### Zod v4 String Validators

Zod v4 introduces top-level string format validators. Use these instead of the deprecated `.string().email()` pattern:

```typescript
// ✅ Good: Zod v4 style
z.email()           // Email validation
z.url()             // URL validation
z.uuid()            // UUID validation (strict)
z.guid()            // Permissive UUID-like strings
z.ipv4()            // IPv4 validation
z.base64()          // Base64 validation
z.jwt()             // JWT validation
z.iso.date()        // ISO date validation
z.iso.datetime()    // ISO datetime validation

// ❌ Deprecated: Zod v3 style (still works but will be removed)
z.string().email()
z.string().url()
z.string().uuid()
```

**Note:** The new validators don't support chaining. Use `.transform()` for string manipulation:

```typescript
// ❌ Can't chain anymore
z.string().trim().email().toLowerCase()

// ✅ Use transform
z.email().transform(val => val.trim().toLowerCase())
```

### Validation Principles

- **Fail early:** Validate as soon as possible
- **Specific errors:** Provide clear, field-specific error messages
- **Allow lists:** Define what's allowed, not what's blocked
- **Type safety:** Use Zod schemas for both runtime validation and TypeScript types
- **Consistent validation:** Apply same rules client and server-side
- **Sanitize input:** Prevent injection attacks (XSS, SQL injection)
- **Firestore-safe:** Use `.nullable().optional().default(null)` for optional fields
- **Extract constants:** No magic numbers in validation rules
- **Named nested schemas:** Don't inline complex object schemas
