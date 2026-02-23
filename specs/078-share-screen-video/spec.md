# Feature Specification: Share Screen Video Support

**Feature Branch**: `078-share-screen-video`
**Created**: 2026-02-23
**Status**: Draft
**Input**: User description: "Support image + video results seamlessly in share view across desktop and mobile"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Views Video Result on Share Screen (Priority: P1)

A guest visits the share link after their AI-generated video result is ready. The share screen detects that the result is a video (not an image) and renders a video player instead of a static image. The video autoplays silently, loops, and fits within the existing layout without pushing the download/share CTA below the fold.

**Why this priority**: This is the core experience — if the video doesn't render and play properly, nothing else matters. It's the first thing the guest sees.

**Independent Test**: Can be tested by generating a video result and visiting the share URL. The video should autoplay muted within the media container, with aspect ratio preserved and CTA visible without scrolling.

**Acceptance Scenarios**:

1. **Given** a session with a completed video result, **When** the guest opens the share link, **Then** the video plays automatically with sound off
2. **Given** a video result, **When** the share screen renders, **Then** the video player shows play/pause controls only (no scrub bar, no native download button)
3. **Given** a video result in 9:16 aspect ratio, **When** rendered on desktop, **Then** the video fits within a max ~50vh container with aspect ratio preserved and the CTA remains visible without scrolling
4. **Given** a video result in 16:9 aspect ratio, **When** rendered on mobile, **Then** the video fits within the container with aspect ratio preserved and the CTA remains visible without scrolling
5. **Given** a session with a completed image result, **When** the guest opens the share link, **Then** the image renders exactly as it does today (no regression)

---

### User Story 2 - Guest Downloads or Shares a Video Result (Priority: P1)

A guest taps the download/share button on the share screen for a video result. On mobile, the native share sheet opens (if supported) allowing the guest to share the video directly to social media or messaging apps. On desktop, the video file downloads directly with the correct file extension.

**Why this priority**: Download and sharing are revenue-critical actions. A brand case study is worthless if guests can't save or share their video results.

**Independent Test**: Can be tested by tapping the download button for a video result on both mobile and desktop. Verify the correct file format downloads and the native share sheet opens on mobile.

**Acceptance Scenarios**:

1. **Given** a video result on desktop, **When** the guest clicks the download button, **Then** the video file downloads with the correct extension (e.g., `.mp4`)
2. **Given** a video result on a mobile device that supports Web Share API, **When** the guest taps the share/download button, **Then** the native share sheet opens with the video file
3. **Given** a video result on a mobile device without Web Share API support, **When** the guest taps the download button, **Then** the video file downloads directly as a fallback
4. **Given** an image result, **When** the guest clicks download, **Then** the image downloads as it does today (no regression)

---

### User Story 3 - Video Loads Performantly with Thumbnail Preview (Priority: P2)

Before the video fully loads, the guest sees a thumbnail preview image and a loading indicator. This prevents a blank or jarring experience on slow connections and gives the guest visual feedback that their result is ready.

**Why this priority**: Performance and perceived speed matter, but the feature works without this — it's an enhancement to the core video playback experience.

**Independent Test**: Can be tested by throttling network speed and loading a video share page. A thumbnail should appear immediately with a loading state, followed by the video becoming playable.

**Acceptance Scenarios**:

1. **Given** a video result with a thumbnail available, **When** the share screen loads, **Then** the thumbnail displays immediately while the video loads in the background
2. **Given** a video result on a slow connection, **When** the page loads, **Then** a loading indicator is visible until the video is ready to play
3. **Given** a video result without a thumbnail available, **When** the share screen loads, **Then** a loading skeleton or placeholder is shown until the video is ready

---

### Edge Cases

- What happens when the video file fails to load or is corrupted? The system should show a user-friendly error message with an option to retry.
- What happens when the video URL has expired or is inaccessible? The system should display an error state rather than a broken player.
- What happens when a user's browser does not support HTML5 video playback? The system should show a fallback message with a download link.
- What happens when the result media type cannot be determined? The system should default to rendering as an image (current behavior) to avoid breaking the experience.
- What happens when the video is very large (e.g., 50MB+)? The system should still begin playback promptly using streaming/progressive loading rather than waiting for full download.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect whether a result is an image or video and render the appropriate media player
- **FR-002**: Video results MUST autoplay with sound muted by default
- **FR-003**: Video player MUST show only play/pause controls (no scrub bar, no volume control, no native download button)
- **FR-004**: Video MUST loop continuously after reaching the end
- **FR-005**: Media container MUST constrain height to approximately 50% of the viewport height
- **FR-006**: Media container MUST preserve the original aspect ratio for all supported formats (1:1, 9:16, 16:9)
- **FR-007**: The download/share CTA MUST remain visible without scrolling on both desktop and mobile regardless of media aspect ratio
- **FR-008**: On desktop, tapping the download button for a video MUST trigger a direct file download with the correct file extension
- **FR-009**: On mobile, tapping the download button for a video MUST attempt to open the native share sheet first, falling back to direct download if unavailable
- **FR-010**: The system MUST lazy-load video content to avoid impacting initial page load
- **FR-011**: When a thumbnail is available, the system MUST display it as a poster image before the video starts playing
- **FR-012**: The system MUST show a loading indicator while video content is buffering
- **FR-013**: All existing image rendering and download behavior MUST remain unchanged (backward compatible)

### Key Entities

- **MediaReference**: Represents the result media attached to a session — includes URL, file path, and display name. Currently does not indicate media type directly.
- **JobOutput**: Contains the `format` field (`image` | `gif` | `video`) that determines result type, along with `thumbnailUrl` for video poster images and `dimensions` for aspect ratio.
- **Session**: The guest's session record, linking to `resultMedia` (MediaReference) and `jobStatus` for result readiness.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Greater than 98% of video results play successfully on the share screen without user intervention
- **SC-002**: Less than 2% of download/share attempts for video results fail
- **SC-003**: Video begins playback within 3 seconds of the share page becoming visible on a standard connection
- **SC-004**: Share screen layout keeps the CTA visible without scrolling on 95% of common device screen sizes
- **SC-005**: Zero regressions in image result rendering and download behavior

## Assumptions

- The backend already sets the `format` field in job output correctly for video results (`'video'`).
- Video files are stored in a format widely supported by browsers (e.g., MP4 with H.264).
- The `thumbnailUrl` field in job output is populated for video results when available.
- Maximum video duration is 8 seconds (per existing AI video configuration), so file sizes remain manageable for direct download and mobile sharing.
- The Web Share API is available on modern mobile browsers (Safari 15+, Chrome for Android) and the system gracefully degrades on unsupported browsers.
