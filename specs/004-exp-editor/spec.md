# Feature Specification: Experience Editor & AI Playground

**Feature Branch**: `004-exp-editor`
**Created**: 2025-11-25
**Status**: Draft
**Input**: PRD 2 - Experience Editor & AI Playground

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure AI Photo Experience (Priority: P1)

An experience creator navigates to an existing experience's editor route to configure its AI transformation settings. They select an AI model, write a custom prompt, and view branding context that will be automatically injected from the event's theme.

**Why this priority**: Core functionality - without AI configuration, the experience cannot transform guest photos. This is the primary purpose of the editor.

**Independent Test**: Can be fully tested by navigating to `/events/{eventId}/design/experiences/{experienceId}`, selecting a model, editing the prompt, and saving. Delivers immediate value by enabling AI-powered photo transformations.

**Acceptance Scenarios**:

1. **Given** a user is on an experience editor page, **When** they select a model from the dropdown, **Then** the selection is visually reflected and persisted when saved
2. **Given** a user is on an experience editor page, **When** they edit the system prompt, **Then** the prompt text updates in real-time and persists when saved
3. **Given** an event has theme settings configured, **When** a user views the experience editor, **Then** they see a read-only indicator showing branding context will be injected

---

### User Story 2 - Test AI Transformation in Playground (Priority: P1)

An experience creator uses the playground panel to test their AI configuration by uploading a sample photo and triggering generation. They see the transformation result and can iterate on their prompt to refine the output.

**Why this priority**: Testing is essential before publishing - creators need to verify their prompt and model produce desired results before guests use the experience.

**Independent Test**: Can be fully tested by uploading a test image, clicking Generate, waiting for the result, and viewing the transformed output. Delivers value by enabling rapid iteration on AI settings.

**Acceptance Scenarios**:

1. **Given** a user is in the playground panel, **When** they drag-and-drop a photo file, **Then** the file is accepted and displayed in the upload area
2. **Given** a photo is uploaded and AI settings are configured, **When** the user clicks Generate, **Then** a loading state is displayed while the AI processes
3. **Given** AI processing completes successfully, **When** the result is ready, **Then** the transformed image is displayed in the result area
4. **Given** AI processing fails, **When** an error occurs, **Then** the user sees a clear error message and can retry

---

### User Story 3 - Edit Experience General Info (Priority: P2)

An experience creator updates the experience's display name and internal description notes to keep their library organized and identifiable.

**Why this priority**: Important for organization and team collaboration, but not essential for the AI transformation functionality.

**Independent Test**: Can be fully tested by editing the name field, editing the description field, and saving. Delivers value by keeping experiences properly labeled.

**Acceptance Scenarios**:

1. **Given** a user is on the experience editor, **When** they edit the Name field, **Then** the name updates and persists when saved
2. **Given** a user is on the experience editor, **When** they edit the Description field, **Then** the description updates and persists when saved

---

### User Story 4 - Manage Experience Header (Priority: P2)

An experience creator uses the header to view preview media, toggle the enabled state, and access the delete action for the experience.

**Why this priority**: Provides quick access to common actions and status visibility, supporting the overall editing workflow.

**Independent Test**: Can be fully tested by toggling the enabled switch and verifying the state change. Delivers value by controlling experience availability.

**Acceptance Scenarios**:

1. **Given** a user views the experience editor header, **When** the page loads, **Then** they see the preview media, name, enabled switch, and delete button
2. **Given** a user toggles the enabled switch, **When** they switch it on/off, **Then** the enabled state is updated and persisted
3. **Given** a user clicks the delete button, **When** they confirm the action, **Then** the experience is deleted and the user is navigated away

---

### Edge Cases

