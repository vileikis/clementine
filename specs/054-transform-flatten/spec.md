# Feature Specification: Flatten Transform Configuration

**Feature Branch**: `054-transform-flatten`
**Created**: 2026-01-31
**Status**: Draft
**Input**: User description: "Flatten transform.nodes to transformNodes at top level of ExperienceConfig"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Updates Schema References (Priority: P1)

A developer working on the Clementine codebase needs to access transform nodes configuration. After this refactor, they can access `config.transformNodes` directly instead of navigating through `config.transform?.nodes ?? []`.

**Why this priority**: This is the core value of the refactor - simplifying developer experience and reducing cognitive load when working with the schema.

**Independent Test**: Can be fully tested by importing the schema and verifying that `experienceConfigSchema` has a top-level `transformNodes` field that accepts an array of transform nodes.

**Acceptance Scenarios**:

1. **Given** a TypeScript file importing `experienceConfigSchema`, **When** the developer accesses the transform nodes, **Then** they can use `config.transformNodes` directly without null checking a nested `transform` object
2. **Given** a new `ExperienceConfig` object with default values, **When** the object is created, **Then** `transformNodes` defaults to an empty array `[]`
3. **Given** existing code using `config.transform?.nodes`, **When** the developer attempts to compile, **Then** TypeScript reports an error indicating the old path no longer exists

---

### User Story 2 - Cloud Functions Process Transform Nodes (Priority: P1)

Cloud Functions that execute the transform pipeline must correctly read transform nodes from the new `transformNodes` field.

**Why this priority**: Critical for production functionality - if Cloud Functions cannot read transform nodes, AI photo generation will break.

**Independent Test**: Can be verified by triggering a transform pipeline job and confirming it processes the nodes from the new field location.

**Acceptance Scenarios**:

1. **Given** an experience with `transformNodes` containing an AI Image node, **When** the transform pipeline is triggered, **Then** the Cloud Function reads the nodes from `transformNodes` and executes them
2. **Given** a job snapshot being built, **When** the snapshot is created, **Then** it uses `transformNodes` from the experience config

---

### User Story 3 - Frontend Editor Saves Transform Nodes (Priority: P2)

Experience creators using the Generate tab editor must be able to add, edit, and remove transform nodes, with changes persisting to Firestore under the new `transformNodes` field.

**Why this priority**: Important for ongoing feature usage but depends on schema changes being complete first.

**Independent Test**: Can be verified by adding a transform node in the UI, refreshing the page, and confirming the node persists.

**Acceptance Scenarios**:

1. **Given** the Experience Generate page, **When** a user adds a new transform node, **Then** the node is saved to `draft.transformNodes` in Firestore
2. **Given** the Transform Pipeline Editor, **When** a user reorders nodes, **Then** the updated order is saved to `draft.transformNodes`
3. **Given** the Transform Pipeline Editor, **When** a user deletes a node, **Then** it is removed from `draft.transformNodes`

---

### User Story 4 - Guest Experience Processes Transform Nodes (Priority: P1)

Guests visiting a shared experience link must have their uploaded photos/videos processed through the transform pipeline using the new `transformNodes` field.

**Why this priority**: Critical for end-user experience - guests are the primary users of the photobooth and must receive AI-transformed results.

**Independent Test**: Can be verified by visiting a guest experience link, uploading a photo, and confirming the AI transformation completes successfully.

**Acceptance Scenarios**:

1. **Given** a guest visiting an experience link, **When** they upload a photo, **Then** the guest domain code reads `transformNodes` from the published experience config
2. **Given** the guest domain processing a submission, **When** the transform pipeline is triggered, **Then** it uses `transformNodes` to determine which AI nodes to execute
3. **Given** a guest viewing their result, **When** the transformation completes, **Then** the output matches what was configured in the experience's `transformNodes`

---

### Edge Cases

- What happens when an experience has no transform nodes configured? `transformNodes` defaults to an empty array `[]`
- What happens when a new experience is created? It initializes with `transformNodes: []`

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace the `transform` field in `ExperienceConfig` schema with a top-level `transformNodes` array field
- **FR-002**: System MUST default `transformNodes` to an empty array `[]` when not specified
- **FR-003**: System MUST remove `transformConfigSchema` from the shared package exports
- **FR-004**: System MUST remove `outputFormatSchema` and related types from the shared package
- **FR-005**: System MUST update all frontend components (experience editor and guest domain) to read/write `transformNodes` instead of `transform.nodes`
- **FR-006**: System MUST update all Cloud Functions to read `transformNodes` instead of `transform.nodes`

### Key Entities

- **ExperienceConfig**: The configuration object for an experience, containing `steps` (collect tab) and `transformNodes` (generate tab). After this refactor, both are top-level arrays.
- **TransformNode**: Represents a single AI processing step (e.g., AI Image generation). Schema unchanged, only its container location changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All TypeScript code compiles without errors after schema changes
- **SC-002**: Transform pipeline jobs execute successfully using the new field path
- **SC-003**: Guest experience flow successfully processes photos through transform nodes
- **SC-004**: No references to `transform.nodes` or `transform?.nodes` remain in the codebase after refactor
- **SC-005**: No references to `outputFormat` remain in the codebase after refactor

## Assumptions

- The `outputFormat` field is unused and can be safely removed without data loss concerns
- Pre-launch status means no production data migration is required
- TypeScript compilation will catch most code references to the old field path
- Existing tests will need updates to use the new field path

## Out of Scope

- Adding new transform node types
- Adding pipeline-level settings (e.g., `transformSettings`)
- Data migration for existing Firestore documents (pre-launch, not needed)
- Performance optimizations to transform processing
