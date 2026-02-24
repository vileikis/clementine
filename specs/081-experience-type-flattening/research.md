# Research: Experience Type Flattening

**Feature Branch**: `081-experience-type-flattening`
**Date**: 2026-02-24

## Decision 1: Schema Flattening Strategy

**Decision**: Remove `outcomeSchema` wrapper entirely. Move per-type configs (photo, aiImage, aiVideo, gif, video) directly onto `experienceConfigSchema`. Replace `experienceProfileSchema` with `experienceTypeSchema` on the experience document.

**Rationale**: The PRD is explicit about removing the outcome wrapper. The current nesting `experience.draft.outcome.aiImage` becomes `experience.draft.aiImage`. The type moves from `experience.draft.outcome.type` to `experience.type` (top-level on experience document). This is the cleanest approach and aligns with the spec's FR-002.

**Alternatives considered**:
- Keep outcome wrapper but add type to top level — rejected because it creates redundancy (type stored in two places)
- Rename outcome to something else — rejected because the wrapper adds no value

## Decision 2: Job Snapshot Structure

**Decision**: Flatten the job snapshot to mirror the new experience config structure. Replace `snapshot.outcome` with `snapshot.type` + per-type configs directly on the snapshot.

**Rationale**: The snapshot is an immutable copy of the experience config at job creation time. It should mirror the source structure. After flattening, `buildJobSnapshot` copies `experience.type` → `snapshot.type` and `experience.draft.[typeConfig]` → `snapshot.[typeConfig]`.

**Current snapshot path**: `snapshot.outcome.aiImage.task`
**New snapshot path**: `snapshot.aiImage.task`

**Alternatives considered**:
- Keep the outcome wrapper in snapshot only — rejected because it creates a translation layer between experience config and snapshot that adds confusion
- Store only active type's config — rejected because nullable per-type fields already achieve this (only active type is populated)

## Decision 3: Experience Type Enum Design

**Decision**: Create `experienceTypeSchema = z.enum(['survey', 'photo', 'gif', 'video', 'ai.image', 'ai.video'])`. This replaces both `experienceProfileSchema` (freeform/survey/story) and `outcomeTypeSchema` (photo/gif/video/ai.image/ai.video).

**Rationale**: The unified type answers "what kind of experience is this?" in a single value. 'survey' replaces the 'survey' profile. All other types replace 'freeform' + outcome.type combinations. 'story' is dead code and removed.

**Alternatives considered**:
- Keep `outcomeTypeSchema` as a separate derived type for backend use — rejected because it's simpler to use `experienceTypeSchema` everywhere and handle survey as a special case in the pipeline entry point

## Decision 4: Step Category Mapping

**Decision**: Map experience types to allowed step categories:
- `survey` → `['info', 'input', 'capture']` (same as old survey profile)
- All other types → `['info', 'input', 'capture', 'transform']` (same as old freeform profile)

**Rationale**: The old 'freeform' profile allowed all step categories. Since all non-survey types replace freeform, they inherit its permissions. Survey retains its existing restriction. The 'story' profile (info only) is removed entirely.

