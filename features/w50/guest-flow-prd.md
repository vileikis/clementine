# Guest Flow PRD

**Status:** Draft
**Week:** W50 (December 2024)
**Goal:** Implement guest-facing flow that allows visitors to access events via share links, view available experiences, and start sessions.

---

## 1. Purpose

Enable guests to access branded event experiences through shareable project links. This feature provides:

1. **Share Link Access** — Guests visit `/join/[projectId]` to access an event
2. **Welcome Screen** — Displays event branding, content, and available experiences
3. **Anonymous Authentication** — Seamless guest identification without sign-up friction
4. **Session Management** — Track guest interactions for analytics and state persistence

---

## 2. User Stories

### US-1: Access Event via Share Link

**As a** guest
**I want to** visit a share link and see the event welcome screen
**So that** I can participate in the brand experience

**Acceptance Criteria:**
- Guest visits `/join/[projectId]`
- If project exists with an active event, welcome screen is displayed
- Guest sees loading state until authentication and data are ready

### US-2: View Welcome Screen

**As a** guest
**I want to** see event information and available experiences
**So that** I can choose which experience to start

**Acceptance Criteria:**
- Welcome screen displays hero media (if configured)
- Welcome screen displays title and description
- Enabled experiences are listed for selection
- Event theme/branding is applied throughout

### US-3: Start an Experience

**As a** guest
**I want to** tap on an experience to begin it
**So that** I can participate in the AI photobooth flow

**Acceptance Criteria:**
- Tapping an experience navigates to the experience screen
- A new session is created and associated with the guest
- Experience screen shows the active experience content
- Home button allows returning to welcome screen

### US-4: Resume Session on Refresh

**As a** guest
**I want to** keep my session when I refresh the page
**So that** I don't lose my progress

**Acceptance Criteria:**
- Refreshing the experience page does not create a new session
- Session persists as long as the same guest is authenticated
- If guest identity changes, a new session is created

---

## 3. Functional Requirements

### FR-1: Route Structure

| Route | Purpose |
|-------|---------|
| `/join/[projectId]` | Welcome screen for the project's active event |
| `/join/[projectId]/[experienceId]` | Active experience screen with session |

### FR-2: Empty States

The guest flow must handle these scenarios gracefully:

| Scenario | Display |
|----------|---------|
| Project does not exist | "404 — Not Found" |
| Project exists, no active event | "Event has not been launched yet" |
| Event exists, no enabled experiences | "Event is empty" |

### FR-3: Welcome Screen Content

The welcome screen displays:

1. **Hero Media** — Image or video at top (if configured)
2. **Title** — Welcome title (falls back to event name)
3. **Description** — Welcome description (if configured)
4. **Experiences List** — Enabled experiences in configured layout (list/grid)

### FR-4: Experience Screen

The experience screen displays:

1. **Home Icon** — Subtle icon in top-left corner to return to welcome screen
2. **Experience Content** — For MVP: experience name, guest ID, session ID (WIP placeholder)
3. **Home Button** — Button to return to welcome screen

### FR-5: Authentication Flow

1. When guest lands on welcome screen, authenticate anonymously
2. Guest sees loading state until authentication completes
3. Create guest record in project's guests collection (if not exists)
4. Guest record links to anonymous user for future analytics

### FR-6: Session Management

1. Session is created when guest activates (taps) an experience
2. Session is stored in project's sessions collection
3. Session references the guest ID
4. Session ID should be reflected in the URL (query param or similar)
5. On page refresh:
   - If session exists and guest ID matches → reuse session
   - If guest ID doesn't match → create new session

### FR-7: Loading States

Guest sees loading indicator until:
- Authentication is complete
- Project/event data is loaded
- Session is resolved (on experience screen)

---

## 4. Data Requirements

### Guest Record

Stored in `/projects/{projectId}/guests/{guestId}`:
- Reference to anonymous auth user
- Created timestamp
- Useful for analytics (visit counts, return guests)

### Session Record

Stored in `/projects/{projectId}/sessions/{sessionId}`:
- Reference to guest ID
- Reference to experience ID
- Created timestamp
- Session state (for future use)

---

## 5. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Guest refreshes welcome screen | Re-authenticate if needed, show welcome screen |
| Guest refreshes experience screen | Reuse existing session if guest matches |
| Guest clears cookies, returns | New anonymous auth, new guest record, new session |
| Multiple experiences available | Guest can return home and start different experience |
| Experience disabled after guest starts | Handle gracefully (TBD - show error or redirect) |

---

## 6. Out of Scope

- Full experience engine implementation (this PRD covers navigation/session only)
- Step-by-step experience flow (placeholder UI for now)
- Session completion/results handling
- Social sharing of results
- Analytics dashboard for session data
- Guest profile or preferences
- Multi-device session sync

---

## 7. Success Criteria

- [ ] `/join/[projectId]` route accessible and displays welcome screen
- [ ] Empty states display correctly for all error scenarios
- [ ] Anonymous authentication happens seamlessly on first visit
- [ ] Guest record created in Firestore on first visit
- [ ] Tapping experience navigates to experience screen
- [ ] Session created and stored when experience activated
- [ ] Session ID reflected in URL for persistence
- [ ] Page refresh reuses session (same guest)
- [ ] Page refresh creates new session (different guest)
- [ ] Loading states shown during auth/data resolution
- [ ] Home navigation works from experience screen
- [ ] Event theme applied throughout guest flow

---

## 8. Dependencies

- **Theming Module** — For applying event theme to guest screens
- **Welcome Screen Config** — Event welcome content (title, description, media, layout)
- **Experiences** — List of enabled experiences from event
- **Firebase Auth** — Anonymous authentication
- **Firestore** — Guest and session storage

---

## 9. Related Documentation

- [Welcome Screen PRD](./welcome-screen-prd.md) — Welcome content configuration
- [Theming PRD](./theming-prd.md) — Theme system for guest UI
- [Preview Shell PRD](./preview-shell-prd.md) — Preview infrastructure (admin side)
- [Data Model v5](../scalable-arch/new-data-model-v5.md) — Project/Event data structure
