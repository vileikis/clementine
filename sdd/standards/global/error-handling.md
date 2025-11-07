## Error Handling Best Practices

### Type-Safe Error Handling

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
```

### React Error Boundaries

```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
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

### API Route Error Handling

```typescript
export async function POST(request: Request) {
  try {
    await processPayment()
    return Response.json({ success: true })
  } catch (error) {
    // Log detailed error server-side
    console.error('Payment error:', error)

    // Return generic message to client (don't expose internals)
    return Response.json(
      { error: 'Payment failed. Please try again.' },
      { status: 500 }
    )
  }
}
```

### Loading and Error States

```typescript
function EventPage({ eventId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      await submitData()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return <Form onSubmit={handleSubmit} />
}
```

### Error Handling Principles

- **User-friendly messages:** Clear, actionable errors without technical details
- **Fail fast:** Validate input early, fail with clear error messages
- **Type-safe errors:** Check error types before accessing properties
- **Centralized handling:** Use error boundaries and API error handlers
- **Graceful degradation:** Non-critical failures shouldn't break the app
- **Never expose internals:** Don't leak implementation details in error messages
- **Always handle async errors:** Use try/catch or .catch() for promises
- **Clean up resources:** Use finally blocks for cleanup
