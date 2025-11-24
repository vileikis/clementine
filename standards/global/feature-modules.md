# Feature Modules

## Philosophy

Features are **vertical slices** of the application that encapsulate everything needed for a specific product capability. Each feature is a self-contained module with its own components, hooks, utilities, types, and business logic.

**One feature = one domain**

- Events is one feature (even though it has studio & designer UI)
- Experiences is one feature (even though it has photo/video/gif types)
- Companies is one feature
- Guest flow is one feature

## Standard Feature Structure

```
features/[feature-name]/
├── components/          # React components
│   ├── [subfolder]/    # Optional subfolders for organization
│   │   ├── ComponentName.tsx
│   │   └── index.ts    # Barrel export for subfolder
│   └── index.ts        # Barrel export for all components
├── hooks/              # React hooks specific to this feature
│   ├── useFeatureName.ts
│   └── index.ts        # Barrel export for all hooks
├── actions/            # Server actions (marked "use server")
│   ├── [domain].actions.ts
│   ├── [domain].actions.test.ts
│   └── index.ts        # Barrel export for all actions
├── repositories/       # Data layer (Firebase, API calls - server-only)
│   ├── [domain].repository.ts
│   ├── [domain].repository.test.ts
│   └── index.ts        # Barrel export for all repositories
├── schemas/            # Zod validation schemas (internal use only)
│   ├── [domain].schemas.ts
│   └── index.ts        # Barrel export for all schemas
├── types/              # TypeScript types (including Zod-inferred types)
│   ├── [domain].types.ts
│   └── index.ts        # Barrel export for all types
├── utils/              # Pure helper functions
│   ├── [purpose].utils.ts
│   └── index.ts        # Barrel export for all utils
└── index.ts            # Public API (exports components, hooks, types ONLY)
```

## Key Principles

### 1. Organized by Technical Concern

Group files by their **technical role** (actions, repositories, components, schemas, types), with each folder containing domain-specific files.

**✅ Good:**
```
features/events/
├── actions/
│   ├── events.actions.ts
│   ├── scenes.actions.ts
│   └── index.ts
├── repositories/
│   ├── events.repository.ts
│   ├── scenes.repository.ts
│   └── index.ts
├── schemas/
│   ├── events.schemas.ts
│   ├── scenes.schemas.ts
│   └── index.ts
```

**❌ Bad:**
```
features/events/
├── lib/
│   ├── actions.ts
│   ├── scenes-actions.ts
│   ├── repository.ts
│   └── scenes-repository.ts
```

### 2. Explicit File Naming

Use the pattern `[domain].[purpose].[ext]` even inside purpose-specific folders. This makes files instantly recognizable in search, tabs, and file switchers.

**Examples:**
- `events.actions.ts` (inside `actions/` folder)
- `events.repository.ts` (inside `repositories/` folder)
- `events.schemas.ts` (inside `schemas/` folder)
- `events.types.ts` (inside `types/` folder)

**Why?** When you search "event actions" (Cmd+P) or have multiple tabs open, you immediately know what each file is. No cognitive load from seeing 10 tabs called "index.ts".

### 3. Barrel Exports Everywhere

Every folder should have an `index.ts` that re-exports its contents:

```typescript
// features/events/actions/index.ts
export * from './events.actions';
export * from './scenes.actions';
```

This enables clean imports within the feature:
```typescript
import { createEventAction, createSceneAction } from '../actions';
```

### 4. Component Subfolders (Optional)

For features with many components, use **descriptive subfolders** to organize by UI context:

```
features/events/
├── components/
│   ├── studio/          # Event list & management UI
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   └── index.ts
│   ├── designer/        # Event builder UI
│   │   ├── WelcomeEditor.tsx
│   │   ├── EndingEditor.tsx
│   │   └── index.ts
│   └── index.ts         # Re-exports from all subfolders
```

**Use descriptive names**: `studio/`, `designer/`, `photo/` - NOT generic names like `common/`, `misc/`

