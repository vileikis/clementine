# Feature Specification: Media Processing Pipeline (Stage 1)

**Feature Branch**: `028-media-processing-pipeline`
**Created**: 2025-12-16
**Status**: Draft
**Input**: User description: "Stage 1 Basic Media Processing Pipeline - No Manipulation. Process single images and multi-frame bursts into final output formats (image, GIF, video) using FFmpeg with configurable aspect ratios."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Process Single Photo (Priority: P1)

A guest submits a single photo through the experience and receives a properly formatted output image matching the event's aspect ratio configuration (square or story format).

**Why this priority**: This is the foundational use case - single photo processing is the simplest and most common scenario. All processing infrastructure must work for this before handling more complex multi-frame scenarios.

**Independent Test**: Can be fully tested by submitting one photo through the API with specified output format and aspect ratio, then verifying the returned image matches the requested dimensions and is accessible via the provided URL.

**Acceptance Scenarios**:

1. **Given** a session with one uploaded photo, **When** processing is requested with outputFormat="image" and aspectRatio="square", **Then** system returns a 1080x1080px image
2. **Given** a session with one uploaded photo, **When** processing is requested with outputFormat="image" and aspectRatio="story", **Then** system returns a 1080x1920px image
3. **Given** a processed single image, **When** a user accesses the primaryUrl, **Then** the image displays correctly with proper dimensions
4. **Given** a processed single image, **When** a user accesses the thumbnailUrl, **Then** a 300px-wide thumbnail displays

---

### User Story 2 - Process Photo Burst into GIF (Priority: P2)

A guest submits multiple photos in sequence (burst mode) and receives an animated GIF that loops through all frames at a consistent frame rate with proper aspect ratio.

**Why this priority**: GIF creation is the most common multi-frame output format for web sharing. It's more widely supported than video and doesn't require special players or codecs.

**Independent Test**: Can be fully tested by submitting 4 photos through the API with outputFormat="gif" and aspectRatio="square", then verifying the returned GIF animates all frames in sequence and matches the requested dimensions.

**Acceptance Scenarios**:

1. **Given** a session with 4 uploaded photos, **When** processing is requested with outputFormat="gif" and aspectRatio="square", **Then** system returns a 1080x1080px animated GIF with all 4 frames
2. **Given** a session with 4 uploaded photos, **When** processing is requested with outputFormat="gif" and aspectRatio="story", **Then** system returns a 1080x1920px animated GIF with all 4 frames
3. **Given** a processed GIF, **When** viewed in a browser, **Then** the GIF loops infinitely with 0.5 seconds per frame
4. **Given** a processed GIF with frames of different dimensions, **When** the GIF is created, **Then** all frames are scaled and centered consistently

---

### User Story 3 - Process Photo Burst into Video (Priority: P3)

A guest submits multiple photos in sequence and receives an MP4 video that plays through all frames at a consistent frame rate, optimized for web streaming and mobile playback.

**Why this priority**: Video output is less common than GIF for web sharing but provides better quality and smaller file sizes for longer sequences. It's the final piece of the basic processing pipeline.

**Independent Test**: Can be fully tested by submitting 4 photos through the API with outputFormat="video" and aspectRatio="square", then verifying the returned MP4 plays smoothly on web and mobile devices.

**Acceptance Scenarios**:

1. **Given** a session with 4 uploaded photos, **When** processing is requested with outputFormat="video" and aspectRatio="square", **Then** system returns a 1080x1080px MP4 video with all 4 frames at 5fps
2. **Given** a session with 4 uploaded photos, **When** processing is requested with outputFormat="video" and aspectRatio="story", **Then** system returns a 1080x1920px MP4 video with all 4 frames at 5fps
3. **Given** a processed video, **When** played on mobile Safari, **Then** the video starts playing immediately (fast start optimization)
4. **Given** a processed video with frames of different dimensions, **When** the video is created, **Then** all frames are scaled and centered consistently with black padding if needed

---

### Edge Cases

