# Documentation Standards

## Documentation Philosophy

- **Code should be self-documenting** - Clear names, simple logic
- **Comments explain "why", not "what"** - Code shows what it does
- **Keep docs close to code** - Co-locate, use JSDoc
- **Update docs with code** - Outdated docs are worse than no docs
- **Write for your future self** - Assume you'll forget the context

## Code Comments

### When to Comment

✅ **Do comment:**
- Complex business logic
- Non-obvious workarounds
- Performance optimizations
- Security considerations
- TODOs and FIXMEs

```typescript
// ✅ Explains WHY
// Use debounce to avoid excessive API calls during rapid typing
const debouncedSearch = useDebouncedValue(searchQuery, 300)

// ✅ Explains TRADE-OFFS
// We use client-side filtering here instead of server-side
// because the dataset is small (<100 items) and filtering is instant
const filtered = events.filter(e => e.status === filter)

// ✅ Explains WORKAROUNDS
// FIXME: Temporary workaround for Safari bug with backdrop-filter
// Remove when Safari 17+ reaches >90% usage
const styles = isSafari ? fallbackStyles : modernStyles
```

❌ **Don't comment:**
- Obvious code
- Redundant explanations
- Commented-out code (use git history)

```typescript
// ❌ Obvious
// Set name to the event name
const name = event.name

// ❌ Redundant
// This function adds two numbers together
function add(a: number, b: number) {
  return a + b
}

// ❌ Dead code - delete it!
// const oldImplementation = () => { ... }
```

### TODO Comments

```typescript
// TODO: Add pagination when events exceed 100 items
// TODO(iggy): Implement caching strategy for event data
// FIXME: Race condition when multiple uploads happen simultaneously
// HACK: Workaround for library bug - remove when fixed upstream
```

## JSDoc for Functions

### Public APIs

```typescript
/**
 * Creates a new event with AI transformation settings
 *
 * @param data - Event creation data including name, prompt, and settings
 * @returns The created event with generated ID
 * @throws {ValidationError} If event data is invalid
 * @throws {QuotaExceededError} If user has reached event limit
 *
 * @example
 * ```typescript
 * const event = await createEvent({
 *   name: 'Summer Festival',
 *   prompt: 'Transform into summer vibes',
 *   settings: { maxSubmissions: 1000 }
 * })
 * ```
 */
export async function createEvent(
  data: CreateEventInput
): Promise<Event> {
  // Implementation
}
```

### Complex Types

```typescript
/**
 * Configuration for AI image transformation
 */
export interface AITransformConfig {
  /** The AI prompt/instruction for transformation */
  prompt: string

  /** Target style or theme (e.g., "comic book", "watercolor") */
  style?: string

  /** Strength of transformation (0.0 - 1.0) */
  strength?: number

  /** Random seed for reproducible results */
  seed?: number
}
```

### React Components

```typescript
/**
 * Displays an event card with preview image, title, and stats
 *
 * @param event - Event data to display
 * @param onSelect - Callback when card is clicked
 * @param variant - Display variant (default, compact, detailed)
 */
export function EventCard({
  event,
  onSelect,
  variant = 'default',
}: EventCardProps) {
  // Component implementation
}
```

## File Documentation

### Module Headers (When Useful)

```typescript
/**
 * Event management utilities
 *
 * Provides functions for creating, updating, and managing events.
 * Events are the core entity representing AI photobooth experiences.
 *
 * @module lib/events
 */

export function createEvent() { }
export function updateEvent() { }
```

## README Files

### Component READMEs (For Complex Components)

```markdown
# EventCreator Component

Complex form for creating and configuring AI photobooth events.

## Features

- Multi-step form with validation
- Live preview of event settings
- AI prompt template library
- Brand customization options

## Usage

\```typescript
import { EventCreator } from '@/components/EventCreator'

<EventCreator onComplete={(event) => {
  console.log('Event created:', event)
}} />
\```

## State Management

Uses Zustand store for form state to persist across steps:
- Step 1: Basic info (name, description)
- Step 2: AI settings (prompt, style)
- Step 3: Branding (logo, colors)
- Step 4: Review and create

## Dependencies

- react-hook-form - Form validation
- zod - Schema validation
- zustand - State management
```