**Alternatives considered**:
- Different step categories per output type (e.g., photo doesn't need transform) — rejected because transform steps don't exist yet and over-restricting now limits future flexibility

## Decision 5: Slot Compatibility Mapping

**Decision**: Map experience types to slot compatibility:
- `survey` → `['main', 'pregate', 'preshare']` (same as old survey profile)
- All other types → `['main']` (same as old freeform profile)

**Rationale**: Surveys can be used in auxiliary slots (pre-gate, pre-share). Content-producing experiences are always the main experience.

## Decision 6: Backend Pipeline Entry Point

**Decision**: `startTransformPipeline` rejects survey-type experiences early (before job creation). The outcome executor registry remains keyed by non-survey types.

**Rationale**: Survey experiences produce no output and should never enter the transform pipeline. The existing validation (`IMPLEMENTED_OUTCOME_TYPES` check) naturally extends to this — survey is simply not in the set of implemented types.

## Decision 7: Migration Script Design

**Decision**: Follow existing migration pattern from `072-outcome-schema-redesign.ts`. Script processes all workspaces' experience documents, applying the flattening transformation. Supports `--dry-run` and `--production` flags. Idempotent — safe to re-run.

**Rationale**: Consistency with existing migration infrastructure. Idempotency ensures safety on partial failure and re-run.

**Migration mapping**:
| Old Structure | New Structure |
|--------------|---------------|
| `experience.profile = 'freeform'` | `experience.type = experience.draft.outcome.type` (e.g., 'ai.image') |
| `experience.profile = 'survey'` | `experience.type = 'survey'` |
| `experience.profile = 'story'` | `experience.type = 'survey'` (safe default) |
| `experience.draft.outcome.photo` | `experience.draft.photo` |
| `experience.draft.outcome.aiImage` | `experience.draft.aiImage` |
| `experience.draft.outcome.aiVideo` | `experience.draft.aiVideo` |
| `experience.draft.outcome.type` | Removed (redundant with experience.type) |
| `experience.draft.outcome` | Removed (wrapper eliminated) |
| Same for `experience.published.*` | Same flattening applied |

## Decision 8: Frontend Naming — Drop "Outcome" Terminology

**Decision**: Rename all frontend files/hooks/components that use "outcome" to reflect what they actually do after flattening. The "outcome" concept described the wrapper object being deleted; frontend code should use "experience config" or "type config" terminology instead.

**Renames**:
| Old Name | New Name | Reason |
|----------|----------|--------|
| `OutcomeTypeSelector` | `ExperienceTypeSwitch` | Switches experience type, not an "outcome" concept |
| `useUpdateOutcome` | `useUpdateExperienceConfig` | Updates the experience's type-specific configuration |
| `outcome-operations.ts` | `experience-config-operations.ts` | Contains defaults/helpers for experience config |
| `useOutcomeValidation` | `useExperienceConfigValidation` | Validates the experience's type-specific config |
| `RemoveOutcomeAction` | `ClearTypeConfigAction` | Clears the active type's configuration |
| `outcome-picker/` (directory) | Flatten into `create/components/` | Directory no longer meaningful after OutcomeTypePicker removal |

**Rationale**: Once the "outcome" wrapper is removed from the data model, keeping "outcome" in frontend names creates a disconnect. Developers would see `useUpdateOutcome` and look for an `outcome` object that no longer exists. The new names describe what these things actually do: manage the experience's type-specific configuration.

**Exception**: Backend executor names (`runOutcome`, `aiImageOutcome`, etc.) retain "outcome" because those functions literally produce the *outcome* of a processing job — the term is semantically correct there.

## Decision 9: Frontend Component Changes

**Decision**:
- Replace `ProfileSelector` with `ExperienceTypePicker` in creation form
- Replace `ProfileBadge` with `TypeBadge` in library cards
- Update `ExperiencesPage` filter tabs from profile-based to type-based
- Remove `OutcomeTypePicker` (absorbed into `ExperienceTypePicker`)
- Rename `OutcomeTypeSelector` → `ExperienceTypeSwitch`
- Rename `useUpdateOutcome` → `useUpdateExperienceConfig`
- Rename `outcome-operations.ts` → `experience-config-operations.ts`
- Rename `useOutcomeValidation` → `useExperienceConfigValidation`
- Rename `RemoveOutcomeAction` → `ClearTypeConfigAction`
- Update `CreateTabForm` to read type from `experience.type` and config from `experience.draft.[type]`

**Rationale**: Follows the spec requirements and naming convention decision (Decision 8). Type selection at creation replaces the two-step profile → outcome type flow. Library views reflect the new top-level type. All frontend naming reflects the flattened data model.
