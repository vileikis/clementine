# Feature Specification: Dropbox Export Integration

**Feature Branch**: `069-dropbox-export`
**Created**: 2026-02-11
**Status**: Draft
**Input**: Automatically export generated media results to a connected Dropbox account, organized by project and experience, without manual downloading.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect Dropbox to Workspace (Priority: P1)

A Workspace Owner or Admin opens the Project Editor's Connect tab and clicks "Connect Dropbox." They are redirected to Dropbox's OAuth consent screen, which shows that the app can only access its own folder (`/Apps/Clementine/`). After granting permission, they are returned to Clementine and see the connection status updated to "Connected" with their Dropbox email displayed.

**Why this priority**: Without a connected Dropbox account, no exports can happen. This is the foundational action that enables the entire feature.

**Independent Test**: Can be fully tested by initiating the OAuth flow and verifying the connection status updates in the UI. Delivers value by establishing the integration link.

**Acceptance Scenarios**:

1. **Given** a workspace with no Dropbox connection, **When** a Workspace Owner clicks "Connect Dropbox" and completes the OAuth flow, **Then** the Connect tab shows "Connected" status with the authorized Dropbox email address.
2. **Given** a workspace with no Dropbox connection, **When** a Workspace Admin clicks "Connect Dropbox" and completes the OAuth flow, **Then** the Connect tab shows "Connected" status with the authorized Dropbox email address.
3. **Given** a workspace with no Dropbox connection, **When** the user cancels or denies the Dropbox OAuth consent, **Then** the Connect tab remains in the "not connected" state and no token is stored.
4. **Given** a user who is a Project Editor but not a Workspace Owner or Admin, **When** they view the Connect tab, **Then** they see the Dropbox status but cannot initiate the "Connect Dropbox" action.

---

### User Story 2 - Enable Dropbox Export on a Project (Priority: P1)

After Dropbox is connected at the workspace level, a Project Editor opens the Connect tab and toggles "Export to Dropbox" to ON. The tab shows the destination path (`/Apps/Clementine/<ProjectName>/<ExperienceName>/`) and confirms export is active.

**Why this priority**: Enabling export per project is the core configuration step. Without it, connected Dropbox accounts have no effect on media delivery.

**Independent Test**: Can be fully tested by toggling the export switch and verifying the UI reflects the enabled state with the correct folder path. Delivers value by letting creators control which projects export to Dropbox.

**Acceptance Scenarios**:

1. **Given** a workspace with Dropbox connected and a project with export disabled, **When** a Project Editor toggles "Export to Dropbox" ON, **Then** the toggle shows ON and the destination path is displayed.
2. **Given** a project with Dropbox export enabled, **When** a Project Editor toggles "Export to Dropbox" OFF, **Then** the toggle shows OFF and new results are no longer exported.
3. **Given** a workspace where Dropbox is not connected, **When** a Project Editor views the Connect tab, **Then** the export toggle is not available and the "Connect Dropbox" prompt is shown instead.

---

### User Story 3 - Automatic Export of Generated Results (Priority: P1)

A guest completes an AI photo experience. The system generates a result image. Because Dropbox export is enabled on the project, the result is automatically uploaded to the workspace's Dropbox App Folder at `/Apps/Clementine/<ProjectName>/<ExperienceName>/<filename>` without any manual action by the creator or guest.

**Why this priority**: This is the core value proposition — automatic, hands-free export of generated media to Dropbox. Without this, the feature delivers no real benefit.

**Independent Test**: Can be fully tested by running an experience end-to-end on a project with Dropbox export enabled, then checking Dropbox for the exported file at the expected path. Delivers value by eliminating manual download workflows.

**Acceptance Scenarios**:

1. **Given** a project with Dropbox export enabled, **When** a guest completes an experience and a result is generated, **Then** the result file appears in the Dropbox App Folder at the correct path within a reasonable timeframe.
2. **Given** a project with Dropbox export enabled, **When** a result is generated, **Then** the exported file follows the naming convention `<date>_<time>_session-<shortCode>_result.<ext>`.
3. **Given** a project with Dropbox export enabled, **When** the same result is exported again (e.g., due to retry), **Then** the file overwrites the previous copy at the same path without creating duplicates.
4. **Given** a project with Dropbox export disabled, **When** a guest completes an experience, **Then** no file is uploaded to Dropbox.
5. **Given** a project with Dropbox export enabled, **When** a result is generated, **Then** an export log entry is recorded with the job ID, provider, status, and destination path.

---

### User Story 4 - Disconnect Dropbox from Workspace (Priority: P2)

A Workspace Owner or Admin clicks "Disconnect" on the Connect tab. The system revokes the Dropbox token, removes stored credentials, and immediately stops all project exports across the workspace. The Connect tab returns to the "not connected" state.

**Why this priority**: Disconnection is essential for security and user control, but is secondary to the connect-and-export workflow.

**Independent Test**: Can be fully tested by disconnecting a connected workspace and verifying that the connection status resets and subsequent exports do not occur.

**Acceptance Scenarios**:

1. **Given** a workspace with Dropbox connected, **When** a Workspace Owner clicks "Disconnect," **Then** the Dropbox token is revoked, stored credentials are removed, and the Connect tab shows the "not connected" state.
2. **Given** a workspace with Dropbox connected and multiple projects with export enabled, **When** Dropbox is disconnected, **Then** no project in the workspace exports to Dropbox.
3. **Given** a user who is a Project Editor but not a Workspace Owner or Admin, **When** they view the Connect tab, **Then** the "Disconnect" option is not available to them.

---

### User Story 5 - Handle Connection Failures Gracefully (Priority: P2)

If the Dropbox token is revoked externally or expires without successful refresh, the next export attempt fails. The system marks the connection as needing re-authentication and surfaces a message on the Connect tab: "Dropbox connection lost — reconnect to resume exports" with a "Reconnect" button that re-initiates OAuth.

**Why this priority**: Graceful failure handling prevents silent data loss and builds user trust, but is a secondary concern after the core export flow works.

**Independent Test**: Can be fully tested by simulating a revoked token and verifying the UI displays the re-auth prompt and that the reconnect flow restores functionality.

**Acceptance Scenarios**:

1. **Given** a workspace with Dropbox connected, **When** an export fails due to an authentication error, **Then** the workspace integration status is updated to indicate re-authentication is needed.
2. **Given** a workspace with a failed Dropbox connection, **When** a user views the Connect tab, **Then** they see "Dropbox connection lost — reconnect to resume exports" with a "Reconnect" button.
3. **Given** a workspace with a failed Dropbox connection, **When** a Workspace Owner or Admin clicks "Reconnect" and completes OAuth, **Then** the connection is restored and exports resume for projects that have export enabled.

---

### Edge Cases

