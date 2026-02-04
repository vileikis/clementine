# Feature Specification: Schema Foundations (PRD 1A)

**Feature Branch**: `058-schema-foundations`
**Created**: 2026-02-04
**Status**: Draft

**Source Documents**:
- [PRD 1A: Schema Foundations](../../requirements/transform-v3/prd-1a-schemas.md)
- [Epic: Outcome-based Create (Transform v3)](../../requirements/transform-v3/epic.md)

## Overview

This specification defines the foundational Zod schemas required for the outcome-based Create system (Transform v3). These schemas enable admins to configure outcome generation (image, gif, video) and establish a unified response format for session data collection.

The schemas are foundational and will be consumed by:
- Experience configuration (PRD 1B)
- Session response handling (PRD 1C)
- Job snapshot processing (PRD 3)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Schema Validation for Create Outcome Configuration (Priority: P1)

As a system component consuming experience configuration, I need to validate the create outcome configuration so that invalid configurations are rejected before runtime.

**Why this priority**: Without valid schema definitions, downstream features (Admin UI, Cloud Functions) cannot be built. This is the foundation for all Transform v3 functionality.

**Independent Test**: Can be tested by writing unit tests that validate various configuration objects against the schema and verifying correct acceptance/rejection.

**Acceptance Scenarios**:

1. **Given** a valid image outcome configuration with prompt, model, and aspect ratio, **When** validated against the schema, **Then** validation passes and typed configuration is returned.
2. **Given** an outcome configuration with invalid model value, **When** validated against the schema, **Then** validation fails with descriptive error.
3. **Given** an outcome configuration with missing fields, **When** validated, **Then** defaults are applied (aiEnabled=true, empty prompt, empty refMedia, default model and aspectRatio).
4. **Given** a GIF outcome with options, **When** validated, **Then** GifOptions with fps and duration are accepted.
5. **Given** a Video outcome with options, **When** validated, **Then** VideoOptions with videoPrompt and duration are accepted.

---

### User Story 2 - Schema Validation for Session Responses (Priority: P1)

As a guest runtime system, I need to write unified session responses with step name and context so that prompt mentions can be resolved at generation time.

**Why this priority**: The session response schema is equally foundational - it defines how all guest interactions are captured and structured for AI processing.

**Independent Test**: Can be tested by validating various response objects representing different step types (inputs, captures) against the schema.

**Acceptance Scenarios**:

1. **Given** a text input response with stepName, stepType, and value, **When** validated, **Then** validation passes with correct typing.
2. **Given** a capture photo response with stepName, stepType, and MediaReference[] in context, **When** validated, **Then** validation passes.
3. **Given** a multi-select response with value array and context containing selected options, **When** validated, **Then** validation passes.
4. **Given** a response missing required stepName field, **When** validated, **Then** validation fails.

---

### User Story 3 - Media Display Name Validation (Priority: P2)

As an admin uploading reference media for prompts, I need display names that are safe for @{ref:...} mention syntax so that prompt resolution works correctly.

**Why this priority**: Display names enable the mention system in prompts. While important, this is secondary to the core outcome and response schemas.

**Independent Test**: Can be tested by validating various display name strings against the schema and verifying mention-safe names pass while invalid names fail.

**Acceptance Scenarios**:

1. **Given** a display name "hero-shot", **When** validated, **Then** validation passes (alphanumeric with hyphen).
2. **Given** a display name "User Photo 1", **When** validated, **Then** validation passes (alphanumeric with space).
3. **Given** a display name "logo.v2", **When** validated, **Then** validation passes (alphanumeric with period).
4. **Given** a display name with mention-breaking characters "logo}test" or "name:value" or "test{name", **When** validated, **Then** validation fails (contains `}`, `:`, or `{` which break mention syntax).
5. **Given** an empty display name, **When** validated, **Then** validation fails (name required).
6. **Given** existing media with invalid displayName from before validation was added, **When** parsed, **Then** schema falls back to "Untitled" (backward compatibility).

---

### Edge Cases

- What happens when outcome type is null? System treats as no outcome configured (valid state before admin configures).
- How does system handle future outcome types (gif, video)? Schema supports them with stub option types; runtime returns "coming soon" for unimplemented types.
- What happens when context contains unexpected data? Schema uses `z.unknown()` for context to support step-type-specific data without breaking on new step types.
- How are capture responses differentiated from input responses? Both use same schema; stepType determines interpretation (e.g., `capture.photo` vs `input.shortText`).
- What happens when existing media has invalid displayName? Schema uses `.catch('Untitled')` for backward compatibility - existing documents with invalid names still parse successfully.

## Requirements *(mandatory)*

### Functional Requirements

#### Media Display Name Schema

- **FR-001**: System MUST validate media display names to be mention-safe (alphanumeric, spaces, hyphens, underscores, and periods only). Characters `}`, `:`, and `{` MUST be rejected as they break mention syntax.
- **FR-002**: System MUST enforce display name length between 1 and 100 characters.
- **FR-003**: System MUST trim whitespace from display names before validation.
- **FR-004**: System MUST provide backward compatibility for existing media with invalid displayName by falling back to "Untitled".

#### Create Outcome Schema

