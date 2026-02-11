## Dropbox Export Integration

### 1) Problem

Event creators want generated media automatically exported to a location their team already uses (Dropbox), organized in a predictable structure, without manual downloading.

### 2) Goal

When Dropbox is connected at the **Workspace** level and configured on a **Project**, Clementine automatically exports each generated result to the project's configured Dropbox folder, organized by **Experience** (and optionally by event/date/session).

### 3) Non-goals (for v1)

- Two-way sync (Dropbox → Clementine)
- Live "watch folder" ingestion
- Advanced permission management across multiple Dropbox team members
- Per-guest folder sharing links (can be a v2)
- Connecting multiple Dropbox accounts per workspace

---

## Architecture: Two-level model

### Workspace level — OAuth connection

The Dropbox OAuth token is stored **once per Workspace**. A single Dropbox account is linked to the workspace.

- **Who can connect/disconnect:** Workspace Owner or Admin
- **What's stored:** encrypted refresh token, Dropbox account email/name, connected-by user, connected-at timestamp
- **Managed from:** Workspace Settings → Integrations

### Project level — Export configuration

Each project independently configures **where and how** to export, using the workspace's connected Dropbox account.

- **Who can configure:** Project Editor+
- **What's stored:** destination folder path, export toggles, naming template
- **Managed from:** Project Editor → Connect tab

This means: connect Dropbox once, use it across all projects with different folder targets.

---

## Core product decision: How auth works

### Recommended (do this)

**Direct Dropbox API integration using OAuth 2.0**:

- User clicks "Connect Dropbox" (from Workspace Settings or Project Connect tab)
- Redirected through Dropbox OAuth
- Refresh token (encrypted) + metadata stored at Workspace level
- Files uploaded via Dropbox API with the granted permissions

**Why this is the only sane option**

- Works for non-technical customers
- Revocable + auditable
- Stable across token rotation
- No customer credential handling (less liability, less support)

### Strongly reject (don't do this)

**"User provides API key/token"**

- Dropbox doesn't really have "API keys per user" in the way people imagine; it's OAuth-based.
- Even if you hack around it: it's insecure, brittle, and not scalable for agencies/brands.

### Also reject (not relevant to upload)

**"User provides webhook"**

- Webhook can't upload. It's a notification mechanism.

### Also reject (not viable for writes)

**"User provides a shared/public folder link"**

- Dropbox shared links are read-only. There is no concept of a publicly writable folder.
- You cannot upload files to Dropbox without an authenticated API token.

---

## UX: Workspace Settings → Integrations

### Not connected state

Card: **Dropbox**

- Copy: "Connect your Dropbox account to enable automatic export of generated media across your projects."
- CTA: **Connect Dropbox**

### Connected state

- Status: **Connected** — `user@example.com` (Dropbox account)
- Connected by: Jane Doe, Feb 11 2026
- CTA: **Disconnect** (Workspace Owner/Admin only)
- Note: "Disconnecting will stop all active Dropbox exports across projects in this workspace."

### Failure state

- "Needs re-authentication" (token revoked/expired) — CTA: **Reconnect**

---

## UX: Project Editor → Connect tab

### State A: Workspace Dropbox not connected

Card: **Dropbox**

- Copy: "Automatically export generated photos/videos to Dropbox folders."
- Subtext: "Dropbox is not connected on this workspace yet."
- CTA: **Connect Dropbox** (initiates the OAuth flow, saves token at Workspace level)
- On success: transitions to State C (connected + needs folder configuration)
- Secondary: "Learn how it works"

This allows users to connect Dropbox without leaving the project context. The connection is stored at the workspace level, but the user doesn't need to navigate to Workspace Settings to set it up.

### State B: Workspace connected, project not configured

Card: **Dropbox**

- Status: **Connected** — `user@example.com`
- Copy: "Choose a Dropbox folder for this project's exports."
- Folder picker (browse or paste path)
- Export settings with defaults:
  - ✅ Export final results (default ON)
  - Folder structure options (see below)
  - Naming template (simple)
- CTA: **Save & Enable**

### State C: Workspace connected, project configured

- Status: **Active**
- Connected Dropbox: `user@example.com`
- Export folder: `/Selected/Path`
- Toggles / settings:
  - ✅ Export final results (default ON)
  - Folder structure options (see below)
  - Naming template (simple)
- Buttons:
  - **Send test file**
  - **Change folder**
  - **Disable export** (keeps config, stops exporting)
  - **View logs**

### Failure states (must be explicit)

- "Dropbox connection lost — ask a workspace admin to reconnect" (token revoked/expired)
- "Insufficient permissions to write to folder"
- "Rate-limited by Dropbox (retrying)"
- "Folder not found (reselect folder)"

---

## Permissions summary

| Action | Required role |
|---|---|
| Connect Dropbox (OAuth) | Workspace Owner / Admin |
| Disconnect Dropbox | Workspace Owner / Admin |
| Reconnect (re-auth) | Workspace Owner / Admin |
| View connection status | Any workspace member |
| Configure export folder on a project | Project Editor+ |
| Enable/disable export on a project | Project Editor+ |
| Send test file | Project Editor+ |
| View export logs | Any project member |

---

## Folder structure (important: choose a default that won't bite you)

### Default export structure (v1)

`/<SelectedFolder>/Clementine/<ProjectName>/<ExperienceName>/`

Inside Experience folder:

- Files named with timestamp + session id (or short code)
  - `2026-02-11_19-24-03_session-8F3K_result.jpg`

### Optional (v2-ready but you can expose a simple toggle)

Add date partitioning:
`.../<ExperienceName>/2026-02-11/<file>`

**Why this matters:** if you dump everything into one folder, customers will hate you after 1 event.

---

## System behavior (pipeline integration)

### Trigger point

When `transformPipelineJob` completes successfully and produces a final artifact:

- Check if the project has Dropbox export enabled + configured
- If yes: enqueue `dropboxExportTask` per output artifact (photo, gif, video, etc.)

### Dropbox Export Task steps

1. Load Workspace integration (token) + Project export config (folder, settings)
2. Verify token valid (refresh if needed)
3. Compute destination path based on project settings
4. Ensure folders exist (create if missing)
5. Upload file (chunked upload for large video)
6. Record export outcome:
   - `success | retrying | failed`
   - Dropbox file id/path
   - Error details if any

### Retries & idempotency (this is not optional)

You will get duplicated uploads unless you make exports idempotent.

**Idempotency approach**

- Generate a deterministic `export_key` per artifact:
  - `projectId + experienceId + jobId + artifactId + outputVariant`

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
    scopes: string[],
  }
}
```

### Project-level (Firestore: `projects/{id}`)

```
exports: {
  dropbox: {
    enabled: boolean,
    folderPath: string,             // e.g. "/Events/2026/Brand Launch"
    folderStructure: "flat" | "by_experience" | "by_date",
    namingTemplate: string,         // e.g. "{timestamp}_{sessionId}_result"
    configuredBy: userId,
    configuredAt: timestamp,
  }
}
```

---

## Security & compliance checklist

- Encrypt refresh tokens at rest (KMS or equivalent)
- Principle of least privilege scopes (`files.content.write`, `files.content.read`)
- Disconnect = revoke token via Dropbox API + delete tokenRef from DB
- Audit trail: who connected, when, to which Dropbox account
- Never show full tokens in logs
- Project editors can configure folders but cannot access or view the token
- Disconnecting at workspace level immediately stops all project exports
