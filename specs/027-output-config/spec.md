# Feature Specification: Event Frame Overlay Configuration

**Feature Branch**: `027-output-config`
**Created**: 2025-12-15
**Status**: Draft
**Input**: Event Overlay Configuration (Frame Overlays) PRD - Allow event organizers to configure frame overlays applied to generated images at the event level, with per-aspect ratio control.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Frame Overlay for Aspect Ratio (Priority: P1)

An event organizer wants to add branded visual framing to all generated photos for their event. They navigate to the event's overlay settings, select an aspect ratio (square or story), upload a frame image, and enable it. The frame will then be applied to all generated images of that aspect ratio.

**Why this priority**: This is the core functionality - without the ability to upload and enable frames, the feature has no value. It directly addresses the main problem of brands needing visual framing for generated photos.

**Independent Test**: Can be fully tested by uploading a frame image for square aspect ratio, enabling it, and verifying the frame appears in preview. Delivers immediate value by allowing branded photo outputs.

**Acceptance Scenarios**:

1. **Given** an event without frame overlays configured, **When** the organizer uploads a frame image for the square (1:1) aspect ratio, **Then** the frame is stored and associated with the square aspect ratio for that event.
2. **Given** a frame image has been uploaded for an aspect ratio, **When** the organizer enables the frame toggle, **Then** the frame status changes to enabled and the preview shows the frame applied.
3. **Given** an event with no prior overlay configuration, **When** the organizer accesses the overlays page, **Then** both aspect ratio options (square and story) are visible with empty/unconfigured states.

---

### User Story 2 - Toggle Frame On/Off Without Losing Configuration (Priority: P2)

An event organizer has uploaded a branded frame but wants to temporarily disable it for A/B testing or a specific event period without losing the uploaded asset. They toggle the frame to disabled, and later re-enable it without re-uploading.

**Why this priority**: This enables experimentation and flexibility - key value propositions mentioned in the PRD. Without this, users would need to re-upload assets every time they want to test with/without frames.

**Independent Test**: Can be tested by uploading a frame, enabling it, then disabling it and verifying the frame URL is preserved but frame is not applied in preview. Re-enabling should immediately restore the frame.

**Acceptance Scenarios**:

1. **Given** a frame is uploaded and enabled, **When** the organizer toggles the frame to disabled, **Then** the frame image remains stored but is not applied to generated images.
2. **Given** a frame is disabled but the image URL is still stored, **When** the organizer toggles the frame to enabled, **Then** the previously uploaded frame is immediately applied without re-uploading.
3. **Given** a frame is disabled, **When** viewing the overlays configuration page, **Then** the frame image is still visible in the editor with a clear "disabled" indicator.

---

### User Story 3 - Preview Frame Applied to Generated Image (Priority: P2)

An event organizer wants to see how their frame will look when applied to actual generated images. They can switch between square and story preview modes to verify the frame appearance for each aspect ratio before the event goes live.

**Why this priority**: Preview is essential for quality assurance - organizers need confidence their branding looks correct before guests start using the event. Tied with P2 as both are essential supporting features.

**Independent Test**: Can be tested by uploading a frame and viewing the preview panel, switching between aspect ratios, and verifying the frame renders correctly over a placeholder image.

**Acceptance Scenarios**:

1. **Given** a frame is uploaded and enabled for square aspect ratio, **When** the organizer views the preview in square mode, **Then** the preview displays a sample image with the frame overlay applied.
2. **Given** frames are configured for both square and story aspect ratios, **When** the organizer switches between preview modes, **Then** the preview updates to show the correct frame for each aspect ratio.
3. **Given** no generated images exist yet, **When** viewing the preview, **Then** a placeholder image is used to demonstrate the frame overlay.
4. **Given** a frame is disabled, **When** viewing the preview, **Then** the preview shows the image without the frame overlay applied.

---

### User Story 4 - Remove Frame Configuration (Priority: P3)

An event organizer decides they no longer want a frame for a specific aspect ratio. They remove the frame, which clears the stored image and disables the frame for that aspect ratio.

**Why this priority**: Removal is a cleanup operation - less frequently needed than upload, toggle, or preview. Events can function with frames simply disabled rather than removed.

**Independent Test**: Can be tested by uploading a frame, then using the remove action and verifying both the frame URL is cleared and the aspect ratio shows as unconfigured.

**Acceptance Scenarios**:

