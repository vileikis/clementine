# Coding Style

This document defines coding style standards and conventions for consistent, readable code.

## Core Principles

### 1. Consistency Over Preference
- Follow established patterns in the codebase
- Team consistency trumps personal preference
- Use automated tooling (Prettier, ESLint)

### 2. Readability First
- Write code for humans, not just machines
- Clear, descriptive names over clever brevity
- Self-documenting code over excessive comments

### 3. Simplicity
- Avoid unnecessary abstraction
- Prefer straightforward solutions
- Don't overcomplicate

## Naming Conventions

### Files & Folders

**✅ DO: Use kebab-case for utilities and services**
```
utils/format-date.ts
services/media-pipeline.ts
lib/session-helpers.ts
```

**✅ DO: Use PascalCase for components**
```
components/EventCard.tsx
containers/EventsPage.tsx
ui-kit/components/Button.tsx
```

**✅ DO: Use lowercase for config files**
```
vite.config.ts
tsconfig.json
package.json
```

### TypeScript Naming

**Components & Classes: PascalCase**
```typescript
export function EventCard() { }
export class SessionManager { }
```

**Functions & Variables: camelCase**
```typescript
function fetchEventData() { }
const isActive = true
const currentUser = getCurrentUser()
```

**Types & Interfaces: PascalCase**
```typescript
interface Event { }
type Status = 'active' | 'inactive'
type EventWithCompany = Event & { company: Company }
```

**Constants: UPPER_SNAKE_CASE**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024
const API_BASE_URL = 'https://api.example.com'
const DEFAULT_TIMEOUT = 5000
```

**Schemas: camelCase** (see `zod-validation.md`)
```typescript
const eventSchema = z.object({...})
const createEventInputSchema = z.object({...})
```

## TypeScript Style

### ✅ DO: Use Type Inference When Clear

```typescript
// ✅ Type is obvious from value
const name = 'John'
const count = 0
const isActive = true

// ✅ Annotate when type isn't obvious
const user: User = await fetchUser()
const data: unknown = JSON.parse(rawData)
```

### ✅ DO: Prefer Interfaces for Objects

```typescript
// ✅ Interface for object shapes
interface Event {
  id: string
  name: string
  createdAt: number
}

// ✅ Type for unions/intersections
type Status = 'active' | 'inactive' | 'archived'
type EventWithCompany = Event & { company: Company }
```

### ✅ DO: Use Explicit Return Types for Public APIs

```typescript
// ✅ Exported function - explicit return type
export function createEvent(input: CreateEventInput): Promise<Event> {
  // ...
}

// ✅ Internal helper - inference is fine
function formatEventDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString()
}
```

### ❌ DON'T: Use `any`

```typescript
// ❌ Bad
function processData(data: any) { }

// ✅ Good - use unknown and narrow
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Safe to use data
  }
}

// ✅ Good - use generic
function processData<T>(data: T) { }
```

## Component Structure

### React Component Organization

```typescript
// 1. Imports (external, then internal, then relative)
import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Button } from '@/ui-kit/components/button'
import { formatDate } from '@/shared/lib/format'
import { EventCard } from './EventCard'

// 2. Types (if needed)
interface EventsPageProps {
  companyId: string
}

// 3. Component
export function EventsPage({ companyId }: EventsPageProps) {
  // 3a. Hooks (useState, useEffect, custom hooks)
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const { isLoading } = useEvents(companyId)

  // 3b. Derived state (computed values)
  const activeEvents = events.filter(e => e.status === 'active')
  const eventCount = events.length

  // 3c. Event handlers
  const handleEventClick = (eventId: string) => {
    router.navigate({ to: `/events/${eventId}` })
  }

  // 3d. Effects
  useEffect(() => {
    // Effect logic
  }, [companyId])

  // 3e. Render
  return (
    <div>
      {activeEvents.map(event => (
        <EventCard key={event.id} event={event} onClick={handleEventClick} />
      ))}
    </div>
  )
}
```

## Import Organization

### ✅ DO: Group Imports by Source

```typescript
// 1. External dependencies (React, libraries)
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal aliases (ui-kit, integrations, shared, domains)
import { Button } from '@/ui-kit/components/button'
import { firestore } from '@/integrations/firebase/client'
import { cn } from '@/shared/lib/cn'
import { useEvents } from '@/domains/events/shared/hooks/use-events'

// 3. Relative imports (same feature/domain)
import { EventCard } from './EventCard'
import { formatEventDate } from '../utils/format'
```

**Why:**
- Easier to scan and understand dependencies
- Clear separation of external vs internal code
- Consistent across codebase

### ✅ DO: Use Path Aliases

```typescript
// ✅ Good - clear path aliases
import { Button } from '@/ui-kit/components/button'
import { useAuth } from '@/shared/hooks/use-auth'
import { EventsPage } from '@/domains/events/management/containers/EventsPage'

