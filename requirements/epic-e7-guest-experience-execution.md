# Epic E7: Guest Experience Execution

> **Epic Series:** Experience System
> **Dependencies:** E5 (Session & Runtime), E6 (Guest Access)
> **Enables:** E8 (Share Screen Guest Integration)

---

## 1. Goal

Enable guests to execute experiences through the runtime engine, including pregate and preshare flows.

**This epic delivers:**

- Experience execution with runtime engine
- Step-by-step guest flow
- Pregate experience flow (before welcome)
- Preshare experience flow (after main experience)
- Session progress tracking
- Experience completion handling

**This epic does NOT include:**

- Share screen display (E8)
- Transform processing (E9)

---

## 2. Guest Experience Flow

### 2.1 Full Flow Diagram

```
Guest visits /join/:projectId
        ↓
┌─ Pregate configured? ─┐
│         YES           │ NO
│          ↓            │
│   Run pregate exp     │
│          ↓            │
└──────────┬────────────┘
           ↓
    Welcome Screen
    (select experience)
           ↓
    Run main experience
           ↓
┌─ Preshare configured? ┐
│         YES           │ NO
│          ↓            │
│   Run preshare exp    │
│          ↓            │
└──────────┬────────────┘
           ↓
    Navigate to share screen (E8)
```

### 2.2 Route Structure

| Route | Purpose |
|-------|---------|
| `/join/:projectId` | Welcome (or pregate first) |
| `/join/:projectId/pregate` | Pregate experience |
| `/join/:projectId/experience/:experienceId` | Main experience |
| `/join/:projectId/preshare` | Preshare experience |
| `/join/:projectId/share` | Share screen (E8) |

---

## 3. Experience Route

### 3.1 Route: `/join/:projectId/experience/:experienceId`

**URL Params:**
- `projectId` - Project identifier
- `experienceId` - Experience to run

**Query Params:**
- `session` - Session ID (created in E6)

### 3.2 Data Loading

```typescript
// 1. Load session from URL param
const session = useSession(sessionId)

// 2. Load experience (published version)
const experience = useWorkspaceExperience(workspaceId, experienceId)

// 3. Initialize runtime with published steps
const runtime = useExperienceRuntime(experience.published, session)
```

### 3.3 Experience Page Layout