1. **Given** a frame is configured for an aspect ratio, **When** the organizer removes the frame, **Then** the frame URL is cleared and the frame is disabled.
2. **Given** a frame has been removed, **When** viewing the overlays configuration, **Then** that aspect ratio shows as unconfigured with option to upload a new frame.

---

### Edge Cases

- What happens when a frame image upload fails? The system retains the previous configuration (if any) and displays an error message.
- What happens when a frame image file is too large? The system validates file size before upload and shows a clear size limit error.
- What happens when a user uploads an invalid file type? The system only accepts valid image formats (PNG, JPG, WebP) and rejects others with a format error.
- How does the system handle network errors during frame save? The system shows an error toast and allows retry without losing the user's in-progress changes.
- What happens if a frame image URL becomes inaccessible after being stored? The preview shows a broken/missing image indicator and the system allows re-upload.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow event organizers to upload a frame overlay image for each supported aspect ratio (square 1:1, story 9:16)
- **FR-002**: System MUST store frame overlays as part of the Event configuration with an `overlay` field containing frames keyed by aspect ratio
- **FR-003**: System MUST provide an enable/disable toggle per aspect ratio that controls whether the frame is applied
- **FR-004**: System MUST preserve uploaded frame images when toggling from enabled to disabled (no automatic deletion)
- **FR-005**: System MUST allow removal of a frame, which clears the frame URL and sets enabled to false
- **FR-006**: System MUST display clear visual indicators showing: frame present/absent, frame enabled/disabled, and which aspect ratio is affected
- **FR-007**: System MUST provide a preview showing how the frame overlay appears on a generated image
- **FR-008**: System MUST allow switching preview between square and story aspect ratios
- **FR-009**: System MUST use a placeholder image in preview when no real generated output exists
- **FR-010**: System MUST validate uploaded images are valid image formats (PNG, JPG, WebP)
- **FR-011**: System MUST apply frame overlays only to image outputs (not video or other formats)
- **FR-012**: Frame overlays MUST be event-wide, affecting all image outputs matching the aspect ratio

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Overlay configuration page MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Upload buttons and toggle controls MUST meet minimum touch target size (44x44px)
- **MFR-003**: Typography MUST be readable on mobile (minimum 14px for body text)
- **MFR-004**: Preview panel MUST be viewable on mobile screens with appropriate scaling
- **MFR-005**: Aspect ratio switcher MUST be easily tappable on mobile devices

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Overlay configuration form inputs MUST be validated with Zod schemas
- **TSR-002**: TypeScript strict mode MUST be maintained (no `any` escapes)
- **TSR-003**: Frame URL inputs MUST validate as valid URL format
- **TSR-004**: Aspect ratio values MUST be validated against allowed enum values (square, story)

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Overlay configuration updates (create/update/delete) MUST use Admin SDK via Server Actions
- **FAR-002**: Frame images MUST be stored in Firebase Storage following the pattern: `media/{companyId}/frames/{timestamp}-{filename}`
- **FAR-003**: Overlay Zod schemas MUST be located in `features/events/schemas/`
- **FAR-004**: Frame image URLs MUST be stored as full public URLs for instant rendering
- **FAR-005**: Event overlay configuration MUST be stored as a nested object within the Event document

### Key Entities

- **EventOverlayConfig**: Configuration object stored on the Event containing frame overlay settings; keyed by aspect ratio with enabled flag and optional frame URL per entry
- **FrameEntry**: Individual frame configuration for one aspect ratio containing: enabled (boolean) and frameUrl (optional string URL to frame image)
- **AspectRatio**: Supported aspect ratios for frame overlays - currently square (1:1) and story (9:16)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event organizers can upload and enable a frame overlay in under 2 minutes
- **SC-002**: Frame toggle (enable/disable) takes effect immediately in preview without requiring re-upload
- **SC-003**: 95% of overlay configuration changes persist successfully on first save attempt
- **SC-004**: Preview accurately represents how frames will appear on actual generated images
- **SC-005**: Organizers can configure overlays for both aspect ratios in a single session without page reloads between aspect ratios

## Assumptions

- Frame images are static images (PNG, JPG, WebP) with transparent regions where the generated photo should show through
- Frame images should match or exceed the output resolution for the target aspect ratio for best quality
- The overlay page is accessed through the existing event settings navigation
- Only event organizers with edit permissions can configure overlays
- Frame application to actual generated images happens at generation time (not configured in this feature, which focuses on configuration UI)