// ❌ Bad - relative path hell
import { Button } from '../../../ui-kit/components/button'
import { useAuth } from '../../../../shared/hooks/use-auth'
```

## Code Quality

### ✅ DO: Write Small, Focused Functions

```typescript
// ✅ Good - single responsibility
function formatEventDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString()
}

function isEventActive(event: Event): boolean {
  return event.status === 'active'
}

// ❌ Bad - doing too much
function processEvent(event: Event, doFormat: boolean, checkStatus: boolean) {
  if (doFormat) {
    const date = new Date(event.createdAt).toLocaleDateString()
    // ...
  }
  if (checkStatus) {
    // ...
  }
}
```

### ✅ DO: Use Meaningful Names

```typescript
// ✅ Good - intention-revealing
const activeEvents = events.filter(e => e.status === 'active')
const hasCompletedOnboarding = user.onboardingStep === 'complete'

// ❌ Bad - vague or cryptic
const data = events.filter(e => e.status === 'active')
const flag = user.onboardingStep === 'complete'
```

### ✅ DO: Remove Dead Code

```typescript
// ❌ Bad - commented code
// function oldImplementation() {
//   // ... 50 lines of old code
// }

// ✅ Good - delete it (use git history)
// Code removed - see commit abc123 if needed
```

**Why:** Version control is your history. Don't pollute code with comments.

### ✅ DO: Apply DRY Principle

```typescript
// ❌ Bad - repetition
const activeEvents = events.filter(e => e.status === 'active')
const inactiveEvents = events.filter(e => e.status === 'inactive')
const archivedEvents = events.filter(e => e.status === 'archived')

// ✅ Good - extract to helper
function filterEventsByStatus(events: Event[], status: Status) {
  return events.filter(e => e.status === status)
}

const activeEvents = filterEventsByStatus(events, 'active')
const inactiveEvents = filterEventsByStatus(events, 'inactive')
```

**But:** Don't over-abstract. Three similar lines don't need a function.

## Formatting

### Automated with Prettier

**Configuration handled by:** `.prettierrc` or `prettier.config.js`

**Key settings:**
- Indentation: 2 spaces
- Line length: 80-100 characters (soft limit)
- Semicolons: Prettier decides (typically omitted)
- Quotes: Single quotes for strings

### ✅ DO: Let Prettier Handle Formatting

```bash
# Format all files
pnpm format

# Fix formatting issues
pnpm check
```

**Don't:** Manually format code. Use Prettier.

## Comments

### ✅ DO: Comment "Why", Not "What"

```typescript
// ❌ Bad - obvious what it does
// Increment counter by 1
counter++

// ✅ Good - explains why
// Firestore doesn't allow undefined, convert to null
const firestoreSafeData = data.map(d => d ?? null)

// ✅ Good - explains business context
// Grace period prevents accidental immediate deletion
const DELETION_GRACE_PERIOD_MS = 5000
```

### ✅ DO: Document Complex Logic

```typescript
/**
 * Calculates the session count increment for event analytics.
 *
 * Only counts sessions with status 'completed' to avoid inflating
 * metrics with failed or abandoned sessions.
 */
function calculateSessionIncrement(sessions: Session[]): number {
  return sessions.filter(s => s.status === 'completed').length
}
```

### ❌ DON'T: Over-Comment

```typescript
// ❌ Bad - self-evident code doesn't need comments
// Get the user's name
const userName = user.name

// Create a new array
const events = []

// Loop through items
items.forEach(item => {
  // Add to array
  events.push(item)
})
```

**Principle:** If code is clear, don't add comments. If it needs comments to be clear, refactor it.

## Best Practices Summary

### ✅ DO

- Use consistent naming conventions
- Write small, focused functions
- Use meaningful, descriptive names
- Let Prettier handle formatting
- Remove dead code (use git history)
- Comment "why", not "what"
- Use path aliases over relative imports
- Group imports logically

### ❌ DON'T

- Use `any` type
- Write overly clever code
- Leave commented-out code
- Over-comment self-evident code
- Use vague names (data, temp, info)
- Mix naming conventions
- Create premature abstractions

## Quick Reference

| Item | Convention |
|------|------------|
| **Component files** | `EventCard.tsx` (PascalCase) |
| **Utility files** | `format-date.ts` (kebab-case) |
| **Components** | `function EventCard()` (PascalCase) |
| **Functions** | `function fetchEvents()` (camelCase) |
| **Variables** | `const isActive` (camelCase) |
| **Constants** | `const MAX_SIZE` (UPPER_SNAKE_CASE) |
| **Types/Interfaces** | `interface Event` (PascalCase) |
| **Schemas** | `const eventSchema` (camelCase) |

## Tools

**Linting:** ESLint
```bash
pnpm lint
pnpm lint:fix
```

**Formatting:** Prettier
```bash
pnpm format
pnpm check  # Format + lint fix
```

**Type Checking:** TypeScript
```bash
pnpm type-check
```
