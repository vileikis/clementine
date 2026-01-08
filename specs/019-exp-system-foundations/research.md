# Research: Experience System Structural Foundations

**Feature**: 019-exp-system-foundations
**Date**: 2026-01-08
**Phase**: 0 - Research & Discovery

## Research Summary

This document consolidates research findings for establishing the structural foundations of the Experience System. Since this phase focuses on type definitions and scaffolding, the research primarily examines existing patterns in the codebase to ensure consistency.

---

## 1. Domain Structure Patterns

### Decision: Follow existing vertical slice architecture

**Rationale**: The codebase consistently uses a domain-driven design pattern with `shared/` subdirectories containing schemas, types, hooks, and queries. New domains should follow this pattern for consistency and maintainability.

**Alternatives Considered**:
- Flat structure (all files in domain root) - Rejected: Doesn't scale, inconsistent with existing domains
- Feature-based folders - Rejected: Already using this at a higher level, would create confusion

**Observed Pattern**:
```text
domains/{domain}/
├── shared/
│   ├── schemas/
│   │   ├── *.schema.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── *.types.ts
│   │   └── index.ts
│   ├── hooks/
│   ├── queries/
│   └── index.ts
├── {subdomain}/
└── index.ts
```

---

## 2. Schema Conventions

### Decision: Use Zod with `z.looseObject()` and `nullable().default(null)` pattern

**Rationale**:
- `z.looseObject()` provides forward compatibility when new fields are added
- `nullable().default(null)` is required because Firestore doesn't support `undefined`
- Consistent with existing schemas in `event/shared/schemas/`

**Alternatives Considered**:
- Strict object schemas - Rejected: Breaks when new fields are added to Firestore docs
- Optional fields with `undefined` - Rejected: Firestore converts `undefined` to `null` anyway

**Pattern Example**:
```typescript
export const experienceSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'deleted']).default('active'),
  deletedAt: z.number().nullable().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
})
```

---

## 3. Type Naming Conventions

### Decision: Use interface pattern with clear naming

**Rationale**: Consistent with existing types in `workspace/projects/types/` and `event/shared/types/`.

**Naming Patterns**:
| Category | Pattern | Example |
|----------|---------|---------|
| Entity | `{Entity}` | `Experience`, `Session`, `Step` |
| Entity schema | `{entity}Schema` | `experienceSchema`, `sessionSchema` |
| Input type | `{Entity}{Operation}Input` | `CreateSessionInput` |
| Input schema | `{entity}{Operation}InputSchema` | `createSessionInputSchema` |
| Enum | `{Entity}{Category}` | `StepCategory`, `ExperienceProfile` |

---

## 4. Step Registry Design

### Decision: Discriminated union with category-based step types

**Rationale**:
- Step types span multiple categories (info, input, capture, transform, share)
- Discriminated unions provide type safety when handling different step types
- Registry pattern allows extension without modifying core code

**Alternatives Considered**:
- Class hierarchy - Rejected: Overkill for type definitions, adds runtime overhead
- Simple string enum - Rejected: Doesn't capture step-specific configuration shapes

**Step Categories** (from architecture doc):
- `info` - Informational display
- `input` - User input collection (yesNo, scale, shortText, longText, multiSelect)
- `capture` - Media capture (photo, video, gif)
- `transform` - AI processing pipeline
- `share` - Sharing/download step

**Registry Structure**:
```typescript
type StepCategory = 'info' | 'input' | 'capture' | 'transform' | 'share'

interface StepDefinition<TCategory extends StepCategory, TConfig> {
  category: TCategory
  type: string
  configSchema: z.ZodSchema<TConfig>
  defaultConfig: () => TConfig
}
```

---

## 5. Runtime Engine Interface

### Decision: Imperative API with state accessors

**Rationale**: From architecture doc - the runtime engine provides sequential step execution with state accumulation. The interface is designed to support both guest and preview modes.

**API Shape** (from architecture doc):
```typescript
interface RuntimeEngine {
  // State accessors
  currentStep: Step | null
  currentStepIndex: number
  canProceed: boolean
  canGoBack: boolean

  // Navigation
  next(): Promise<void>
  back(): void

  // Data mutation
  setAnswer(stepId: string, answer: unknown): void
  setMedia(stepId: string, mediaRef: MediaReference): void

  // Accumulated state
  getAnswers(): Record<string, unknown>
  getOutputs(): Record<string, MediaReference>
}
```

