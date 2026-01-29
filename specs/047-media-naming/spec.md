# Feature Specification: Preserve Original Media File Names

**Feature Branch**: `047-media-naming`
**Created**: 2026-01-29
**Status**: Draft
**Input**: User description: "Use actual file names for uploaded media instead of fixed 'overlay' prefix, with separate display name field for human-readable identification"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Media with Original Filename (Priority: P1)

When users upload media files (images) to the media library, they want to see the original filename they uploaded (e.g., "Beach Sunset.jpg", "Logo Draft v2.png") instead of system-generated names. This helps users identify and manage their media assets.

**Why this priority**: Core functionality that directly impacts user experience. Without this, users cannot identify their uploaded files, making the media library difficult to use.

**Independent Test**: Can be fully tested by uploading a file named "My Photo.jpg" and verifying the media library displays "My Photo.jpg" as the filename. This delivers immediate value by showing recognizable filenames.

**Acceptance Scenarios**:

1. **Given** a user uploads a file named "Company Logo.png", **When** the upload completes, **Then** the media library displays "Company Logo.png" as the filename
2. **Given** a user uploads multiple files with different names, **When** viewing the media library, **Then** each file displays its original filename
3. **Given** a user uploads a file with special characters in the name (e.g., "Photo #1 - Final (2).jpg"), **When** the upload completes, **Then** the display name preserves the original filename exactly

---

### User Story 2 - Storage Collision Prevention (Priority: P1)

When multiple users upload files with the same name (e.g., multiple "logo.png" files), the system must prevent storage collisions while still showing each user their original filename. Users should never see conflicting or overwritten files.

**Why this priority**: Critical for data integrity. Without collision prevention, files could overwrite each other, causing data loss.

**Independent Test**: Can be tested by uploading two different files both named "logo.png" and verifying both are stored separately with unique storage paths, while both display "logo.png" to their respective users.

**Acceptance Scenarios**:

1. **Given** two different files both named "logo.png" are uploaded, **When** both uploads complete, **Then** both files exist in storage with unique storage paths
2. **Given** a file named "image.jpg" already exists in storage, **When** another file named "image.jpg" is uploaded, **Then** the new file is stored without overwriting the existing file
3. **Given** concurrent uploads of files with identical names, **When** all uploads complete, **Then** each file has a unique storage identifier

---

### User Story 3 - Media Reference Integration (Priority: P2)

When media assets are referenced in other parts of the system (overlays, backgrounds, experience media), those references should include the display name so users can identify which media is being used without looking it up.

**Why this priority**: Improves usability when configuring projects. Users can see "Summer Background.jpg" instead of just a URL, making it easier to manage configurations.

**Independent Test**: Can be tested by uploading a file "Hero Image.png", setting it as a project background, and verifying the project configuration shows "Hero Image.png" when displaying the selected background.

**Acceptance Scenarios**:

1. **Given** a user uploads "Overlay.png" and selects it as an event overlay, **When** viewing the event settings, **Then** the overlay selection displays "Overlay.png"
2. **Given** a media asset with display name "Banner.jpg" is referenced in a project, **When** the project configuration is loaded, **Then** the reference includes the display name "Banner.jpg"
3. **Given** a user browses media references in project settings, **When** viewing the list, **Then** each media item shows its display name

---

### User Story 4 - Migration of Existing Media (Priority: P3)

Existing media assets uploaded before this feature was implemented need to be handled gracefully. Users should see a default display name for legacy assets until they can be properly named.

**Why this priority**: Lower priority because it only affects existing data, not new functionality. The system can function with default names while allowing gradual migration.

**Independent Test**: Can be tested by loading a media library containing pre-existing assets and verifying they display with the default name "Untitled" instead of causing errors.

**Acceptance Scenarios**:

1. **Given** a media asset exists without a display name field, **When** the asset is loaded, **Then** it displays with the default name "Untitled"
2. **Given** the media library contains both legacy and new assets, **When** viewing the library, **Then** legacy assets show "Untitled" and new assets show their original filenames
3. **Given** a media reference to a legacy asset without display name, **When** the reference is loaded, **Then** it falls back to "Untitled" without errors

---

### Edge Cases

- What happens when a filename contains only special characters or emojis? (Display name should preserve them exactly as uploaded)
- How does the system handle files without extensions? (Storage name gets no extension, display name shows original)
- What happens when a filename is extremely long (500+ characters)? (Display name should be stored as-is, though UI may truncate for display)
- What happens when the same user uploads the same file twice? (Both copies are stored separately with unique IDs, both show same display name)
- How are display names handled in different locales with non-ASCII characters? (UTF-8 encoding preserves all characters)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate unique storage filenames using nanoid algorithm with preserved file extensions
- **FR-002**: System MUST store the original uploaded filename separately as a display name field
- **FR-003**: System MUST preserve the complete original filename including spaces, special characters, and Unicode characters
- **FR-004**: Media asset documents MUST include both a storage filename (unique) and a display name (original)
- **FR-005**: Media references MUST include the display name field when referencing media assets
- **FR-006**: Upload service MUST return a media reference object that includes display name
- **FR-007**: System MUST handle legacy media assets without display names by defaulting to "Untitled"
- **FR-008**: System MUST ensure storage filename collisions never occur even when multiple files have identical display names
- **FR-009**: Application code MUST use media reference imports from the shared package instead of app-specific re-exports
- **FR-010**: System MUST remove the fixed "overlay-" prefix from generated filenames

### Key Entities *(include if feature involves data)*

- **MediaAsset**: Represents a complete media file document stored in Firestore. Key attributes:
  - `fileName`: Unique storage filename (e.g., "abc123def456.png") used for Firebase Storage path
  - `displayName`: Original user-provided filename (e.g., "Beach Sunset.jpg") shown in UI
  - `filePath`: Full storage path including unique filename
  - `url`: Download URL for the media file
  - `fileSize`, `mimeType`, `width`, `height`: File metadata
  - `uploadedAt`, `uploadedBy`, `type`, `status`: Tracking information

- **MediaReference**: Lightweight reference to a MediaAsset used in other documents (project configs, overlays, backgrounds). Key attributes:
  - `mediaAssetId`: ID of the referenced MediaAsset document
  - `url`: Direct download URL
  - `filePath`: Storage path (nullable for backward compatibility)
  - `displayName`: Human-readable filename for display in UI

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify uploaded media by seeing the exact filename they originally uploaded (100% filename preservation)
- **SC-002**: Zero storage collisions occur when uploading files with duplicate names (100% collision prevention)
- **SC-003**: Media references throughout the application display human-readable filenames instead of generated identifiers
- **SC-004**: All new media uploads include display names without requiring additional user input
- **SC-005**: Legacy media assets continue to function without errors using default display names
- **SC-006**: Upload operations complete with the same performance as before (no measurable degradation)
