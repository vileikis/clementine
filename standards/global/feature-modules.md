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
│   └── ComponentName.tsx
├── hooks/              # React hooks specific to this feature
│   └── useFeatureName.ts
├── actions/            # Server actions (marked "use server")
│   ├── [domain].ts
│   └── [domain].test.ts
├── repositories/       # Data layer (Firebase, API calls - server-only)
│   ├── [domain].ts
│   └── [domain].test.ts
├── lib/                # Utilities and validation schemas
│   ├── validation.ts
│   ├── constants.ts
│   └── utils.ts
├── types/              # TypeScript types specific to this feature
│   └── [feature].types.ts
└── index.ts            # Public API (exports components, actions, types)
```

## Key Principles

### 1. Flattened by Technical Concern

Group files by their **technical role** (actions, repositories, components), not by feature domain.

**✅ Good:**
```
features/events/
├── actions/
│   ├── events.ts
│   └── scenes.ts
├── repositories/
│   ├── events.ts
│   └── scenes.ts
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

### 2. Component Subfolders (Optional)

For features with many components, use **descriptive subfolders** to organize by UI context:

```
features/events/
├── components/
│   ├── studio/          # Event list & management UI
│   │   ├── EventCard.tsx
│   │   └── EventForm.tsx
│   ├── designer/        # Event builder UI
│   │   ├── WelcomeEditor.tsx
│   │   └── EndingEditor.tsx
│   └── shared/          # Components used across studio & designer
│       └── EventTabs.tsx
```

**Use descriptive names**: `studio/`, `designer/`, `photo/` - NOT generic names like `common/`, `misc/`

### 3. Single Public API

Each feature exports a **single public API** via `index.ts`.

**What to export:**
- ✅ Components (client & server components)
- ✅ Server actions (marked with `"use server"`)
- ✅ TypeScript types
- ✅ Constants
- ✅ Validation schemas

**What NOT to export:**
- ❌ Repository functions (use Firebase Admin SDK - server-only)
- ❌ Cache functions (often use server-only APIs)
- ❌ Any function importing `firebase-admin`, `fs`, `path`, or Node.js modules

**Example:**
```typescript
// features/events/index.ts

// ✅ Safe to export (components)
export { EventCard } from "./components/studio/EventCard";

// ✅ Safe to export (server actions)
export { createEventAction } from "./actions/events";

// ✅ Safe to export (types)
export type { Event } from "./types/event.types";

// ❌ NOT exported (repository - server-only)
// Import directly: @/features/events/repositories/events
```

**Why:** Repository functions use server-only packages (like `firebase-admin`). When exported from `index.ts`, client components that import from the feature will try to bundle server-only dependencies, causing build errors.

## Folder Descriptions

### `/components/`
React components for UI. Can have subfolders for organization when feature has 10+ components.

### `/hooks/`
React hooks specific to this feature. Custom hooks that encapsulate feature logic.

### `/actions/`
Server actions (functions marked with `"use server"`). Safe to export from public API and can be called from client components.

**File naming:** `[domain].ts` (e.g., `events.ts`, `scenes.ts`, `companies.ts`)

### `/repositories/`
Data layer functions that interact with databases, APIs, or Firebase. Use server-only packages (like `firebase-admin`) and should **NOT be exported** from the public API.

**File naming:** `[domain].ts` (e.g., `events.ts`, `scenes.ts`, `companies.ts`)

### `/lib/`
Utilities, constants, and validation schemas specific to this feature.

**Common files:**
- `validation.ts` - Zod schemas
- `constants.ts` - Feature-specific constants
- `utils.ts` - Helper functions
- `cache.ts` - Caching utilities (if needed)

### `/types/`
TypeScript type definitions for this feature's domain models.

**File naming:** `[feature].types.ts` (e.g., `event.types.ts`, `company.types.ts`)

### `/index.ts`
The feature's **public API**. This is the single entry point for importing from outside the feature.

## Import Patterns

### Within a Feature (Internal)

Use **relative imports** for files within the same feature:

```typescript
// features/events/actions/events.ts
import { getEvent } from "../repositories/events";
import { eventSchema } from "../lib/validation";
```

### From Another Feature (Cross-Feature)

Use **public API** for components, actions, and types:

```typescript
// features/experiences/components/photo/PromptEditor.tsx
import { updateSceneAction } from "@/features/events";
```

Use **direct imports** only for repository functions (in server-only code):

```typescript
// features/sessions/actions/sessions.ts
import { getEvent } from "@/features/events/repositories/events";
```

### From App Routes

Prefer **public API** for most imports:

```typescript
// app/(admin)/events/page.tsx
import { EventCard, listEventsAction } from "@/features/events";
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

### ❌ Nested lib/ with Mixed Concerns
```
features/events/
└── lib/
    ├── actions.ts
    ├── repository.ts
    ├── scenes-actions.ts
    └── scenes-repository.ts
```

Use separate folders: `actions/`, `repositories/`, `lib/` (for validation/utils only).

### ❌ Generic Subfolder Names
```
components/
├── common/
├── shared/
└── misc/
```

Use descriptive names that convey UI context: `studio/`, `designer/`, `photo/`.

### ❌ Exporting Repository Functions
```typescript
// features/events/index.ts
export { getEvent } from "./repositories/events"; // ❌ Server-only!
```

This causes "Module not found: Can't resolve 'tls'" errors when client components import from the feature.

### ❌ Bypassing Public API
```typescript
// ❌ Bad
import { helper } from '@/features/events/lib/helpers';

// ✅ Good
import { helper } from '@/features/events';
```

Always import through the public API unless you're importing repository functions in server-only code.

## Questions?

When in doubt:
1. **Is it specific to a product feature?** → `features/[feature]/`
2. **Is it shared across many features?** → `components/shared/` or `lib/`
3. **Is it route-specific only?** → `app/[route]/_components/`
4. **Is it a design system primitive?** → `components/ui/` (shadcn)
