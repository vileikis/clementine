# Epic E5: Session, Runtime & Capture

> **Epic Series:** Experience System
> **Dependencies:** E2 (Step System & Editor)
> **Enables:** E7 (Guest Experience Execution)

---

## 1. Goal

Enable experience execution through a runtime engine with session-based state management, including photo capture functionality.

**This epic delivers:**

- Session domain (create, subscribe, update)
- Runtime engine (step sequencing, state management)
- Step renderers (run mode) for all step types
- Photo capture step with camera integration
- Admin preview (test experience in editor)

**This epic does NOT include:**

- Guest routes and access (E6)
- Guest experience flow (E7)
- Transform pipeline (E9)
- Share screen (E8)

---

## 2. Session Domain

### 2.1 Session Document

**Path:** `/workspaces/{workspaceId}/sessions/{sessionId}`

```typescript
{
  id: string
  workspaceId: string
  experienceId: string

  mode: 'preview' | 'guest'

  // Progress
  currentStepIndex: number
  status: 'active' | 'completed' | 'abandoned'

  // Collected data
  answers: Array<{
    stepId: string
    stepType: string
    value: unknown
    answeredAt: number
  }>

  // Captured media
  capturedMedia: Array<{
    stepId: string
    mediaAssetId: string
    url: string
    capturedAt: number
  }>

  // Result (from transform or final capture)
  resultAssetId: string | null
  resultUrl: string | null

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
  setAnswer(stepId: string, value: unknown): void
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
  answer?: unknown
  onAnswer?: (value: unknown) => void
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
- Shows question with option checkboxes
- Validates min/max selections
- "Continue" enabled when valid

**InputShortTextRenderer (run mode)**
- Shows question with text input
- Validates max length
- "Continue" enabled when valid

**InputLongTextRenderer (run mode)**
- Shows question with textarea
- Validates max length
- "Continue" enabled when valid

**CapturePhotoRenderer (run mode)**
- Camera preview from `shared/camera`
- Countdown timer (if configured)
- Capture button
- Retake option
- "Continue" after capture

**TransformPipelineRenderer (run mode)**
- Shows "Processing..." message
- "Continue" button (placeholder until E9)
- No actual processing yet

---

## 5. Photo Capture Step

### 5.1 Integration with shared/camera

Leverage existing `shared/camera` module:
- Camera permissions handling
- Camera preview component
- Photo capture functionality
- Upload fallback

### 5.2 Capture Flow

```
Camera Preview → Countdown (optional) → Capture → Preview → Confirm/Retake
```

### 5.3 Storage Integration

On capture:
1. Upload to Firebase Storage via media asset system
2. Create MediaAsset record
3. Store reference in session.capturedMedia
4. Set as resultAssetId (for share screen)

### 5.4 Config Options

```typescript
interface CapturePhotoConfig {
  instructions: string | null
  countdown: {
    enabled: boolean
    seconds: number  // 3, 5, 10
  }
  // Future: overlay, filters
}
```

---

## 6. Admin Preview

### 6.1 Preview Flow

1. Admin clicks "Preview" in experience editor
2. Creates preview session (mode: 'preview')
3. Opens preview modal/fullscreen
4. Runs through steps using runtime
5. Can close at any time

### 6.2 Preview UI

```
┌─────────────────────────────────────┐
│ Preview Mode                    [×] │
├─────────────────────────────────────┤
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
│     Step 2 of 5                     │
│                                     │
└─────────────────────────────────────┘
```

### 6.3 Preview Session Behavior

- Uses draft config (not published)
- Excluded from analytics
- No guest record created
- Can be abandoned without cleanup

---

## 7. Security Rules

### 7.1 Session Rules

```javascript
match /workspaces/{workspaceId}/sessions/{sessionId} {
  // Admins can read all sessions
  allow read: if isAdmin();

  // Authenticated users can read own session
  allow read: if request.auth != null
    && resource.data.createdBy == request.auth.uid;

  // Authenticated users can create sessions
  allow create: if request.auth != null;

  // Only session owner can update
  allow update: if request.auth != null
    && resource.data.createdBy == request.auth.uid;

  // No deletes
  allow delete: if false;
}
```

---

## 8. Implementation Phases

### Phase 1: Session Domain

Create session schema, hooks (create, subscribe, update), and security rules.

### Phase 2: Runtime Engine

Build runtime engine with step sequencing, navigation, and state management hooks.

### Phase 3: Step Renderers (Run Mode)

Convert edit mode renderers to support run mode. Implement interactive behavior for all step types.

### Phase 4: Photo Capture Integration

Integrate shared/camera module with capture step. Implement storage upload flow.

### Phase 5: Admin Preview

Build preview modal in experience editor. Wire up session creation and runtime.

### Phase 6: Polish & Testing

Handle edge cases, loading states, error recovery, session cleanup.

---

## 9. Acceptance Criteria

### Must Have

- [ ] Session documents created and persisted
- [ ] Runtime engine sequences through steps correctly
- [ ] All step renderers work in run mode
- [ ] Input steps collect and persist answers
- [ ] Photo capture uses camera with countdown
- [ ] Captured photos upload to storage
- [ ] Admin preview runs experience from editor
- [ ] Preview uses draft config
- [ ] Back/forward navigation works correctly
- [ ] Session tracks progress and completion

### Nice to Have

- [ ] Session recovery on page refresh
- [ ] Photo retake with limit
- [ ] Camera flip (front/back)

---

## 10. Technical Notes

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
│   │       ├── CapturePhotoRenderer.tsx  # Updated with camera
│   │       └── ...
│   └── editor/
│       └── components/
│           └── PreviewModal.tsx
└── shared/
    └── camera/                           # Existing module
```

### Dependencies

- `shared/camera` - Camera capture functionality
- `shared/preview-shell` - Phone frame for preview
- `integrations/firebase/storage` - Media upload

---

## 11. Out of Scope

| Item | Epic |
|------|------|
| Guest routes | E6 |
| Guest experience flow | E7 |
| Transform processing | E9 |
| Share screen | E8 |
| Video/GIF capture | Future |
