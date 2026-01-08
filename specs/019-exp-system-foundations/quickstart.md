# Quickstart: Experience System Structural Foundations

**Feature**: 019-exp-system-foundations
**Date**: 2026-01-08
**Branch**: `019-exp-system-foundations`

## Overview

This guide helps developers get started with the Experience System foundations. Phase 0 establishes type definitions and scaffolding without functional implementation.

---

## Prerequisites

- Node.js 18+
- pnpm 10.18.1+
- Access to the clementine monorepo

---

## Setup

### 1. Checkout the feature branch

```bash
git checkout 019-exp-system-foundations
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Verify TypeScript compiles

```bash
cd apps/clementine-app
pnpm type-check
```

---

## Using the New Types

### Experience Domain

Import experience types from the new domain:

```typescript
// Import experience types
import {
  Experience,
  ExperienceConfig,
  experienceSchema,
  experienceConfigSchema,
} from '@/domains/experience'

// Import step types
import {
  Step,
  StepCategory,
  BaseStep,
  InfoStep,
  InputStep,
} from '@/domains/experience'

// Import profile types and validators
import {
  ExperienceProfile,
  ProfileValidationResult,
  validateExperienceProfile,
} from '@/domains/experience'

// Import runtime interface
import {
  RuntimeEngine,
  RuntimeState,
} from '@/domains/experience'
```

### Session Domain

Import session types from the new domain:

```typescript
// Import session types
import {
  Session,
  SessionMode,
  ConfigSource,
  SessionStatus,
  sessionSchema,
} from '@/domains/session'

// Import session API types
import {
  CreateSessionInput,
  UpdateSessionProgressInput,
  CreateSessionFn,
  SubscribeSessionFn,
} from '@/domains/session'
```

### Working with Schemas

Validate data using Zod schemas:

```typescript
import { experienceSchema } from '@/domains/experience'
import { sessionSchema } from '@/domains/session'

// Parse and validate experience data
const result = experienceSchema.safeParse(firestoreDoc)
if (result.success) {
  const experience: Experience = result.data
} else {
  console.error('Validation failed:', result.error)
}

// Parse session data
const session = sessionSchema.parse(sessionDoc)
```

### Profile Validation

Validate experience profiles (always passes in Phase 0):

```typescript
import {
  ExperienceProfile,
  validateExperienceProfile,
} from '@/domains/experience'

const result = validateExperienceProfile(
  ExperienceProfile.Photobooth,
  experienceConfig
)

if (!result.valid) {
  console.error('Profile validation failed:', result.errors)
}
```

---

## Domain Structure

After implementation, the domain structure will be:

```text
apps/clementine-app/src/domains/
├── experience/
│   ├── shared/
│   │   ├── schemas/
│   │   │   ├── experience.schema.ts
│   │   │   ├── step-registry.schema.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── experience.types.ts
│   │   │   ├── step.types.ts
│   │   │   ├── runtime.types.ts
│   │   │   ├── profile.types.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
│
└── session/
    ├── shared/
    │   ├── schemas/
    │   │   ├── session.schema.ts
    │   │   └── index.ts
    │   ├── types/
    │   │   ├── session.types.ts
    │   │   ├── session-api.types.ts
    │   │   └── index.ts
    │   └── index.ts
    └── index.ts
```

---

## Import Path Aliases

The following import aliases are available:

| Alias | Path |
|-------|------|
| `@/domains/experience` | `src/domains/experience` |
| `@/domains/session` | `src/domains/session` |

---

## Verification Checklist

After implementation, verify these work:

- [ ] `pnpm type-check` passes with no errors
- [ ] Can import from `@/domains/experience` without circular dependency warnings
- [ ] Can import from `@/domains/session` without circular dependency warnings
- [ ] `pnpm dev` starts without errors
- [ ] All schema validations work with test data

---

## Key Types Reference

### Experience Types

| Type | Description |
|------|-------------|
| `Experience` | Full experience document |
| `ExperienceConfig` | Configuration with steps |
| `Step` | Discriminated union of all step types |
| `StepCategory` | Step category enum |
| `ExperienceProfile` | Profile enum for validation |
| `RuntimeEngine` | Runtime engine interface |

### Session Types

| Type | Description |
|------|-------------|
| `Session` | Session document |
| `SessionMode` | `'preview' \| 'guest'` |
| `ConfigSource` | `'draft' \| 'published'` |
| `SessionStatus` | `'active' \| 'completed' \| 'abandoned' \| 'error'` |
| `CreateSessionInput` | Input for session creation |

---

## What's NOT Implemented (Future Phases)

Phase 0 is scaffolding only. The following are NOT implemented:

- **Runtime engine implementation** (Phase 3)
- **Session API implementation** (Phase 3)
- **Step renderers** (Phase 3+)
- **Experience editor UI** (Phase 5)
- **Profile validation logic** (Phase 7)
- **Transform pipeline** (Phase 8)

---

## Troubleshooting

### Import errors

If you see "Cannot find module" errors:

1. Ensure barrel exports exist in all `index.ts` files
2. Run `pnpm type-check` to see specific errors
3. Verify the path alias is configured in `tsconfig.json`

### Circular dependency warnings

If you see circular dependency warnings:

1. Check import paths follow the rules in `research.md`
2. `domains/experience` must NOT import from `domains/event` or `domains/guest`
3. Use type-only imports where possible: `import type { X } from ...`

---

## Next Steps

After Phase 0 is complete:

1. **Phase 1**: Implement main experiences CRUD in `domains/event/experiences/`
2. **Phase 2**: Implement guest join shell at `/join/[projectId]`
3. **Phase 3**: Implement runtime engine and session management