- What happens when a project or experience is renamed after files have been exported? New exports use the new name; previously exported files in Dropbox retain the old folder name. No retroactive renaming.
- What happens when an export fails due to Dropbox service being temporarily unavailable? The export task retries automatically with exponential backoff per the task queue configuration.
- What happens when the result file is unusually large? For v1, only images are expected (a few MB). Simple single-request upload handles this. Large video files are a future enhancement.
- What happens when Dropbox storage is full? The upload fails, an error is logged in the export log, and the failure does not affect the guest experience or the pipeline.
- What happens when Dropbox is disconnected while an export task is in flight? The task checks live connection status before uploading. If disconnected, it skips the export and logs accordingly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow Workspace Owners and Admins to connect a Dropbox account via OAuth 2.0 with App Folder scope.
- **FR-002**: System MUST store the Dropbox connection (encrypted refresh token, account email, display name, connected-by user, timestamp) at the workspace level.
- **FR-003**: System MUST allow Workspace Owners and Admins to disconnect Dropbox, which revokes the token and removes stored credentials.
- **FR-004**: System MUST allow Project Editors (and above) to enable or disable Dropbox export on individual projects.
- **FR-005**: System MUST store the project-level export configuration (enabled boolean, configured-by user, timestamp).
- **FR-006**: System MUST automatically export generated results to the Dropbox App Folder when export is enabled on a project and Dropbox is connected at the workspace level.
- **FR-007**: System MUST organize exported files in the folder structure `/Apps/Clementine/<ProjectName>/<ExperienceName>/`.
- **FR-008**: System MUST name exported files using the convention `<date>_<time>_session-<shortCode>_result.<ext>`.
- **FR-009**: System MUST handle duplicate exports by overwriting the file at the same deterministic path.
- **FR-010**: System MUST write an export log entry for each export attempt, recording job ID, provider, status, destination path, and any error.
- **FR-011**: System MUST mark the workspace integration as needing re-authentication when an export fails due to an authentication error (e.g., 401).
- **FR-012**: System MUST display the appropriate connection state on the Project Editor Connect tab (not connected, connected with export off, connected with export on, connection lost).
- **FR-013**: System MUST isolate export processing from the main generation pipeline — export failures MUST NOT affect the guest experience or pipeline result delivery.
- **FR-014**: System MUST prevent non-Owner/Admin workspace members from connecting or disconnecting Dropbox.
- **FR-015**: System MUST prevent users below Project Editor role from toggling the export setting.
- **FR-016**: System MUST immediately stop all project exports when Dropbox is disconnected at the workspace level.
- **FR-017**: System MUST allow any workspace member to view the Dropbox connection status.
- **FR-018**: System MUST encrypt the Dropbox refresh token at rest.

### Key Entities

- **Workspace Integration (Dropbox)**: Represents the OAuth connection between a workspace and a Dropbox account. Contains connection status, encrypted credentials, account metadata, and audit information. One per workspace.
- **Project Export Configuration (Dropbox)**: Represents whether Dropbox export is enabled for a specific project. Contains enabled state and audit information. One per project.
- **Export Log**: A record of each export attempt for a project. Contains the job reference, provider, success/failure status, destination path, and error details. Used for debugging and future UI display.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can connect Dropbox to their workspace and enable export on a project in under 2 minutes from start to finish.
- **SC-002**: 99% of generated results are successfully exported to Dropbox within 2 minutes of generation when the connection is healthy.
- **SC-003**: Export failures do not delay or affect the guest's experience — guests receive their result regardless of export outcome.
- **SC-004**: When a Dropbox connection is lost, the system surfaces a re-authentication prompt on the Connect tab within the next page load.
- **SC-005**: Disconnecting Dropbox stops all active project exports immediately — no exports occur after disconnection.
- **SC-006**: Exported files are correctly organized in the expected folder structure and follow the defined naming convention 100% of the time.

## Assumptions

- Dropbox App Folder scope is sufficient for v1 — users accept that exports go to `/Apps/Clementine/` rather than a custom path.
- Only one Dropbox account can be connected per workspace.
- Only image results are exported in v1 (small files, a few MB each). Simple single-request upload is sufficient.
- Export logs are written for debugging purposes only — no UI to browse them in v1.
- Retry behavior is handled by the task queue with default exponential backoff — no custom retry logic is needed.
- Re-authentication is detected reactively (when an export fails with 401), not proactively via health checks.
- Project/experience names used in folder paths are the display names at the time of export. No retroactive renaming of previously exported folders.

## Non-Goals (v1)

- Two-way sync (Dropbox to Clementine)
- Live "watch folder" ingestion
- Advanced permission management across multiple Dropbox team members
- Per-guest folder sharing links
- Connecting multiple Dropbox accounts per workspace
- Custom folder path selection
- Export logs UI
- Send test file functionality
- Proactive re-auth detection
- Chunked upload for large files
- Date partitioning in folder structure
