# Feature Specification: Experience Cover Image

**Feature Branch**: `039-experience-media`
**Created**: 2026-01-22
**Status**: Draft
**Input**: User description: "Allow admin to add media to the experience in the experience editor"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Experience Cover Image (Priority: P1)

As an experience creator (admin), I want to upload a cover image for my experience in the experience designer so that the experience displays with a thumbnail in the event editor, welcome screen, and experience lists.

**Why this priority**: This is the core functionality. The experience schema already has a `media` field and multiple UI components already display it (ExperienceListView, ExperienceCard, ExperienceSlotItem, WelcomeScreen). Without a way to set this media in the designer, these components show "No image" placeholders.

**Independent Test**: Can be fully tested by uploading an image in the experience designer and confirming it appears as the thumbnail in the experience list view and welcome screen preview. Delivers immediate visual value across all experience displays.

**Acceptance Scenarios**:

1. **Given** the admin is in the experience designer, **When** they navigate to the cover image section, **Then** they see an option to upload or select a cover image
2. **Given** the admin has no cover image set, **When** they view the cover image section, **Then** they see a placeholder with an upload prompt
3. **Given** the admin clicks to add a cover image and selects a file, **When** the upload completes, **Then** the image thumbnail appears in the designer and is saved to the experience
4. **Given** the admin has set a cover image, **When** they view the experience in the event editor or welcome screen, **Then** the cover image is displayed as the experience thumbnail

---

### User Story 2 - Replace or Remove Cover Image (Priority: P2)

As an experience creator, I want to change or remove the cover image for my experience so that I can update the visual representation as my experience evolves.

**Why this priority**: After setting an initial cover image, admins need to be able to update or remove it. This completes the basic media management workflow for the experience.

**Independent Test**: Can be tested by uploading a new image to replace the existing one, and by removing the image entirely. Verifies that changes persist and display correctly.

**Acceptance Scenarios**:

1. **Given** the admin has a cover image set, **When** they hover over the image or click an edit option, **Then** they see options to replace or remove the image
2. **Given** the admin clicks to replace the image and selects a new file, **When** the upload completes, **Then** the new image replaces the old one
3. **Given** the admin clicks to remove the image and confirms, **When** the removal completes, **Then** the cover image is cleared and the placeholder is shown again
4. **Given** the admin removes the cover image, **When** they view the experience elsewhere, **Then** the "No image" placeholder appears in those locations

---

### Edge Cases

- What happens when the admin uploads a file with an unsupported format? → System displays clear error message specifying supported formats (PNG, JPEG, WebP)
- What happens when the upload fails due to network issues? → System displays error with option to retry
- What happens when the admin selects a file that exceeds the maximum size (5MB)? → System displays an error explaining the size limit before upload begins
- What happens when the admin navigates away during upload? → Upload continues in background; if successful, media is saved when admin returns

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a cover image section in the experience designer where admins can upload or set the experience's thumbnail
- **FR-002**: System MUST allow admins to upload image files (PNG, JPEG, WebP) up to 5MB as the cover image
- **FR-003**: System MUST display upload progress while the cover image is being uploaded
- **FR-004**: System MUST validate file type and size before starting the upload
- **FR-005**: System MUST display the current cover image as a preview in the designer when one is set
- **FR-006**: System MUST allow admins to replace the current cover image with a new upload
- **FR-007**: System MUST allow admins to remove the cover image, clearing the media field
- **FR-008**: System MUST save the cover image to the experience's `media` field (mediaAssetId and url)
- **FR-009**: System MUST provide clear error messages for upload failures with actionable guidance

### Key Entities

- **Experience Media Field**: The existing `media` field on the Experience document containing `mediaAssetId` (reference to workspace media asset) and `url` (public URL for display). Already defined in the shared schema.
- **Media Asset**: An uploaded file stored in the workspace media library, containing file metadata and storage URL. Reuses existing workspace media infrastructure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can upload a cover image and see it appear in the designer preview within 10 seconds for standard file sizes (under 2MB)
- **SC-002**: Cover images set in the designer appear correctly in all display locations (experience lists, event editor, welcome screen) without additional configuration
- **SC-003**: 95% of cover image uploads complete successfully on first attempt under normal network conditions
- **SC-004**: Replacing or removing a cover image takes effect immediately in all display locations after save

## Assumptions

- The existing workspace media library infrastructure and upload flow will be reused (MediaPickerField component or similar)
- The existing 5MB file size limit and supported image formats (PNG, JPEG, WebP) from the workspace media system apply
- The cover image is stored as a single media reference (not a collection) matching the existing `experienceMediaSchema`
- Video support is out of scope for this feature (images only)
- The cover image section will be added to the experience designer layout, location TBD during planning (could be in header area, settings panel, or dedicated section)
