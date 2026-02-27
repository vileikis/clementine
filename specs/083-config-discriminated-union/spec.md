# Feature Specification: Experience Config Discriminated Union

**Feature Branch**: `083-config-discriminated-union`
**Created**: 2026-02-27
**Status**: Draft
**Input**: PRD P5.5 — Refactor ExperienceConfig from a flat bag of nullable type-specific configs into a Zod discriminated union keyed on `type`. Remove the top-level `experience.type` field and replace it with a denormalized `draftType` query field.

## User Scenarios & Testing

### User Story 1 — Schema & Config Restructure (Priority: P1)

As a developer working on experience configuration, the shared schema should represent each experience config as a self-describing discriminated union so that TypeScript narrows the config shape automatically after checking `config.type`, eliminating manual null-checks for type-specific fields.

**Why this priority**: This is the foundational change — every other story depends on the new schema shape. Without it, nothing else can be updated.

**Independent Test**: Create experiences of each type (survey, photo, ai.image, ai.video) and verify that Zod parsing produces the correct discriminated variant. Verify that accessing `config.type` narrows the TypeScript type so that type-specific fields (e.g., `aiImage` on an `ai.image` config) are accessible without null-checks, and irrelevant fields (e.g., `photo` on an `ai.image` config) are absent from the type.

**Acceptance Scenarios**:

1. **Given** a raw config object with `type: 'photo'` and a `photo` field, **When** parsed through the config schema, **Then** the result is typed as the photo variant with `photo` required and no `aiImage`/`aiVideo`/`gif`/`video` fields on the type.
2. **Given** a raw config object with `type: 'ai.image'` but missing the `aiImage` field, **When** parsed through the config schema, **Then** a validation error is returned (structural check enforced at parse time).
3. **Given** a raw config object with `type: 'survey'` and only `steps`, **When** parsed, **Then** the result is the survey variant with no type-specific config fields.
4. **Given** a config object with unknown extra fields (forward compatibility), **When** parsed, **Then** extra fields are preserved (loose object behavior).

---

### User Story 2 — Experience Document Field Migration (Priority: P1)

As a system administrator, all existing experience documents in the database should be migrated so that the top-level `type` field is removed, `draftType` is added, and both `draft` and `published` configs carry a `type` discriminant field.

**Why this priority**: Existing data must conform to the new schema before any app code can be updated. This is a hard prerequisite for all runtime changes.

**Independent Test**: Run the migration script against a database containing experiences of all types (survey, photo, ai.image, ai.video). Verify each document has `draftType` set, `type` removed, `draft.type` set, and `published.type` set (when published exists). Verify null type-specific config fields are cleaned up.

**Acceptance Scenarios**:

1. **Given** an experience with `type: 'photo'` and draft containing null fields for other types, **When** the migration runs, **Then** the document has `draftType: 'photo'`, `draft.type: 'photo'`, null config fields removed from draft, and no top-level `type` field.
2. **Given** an experience with a published config that is not null, **When** the migration runs, **Then** `published.type` is set to the original `experience.type` value and null type-specific fields are removed from published.
3. **Given** an experience with `published: null`, **When** the migration runs, **Then** `published` remains null.
4. **Given** the migration completes, **When** all documents are read back through the new schema, **Then** every document parses successfully without validation errors.

---

### User Story 3 — Admin UI Type Access Update (Priority: P2)

As an experience creator using the admin UI, the experience designer, create tab, and library should continue to work identically after the refactor — type badges display correctly, type switching works, config forms load the right panel, and the library type filter returns correct results.

**Why this priority**: This is the largest surface area of changes. The admin UI is the primary consumer of experience type, and every type-dependent UI path must be updated.

**Independent Test**: Navigate through the admin UI — create an experience, switch types, edit config, filter the library by type, and verify all behavior is identical to before the refactor.

**Acceptance Scenarios**:

1. **Given** an experience of type `ai.image`, **When** viewing the experience library, **Then** the type badge shows "AI Image" with the correct color, read from `draftType`.
2. **Given** the experience library with the "AI Image" filter active, **When** the query executes, **Then** only `ai.image` experiences are returned (query uses `draftType` field).
3. **Given** an experience open in the designer, **When** the create tab loads, **Then** the config form displayed matches the draft config's type (not a separate top-level field).
4. **Given** an experience of type `photo`, **When** the user switches to `ai.image`, **Then** the draft is replaced with a new config of type `ai.image` (preserving steps), and `draftType` is updated to `ai.image` in the same write.
5. **Given** the step config panel reads aspect ratio, **When** the experience type is `photo`, **Then** aspect ratio is read from the draft's photo config directly (narrowed via discriminated union, no null-check needed).

