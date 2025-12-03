# Feature Specification: Experience Editor Tabs (Design & Settings)

**Feature Branch**: `001-exp-settings-routes`
**Created**: 2025-12-03
**Status**: Draft
**Input**: User description: "Add 2 explicit routes to experience editor: design and settings - design should be default and represent ExperienceEditorClient, settings should have form for name, description, and preview media. Also display preview media in experience list cards."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Experience Design (Priority: P1)

An experience creator navigates to an experience and lands on the Design tab by default to configure the step flow using the existing experience editor interface.

**Why this priority**: The design editor is the core functionality for experience creation. Without it, users cannot build or modify experiences. Making it the default route ensures backward compatibility and preserves the existing user workflow.

**Independent Test**: Can be tested by navigating to `/{companySlug}/exps/{expId}` and verifying the design editor loads with all existing functionality intact.

**Acceptance Scenarios**:

1. **Given** a user is on the experiences list, **When** they click an experience card, **Then** they are navigated to the Design tab (`/{companySlug}/exps/{expId}/design`) showing the experience editor interface
2. **Given** a user navigates directly to `/{companySlug}/exps/{expId}`, **When** the page loads, **Then** they are redirected to the Design tab
3. **Given** a user is on the Design tab, **When** they interact with the step editor, **Then** all existing functionality (add/edit/delete/reorder steps, preview, playback) works as before

---

### User Story 2 - Edit Experience Settings (Priority: P2)

An experience creator navigates to the Settings tab to update the experience metadata including name, description, and preview media.

**Why this priority**: Settings provide essential metadata management that enhances the experience library's usability. The preview media enables visual identification in the experience list, improving navigation efficiency.

**Independent Test**: Can be tested by navigating to `/{companySlug}/exps/{expId}/settings` and updating each field, verifying changes persist and validation works.

**Acceptance Scenarios**:

1. **Given** a user is on the experience page, **When** they click the Settings tab, **Then** they are navigated to the Settings tab showing a form with current experience values
2. **Given** a user is on the Settings tab, **When** they update the name field and save, **Then** the experience name is updated and a success message is shown
3. **Given** a user is on the Settings tab, **When** they update the description field and save, **Then** the experience description is updated
4. **Given** a user is on the Settings tab, **When** they upload a preview media file, **Then** the file is stored and the preview URL is saved to the experience
5. **Given** a user enters an empty name, **When** they attempt to save, **Then** validation prevents submission and displays an error message

---

### User Story 3 - View Preview Media in Experience List (Priority: P3)

A user views the experiences list and sees preview media thumbnails on experience cards that have preview media set, making it easier to visually identify experiences.

**Why this priority**: This enhances the user experience for managing multiple experiences but is not essential for core functionality. It provides visual context that speeds up experience identification.

**Independent Test**: Can be tested by creating experiences with and without preview media and verifying the list displays correctly in both cases.

**Acceptance Scenarios**:

1. **Given** an experience has preview media set, **When** the user views the experience list, **Then** the card displays the preview media as a thumbnail
2. **Given** an experience has no preview media, **When** the user views the experience list, **Then** the card displays a fallback state (icon or placeholder)
3. **Given** the preview media is an image, **When** the card renders, **Then** the image is displayed with proper aspect ratio and loading state
4. **Given** the preview media is a video, **When** the card renders, **Then** a thumbnail or first frame is displayed (not auto-playing)

---

### Edge Cases

- What happens when preview media upload fails? Display error toast and retain previous media (if any).
- What happens when the experience is loading? Display loading skeleton/placeholder in cards and form.
- What happens when preview media file is too large? Validate file size before upload and show appropriate error.
- What happens when navigation between tabs occurs with unsaved changes? The settings form auto-saves on blur or has a save button - no unsaved changes warning needed for MVP.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide two explicit route segments under `/{companySlug}/exps/{expId}`: `/design` and `/settings`
- **FR-002**: System MUST redirect requests to `/{companySlug}/exps/{expId}` (without segment) to the `/design` route
- **FR-003**: System MUST render the existing ExperienceEditorClient component on the Design route
- **FR-004**: System MUST provide a Settings form with fields for name (text input), description (textarea), and preview media (upload)
- **FR-005**: System MUST validate that experience name is non-empty (1-100 characters)
- **FR-006**: System MUST allow description to be optional (0-500 characters)
- **FR-007**: System MUST support image uploads for preview media (JPEG, PNG, WebP, GIF)
- **FR-008**: System MUST store uploaded preview media in Firebase Storage and save the public URL to the experience document
- **FR-009**: System MUST update the experience document fields: `previewMediaUrl` and `previewType` when media is uploaded
- **FR-010**: System MUST display preview media thumbnails on ExperienceCard components when `previewMediaUrl` is available
- **FR-011**: System MUST display a fallback state (icon or styled placeholder) on cards when no preview media exists
- **FR-012**: System MUST provide tab navigation between Design and Settings routes

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Settings form MUST be fully usable on mobile viewport (320px-768px)
- **MFR-002**: Tab navigation MUST be accessible on mobile with appropriate touch targets (44x44px minimum)
- **MFR-003**: Preview media thumbnails in cards MUST scale appropriately on mobile viewports
- **MFR-004**: File upload interaction MUST work on mobile devices with native file picker integration

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Settings form inputs MUST be validated with Zod schemas before submission
- **TSR-002**: File uploads MUST be validated for type (image/jpeg, image/png, image/webp, image/gif) and size (max 5MB)
- **TSR-003**: Experience interface MUST include `previewMediaUrl` (string | null) and `previewType` ("image" | "gif" | null) fields

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Experience updates (name, description, previewMediaUrl, previewType) MUST use Admin SDK via Server Actions
- **FAR-002**: Preview media files MUST be stored in Firebase Storage at path `media/{companyId}/experiences/{experienceId}/{filename}`
- **FAR-003**: Uploaded images MUST be stored as full public URLs (not relative paths) for instant rendering
- **FAR-004**: Real-time experience subscription in the client MUST reflect settings changes immediately

### Key Entities *(include if feature involves data)*

- **Experience**: Extended with `previewMediaUrl` (string | null) and `previewType` ("image" | "gif" | null) fields for preview media support

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate between Design and Settings tabs within 1 second with clear visual indication of active tab
- **SC-002**: Settings form changes are saved and visible in under 2 seconds after submission
- **SC-003**: Preview media upload and display completes within 5 seconds for files under 2MB
- **SC-004**: 100% of existing Design editor functionality remains working after route restructuring
- **SC-005**: Experience cards with preview media show thumbnails that load within 2 seconds on standard connections
- **SC-006**: Settings form validation errors are displayed immediately upon invalid input
