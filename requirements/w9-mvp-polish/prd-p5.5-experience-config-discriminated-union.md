# PRD P5.5 — Experience Config: Discriminated Union Refactor

> **Master Plan**: [plan-video-support.md](./plan-video-support.md)
> **Priority**: P5.5 — Schema Refactor
> **Area**: Shared Schema + App + Functions

---

## Objective

Refactor `ExperienceConfig` from a flat bag of nullable type-specific configs into a **Zod discriminated union** keyed on `type`. Remove the top-level `experience.type` field and replace it with a denormalized `draftType` query field. Each config variant becomes self-describing, eliminating manual structural validation and enabling compile-time type narrowing.

## Why This Matters

### Current problems

1. **No compile-time narrowing** — After checking `type === 'photo'`, TypeScript still sees `config.photo` as `PhotoConfig | null`. Every access requires a null-check.
2. **Manual structural validation** — `outcome-validation.ts` hand-checks "is the right sub-config present for this type?" — work that a discriminated union gives for free at parse time.
3. **Dead weight in Firestore** — A photo experience carries `aiImage: null, aiVideo: null, gif: null, video: null`. Wasted fields.
4. **Type lives outside config** — `experience.type` is the source of truth, but the config doesn't carry it. Consumers must pass type and config separately everywhere.
5. **Sync ambiguity** — `experience.type` must be kept in sync with whatever the user is editing in draft. Easy to forget, hard to debug.

### What this unlocks

- **Type narrowing for free** — `if (config.type === 'photo')` narrows to `{ photo: PhotoConfig }`.
- **Validation simplification** — Structural "is config present?" checks become unnecessary. Only semantic validations remain (captureStepId exists, prompt is non-empty).
- **Cleaner Firestore docs** — Each config only carries fields relevant to its type.
- **Exhaustive switch enforcement** — TypeScript ensures every type is handled in switch statements and dispatch maps.
- **Future subcollection split** — Self-describing configs are ready to live in their own documents when the 1MB doc limit becomes a concern.

---

## Design Decisions

### 1. Drop `experience.type`, introduce `experience.draftType`

**Current state:**

```
experience.type        ← source of truth, set at creation + type change
experience.draft       ← config without type
experience.published   ← config without type
```

**New state:**

```
experience.draftType   ← denormalized from draft.type, for queries/list views
experience.draft       ← { type: 'ai.image', steps: [...], aiImage: {...} }
experience.published   ← { type: 'photo', steps: [...], photo: {...} } | null
```

**Rationale:**

