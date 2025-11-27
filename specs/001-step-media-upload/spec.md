# Feature Specification: Step Media Upload

**Feature Branch**: `001-step-media-upload`
**Created**: 2025-11-27
**Status**: Draft
**Input**: Replace manual URL text input for mediaUrl in step editors with a proper media upload component supporting images, videos, GIFs, and Lottie JSON animations

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Image to Step (Priority: P1)

As an experience creator, I want to upload an image directly within the step editor so that I can add visual content to my journey steps without leaving the editor or using external tools.

**Why this priority**: Image upload is the most common use case and provides immediate value by eliminating the need to host images elsewhere and copy/paste URLs.

**Independent Test**: Can be fully tested by opening any step editor, clicking upload, selecting a JPG/PNG/WebP file, and verifying it appears in both the editor preview and guest-facing step.

**Acceptance Scenarios**:

1. **Given** I am editing a step in the journey editor, **When** I click the media upload button and select a JPG image under 10MB, **Then** the image uploads, a preview appears in the editor, and the step displays the image.
2. **Given** I have uploaded an image to a step, **When** I view the step in the preview panel, **Then** the image renders correctly at the appropriate size.
3. **Given** I have uploaded an image to a step, **When** I click the remove button, **Then** the image is removed from the step (but remains in storage for reuse).

---

### User Story 2 - Upload Video to Step (Priority: P2)

As an experience creator, I want to upload short videos to steps so that I can create more engaging welcome screens and info steps with motion content.

**Why this priority**: Video is the second most requested media type after images and significantly enhances engagement for event experiences.

**Independent Test**: Can be fully tested by uploading an MP4 file and verifying it autoplays (muted) in both editor preview and guest view.

**Acceptance Scenarios**:

1. **Given** I am editing a step, **When** I upload an MP4 video under 25MB, **Then** the video uploads successfully and plays automatically (muted, looped) in the preview.
2. **Given** I upload a video larger than 25MB, **When** the upload completes validation, **Then** I see an error message indicating the file is too large.
3. **Given** a step has a video, **When** a guest views the step, **Then** the video autoplays muted and loops continuously.

---

### User Story 3 - Upload GIF to Step (Priority: P2)

As an experience creator, I want to upload animated GIFs so that I can add lightweight animations without the complexity of video.

**Why this priority**: GIFs are a popular format for simple animations and are often smaller than videos while providing motion.

**Independent Test**: Can be fully tested by uploading a GIF and verifying it animates in the preview and guest view.

**Acceptance Scenarios**:

1. **Given** I am editing a step, **When** I upload a GIF under 10MB, **Then** the GIF uploads and animates in the preview.
2. **Given** a step has an animated GIF, **When** a guest views the step, **Then** the GIF animates continuously.

---

### User Story 4 - Upload Lottie Animation to Step (Priority: P3)

As an experience creator, I want to upload Lottie JSON animations so that I can add high-quality, scalable animations that look crisp on any device.

**Why this priority**: Lottie provides superior animation quality compared to GIFs and smaller file sizes, but is a more advanced use case.

**Independent Test**: Can be fully tested by uploading a valid Lottie JSON file and verifying the animation plays in both editor and guest views.

**Acceptance Scenarios**:

1. **Given** I am editing a step, **When** I upload a valid Lottie JSON file under 5MB, **Then** the animation uploads and plays in the preview.
2. **Given** I upload an invalid JSON file (not a Lottie animation), **When** validation occurs, **Then** I see an error message indicating the file is not a valid Lottie animation.
3. **Given** a step has a Lottie animation, **When** a guest views the step, **Then** the animation plays smoothly and loops.

---

### User Story 5 - Preview Media in Editor (Priority: P1)

As an experience creator, I want to see an accurate preview of my uploaded media in the step editor so that I can verify how it will look before publishing.

**Why this priority**: Visual feedback during editing is essential for a good authoring experience and prevents publish-then-check-then-fix cycles.

**Independent Test**: Can be tested by uploading each media type and verifying the preview renders appropriately (static for images, animated for GIF/video/Lottie).

**Acceptance Scenarios**:

1. **Given** I upload an image, **When** the upload completes, **Then** the image appears in the preview area of the editor within 2 seconds.
2. **Given** I upload a video, **When** the upload completes, **Then** the video autoplays (muted) in the preview area.
3. **Given** I upload a Lottie animation, **When** the upload completes, **Then** the animation plays in the preview area.
4. **Given** I remove media from a step, **When** I click remove, **Then** the preview updates immediately to show no media.

---

### User Story 6 - Backward Compatibility with Existing Steps (Priority: P1)

