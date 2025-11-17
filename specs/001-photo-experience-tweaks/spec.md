# Feature Specification: Photo Experience Tweaks

**Feature Branch**: `001-photo-experience-tweaks`
**Created**: 2025-11-17
**Status**: Draft
**Input**: User description from features/photo-experience/photo-experience.md

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Simplify Photo Capture Settings (Priority: P1)

As an event organizer, I want to configure a streamlined photo experience without complex capture options, so that I can quickly set up an event with minimal configuration decisions.

**Why this priority**: This is the foundation of the simplified experience. Removing unnecessary complexity is critical for adoption and reduces time-to-launch for new events.

**Independent Test**: Can be fully tested by creating a new photo experience and verifying that capture options are no longer present in the UI, delivering a cleaner configuration interface.

**Acceptance Scenarios**:

1. **Given** an event organizer is creating a new photo experience, **When** they navigate to the photo experience settings, **Then** they should not see any capture options configuration UI
2. **Given** an event organizer is editing an existing photo experience, **When** they view the settings, **Then** capture options are not displayed or stored
3. **Given** a guest visits the photo experience, **When** they interact with photo capture, **Then** they can upload or use direct camera capture without any mode selection

---

### User Story 2 - Configure Rich Preview Media (Priority: P1)

As an event organizer, I want to upload an engaging preview (image, GIF, or video) for my photo experience, so that guests see an attractive visual example before they start.

**Why this priority**: Preview media is critical for guest engagement and conversion. Without compelling previews, guests may not understand the experience or feel motivated to participate.

**Independent Test**: Can be fully tested by uploading different media types (image, GIF, video) and verifying they display correctly on the guest start screen.

**Acceptance Scenarios**:

1. **Given** an organizer is configuring a photo experience, **When** they upload an image as preview media, **Then** the image is stored and displayed as a static thumbnail in the configuration UI and on the guest start screen
2. **Given** an organizer is configuring a photo experience, **When** they upload a GIF as preview media, **Then** the GIF autoplays in a loop in the configuration UI and on the guest start screen
3. **Given** an organizer is configuring a photo experience, **When** they upload a video as preview media, **Then** the video autoplays muted in a loop in the configuration UI and on the guest start screen
4. **Given** an organizer has uploaded preview media, **When** they choose to replace it, **Then** they can upload new media and the old media is replaced
5. **Given** an organizer has uploaded preview media, **When** they choose to remove it, **Then** the preview media is deleted and no preview is shown
6. **Given** a guest views the photo experience start screen, **When** preview media is configured, **Then** they see the preview media with helper text explaining it's a visual preview of the experience

---

### User Story 3 - Control Countdown Timer (Priority: P2)

As an event organizer, I want to enable/disable and configure a countdown timer before photo capture, so that guests have time to prepare and pose before the photo is taken.

**Why this priority**: Countdown enhances user experience by preventing awkward mid-action captures, but it's not critical for basic functionality. Some events may prefer instant capture.

**Independent Test**: Can be fully tested by toggling countdown on/off, setting different timer values (0-10 seconds), and verifying countdown behavior during photo capture.

**Acceptance Scenarios**:

1. **Given** an organizer is configuring a photo experience, **When** they enable the countdown toggle, **Then** a countdown timer input (0-10 seconds) becomes visible with default value of 3 seconds
2. **Given** an organizer is configuring a photo experience, **When** they disable the countdown toggle, **Then** the countdown timer input is hidden and countdown is not used during capture
3. **Given** countdown is enabled with a timer value of 5 seconds, **When** a guest initiates photo capture, **Then** they see a 5-second countdown before the photo is taken
4. **Given** countdown is disabled, **When** a guest initiates photo capture, **Then** the photo is taken immediately without any countdown

---

### User Story 4 - Configure Frame Overlay (Priority: P2)

As an event organizer, I want to apply a single custom frame overlay to photos, so that branded or themed frames enhance the final photo output.

**Why this priority**: Frame overlays add brand value and aesthetic appeal, but the experience can function without them. This is an enhancement rather than core functionality.

**Independent Test**: Can be fully tested by uploading a frame overlay image, previewing it over a sample photo, and verifying it appears in the final output.

**Acceptance Scenarios**:

1. **Given** an organizer is configuring a photo experience, **When** they enable the overlay toggle, **Then** they can upload a single frame overlay image
2. **Given** an organizer has uploaded a frame overlay, **When** they view the configuration UI, **Then** they see a preview of the overlay composited over a sample photo
3. **Given** an organizer has uploaded a frame overlay, **When** they choose to replace it, **Then** they can upload a new overlay image and the previous one is replaced
4. **Given** an organizer has uploaded a frame overlay, **When** they choose to remove it, **Then** the overlay is deleted and photos are captured without overlay
5. **Given** an organizer is configuring a photo experience, **When** they disable the overlay toggle, **Then** no overlay is applied to captured photos
6. **Given** logo overlay was previously supported, **When** viewing the new overlay configuration, **Then** logo overlay options are not present (removed completely)

