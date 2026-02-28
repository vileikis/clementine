# Research: Experience Config Discriminated Union

**Feature**: 083-config-discriminated-union
**Date**: 2026-02-27

## R1: Zod discriminatedUnion + looseObject Compatibility

**Decision**: Use `z.discriminatedUnion('type', [...looseObject variants...])`.

**Rationale**: Verified in Zod 4.1.12 (the project's version) that `z.looseObject()` satisfies the `$ZodTypeDiscriminable` constraint required by `z.discriminatedUnion()`. All Zod object types (object, looseObject, strictObject) implement this interface. The combination is fully supported.

**Alternatives considered**:
- `z.union()` with manual refinement — rejected: no automatic type narrowing, more boilerplate
- Manual `.refine()` validation — rejected: less ergonomic, no compile-time narrowing
- `z.switch()` — not available in Zod 4.1.12

**Existing precedent**: The codebase already uses `z.discriminatedUnion()` for `experienceStepSchema` in `packages/shared/src/schemas/experience/step.schema.ts` with 7 variants.

## R2: Write Path Audit

**Decision**: 8 write paths identified that need updating. All use Firestore transactions.

**Complete inventory**:

| # | Operation | File | Key Fields | Impact |
|---|-----------|------|------------|--------|
| 1 | Create | `useCreateExperience.ts` | Sets `type`, builds draft via `buildDefaultDraft()` | Must set `draftType`, build draft with `type` discriminant, remove top-level `type` |
| 2 | Update metadata | `useUpdateExperience.ts` | `name`, `media` only | No change needed (doesn't touch type or draft) |
| 3 | Switch type | `switchExperienceType.ts` | Sets `type`, initializes `draft.[key]` | Must set `draftType`, replace entire `draft` with new discriminated config |
| 4 | Update draft (full) | `useUpdateExperienceDraft.ts` | Replaces entire `draft` | No change needed (draft already comes from caller) |
| 5 | Update config field | `updateExperienceConfigField.ts` | Dot-notation `draft.[key]` updates | No change needed (updates sub-fields, doesn't touch type) |
| 6 | Publish | `usePublishExperience.ts` | Copies `draft` to `published` | Already copies whole draft — type comes along for free. Remove `experience.type` reads from validation. |
| 7 | Duplicate | `useDuplicateExperience.ts` | Clones all fields from source | Must set `draftType` from source, remove `type` field |
| 8 | Delete | `useDeleteExperience.ts` | `status`, `deletedAt` only | No change needed |

**Critical write paths** (require changes): Create (#1), Switch type (#3), Publish (#6), Duplicate (#7).
**No-change write paths**: Update metadata (#2), Update draft (#4), Update config field (#5), Delete (#8).

## R3: Firestore Index Configuration

**Decision**: Replace existing `status + type + createdAt` composite index with `status + draftType + createdAt`.

**Current index** (`firebase/firestore.indexes.json`, lines 244-260):
```json
{
  "collectionGroup": "experiences",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

**New index**: Same structure but `type` → `draftType`.

**Deployment**: Via `firebase.json` → `firebase/firestore.indexes.json`. Deploy with `pnpm fb:deploy:indexes`.

## R4: Type Change Strategy (switchExperienceType)

**Decision**: Replace the current dot-notation type switch with a full draft replacement.

**Current behavior** (`switchExperienceType.ts`):
- Sets `experience.type = newType`
- Conditionally initializes `draft.[configKey]` if not already present
- Does NOT clear previous type's config (preserves for switching back)

**New behavior**:
- Build a new discriminated union config: `{ type: newType, steps: existingSteps, [typeConfig]: default }`
- Set `draft` to the new config (full replacement)
- Set `draftType = newType`
- Remove top-level `type` write

**Trade-off**: With the discriminated union, each config variant only contains its own type-specific fields. We can no longer preserve the old type's config when switching (since it's not part of the new variant's shape). This is acceptable — users don't expect config to survive type switches.

## R5: buildDefaultDraft Refactor

**Decision**: Refactor `buildDefaultDraft()` to return discriminated union variants instead of flat nullable configs.

**Current** (`useCreateExperience.ts`, lines 45-103):
- Returns `{ steps, photo: null, gif: null, video: null, aiImage: null, aiVideo: null }` with one non-null
- Callers don't pass `type` — it's set separately on the experience

**New**:
- Returns `{ type: 'ai.image', steps: [], aiImage: {...} }` (discriminated variant)
- Each case returns only the fields for that variant
- The `type` literal is included in the returned config

## R6: Cloud Functions Impact

**Decision**: Update `functions/src/` to read type from published config.

**Files affected**:
- `functions/src/repositories/job.ts` — `buildJobSnapshot()` reads `experience.type` at line 330
- `functions/src/callable/startTransformPipeline.ts` — reads `experience.type` at line 115, checks config presence at lines 139-150

**Change**: Both read from `experience.published.type` instead. The config presence checks (JC-005) become unnecessary since the discriminated union guarantees the right config is present.