As a system user, I expect existing steps that have mediaUrl values to continue working after this feature is deployed.

**Why this priority**: Breaking existing content would cause immediate user impact and support issues.

**Independent Test**: Can be tested by viewing existing steps with mediaUrl and verifying they render correctly without the new mediaType field.

**Acceptance Scenarios**:

1. **Given** a step has an existing mediaUrl but no mediaType, **When** the step is displayed, **Then** the system infers the media type from the URL extension and renders appropriately.
2. **Given** an existing step with a mediaUrl, **When** I open it in the editor, **Then** the current media is shown in the preview and I can replace or remove it.

---

### Edge Cases

- What happens when the user's network connection fails mid-upload? System shows error message and allows retry.
- What happens when a user uploads an unsupported file type? System shows clear error message listing supported formats.
- What happens when a Lottie JSON file is corrupted or invalid? System validates structure before upload and shows specific error.
- What happens when two users upload the same filename? System generates unique filenames with timestamps to prevent conflicts.
- What happens to uploaded media when a step is deleted? Media remains in storage for potential reuse in other steps.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to upload images (JPG, PNG, WebP) up to 10MB directly in step editors
- **FR-002**: System MUST allow users to upload videos (MP4, WebM) up to 25MB directly in step editors
- **FR-003**: System MUST allow users to upload animated GIFs up to 10MB directly in step editors
- **FR-004**: System MUST allow users to upload Lottie JSON animations up to 5MB directly in step editors
- **FR-005**: System MUST validate Lottie JSON files for required structure (version, frame rate, layers) before accepting upload
- **FR-006**: System MUST display an accurate preview of uploaded media in the step editor based on media type
- **FR-007**: System MUST render images as static content
- **FR-008**: System MUST render GIFs as animated content
- **FR-009**: System MUST render videos as autoplaying, muted, looping content
- **FR-010**: System MUST render Lottie animations as smoothly playing, looping content
- **FR-011**: System MUST allow users to remove media from a step (unlink only, file remains in storage)
- **FR-012**: System MUST store uploaded media at company level for potential reuse across events/journeys/steps
- **FR-013**: System MUST maintain backward compatibility with existing steps that have mediaUrl but no mediaType
- **FR-014**: System MUST show clear error messages when file type is unsupported or file exceeds size limit
- **FR-015**: System MUST show upload progress indicator during file upload
- **FR-016**: System MUST detect and store media type (image, gif, video, lottie) alongside the URL

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Media upload button MUST meet minimum touch target size (44x44px)
- **MFR-002**: Media preview MUST scale appropriately on mobile viewports (320px-768px)
- **MFR-003**: Error messages MUST be readable on mobile (minimum 14px font size)
- **MFR-004**: Upload progress indicator MUST be visible and clear on mobile screens

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: File uploads MUST be validated for MIME type and file extension before processing
- **TSR-002**: File size MUST be validated against type-specific limits before upload begins
- **TSR-003**: Lottie JSON files MUST be parsed and validated for required structure (v, fr, ip, op, layers)
- **TSR-004**: Media type field MUST be one of: image, gif, video, lottie

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Media upload operations MUST use Admin SDK via Server Actions
- **FAR-002**: Uploaded media MUST be stored with public URLs for instant rendering
- **FAR-003**: Storage path MUST follow pattern: media/{companyId}/{mediaType}/{timestamp}-{filename}
- **FAR-004**: Media metadata (URL, type) MUST be persisted to step document via Server Action

### Key Entities

- **Step Media**: The visual asset attached to a step, consisting of a public URL and a media type (image, gif, video, lottie)
- **Media Type**: Classification of uploaded content determining how it renders (static image, animated GIF, autoplaying video, Lottie animation)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload media and see preview in under 5 seconds for files under 5MB on standard broadband connection
- **SC-002**: 100% of existing steps with mediaUrl continue to render correctly after deployment
- **SC-003**: Users can successfully upload all four media types (image, GIF, video, Lottie) without errors
- **SC-004**: File validation errors display clear, actionable messages within 1 second of file selection
- **SC-005**: Media upload workflow reduces time-to-add-media by 50% compared to manual URL entry (no external hosting required)
- **SC-006**: Uploaded media renders correctly on both desktop and mobile guest views

## Assumptions

- Users have access to media files locally on their device
- Company ID is available in the step editor context for storage path generation
- Existing steps with mediaUrl have URLs ending in recognizable extensions (.jpg, .png, .gif, .mp4, etc.) for type inference
- Standard web browser File API is sufficient for file selection (no native file picker required)
- Network connectivity is stable enough for file uploads up to 25MB
