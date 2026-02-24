# PRD P4 — Experience Type Flattening

> **Master Plan**: [plan-video-support.md](./plan-video-support.md)
> **Priority**: P4 — Architecture / Foundation
> **Area**: Shared Schema, App (Frontend), Cloud (Backend), Migration

---

## Objective

Unify `experience.profile` and `outcome.type` into a single `experience.type` field. Make the experience's identity — what kind of output it produces — a first-class, top-level concept selected at creation time.

## Why This Matters

Today, experience identity is split across two levels:

```
experience.profile = 'freeform'
  → experience.draft.outcome.type = 'ai.image'
```

"Freeform" carries no meaning — it's a pass-through. The real identity is the outcome type, but it's buried inside config. This creates problems:

1. **Creation UX is two-step** — Pick profile (meaningless choice), then pick outcome type (the real choice)
2. **Library cards can't show type** — Experience type isn't on the top-level document
3. **Unnecessary nesting** — `experience.draft.outcome.aiImage` is 3 levels deep for what should be a core config
4. **"Story" profile is unused** — Dead code adding confusion

### Strategic Context

Every future feature — filtering experiences by type, type-specific analytics, type badges in the library — needs to know "what kind of experience is this?" at the top level. Doing this now prevents retrofitting later.

---

## Requirements

### 1. New Experience Type Enum

Replace `experienceProfileSchema` with a unified type:

```ts
experienceTypeSchema = z.enum([
  'survey',
  'photo',
  'gif',
  'video',
  'ai.image',
  'ai.video',
])
```

- `survey` = data collection only, no Create tab, no outcome config
- All others = has outcome configuration (replaces "freeform" + outcome.type)

### 2. Flatten Outcome Config into Experience Config

**Before:**
```ts
experienceConfigSchema = {
  steps: [...],
  outcome: {
    type: 'ai.image',
    photo: null,
    aiImage: { task, captureStepId, aspectRatio, imageGeneration },
    aiVideo: null,
    ...
  }
}
```

**After:**
```ts
experienceConfigSchema = {
  steps: [...],
  // Per-type configs live directly on config (only active type is populated)
  photo: photoOutcomeConfigSchema.nullable().default(null),
  gif: gifOutcomeConfigSchema.nullable().default(null),
  video: videoOutcomeConfigSchema.nullable().default(null),
  aiImage: aiImageOutcomeConfigSchema.nullable().default(null),
  aiVideo: aiVideoOutcomeConfigSchema.nullable().default(null),
}
```

The `outcome` wrapper is removed. Type is on `experience.type`, configs are on `experience.draft.*`.

### 3. Update Creation Flow

Replace `ProfileSelector` in `CreateExperienceForm` with an `ExperienceTypePicker`:

- Shows all types: Photo, GIF (coming soon), Video (coming soon), AI Image, AI Video, Survey
- Selected type is stored as `experience.type`
- Type determines which config form appears in the Create tab

### 4. Update Create Tab

- **Survey type**: No Create tab at all (or show "No output configuration needed")
- **All other types**: Show the config form directly (no more `OutcomeTypePicker`)
- Type switching via `OutcomeTypeSelector` remains available in the Create tab header

### 5. Update Backend Snapshot Reading

The transform pipeline reads `snapshot.outcome.aiImage` etc. Update to read from the flattened config:

- `snapshot.config.aiImage` (or however the flattened structure is accessed)
- Update `OutcomeContext` type accordingly

### 6. Migration Script

Pre-launch — no backward compatibility logic needed. Write a Firestore migration script:

```
For each experience:
  1. Read experience.profile and experience.draft.outcome.type
  2. If profile === 'survey' → set experience.type = 'survey'
  3. If profile === 'freeform' → set experience.type = outcome.type (e.g., 'ai.image')
  4. If profile === 'story' → set experience.type = 'survey' (or delete if unused)
  5. Flatten outcome config fields into draft config
  6. Repeat for published config if exists
  7. Remove old fields (profile, draft.outcome wrapper)
```

Place migration script in `functions/scripts/migrations/`.

### 7. Remove Dead Code

- Remove `experienceProfileSchema` (replaced by `experienceTypeSchema`)
- Remove `outcomeSchema` wrapper (configs now live on `experienceConfigSchema`)
- Remove `OutcomeTypePicker` component (type selected at creation)
- Remove "story" profile and related code

---

## Out of Scope

- Changing per-type config schemas (photo, aiImage, aiVideo internals stay the same)
- Adding new experience types
- Changing the step system
- Backward compatibility logic in code (migration script handles it)

---

## Success Metrics

- Experience type visible at creation and in library cards
- Zero two-step type selection (profile → outcome type)
- One less nesting level in schema
- Migration script runs successfully on all existing data
- No runtime regressions
