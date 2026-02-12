# Research: Dropbox Export Integration

**Feature**: 069-dropbox-export
**Date**: 2026-02-11

## R1: Dropbox OAuth 2.0 with App Folder Scope

**Decision**: Use Dropbox OAuth 2.0 authorization code flow with `app_folder` scope via PKCE.

**Rationale**:
- App Folder scope auto-creates `/Apps/Clementine/` in the user's Dropbox, limiting access to only that folder
- Eliminates folder picker UI — simpler UX and fewer failure modes
- Lower permission anxiety for users ("can only access its own folder")
- OAuth 2.0 with PKCE is the standard for web apps (no client secret needed in browser)

**Alternatives considered**:
- Full Dropbox access scope: Requires folder picker UI, higher permission anxiety, unnecessary for v1
- User-provided API key: Not possible — Dropbox uses OAuth, no per-user API keys exist
- Webhook-based approach: Webhooks are notification-only, cannot upload files

**Implementation approach**:
1. Frontend initiates OAuth by calling a TanStack Start server function that generates the authorization URL with PKCE
2. User is redirected to Dropbox consent screen
3. Dropbox redirects back to a callback route in the app
4. A server function exchanges the auth code for tokens, encrypts the refresh token, and stores it at workspace level
5. Access tokens are short-lived; refresh token stored encrypted in Firestore

## R2: Token Encryption Strategy

**Decision**: Use Node.js `crypto` module with AES-256-GCM for encrypting Dropbox refresh tokens at rest. Encryption key stored as a Cloud Functions environment secret.

**Rationale**:
- AES-256-GCM provides authenticated encryption (confidentiality + integrity)
- Node.js `crypto` module is built-in — no additional dependencies
- Secret stored via Firebase Functions `defineSecret()` for automatic injection
- Avoids KMS API calls on every token use (lower latency, no additional cost)

**Alternatives considered**:
- Google Cloud KMS: More secure key management but adds latency + cost per API call. Overkill for v1 with a single integration
- Storing tokens in Secret Manager directly: Doesn't scale — one secret per workspace is impractical
- No encryption (plaintext in Firestore): Unacceptable security risk

**Key format**:
- Environment secret: `DROPBOX_TOKEN_ENCRYPTION_KEY` (32-byte hex string)
- Stored value: `{iv}:{authTag}:{ciphertext}` (base64-encoded components)

## R3: Export Dispatch Architecture

**Decision**: After `transformPipelineJob` completes successfully, enqueue a `dispatchExports` Cloud Task. The dispatcher reads live project config and fans out to per-integration worker tasks (starting with `dropboxExportWorker`).

**Rationale**:
- Failure isolation: export failures don't affect the guest experience or pipeline result
- Single responsibility: pipeline produces artifacts, dispatcher routes them
- Live config check at dispatch time: if Dropbox was disconnected between job creation and completion, export is correctly skipped
- Fan-out pattern: adding future integrations = adding one worker + one condition in dispatcher

**Alternatives considered**:
- Inline export in transform pipeline: Couples export failures to guest experience; violates failure isolation
- Firestore trigger on job completion: Less explicit, harder to test, and adds Firestore trigger latency
- Direct export without dispatcher: Works for one integration but doesn't scale; lacks the single routing point

**Hook point**: End of `finalizeJobSuccess()` in `transformPipelineJob.ts` (after line 203)

## R4: OAuth Callback Route

**Decision**: Use a dedicated TanStack Start route `/workspace/$workspaceSlug/integrations/dropbox/callback` as the OAuth redirect URI, handled by a server function.

**Rationale**:
- TanStack Start server functions can run server-side code in route loaders (beforeLoad)
- The callback needs to exchange the auth code for tokens server-side (requires secrets)
- After token exchange, redirect back to the Project Editor Connect tab
- Route params provide workspace context needed to store the connection

**Alternatives considered**:
- Firebase Cloud Function HTTP endpoint: Works but adds a separate domain/CORS concern; TanStack Start server functions are simpler
- Client-side token exchange: Insecure — would expose app secret to browser

## R5: Workspace Role Model for Permissions

**Decision**: Use the existing `isAdmin()` check for connect/disconnect permissions. All admin users can connect/disconnect Dropbox. All admin users can toggle project export (since the current system has admin-only project access).

**Rationale**:
- The current codebase has a two-tier auth model: admin vs. non-admin (no granular roles like Owner/Admin/Editor)
- Firestore security rules enforce `isAdmin()` for all workspace and project writes
- The spec mentions "Workspace Owner/Admin" and "Project Editor+" but these roles don't exist yet
- For v1, admin = can do everything. Role-based permissions can be added when the role system is built

**Alternatives considered**:
- Build a full role system first: Scope creep — the Dropbox feature doesn't need it
- Custom claims per workspace: Complex, requires Firebase Admin SDK changes across the stack

## R6: File Upload to Dropbox

**Decision**: Use the Dropbox `/files/upload` API endpoint (simple upload, max 150MB) for v1.

**Rationale**:
- v1 exports only images (a few MB each) — well within the 150MB limit
- Simple single-request upload: download from Firebase Storage → upload to Dropbox
- No chunked upload complexity needed
- Deterministic file paths ensure idempotent uploads (overwrites on retry)

**Alternatives considered**:
- Chunked upload sessions: Unnecessary complexity for image files; needed for videos >150MB (future)
- Streaming upload: Dropbox API requires content-length; not suitable for streaming

## R7: Connect Tab UI Architecture

**Decision**: Build the Connect tab as a card-based layout within the existing `domains/project/connect/` domain module. Each integration is a self-contained card component showing connection state and controls.

**Rationale**:
- Follows the existing domain structure pattern (containers/, components/, hooks/)
- The Connect tab is currently a WipPlaceholder — ready to be replaced
- Card-based layout matches the DistributePage pattern (centered, max-w-md, space-y-6)
- Each integration card manages its own state machine (disconnected → connecting → connected → error)

**Architecture**:
```
domains/project/connect/
├── components/
│   ├── DropboxCard.tsx           # Integration card with state-based rendering
│   └── index.ts
├── containers/
│   ├── ConnectPage.tsx           # Page container (replaces WipPlaceholder)
│   └── index.ts
├── hooks/
│   ├── useDropboxConnection.ts   # Workspace Dropbox connection state
│   ├── useDropboxExport.ts       # Project export toggle
│   └── index.ts
├── server/
│   ├── functions.ts              # Server functions for OAuth
│   └── index.ts
└── index.ts
```
