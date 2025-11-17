# Feature-Based Architecture

This directory contains **feature modules** organized by product domain rather than technical type.

## Philosophy

Features are **vertical slices** of the application that encapsulate everything needed for a specific product capability. Each feature is a self-contained module with its own components, hooks, utilities, types, and business logic.

## Structure

```
features/
├── events/
│   ├── components/        # Event-specific components
│   ├── hooks/            # Event-specific hooks
│   ├── lib/              # Event-specific utilities/helpers
│   ├── types/            # Event-specific TypeScript types
│   └── index.ts          # Public API (exports)
├── companies/
├── photo-experiences/
└── [feature-name]/
```

## When to Create a Feature

Create a new feature module when:

- ✅ It represents a distinct **product capability** (events, companies, analytics)
- ✅ It has **multiple related components** that work together
- ✅ It has **feature-specific business logic** that shouldn't leak elsewhere
- ✅ It's used across **multiple routes** but isn't truly app-wide

## When NOT to Use Features

Don't create a feature if:

- ❌ It's a single, truly **generic UI component** → use `components/shared/` or `components/ui/`
- ❌ It's **route-specific only** → colocate in `app/[route]/_components/` instead
- ❌ It's an **app-wide utility** (firebase client, auth) → use `lib/`

## Feature Module Guidelines

### 1. Internal Organization

Each feature should organize code by **technical type**:

```
features/events/
├── components/
│   ├── event-card.tsx
│   ├── event-form.tsx
│   └── event-header.tsx
├── hooks/
│   ├── use-event.ts
│   └── use-events-list.ts
├── lib/
│   ├── validation.ts
│   ├── transforms.ts
│   └── constants.ts
├── types/
│   └── event.types.ts
└── index.ts              # Public exports
```

### 2. Public API (`index.ts`)

**Always export through `index.ts`** to control what's public:

```typescript
// features/events/index.ts
export { EventCard, EventForm } from './components/event-card';
export { useEvent, useEventsList } from './hooks/use-event';
export type { Event, EventFormData } from './types/event.types';

// Internal helpers NOT exported - keep private
```

### 3. Import Patterns

**Good:**
```typescript
// Import from feature's public API
import { EventCard, useEvent } from '@/features/events';
```

**Bad:**
```typescript
// Don't bypass the public API
import { EventCard } from '@/features/events/components/event-card';
```

### 4. Dependencies Between Features

Features **may depend on other features**, but avoid circular dependencies:

```typescript
// ✅ OK - events depends on companies
import { CompanyBadge } from '@/features/companies';

// ❌ Avoid - circular dependency
// companies imports from events, events imports from companies
```

If two features need shared code, extract to:
- `components/shared/` - for UI components
- `lib/` - for utilities/helpers
- `hooks/` - for truly app-wide hooks

### 5. Shared vs Feature Components

**Feature Component:**
```typescript
// features/events/components/event-builder-tabs.tsx
// Used only in event management flows
```

**Shared Component:**
```typescript
// components/shared/data-table.tsx
// Generic table used across events, companies, analytics
```

**UI Component:**
```typescript
// components/ui/button.tsx
// shadcn component - design system primitive
```

### 6. Route-Specific vs Feature

**Route-specific** (keep in `app/`):
```typescript
// app/events/[eventId]/_components/event-page-header.tsx
// Only used in this specific route
```

**Feature** (move to `features/`):
```typescript
// features/events/components/event-header.tsx
// Used across multiple event routes
```

## Example Feature Structure

```
features/events/
├── components/
│   ├── event-card.tsx           # Display event in lists
│   ├── event-form.tsx           # Create/edit event form
│   ├── event-builder-sidebar.tsx
│   └── event-share-dialog.tsx
├── hooks/
│   ├── use-event.ts             # Fetch single event
│   ├── use-events-list.ts       # Fetch events list
│   ├── use-update-event.ts      # Mutation hook
│   └── use-event-analytics.ts
├── lib/
│   ├── validation.ts            # Zod schemas for events
│   ├── transforms.ts            # Data transformations
│   ├── constants.ts             # Event-specific constants
│   └── queries.ts               # Firestore query builders
├── types/
│   ├── event.types.ts           # TypeScript types
│   └── event-analytics.types.ts
└── index.ts                     # Public API
```

## Migration Strategy

When refactoring existing code:

1. **Identify the feature** - What product domain does this belong to?
2. **Create feature directory** - `features/[feature-name]/`
3. **Move components** - Start with most coupled components
4. **Move supporting code** - Hooks, utils, types that go with those components
5. **Update imports** - Use find-replace to update import paths
6. **Add public API** - Create `index.ts` with exports
7. **Test thoroughly** - Ensure nothing broke

## Anti-Patterns to Avoid

❌ **Kitchen Sink Feature**
```
features/shared/  # Don't create a "shared" feature
```

❌ **Deep Nesting**
```
features/events/components/cards/list/event-list-card.tsx  # Too deep
```

❌ **Mixed Concerns**
```
features/events/
├── event-card.tsx           # Components mixed with everything
├── use-event.ts
└── validation.ts
```

❌ **Bypassing Public API**
```typescript
import { helper } from '@/features/events/lib/helpers';  # Should use index.ts
```

## Questions?

When in doubt:
1. **Is it specific to a product feature?** → `features/[feature]/`
2. **Is it shared across many features?** → `components/shared/` or `lib/`
3. **Is it route-specific only?** → `app/[route]/_components/`
4. **Is it a design system primitive?** → `components/ui/` (shadcn)
