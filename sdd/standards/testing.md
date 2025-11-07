# Testing Standards

## Testing Philosophy

- **Test behavior, not implementation** - Focus on what users see and experience
- **Test critical paths first** - Event creation, photo upload, AI generation flow
- **Balance coverage and speed** - Aim for confidence, not 100% coverage
- **Tests should be fast and reliable** - Flaky tests are worse than no tests

## Testing Stack (To Be Implemented)

### Recommended Tools

- **Vitest** - Unit and integration tests (fast, TypeScript-first)
- **React Testing Library** - Component testing (user-centric)
- **Playwright** - E2E tests (realistic browser testing)
- **MSW (Mock Service Worker)** - API mocking

```json
// Future package.json additions
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@playwright/test": "^1.48.0",
    "msw": "^2.0.0"
  }
}
```

## Unit Tests

### What to Test

✅ **Do test:**
- Utility functions (formatters, validators, calculations)
- Custom hooks logic
- Business logic functions
- Data transformations

❌ **Don't test:**
- Third-party libraries
- Implementation details (internal state, private methods)
- Trivial code (getters, simple props passing)

### Examples

```typescript
// lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatEventDate, calculateTimeRemaining } from './utils'

describe('formatEventDate', () => {
  it('formats date in user-friendly format', () => {
    const date = new Date('2025-01-15T10:30:00')
    expect(formatEventDate(date)).toBe('Jan 15, 2025')
  })

  it('handles invalid dates gracefully', () => {
    expect(formatEventDate(null)).toBe('Invalid date')
  })
})

describe('calculateTimeRemaining', () => {
  it('returns correct time remaining', () => {
    const endDate = new Date(Date.now() + 3600000) // 1 hour from now
    const result = calculateTimeRemaining(endDate)
    expect(result).toMatchObject({
      hours: 1,
      minutes: 0,
      expired: false,
    })
  })

  it('marks expired events', () => {
    const pastDate = new Date(Date.now() - 1000)
    expect(calculateTimeRemaining(pastDate).expired).toBe(true)
  })
})
```

## Component Tests

### Testing User Interactions

```typescript
// components/EventCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventCard } from './EventCard'

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    name: 'Summer Festival',
    status: 'active',
    submissions: 42,
  }

  it('renders event information', () => {
    render(<EventCard event={mockEvent} />)

    expect(screen.getByText('Summer Festival')).toBeInTheDocument()
    expect(screen.getByText('42 submissions')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(<EventCard event={mockEvent} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /view/i }))

    expect(onSelect).toHaveBeenCalledWith('1')
  })

  it('shows active status badge', () => {
    render(<EventCard event={mockEvent} />)

    const badge = screen.getByText('Active')
    expect(badge).toHaveClass('bg-green-500')
  })
})
```

### Testing Forms

```typescript
// components/EventForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventForm } from './EventForm'

describe('EventForm', () => {
  it('submits form with valid data', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<EventForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/event name/i), 'My Event')
    await user.type(screen.getByLabelText(/description/i), 'Description here')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'My Event',
        description: 'Description here',
      })
    })
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()

    render(<EventForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /create/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<EventForm onSubmit={onSubmit} />)

    const submitButton = screen.getByRole('button', { name: /create/i })

    await user.type(screen.getByLabelText(/event name/i), 'Test')
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
  })
})
```

### Testing Custom Hooks

```typescript
// hooks/use-event-data.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useEventData } from './use-event-data'

// Mock the API
vi.mock('@/lib/api', () => ({
  fetchEvent: vi.fn(),
}))

import { fetchEvent } from '@/lib/api'

describe('useEventData', () => {
  it('fetches event data on mount', async () => {
    const mockEvent = { id: '1', name: 'Test Event' }
    vi.mocked(fetchEvent).mockResolvedValue(mockEvent)

    const { result } = renderHook(() => useEventData('1'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.data).toEqual(mockEvent)
    })
  })

  it('handles errors', async () => {
    const error = new Error('Failed to fetch')
    vi.mocked(fetchEvent).mockRejectedValue(error)

    const { result } = renderHook(() => useEventData('1'))

    await waitFor(() => {
      expect(result.current.error).toEqual(error)
      expect(result.current.loading).toBe(false)
    })
  })
})
```

