## Test Writing Standards

**Testing stack:** Jest, React Testing Library, Playwright

### Test Coverage Philosophy

- **Write minimal tests during development** - Focus on implementation first, tests at logical completion points
- **Test core user flows** - Critical paths only (event creation, photo upload, AI generation)
- **Defer edge cases** - Unless business-critical, test happy paths first
- **Test behavior, not implementation** - Focus on what users see and experience

### Unit Tests (Jest)

```typescript
// lib/utils.test.ts
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
```

### Component Tests (React Testing Library + Jest)

```typescript
// components/EventCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventCard } from './EventCard'

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    name: 'Summer Festival',
    status: 'active',
  }

  it('renders event information', () => {
    render(<EventCard event={mockEvent} />)
    expect(screen.getByText('Summer Festival')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', async () => {
    const onSelect = jest.fn()
    const user = userEvent.setup()

    render(<EventCard event={mockEvent} onSelect={onSelect} />)
    await user.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledWith('1')
  })
})
```

### Mocking in Tests

```typescript
// Mocking modules with Jest
jest.mock('@/lib/firebase/admin', () => ({
  db: {
    collection: jest.fn(),
  },
}))

// Mock functions
const mockFn = jest.fn()
mockFn.mockReturnValue('value')
mockFn.mockResolvedValue('async value')

// Clear mocks in beforeEach
beforeEach(() => {
  jest.clearAllMocks()
})
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/event-creation.spec.ts
import { test, expect } from '@playwright/test'

test('user can create an event', async ({ page }) => {
  await page.goto('/dashboard')
  await page.click('text=Create Event')

  await page.fill('input[name="name"]', 'Test Event')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.click('button:has-text("Create")')

  await expect(page).toHaveURL(/\/events\/[a-zA-Z0-9]+/)
  await expect(page.locator('h1')).toContainText('Test Event')
})
```

### Test Organization

```
web/src/
├── components/
│   ├── EventCard.tsx
│   └── EventCard.test.tsx      # Co-locate component tests
├── lib/
│   ├── utils.ts
│   └── utils.test.ts           # Co-locate utility tests
└── tests/
    └── e2e/                     # E2E tests separate
        ├── event-creation.spec.ts
        └── guest-flow.spec.ts
```

### Coverage Goals

- **Critical paths:** 90%+ (event creation, photo upload)
- **Utilities:** 80%+
- **UI components:** 70%+
- **Overall:** 70%+

Don't chase 100% - focus on high-value tests.

### Best Practices

- **Arrange-Act-Assert** pattern
- **Descriptive test names** - "it does something" format
- **Mock external dependencies** - APIs, databases, services (use `jest.mock()`)
- **Global mocks** - Place shared mocks in `jest.setup.ts` (e.g., Firebase Admin SDK)
- **Fast execution** - Unit tests in milliseconds
- **Test user behavior** - Not implementation details
- **Use accessible queries** - getByRole, getByLabelText, getByText
- **Avoid snapshot tests** - Unless truly valuable
- **Clear mocks** - Always use `jest.clearAllMocks()` in `beforeEach()`

### Jest Configuration

The project uses Jest with Next.js integration (`next/jest`):

- **Config:** `web/jest.config.ts`
- **Setup:** `web/jest.setup.ts` - Global test setup and mocks
- **Environment:** jsdom (for React component testing)
- **Module aliases:** `@/` maps to `src/`

### Running Tests

```bash
# Unit/integration tests
pnpm test              # Run all tests (runs Jest)
pnpm test:watch       # Watch mode (planned)
pnpm test:coverage    # With coverage (planned)

# E2E tests
pnpm test:e2e         # Run E2E tests (planned)
pnpm test:e2e:ui      # With Playwright UI (planned)
```