---

### User Story 5 - Configure AI Transformation Settings (Priority: P1)

As an event organizer, I want to configure AI transformation settings with better visual layout and guidance, so that I can create effective AI prompts and select appropriate aspect ratios.

**Why this priority**: AI transformation is a core feature differentiator. Better UX for configuring AI settings directly impacts output quality and organizer success.

**Independent Test**: Can be fully tested by uploading reference images (verifying horizontal layout), selecting aspect ratios, and accessing model-specific prompt guides.

**Acceptance Scenarios**:

1. **Given** an organizer is uploading multiple reference images, **When** they view the reference images section, **Then** images are displayed in a horizontal row with responsive wrapping if needed
2. **Given** an organizer is configuring AI transformation, **When** they access the aspect ratio picker, **Then** they can select from options: 1:1, 3:4, 4:5, 9:16, 16:9
3. **Given** an organizer has selected an aspect ratio, **When** AI transformation generates output, **Then** the output matches the selected aspect ratio
4. **Given** an organizer is configuring the AI model, **When** they view the Model Picker, **Then** they see a contextual "Prompt Guide" link next to it
5. **Given** the NanoBanana model is selected, **When** the organizer clicks the Prompt Guide link, **Then** it opens https://ai.google.dev/gemini-api/docs/image-generation#prompt-guide in a new tab
6. **Given** a different AI model is selected, **When** the organizer views the Prompt Guide link, **Then** it dynamically reflects the appropriate guide for that model

---

### Edge Cases

- What happens when a user uploads preview media that exceeds file size limits?
- How does the system handle uploading an overlay frame image with incompatible dimensions or format?
- What happens if countdown timer is set to 0 seconds while countdown is enabled?
- How does the system handle aspect ratio selection when reference images have different aspect ratios?
- What happens if the Prompt Guide link is unavailable or the model doesn't have a guide URL configured?
- How does the system handle migration of existing photo experiences that used logo overlays or old capture options?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST NOT display or store capture options in photo experience configuration
- **FR-002**: System MUST support upload of preview media in three formats: image, GIF, and video
- **FR-003**: System MUST store preview media using existing fields: `previewPath` (string) and `previewType` (enum: "image" | "gif" | "video")
- **FR-004**: System MUST display preview media appropriately based on type: static thumbnail for images, autoplay loop for GIFs, autoplay muted loop for videos
- **FR-005**: System MUST allow organizers to upload, replace, and remove preview media
- **FR-006**: System MUST display helper text for preview media: "This media will appear on the guest start screen as a visual preview of the experience"
- **FR-007**: System MUST provide a countdown toggle (on/off) in photo experience settings
- **FR-008**: System MUST provide a countdown timer input accepting values from 0 to 10 seconds
- **FR-009**: System MUST default countdown timer to 3 seconds when countdown is enabled
- **FR-010**: System MUST hide countdown timer input when countdown toggle is disabled
- **FR-011**: System MUST execute countdown during photo capture when countdown is enabled
- **FR-012**: System MUST capture photo immediately without countdown when countdown is disabled
- **FR-013**: System MUST provide an overlay toggle (on/off) in photo experience settings
- **FR-014**: System MUST support upload of a single frame overlay image only (no logo overlay support)
- **FR-015**: System MUST display preview of frame overlay composited over a sample photo in configuration UI
- **FR-016**: System MUST allow organizers to upload, replace, and remove frame overlay
- **FR-017**: System MUST remove all logo overlay configuration options and functionality
- **FR-018**: System MUST display AI reference images in a horizontal row layout with responsive wrapping
- **FR-019**: System MUST provide an aspect ratio picker with options: 1:1, 3:4, 4:5, 9:16, 16:9
- **FR-020**: System MUST apply selected aspect ratio to AI transformation output
- **FR-021**: System MUST display a "Prompt Guide" link next to the Model Picker
- **FR-022**: System MUST dynamically set the Prompt Guide link URL based on selected AI model
- **FR-023**: System MUST set Prompt Guide link to https://ai.google.dev/gemini-api/docs/image-generation#prompt-guide for NanoBanana model
- **FR-024**: System MUST open Prompt Guide links in a new browser tab

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Preview media upload and display MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Countdown timer input MUST be accessible and usable on mobile devices
- **MFR-003**: Frame overlay preview MUST render clearly on mobile viewport
- **MFR-004**: AI reference images horizontal row MUST wrap responsively on mobile viewports
- **MFR-005**: Aspect ratio picker MUST be touch-friendly with minimum 44x44px touch targets on mobile
- **MFR-006**: Prompt Guide link MUST be easily tappable on mobile devices (minimum 44x44px)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Preview media uploads MUST be validated for file type (image, GIF, video) and size using Zod schemas
- **TSR-002**: Countdown timer value MUST be validated to ensure it's a number between 0 and 10
- **TSR-003**: Overlay frame image uploads MUST be validated for file type and size using Zod schemas
- **TSR-004**: Aspect ratio selection MUST be validated as one of the allowed enum values (1:1, 3:4, 4:5, 9:16, 16:9)
- **TSR-005**: TypeScript strict mode MUST be maintained (no `any` escapes) for all preview media, countdown, overlay, and AI settings types

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Preview media upload and storage MUST use Admin SDK via Server Actions for write operations
- **FAR-002**: Frame overlay upload and storage MUST use Admin SDK via Server Actions for write operations
- **FAR-003**: Preview media and frame overlay MUST be stored as full public URLs in Firebase Storage for instant rendering
- **FAR-004**: Photo experience configuration updates (countdown, overlay toggle, aspect ratio, etc.) MUST use Admin SDK via Server Actions
- **FAR-005**: All photo experience schema updates MUST be located in `web/src/lib/schemas/` with Zod validation
- **FAR-006**: Real-time preview updates in configuration UI MAY use Client SDK for optimistic reads

