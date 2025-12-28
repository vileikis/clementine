# Project Structure

This document defines the standard directory structure and organization principles for the Clementine TanStack Start application.

## Overview

This project follows a **Domain-Driven Design (DDD)** influenced architecture with clear separation between infrastructure and business logic.

## Directory Structure

```
src/
├── ui-kit/              # Design system (pure components)
├── integrations/        # Third-party integrations
├── shared/              # Shared utilities & components
├── domains/             # Business domains (DDD bounded contexts)
└── app/                 # TanStack Router routes (thin)
```

## Layer Descriptions

### 1. `ui-kit/` - Design System

Pure, reusable UI components with no business logic.

```
ui-kit/
├── components/          # Base components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx
│   │   └── Button.test.tsx
│   ├── Input/
│   ├── Card/
│   └── ...
├── tokens/              # Design tokens
│   ├── colors.ts
│   ├── spacing.ts
│   └── typography.ts
└── utils/
    └── cn.ts            # className utilities
```

**Characteristics:**

- Zero business logic or domain knowledge
- Portable across projects
- Can be extracted to separate package
- Import pattern: `@/ui-kit/components/Button`

### 2. `integrations/` - Third-Party Infrastructure

Setup and configuration for external services.

```
integrations/
├── firebase/
│   ├── client.ts
│   └── server.ts
├── tanstack-query/
│   ├── root-provider.tsx
│   └── devtools.tsx
└── sentry/
    └── config.ts
```

**Characteristics:**

- App-wide infrastructure concerns
- Third-party service wrappers
- Typically imported in `__root.tsx` or app entry points
- Import pattern: `@/integrations/firebase`

### 3. `shared/` - Shared Utilities & Components

Generic utilities and composed components used across multiple domains.

```
shared/
├── components/          # Shared business components
│   ├── UserAvatar/
│   ├── CompanyLogo/
│   └── SearchBar/
├── lib/                 # Utilities (mix of generic & business-specific)
│   ├── cn.ts           # Generic className utility
│   ├── utils.ts        # Generic helpers
│   ├── validation.ts   # Generic validators
│   └── analytics.ts    # Business-specific analytics
├── hooks/               # Shared React hooks
│   ├── useDebounce.ts  # Generic
│   └── useCurrentUser.ts # Business-specific
└── types/               # Shared TypeScript types
    ├── common.ts       # Generic types
    └── api.ts          # API response types
```

**Characteristics:**

- Mix of generic utilities and business-aware components
- Used by multiple domains
- Import pattern: `@/shared/lib/utils`

### 4. `domains/` - Business Logic (DDD Bounded Contexts)

Core business domains, each representing a bounded context in DDD terminology.

```
domains/
├── events/              # Events Domain (bounded context)
│   ├── management/      # Subdomain: Event CRUD
│   │   ├── components/
│   │   ├── containers/
│   │   └── types/
│   ├── theming/         # Subdomain: Event theming
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── shared/          # Shared ONLY within events domain
│       ├── types/
│       └── utils/
│
├── experiences/         # Experiences Domain
│   ├── builder/         # Subdomain: Building experiences (admin)
│   ├── runtime/         # Subdomain: Running experiences (guest)
│   └── shared/
│
└── media/               # Media Domain
    ├── upload/
    ├── processing/
    └── storage/
```

**Characteristics:**

- Each top-level domain is a bounded context with its own ubiquitous language
- Complex domains contain subdomains
- Domains can depend on infrastructure and shared code
- Cross-domain dependencies should be minimized
- Import pattern: `@/domains/events/theming/components/ThemeProvider`

### 5. `app/` - Routing Layer (Thin)

TanStack Router route definitions. Keep these minimal - primarily routing configuration.

```
app/
├── __root.tsx
├── index.tsx
├── admin/
│   ├── events/
│   └── experiences/
└── guest/
    └── [shareCode]/
```

**Characteristics:**

- Minimal UI logic
- Import containers from domain modules
- Handle route-specific concerns (loaders, params, search params)
- No component definitions or business logic
- Import pattern: `import { EventsPage } from '@/domains/events/management/containers/EventsPage'`

## Architectural Principles

### Domain-Driven Design (DDD)

#### Bounded Contexts (Top-level Domains)

Create a top-level domain when:

- ✅ It represents a distinct business capability
- ✅ It has its own data models and business rules
- ✅ It could be explained to non-technical stakeholders as a separate area
- ✅ It changes for different business reasons than other domains

Examples: `events`, `experiences`, `media`, `analytics`

#### Subdomains (Nested within Domains)

Create a subdomain when:

- ✅ It's part of a larger domain but complex enough to separate
- ✅ It has 5+ files or multiple concerns
- ✅ It could grow independently
- ✅ It has specific responsibilities within parent domain