- What happens when an input image is extremely small (e.g., 100x100px) and needs to be scaled up to 1080x1080px?
- How does the system handle very large input files (e.g., 50MB photos from professional cameras)?
- What happens if one frame in a burst fails to download or is corrupted?
- How does the system handle processing timeout after 30 minutes for very large bursts?
- What happens when a session is already being processed and another processing request arrives?
- How does the system handle input images with unusual aspect ratios (e.g., ultra-wide panoramas)?
- What happens when Storage quota is exceeded and upload fails?
- How does the system clean up temporary files if processing crashes mid-execution?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept processing requests with three parameters: sessionId, outputFormat (image/gif/video), and aspectRatio (square/story)
- **FR-002**: System MUST validate that sessionId exists in Firestore before processing
- **FR-003**: System MUST prevent duplicate processing by checking if session is already in "running" state
- **FR-004**: System MUST mark session as "pending" when queuing a processing task
- **FR-005**: System MUST queue processing as an async Cloud Task with retry capability (max 3 attempts, 30s min backoff)
- **FR-006**: System MUST fetch inputAssets array from session document and process frames in array order (no sorting)
- **FR-007**: System MUST download all input images from Storage to temporary directory before processing
- **FR-008**: System MUST determine output type based on: if outputFormat="image" OR inputAssets.length=1 then single-image, else if outputFormat="video" then video, else GIF
- **FR-009**: For single image processing, system MUST scale and crop input to target dimensions (1080x1080 for square, 1080x1920 for story)
- **FR-010**: For GIF processing, system MUST concatenate all frames with 0.5s duration per frame and infinite loop
- **FR-011**: For video processing, system MUST create MP4 with H.264 codec, 5fps, yuv420p pixel format, and fast start flag
- **FR-012**: System MUST apply center-crop and padding to maintain target aspect ratio when input dimensions don't match
- **FR-013**: System MUST generate thumbnail (max 300px width) from first frame or single image
- **FR-014**: System MUST upload processed output to Storage at path: `projects/{projectId}/results/{sessionId}-output.{ext}`
- **FR-015**: System MUST upload thumbnail to Storage at path: `projects/{projectId}/results/{sessionId}-thumb.jpg`
- **FR-016**: System MUST clean up temporary files after successful or failed processing
- **FR-017**: System MUST update session document with outputs object containing: primaryUrl, thumbnailUrl, format, dimensions, sizeBytes, completedAt, processingTimeMs
- **FR-018**: System MUST clear processing state from session document when complete
- **FR-019**: System MUST handle processing errors by marking session as failed with error details
- **FR-020**: System MUST log all processing steps with sessionId, state, step, and timing information
- **FR-021**: System MUST timeout processing after 30 minutes (1800 seconds)
- **FR-022**: System MUST return 405 error for non-POST requests to processMedia endpoint
- **FR-023**: System MUST return 400 error if required parameters (sessionId, outputFormat, aspectRatio) are missing
- **FR-024**: System MUST return 400 error if outputFormat is not one of: image, gif, video
- **FR-025**: System MUST return 400 error if aspectRatio is not one of: square, story
- **FR-026**: System MUST return 404 error if sessionId does not exist in Firestore

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: API request body MUST be validated with Zod schema requiring sessionId (string), outputFormat (enum: image|gif|video), aspectRatio (enum: square|story)
- **TSR-002**: PipelineConfig interface MUST be strongly typed with outputFormat, aspectRatio, outputWidth, outputHeight, frameDuration, fps fields
- **TSR-003**: SessionOutputs interface MUST be strongly typed with primaryUrl, thumbnailUrl, format, dimensions (width/height), sizeBytes, completedAt, processingTimeMs fields
- **TSR-004**: TypeScript strict mode MUST be maintained throughout all pipeline service code

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Session fetching MUST use Admin SDK via Cloud Function context (not Server Actions - this is backend processing)
- **FAR-002**: Session updates (processing state, outputs) MUST use Admin SDK with Firestore transactions where appropriate
- **FAR-003**: Storage operations (download, upload) MUST use Admin SDK Storage client
- **FAR-004**: Output URLs (primaryUrl, thumbnailUrl) MUST be full public URLs for instant rendering without additional auth
- **FAR-005**: Firestore writes MUST use FieldValue.serverTimestamp() for all timestamp fields
- **FAR-006**: Processing state MUST be stored in temporary `processing` field (deleted on completion) to avoid polluting main session data

