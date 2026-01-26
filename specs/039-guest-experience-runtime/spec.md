# Feature Specification: Guest Experience Runtime

**Feature Branch**: `039-guest-experience-runtime`
**Created**: 2026-01-22
**Status**: Draft
**Input**: User description: "Enable guests to execute experiences through the runtime engine, including pregate and preshare flows"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Executes Main Experience (Priority: P1)

A guest visits a project link, sees the welcome screen, selects an experience, and completes all steps to generate their result.

**Why this priority**: This is the core guest journey - without main experience execution, there is no product value.

**Independent Test**: Can be fully tested by having a guest complete an experience from welcome to completion, verifying answers are captured and session status changes to "completed".

**Acceptance Scenarios**:

1. **Given** a guest on the welcome screen with multiple experiences, **When** they select an experience, **Then** they navigate to the experience execution route where a new session is created.
2. **Given** a guest on an experience step, **When** they provide a valid answer/input, **Then** the system captures the answer and enables navigation to the next step.
3. **Given** a guest on an experience step requiring media capture, **When** they capture or upload media, **Then** the media is stored and associated with the session.
4. **Given** a guest on the last step of an experience, **When** they complete the step and proceed, **Then** the experience is marked complete and the session status updates to "completed".
5. **Given** a guest mid-experience, **When** they refresh the page or return to the same URL with their session ID, **Then** they resume from their last position with previous answers preserved.

---

### User Story 2 - Guest Completes Pregate Before Main Experience (Priority: P2)

A guest selects an experience from the welcome screen and is presented with a pregate experience (e.g., consent, contact info, survey questions) before starting the main experience.

**Why this priority**: Pregate enables data collection before the main experience, which is critical for many marketing campaigns.

**Independent Test**: Can be fully tested by configuring a pregate experience, having a first-time guest select an experience, verifying they are routed to pregate, and upon completion are redirected to the main experience.

**Acceptance Scenarios**:

