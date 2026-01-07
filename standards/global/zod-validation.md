# Zod Validation

This document defines principles and patterns for schema validation using Zod.

## Core Principles

### 1. Type Safety First
- Use Zod schemas for both runtime validation AND TypeScript types
- Single source of truth for data structures
- No type/schema drift

### 2. Firestore-Safe by Default
- Design schemas for Firestore compatibility
- Never allow `undefined` values (Firestore rejects them)
- Use explicit defaults

### 3. Forward Compatibility
- Allow unknown fields with `z.looseObject()` (Zod v4)
- Add new fields as optional with defaults
- Schema evolution without breaking changes

### 4. Use Zod v4 Features
- **CRITICAL**: Use Zod v4 APIs, avoid deprecated patterns
- Use `z.looseObject()` instead of `.passthrough()`
- Use top-level validators (`z.email()`, `z.uuid()`) instead of chained methods
- See "Zod v4 Features" section for complete migration guide

## Schema Naming Convention

### ✅ DO: Use camelCase for Schemas

```typescript
// ✅ Good - camelCase
const eventSchema = z.object({...})
const createEventInputSchema = z.object({...})

// ❌ Bad - PascalCase
const EventSchema = z.object({...})
const CreateEventInputSchema = z.object({...})
```

**Why:** Schemas are values, not types. Reserve PascalCase for inferred types.

```typescript
// Schema: camelCase
const eventSchema = z.object({...})

// Type: PascalCase
type Event = z.infer<typeof eventSchema>
```

## Firestore-Specific Patterns

### The Firestore Problem

Firestore **rejects `undefined` values** but allows `null`:

```typescript
// ❌ Firestore error
await setDoc(docRef, { name: 'Event', description: undefined })
// Error: "Value for argument 'data' is not a valid Firestore document"

// ✅ Firestore accepts null
await setDoc(docRef, { name: 'Event', description: null })
```

### ✅ DO: Use `.nullable().default(null)` for Optional Fields

```typescript
const eventSchema = z.object({
  // Required fields
  name: z.string(),
  companyId: z.string(),
  status: z.enum(['active', 'inactive']).default('active'),

  // Optional fields - Firestore-safe
  description: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  metadata: z.object({ ... }).nullable().default(null),
})

// Parsing an object without optional fields
const input = { name: 'Event', companyId: 'comp_123' }
const result = eventSchema.parse(input)
// Result: {
//   name: 'Event',
//   companyId: 'comp_123',
//   status: 'active',           // Applied default
//   description: null,           // Applied default
//   notes: null,                 // Applied default
//   metadata: null,              // Applied default
// }

// ✅ Safe to write to Firestore (no undefined values)
await setDoc(docRef, result)
```

**Why this pattern:**
- `.nullable()` - Allows `null` values (Firestore-compatible)
- `.default(null)` - Converts missing fields to `null`, not `undefined`
- Field is always present in parsed output (predictable)
- No need to check `field !== undefined` in code

### ✅ DO: Use `.default([])` for Optional Arrays

```typescript
const eventSchema = z.object({
  name: z.string(),

  // Optional array - use empty array default, not null
  tags: z.array(z.string()).default([]),
  experienceIds: z.array(z.string()).default([]),
})

// Parsing object without arrays
const result = eventSchema.parse({ name: 'Event' })
// Result: { name: 'Event', tags: [], experienceIds: [] }

// ✅ Can iterate immediately without checks
result.tags.forEach(tag => console.log(tag)) // No error, just empty
```

**Why empty array:**
- More ergonomic than `null` for iteration
- No null checks needed: `tags?.forEach()` vs `tags.forEach()`
- Firestore-safe (empty arrays are valid)

### ❌ DON'T: Mix `.nullable()` with `.optional()`

```typescript
// ❌ Confusing - what's the actual type?
description: z.string().nullable().optional().default(null)
// Type: string | null | undefined (3 states!)

// ✅ Clear and explicit
description: z.string().nullable().default(null)
// Type: string | null (2 states)
```

**Why avoid mixing:**
- Unnecessary complexity (3 states instead of 2)
- `.default(null)` already handles missing fields
- Harder to reason about types

### ✅ DO: Use `z.looseObject()` for Schema Evolution (Zod v4)

**IMPORTANT**: `.passthrough()` is deprecated in Zod v4. Use `z.looseObject()` instead.

```typescript
// ✅ Zod v4: Use looseObject()
const eventSchema = z.looseObject({
  name: z.string(),
  companyId: z.string(),
})

// ❌ Deprecated: Don't use passthrough()
const eventSchema = z.object({
  name: z.string(),
  companyId: z.string(),
}).passthrough()

// Old document with extra fields
const oldDoc = {
  name: 'Event',
  companyId: 'comp_123',
  legacyField: 'old-value', // Won't be stripped
}

const result = eventSchema.parse(oldDoc)
// Result: { name: 'Event', companyId: 'comp_123', legacyField: 'old-value' }

// ✅ Can write back to Firestore without data loss
await setDoc(docRef, result)
```

