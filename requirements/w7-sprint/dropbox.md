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
- **Managed from:** Workspace Settings → Integrations

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

- User clicks "Connect Dropbox" (from Workspace Settings or Project Connect tab)
- Redirected through Dropbox OAuth with `app_folder` scope
- Refresh token (encrypted) + metadata stored at Workspace level
- Files uploaded via Dropbox API into the sandboxed App Folder

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

## UX: Workspace Settings → Integrations

### Not connected state

Card: **Dropbox**

- Copy: "Connect your Dropbox account to enable automatic export of generated media across your projects."
- Subtext: "Clementine will create an app folder in your Dropbox. We cannot access your other files."
- CTA: **Connect Dropbox**

### Connected state

- Status: **Connected** — `user@example.com` (Dropbox account)
- Connected by: Jane Doe, Feb 11 2026
- Info: "Exports go to `/Apps/Clementine/` in your Dropbox"
- CTA: **Disconnect** (Workspace Owner/Admin only)
- Note: "Disconnecting will stop all active Dropbox exports across projects in this workspace."

### Failure state

- "Needs re-authentication" (token revoked/expired) — CTA: **Reconnect**

---

## UX: Project Editor → Connect tab

### State A: Workspace Dropbox not connected

Card: **Dropbox**

- Copy: "Automatically export generated results to Dropbox."
- Subtext: "Dropbox is not connected on this workspace yet."
- CTA: **Connect Dropbox** (initiates the OAuth flow, saves token at Workspace level)
- On success: transitions to State B
- Secondary: "Learn how it works"

This allows users to connect Dropbox without leaving the project context. The connection is stored at the workspace level, but the user doesn't need to navigate to Workspace Settings to set it up.

### State B: Workspace connected, export disabled

Card: **Dropbox**

- Status: **Connected** — `user@example.com`
- Toggle: **Export to Dropbox** (OFF)
- Subtext: "Results will be exported to `/Apps/Clementine/<ProjectName>/<ExperienceName>/`"

### State C: Workspace connected, export enabled

Card: **Dropbox**

- Status: **Active**
- Connected Dropbox: `user@example.com`
- Toggle: **Export to Dropbox** (ON)
- Info: "Exporting to `/Apps/Clementine/<ProjectName>/<ExperienceName>/`"
- Buttons:
  - **Send test file**
  - **View logs**

### Failure states (must be explicit)

- "Dropbox connection lost — ask a workspace admin to reconnect" (token revoked/expired)
- "Rate-limited by Dropbox (retrying)"

---

## Permissions summary

| Action | Required role |
|---|---|
| Connect Dropbox (OAuth) | Workspace Owner / Admin |
| Disconnect Dropbox | Workspace Owner / Admin |
| Reconnect (re-auth) | Workspace Owner / Admin |
| View connection status | Any workspace member |
| Enable/disable export on a project | Project Editor+ |
| Send test file | Project Editor+ |
| View export logs | Any project member |

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

### Date partitioning (v2-ready)

Can be added later without breaking existing structure:

```
/Apps/Clementine/<ProjectName>/<ExperienceName>/2026-02-11/<file>
```

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
  → if gdrive enabled:   enqueue gdriveExportTask(...)   (future)
  → if webhook enabled:  enqueue webhookDeliverTask(...)  (future)
```

The `resultMedia` payload follows the existing `MediaReference` schema (`mediaAssetId`, `url`, `filePath`, `displayName`). One job produces one result — no artifact arrays.

**Why a separate dispatch task (not inline in the pipeline):**

- **Failure isolation** — if dispatch fails (e.g., Firestore read error while checking config), the pipeline result is unaffected. The guest sees success. The dispatch retries on its own.
- **Single responsibility** — `transformPipelineJob` produces artifacts. `dispatchExports` routes them. Neither knows about the other's internals.
- **Clean testing** — pipeline tests don't need export dispatch mocks. Dispatch tests don't need pipeline context.

**Why separate worker tasks per integration:**

- Independent failure domains — Dropbox rate limits don't block webhook delivery
- Independent retry policies — webhooks retry 3x over 1h, Dropbox retries 10x over 24h
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
7. Upload file to Dropbox App Folder
8. Record export outcome:
   - `success | retrying | failed`
   - Dropbox file id/path
   - Error details if any

### Retries & idempotency (this is not optional)

You will get duplicated uploads unless you make exports idempotent.

**Idempotency approach**

- Generate a deterministic `export_key` per result:
  - `projectId + experienceId + jobId + mediaAssetId`

- Store it in DB with status.
- On retry, if `export_key` already succeeded, do nothing.

### Rate limits / backoff

- Use exponential backoff on 429 / transient errors
- Cap retries (e.g., 10 attempts over ~24h)
- After max retries: mark failed + surface in UI logs

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

### Export log (Firestore: `projects/{id}/exportLogs/{logId}`)

```
{
  jobId: string,
  artifactId: string,
  provider: "dropbox",
  exportKey: string,             // idempotency key
  status: "success" | "retrying" | "failed",
  dropboxFileId: string | null,
  dropboxPath: string | null,
  error: string | null,
  attempts: number,
  createdAt: timestamp,
  lastAttemptAt: timestamp,
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
