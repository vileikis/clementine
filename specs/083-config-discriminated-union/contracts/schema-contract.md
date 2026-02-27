# Schema Contract: Experience Config Discriminated Union

**Feature**: 083-config-discriminated-union
**Date**: 2026-02-27

## ExperienceConfig Schema (discriminated union)

### Discriminant: `type`

```
type ExperienceConfig =
  | { type: 'survey';   steps: ExperienceStep[] }
  | { type: 'photo';    steps: ExperienceStep[]; photo: PhotoConfig }
  | { type: 'ai.image'; steps: ExperienceStep[]; aiImage: AIImageConfig }
  | { type: 'ai.video'; steps: ExperienceStep[]; aiVideo: AIVideoConfig }
  | { type: 'gif';      steps: ExperienceStep[]; gif: GifConfig }
  | { type: 'video';    steps: ExperienceStep[]; video: VideoConfig }
```

All variants use loose object semantics (unknown fields are preserved).

### Per-type config schemas (unchanged)

These schemas remain exactly as defined in `experience-config.schema.ts`:

- `PhotoConfig`: `{ captureStepId, aspectRatio }`
- `AIImageConfig`: `{ task, captureStepId, aspectRatio, imageGeneration }`
- `AIVideoConfig`: `{ task, captureStepId, aspectRatio, startFrameImageGen, endFrameImageGen, videoGeneration }`
- `GifConfig`: `{ captureStepId, aspectRatio }`
- `VideoConfig`: `{ captureStepId, aspectRatio }`

## Experience Document Schema

### Field contract

```
type Experience = {
  id: string
  name: string                        // 1-100 chars
  status: 'active' | 'deleted'
  draftType: ExperienceType           // NEW — denormalized from draft.type
  media: ExperienceMedia | null
  createdAt: number                   // Unix ms
  updatedAt: number                   // Unix ms
  deletedAt: number | null

  draft: ExperienceConfig             // Discriminated union
  published: ExperienceConfig | null  // Discriminated union | null

  draftVersion: number
  publishedVersion: number | null
  publishedAt: number | null
  publishedBy: string | null
}
```

### Removed field

- `type: ExperienceType` — no longer exists on the experience document

## Write Contracts

### Create Experience

**Input**: `{ workspaceId, name, type }`
**Writes**:
- `draftType: type`
- `draft: { type, steps: [], [typeConfig]: defaults }`
- All other fields: standard defaults

### Switch Experience Type

**Input**: `{ workspaceId, experienceId, newType }`
**Writes** (transaction):
- `draftType: newType`
- `draft: { type: newType, steps: existingSteps, [typeConfig]: defaults }`
- `draftVersion: increment(1)`
- `updatedAt: serverTimestamp()`

### Publish Experience

**Input**: `{ workspaceId, experienceId }`
**Writes** (transaction):
- `published: structuredClone(draft)` — type comes along with the config
- `publishedVersion`, `publishedAt`, `publishedBy`, `updatedAt`

### Duplicate Experience

**Input**: `{ workspaceId, experienceId }`
**Writes** (transaction):
- `draftType: source.draftType`
- `draft: structuredClone(source.draft)` — type comes along
- `published: structuredClone(source.published)` — type comes along
- Versions reset to unpublished state

## Query Contracts

### List experiences (with optional type filter)

**Before**: `where('type', '==', filterType)`
**After**: `where('draftType', '==', filterType)`

**Composite index required**: `status ASC, draftType ASC, createdAt DESC`

## Validation Contract

### validateConfig (renamed from validateOutcome)

**File rename**: `outcome-validation.ts` → `config-validation.ts`
**Function rename**: `validateOutcome()` → `validateConfig()`

**Before**: `validateOutcome(type: ExperienceType, config: ExperienceConfig | null, steps: ExperienceStep[])`
**After**: `validateConfig(config: ExperienceConfig, steps: ExperienceStep[])`

- `config.type` replaces the separate `type` parameter
- Structural checks removed (union enforces presence)
- Semantic checks retained (captureStepId, prompt, refMedia, coming-soon)

### hasTypeConfig (renamed from hasOutcome)

**File rename**: `hasTransformConfig.ts` → `config-checks.ts`
**Function rename**: `hasOutcome()` → `hasTypeConfig()`

**Before**: Switch on `experience.type`, check if `config.[type]` is non-null
**After**: `config.type !== 'survey'` (discriminated union guarantees type-specific config exists)