## Integration Tests

### Testing API Routes

```typescript
// app/api/events/route.test.ts
import { describe, it, expect } from 'vitest'
import { GET, POST } from './route'

describe('/api/events', () => {
  describe('GET', () => {
    it('returns list of events', async () => {
      const request = new Request('http://localhost:3000/api/events')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('POST', () => {
    it('creates new event', async () => {
      const eventData = {
        name: 'New Event',
        description: 'Test description',
      }

      const request = new Request('http://localhost:3000/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject(eventData)
      expect(data.id).toBeDefined()
    })

    it('validates required fields', async () => {
      const request = new Request('http://localhost:3000/api/events', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
```

## E2E Tests (Playwright)

### Critical User Journeys

```typescript
// tests/e2e/event-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Event Creation Flow', () => {
  test('user can create and view an event', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')

    // Click create event button
    await page.click('text=Create Event')

    // Fill out event form
    await page.fill('input[name="name"]', 'Test Event')
    await page.fill('textarea[name="description"]', 'Test description')
    await page.fill('input[name="prompt"]', 'Transform into comic book style')

    // Submit form
    await page.click('button:has-text("Create")')

    // Verify redirect to event page
    await expect(page).toHaveURL(/\/events\/[a-zA-Z0-9]+/)

    // Verify event details are shown
    await expect(page.locator('h1')).toContainText('Test Event')
  })
})

test.describe('Guest Photo Upload', () => {
  test('guest can upload photo and receive AI result', async ({ page }) => {
    // Navigate to event page
    await page.goto('/e/test-event-id')

    // Upload photo
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/sample-photo.jpg')

    // Wait for preview
    await expect(page.locator('img[alt="Preview"]')).toBeVisible()

    // Click generate
    await page.click('button:has-text("Generate")')

    // Wait for AI result (max 60 seconds as per product spec)
    await expect(page.locator('img[alt="AI Result"]')).toBeVisible({
      timeout: 60000,
    })

    // Verify download button is available
    await expect(page.locator('button:has-text("Download")')).toBeVisible()
  })
})
```

## Test Organization

### File Structure

```
web/
├── src/
│   ├── components/
│   │   ├── EventCard.tsx
│   │   └── EventCard.test.tsx       # Co-locate component tests
│   ├── lib/
│   │   ├── utils.ts
│   │   └── utils.test.ts            # Co-locate utility tests
│   └── hooks/
│       ├── use-event-data.ts
│       └── use-event-data.test.ts   # Co-locate hook tests
└── tests/
    ├── e2e/                          # E2E tests separate
    │   ├── event-creation.spec.ts
    │   └── guest-flow.spec.ts
    └── fixtures/                     # Test data
        └── sample-photo.jpg
```

### Naming Conventions

- Unit/integration tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`
- Test fixtures: `tests/fixtures/`

## Running Tests

```bash
# Unit and integration tests
pnpm test                 # Run all tests
pnpm test:watch          # Watch mode
pnpm test:coverage       # With coverage report

# E2E tests
pnpm test:e2e            # Run E2E tests
pnpm test:e2e:ui         # With Playwright UI
```

## Coverage Goals

**Minimum coverage targets:**
- **Critical paths**: 90%+ (event creation, photo upload, AI generation)
- **Utility functions**: 80%+
- **UI components**: 70%+
- **Overall**: 70%+

**Don't chase 100%** - Focus on high-value tests that catch real bugs.

## Continuous Integration

Tests should run on every PR:

```yaml
# .github/workflows/test.yml (future)
name: Test
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:e2e
```

## Best Practices

✅ **Arrange-Act-Assert** pattern for clarity
✅ **One assertion per test** when possible (or related assertions)
✅ **Descriptive test names** - "should ..." or "when ... then ..."
✅ **Test edge cases** - empty states, errors, boundary conditions
✅ **Clean up after tests** - Reset mocks, clear state
✅ **Use test IDs sparingly** - Prefer accessible queries (role, label, text)

❌ **Don't test implementation details** - Refactoring shouldn't break tests
❌ **Don't create brittle tests** - Avoid snapshot testing for everything
❌ **Don't duplicate coverage** - One test per behavior is enough
❌ **Don't mock everything** - Integration tests with real code when possible
