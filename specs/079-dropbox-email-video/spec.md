# Feature Specification: Dropbox Video Export & Email Video Handling

**Feature Branch**: `079-dropbox-email-video`
**Created**: 2026-02-23
**Status**: Draft
**Input**: PRD P2 — Dropbox + Email Video Handling

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reliable Video Export to Dropbox (Priority: P1)

As an experience creator, when a guest completes an AI video experience, the resulting video is automatically uploaded to my connected Dropbox account so I have all campaign assets centralized and accessible for downstream use.

**Why this priority**: This is the core operational trust requirement. If video exports fail, agencies lose confidence in the platform and churn. Large video files (up to 500MB) require chunked upload handling to succeed reliably.

**Independent Test**: Can be fully tested by triggering a video export for a completed AI video job and verifying the file appears in Dropbox with the correct name, size, and playable content.

**Acceptance Scenarios**:

1. **Given** a completed AI video job (up to 500MB), **When** the export to Dropbox is triggered, **Then** the video is uploaded successfully using chunked upload and appears in the connected Dropbox folder with the naming format `eventName_userId_timestamp.mp4`.
2. **Given** a temporary network failure during upload, **When** the upload fails on the first attempt, **Then** the system retries up to 3 times before marking the export as failed.
3. **Given** an upload in progress, **When** checking the export status, **Then** progress is tracked and visible in system logs (percentage or chunk count).

---

### User Story 2 - Video-Aware Email Delivery (Priority: P1)

As a guest who completed a video experience, I receive an email with a thumbnail preview and a clear call-to-action button to watch my video on a hosted result page, rather than a broken or missing video embed.

**Why this priority**: Email is the primary delivery channel for guest results. Embedding video in email is technically unreliable across email clients. Getting this wrong means guests never see their results, destroying the experience value.

**Independent Test**: Can be fully tested by triggering a result email for a video-type job and verifying the email contains a thumbnail image, a "Watch Your Video" button linking to the result page, and no embedded video element.

**Acceptance Scenarios**:

1. **Given** a completed job where the media type is video, **When** the result email is sent, **Then** the email contains a generated thumbnail image and a "Watch Your Video" call-to-action button linking to the hosted result page.
2. **Given** a completed job where the media type is image, **When** the result email is sent, **Then** the image is embedded directly in the email body (existing behavior unchanged).
3. **Given** a guest receives the video result email and clicks the CTA, **When** the result page loads, **Then** the guest can view and play their AI-generated video.

---

### User Story 3 - Graceful Handling of Export Failures (Priority: P2)

As a system operator, when a Dropbox export fails after all retries, I am informed of the failure with enough context to diagnose and resolve the issue, so that no video export is silently lost.

**Why this priority**: While the retry mechanism handles transient failures, permanent failures (expired tokens, rate limits, storage full) must be surfaced so they can be resolved manually. This prevents silent data loss.

**Independent Test**: Can be fully tested by simulating a permanent Dropbox failure (e.g., revoked token) and verifying the failure is logged with the job ID, error details, and retry history.

**Acceptance Scenarios**:

1. **Given** a Dropbox upload that fails after 3 retry attempts, **When** all retries are exhausted, **Then** the system logs a detailed failure record including job ID, error type, and retry history.
2. **Given** a Dropbox token has expired, **When** an export is attempted, **Then** the system detects the authentication error and logs it distinctly from transient network errors.
3. **Given** the Dropbox API returns a rate limit response, **When** the system encounters the rate limit, **Then** it applies appropriate backoff before retrying.

---

### Edge Cases

- What happens when a video file exceeds 500MB? The system rejects the export and logs a size-limit error rather than attempting a partial upload.
- What happens when the Dropbox connection is disconnected (OAuth revoked) between job completion and export? The system detects the invalid token, logs the failure, and does not retry with the same invalid credentials.
- What happens when a video export is triggered but the source video file is missing or corrupted in storage? The system validates the source file exists and is non-zero before attempting the upload.
- What happens when the email thumbnail generation fails? The system falls back to a generic video placeholder image and still sends the email with the CTA link.
- What happens when the result page URL is accessed but the video has been deleted? The result page displays a user-friendly message indicating the content is no longer available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST upload video files to Dropbox using chunked (session-based) uploads to handle files up to 500MB.
- **FR-002**: System MUST retry failed Dropbox uploads up to 3 times with appropriate backoff between attempts.
- **FR-003**: System MUST name exported files using the format `eventName_userId_timestamp.mp4`.
- **FR-004**: System MUST log upload progress for each export (chunks uploaded, percentage, or similar metric).
- **FR-005**: System MUST log detailed failure information when an export fails after all retries, including job ID, error type, and retry count.
- **FR-006**: System MUST detect and distinctly handle Dropbox authentication errors (expired/revoked tokens) separately from transient network errors.
- **FR-007**: System MUST apply backoff when encountering Dropbox rate limit responses before retrying.
- **FR-008**: System MUST validate the source video file exists and is non-zero before attempting a Dropbox upload.
- **FR-009**: System MUST generate a thumbnail image from the video for use in email delivery.
- **FR-010**: System MUST send result emails for video media types with a thumbnail image and a "Watch Your Video" CTA linking to the hosted result page.
- **FR-011**: System MUST continue to embed images directly in result emails when the media type is image (no change to existing behavior).
- **FR-012**: System MUST use a generic placeholder image in emails when thumbnail generation fails, while still including the CTA link.
- **FR-013**: System MUST reject and log exports for files exceeding the 500MB size limit.

### Key Entities

- **Export Job**: Represents a single video export operation. Tracks source file reference, destination (Dropbox path), status (pending, in-progress, completed, failed), retry count, and error details.
- **Result Email**: The notification sent to a guest after their experience completes. Contains either an embedded image (for image media) or a thumbnail with CTA link (for video media).
- **Video Thumbnail**: A still image generated from the video, used as a preview in the result email.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Greater than 99% of video exports to Dropbox complete successfully (including retries).
- **SC-002**: Zero corrupted or incomplete files are delivered to Dropbox (file integrity verified).
- **SC-003**: Video result emails achieve greater than 20% open-to-click rate on the "Watch Your Video" CTA.
- **SC-004**: All video exports up to 500MB in size complete without failure due to file size.
- **SC-005**: Failed exports are logged with sufficient detail to diagnose the root cause without additional investigation.
- **SC-006**: Guests receive their result email with the correct content type (thumbnail+CTA for video, embedded image for image) 100% of the time.

## Assumptions

- The Dropbox OAuth integration is already established (token acquisition and storage are handled by existing functionality from the 069-dropbox-export feature).
- A hosted result page already exists where guests can view their AI-generated results; this feature adds video playback support to it if not already present.
- Video files are stored in Firebase Storage after AI processing, and the system has access to retrieve them for export.
- The email sending infrastructure is already in place; this feature modifies the email template/content based on media type.
- FFmpeg or equivalent tooling is available in the backend environment for thumbnail generation from video files.