### 5. Feature-Level Public API (Restricted)

Each feature has a **feature-level `index.ts`** that exports ONLY client-safe code.

**What to export:**
- ✅ Components (client & server components)
- ✅ Hooks
- ✅ TypeScript types (including Zod-inferred types from `types/`)

**What NOT to export:**
- ❌ Server actions (causes Next.js client import errors)
- ❌ Zod schemas (internal validation logic)
- ❌ Repository functions (server-only with `firebase-admin`)
- ❌ Utils (unless truly needed cross-feature)

**Example:**
```typescript
// features/events/index.ts

// ✅ Export components
export * from './components';

// ✅ Export hooks
export * from './hooks';

// ✅ Export types
export * from './types';

// ❌ NOT exported - import directly
// Actions: @/features/events/actions
// Schemas: @/features/events/schemas (internal use)
// Repositories: @/features/events/repositories
```

**Why restrict server actions?** Next.js will throw errors if client components import from a module that includes files marked with `"use server"`, even if they don't use those specific exports. Direct imports make this boundary explicit.

## Folder Descriptions

### `/components/`
React components for UI. Can have subfolders for organization (e.g., `studio/`, `designer/`). Each subfolder should have its own `index.ts` barrel export.

**File naming:** `ComponentName.tsx` (PascalCase)

### `/hooks/`
React hooks specific to this feature. Store hooks separately from components to allow reuse across multiple components.

**File naming:** `useFeatureName.ts` (camelCase with `use` prefix)

### `/actions/`
Server actions (functions marked with `"use server"`). Called from client components, server components, and other server actions. **NOT exported** from feature-level `index.ts` to avoid Next.js client bundling errors.

**File naming:** `[domain].actions.ts` (e.g., `events.actions.ts`, `scenes.actions.ts`)

### `/repositories/`
Data layer functions that interact with databases, APIs, or Firebase. Use server-only packages (like `firebase-admin`) and should **NOT be exported** from feature-level `index.ts`.

**File naming:** `[domain].repository.ts` (e.g., `events.repository.ts`, `scenes.repository.ts`)

### `/schemas/`
Zod validation schemas for runtime validation. Used internally by actions, repositories, and components. **NOT exported** from feature-level `index.ts`. Inferred types should be re-exported from `types/` folder instead.

**File naming:** `[domain].schemas.ts` (e.g., `events.schemas.ts`, `scenes.schemas.ts`)

**Example:**
```typescript
// features/events/schemas/events.schemas.ts
import { z } from 'zod';

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  // ...
});
```

### `/types/`
TypeScript type definitions including Zod-inferred types and other domain types. **Exported** from feature-level `index.ts` for use across the application.

**File naming:** `[domain].types.ts` (e.g., `events.types.ts`, `scenes.types.ts`)

**Example:**
```typescript
// features/events/types/events.types.ts
import type { z } from 'zod';
import { eventSchema } from '../schemas';

// Zod-inferred type
export type Event = z.infer<typeof eventSchema>;

// Derived types
export type EventListItem = Pick<Event, 'id' | 'title' | 'status'>;
export type CreateEventInput = Omit<Event, 'id' | 'createdAt'>;
```

### `/utils/`
Pure helper functions and utilities specific to this feature. Use for domain-specific logic that doesn't fit elsewhere.

**File naming:** `[purpose].utils.ts` (e.g., `url.utils.ts`, `date.utils.ts`)

### `/index.ts`
The feature's **public API**. Exports ONLY components, hooks, and types. Does NOT export actions, schemas, or repositories.

## Import Patterns

### Within a Feature (Internal)

Use **relative imports** with barrel exports:

```typescript
// features/events/actions/events.actions.ts
import { getEvent } from '../repositories';
import { eventSchema } from '../schemas';
import type { Event } from '../types';
```

### From Another Feature (Cross-Feature)

**For components, hooks, and types** → use feature-level public API:

