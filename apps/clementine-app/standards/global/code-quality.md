# Code Quality Standards

Standards for writing high-quality, maintainable code in the Clementine application.

## TypeScript

### Strict Mode

TypeScript strict mode is enabled. All type errors must be resolved.

```tsx
// ✅ GOOD: Proper typing
interface EventData {
  name: string
  description: string
  startDate: Date
}

function createEvent(data: EventData): Promise<Event> {
  return addEvent(data)
}

// ❌ BAD: Using `any`
function createEvent(data: any): any {
  return addEvent(data)
}
```

### Type Inference

Let TypeScript infer types when obvious:

```tsx
// ✅ GOOD: Inference
const events = await getEvents() // Type is inferred from getEvents()

// ❌ BAD: Unnecessary annotation
const events: Event[] = await getEvents()
```

### No Implicit Any

Avoid implicit `any`:

```tsx
// ✅ GOOD: Explicit types
function handleEvent(event: Event) {
  console.log(event.name)
}

// ❌ BAD: Implicit any
function handleEvent(event) {
  console.log(event.name)
}
```

## ESLint

### Run Linting

```bash
pnpm lint        # Check for issues
pnpm lint:fix    # Auto-fix issues
```

### Common Rules

- No unused variables
- No unused imports
- Prefer const over let
- No console.log in production code
- Proper React hooks dependencies

## Prettier

### Auto-Format

```bash
pnpm format      # Check formatting
pnpm check       # Format + lint fix (all-in-one)
```

### Pre-commit

Format code before committing:

```bash
pnpm check
```

## Code Style

### Naming Conventions

```tsx
// Components: PascalCase
function EventCard() {}

// Hooks: camelCase with 'use' prefix
function useEvents() {}

// Constants: UPPER_SNAKE_CASE
const MAX_EVENTS = 100

// Variables/functions: camelCase
const eventName = 'My Event'
function getEventById() {}

// Types/Interfaces: PascalCase
interface Event {}
type EventStatus = 'active' | 'inactive'
```

### File Naming

```
// Components: kebab-case
event-card.tsx

// Hooks: kebab-case with 'use' prefix
use-events.ts

// Types: kebab-case
event-types.ts

// Utils: kebab-case
format-date.ts

// Constants: kebab-case
api-constants.ts
```

### Import Order

```tsx
// 1. External dependencies
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal dependencies (@ aliases)
import { Button } from '@/ui-kit/components/button'
import { useEvents } from '@/domains/events/hooks/use-events'

// 3. Relative imports
import { EventCard } from './event-card'
import type { Event } from './types'
```

## Functions

### Keep Functions Small

Functions should do one thing:

```tsx
// ✅ GOOD: Small, focused function
function formatEventDate(date: Date): string {
  return date.toLocaleDateString()
}

function getEventStatus(event: Event): EventStatus {
  return event.isActive ? 'active' : 'inactive'
}

// ❌ BAD: Function doing too much
function processEvent(event: Event) {
  const formattedDate = event.date.toLocaleDateString()
  const status = event.isActive ? 'active' : 'inactive'
  const updatedEvent = { ...event, formattedDate, status }
  saveEvent(updatedEvent)
  notifyUsers(updatedEvent)
  logEvent(updatedEvent)
  return updatedEvent
}
```

### Avoid Side Effects in Render

```tsx
// ❌ BAD: Side effects in render
function Component() {
  localStorage.setItem('key', 'value') // Side effect!
  return <div>Content</div>
}

// ✅ GOOD: Side effects in useEffect
function Component() {
  useEffect(() => {
    localStorage.setItem('key', 'value')
  }, [])
  return <div>Content</div>
}
```

## Components

### Component Structure

```tsx
// 1. Imports
import { useState } from 'react'
import { Button } from '@/ui-kit/components/button'

// 2. Types
interface EventCardProps {
  event: Event
  onEdit: (event: Event) => void
}

// 3. Component
export function EventCard({ event, onEdit }: EventCardProps) {
  // 3a. Hooks
  const [isEditing, setIsEditing] = useState(false)

  // 3b. Event handlers
  const handleEdit = () => {
    setIsEditing(true)
    onEdit(event)
  }

  // 3c. Render
  return (
    <div>
      <h2>{event.name}</h2>
      <Button onClick={handleEdit}>Edit</Button>
    </div>
  )
}
```

### Props Destructuring

```tsx
// ✅ GOOD: Destructure props
function EventCard({ event, onEdit }: EventCardProps) {
  return <div>{event.name}</div>
}

// ❌ BAD: Using props object
function EventCard(props: EventCardProps) {
  return <div>{props.event.name}</div>
}
```

## Debugging

### Remove console.log

```tsx
// ❌ BAD: console.log in production
function createEvent(data: EventData) {
  console.log('Creating event:', data)
  return addEvent(data)
}

// ✅ GOOD: No console.log (use proper logging or remove)
function createEvent(data: EventData) {
  return addEvent(data)
}
```

### Use Debugger Strategically

```tsx
// For debugging (remove before commit)
function complexFunction() {
  debugger // Pauses execution in browser DevTools
  // ...
}
```

## Error Handling

### Handle Errors Properly

```tsx
// ✅ GOOD: Proper error handling
async function createEvent(data: EventData) {
  try {
    const event = await addEvent(data)
    return { success: true, event }
  } catch (error) {
    console.error('Failed to create event:', error)
    return { success: false, error }
  }
}

// ❌ BAD: Swallowing errors
async function createEvent(data: EventData) {
  try {
    return await addEvent(data)
  } catch {
    // Error silently ignored!
  }
}
```

## Comments

### Comment Why, Not What

```tsx
// ❌ BAD: Commenting what the code does
// Loop through events
for (const event of events) {
  // ...
}

// ✅ GOOD: Commenting why
// Process events in order to maintain chronological consistency
for (const event of events) {
  // ...
}
```

### JSDoc for Public APIs

```tsx
/**
 * Creates a new event in Firestore
 * @param data - Event data to create
 * @returns Promise resolving to created event
 * @throws {ValidationError} If event data is invalid
 */
export async function createEvent(data: EventData): Promise<Event> {
  // ...
}
```

## Testing

### Write Tests for Business Logic

```tsx
// Test utility functions
test('formatEventDate formats date correctly', () => {
  const date = new Date('2024-01-01')
  expect(formatEventDate(date)).toBe('1/1/2024')
})

// Test components
test('EventCard renders event name', () => {
  const event = { id: '1', name: 'Test Event' }
  render(<EventCard event={event} onEdit={vi.fn()} />)
  expect(screen.getByText('Test Event')).toBeInTheDocument()
})
```

## Checklist

Before committing code:
- [ ] Run `pnpm check` (format + lint)
- [ ] Run `pnpm type-check` (TypeScript)
- [ ] Remove console.log and debugger statements
- [ ] Write tests for new functionality
- [ ] Update documentation if needed

## Resources

- **TypeScript**: https://www.typescriptlang.org/docs/
- **ESLint**: https://eslint.org/
- **Prettier**: https://prettier.io/
