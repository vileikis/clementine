# Feature Specification: Experience Data Layer & Event Config Schema

**Feature Branch**: `021-exp-data-layer`
**Created**: 2026-01-10
**Status**: Draft
**Input**: Phases 1 and 2 from experience-system-roadmap.md - Experience data layer (CRUD operations) and event configuration schema updates

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Experience (Priority: P1)

Admin creates a new experience within their workspace by providing a name and selecting a profile type.

**Why this priority**: Creating experiences is the foundational action. Without the ability to create experiences, no other experience management features can be used.

**Independent Test**: Can be tested by an admin creating an experience through the data layer. Upon creation, the experience is persisted and retrievable from Firestore.

**Acceptance Scenarios**:

1. **Given** an authenticated admin in a workspace, **When** they create an experience with name "Welcome Survey" and profile "survey", **Then** a new experience document is created with the provided name, profile, empty steps array, status "active", and timestamps.

2. **Given** an authenticated admin, **When** they create an experience without selecting a profile, **Then** the creation fails with a validation error indicating profile is required.

3. **Given** an authenticated admin, **When** they create an experience with an empty name, **Then** the creation fails with a validation error indicating name is required.

---

### User Story 2 - List and View Experiences (Priority: P1)

Admin views all active experiences in their workspace and can retrieve details of a specific experience.

**Why this priority**: Admins need to see what experiences exist before they can assign or edit them. This is essential for any experience management workflow.

**Independent Test**: Can be tested by querying the workspace experiences collection and verifying correct data retrieval and filtering.

**Acceptance Scenarios**:

1. **Given** a workspace with 5 active experiences and 2 deleted experiences, **When** admin lists experiences, **Then** only the 5 active experiences are returned, sorted by most recently updated.

2. **Given** a valid experience ID, **When** admin requests that experience, **Then** the complete experience document with all fields is returned.

3. **Given** an invalid or non-existent experience ID, **When** admin requests that experience, **Then** an appropriate error is returned.

---

### User Story 3 - Update Experience (Priority: P2)

Admin updates an existing experience's properties (name, media, steps).

**Why this priority**: After creating experiences, admins need to modify them. This enables the edit workflow but can function independently of creation.

**Independent Test**: Can be tested by updating an experience's name or steps and verifying the changes persist correctly.

**Acceptance Scenarios**:

1. **Given** an active experience, **When** admin updates the name to "New Survey Name", **Then** the experience document reflects the new name and updatedAt timestamp is updated.

2. **Given** an active experience, **When** admin attempts to change the profile, **Then** the update fails because profile is immutable after creation.

3. **Given** a deleted experience, **When** admin attempts to update it, **Then** the update fails with an appropriate error.

---

### User Story 4 - Delete Experience (Priority: P2)

Admin soft-deletes an experience, marking it as deleted rather than permanently removing it.

**Why this priority**: Deletion is a standard CRUD operation. Soft deletion preserves data integrity and allows for potential recovery.

**Independent Test**: Can be tested by deleting an experience and verifying it no longer appears in active lists but still exists with deleted status.

**Acceptance Scenarios**:

1. **Given** an active experience, **When** admin deletes it, **Then** the experience status changes to "deleted" and it no longer appears in the active experiences list.

2. **Given** an already deleted experience, **When** admin attempts to delete it again, **Then** the operation succeeds idempotently (no error, no state change).

---

### User Story 5 - Event Experiences Configuration (Priority: P1)

Event configuration includes an experiences field that references workspace experiences for main, pregate, and preshare slots.

**Why this priority**: The event config schema is essential for connecting experiences to events. Without this, experiences cannot be assigned to events.

**Independent Test**: Can be tested by validating event config documents against the updated schema and verifying experiences field structure.

**Acceptance Scenarios**:

1. **Given** an event configuration, **When** the experiences field is set with main experiences array, **Then** the schema validates successfully with experienceId and enabled boolean for each entry.

2. **Given** an event configuration, **When** the experiences.main array contains multiple experiences, **Then** each experience has an experienceId string and enabled boolean flag.

3. **Given** an event configuration, **When** pregate or preshare slots are set, **Then** they each contain a single object with experienceId and enabled boolean (not arrays).

4. **Given** a new event with no experiences configured, **When** the event is created, **Then** the experiences field defaults to an empty main array with no pregate or preshare.

---

### User Story 6 - Profile Validation (Priority: P2)

System validates experience profile rules to ensure only allowed step types are used for each profile.

**Why this priority**: Profile validation ensures experiences conform to their profile constraints. This is essential for data integrity but can be validated after the basic CRUD operations work.

