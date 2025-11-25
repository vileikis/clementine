# Feature Specification: Experiences Feature Refactor

**Feature Branch**: `002-experiences-refactor`
**Created**: 2025-11-25
**Status**: Draft
**Input**: Migrate the Experiences feature from a subcollection architecture (`/events/{eventId}/experiences`) to a top-level collection (`/experiences/{experienceId}`) following the normalized Firestore design in data-model-v4.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create New Experience for a Company (Priority: P1)

An experience creator sets up a new AI experience configuration that belongs to their company. They navigate to the Experience Editor, configure the experience type, AI settings, capture settings, and save it. The experience is stored in the top-level `/experiences` collection and can be attached to any of their events.

**Why this priority**: Creating experiences is the foundational capability. Without the ability to create experiences in the new architecture, no other functionality can be tested or used.

**Independent Test**: Can be fully tested by creating an experience through the UI and verifying it appears in the `/experiences` collection with correct `companyId` ownership.

**Acceptance Scenarios**:

1. **Given** a logged-in user with company access, **When** they navigate to Experience Editor and save a new experience, **Then** a document is created in `/experiences` with their `companyId` as owner.
2. **Given** a user creating an experience, **When** they configure photo type with AI settings, **Then** the experience is saved with `aiPhotoConfig` populated.
3. **Given** a user creating an experience, **When** they configure video type with AI settings, **Then** the experience is saved with `aiVideoConfig` populated.
4. **Given** a user creating an experience, **When** they configure GIF type with AI settings, **Then** the experience is saved with `aiPhotoConfig` (since GIFs use image models).

---

### User Story 2 - Attach Experience to Event (Priority: P1)

An experience creator attaches an experience to an event. When creating or editing an experience from within the Event Studio Design Tab, the system adds the event ID to the experience's `eventIds` array, establishing the relationship.

**Why this priority**: Events must be linked to experiences for the new architecture to function. This is core to the data model change.

**Independent Test**: Can be tested by creating an experience from Event Studio and verifying the experience document's `eventIds` array contains the current event ID.

**Acceptance Scenarios**:

1. **Given** a user in Event Studio Design Tab with no experiences, **When** they create a new experience, **Then** the current event ID is added to the experience's `eventIds` array and the user returns to Design Tab.
2. **Given** an event with existing experiences, **When** a user creates another experience, **Then** the current event ID is included in the new experience's `eventIds` array.

---

### User Story 3 - View Experiences for an Event (Priority: P1)

An experience creator views all experiences attached to a specific event. The system queries `/experiences` where `eventIds` contains the current event ID.

**Why this priority**: Viewing experiences is essential for managing event configurations and is required before editing can occur.

**Independent Test**: Can be tested by loading Event Studio Design Tab and verifying all experiences with the event ID in their `eventIds` array are displayed.

**Acceptance Scenarios**:

1. **Given** experiences exist with the current event ID in their `eventIds` array, **When** the Design Tab loads, **Then** those experiences are displayed.
2. **Given** an event with zero experiences, **When** the Design Tab loads, **Then** an empty state with "Add your first Experience" illustration and create button is shown.
3. **Given** an event with one or more experiences, **When** the Design Tab loads, **Then** the first experience is automatically selected and displayed.

---

### User Story 4 - Update Experience (Priority: P2)

An experience creator modifies an existing experience's configuration. Changes are persisted directly to the `/experiences/{experienceId}` document without requiring any updates to event documents.

**Why this priority**: Editing is important but secondary to creation and viewing. Users need to be able to iterate on experience configurations.

**Independent Test**: Can be tested by modifying an experience field and verifying the change persists in Firestore without affecting event documents.

**Acceptance Scenarios**:

1. **Given** an existing experience, **When** the user modifies the name and saves, **Then** only the experience document is updated.
2. **Given** an experience attached to multiple events, **When** the user updates the experience, **Then** all events automatically see the updated configuration (no event updates needed).

---

### User Story 5 - Delete Experience (Priority: P3)

An experience creator removes an experience entirely. The system deletes the experience document from `/experiences`. No event document updates are needed since experiences store their own event relationships.

**Why this priority**: Deletion is a destructive action that should be implemented after core CRUD is stable.

**Independent Test**: Can be tested by deleting an experience and verifying it's removed from Firestore and no longer appears in the event's experience list.

**Acceptance Scenarios**:

1. **Given** an experience attached to one or more events, **When** the user deletes it, **Then** the experience document is deleted.
2. **Given** an experience with associated storage assets, **When** the user deletes it, **Then** preview media and reference images are also cleaned up from storage.

---

### Edge Cases