Example: `domains/events/theming/` is a subdomain because:

- It's part of events (events have themes)
- Theming is complex (providers, hooks, tokens, utilities)
- Could grow with more theme capabilities

#### Shared Code (Infrastructure)

Put code in `ui-kit`, `integrations`, or `shared` when:

- ✅ It has no business logic (pure utilities)
- ✅ It's used by 2+ domains
- ✅ It could be extracted to an npm package
- ✅ It's design system components, validation, formatting, etc.

### Dependency Rules

```
✅ domains/ → shared/          (domains use shared utilities)
✅ domains/ → integrations/    (domains use infrastructure)
✅ domains/ → ui-kit/          (domains use design system)
✅ shared/ → ui-kit/           (shared components use design system)

❌ ui-kit/ → domains/          (design system doesn't know domains)
❌ integrations/ → domains/    (infrastructure doesn't know domains)
❌ shared/ → domains/          (shared doesn't know specific domains)

⚠️ domains/X/ ↔ domains/Y/    (minimize cross-domain dependencies)
```

If two domains need to communicate:

- Use shared types in `shared/types`
- Create integration layer
- Use events/messaging patterns (for complex systems)

### Module Organization

Each domain/subdomain should follow this structure:

```
domain-name/
├── components/          # UI components (domain-specific)
├── containers/          # Page-level components (imported by app routes)
├── hooks/               # React hooks (domain-specific)
├── services/            # Business logic & API calls
├── types/               # TypeScript types
├── utils/               # Utilities (domain-specific)
└── shared/              # Shared within THIS domain only
```

Not every domain needs all folders - only create what you need.

## Import Patterns

### TypeScript Path Aliases

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/ui-kit/*": ["./src/ui-kit/*"],
      "@/integrations/*": ["./src/integrations/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/domains/*": ["./src/domains/*"],
      "@/app/*": ["./src/app/*"]
    }
  }
}
```

### Import Examples

```tsx
// Design system
import { Button, Input } from '@/ui-kit/components/Button'

// Infrastructure
import { firestore } from '@/integrations/firebase'
import { QueryProvider } from '@/integrations/tanstack-query/root-provider'

// Shared
import { cn } from '@/shared/lib/cn'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { useCurrentUser } from '@/shared/hooks/useCurrentUser'

// Domain code
import { EventThemeProvider } from '@/domains/events/theming/components/ThemeProvider'
import { useEventTheme } from '@/domains/events/theming/hooks/useEventTheme'

// Routes (in domain containers)
import { Route } from '@/app/admin/events'
```

## Route File Pattern

Keep route files thin by importing containers from domains:

```tsx
// app/admin/events/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { EventsPage } from '@/domains/events/management/containers/EventsPage'
import { getEvents } from '@/domains/events/management/services/events.service'

export const Route = createFileRoute('/admin/events')({
  component: EventsPage,
  loader: async () => await getEvents(),
})
```

```tsx
// domains/events/management/containers/EventsPage.tsx
import { useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Route } from '@/app/admin/events'
import { EventList } from '../components/EventList'
import { EventFilters } from '../components/EventFilters'

export function EventsPage() {
  const router = useRouter()
  const events = Route.useLoaderData()

  // Component logic here...

  return (
    <div>
      <EventFilters />
      <EventList events={events} />
    </div>
  )
}
```

## Best Practices

### 1. Co-location

Keep related code together within domains/subdomains.

### 2. Single Responsibility

Each module (domain/subdomain) should have one clear responsibility.

### 3. Minimize Cross-Domain Dependencies

If you find yourself importing from another domain frequently, consider:

- Moving shared code to `shared/`
- Creating a new domain that both depend on
- Refactoring domain boundaries

### 4. Domain Language

Use domain-specific terminology within each bounded context. The same concept might have different names in different domains.

### 5. Progressive Complexity

Start simple. Only create subdomains when a domain becomes complex (5+ files, multiple concerns).

### 6. Avoid Premature Abstraction

Don't create shared utilities for one-off operations. Move code to `shared/` only when it's used by 2+ domains.

## Migration Guide

When refactoring existing code:

1. **Identify the domain** - Where does this code belong?
2. **Create domain structure** - Set up folders as needed
3. **Move containers** - Extract page components from app routes
4. **Extract shared code** - Move truly shared utilities to `shared/`
5. **Update imports** - Use new path aliases
6. **Update app routes** - Make them thin, import containers

## Summary

- **`ui-kit/`** - Pure design system, no business logic
- **`integrations/`** - Third-party service setup
- **`shared/`** - Shared utilities and components (used by multiple domains)
- **`domains/`** - Business logic organized by bounded contexts (DDD)
- **`app/`** - Thin routing layer, imports containers from domains

Follow DDD principles, minimize dependencies, and keep code organized by domain responsibility.