---

## 6. Session API Design

### Decision: Function-based API with subscription pattern

**Rationale**: Matches TanStack Query patterns used elsewhere in the codebase. Subscription enables real-time updates for async transform jobs.

**API Shape** (from architecture doc):
```typescript
// Session creation
function createSession(input: CreateSessionInput): Promise<Session>

// Session subscription (real-time updates)
function subscribeSession(
  sessionId: string,
  callback: (session: Session) => void
): () => void // returns unsubscribe function

// Session mutations
function updateSessionProgress(sessionId: string, progress: SessionProgress): Promise<void>
function closeSession(sessionId: string): Promise<void>
```

**Session Properties**:
- `mode`: `'preview' | 'guest'` - Determines auth context
- `configSource`: `'draft' | 'published'` - Which experience config to use

---

## 7. ExperienceProfile Design

### Decision: Enum with validation functions per profile

**Rationale**: Profiles define valid step combinations. Empty validators in Phase 0 establish the contract; implementation comes in Phase 7.

**Profiles** (from architecture doc):
- `free` - Any valid step sequence
- `photobooth` - Requires capture → transform → share
- `survey` - Input steps only, no media
- `gallery` - View-only, no capture

**Validator Pattern**:
```typescript
enum ExperienceProfile {
  Free = 'free',
  Photobooth = 'photobooth',
  Survey = 'survey',
  Gallery = 'gallery',
}

interface ProfileValidationResult {
  valid: boolean
  errors: string[]
}

type ProfileValidator = (experience: Experience) => ProfileValidationResult

const profileValidators: Record<ExperienceProfile, ProfileValidator> = {
  [ExperienceProfile.Free]: () => ({ valid: true, errors: [] }),
  [ExperienceProfile.Photobooth]: () => ({ valid: true, errors: [] }), // Empty for Phase 0
  [ExperienceProfile.Survey]: () => ({ valid: true, errors: [] }),
  [ExperienceProfile.Gallery]: () => ({ valid: true, errors: [] }),
}
```

---

## 8. activeEventId Field

### Decision: Already exists in project schema - no changes needed

**Rationale**: The `activeEventId` field already exists in `project/shared/schemas/project.schema.ts`. No modifications are required for Phase 0.

**Location**: `apps/clementine-app/src/domains/project/shared/schemas/project.schema.ts`

**Status**: Already implemented. No action required.

---

## 9. Import Boundaries

### Decision: Strict domain isolation per architecture doc

**Rationale**: Prevents circular dependencies and keeps domains independently testable.

**Import Rules**:
1. `domains/experience` must NOT import from `domains/event` or `domains/guest`
2. `domains/event` and `domains/guest` MAY import from `domains/experience` and `domains/session`
3. `domains/session` must NOT import UI from event/guest
4. No experience business rules in `src/shared/*`

---

## 10. Firestore Collections

### Decision: Subcollection pattern per architecture doc

**Rationale**: Experiences are scoped to events, sessions are scoped to projects. Subcollections provide natural access control boundaries.

**Collection Structure**:
```text
/projects/{projectId}
  /events/{eventId}
    event (doc)
    /experiences/{experienceId}
      experience (doc)
  /sessions/{sessionId}
    session (doc)
```

---

## Summary of Decisions

| Topic | Decision | Source |
|-------|----------|--------|
| Domain structure | Vertical slice with shared/ | Existing codebase |
| Schemas | Zod with looseObject pattern | Existing codebase |
| Type naming | Interface + {Entity}{Operation}Input | Existing codebase |
| Step registry | Discriminated union by category | Architecture doc |
| Runtime interface | Imperative API with state accessors | Architecture doc |
| Session API | Function-based with subscription | Architecture doc |
| ExperienceProfile | Enum with empty validators | Architecture doc |
| activeEventId | Already exists - no changes needed | Codebase exploration |
| Import boundaries | Strict domain isolation | Architecture doc |
| Firestore | Subcollection pattern | Architecture doc |

---

## Open Questions (Resolved)

All technical questions have been resolved through codebase exploration and architecture document review. No NEEDS CLARIFICATION items remain.