- What happens when an experience is deleted while still referenced in its `eventIds`? The experience simply disappears from all event queries - no orphan cleanup needed.
- What happens when a user tries to create an experience without company access? The system must validate company ownership before allowing creation and show an error message.
- What happens when deleting an experience that's currently being used in a live session? The system should allow deletion but existing sessions may show degraded experience.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store experiences in the root `/experiences` collection (not as event subcollections).
- **FR-002**: System MUST include `companyId` field on all experience documents for multi-tenant ownership.
- **FR-003**: System MUST include `eventIds` array field on experience documents to track which events use the experience.
- **FR-004**: System MUST support experience types: "photo", "video", and "gif".
- **FR-005**: System MUST store type-specific AI configurations using `aiPhotoConfig` for photo/GIF types and `aiVideoConfig` for video types.
- **FR-006**: System MUST include `name` field for internal experience identification.
- **FR-007**: System MUST support optional `previewMediaUrl` field for preview assets.
- **FR-008**: System MUST include `captureConfig` object for hardware/capture settings (countdown, cameraFacing, overlayUrl, duration settings).
- **FR-009**: System MUST make `inputFields` field nullable/optional (full implementation deferred).
- **FR-010**: Event Studio Design Tab MUST fetch experiences by querying `/experiences` where `eventIds` contains the current event ID.
- **FR-011**: System MUST add current event ID to experience's `eventIds` array when creating from Event Studio context.
- **FR-012**: System MUST validate user has access to target `companyId` before creating experiences.
- **FR-013**: System MUST remove legacy fields: `eventId`, `label`, and `hidden`.

### AI Configuration Requirements

- **AI-001**: Photo/GIF AI config (`aiPhotoConfig`) MUST support: `enabled`, `model`, `prompt`, `referenceImageUrls`, `aspectRatio` fields.
- **AI-002**: Video AI config (`aiVideoConfig`) MUST support: `enabled`, `model`, `prompt`, `referenceImageUrls`, `aspectRatio`, `duration`, `fps` fields.
- **AI-003**: All AI config fields except `enabled` MUST be nullable.
- **AI-004**: GIF experiences MUST use `aiPhotoConfig` (not `aiVideoConfig`).

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Experience Editor MUST work on mobile viewport (320px-768px) as primary experience.
- **MFR-002**: Interactive elements MUST meet minimum touch target size (44x44px).
- **MFR-003**: Typography MUST be readable on mobile (14px or larger for body text).
- **MFR-004**: Experience sidebar in Event Studio MUST be usable on mobile viewports.

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Experience schema MUST be validated with Zod schemas on all create/update operations.
- **TSR-002**: TypeScript strict mode MUST be maintained (no `any` escapes).
- **TSR-003**: `companyId` MUST be validated against user's authorized companies.
- **TSR-004**: Experience type MUST be validated as one of: "photo", "video", "gif".
- **TSR-005**: AI config structure MUST match the experience type (photo/gif -> aiPhotoConfig, video -> aiVideoConfig).

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All experience write operations (create/update/delete) MUST use Admin SDK via Server Actions.
- **FAR-002**: Experience reads for display MUST use Client SDK for potential real-time subscriptions.
- **FAR-003**: Experience schema and validation logic MUST be located in `web/src/lib/schemas/`.
- **FAR-004**: Preview media URLs MUST be stored as full public URLs for instant rendering.
- **FAR-005**: Storage cleanup on delete MUST use existing infrastructure from `@/lib/storage/actions.ts`.

### Key Entities

- **Experience**: A reusable AI experience configuration containing type (photo/video/gif), name, preview media, capture hardware settings, type-specific AI configuration, and `eventIds` array tracking which events use it. Owned by a company via `companyId`.
- **Event**: Root container for event configuration. No longer stores experience references directly - experiences track their event associations via `eventIds`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create, view, update, and delete experiences through the Event Studio Design Tab.
- **SC-002**: Experiences attached to an event are fetched via `eventIds` array query.
- **SC-003**: Experience changes are reflected across all events that use them without requiring event updates.
- **SC-004**: Empty state displays correctly when an event has zero experiences.
- **SC-005**: All experience data is validated before persistence (no invalid documents created).
- **SC-006**: Deleting an experience removes it cleanly without requiring event document updates.

## Assumptions

- Users already have company access established through the existing authentication system.
- The Event model already exists (no modifications needed - experiences track the relationship).
- Storage infrastructure from `@/lib/storage/actions.ts` is available and functional for media uploads.
- No backward compatibility with legacy subcollection architecture is required (clean migration).
- The Experience Editor page (full window) UI exists or will be created as part of this feature.