**Benefits:**
- Forward compatibility (new fields added later)
- Backward compatibility (old fields preserved)
- Safe schema migrations
- Zod v4 native API (no deprecated methods)

### Summary: Firestore-Safe Patterns

```typescript
// ✅ Zod v4: Use looseObject() for schema evolution
const firestoreSafeSchema = z.looseObject({
  // Required field
  name: z.string(),

  // Required with default
  status: z.enum(['active', 'inactive']).default('active'),

  // Optional string
  description: z.string().nullable().default(null),

  // Optional nested object
  metadata: z.object({ ... }).nullable().default(null),

  // Optional array
  tags: z.array(z.string()).default([]),
})
```

## Generic TypeScript Patterns

For **non-Firestore** contexts (API responses, form inputs, etc.), you have more flexibility.

### ✅ Use `.optional()` for Truly Optional Fields

```typescript
// API response schema (not stored in Firestore)
const apiResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    name: z.string(),
  }),
  error: z.string().optional(), // Field may not exist
  metadata: z.record(z.unknown()).optional(),
})

type ApiResponse = z.infer<typeof apiResponseSchema>
// Type: { data: {...}, error?: string, metadata?: Record<string, unknown> }
```

### ✅ Use `.default()` for Required Fields with Defaults

```typescript
// Form input schema
const formInputSchema = z.object({
  name: z.string(),
  sendNotifications: z.boolean().default(true), // Checkbox default
  theme: z.enum(['light', 'dark']).default('light'),
})

const input = { name: 'Test' }
const result = formInputSchema.parse(input)
// Result: { name: 'Test', sendNotifications: true, theme: 'light' }
```

### When to Use Each Pattern

| Context | Pattern | Example |
|---------|---------|---------|
| **Firestore document** | `.nullable().default(null)` | `description: z.string().nullable().default(null)` |
| **Firestore array field** | `.default([])` | `tags: z.array(z.string()).default([])` |
| **API response (optional)** | `.optional()` | `error: z.string().optional()` |
| **Form default** | `.default(value)` | `enabled: z.boolean().default(true)` |
| **Required field** | No modifier | `name: z.string()` |

## Advanced Patterns

### Discriminated Unions (Polymorphic Data)

```typescript
const stepSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('info'),
    headline: z.string(),
    body: z.string(),
  }),
  z.object({
    type: z.literal('capture'),
    promptText: z.string(),
    allowLibrary: z.boolean(),
  }),
  z.object({
    type: z.literal('ai-transform'),
    aiPresetId: z.string(),
  }),
])

type Step = z.infer<typeof stepSchema>
// Type: { type: 'info', ... } | { type: 'capture', ... } | { type: 'ai-transform', ... }

// TypeScript narrows type based on discriminator
function renderStep(step: Step) {
  if (step.type === 'info') {
    return <InfoStep headline={step.headline} /> // TypeScript knows fields
  }
  // ...
}
```

### Extract Nested Schemas

```typescript
// ❌ Bad: Inline nested schema
const eventSchema = z.object({
  name: z.string(),
  theme: z.object({
    buttonColor: z.string(),
    buttonTextColor: z.string(),
    backgroundColor: z.string(),
  }),
})

// ✅ Good: Separate named schema
const themeSchema = z.object({
  buttonColor: z.string(),
  buttonTextColor: z.string(),
  backgroundColor: z.string(),
})

const eventSchema = z.object({
  name: z.string(),
  theme: themeSchema,
})

// Benefits:
// - Reusable across schemas
// - Easier to test
// - Can export type separately
export type Theme = z.infer<typeof themeSchema>
```

### Create/Update Schemas

```typescript
// Base schema
const eventSchema = z.object({
  id: z.string(),
  name: z.string(),
  companyId: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

// Create input (omit server-generated fields)
const createEventInputSchema = eventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// Update input (all fields optional except id)
const updateEventInputSchema = eventSchema
  .omit({ id: true })
  .partial()
  .extend({ id: z.string() })

type CreateEventInput = z.infer<typeof createEventInputSchema>
// Type: { name: string, companyId: string }

type UpdateEventInput = z.infer<typeof updateEventInputSchema>
// Type: { id: string, name?: string, companyId?: string, ... }
```

### Constants for Constraints

```typescript
// ❌ Bad: Magic numbers
const eventSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().default(null),
})

// ✅ Good: Extract constants
export const EVENT_CONSTRAINTS = {
  NAME_LENGTH: { min: 1, max: 100 },
  DESCRIPTION_LENGTH: { max: 500 },
} as const

const eventSchema = z.object({
  name: z.string()
    .min(EVENT_CONSTRAINTS.NAME_LENGTH.min)
    .max(EVENT_CONSTRAINTS.NAME_LENGTH.max),
  description: z.string()
    .max(EVENT_CONSTRAINTS.DESCRIPTION_LENGTH.max)
    .nullable()
    .default(null),
})

// Use in UI
<input maxLength={EVENT_CONSTRAINTS.NAME_LENGTH.max} />
<ErrorMessage>Name must be under {EVENT_CONSTRAINTS.NAME_LENGTH.max} characters</ErrorMessage>
```

