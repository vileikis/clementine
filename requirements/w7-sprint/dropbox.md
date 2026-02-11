## Dropbox Export Integration

### 1) Problem

Event creators want generated media automatically exported to a location their team already uses (Dropbox), organized in a predictable structure, without manual downloading.

### 2) Goal

When Dropbox is connected at the **Workspace** level and enabled on a **Project**, Clementine automatically exports each generated result to the workspace's Dropbox App Folder, organized by project and experience.

### 3) Non-goals (for v1)

- Two-way sync (Dropbox → Clementine)
- Live "watch folder" ingestion
- Advanced permission management across multiple Dropbox team members
- Per-guest folder sharing links (can be a v2)
- Connecting multiple Dropbox accounts per workspace
- Custom folder path selection (App Folder scope handles this automatically)

---

## Architecture: Two-level model

### Workspace level — OAuth connection

The Dropbox OAuth token is stored **once per Workspace**. A single Dropbox account is linked to the workspace.

- **Who can connect/disconnect:** Workspace Owner or Admin
- **What's stored:** encrypted refresh token, Dropbox account email/name, connected-by user, connected-at timestamp
- **Managed from:** Project Editor → Connect tab (v1); Workspace Settings → Integrations (future)

### Project level — Export toggle

Each project independently enables/disables Dropbox export. No folder configuration needed — the App Folder scope means Clementine controls the folder structure automatically.

- **Who can toggle:** Project Editor+
- **What's stored:** enabled boolean, configured-by user, configured-at timestamp
- **Managed from:** Project Editor → Connect tab

This means: connect Dropbox once, toggle export on/off per project.

---

## Dropbox App Folder scope

Instead of requesting full Dropbox access and asking the user to pick a folder, we use the **App Folder** permission scope.

### How it works

- When the Dropbox app is registered, it's configured with `app_folder` access type
- Dropbox automatically creates `/Apps/Clementine/` in the user's Dropbox
- Our API token can **only** read/write inside `/Apps/Clementine/`
- We cannot access any other files in the user's Dropbox

### Why this is better for v1

- **No folder picker needed** — eliminates an entire UI surface and failure mode
- **Less permission anxiety** — users see "App can only access its own folder" during OAuth consent
- **No "folder not found" errors** — we own the folder structure entirely
- **Simpler project config** — just an on/off toggle instead of folder path + naming template
- **Predictable structure** — every Clementine customer has the same layout

### Trade-off

Users cannot choose an arbitrary export destination (e.g., `/Events/Brand Launch/Photos`). Everything goes into `/Apps/Clementine/...`. For v1, this is an acceptable limitation. If customers need custom paths, v2 can upgrade to full Dropbox access scope.

---

## Core product decision: How auth works

### Do this: OAuth 2.0 with App Folder scope

- User clicks "Connect Dropbox" (from Project Connect tab)
- Redirected through Dropbox OAuth with `app_folder` scope
- Refresh token (encrypted) + metadata stored at Workspace level
- Files uploaded via Dropbox API into the App Folder

**Why this is the only sane option**

- Works for non-technical customers
- Revocable + auditable
- Stable across token rotation
- No customer credential handling (less liability, less support)
- Minimal permissions — can't touch user's other files

### Strongly reject

**"User provides API key/token"** — Dropbox is OAuth-based. No per-user API keys exist.

**"User provides webhook"** — Webhooks can't upload. It's a notification mechanism.

**"User provides a shared/public folder link"** — Dropbox shared links are read-only. You cannot upload via a link.

---

## UX: Project Editor → Connect tab

All Dropbox management happens here in v1. Connect, disconnect, toggle export — one place.

### State A: Workspace Dropbox not connected

Card: **Dropbox**

- Copy: "Automatically export generated results to Dropbox."
- Subtext: "Clementine will create an app folder in your Dropbox. We cannot access your other files."
- CTA: **Connect Dropbox** (initiates the OAuth flow, saves token at Workspace level)
- On success: transitions to State B

### State B: Workspace connected, export disabled

Card: **Dropbox**

- Status: **Connected** — `user@example.com`
- Toggle: **Export to Dropbox** (OFF)
- Subtext: "Results will be exported to `/Apps/Clementine/<ProjectName>/<ExperienceName>/`"
- Link: **Disconnect** — "This will disconnect Dropbox for all projects in this workspace."

### State C: Workspace connected, export enabled

Card: **Dropbox**

- Status: **Active**
- Connected Dropbox: `user@example.com`
- Toggle: **Export to Dropbox** (ON)
- Info: "Exporting to `/Apps/Clementine/<ProjectName>/<ExperienceName>/`"
- Link: **Disconnect** — "This will disconnect Dropbox for all projects in this workspace."

### Failure states

- "Dropbox connection lost — reconnect to resume exports" (token revoked/expired, shown reactively when an export fails with 401)
- CTA: **Reconnect** (re-initiates OAuth)

---

## Permissions summary

| Action | Required role |
|---|---|
| Connect Dropbox (OAuth) | Workspace Owner / Admin |
| Disconnect Dropbox | Workspace Owner / Admin |
| View connection status | Any workspace member |
| Enable/disable export on a project | Project Editor+ |

---

## Folder structure

### Automatic structure (App Folder)

All exports go into the Dropbox-managed App Folder:

```
/Apps/Clementine/
  └── <ProjectName>/
      └── <ExperienceName>/
          ├── 2026-02-11_19-24-03_session-8F3K_result.jpg
          ├── 2026-02-11_19-25-17_session-A2M9_result.jpg
          └── ...
```

### File naming

`<date>_<time>_session-<shortCode>_result.<ext>`

