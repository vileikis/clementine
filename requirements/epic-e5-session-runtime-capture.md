# Epic E5: Session & Runtime Foundation

> **Epic Series:** Experience System
> **Dependencies:** E2 (Step System & Editor)
> **Enables:** E5.2 (Photo Capture), E7 (Guest Experience Execution)

---

## 1. Goal

Enable experience execution through a runtime engine with session-based state management.

**This epic delivers:**

- Session domain (create, subscribe, update)
- Runtime engine (step sequencing, state management)
- Step renderers (run mode) for input and info steps
- Admin preview (test experience in editor)
- Placeholder renderers for capture and transform steps

**This epic does NOT include:**

- Photo capture with camera integration (E5.2)
- Guest routes and access (E6)
- Guest experience flow (E7)
- Transform pipeline (E9)
- Share screen (E8)

---

## 2. Session Domain

### 2.1 Session Document

**Path:** `/projects/{projectId}/sessions/{sessionId}`

Sessions are scoped to projects since guests interact with events (which live under projects). This enables cleaner security rules and analytics queries at the project/event level.

```typescript
{
  id: string

  // Hierarchy references
  projectId: string       // parent collection
  eventId: string         // which event triggered this session
  experienceId: string    // which experience config was used
  workspaceId: string     // for cross-project queries if needed

  mode: 'preview' | 'guest'

  // Progress
  currentStepIndex: number
  status: 'active' | 'completed' | 'abandoned'

  // Collected data from input steps
  answers: Array<{
    stepId: string
    stepType: string
    value: string | number | boolean | string[]  // explicit types for analytics
    answeredAt: number
  }>

  // Captured media from capture steps
  capturedMedia: Array<{
    stepId: string
    assetId: string
    url: string
    createdAt: number
  }>

  // Final result (from transform or final capture)
  result: {
    stepId: string        // which step produced this
    assetId: string
    url: string
    createdAt: number
  } | null

  // Timestamps
  createdAt: number
  updatedAt: number
  completedAt: number | null
}
```

### 2.2 Session Modes

| Mode | Purpose | Analytics | Config Source |
|------|---------|-----------|---------------|
| `preview` | Admin testing | Excluded | draft |
| `guest` | Real users | Included | published |

### 2.3 Session Hooks

| Hook | Purpose |
|------|---------|
| `useCreateSession()` | Create new session |
| `useSession(sessionId)` | Subscribe to session |
| `useUpdateSession()` | Update session data |

---

## 3. Runtime Engine

### 3.1 Engine Interface

```typescript
interface ExperienceRuntime {
  // State
  currentStep: Step
  currentStepIndex: number
  canGoBack: boolean
  canGoNext: boolean
  isComplete: boolean

  // Navigation
  next(): void
  back(): void
  goToStep(index: number): void

  // Data collection
  setAnswer(stepId: string, value: string | number | boolean | string[]): void
  setMedia(stepId: string, media: CapturedMedia): void

  // Completion
  complete(): void
}
```

### 3.2 Runtime Hook

```typescript
function useExperienceRuntime(
  experience: Experience,
  session: Session,
  options: { onComplete?: () => void }
): ExperienceRuntime
```

### 3.3 Step Sequencing Rules

- Steps execute in order (index 0 → n)
- Back navigation allowed (except on first step)
- Forward navigation requires step completion
- Transform steps auto-advance on completion
- Completion fires when last step completes

---

## 4. Step Renderers (Run Mode)

### 4.1 Renderer Contract

```typescript
interface StepRendererProps {
  mode: 'edit' | 'run'
  step: Step
  config: StepConfig

  // Run mode only
  answer?: string | number | boolean | string[]
  onAnswer?: (value: string | number | boolean | string[]) => void
  onNext?: () => void
  onBack?: () => void
  canGoBack?: boolean
}
```

### 4.2 Run Mode Behavior

- **Interactive**: Form inputs respond to user
- **State-aware**: Shows current answer/selection
- **Navigation**: Next/Back buttons functional

### 4.3 Step Implementations

**InfoStepRenderer (run mode)**
- Displays title, description, media
- "Continue" button to proceed
- No data collection

**InputScaleRenderer (run mode)**
- Shows question and scale buttons
- User selects value
- "Continue" enabled after selection

**InputYesNoRenderer (run mode)**
- Shows question with Yes/No buttons
- Selection proceeds to next step

**InputMultiSelectRenderer (run mode)**
- Shows question with option buttons/checkboxes
- Single select: radio-style selection
- Multi select: checkbox-style, validates min/max
- "Continue" enabled when valid