- What happens when the user uploads an unsupported file type? System displays a validation error and rejects the file.
- How does the system handle AI generation timeouts or rate limits? System displays a user-friendly error with option to retry.
- What happens when the user navigates away with unsaved changes? Browser confirmation dialog prompts user to save or discard.
- How does the system behave when the event theme has no colors or branding configured? Branding context indicator shows "No theme configured" and generation proceeds without theme injection.
- What happens if the experience ID in the URL doesn't exist or the user doesn't have access? System displays a 404 or access denied page with navigation back to event.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST route users to `/events/{eventId}/design/experiences/{experienceId}` for the dedicated editor
- **FR-002**: System MUST display a split-screen layout with a header (info), left panel (configuration), and right panel (playground)
- **FR-003**: System MUST provide a model selector dropdown with available AI models (e.g., "gemini-2.5-flash-image", "gemini-3-pro-image-preview")
- **FR-004**: System MUST provide a text area for editing the system prompt
- **FR-005**: System MUST display a read-only branding context indicator showing theme detection from the event
- **FR-006**: System MUST provide editable fields for experience Name and Description
- **FR-007**: System MUST display experience preview media in the header
- **FR-008**: System MUST provide an enabled/disabled toggle switch in the header
- **FR-009**: System MUST provide a delete button in the header with confirmation
- **FR-010**: System MUST provide a drag-and-drop upload area in the playground for test photos
- **FR-011**: System MUST provide a Generate button to trigger AI transformation
- **FR-012**: System MUST show a loading state while AI processes the transformation
- **FR-013**: System MUST display the transformed result image in the playground
- **FR-014**: System MUST provide a Save button to persist configuration changes
- **FR-015**: System MUST validate uploaded files are image types (JPEG, PNG, WebP)
- **FR-016**: System MUST handle AI generation errors gracefully with user-friendly messages

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Feature MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Interactive elements MUST meet minimum touch target size (44x44px)
- **MFR-003**: Typography MUST be readable on mobile (≥14px for body text)
- **MFR-004**: On mobile viewports, the split-screen layout MUST stack vertically (configuration above playground)
- **MFR-005**: The playground panel MUST be accessible via scrolling or a tab interface on mobile

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All external inputs (forms, API requests, uploads) MUST be validated with Zod schemas
- **TSR-002**: TypeScript strict mode MUST be maintained (no `any` escapes)
- **TSR-003**: Experience configuration form fields MUST be validated before save
- **TSR-004**: Uploaded file types and sizes MUST be validated before processing

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All write operations (create/update/delete) MUST use Admin SDK via Server Actions (`web/src/lib/firebase/admin.ts`)
- **FAR-002**: Real-time subscriptions and optimistic reads MUST use Client SDK (`web/src/lib/firebase/client.ts`)
- **FAR-003**: All data schemas and validation logic MUST be located in `web/src/lib/schemas/`
- **FAR-004**: Public images MUST be stored as full public URLs (not relative paths) for instant rendering
- **FAR-005**: Experience configuration updates MUST be persisted to the `/experiences/{experienceId}` collection
- **FAR-006**: AI transformation test results do NOT need to be persisted (playground is for testing only)

### Key Entities

- **Experience**: Represents an AI photo experience configuration with model selection, prompt, and preview media
- **Event Theme**: Contains branding context (colors, logo, keywords) that is injected into AI prompts
- **Test Image**: Temporary uploaded image for playground testing (not persisted)
- **Generated Result**: AI-transformed image displayed in playground (not persisted)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete AI configuration (select model + write prompt + save) in under 2 minutes
- **SC-002**: AI transformation preview generates and displays results in under 60 seconds
- **SC-003**: 95% of configuration save operations complete successfully without errors
- **SC-004**: Users can iterate (upload new test image + generate) at least 5 times per session without degradation
- **SC-005**: Experience editor loads completely in under 3 seconds
- **SC-006**: 90% of users successfully test their configuration before publishing

## Assumptions

- PRD 1 has been implemented, providing valid experience IDs and the routing foundation
- The AI transformation logic exists in `web/src/lib/ai` and can be invoked from the playground
- Google Gemini API is configured and accessible for AI image generation
- Event themes are already stored and accessible for branding context injection
- The experiences feature module is implemented per data-model-v4 architecture
- File upload size limits follow standard web practices (10MB max for images)
- Only AI Photo Experience type is in scope; Video and GIF are explicitly out of scope
