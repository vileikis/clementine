# Testing

This document defines testing principles and patterns using Vitest and Testing Library across all workspaces.

## Core Principles

###

 1. Test Behavior, Not Implementation
- Test what users see and do
- Don't test internal implementation details
- Tests should survive refactoring

### 2. Write Tests That Inspire Confidence
- Cover critical user paths
- Test edge cases and error scenarios
- Prefer integration tests over unit tests when appropriate

### 3. Consistent Testing Patterns
- Same tools across frontend and backend (Vitest)
- Same testing patterns across workspaces
- Clear, readable test structure

## Testing Stack

### Vitest (All Workspaces)

**Why Vitest:**
- ✅ Fast execution (Vite-powered)
- ✅ Jest-compatible API (easy migration)
- ✅ Better TypeScript support
- ✅ Works for both frontend and backend
- ✅ Native ESM support

**Workspaces using Vitest:**
- `apps/clementine-app/` - Frontend tests
- `functions/` - Backend/Functions tests (to be added)

### Testing Library (Frontend)

**For React component testing:**
- `@testing-library/react` - Component testing utilities
- `@testing-library/dom` - DOM testing utilities
- `jsdom` - DOM environment for tests

## Setup

### Frontend (TanStack Start App)

**Already configured** in `apps/clementine-app/`

```bash
cd apps/clementine-app
pnpm test           # Run all tests
pnpm test --watch   # Watch mode
pnpm test --ui      # Visual UI mode
```

### Backend (Firebase Functions)

**To add Vitest to functions:**

```bash
cd functions
pnpm add -D vitest
```

**Create `vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

**Add test script to `package.json`:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## Testing Patterns

### Component Testing (Frontend)

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EventCard } from './EventCard'

describe('EventCard', () => {
  it('renders event name', () => {
    render(<EventCard name="Test Event" status="active" />)

    expect(screen.getByText('Test Event')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<EventCard name="Test" onClick={onClick} />)

    fireEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('shows active badge when status is active', () => {
    render(<EventCard name="Test" status="active" />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
```

**Key differences from Jest:**
- `vi.fn()` instead of `jest.fn()`
- `vi.mock()` instead of `jest.mock()`
- Otherwise, API is identical

### Unit Testing (Functions/Services)

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { processImage } from './image.pipeline'

describe('processImage', () => {
  beforeEach(() => {
    // Setup runs before each test
  })

  it('scales image to target dimensions', async () => {
    const result = await processImage({
      inputPath: '/tmp/input.jpg',
      width: 1080,
      height: 1080,
    })

    expect(result.width).toBe(1080)
    expect(result.height).toBe(1080)
  })

  it('throws error for invalid input path', async () => {
    await expect(
      processImage({ inputPath: '/invalid/path.jpg', width: 100, height: 100 })
    ).rejects.toThrow('File not found')
  })
})
```

### Mocking

#### Mock Functions

```typescript
import { vi } from 'vitest'

// Create mock
const mockFn = vi.fn()

// With return value
const mockFn = vi.fn(() => 'result')

// With implementation
const mockFn = vi.fn((x) => x * 2)

// Assertions
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg')
expect(mockFn).toHaveBeenCalledOnce()
expect(mockFn).toReturn('result')
```

#### Mock Modules

```typescript
import { vi } from 'vitest'

// Mock entire module
vi.mock('@/integrations/firebase/client', () => ({
  firestore: {},
  storage: {},
}))

// Mock specific functions
vi.mock('./utils', () => ({
  formatDate: vi.fn(() => '2024-01-01'),
}))

// Partial mock - override specific exports
vi.mock('./api', async (importOriginal) => ({
  ...await importOriginal(),
  fetchUser: vi.fn(), // Override one export only
}))
```

#### Mock Firebase

```typescript
// Firestore Client SDK
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), doc: vi.fn(), getDoc: vi.fn(), onSnapshot: vi.fn(),
}))

// Firestore Admin SDK
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({ collection: vi.fn() })),
}))
```

### Testing Async Code

```typescript
import { describe, it, expect } from 'vitest'

describe('async operations', () => {
  it('resolves with data', async () => {
    const data = await fetchData()
    expect(data).toBeDefined()
  })

  it('rejects with error', async () => {
    await expect(fetchInvalidData()).rejects.toThrow('Invalid data')
  })

  it('handles timeout', async () => {
    const promise = slowOperation()
    await expect(promise).resolves.toBe('done')
  }, 10000) // 10 second timeout
})
```

### Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useEvents } from './use-events'

describe('useEvents', () => {
  it('fetches events on mount', async () => {
    const { result } = renderHook(() => useEvents('comp_123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events).toHaveLength(3)
  })

  it('handles error state', async () => {
    // Mock implementation that throws
    vi.mocked(fetchEvents).mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useEvents('comp_123'))

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
  })
})
```

## Test Organization

### AAA Pattern
**Arrange** (setup) → **Act** (perform action) → **Assert** (verify results)

### Test Isolation
Use `beforeEach`/`afterEach` with `vi.clearAllMocks()` and `vi.restoreAllMocks()` to ensure test independence.

## Best Practices

### ✅ DO: Test User Behavior

✅ Test what users see/do: form submissions, button clicks, error messages
❌ Don't test implementation: internal props, function calls

### ✅ DO: Use Descriptive Test Names

✅ `it('displays error when event name exceeds 100 characters')`
❌ `it('works correctly')`

### ✅ DO: Test Edge Cases

Test: minimal data, very long inputs, null values, missing handlers.

### ❌ DON'T: Test Third-Party Libraries

❌ Don't test Firestore/Firebase directly
✅ Test your abstractions that use Firebase

## Snapshot Testing

⚠️ **Use sparingly** - snapshots are brittle, hard to review. Prefer specific assertions.

## Coverage

```bash
# Run tests with coverage
pnpm test --coverage

# Coverage thresholds in vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      threshold: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
```

**Note:** 100% coverage doesn't mean bug-free. Focus on meaningful tests.

## Quick Reference

```typescript
// Vitest imports
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mocking
const mockFn = vi.fn()
vi.mock('./module')

// Assertions
expect(value).toBe(expected)
expect(value).toEqual(expected)
expect(array).toHaveLength(3)
expect(element).toBeInTheDocument()
expect(fn).toHaveBeenCalled()

// Async
await waitFor(() => expect(condition).toBe(true))
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow()
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