### Key Entities

- **Session**: Represents a guest's interaction with an experience, containing inputAssets array (URLs to uploaded photos), projectId, and processing state
- **InputAsset**: Individual uploaded photo with URL pointing to Storage location in `projects/{projectId}/inputs/`
- **SessionOutputs**: Final processed media with primaryUrl (main output), thumbnailUrl (preview), format (image/gif/video), dimensions, file size, completion timestamp, and processing duration
- **PipelineConfig**: Processing configuration derived from request parameters, containing output format, aspect ratio, dimensions, and frame timing settings
- **ProcessingState**: Temporary state tracking (state: pending/running/failed, currentStep, startedAt, updatedAt, attemptNumber, taskId) stored in session during processing

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Single image processing completes in under 10 seconds from API request to completion (90th percentile)
- **SC-002**: GIF processing for 4-frame burst completes in under 30 seconds from API request to completion (90th percentile)
- **SC-003**: Video processing for 4-frame burst completes in under 45 seconds from API request to completion (90th percentile)
- **SC-004**: All processed outputs (images, GIFs, videos) match requested dimensions exactly (1080x1080 or 1080x1920)
- **SC-005**: Generated thumbnails are under 50KB in size while maintaining visual quality
- **SC-006**: System successfully processes 95% of requests on first attempt (without retry)
- **SC-007**: Processed GIFs are under 5MB for 4-frame sequences to ensure fast web loading
- **SC-008**: Processed MP4 videos maintain 95%+ quality while being 30%+ smaller than equivalent GIF
- **SC-009**: System handles concurrent processing of 10 sessions without performance degradation
- **SC-010**: Failed processing attempts clean up all temporary files with 100% success rate
- **SC-011**: All processing stages log sufficient information to debug failures within 5 minutes
- **SC-012**: Output URLs remain accessible for 30 days minimum without requiring re-authentication

## Assumptions *(optional)*

- Input images are in standard web formats (JPEG, PNG, WebP)
- Input images are already uploaded to Storage before processing is requested
- Firebase Storage has sufficient quota for project needs
- Cloud Functions have access to ffmpeg binary (via npm package or system installation)
- Network connectivity between Cloud Functions and Storage is reliable
- Session documents contain valid projectId field for constructing Storage paths
- InputAsset URLs are valid and publicly accessible from Cloud Functions
- Temporary directory `/tmp/` has sufficient space for processing (Cloud Functions provide adequate tmp space)
- Processing will not include overlays, background removal, or AI transformations (Stage 1 only - passthrough processing)

## Dependencies *(optional)*

- **Firebase Cloud Functions v2**: Required for HTTP endpoints (processMedia) and Cloud Tasks (processMediaJob)
- **Firebase Firestore**: Required for session storage and real-time updates
- **Firebase Storage**: Required for input asset storage and output result storage
- **Cloud Tasks**: Required for async job processing with retry logic
- **FFmpeg**: Required for all media processing (image scaling, GIF composition, video encoding)
- **fluent-ffmpeg npm package**: Required for programmatic FFmpeg control in Node.js
- **ffmpeg-static npm package**: Required to bundle FFmpeg binary with Cloud Function

## Out of Scope *(optional)*

- AI image transformations (Stage 2+)
- Background removal (Stage 2+)
- Overlay application (Stage 2+)
- Custom frame patterns (e.g., boomerang effect) - Stage 1 uses simple sequential frames
- Frame ordering/sorting - inputAssets processed in array order as-is
- Audio support in videos
- Custom frame durations (hardcoded to 0.5s for GIF, 5fps for video)
- Output format negotiation - format must be explicitly specified in request
- Real-time progress updates during processing (only state changes: pending → running → complete)
- Batch processing of multiple sessions
- Input validation of image content (e.g., checking for inappropriate content)
- Watermarking or branding overlays
- Custom dimensions beyond square/story presets
- Support for video inputs (Stage 1 processes photos only)
