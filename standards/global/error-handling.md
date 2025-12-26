# Error Handling

This document defines principles and patterns for error handling across the application.

## Core Principles

### 1. Fail Fast, Fail Clear
- Detect errors early
- Provide clear, actionable error messages
- Don't let errors propagate silently

### 2. User-Friendly Messages
- Show clear messages to users (no technical jargon)
- Never expose internal implementation details
- Provide actionable next steps

### 3. Type-Safe Error Handling
- Always check error types before accessing properties
- Use TypeScript to enforce error handling
- Don't assume error shape

## Type-Safe Error Handling

### ✅ DO: Check Error Types

```typescript
try {
  await uploadPhoto(file)
} catch (error) {
  // ✅ Always check if error is Error instance
  if (error instanceof Error) {
    console.error('Upload failed:', error.message)
    showToast('Upload failed: ' + error.message)
  } else {
    console.error('Unknown error:', error)
    showToast('An unexpected error occurred')
  }
}
```

### ✅ DO: Use Type Guards for Specific Errors

```typescript
import { FirebaseError } from 'firebase/app'
import { z } from 'zod'

try {
  const validated = schema.parse(input)
  await saveToFirestore(validated)
} catch (error) {
  // Check for Zod errors
  if (error instanceof z.ZodError) {
    return { success: false, errors: formatZodErrors(error) }
  }

  // Check for Firebase errors
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return { success: false, error: 'Permission denied' }
    }
    if (error.code === 'not-found') {
      return { success: false, error: 'Document not found' }
    }
  }

  // Unknown error
  console.error('Unexpected error:', error)
  return { success: false, error: 'Internal error' }
}
```

### ❌ DON'T: Assume Error Properties

```typescript
// ❌ Bad - error might not have .message
catch (error) {
  console.log(error.message) // Runtime error if not Error instance
}

// ✅ Good - check type first
catch (error) {
  if (error instanceof Error) {
    console.log(error.message)
  } else {
    console.log('Unknown error:', error)
  }
}
```

## Client-Side Error Handling

### Loading & Error States

```typescript
function EventPage({ eventId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<Event | null>(null)

  async function handleSubmit(input: FormData) {
    setLoading(true)
    setError(null)

    try {
      const result = await submitData(input)
      setData(result)
    } catch (err) {
      // Convert unknown errors to Error instances
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false) // Always reset loading state
    }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <EmptyState />

  return <EventDetails event={data} />
}
```

### TanStack Query Error Handling

TanStack Query has built-in retry and error handling. Access errors via `const { error } = useQuery(...)`.

### Error Boundaries (React)

Create `app/error.tsx` with `Error` component for catching rendering errors.

### Global Error Handler

```typescript
// app/root.tsx or _app.tsx
useEffect(() => {
  function handleUnhandledRejection(event: PromiseRejectionEvent) {
    console.error('Unhandled promise rejection:', event.reason)
    // Send to error tracking (Sentry, etc.)
  }

  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }
}, [])
```

## Server-Side Error Handling

### Firebase Cloud Functions

```typescript
import { onRequest } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'

export const processMedia = onRequest(async (req, res) => {
  try {
    // Validate input
    const input = processMediaSchema.parse(req.body)

    // Process
    await processMediaTask(input)

    // Success response
    res.json({ success: true })
  } catch (error) {
    // Log detailed error server-side
    logger.error('Media processing error', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      input: req.body,
    })

    // Return user-friendly message
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        issues: error.issues,
      })
      return
    }

    // Generic error (don't expose internals)
    res.status(500).json({
      success: false,
      error: 'Processing failed. Please try again.',
    })
  }
})
```

### TanStack Start Server Functions