---

### User Story 4 — Validation Simplification (Priority: P2)

As a developer maintaining the validation logic, outcome validation should only contain semantic checks (captureStepId exists, prompt is non-empty, refMedia names unique) since structural checks ("is the right config present?") are now enforced by the discriminated union at parse time.

**Why this priority**: Directly enabled by P1. Reduces validation code and eliminates a class of bugs where structural and schema validation diverge.

**Independent Test**: Call the simplified validation function with each experience config variant and verify that only semantic errors are returned. Verify that missing config structure is caught at parse time, not by outcome validation.

**Acceptance Scenarios**:

1. **Given** a photo config with a valid `captureStepId`, **When** outcome validation is called, **Then** it returns valid with no errors.
2. **Given** an `ai.image` config with an empty prompt, **When** outcome validation is called, **Then** it returns an error for the prompt field.
3. **Given** the new validation function signature, **When** called with a config, **Then** it does not require a separate `type` parameter — `config.type` is used internally.
4. **Given** a `gif` or `video` config, **When** outcome validation is called, **Then** a "coming soon" error is returned (semantic check retained).

---

### User Story 5 — Publish Flow Update (Priority: P2)

As an experience creator publishing an experience, the publish action should copy the draft (including its `type` discriminant) to published, so that guests and backend services always read the type from the published config.

**Why this priority**: Publishing is a critical path. The type must travel with the config so published config is self-describing.

**Independent Test**: Create an experience, edit its draft, publish it, then verify `published.type` matches the draft type at time of publish. Change the draft type without re-publishing and verify `published.type` still reflects the previously published type.

**Acceptance Scenarios**:

1. **Given** a draft with type `ai.image`, **When** the experience is published, **Then** `published` is a complete copy of draft including `type: 'ai.image'`.
2. **Given** a published experience where the user changes draft type to `photo` without re-publishing, **When** a guest accesses the experience, **Then** the guest sees the published type as `ai.image` (the original published type), not `photo`.
3. **Given** a publish action, **When** validation runs, **Then** it uses the draft config directly (which includes `.type`) — no separate type parameter needed.

---

### User Story 6 — Backend & Guest Runtime Update (Priority: P3)

As a guest using a published experience (or a backend service processing a job), the system should read the experience type from the published config's type field and the config from the same published object, ensuring type and config are always consistent.

**Why this priority**: Backend and guest runtime are consumers of published config. They must read type from the self-describing config rather than a separate top-level field.

**Independent Test**: Trigger a transform pipeline job for an experience and verify the backend reads type from the published config's type field. Verify the guest runtime loads published config and routes correctly based on its type.

**Acceptance Scenarios**:

1. **Given** a backend service receiving a job for an `ai.image` experience, **When** it reads the experience document, **Then** it accesses the published config's type (not a top-level field) to determine the processing pipeline.
2. **Given** the transform pipeline start function, **When** it validates preconditions, **Then** it reads type from the published config and checks config existence via the discriminated union shape (no manual type-to-field mapping checks).
3. **Given** a job snapshot being created, **When** the snapshot builder runs, **Then** it reads `type` from the published config, not from a top-level experience field.

---

### User Story 7 — Database Index Update (Priority: P3)

As the system querying experiences by type, a composite index must exist for `status` + `draftType` on the experiences collection to support the library's type filter efficiently.

**Why this priority**: Required for the library filter to work without full collection scans, but only relevant after the field rename is deployed.

**Independent Test**: Deploy the updated index configuration and verify the experience library type filter executes without index-related errors.

**Acceptance Scenarios**:

1. **Given** the updated index deployed, **When** the experience library filters by type with active status, **Then** the query executes successfully and returns correct results.
2. **Given** the old index on `status` + `type`, **When** the migration is complete, **Then** the old index can be safely removed.

---

### Edge Cases

- What happens if `draftType` gets out of sync with `draft.type`? All write paths must update both atomically. If they diverge, the library filter may show stale results, but the actual config behavior (controlled by `draft.type`) remains correct. The `draftType` field is explicitly not a source of truth.
- What happens when an experience has `published.type` different from `draftType`? This is expected and correct — it means the user changed the draft type but hasn't re-published yet.
- What happens with `gif` and `video` experience types (coming soon)? They get discriminated union variants but remain blocked by semantic validation ("coming soon" error on publish).
- What happens if the migration script is run twice? It should be idempotent — if `draft.type` already exists and top-level `type` is already absent, the document is skipped or no-op updated.