### API Documentation

```markdown
# Event API Routes

## GET /api/events

List all events for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `inactive`, `ended`)
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
\```json
{
  "events": [
    {
      "id": "evt_123",
      "name": "Summer Festival",
      "status": "active",
      "submissions": 42,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "hasMore": false
}
\```

## POST /api/events

Create a new event.

**Request Body:**
\```json
{
  "name": "Event Name",
  "description": "Optional description",
  "prompt": "AI transformation prompt",
  "settings": {
    "maxSubmissions": 1000,
    "allowSharing": true
  }
}
\```

**Response:** `201 Created`
\```json
{
  "id": "evt_123",
  "name": "Event Name",
  "shareUrl": "https://clementine.app/e/evt_123",
  ...
}
\```
```

## Architectural Decision Records (ADRs)

For significant technical decisions, create ADRs in `sdd/specs/[project]/adr/`:

```markdown
# ADR 001: Use Next.js App Router Over Pages Router

## Status
Accepted

## Context
We need to choose between Next.js App Router (new) and Pages Router (legacy).

## Decision
Use App Router for all new development.

## Consequences

### Positive
- Server Components by default (better performance)
- Improved data fetching patterns
- Better type safety with TypeScript
- Future-proof (Pages Router is legacy)

### Negative
- Smaller ecosystem (fewer tutorials/examples)
- Some third-party libraries may not be fully compatible
- Team needs to learn new patterns

## Alternatives Considered
- Pages Router - rejected because it's being deprecated
- Remix - rejected because Next.js has better ecosystem for our needs
```

## Changelog

Keep a CHANGELOG.md at the root:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Event creation flow
- Guest photo upload experience

### Changed
- Improved mobile layout for event cards

### Fixed
- File upload validation on Safari

## [0.1.0] - 2025-01-15

### Added
- Initial MVP implementation
- Event management dashboard
- AI photo transformation pipeline
```

## Inline Documentation

### TypeScript Types as Documentation

```typescript
// ✅ Types document the shape and constraints
interface CreateEventInput {
  /** Event name (1-100 characters) */
  name: string

  /** Optional description (max 500 characters) */
  description?: string

  /** AI transformation prompt (10-1000 characters) */
  prompt: string

  /** Event settings */
  settings: {
    /** Maximum number of photo submissions (1-10,000) */
    maxSubmissions: number

    /** Whether guests can share results on social media */
    allowSharing: boolean

    /** Event end date (optional, null = no end date) */
    endsAt?: Date | null
  }
}
```

### Props Documentation

```typescript
interface EventCardProps {
  /** Event data to display */
  event: Event

  /**
   * Callback fired when card is clicked
   * @param eventId - ID of the selected event
   */
  onSelect?: (eventId: string) => void

  /**
   * Display variant
   * - `default`: Standard card with image and stats
   * - `compact`: Minimal view for lists
   * - `detailed`: Expanded view with all metadata
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed'

  /**
   * Additional CSS class names
   */
  className?: string
}
```

## Storybook (Future Consideration)

For component documentation and testing:

```typescript
// EventCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { EventCard } from './EventCard'

const meta: Meta<typeof EventCard> = {
  title: 'Components/EventCard',
  component: EventCard,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof EventCard>

export const Default: Story = {
  args: {
    event: {
      id: '1',
      name: 'Summer Festival',
      status: 'active',
      submissions: 42,
    },
  },
}

export const Compact: Story = {
  args: {
    ...Default.args,
    variant: 'compact',
  },
}
```

## Documentation Checklist

When adding a new feature:

- [ ] Update relevant README files
- [ ] Add JSDoc to public functions
- [ ] Update API documentation if applicable
- [ ] Add comments for complex logic
- [ ] Update CHANGELOG.md
- [ ] Create ADR for significant decisions
- [ ] Update type definitions with descriptions
- [ ] Add usage examples for components/utilities

## Documentation Resources

- [TSDoc](https://tsdoc.org/) - TypeScript documentation standard
- [JSDoc](https://jsdoc.app/) - JavaScript documentation standard
- [Keep a Changelog](https://keepachangelog.com/) - Changelog format
- [ADR](https://adr.github.io/) - Architectural Decision Records