1. **Given** a project with `publishedConfig.experiences.pregate` enabled and a guest who has not completed that pregate experience, **When** the guest selects an experience from the welcome screen, **Then** they are redirected to the pregate experience route (with the selected experience ID preserved).
2. **Given** a guest completing the pregate experience, **When** they finish the last step, **Then** they are automatically navigated to the main experience they originally selected (using history replacement so back returns to welcome).
3. **Given** a guest who has previously completed the current pregate experience for this project, **When** they select an experience from the welcome screen, **Then** they skip pregate and go directly to the main experience.
4. **Given** a project without pregate configured or with pregate disabled, **When** a guest selects an experience, **Then** they go directly to the main experience.
5. **Given** an admin who changes the pregate experience to a different experience ID, **When** a returning guest selects an experience, **Then** they are shown the new pregate experience (previous completion of old pregate doesn't skip new pregate).

---

### User Story 3 - Guest Completes Preshare After Main Experience (Priority: P2)

A guest completes their main experience and is presented with a preshare experience (e.g., additional survey, feedback questions, promotional content) before reaching the share screen.

**Why this priority**: Preshare enables post-experience engagement and data collection while the guest is still engaged, increasing conversion and feedback quality.

**Independent Test**: Can be fully tested by configuring a preshare experience, having a guest complete the main experience, verifying they are routed to preshare, and upon completion navigate toward the share screen.

**Acceptance Scenarios**:

1. **Given** a project with `publishedConfig.experiences.preshare` enabled, **When** a guest completes their main experience, **Then** they are automatically navigated to the preshare experience (with main session ID preserved for linking, using history replacement).
2. **Given** a guest completing the preshare experience, **When** they finish the last step, **Then** they are navigated to the share screen (with main session ID for result display, using history replacement).
3. **Given** a guest who has previously completed the current preshare experience for this project, **When** they complete another main experience, **Then** they skip preshare and go directly to share.
4. **Given** a project without preshare configured or with preshare disabled, **When** a guest completes the main experience, **Then** they go directly to the share screen.

---

### User Story 4 - Session Progress Tracking and Linking (Priority: P3)

The system maintains accurate tracking of guest progress across pregate, main, and preshare experiences, with all sessions linked to the main session for analytics and journey reconstruction.

**Why this priority**: Accurate progress tracking and session linking is essential for user experience and analytics, but depends on the core experience execution flows being implemented first.

**Independent Test**: Can be tested by simulating a guest journey through all three experience types and verifying all sessions are linked via `mainSessionId` and the guest record accurately reflects completed experiences.

**Acceptance Scenarios**:

1. **Given** a guest with an active session, **When** they navigate away and return with the session ID in the URL, **Then** the system resumes their session from their last position.
2. **Given** a guest who completes pregate and proceeds to main, **When** the main session is created, **Then** the pregate session is updated to include the `mainSessionId` for linking.
3. **Given** a guest who completes the main experience, **When** they proceed to preshare, **Then** the preshare session is created with `mainSessionId` set.
4. **Given** a guest who completes any experience (pregate, main, or preshare), **When** the completion is recorded, **Then** the guest's `completedExperiences` array is updated with the experience ID, completion timestamp, and session ID.
5. **Given** all sessions in a journey, **When** querying by `mainSessionId`, **Then** all related sessions (pregate, preshare) can be found for analytics.

---

### User Story 5 - Back Navigation Behavior (Priority: P3)

The system handles browser back navigation appropriately to prevent guests from accidentally redoing completed phases or disrupting transform processing.

**Why this priority**: Proper navigation behavior is important for user experience but is secondary to core functionality.

**Independent Test**: Can be tested by completing each phase and pressing browser back, verifying the guest lands on the welcome screen rather than a completed phase.

**Acceptance Scenarios**:

1. **Given** a guest who completed pregate and is now on the main experience, **When** they press browser back, **Then** they return to the welcome screen (not pregate).
2. **Given** a guest who completed main and is now on preshare, **When** they press browser back, **Then** they return to the welcome screen (not main experience).
3. **Given** a guest who completed preshare and is now on share, **When** they press browser back, **Then** they return to the welcome screen (not preshare).
4. **Given** a guest within an experience (any phase), **When** they navigate between steps using in-app controls, **Then** step navigation works normally without affecting browser history.

---

### Edge Cases

- What happens when pregate has zero steps (misconfigured)? The system should skip pregate and proceed directly to the main experience.
- What happens when preshare has zero steps (misconfigured)? The system should skip preshare and proceed to share.
- What happens when the referenced pregate or preshare experience ID no longer exists or is deleted? The system should skip that experience phase and continue the flow, logging an error for debugging.
- What happens when a guest abandons mid-experience and returns hours/days later? Their session should still be retrievable if the session ID is in the URL and the session hasn't expired.
- What happens when network connectivity is lost during step completion? The local state should be preserved, and the system should sync when connectivity returns.
- What happens when a guest tries to access the main experience directly via URL without completing pregate first? The system should redirect them to pregate (preserving the intended experience ID).
- What happens when a guest tries to access preshare directly without a valid main session? The system should redirect them to the welcome screen.
- What happens when a guest completes the main experience but the transform job fails? The share screen should display an appropriate error state (out of scope, but flow should still navigate to share).
- What happens when an admin changes the pregate/preshare experience ID? Guests who completed the old experience should be required to complete the new one (tracked by experience ID, not by slot).

## Requirements *(mandatory)*

### Functional Requirements

**Step Execution:**
- **FR-001**: System MUST execute experience steps sequentially, rendering the appropriate UI for each step type.
- **FR-002**: System MUST capture and persist guest answers for each step to the session document.
- **FR-003**: System MUST capture and persist guest media (photos, videos) for capture steps to the session document.
- **FR-004**: System MUST validate step inputs before allowing navigation to the next step (using step registry validation).
- **FR-005**: System MUST support backward navigation to previous steps within an experience without losing captured answers.
- **FR-006**: System MUST mark the session as "completed" when the guest finishes the final step of an experience.

**Pregate Flow:**
- **FR-007**: System MUST check for pregate configuration when a guest selects an experience from the welcome screen.
- **FR-008**: System MUST redirect to pregate route (preserving selected experience ID) if pregate is enabled and the guest has not completed that specific pregate experience.
- **FR-009**: System MUST record experience completion in the guest's `completedExperiences` array (with experience ID, timestamp, and session ID).
- **FR-010**: System MUST navigate to the main experience (originally selected) upon pregate completion, using history replacement.
- **FR-011**: System MUST skip pregate if `publishedConfig.experiences.pregate` is null, `pregate.enabled` is false, or the guest has already completed that specific pregate experience ID.

**Preshare Flow:**
- **FR-012**: System MUST check for preshare configuration when a guest completes their main experience.
- **FR-013**: System MUST redirect to preshare route (preserving main session ID) if preshare is enabled and the guest has not completed that specific preshare experience.
- **FR-014**: System MUST record experience completion in the guest's `completedExperiences` array.
- **FR-015**: System MUST navigate to share screen (with main session ID) upon preshare completion, using history replacement.
- **FR-016**: System MUST skip preshare if `publishedConfig.experiences.preshare` is null, `preshare.enabled` is false, or the guest has already completed that specific preshare experience ID.
- **FR-017**: System MUST navigate directly to share screen (with main session ID) if preshare is not applicable, using history replacement.

**Session Management:**
- **FR-018**: Each route (pregate, main experience, preshare) MUST create its own session when the route mounts.
- **FR-019**: System MUST support session resumption when a guest returns with a valid session ID in the URL.
- **FR-020**: After main session is created, if pregate was completed (pregate session ID passed via URL), the system MUST update the pregate session with `mainSessionId` for linking.
- **FR-021**: Preshare session MUST be created with `mainSessionId` (from URL param) to link back to the main experience session.
- **FR-022**: System MUST handle gracefully when referenced pregate or preshare experience IDs do not exist (skip and continue flow).

**Navigation:**
- **FR-023**: System MUST use history replacement (not push) when navigating between phases (pregate → main, main → preshare, preshare → share) so browser back returns to welcome.
- **FR-024**: System MUST use standard navigation (push) when navigating from welcome to pregate or main, allowing back to return to welcome.

**Transform Integration (preparation for future):**
- **FR-025**: Upon main experience completion, if the experience has a transform configuration, the system MUST trigger the transform pipeline before navigating to the next phase.
- **FR-026**: The main session ID MUST be passed to the share screen route so the share screen can check transform job status and display results.

### Key Entities

- **Session**: Represents a single experience execution instance. Contains answers, captured media, progress state, status, and `mainSessionId` for linking non-main sessions to the main session. Each experience execution (pregate, main, preshare) gets its own session.
- **Guest**: Represents a visitor to the project. Contains `completedExperiences` array tracking which experiences the guest has completed, enabling skip logic for pregate/preshare.
- **Experience**: The experience definition containing steps to execute. Referenced by ID from publishedConfig.
- **PublishedConfig.experiences**: Configuration object containing references to main (array), pregate (optional), and preshare (optional) experiences.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guests can complete a main experience from welcome to share navigation in a single journey without errors.
- **SC-002**: Guests who are required to complete pregate are successfully routed through pregate before the main experience, with 100% routing accuracy.
- **SC-003**: Guests who complete a pregate experience are never shown that same pregate again on subsequent visits.
- **SC-004**: Guests who complete their main experience are successfully routed through preshare (when enabled) before share, with 100% routing accuracy.
- **SC-005**: Guests who complete a preshare experience are never shown that same preshare again.
- **SC-006**: Guests who refresh or return to an active session resume from their last position with all previous answers intact.
- **SC-007**: Sessions are marked "completed" within 2 seconds of the guest finishing the final step.
- **SC-008**: All sessions in a journey can be linked via `mainSessionId` for analytics (query all sessions where `mainSessionId` equals the main session ID).
- **SC-009**: Browser back from any post-welcome phase returns the guest to welcome screen, not to a completed phase.

## Scope

### In Scope

- Experience step execution and rendering
- Answer and media capture during step execution
- Step validation and navigation controls
- Pregate experience flow (detection, execution, completion tracking)
- Preshare experience flow (detection, execution, completion tracking)
- Session creation by each route (pregate, main, preshare)
- Session linking via `mainSessionId` field
- Session progress persistence and resumption
- Guest `completedExperiences` tracking
- Route structure with URL param passing
- Navigation between experience phases with history replacement
- Transform pipeline trigger at main experience completion (trigger only, not processing)

### Out of Scope

- Share screen display and processing state UI (E8)
- Transform processing implementation (E9)
- Real-time collaboration or multi-user sessions
- Offline-first functionality (basic persistence only)
- Analytics and reporting dashboards

## Assumptions

- The existing `ExperienceRuntime` component and `useRuntime()` hook provide a complete, production-ready API for step execution.
- The existing step registry handles validation for all step types.
- Firestore sync on forward navigation (existing behavior) is sufficient for session persistence.
- Each experience phase (pregate, main, preshare) will have its own independent session document.
- The share screen route exists as a navigation target even if not fully implemented.
- Guest schema can be extended with `completedExperiences` array for tracking.
- Session schema can be extended with `mainSessionId` field for linking.
- Sessions do not expire within a reasonable time window (24+ hours) to support guests who return later.
- Transform pipeline trigger (`startTransformPipeline`) is available as an HTTP endpoint.
- TanStack Router supports history replacement for navigation.

## Dependencies

- Existing `ExperienceRuntime` container and `useRuntime()` hook from `domains/experience/runtime/`
- Existing session creation and subscription hooks from `domains/session/`
- Existing guest context and initialization from `domains/guest/`
- Existing experience loading via `useExperiencesByIds()`
- PublishedConfig structure with `experiences.pregate` and `experiences.preshare` fields
- Transform pipeline endpoint `startTransformPipeline` (for trigger at main experience completion)

## Architecture Decisions

### Decision 1: Session Strategy

**Decision**: Use separate sessions for each experience phase (pregate, main, preshare).

**Rationale**:
1. **Schema Fit**: The existing session schema is designed for single-experience execution with one `experienceId`, one set of `answers[]`, and one `status`.
2. **Runtime Compatibility**: The `ExperienceRuntime` container works unchanged - it manages one experience per session.
3. **Transform Isolation**: Only the main session needs transform job tracking (`jobId`, `jobStatus`). Pregate and preshare are survey-type experiences without transforms.
4. **Querying**: Separate sessions make it easier to query and analyze completion data per experience type.

### Decision 2: Session Linking Strategy

**Decision**: All non-main sessions link to the main session via a single `mainSessionId` field.

**Rationale**:
1. **Simplicity**: One linking field instead of multiple (`pregateSessionId`, `mainSessionId`).
2. **Unified Query**: Find all journey sessions with one query: `where mainSessionId == "main-456"`.
3. **Clear Anchor**: Main session is the journey anchor - all other sessions point to it.

**Implementation**:
- Pregate session: Created without `mainSessionId`, updated after main session is created.
- Main session: The anchor (no `mainSessionId` needed - it IS the main session).
- Preshare session: Created with `mainSessionId` from URL param.

### Decision 3: Guest Completion Tracking

**Decision**: Track completed experiences in a `completedExperiences` array on the guest record, storing experience ID, timestamp, and session ID.

**Rationale**:
1. **Flexible**: Works for any experience, not just pregate/preshare slots.
2. **Experience-Specific**: If admin changes pregate to a different experience ID, guests will see the new content.
3. **Extensible**: Can be used for tracking main experience completions in the future.
4. **Analytics-Friendly**: Session ID included for journey reconstruction.

**Structure**:
```
completedExperiences: Array<{
  experienceId: string    // Which experience was completed
  completedAt: number     // Timestamp (Unix ms)
  sessionId: string       // Session ID for analytics linking
}>
```

**Check Logic**:
```
const pregateConfig = publishedConfig.experiences.pregate
const hasCompletedPregate = guest.completedExperiences.some(
  e => e.experienceId === pregateConfig?.experienceId
)
const needsPregate = pregateConfig?.enabled && !hasCompletedPregate
```

### Decision 4: Route Strategy

**Decision**: Use flat, project-level routes for each experience phase with URL params for context passing.

**Rationale**:
1. **Semantic Accuracy**: Pregate and preshare are project-level (one per project), not experience-specific.
2. **URL Reflects State**: Each route clearly indicates the current phase.
3. **Deep Linking**: Guests can resume via direct URL with session ID.
4. **Simpler Components**: Each route component knows its purpose.

**Why not nested routes** (`/experience/:id/pregate`):
- Pregate/preshare are project-level, not experience-level
- Nesting implies per-experience configuration which doesn't exist
- Would be semantically misleading

### Decision 5: Session Creation Timing

**Decision**: Each route creates its own session when it mounts (not before redirect).

**Rationale**:
1. **Consistency**: Follows the existing pattern in the codebase where routes own their session lifecycle.
2. **No Orphans**: Sessions are only created when guests actually reach a route.
3. **Accurate Timestamps**: Session `createdAt` reflects when guest actually started that phase.
4. **Encapsulation**: Session creation logic is encapsulated within each route.

### Decision 6: Pregate Timing

**Decision**: Pregate is triggered when guest selects an experience from the welcome screen (not on project entry).

**Rationale**:
1. **User Intent**: Guest has expressed intent to do an experience before being asked pregate questions.
2. **Experience Context**: Pregate route knows which experience was selected (via URL param) for proper redirect after completion.
3. **Flexibility**: Allows for potential future per-experience pregate configuration.

### Decision 7: Transform Trigger Timing

**Decision**: Transform pipeline is triggered at main experience completion, before navigating to preshare/share.

**Rationale**:
1. **Maximize Processing Time**: By triggering transform before preshare, the transform job can process while guest completes preshare questions.
2. **Fire and Forget**: The trigger is async - we don't wait for completion before navigating.
3. **Share Screen Handles Wait**: If transform isn't complete when guest reaches share, the share screen shows a processing state (out of scope but prepared for).

### Decision 8: Back Navigation Strategy

**Decision**: Use history replacement when navigating between completed phases so browser back always returns to welcome.

**Rationale**:
1. **Prevent Confusion**: Guests can't accidentally go back to a completed phase and redo it.
2. **Protect Transform**: Once main is complete and transform is triggered, we don't want guests going back.
3. **Clean Mental Model**: Each phase is a "unit" - completing it removes it from history.
4. **Safe Escape**: Back always goes to welcome, giving guests a clear exit.

**Implementation**:
```
Welcome → Pregate:    push     (back returns to welcome)
Pregate → Main:       replace  (back returns to welcome, pregate "gone")
Main → Preshare:      replace  (back returns to welcome)
Preshare → Share:     replace  (back returns to welcome)
```

**History Stack Example**:
```
After selecting experience:     [welcome, pregate]
After completing pregate:       [welcome, main]        (pregate replaced)
After completing main:          [welcome, preshare]    (main replaced)
After completing preshare:      [welcome, share]       (preshare replaced)

Back from any phase → welcome
```

### Decision 9: Processing State Handling

**Decision**: The share screen handles the "waiting for transform" state (out of scope for this feature).

**Rationale**:
1. **Natural UX**: Share screen is the final destination - showing processing → result is a natural progression.
2. **Single Subscription**: Share screen subscribes to the main session once and updates when `jobStatus` changes.
3. **No Redirect Gymnastics**: No need for temporary processing routes or redirecting back to main experience.

## Guest Journey Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Complete Guest Journey                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  /join/:projectId/ (Welcome Screen)                                     │
│       │                                                                 │
│       ▼                                                                 │
│  Guest selects experience "X"                                           │
│       │                                                                 │
│       ▼                                                                 │
│  Check: Is pregate needed?                                              │
│  (pregate.enabled && experienceId not in guest.completedExperiences)    │
│       │                                                                 │
│       ├── YES ──────────────────────────────────────────────┐           │
│       │                                                     ▼           │
│       │   Navigate to /pregate?experience=X (push)                      │
│       │        │                                                        │
│       │        ▼                                                        │
│       │   Pregate route creates pregate session                         │
│       │        │                                                        │
│       │        ▼                                                        │
│       │   Guest completes pregate steps                                 │
│       │        │                                                        │
│       │        ▼                                                        │
│       │   Add to guest.completedExperiences                             │
│       │        │                                                        │
│       │        ▼                                                        │
│       │   Navigate to /experience/X?pregate=session-123 (replace)       │
│       │                              │                                  │
│       └── NO ────────────────────────┘                                  │
│                                      │                                  │
│                                      ▼                                  │
│  /experience/:experienceId (Main Experience)                            │
│       │                                                                 │
│       ▼                                                                 │
│  Main route creates main session                                        │
│  IF ?pregate param exists:                                              │
│       Update pregate session with mainSessionId                         │
│       │                                                                 │
│       ▼                                                                 │
│  Guest completes main experience steps                                  │
│       │                                                                 │
│       ▼                                                                 │
│  Add to guest.completedExperiences                                      │
│       │                                                                 │
│       ▼                                                                 │
│  IF experience has transform config:                                    │
│       Trigger startTransformPipeline (async, don't wait)                │
│       │                                                                 │
│       ▼                                                                 │
│  Check: Is preshare needed?                                             │
│  (preshare.enabled && experienceId not in guest.completedExperiences)   │
│       │                                                                 │
│       ├── YES ──────────────────────────────────────────────┐           │
│       │                                                     ▼           │
│       │   Navigate to /preshare?session=main-456 (replace)              │
│       │        │                                                        │
│       │        ▼                                                        │
│       │   Preshare route creates preshare session                       │
│       │   (with mainSessionId from URL param)                           │
│       │        │                                                        │
│       │        ▼                                                        │
│       │   Guest completes preshare steps                                │
│       │        │                                                        │
│       │        ▼                                                        │
│       │   Add to guest.completedExperiences                             │
│       │        │                                                        │
│       │        ▼                                                        │
│       │   Navigate to /share?session=main-456 (replace)                 │
│       │                              │                                  │
│       └── NO ────────────────────────┘                                  │
│                                      │                                  │
│                                      ▼                                  │
│  /share?session=main-456 (Share Screen - out of scope)                  │
│       │                                                                 │
│       ▼                                                                 │
│  Share screen checks main session's jobStatus                           │
│  IF completed → show results                                            │
│  IF pending/processing → show processing state                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Route Structure

| Route | Purpose | Creates Session | URL Params | Navigation Type |
| ----- | ------- | --------------- | ---------- | --------------- |
| `/join/:projectId/` | Welcome screen | No | - | - |
| `/join/:projectId/pregate` | Pregate experience | Yes (pregate) | `?experience=xyz` | Push from welcome |
| `/join/:projectId/experience/:experienceId` | Main experience | Yes (main) | `?pregate=abc` (optional linking) | Replace from pregate, Push from welcome |
| `/join/:projectId/preshare` | Preshare experience | Yes (preshare) | `?session=xyz` (main session) | Replace from main |
| `/join/:projectId/share` | Share screen | No (reads main) | `?session=xyz` (main session) | Replace from main/preshare |

## Schema Additions

### Session Schema

The following field should be added to the session schema to support journey linking:

```
Session {
  // ... existing fields ...

  // For PREGATE and PRESHARE sessions: link to main session
  // Main sessions do not need this field (they ARE the main session)
  mainSessionId: string | null
}
```

**Linking Flow**:
1. Pregate session created → `mainSessionId: null`
2. Main session created → if pregate session exists, update pregate: `mainSessionId: main.id`
3. Preshare session created → `mainSessionId` from URL param

**Query**: `where mainSessionId == "main-456"` returns all related sessions (pregate, preshare).

### Guest Schema

The following field should be added to the guest schema for completion tracking:

```
Guest {
  // ... existing fields ...

  // Track completed experiences for skip logic and analytics
  completedExperiences: Array<{
    experienceId: string    // Which experience was completed
    completedAt: number     // Timestamp (Unix ms)
    sessionId: string       // Session ID for analytics linking
  }>
}
```

**Usage**:
- Check if pregate needed: `!completedExperiences.some(e => e.experienceId === pregate.experienceId)`
- Check if preshare needed: `!completedExperiences.some(e => e.experienceId === preshare.experienceId)`
- Analytics: Link session IDs to reconstruct journeys