Example: `2026-02-11_19-24-03_session-8F3K_result.jpg`

---

## System behavior (pipeline integration)

### Architecture: Separate dispatch task with fan-out to export workers

When `transformPipelineJob` completes successfully, it enqueues a single `dispatchExports` Cloud Task. The dispatcher reads live project config, determines which integrations are enabled, and fans out to independent export worker tasks.

```
transformPipelineJob completes successfully
  → enqueue dispatchExports({ jobId, projectId, resultMedia })
  → pipeline is done — not affected by export outcomes

dispatchExports (Cloud Task, own retry policy)
  → read project export config (live)
  → if dropbox enabled:  enqueue dropboxExportTask({ jobId, projectId, resultMedia })
  → (future integrations added here)
```

The `resultMedia` payload follows the existing `MediaReference` schema (`mediaAssetId`, `url`, `filePath`, `displayName`). One job produces one result — no artifact arrays.

**Why a separate dispatch task (not inline in the pipeline):**

- **Failure isolation** — if dispatch fails (e.g., Firestore read error while checking config), the pipeline result is unaffected. The guest sees success. The dispatch retries on its own.
- **Single responsibility** — `transformPipelineJob` produces artifacts. `dispatchExports` routes them. Neither knows about the other's internals.
- **Clean testing** — pipeline tests don't need export dispatch mocks. Dispatch tests don't need pipeline context.

**Why separate worker tasks per integration:**

- Independent failure domains — Dropbox rate limits don't block future webhook delivery
- Independent retry policies per integration
- Each worker is self-contained and testable in isolation
- Adding a new integration = add one worker + one `if` in the dispatcher

**Why NOT snapshot integration config at job creation:**

- Integration config is operational plumbing, not a creative decision
- If Dropbox was disconnected between job creation and completion, the correct behavior is to skip export
- Check live config at dispatch time — simpler and correct

### Dropbox Export Task steps

1. Load Workspace integration (check token exists + status is "connected")
2. Load Project export config (check enabled)
3. Refresh access token if needed (using stored refresh token)
4. Download result file from Firebase Storage (using `resultMedia.filePath`)
5. Compute destination path: `/<ProjectName>/<ExperienceName>/<filename>`
6. Ensure folders exist (create if missing via Dropbox API)
7. Upload file to Dropbox App Folder (simple single-request upload)
8. Write export log to `projects/{id}/exportLogs/{logId}`

### Duplicate handling

File paths are deterministic (based on project, experience, session, timestamp). If Cloud Tasks redelivers, the same file uploads to the same path — Dropbox overwrites it. No duplicates, no DB tracking needed.

### Retries

Cloud Tasks handles retries with built-in exponential backoff. Configure via task queue settings (max attempts, backoff parameters). No custom retry logic needed.

On auth errors (401), mark workspace integration as `needs_reauth` so the UI can surface the issue.

---

## Data model sketch

### Workspace-level (Firestore: `workspaces/{id}`)

```
integrations: {
  dropbox: {
    status: "connected" | "disconnected" | "needs_reauth",
    accountEmail: string,
    accountDisplayName: string,
    encryptedRefreshToken: string,   // encrypted at rest
    connectedBy: userId,
    connectedAt: timestamp,
    scopes: ["app_folder"],
  }
}
```

### Project-level (Firestore: `projects/{id}`)

```
exports: {
  dropbox: {
    enabled: boolean,
    enabledBy: userId,
    enabledAt: timestamp,
  }
}
```

### Export logs (Firestore: `projects/{id}/exportLogs/{logId}`)

Written by export workers. No UI in v1 — used for debugging via Firebase console and as foundation for future logs UI.

```
{
  jobId: string,
  provider: "dropbox",
  status: "success" | "failed",
  destinationPath: string | null,    // e.g. "/ProjectName/ExperienceName/file.jpg"
  error: string | null,
  createdAt: timestamp,
}
```

---

## Security & compliance checklist

- Encrypt refresh tokens at rest (KMS or equivalent)
- Use App Folder scope only — cannot access user's other Dropbox files
- Disconnect = revoke token via Dropbox API + delete tokenRef from DB
- Audit trail: who connected, when, to which Dropbox account
- Never show full tokens in logs
- Project editors can toggle export but cannot access or view the token
- Disconnecting at workspace level immediately stops all project exports

---

## Future enhancements (post-v1)

### Workspace Settings → Integrations page

Dedicated workspace-level page for managing all integrations (Dropbox, Google Drive, webhooks). Central place to connect/disconnect, view all connected accounts, and see which projects use each integration. For v1, connect/disconnect is managed from the Project Connect tab.

### Export logs UI

"View logs" UI on the Project Connect tab showing export history — timestamps, success/failure, Dropbox paths, error details. The `exportLogs` subcollection is written in v1; this adds the frontend to browse it.

### Send test file

"Send test file" button on the Project Connect tab to verify the Dropbox connection works without running a real experience. For v1, running an experience is the test.

### Proactive re-auth detection

Periodic health checks or Dropbox webhook listeners to detect token revocation before an export fails. For v1, re-auth is detected reactively when an export fails with a 401.

### Chunked upload for large files

Dropbox chunked upload API for files > 150MB (videos). For v1, only images are exported (a few MB each), so simple single-request upload is sufficient.

### Date partitioning

Add date-based subfolders to the export structure:

```
/Apps/Clementine/<ProjectName>/<ExperienceName>/2026-02-11/<file>
```

Can be added later without breaking existing structure.

### Custom folder paths

Upgrade from App Folder scope to full Dropbox access, allowing users to choose arbitrary export destinations. Requires folder picker UI and path validation.
