# Testing Standards

Guidelines for testing the Clementine application using Vitest and Testing Library.

## Overview

Write tests for business logic, components, and critical user flows.

## Testing Stack

- **Vitest** - Unit testing framework
- **Testing Library** - React component testing
- **jsdom** - DOM environment for tests

## Running Tests

```bash
pnpm test          # Run all tests
pnpm test --watch  # Watch mode
pnpm test --ui     # UI mode (visual test runner)
```

## What to Test

### ✅ Do Test

**Business Logic:**

```tsx
// utils/format-date.ts
export function formatEventDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// utils/format-date.test.ts
import { describe, test, expect } from 'vitest'
import { formatEventDate } from './format-date'

describe('formatEventDate', () => {
  test('formats date correctly', () => {
    const date = new Date('2024-01-15')
    expect(formatEventDate(date)).toBe('January 15, 2024')
  })
})
```

**Component Rendering:**

```tsx
// components/event-card.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { EventCard } from './event-card'

describe('EventCard', () => {
  test('renders event name', () => {
    const event = { id: '1', name: 'Test Event', description: 'Test' }
    render(<EventCard event={event} />)
    expect(screen.getByText('Test Event')).toBeInTheDocument()
  })
})
```

**User Interactions:**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'

describe('EventCard interactions', () => {
  test('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    const event = { id: '1', name: 'Test Event' }

    render(<EventCard event={event} onEdit={onEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    expect(onEdit).toHaveBeenCalledWith(event)
  })
})
```

### ❌ Don't Test

- **Third-party libraries** (shadcn/ui, Radix, @dnd-kit are already tested)
- **Implementation details** (internal state, private functions)
- **Trivial code** (simple getters/setters)

## Testing Patterns

### Unit Tests

Test individual functions in isolation:

```tsx
// domains/events/utils/validate-event.ts
export function validateEventName(name: string): boolean {
  return name.length > 0 && name.length <= 100
}

// domains/events/utils/validate-event.test.ts
describe('validateEventName', () => {
  test('returns true for valid name', () => {
    expect(validateEventName('My Event')).toBe(true)
  })

  test('returns false for empty name', () => {
    expect(validateEventName('')).toBe(false)
  })

  test('returns false for name over 100 characters', () => {
    const longName = 'a'.repeat(101)
    expect(validateEventName(longName)).toBe(false)
  })
})
```

### Component Tests

Test component behavior from user's perspective:

```tsx
// components/event-form.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, vi } from 'vitest'
import { EventForm } from './event-form'

describe('EventForm', () => {
  test('submits form with entered data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<EventForm onSubmit={onSubmit} />)

    // User enters event name
    await user.type(screen.getByLabelText(/event name/i), 'My Event')

    // User clicks submit
    await user.click(screen.getByRole('button', { name: /create event/i }))

    // Form is submitted with correct data
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'My Event',
    })
  })

  test('shows validation error for empty name', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<EventForm onSubmit={onSubmit} />)

    // User clicks submit without entering name
    await user.click(screen.getByRole('button', { name: /create event/i }))

    // Error message is shown
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()

    // Form is not submitted
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
```

### Hook Tests

Test custom hooks:

```tsx
// hooks/use-events.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { useEvents } from './use-events'

describe('useEvents', () => {
  test('loads events', async () => {
    const { result } = renderHook(() => useEvents())

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    expect(result.current.data?.length).toBeGreaterThan(0)
  })
})
```

## Mocking

### Mock Functions

```tsx
import { vi } from 'vitest'

const mockCallback = vi.fn()

// Assert function was called
expect(mockCallback).toHaveBeenCalled()
expect(mockCallback).toHaveBeenCalledTimes(1)
expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2')
```

### Mock Modules

```tsx
// Mock Firebase
vi.mock('@/integrations/firebase/client', () => ({
  firestore: {},
  auth: {},
  storage: {},
}))

// Mock custom hooks
vi.mock('@/domains/events/hooks/use-events', () => ({
  useEvents: () => ({
    data: [{ id: '1', name: 'Test Event' }],
    isLoading: false,
  }),
}))
```

### Mock Firestore

```tsx
import { vi } from 'vitest'

const mockGetDocs = vi.fn()
const mockAddDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  getDocs: mockGetDocs,
  addDoc: mockAddDoc,
}))

describe('Event service', () => {
  test('fetches events from Firestore', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: '1', data: () => ({ name: 'Event 1' }) },
        { id: '2', data: () => ({ name: 'Event 2' }) },
      ],
    })

    const events = await getEvents()

    expect(events).toHaveLength(2)
    expect(mockGetDocs).toHaveBeenCalled()
  })
})
```

## Test Organization

### Co-locate Tests

```
domains/events/
├── components/
│   ├── event-card.tsx
│   └── event-card.test.tsx        # Test next to component
├── hooks/
│   ├── use-events.ts
│   └── use-events.test.ts         # Test next to hook
└── utils/
    ├── validate-event.ts
    └── validate-event.test.ts     # Test next to utility
```

### Describe Blocks

```tsx
describe('EventCard', () => {
  describe('rendering', () => {
    test('renders event name', () => {})
    test('renders event description', () => {})
  })

  describe('interactions', () => {
    test('calls onEdit when edit button clicked', () => {})
    test('calls onDelete when delete button clicked', () => {})
  })

  describe('edge cases', () => {
    test('handles missing event data', () => {})
  })
})
```

## Best Practices

### 1. Test Behavior, Not Implementation

```tsx
// ❌ BAD: Testing implementation details
test('sets isLoading to true', () => {
  const { result } = renderHook(() => useEvents())
  expect(result.current.isLoading).toBe(true)
})

// ✅ GOOD: Testing user-visible behavior
test('shows loading state while fetching events', () => {
  render(<EventsList />)
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
})
```

### 2. Use Testing Library Queries Properly

**Priority order:**

1. `getByRole` (most accessible)
2. `getByLabelText` (forms)
3. `getByPlaceholderText` (forms)
4. `getByText` (content)
5. `getByTestId` (last resort)

```tsx
// ✅ GOOD: Accessible queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/event name/i)
screen.getByText(/loading/i)

// ❌ BAD: Brittle queries
screen.getByTestId('submit-button')
screen.getByClassName('event-card')
```

### 3. Use userEvent Over fireEvent

```tsx
import userEvent from '@testing-library/user-event'

// ✅ GOOD: userEvent simulates real user interactions
test('submits form', async () => {
  const user = userEvent.setup()
  await user.type(input, 'text')
  await user.click(button)
})

// ❌ BAD: fireEvent is lower-level
test('submits form', () => {
  fireEvent.change(input, { target: { value: 'text' } })
  fireEvent.click(button)
})
```

### 4. Wait for Async Updates

```tsx
import { waitFor } from '@testing-library/react'

test('loads events', async () => {
  render(<EventsList />)

  // Wait for async data to load
  await waitFor(() => {
    expect(screen.getByText('Event 1')).toBeInTheDocument()
  })
})
```

## Coverage

### Check Coverage

```bash
pnpm test --coverage
```

**Target coverage:**

- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

**Don't aim for 100%** - focus on critical business logic and user flows.

## Resources

- **Vitest**: https://vitest.dev
- **Testing Library**: https://testing-library.com/react
- **Testing Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