- **FR-005**: System MUST support outcome types: `'image'`, `'gif'`, `'video'`, or `null`.
- **FR-006**: System MUST include top-level `captureStepId` field (string or null) for source media reference.
- **FR-007**: System MUST include top-level `aiEnabled` boolean field as global toggle for AI generation (default: true).
- **FR-008**: System MUST include `imageGeneration` block with: prompt (string, default empty), refMedia (MediaReference[], default empty), model (enum, default 'gemini-2.5-flash-image'), aspectRatio (enum, default '1:1').
- **FR-009**: System MUST define `aiImageModelSchema` and `aiImageAspectRatioSchema` locally in create-outcome.schema.ts (NOT imported from nodes/ai-image-node.schema.ts to avoid coupling to deprecated transformNodes).
- **FR-010**: System MUST include `options` field as discriminated union by `kind` field for type-specific settings.
- **FR-011**: ImageOptions MUST have `kind: 'image'` (empty for MVP, structure allows future extensions).
- **FR-012**: GifOptions MUST have `kind: 'gif'`, fps (1-60, default 24), and duration (0.5-30 seconds, default 3).
- **FR-013**: VideoOptions MUST have `kind: 'video'`, videoPrompt (string, default empty), and duration (1-60 seconds, default 5).

#### Session Response Schema

- **FR-014**: System MUST include `stepId` (string) linking response to step definition.
- **FR-015**: System MUST include `stepName` (string) for @{step:...} prompt resolution (works for both input AND capture steps).
- **FR-016**: System MUST include `stepType` (string) for response interpretation - no separate `kind` enum needed.
- **FR-017**: System MUST include `value` field supporting: string, string[], or null (default null).
- **FR-018**: System MUST include `context` field (unknown or null, default null) for step-specific structured data.
- **FR-019**: System MUST include `createdAt` and `updatedAt` timestamps (Unix milliseconds).
- **FR-020**: For capture steps, `value` MUST be null and media MUST be stored as MediaReference[] in `context` (always array, even for single items).
- **FR-021**: For input.multiSelect, `value` MUST be string[] and `context` contains MultiSelectOption[] with promptFragment/promptMedia.
- **FR-022**: For simple inputs (shortText, longText, scale, yesNo), `value` contains the primitive and `context` is null.

#### Barrel Exports

- **FR-023**: `createOutcomeSchema` and related types MUST be exported from `packages/shared/src/schemas/experience/index.ts`.
- **FR-024**: `sessionResponseSchema` and `SessionResponse` type MUST be exported from `packages/shared/src/schemas/session/index.ts`.
- **FR-025**: `mediaDisplayNameSchema` MUST be exported from `packages/shared/src/schemas/media/index.ts`.
- **FR-026**: All new schemas MUST be accessible via `@clementine/shared` import.

### Key Entities

- **MediaDisplayName**: Validated string for mention-safe media naming (1-100 chars, alphanumeric + space/hyphen/underscore/period). Falls back to "Untitled" for backward compatibility.
- **CreateOutcome**: Configuration object defining outcome type, source capture, AI toggle, imageGeneration config, and type-specific options.
- **ImageGenerationConfig**: Nested object containing prompt, refMedia array, model selection, and aspect ratio with sensible defaults.
- **ImageOptions**: Type-specific options with `kind: 'image'` discriminator (empty for MVP).
- **GifOptions**: Type-specific options with `kind: 'gif'`, fps, and duration fields.
- **VideoOptions**: Type-specific options with `kind: 'video'`, videoPrompt, and duration fields.
- **SessionResponse**: Unified response object capturing step answers/captures with stepName for prompt resolution, stepType for interpretation, value for analytics, and context for rich data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All schema definitions compile without TypeScript errors and infer correct types.
- **SC-002**: 100% of valid configuration objects pass schema validation without false negatives.
- **SC-003**: 100% of invalid configuration objects fail validation with descriptive error messages.
- **SC-004**: Schemas support forward compatibility (using looseObject pattern) for future field additions.
- **SC-005**: All schemas are exported from shared package index and consumable by app and functions workspaces.
- **SC-006**: Unit test coverage achieves 100% branch coverage for validation logic.
- **SC-007**: Schema documentation (JSDoc comments) explains purpose and usage for each schema.

## Assumptions

- Existing `mediaReferenceSchema` will be reused for refMedia in imageGeneration.
- `aiImageModelSchema` and `aiImageAspectRatioSchema` are defined locally in create-outcome.schema.ts (not imported from deprecated transformNodes).
- The `stepName` validation will follow the existing `experienceStepNameSchema` pattern.
- GIF and video outcome options are schema stubs only - not implemented in MVP.
- Schemas will be placed in `packages/shared/src/schemas/` following existing directory structure.
- The `context` field uses `z.unknown()` to support evolving step types without schema changes.

## Out of Scope

- Experience config schema changes (PRD 1B)
- Session schema integration with responses array (PRD 1C)
- Job snapshot schema updates (PRD 3)
- Passthrough mode validation (aiEnabled=false requires captureStepId) - this is publish-time validation in PRD 1B
- Admin UI components
- Cloud Function implementation
- Migration of existing data