## Zod v4 Features

**CRITICAL**: This project uses Zod v4. Always use v4 APIs and avoid deprecated patterns.

### Deprecated → Modern API Migration

| Deprecated (v3) | Modern (v4) | Notes |
|-----------------|-------------|-------|
| `.passthrough()` | `z.looseObject()` | Use looseObject for schema evolution |
| `z.string().email()` | `z.email()` | Top-level validators |
| `z.string().url()` | `z.url()` | Top-level validators |
| `z.string().uuid()` | `z.uuid()` | Top-level validators |

### z.looseObject() vs .passthrough()

```typescript
// ✅ Zod v4: looseObject() - allows unknown fields
const eventSchema = z.looseObject({
  name: z.string(),
  status: z.enum(['active', 'inactive']),
})

// ❌ Deprecated: passthrough() - don't use
const eventSchema = z.object({
  name: z.string(),
}).passthrough()
```

**When to use `z.looseObject()`:**
- Firestore schemas (preserve unknown fields during reads/writes)
- API responses that may have additional fields
- Any schema that needs forward compatibility

**When to use `z.object()` (strict):**
- Form validation (reject unexpected fields)
- Internal data structures where extra fields indicate bugs

### Top-Level String Validators

Zod v4 introduces dedicated validators for common formats:

```typescript
// ✅ Zod v4 style
z.email()           // Email validation
z.url()             // URL validation
z.uuid()            // UUID validation (strict)
z.guid()            // Permissive UUID-like strings
z.ipv4()            // IPv4 validation
z.base64()          // Base64 validation
z.jwt()             // JWT validation
z.iso.date()        // ISO date validation
z.iso.datetime()    // ISO datetime validation

// ❌ Deprecated (still works, will be removed)
z.string().email()
z.string().url()
z.string().uuid()
```

**Note:** New validators don't support chaining. Use `.transform()`:

```typescript
// ❌ Can't chain
z.string().trim().email().toLowerCase()

// ✅ Use transform
z.email().transform(val => val.trim().toLowerCase())
```

## Error Handling

### Server-Side Validation

```typescript
import { z } from 'zod'

export async function createEventAction(input: unknown) {
  try {
    const validated = eventSchema.parse(input)
    const result = await createEvent(validated)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: formatZodError(error),
          issues: error.issues,
        },
      }
    }
    throw error
  }
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ')
}
```

### Client-Side Validation (react-hook-form)

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createEventInputSchema } from './schemas'

function EventForm() {
  const form = useForm({
    resolver: zodResolver(createEventInputSchema),
  })

  const onSubmit = async (data: unknown) => {
    // Data is already validated by Zod
    await createEventAction(data)
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

## Best Practices Summary

### ✅ DO

- Use `.nullable().default(null)` for optional fields in Firestore schemas
- Use `.default([])` for optional arrays
- Use `z.looseObject()` for schema evolution (Zod v4)
- Use top-level validators (`z.email()`, `z.uuid()`, etc.) in Zod v4
- Extract nested schemas to named constants
- Extract validation constraints to constants
- Use discriminated unions for polymorphic data
- Validate on both client (UX) and server (security)

### ❌ DON'T

- Use `.passthrough()` - deprecated in Zod v4, use `z.looseObject()` instead
- Use `z.string().email()` - deprecated, use `z.email()` instead
- Mix `.nullable()` with `.optional()` unnecessarily
- Allow `undefined` values in Firestore schemas
- Use PascalCase for schema variable names
- Inline complex nested schemas
- Hardcode validation constraints (magic numbers)
- Trust client-side validation alone
- Skip error handling for parse failures

## Quick Reference

```typescript
// Firestore schema template (Zod v4)
const firestoreSchema = z.looseObject({
  // Required
  id: z.string(),
  name: z.string(),

  // Required with default
  status: z.enum(['active', 'inactive']).default('active'),

  // Optional string
  description: z.string().nullable().default(null),

  // Optional nested object
  metadata: z.object({...}).nullable().default(null),

  // Optional array
  tags: z.array(z.string()).default([]),
})

// Generic TypeScript schema template (strict)
const genericSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),      // ✅ Zod v4 top-level validator
  optional: z.string().optional(),
  withDefault: z.boolean().default(true),
})

// Infer types
type FirestoreDoc = z.infer<typeof firestoreSchema>
type GenericData = z.infer<typeof genericSchema>
```

## Resources

- [Zod Documentation](https://zod.dev)
- [Zod v4 Release Notes](https://github.com/colinhacks/zod/releases)
- [react-hook-form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