**Independent Test**: Can be tested by running validation utilities against experiences with various step configurations.

**Acceptance Scenarios**:

1. **Given** a "freeform" profile experience, **When** it contains steps of type info, input, capture, transform, and share, **Then** validation passes.

2. **Given** a "survey" profile experience, **When** it contains a transform step, **Then** validation fails indicating transform is not allowed for survey profile.

3. **Given** an "informational" profile experience, **When** it contains any step other than info, **Then** validation fails indicating only info steps are allowed.

---

### Edge Cases

- What happens when a workspace has no experiences? The list hook returns an empty array.
- How does the system handle concurrent updates to the same experience? Firestore handles conflict resolution; last write wins for simple fields.
- What happens if an experience is deleted while it's assigned to an event? The experience reference remains in the event config but the experience is not visible in pickers. Validation should warn on publish.
- How does system handle very long experience names? Names are validated with a reasonable maximum length (e.g., 100 characters).

## Requirements *(mandatory)*

### Functional Requirements

#### Experience CRUD (Phase 1)

- **FR-001**: System MUST store experiences as documents in `/workspaces/{workspaceId}/experiences/{experienceId}` collection.
- **FR-002**: Each experience document MUST contain: id, name (required, max 100 chars), status ('active' | 'deleted'), profile ('freeform' | 'survey' | 'informational'), optional media object, steps array, createdAt timestamp, and updatedAt timestamp.
- **FR-003**: System MUST provide a hook to list all active experiences in a workspace, sorted by updatedAt descending.
- **FR-004**: System MUST provide a hook to retrieve a single experience by ID with real-time subscription.
- **FR-005**: System MUST provide a hook to create a new experience with required name and profile fields.
- **FR-006**: System MUST provide a hook to update experience fields (name, media, steps) while preventing profile changes.
- **FR-007**: System MUST provide a hook to soft-delete an experience by setting status to 'deleted'.
- **FR-008**: Firestore security rules MUST enforce that only workspace admins can read/write experiences.

#### Event Config Schema (Phase 2)

- **FR-009**: Event draftConfig schema MUST include an `experiences` field with structure: `{ main: Array<{experienceId: string, enabled: boolean}>, pregate?: {experienceId: string, enabled: boolean}, preshare?: {experienceId: string, enabled: boolean} }`.
- **FR-010**: The `main` slot MUST support multiple experiences as an ordered array.
- **FR-011**: The `pregate` and `preshare` slots MUST each support at most one experience (single optional object, not array).
- **FR-012**: System MUST add `experienceReleases` collection schema for storing immutable published experience snapshots at `/projects/{projectId}/experienceReleases/{releaseId}`.
- **FR-013**: Existing events without experiences configuration MUST continue to work with experiences field treated as empty/undefined (no migration required per user note).

#### Profile Validation (Phase 1)

- **FR-014**: System MUST provide a `validateProfile` utility that checks if an experience's steps conform to its profile constraints.
- **FR-015**: Profile validation MUST enforce step type restrictions:
  - `freeform`: allows info, input, capture, transform, share
  - `survey`: allows info, input, capture, share (no transform)
  - `informational`: allows info only
- **FR-016**: System MUST provide slot compatibility validation to ensure experiences can only be assigned to compatible slots based on profile.

### Key Entities

- **Experience**: Represents a reusable, mutable experience template owned by a workspace. Contains profile, media, and ordered steps array. Key attributes: id, name, status, profile, media, steps, createdAt, updatedAt.

- **ExperienceReference**: A reference to an experience within an event's configuration. Contains experienceId and enabled flag. Represents the assignment relationship between an event slot and an experience.

- **ExperienceRelease**: An immutable snapshot of an experience created at event publish time. Stored at project level under `/projects/{projectId}/experienceReleases`. Contains frozen copy of experience data (profile, media, steps).

- **Event Config Experiences**: The experiences field within event draftConfig/publishedConfig. Contains three slots: main (array), pregate (single), preshare (single).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can create, read, update, and soft-delete experiences through the data layer with all operations completing in under 2 seconds.
- **SC-002**: Experience list queries return results within 1 second for workspaces with up to 100 experiences.
- **SC-003**: Profile validation correctly identifies 100% of invalid step configurations when tested against known valid and invalid experience configurations.
- **SC-004**: Event configuration schema validates correctly for all existing events (no breaking changes to existing functionality).
- **SC-005**: Security rules prevent unauthorized access, blocking 100% of attempts by non-admin users to read or modify experiences.
- **SC-006**: All CRUD operations maintain data consistency - no orphaned documents, no data corruption during concurrent operations.