```
┌─────────────────────────────────────┐
│                                     │
│     ┌─────────────────────┐        │
│     │                     │        │
│     │   [Step Renderer]   │        │
│     │     (run mode)      │        │
│     │                     │        │
│     │   [Continue]        │        │
│     │                     │        │
│     └─────────────────────┘        │
│                                     │
│     ● ○ ○ ○ ○  (progress dots)      │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Runtime Integration

### 4.1 Connecting Runtime to UI

```typescript
function ExperiencePage({ experienceId, sessionId }) {
  const session = useSession(sessionId)
  const experience = useWorkspaceExperience(workspaceId, experienceId)

  const runtime = useExperienceRuntime(experience.published, session, {
    onComplete: () => {
      // Check for preshare, then navigate to share
      handleExperienceComplete()
    }
  })

  return (
    <GuestLayout>
      <StepRenderer
        mode="run"
        step={runtime.currentStep}
        config={runtime.currentStep.config}
        answer={runtime.getCurrentAnswer()}
        onAnswer={(value) => runtime.setAnswer(runtime.currentStep.id, value)}
        onNext={() => runtime.next()}
        onBack={() => runtime.back()}
        canGoBack={runtime.canGoBack}
      />
      <ProgressDots
        current={runtime.currentStepIndex}
        total={experience.published.steps.length}
      />
    </GuestLayout>
  )
}
```

### 4.2 Session Updates

Runtime automatically updates session:
- `currentStepIndex` on navigation
- `answers` array on input
- `capturedMedia` on photo capture
- `status` on completion

---

## 5. Pregate Flow

### 5.1 When to Run

Pregate runs if:
- `publishedConfig.experiences.pregate` exists
- `pregate.enabled === true`

### 5.2 Pregate Route

**Route:** `/join/:projectId/pregate`

**Flow:**
1. Check if pregate configured
2. Create pregate session
3. Run pregate experience steps
4. On completion, navigate to welcome

### 5.3 Session Handling

Pregate has its own session, separate from main experience session.

```typescript
// Pregate session
{
  experienceId: 'pregate-exp-id',
  mode: 'guest',
  flowType: 'pregate',  // Optional: track flow type
}
```

---

## 6. Preshare Flow

### 6.1 When to Run

Preshare runs if:
- `publishedConfig.experiences.preshare` exists
- `preshare.enabled === true`
- Main experience completed

### 6.2 Preshare Route

**Route:** `/join/:projectId/preshare`

**Flow:**
1. Verify main experience completed
2. Create preshare session
3. Run preshare experience steps
4. On completion, navigate to share screen

### 6.3 Session Handling

Preshare has its own session, can access main session result.

```typescript
// Preshare session
{
  experienceId: 'preshare-exp-id',
  mode: 'guest',
  flowType: 'preshare',
  parentSessionId: 'main-session-id',  // Reference to main
}
```

---

## 7. Completion Handling

### 7.1 Experience Completion

When runtime signals completion:

```typescript
function handleExperienceComplete() {
  // Mark session complete
  await updateSession(sessionId, { status: 'completed', completedAt: Date.now() })

  // Check for preshare
  if (hasPreshare && !isPreshareComplete) {
    navigate(`/join/${projectId}/preshare?mainSession=${sessionId}`)
  } else {
    // Navigate to share screen
    navigate(`/join/${projectId}/share?session=${sessionId}`)
  }
}
```

### 7.2 Flow State Management

Track flow progress to handle navigation:

```typescript
interface FlowState {
  pregateComplete: boolean
  mainExperienceId: string | null
  mainSessionId: string | null
  mainComplete: boolean
  preshareComplete: boolean
}
```

Store in URL params or session storage for resilience.

---

## 8. Progress Indicators

### 8.1 Step Progress

Show current step position:
- Progress dots (● ○ ○ ○)
- Progress bar
- "Step X of Y" text

### 8.2 Flow Progress (Optional)

For multi-experience flows, show overall progress:
- Pregate → Welcome → Experience → Preshare → Share

---

## 9. Error Handling

### 9.1 Session Not Found

If session ID invalid or expired:
- Show error message
- Offer to start over
- Navigate back to welcome

### 9.2 Experience Not Found

If experience no longer published:
- Show error message
- Navigate back to welcome

### 9.3 Network Errors

Handle offline/connectivity issues:
- Show retry option
- Queue session updates for retry

---

## 10. Implementation Phases

### Phase 1: Experience Route

Build experience route with runtime integration and step rendering.

### Phase 2: Session Integration

Wire up session updates, progress tracking, and completion handling.

### Phase 3: Pregate Flow

Implement pregate detection, routing, and execution.

### Phase 4: Preshare Flow

Implement preshare detection, routing, and execution with main session reference.

### Phase 5: Progress & Polish

Add progress indicators, transitions, error handling.

---

## 11. Acceptance Criteria

### Must Have

- [ ] Guest can execute experience steps
- [ ] Steps collect and persist answers
- [ ] Photo capture works in guest flow
- [ ] Session progress updates in real-time
- [ ] Progress dots show current step
- [ ] Experience completion triggers navigation
- [ ] Pregate runs before welcome (if configured)
- [ ] Preshare runs after main (if configured)
- [ ] Navigation to share screen on completion

### Nice to Have

- [ ] Step transition animations
- [ ] Session recovery on page refresh
- [ ] Back navigation to previous steps
- [ ] Overall flow progress indicator

---

## 12. Technical Notes

### Folder Structure

```
domains/guest/
├── containers/
│   ├── ExperiencePage.tsx      # Main experience execution
│   ├── PregatePage.tsx
│   └── PresharePage.tsx
├── components/
│   ├── ProgressDots.tsx
│   ├── FlowProgress.tsx
│   └── StepContainer.tsx
├── hooks/
│   ├── useGuestFlow.ts         # Flow state management
│   └── useExperienceCompletion.ts
└── index.ts
```

### Routes

```
app/guest/
├── join/
│   └── $projectId/
│       ├── index.tsx           # Welcome (E6)
│       ├── pregate.tsx
│       ├── experience/
│       │   └── $experienceId.tsx
│       ├── preshare.tsx
│       └── share.tsx           # E8
```

---

## 13. Out of Scope

| Item | Epic |
|------|------|
| Share screen | E8 |
| Transform processing | E9 |
| Analytics events | Future |
| Deep linking to specific step | Future |