### Key Entities *(include if feature involves data)*

- **Photo Experience**: Represents a configured photo activity within an event. Key attributes include:
  - Preview media (path, type)
  - Countdown settings (enabled, timer value)
  - Overlay settings (enabled, frame overlay path)
  - AI transformation settings (reference images, aspect ratio, model, prompt)
  - Relationships: belongs to an Event

- **Preview Media**: Represents visual media shown to guests before starting the photo experience. Key attributes include:
  - Media type (image, GIF, or video)
  - Storage path/URL
  - Relationships: belongs to a Photo Experience

- **Frame Overlay**: Represents a visual frame applied over captured photos. Key attributes include:
  - Image storage path/URL
  - Relationships: belongs to a Photo Experience

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event organizers can create a photo experience with preview media in under 5 minutes
- **SC-002**: 100% of photo experiences function without capture options configuration (feature removed)
- **SC-003**: Preview media (image, GIF, video) displays correctly on guest start screen for 95% of uploads
- **SC-004**: Organizers can configure countdown timer values (0-10 seconds) and verify countdown behavior during test captures
- **SC-005**: Frame overlay preview renders accurately over sample photos in configuration UI for 95% of uploads
- **SC-006**: AI reference images display in horizontal layout with responsive wrapping on mobile viewports (320px-768px)
- **SC-007**: Aspect ratio picker supports all 5 required ratios (1:1, 3:4, 4:5, 9:16, 16:9) and applies correctly to AI output
- **SC-008**: Prompt Guide link opens correct model-specific documentation in new tab for 100% of supported models
- **SC-009**: 90% of organizers successfully complete photo experience configuration on first attempt without errors or confusion
- **SC-010**: Mobile users (320px-768px viewport) can access and use all photo experience configuration features without horizontal scrolling

## Assumptions *(optional)*

- Existing photo experiences with capture options will need migration logic to remove deprecated fields
- Existing photo experiences with logo overlays will need migration logic to remove logo overlay data
- Preview media file size limits will inherit from current media upload rules in the system
- Frame overlay image format and dimension requirements will follow existing image upload standards
- The aspect ratio picker will use a dropdown or segmented control component (specific UI component not specified)
- Custom aspect ratios beyond the 5 specified options are not supported in this iteration
- Models other than NanoBanana will have their own Prompt Guide URLs configured separately (implementation detail)
- Countdown timer values are in seconds (integer values from 0 to 10)

## Scope *(optional)*

### In Scope

- Removing capture options configuration UI and logic
- Adding preview media upload/display for image, GIF, and video formats
- Adding countdown settings (toggle and timer input)
- Simplifying overlay configuration to single frame overlay only
- Improving AI settings UI (horizontal reference images, aspect ratio picker, prompt guide link)
- Mobile-first responsive design for all new configuration features

### Out of Scope

- Custom aspect ratio input beyond the 5 predefined options
- Multiple frame overlays per photo experience
- Logo overlay support (explicitly removed)
- Preview media analytics or engagement tracking
- Advanced overlay positioning or scaling controls
- Prompt guide content creation or editing (links to external documentation only)
- Migration of existing events with deprecated fields (may be separate task)
- AI model management or model-specific validation logic
