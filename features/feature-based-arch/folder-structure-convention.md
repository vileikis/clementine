# Feature Folder Structure Convention

This document defines the standardized folder structure for feature modules in the Clementine codebase.

## Overview

All feature modules follow a **flattened structure** where technical concerns (actions, repositories, components) are separated into dedicated top-level folders within each feature. This makes the codebase easier to navigate and scale.

## Standard Feature Structure

```
features/[feature-name]/
├── components/          # React components
│   ├── [subfolder]/    # Optional subfolders for organization (e.g., studio/, designer/)
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

Group files by their **technical role** (actions, repositories, components), not by feature domain:

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

### 2. Multiple Domains Within a Feature

When a feature contains multiple domains (e.g., events + scenes), organize by domain **within each technical folder**:

```
features/events/
├── actions/
│   ├── events.ts        # Event-related actions
│   └── scenes.ts        # Scene-related actions
├── repositories/
│   ├── events.ts        # Event data layer
│   └── scenes.ts        # Scene data layer
```

### 3. Component Subfolders (Optional)

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

### 4. Single Public API

Each feature exports a **single public API** via `index.ts`:

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

## Real-World Examples

### Example 1: Events Feature

```
features/events/
├── components/
│   ├── studio/              # Event list & management
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   └── EventStatusSwitcher.tsx
│   ├── designer/            # Event builder UI
│   │   ├── WelcomeEditor.tsx
│   │   ├── EndingEditor.tsx
│   │   └── PreviewPanel.tsx
│   └── shared/              # Shared components
│       ├── EventTabs.tsx
│       └── EditableEventName.tsx
├── hooks/
├── actions/
│   ├── events.ts            # Event CRUD actions
│   ├── events.test.ts
│   ├── scenes.ts            # Scene-related actions
│   └── scenes.test.ts
├── repositories/
│   ├── events.ts            # Event data layer
│   ├── events.test.ts
│   ├── scenes.ts            # Scene data layer
│   └── scenes.test.ts
├── lib/
│   └── validation.ts        # Zod schemas
├── types/
│   └── event.types.ts       # Event, EventStatus, Scene types
└── index.ts                 # Public API
```

**Usage:**
```typescript
// ✅ Use public API for components and actions
import { EventCard, createEventAction } from "@/features/events";

// ✅ Import repository directly in server-only code
import { getEvent } from "@/features/events/repositories/events";
```

### Example 2: Companies Feature

```
features/companies/
├── components/
│   ├── CompanyCard.tsx
│   ├── CompanyForm.tsx
│   └── CompanyFilter.tsx
├── actions/
│   ├── companies.ts
│   └── companies.test.ts
├── repositories/
│   ├── companies.ts
│   └── companies.test.ts
├── lib/
│   ├── cache.ts             # Company status caching
│   └── validation.ts
├── types/
│   └── company.types.ts
└── index.ts
```

### Example 3: Experiences Feature

```
features/experiences/
├── components/
│   ├── shared/              # Cross-experience components
│   │   ├── ExperiencesList.tsx
│   │   └── ExperienceEditor.tsx
│   └── photo/               # Photo-specific components
│       ├── AITransformSettings.tsx
│       ├── CountdownSettings.tsx
│       └── PromptEditor.tsx
├── actions/
│   └── experiences.ts
├── repositories/
│   └── experiences.ts
├── lib/
│   ├── constants.ts         # AI_MODELS, DEFAULT_AI_MODEL
│   └── validation.ts
├── types/
│   └── experience.types.ts
└── index.ts
```

## Folder Descriptions

### `/components/`
React components for UI. Can have subfolders for organization.

**When to use subfolders:**
- Feature has many components (10+)
- Components serve different UI contexts (studio vs designer, shared vs photo-specific)
- Subfolders should be **descriptive** (studio, designer, photo) not generic (common, shared)

### `/hooks/`
React hooks specific to this feature. Custom hooks that encapsulate feature logic.

### `/actions/`
Server actions (functions marked with `"use server"`). These are safe to export from the public API and can be called from client components.

**File naming:** `[domain].ts` (e.g., `events.ts`, `scenes.ts`, `companies.ts`)

### `/repositories/`
Data layer functions that interact with databases, APIs, or Firebase. These use server-only packages (like `firebase-admin`) and should **NOT be exported** from the public API.

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

## Anti-Patterns

### ❌ Nested `lib/` with Mixed Concerns

**Bad:**
```
features/events/
└── lib/
    ├── actions.ts
    ├── repository.ts
    ├── scenes-actions.ts
    ├── scenes-repository.ts
    └── validation.ts
```

**Problem:** Everything is mixed together. Hard to find files. Awkward naming required.

**Good:**
```
features/events/
├── actions/
│   ├── events.ts
│   └── scenes.ts
├── repositories/
│   ├── events.ts
│   └── scenes.ts
└── lib/
    └── validation.ts
```

### ❌ Generic Subfolder Names

**Bad:**
```
components/
├── common/
├── shared/
└── misc/
```

**Problem:** Doesn't convey meaning. Where does a new component go?

**Good:**
```
components/
├── studio/      # Event list & management
├── designer/    # Event builder
└── shared/      # Used by both studio & designer
```

### ❌ Exporting Repository Functions

**Bad:**
```typescript
// features/events/index.ts
export { getEvent } from "./repositories/events"; // ❌ Server-only!
```

**Problem:** Client components that import from the feature will try to bundle `firebase-admin`, causing build errors.

**Good:**
```typescript
// features/events/index.ts
export { getEventAction } from "./actions/events"; // ✅ Server action

// DO NOT export repository functions
// Import directly when needed in server code:
// import { getEvent } from "@/features/events/repositories/events"
```

## Migration Notes

When migrating existing code to this structure:

1. **Create the folder structure** first (actions/, repositories/, etc.)
2. **Move files** and rename to remove prefixes (scenes-actions.ts → scenes.ts)
3. **Update internal imports** within the feature
4. **Update public API** (index.ts) exports
5. **Update external imports** in other features and app routes
6. **Verify type checking** (`pnpm type-check`)

## Summary

✅ **Flatten by technical concern** (actions/, repositories/, components/)
✅ **Multiple domains = multiple files** (events.ts, scenes.ts)
✅ **Use descriptive subfolders** for components when needed
✅ **Single public API** via index.ts
✅ **Only export client-safe code** (components, actions, types)
✅ **Repository functions are never exported** (import directly)

This structure makes features **easy to navigate**, **scalable**, and **consistent** across the codebase.