```typescript
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'

export const createEvent = createServerFn('POST', async (input: unknown) => {
  try {
    // Validate
    const validated = createEventSchema.parse(input)

    // Process
    const event = await saveEvent(validated)

    return { success: true, data: event }
  } catch (error) {
    // Validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        issues: error.issues,
      }
    }

    // Firebase errors
    if (error instanceof FirebaseError) {
      return {
        success: false,
        error: mapFirebaseError(error),
      }
    }

    // Unknown errors - log but don't expose
    console.error('Server function error:', error)
    return {
      success: false,
      error: 'Internal server error',
    }
  }
})

function mapFirebaseError(error: FirebaseError): string {
  switch (error.code) {
    case 'permission-denied':
      return 'You don\'t have permission to perform this action'
    case 'not-found':
      return 'Resource not found'
    case 'already-exists':
      return 'Resource already exists'
    default:
      return 'A database error occurred'
  }
}
```

## Firestore Error Handling

### ✅ DO: Handle Specific Error Codes

```typescript
import { doc, updateDoc } from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'

try {
  await updateDoc(doc(firestore, 'events', eventId), data)
} catch (error) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'not-found':
        return { success: false, error: 'Event not found' }
      case 'permission-denied':
        return { success: false, error: 'Permission denied' }
      case 'unavailable':
        return { success: false, error: 'Database temporarily unavailable' }
      default:
        console.error('Firestore error:', error.code, error.message)
        return { success: false, error: 'Database error' }
    }
  }
  throw error // Re-throw if not Firebase error
}
```

### ✅ DO: Clean Up Listeners on Error

```typescript
useEffect(() => {
  if (!sessionId) return

  const unsubscribe = onSnapshot(
    doc(firestore, 'sessions', sessionId),
    (snapshot) => {
      setSession(snapshot.data())
    },
    (error) => {
      // Handle subscription errors
      console.error('Subscription error:', error)
      setError(error instanceof Error ? error : new Error('Subscription failed'))
    }
  )

  // Always clean up
  return () => unsubscribe()
}, [sessionId])
```

## User-Facing Error Messages

### ✅ DO: Provide Actionable Errors

```typescript
// ❌ Bad - vague, unhelpful
"An error occurred"
"Invalid input"
"Operation failed"

// ✅ Good - specific, actionable
"File size exceeds 10MB limit. Please choose a smaller image."
"Event name is required and must be less than 100 characters."
"Failed to upload image. Check your internet connection and try again."
```

### Error Message Template

Use `UserError` interface with `title`, `message`, `action`, and `code` fields. Map technical errors to user-friendly messages.

## Error Logging

### ✅ DO: Log Errors with Context

Log error message, stack, user context, and operation context. Use `logger.error()` in Firebase Functions.

### ❌ DON'T: Log Sensitive Information

Never log passwords, tokens, or sensitive user data.

## Best Practices Summary

### ✅ DO

- Check error types with `instanceof`
- Provide clear, actionable error messages
- Log errors with context (sanitized)
- Clean up resources in `finally` blocks
- Handle async errors (promises, async/await)
- Use error boundaries for React components
- Map technical errors to user-friendly messages

### ❌ DON'T

- Expose internal error details to users
- Assume error properties exist
- Let errors propagate silently
- Log sensitive information (passwords, tokens)
- Ignore async errors (unhandled rejections)
- Show generic "An error occurred" messages
- Skip cleanup in error scenarios

## Quick Reference

```typescript
// Type-safe error handling
try {
  await operation()
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error('Unknown error:', error)
  }
}

// Firestore errors
try {
  await updateDoc(docRef, data)
} catch (error) {
  if (error instanceof FirebaseError) {
    if (error.code === 'not-found') {
      // Handle not found
    }
  }
}

// Zod validation errors
try {
  const validated = schema.parse(input)
} catch (error) {
  if (error instanceof z.ZodError) {
    // Format and display validation errors
  }
}

// Always cleanup
try {
  const resource = acquireResource()
  await useResource(resource)
} finally {
  releaseResource(resource) // Always runs
}
```

## Resources

- [TypeScript Error Handling](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Firebase Error Codes](https://firebase.google.com/docs/reference/js/auth#autherrorcodes)
