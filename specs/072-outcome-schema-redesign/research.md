# Research: Outcome Schema Redesign — Photo & AI Image

**Branch**: `072-outcome-schema-redesign` | **Date**: 2026-02-19

## R1: Current Schema Structure → New Schema Mapping

**Decision**: Replace flat outcome schema with per-type config pattern using nullable config fields.

**Rationale**: The current schema uses a flat structure with `aiEnabled` boolean and conditional field interpretation. This creates ambiguity — the same fields mean different things depending on `aiEnabled`. The per-type config pattern makes each outcome type self-describing and eliminates conditional logic.

**Current → New mapping**:

| Current Field | New Location | Notes |
|---------------|-------------|-------|
| `type: 'image' \| 'gif' \| 'video'` | `type: 'photo' \| 'gif' \| 'video' \| 'ai.image' \| 'ai.video'` | 'image' splits into 'photo' and 'ai.image' |
| `aiEnabled` | Removed — encoded in type (`ai.image` vs `photo`) | No longer needed |
| `captureStepId` | `photo.captureStepId` or `aiImage.captureStepId` | Moved into per-type config |
| `aspectRatio` | `photo.aspectRatio` or `aiImage.aspectRatio` | Moved into per-type config |
| `imageGeneration.prompt` | `aiImage.prompt` | Flattened from nested object |
| `imageGeneration.model` | `aiImage.model` | Flattened from nested object |
| `imageGeneration.refMedia` | `aiImage.refMedia` | Flattened from nested object |
| `imageGeneration.aspectRatio` | Removed (was already deprecated) | Redundant with per-type aspectRatio |
| `options` (discriminated union) | Removed — per-type configs replace this | gif/video options move into their respective configs |

**Alternatives considered**:
- Keeping the discriminated union pattern (like current `options`) → Rejected because adding AI types makes the union unwieldy and the top-level fields still need conditional interpretation.
- Single nested config object with discriminated union → Rejected because it doesn't allow preserving configs when switching types.

---

## R2: Backward Compatibility Strategy

**Decision**: Use `z.looseObject()` at the outcome level to tolerate old fields during migration window.

**Rationale**: Zod v4's `z.looseObject()` ignores unknown fields during parsing. This means documents with old fields (`aiEnabled`, `imageGeneration`, etc.) will parse successfully through the new schema — unknown fields are silently dropped. This provides a safe migration window where old and new documents coexist.

**Alternatives considered**:
- Strict schema with explicit deprecated fields → Rejected because it pollutes the new schema with legacy baggage.
- Two-phase deployment (migration first, then schema change) → Rejected because the brief requires coordinated deployment.

---

## R3: Frontend Form Architecture

**Decision**: Refactor `CreateTabForm` to use a conditional rendering pattern based on `outcome.type`, with separate form components per type.

**Rationale**: The current `CreateTabForm` renders all fields in a single form with show/hide logic based on `aiEnabled`. The new architecture has distinct config shapes per type, making separate form components cleaner and more maintainable.

**Key design decisions**:
1. **OutcomeTypePicker** — Rewrite with two-group layout (Media + AI Generated). Replaces current card-based picker.
2. **OutcomeTypeSelector** — Keep as type switcher dropdown but update to new types.
3. **PhotoConfigForm** — New component: source step selector + aspect ratio. Extracted from current form.
4. **AIImageConfigForm** — New component: task toggle + conditional source step + aspect ratio + PromptComposer + model + ref media. Refactored from current form.
5. **PromptComposer** — Reuse as-is (no changes needed to Lexical editor, serialization, or mention system).
6. **AspectRatioSelector** — Reuse as-is.
7. **SourceImageSelector** — Reuse as-is.

**Autosave pattern**: Unchanged. The `useAutoSave` hook with 2-second debounce continues to work — the mutation payload shape changes but the pattern is identical.

---

## R4: Backend Executor Split

**Decision**: Split `imageOutcome.ts` into `photoOutcome.ts` and `aiImageOutcome.ts`.

**Rationale**: The current `imageOutcome` branches on `aiEnabled` internally. The new schema makes the type distinction explicit at the dispatcher level, so each executor handles exactly one flow.

**photoOutcome flow**:
1. Get source media from session responses using `captureStepId`
2. Download captured media to temp dir
3. Apply overlay if `overlayChoice` exists
4. Upload output → return `JobOutput`

**aiImageOutcome flow**:
1. If task is `image-to-image`: get source media from session responses using `captureStepId`
2. Resolve prompt mentions (`resolvePromptMentions`)
3. Call `aiGenerateImage` with resolved prompt, model, aspect ratio, source media, reference media
4. Apply overlay if `overlayChoice` exists
5. Upload output → return `JobOutput`

**Shared operations** (`aiGenerateImage`, `applyOverlay`, `resolvePromptMentions`): No changes needed. They accept parameters that map cleanly to both old and new schemas.

---

## R5: Job Snapshot Shape

**Decision**: Update `jobSnapshotSchema` to store the new outcome structure. The snapshot captures the active type's config at job creation time.

**Rationale**: The snapshot must contain everything needed to execute the job. With the new schema, this means storing the full outcome object (type + all per-type configs). The executor reads `outcome.type` to determine which config to use.

**Key insight**: The snapshot stores the entire `outcome` object, not just the active config. This preserves the full state for debugging and audit trails.

---

## R6: Migration Script Pattern

**Decision**: Follow the existing `042-flatten-events.ts` migration pattern with dry-run support, production flag, and batch processing.

**Rationale**: The existing migration script is well-structured with statistics tracking, error handling, and safety flags. Reusing this pattern ensures consistency.

**Idempotency strategy**: Check if the document already has the new schema format (presence of per-type config fields like `photo`, `aiImage`) before migrating. If already migrated, skip.

---

## R7: Aspect Ratio Cascade

**Decision**: When aspect ratio changes in the outcome config, cascade the change to the referenced capture step's config by updating `draft.steps[].config.aspectRatio`.

**Rationale**: The aspect ratio must be consistent between capture and output. The current system already does this — aspect ratio at the outcome level controls the camera capture, overlay resolution, and AI generation dimensions. Moving it into per-type configs doesn't change this cascade behavior.

**Implementation**: The frontend mutation that saves outcome config also writes the aspect ratio to the referenced capture step. This is an existing pattern that continues unchanged.