## Requirements

### Functional Requirements

- **FR-001**: The experience config schema MUST be a discriminated union keyed on a `type` field, with one variant per experience type (survey, photo, gif, video, ai.image, ai.video).
- **FR-002**: Each discriminated union variant MUST use a loose object schema so that unknown fields are preserved during parsing (forward compatibility).
- **FR-003**: Each variant MUST include a shared `steps` array field plus only the type-specific config relevant to that variant (no nullable fields for other types).
- **FR-004**: The experience document schema MUST replace the top-level `type` field with a `draftType` field that is denormalized from `draft.type`.
- **FR-005**: The experience document's `draft` and `published` fields MUST use the discriminated union config schema, so each config is self-describing.
- **FR-006**: All write operations that modify `draft.type` MUST also update `draftType` in the same write/transaction.
- **FR-007**: The publish action MUST copy the entire draft config (including `type`) to `published`, making published config self-describing.
- **FR-008**: A one-time migration script MUST update all existing experience documents to conform to the new schema (inject `type` into configs, set `draftType`, remove top-level `type`, remove null config fields).
- **FR-009**: The migration script MUST be idempotent — running it multiple times produces the same result.
- **FR-010**: The outcome validation function MUST accept a config (which includes `type`) instead of requiring a separate `type` parameter.
- **FR-011**: Structural validation checks ("is the correct type-specific config present?") MUST be removed from outcome validation — the discriminated union enforces this at parse time.
- **FR-012**: Semantic validation checks (captureStepId exists in steps, prompt is non-empty, refMedia uniqueness, coming-soon blocking) MUST be retained.
- **FR-013**: The experience library type filter MUST query on `draftType` (flat field) instead of a top-level `type` or nested `draft.type` path.
- **FR-014**: A composite database index MUST exist for `status` + `draftType` on the experiences collection.
- **FR-015**: Backend services MUST read experience type from the published config's `type` field rather than a top-level document field.
- **FR-016**: The guest runtime MUST read type and config from the published config as a single self-describing object.
- **FR-017**: Admin UI components (create tab, designer, type badge, type switch, step config panel) MUST read type from the appropriate config (`draft.type` for editing, `draftType` for library display).

### Key Entities

- **ExperienceConfig** (discriminated union): Self-describing config with `type` discriminant. Variants: survey (steps only), photo (steps + photo config), ai.image (steps + aiImage config), ai.video (steps + aiVideo config), gif (steps + gif config), video (steps + video config).
- **Experience Document**: Document with `draftType` (denormalized query field), `draft` (discriminated union config), and `published` (discriminated union config or null). No top-level `type` field.
- **draftType**: Denormalized field on the experience document, always equal to `draft.type`. Used for queries and list display. Not a source of truth — `draft.type` is authoritative.

## Success Criteria

### Measurable Outcomes

- **SC-001**: After checking `config.type`, type-specific fields are accessible without null-checks — developers can access type-specific config directly on a narrowed variant without casting or guarding.
- **SC-002**: Outcome validation code is reduced by approximately 40% (structural presence checks removed), with only semantic checks remaining.
- **SC-003**: All existing experience documents pass the new schema validation after migration — zero parse errors across the entire collection.
- **SC-004**: The experience library type filter returns correct results using the `draftType` field — functional parity with the previous `type` field behavior.
- **SC-005**: Guest runtime and backend services correctly process experiences using the published config's type — no behavioral change from the user's perspective.
- **SC-006**: Adding a new experience type in the future requires adding one discriminated union variant — the compiler surfaces all locations that need updating via exhaustive checks.

## Assumptions

- **Pre-launch**: The codebase is pre-launch, so a one-time migration script is acceptable (no lazy/incremental migration needed).
- **Deployment order**: The migration script runs before any app code expecting the new schema is deployed.
- **Flat query field**: We use a flat `draftType` field for queries rather than a nested `draft.type` path, for simplicity and future subcollection split compatibility.
- **Loose object compatibility**: The discriminated union works with loose object variants — each variant can accept unknown extra fields while still discriminating on `type`.
- **No behavioral changes**: This is a pure refactor — no user-facing behavior changes. All existing functionality is preserved.