```typescript
// features/experiences/components/photo/PromptEditor.tsx
import { EventCard, useEventStatus, type Event } from '@/features/events';
```

**For actions** → use direct folder import:

```typescript
// features/sessions/actions/sessions.actions.ts
import { createEventAction } from '@/features/events/actions';
```

**For repositories** → use direct folder import (server-only code):

```typescript
// features/sessions/actions/sessions.actions.ts
import { getEvent } from '@/features/events/repositories';
```

**For schemas** → use direct folder import (internal validation):

```typescript
// features/experiences/actions/experiences.actions.ts
import { eventSchema } from '@/features/events/schemas';
```

### From App Routes

**Client components:**
```typescript
// app/(admin)/events/page.tsx
import { EventCard, useEventStatus, type Event } from '@/features/events';
```

**Server components:**
```typescript
// app/(admin)/events/page.tsx
import { EventCard, type Event } from '@/features/events';
import { listEventsAction } from '@/features/events/actions';
```

**Route handlers / Server actions:**
```typescript
// app/api/events/route.ts
import { createEventAction } from '@/features/events/actions';
import { getEvent } from '@/features/events/repositories';
import { eventSchema } from '@/features/events/schemas';
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

## Anti-Patterns

### ❌ Kitchen Sink Feature
```
features/shared/  # Don't create a "shared" feature
```

If code is shared across features, put it in `components/shared/` or `lib/`.

### ❌ Deep Nesting
```
features/events/components/cards/list/event-list-card.tsx  # Too deep
```

Keep folder structure shallow and intuitive.

### ❌ Mixed Concerns in Single Folder
```
features/events/
└── lib/
    ├── actions.ts
    ├── repository.ts
    ├── schemas.ts
    └── utils.ts
```

Use separate folders by purpose: `actions/`, `repositories/`, `schemas/`, `utils/`.

### ❌ Generic Subfolder Names
```
components/
├── common/
├── shared/
└── misc/
```

Use descriptive names that convey UI context: `studio/`, `designer/`, `photo/`.

### ❌ Non-Explicit File Naming
```
actions/
├── events.ts           # ❌ Ambiguous in search/tabs
└── create.ts           # ❌ What does this create?
```

```
actions/
├── events.actions.ts   # ✅ Clear purpose
└── scenes.actions.ts   # ✅ Clear domain
```

### ❌ Exporting Server Actions from Feature Index
```typescript
// features/events/index.ts
export { createEventAction } from './actions'; // ❌ Breaks client imports!
```

This causes Next.js errors when client components import from the feature. Use direct imports instead:
```typescript
import { createEventAction } from '@/features/events/actions';
```

### ❌ Exporting Repositories from Feature Index
```typescript
// features/events/index.ts
export { getEvent } from './repositories'; // ❌ Server-only!
```

This causes "Module not found: Can't resolve 'tls'" errors when client components import from the feature.

### ❌ Exporting Schemas from Feature Index
```typescript
// features/events/index.ts
export { eventSchema } from './schemas'; // ❌ Internal validation logic
```

Export types instead:
```typescript
// features/events/index.ts
export type { Event } from './types';
```

### ❌ Importing Components Without Public API
```typescript
// ❌ Bad - bypasses public API
import { EventCard } from '@/features/events/components/studio/EventCard';

// ✅ Good - uses public API
import { EventCard } from '@/features/events';
```

### ❌ Missing Barrel Exports
```
actions/
├── events.actions.ts
└── scenes.actions.ts
# ❌ No index.ts!
```

Always add barrel exports:
```typescript
// actions/index.ts
export * from './events.actions';
export * from './scenes.actions';
```

## Questions?

When in doubt:
1. **Is it specific to a product feature?** → `features/[feature]/`
2. **Is it shared across many features?** → `components/shared/` or `lib/`
3. **Is it route-specific only?** → `app/[route]/_components/`
4. **Is it a design system primitive?** → `components/ui/` (shadcn)