**InputShortTextRenderer (run mode)**
- Shows question with text input
- Validates max length
- "Continue" enabled when valid

**InputLongTextRenderer (run mode)**
- Shows question with textarea
- Validates max length
- "Continue" enabled when valid

**CapturePhotoRenderer (run mode) - PLACEHOLDER**
- Shows placeholder message: "Camera capture"
- Displays step instructions if configured
- "Continue" button (skips capture for now)
- Full camera integration in E5.2

**TransformPipelineRenderer (run mode) - PLACEHOLDER**
- Shows "Processing..." message
- "Continue" button (placeholder until E9)
- No actual processing yet

---

## 5. Admin Preview

### 5.1 Preview Flow

1. Admin clicks "Preview" in experience editor
2. Creates preview session (mode: 'preview')
3. Opens preview modal/fullscreen
4. Runs through steps using runtime
5. Can close at any time

### 5.2 Preview UI

```
┌─────────────────────────────────────┐
│ Preview Mode                    [×] │
├─────────────────────────────────────┤
│                                     │
│     ┌─────────────────────────┐    │
│     │                         │    │
│     │   [Step Renderer]       │    │
│     │     (run mode)          │    │
│     │                         │    │
│     │   [Continue]            │    │
│     │                         │    │
│     └─────────────────────────┘    │
│                                     │
│     Step 2 of 5                     │
│                                     │
└─────────────────────────────────────┘
```

### 5.3 Preview Session Behavior

- Uses draft config (not published)
- Excluded from analytics
- No guest record created
- Can be abandoned without cleanup

---

## 6. Security Rules

### 6.1 Session Rules

```javascript
match /projects/{projectId}/sessions/{sessionId} {
  // Project admins can read all sessions
  allow read: if isProjectAdmin(projectId);

  // Authenticated users can read own session
  allow read: if request.auth != null
    && resource.data.createdBy == request.auth.uid;

  // Authenticated users can create sessions for accessible projects
  allow create: if request.auth != null
    && canAccessProject(projectId);

  // Only session owner can update
  allow update: if request.auth != null
    && resource.data.createdBy == request.auth.uid;

  // No deletes
  allow delete: if false;
}
```

---

## 7. Implementation Phases

### Phase 1: Session Domain

Create session schema, hooks (create, subscribe, update), and security rules.

### Phase 2: Runtime Engine

Build runtime engine with step sequencing, navigation, and state management hooks.

### Phase 3: Step Renderers (Run Mode)

Convert edit mode renderers to support run mode. Implement interactive behavior for input and info steps. Add placeholder renderers for capture and transform.

### Phase 4: Admin Preview

Build preview modal in experience editor. Wire up session creation and runtime.

### Phase 5: Polish & Testing

Handle edge cases, loading states, error recovery.

---

## 8. Acceptance Criteria

### Must Have

- [ ] Session documents created and persisted under projects
- [ ] Runtime engine sequences through steps correctly
- [ ] Info step renderer works in run mode
- [ ] All input step renderers work in run mode
- [ ] Input steps collect and persist answers (including arrays for multi-select)
- [ ] Capture step shows placeholder with Continue button
- [ ] Transform step shows placeholder with Continue button
- [ ] Admin preview runs experience from editor
- [ ] Preview uses draft config
- [ ] Back/forward navigation works correctly
- [ ] Session tracks progress and completion

### Nice to Have

- [ ] Session recovery on page refresh
- [ ] Progress indicator in preview

---

## 9. Technical Notes

### Folder Structure

```
domains/
├── session/
│   ├── schemas/
│   │   └── session.schema.ts
│   ├── hooks/
│   │   ├── useCreateSession.ts
│   │   ├── useSession.ts
│   │   └── useUpdateSession.ts
│   └── index.ts
├── experience/
│   ├── runtime/
│   │   ├── engine.ts
│   │   └── useExperienceRuntime.ts
│   ├── steps/
│   │   └── renderers/
│   │       ├── InfoStepRenderer.tsx      # Updated for run mode
│   │       ├── InputScaleRenderer.tsx    # Updated
│   │       ├── CapturePhotoRenderer.tsx  # Placeholder for now
│   │       └── ...
│   └── editor/
│       └── components/
│           └── PreviewModal.tsx
```

### Dependencies

- `shared/preview-shell` - Phone frame for preview

---

## 10. Out of Scope

| Item | Epic |
|------|------|
| Photo capture with camera | E5.2 |
| Guest routes | E6 |
| Guest experience flow | E7 |
| Transform processing | E9 |
| Share screen | E8 |
| Video/GIF capture | Future |