- Each config is self-describing — the `type` discriminant lives on the config itself.
- `draftType` is explicitly a denormalized query/display field, not a source of truth.
- The source of truth for type is always the config's own `type` field.
- `draftType` and `published.type` can differ (user changed type but hasn't published). This is correct and expected.

**Update rule:** Whenever `draft.type` changes, also set `draftType` in the same Firestore write. One extra field, same transaction.

**Consumer guide:**

| Context | Read from | Why |
|---|---|---|
| Admin UI (designer, create tab) | `experience.draft` (includes `.type`) | Editing the draft config |
| Guest runtime | `experience.published` (includes `.type`) | Guests see published version |
| Cloud functions (executor) | `experience.published` (includes `.type`) | Processing uses published config |
| Experience library list/filter | `experience.draftType` | Flat field for Firestore queries |

### 2. Future subcollection split compatibility

When the 1MB Firestore doc limit becomes a concern, the plan is to move configs to a subcollection:

```
/workspaces/{wId}/experiences/{eId}              ← metadata (name, status, draftType, ...)
/workspaces/{wId}/experiences/{eId}/configs/draft
/workspaces/{wId}/experiences/{eId}/configs/published
```

Today's refactor prepares for this:

- Each config is self-describing (carries its own `type`), so it can live in its own document.
- `draftType` on the metadata doc already exists for queries — no migration needed for the query layer.
- Guest runtime and cloud functions read a single config doc and have everything they need.

---

## Requirements

### 1. Discriminated Union Config Schema

Replace the flat `experienceConfigSchema` with a `z.discriminatedUnion` on `type`:

```ts
// Base fields shared by all config variants
const configBase = { steps: z.array(experienceStepSchema).default([]) }

const surveyConfigSchema = z.looseObject({
  type: z.literal('survey'),
  ...configBase,
})

const photoExperienceConfigSchema = z.looseObject({
  type: z.literal('photo'),
  ...configBase,
  photo: photoConfigSchema,
})

const aiImageExperienceConfigSchema = z.looseObject({
  type: z.literal('ai.image'),
  ...configBase,
  aiImage: aiImageConfigSchema,
})

const aiVideoExperienceConfigSchema = z.looseObject({
  type: z.literal('ai.video'),
  ...configBase,
  aiVideo: aiVideoConfigSchema,
})

const gifExperienceConfigSchema = z.looseObject({
  type: z.literal('gif'),
  ...configBase,
  gif: gifConfigSchema,
})

const videoExperienceConfigSchema = z.looseObject({
  type: z.literal('video'),
  ...configBase,
  video: videoConfigSchema,
})

export const experienceConfigSchema = z.discriminatedUnion('type', [
  surveyConfigSchema,
  photoExperienceConfigSchema,
  aiImageExperienceConfigSchema,
  aiVideoExperienceConfigSchema,
  gifExperienceConfigSchema,
  videoExperienceConfigSchema,
])
```

Each variant uses `z.looseObject()` for forward compatibility with future fields.

### 2. Experience Document Schema Changes

```ts
export const experienceSchema = z.looseObject({
  // Identity
  id: z.string(),
  name: z.string().min(1).max(100),

  // Metadata
  status: experienceStatusSchema.default('active'),

  // REMOVED: type — no longer a top-level field

  // NEW: denormalized query field (synced from draft.type)
  draftType: experienceTypeSchema,

  media: experienceMediaSchema.default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),

  // Configuration — each is a self-describing discriminated union
  draft: experienceConfigSchema,
  published: experienceConfigSchema.nullable().default(null),

  // Versioning
  draftVersion: z.number().default(1),
  publishedVersion: z.number().nullable().default(null),

  // Publish tracking
  publishedAt: z.number().nullable().default(null),
  publishedBy: z.string().nullable().default(null),
})
```

### 3. Firestore Index

Add a composite index for the experience library type filter:

```
Collection: workspaces/{wId}/experiences
Fields: status ASC, draftType ASC
```

This replaces the existing index on `status` + `type`.

### 4. Migration Script

Since we are pre-launch, write a one-time migration script that updates all existing experience documents:

**For each experience:**

1. Read `experience.type` and `experience.draft`
2. Set `experience.draft.type = experience.type`
3. If `experience.published` is not null, set `experience.published.type = experience.type`
4. Set `experience.draftType = experience.type`
5. Remove `experience.type` field
6. Remove null type-specific config fields from draft and published (e.g., remove `draft.aiImage` if type is `photo`)

Run as a Firebase Admin script in `functions/scripts/migrations/`.

### 5. Simplify outcome-validation.ts

With the discriminated union, structural validation ("is the right config present?") is handled by Zod at parse time. Simplify `outcome-validation.ts` to only contain **semantic validations**:

**Remove:**
- "Photo configuration is missing" check
- "AI Image configuration is missing" check
- "AI Video configuration is missing" check

**Keep:**
- `captureStepId` references an existing capture step
- AI image prompt is non-empty
- AI video prompt is non-empty
- refMedia displayName uniqueness
- Coming-soon type blocking (gif, video)

The validator function signature changes to accept the discriminated union directly:

```ts
// Before
function validateOutcome(type: ExperienceType, config: ExperienceConfig | null, steps: ExperienceStep[])

// After
function validateOutcome(config: ExperienceConfig, steps: ExperienceStep[])
```

The `type` parameter is no longer needed — it's on `config.type`.

### 6. App-Wide Type Access Updates

Update all code that reads `experience.type` to read from the appropriate source:

| Pattern | Before | After |
|---|---|---|
| Admin UI config forms | `experience.type` | `experience.draft.type` |
| Library list badge | `experience.type` | `experience.draftType` |
| Library filter query | `where('type', '==', ...)` | `where('draftType', '==', ...)` |
| Publish action | copies `draft` to `published` | copies `draft` to `published` (type comes along) + sets `draftType` |
| Guest runtime | `experience.type` + `experience.published` | `experience.published.type` + `experience.published` |
| Cloud functions | `experience.type` + `experience.published` | `experience.published.type` + `experience.published` |

### 7. Type Change Handling

When the user changes experience type in the admin UI:

1. Create a new draft config with the new type and default type-specific config
2. Preserve `steps` from the old draft
3. Write the new draft to Firestore
4. Update `draftType` in the same write

```ts
// Pseudocode
await updateDoc(experienceRef, {
  draft: { type: 'ai.image', steps: existingSteps, aiImage: defaultAiImageConfig },
  draftType: 'ai.image',
  updatedAt: Date.now(),
})
```

---

## Out of Scope

- Subcollection split for draft/published (future work)
- Changes to the per-type config schemas themselves (photoConfig, aiImageConfig, etc.)
- Changes to the step system or step schemas
- New experience types

---

## Success Metrics

- `experience.type` removed from schema — single source of truth is `config.type`
- Type narrowing works after checking `config.type` — no manual null-checks for type-specific config
- `outcome-validation.ts` reduced by ~40% (structural checks removed)
- All existing experiences migrated successfully
- Library type filter works via `draftType` field
- Guest runtime and cloud functions read type from `published.type`
