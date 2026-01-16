# Research: Session & Runtime Foundation

**Feature**: 030-session-runtime-capture
**Date**: 2026-01-15

## Research Summary

This document captures technical decisions and research findings for the Session & Runtime Foundation feature.

---

## 1. Session Document Structure

### Decision
Use the existing session schema at `/src/domains/session/shared/schemas/session.schema.ts` which already defines the complete session structure.

### Rationale
- Session schema is already implemented and validated with Zod
- Structure matches the functional requirements in spec.md
- Includes all required fields: `id`, `projectId`, `eventId`, `experienceId`, `mode`, `status`, `currentStepIndex`, `inputs`, `outputs`, timestamps

### Alternatives Considered
- **New schema**: Rejected - existing schema is comprehensive and aligned with spec
- **Simplified schema**: Rejected - current schema supports future extensibility (guest mode, transform jobs)

### Key Schema Fields (from existing implementation)
```typescript
{
  id: string
  projectId: string
  eventId: string
  experienceId: string
  mode: 'preview' | 'guest'
  configSource: 'draft' | 'published'
  status: 'active' | 'completed' | 'abandoned' | 'error'
  currentStepIndex: number
  inputs: Record<string, unknown>      // Step answers
  outputs: Record<string, MediaReference>  // Captured media
  activeJobId: string | null
  resultAssetId: string | null
  createdAt: number
  updatedAt: number
  completedAt: number | null
}
```

---

## 2. Session Firestore Path

### Decision
Store sessions at `/projects/{projectId}/sessions/{sessionId}` as specified in FR-002.

### Rationale
- Sessions relate to project-level activities (events live under projects)
- Enables clean security rules scoped to project admins
- Supports analytics queries at the project/event level
- Aligns with existing data hierarchy patterns in the codebase

### Alternatives Considered
- **`/workspaces/{workspaceId}/sessions/{sessionId}`**: Rejected - sessions belong to specific events which are under projects, not directly under workspaces
- **`/events/{eventId}/sessions/{sessionId}`**: Rejected - events already live under projects, would create deeply nested path

---

## 3. Firestore Hook Patterns

### Decision
Follow the established mutation hook pattern using TanStack Query with `runTransaction()` and Sentry error tracking.

### Rationale
- Consistent with existing hooks (e.g., `useCreateExperience`, `useUpdateDraftSteps`)
- Provides optimistic updates and cache invalidation
- Error tracking via Sentry for observability
- Transaction support for atomic operations

### Pattern Reference
```typescript
// From useCreateExperience.ts
export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation<CreateSessionResult, Error, CreateSessionInput>({
    mutationFn: async (input) => {
      const validated = createSessionInputSchema.parse(input)
      return await runTransaction(firestore, async (transaction) => {
        const ref = doc(collection(firestore, `projects/${input.projectId}/sessions`))
        transaction.set(ref, { ...validated, id: ref.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        return { sessionId: ref.id }
      })
    },
    onSuccess: ({ sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() })
    },
    onError: (error) => {
      Sentry.captureException(error, { tags: { domain: 'session', action: 'create' } })
    }
  })
}
```

---

## 4. Real-Time Session Subscription

### Decision
Use Firestore `onSnapshot` for real-time session updates, following the client-first architecture (Constitution Principle VI).

### Rationale
- Enables immediate UI updates when session state changes
- Supports future multi-device sync scenarios
- Aligns with existing real-time patterns in the codebase
- Required for tracking async operations (future transform jobs)

### Pattern Reference
```typescript
export function useSubscribeSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const unsubscribe = onSnapshot(
      doc(firestore, `projects/${projectId}/sessions/${sessionId}`),
      (snapshot) => setSession(snapshot.data() as Session)
    )

    return unsubscribe
  }, [sessionId])

  return session
}
```

---

## 5. Runtime Engine Architecture

### Decision
Implement the runtime engine as a React hook (`useExperienceRuntime`) that encapsulates step sequencing logic and session synchronization.

### Rationale
- Hook pattern aligns with existing codebase conventions
- Encapsulates complex state machine logic
- Provides clean interface for renderers (next, back, setInput, etc.)
- Enables easy testing of sequencing rules

### Interface (from existing runtime.types.ts)
```typescript
interface RuntimeEngine {
  // State
  readonly currentStep: Step | null
  readonly currentStepIndex: number
  readonly totalSteps: number
  readonly canProceed: boolean
  readonly canGoBack: boolean
  readonly isComplete: boolean

  // Navigation
  next: () => Promise<void>
  back: () => void
  goToStep: (index: number) => void

  // Data mutation
  setInput: (stepId: string, input: unknown) => void
  setMedia: (stepId: string, mediaRef: MediaReference) => void

  // State access
  getInput: (stepId: string) => unknown | undefined
}
```

### Alternatives Considered
- **Zustand store**: Rejected - hook provides cleaner API and session sync is already handled by Firestore
- **State machine library (XState)**: Rejected - adds complexity without clear benefit for linear step flow

---

## 6. Step Renderer Run Mode

### Decision
Extend existing step renderers to support `mode: 'run'` via the existing `StepRendererProps` interface.

### Rationale
- Existing renderers already use `mode: 'edit' | 'run'` discriminated prop
- Reuses edit mode UI components with modified behavior
- `StepLayout` component provides consistent navigation (Continue/Back buttons)
- `onSubmit` callback signals step completion

### Pattern Reference (from existing InfoStepRenderer.tsx)
```typescript
export function InfoStepRenderer({ step, mode, onSubmit }: StepRendererProps) {
  const config = step.config as InfoStepConfig

  if (mode === 'edit') {
    return <EditModeDisplay config={config} />
  }

  // Run mode
  return (
    <StepLayout onSubmit={onSubmit}>
      <div className="space-y-4">
        <h2>{config.title}</h2>
        <p>{config.description}</p>
        {config.media && <MediaDisplay media={config.media} />}
      </div>
    </StepLayout>
  )
}
```

---

## 7. Preview Modal Integration

### Decision
Add a "Preview" button to the experience editor that opens a modal containing the step runtime using the existing `PreviewShell` component.

### Rationale
- PreviewShell already provides device frame, viewport switching, and fullscreen
- Modal approach keeps admin in editor context
- Uses draft configuration (not published) for immediate testing
- Creates session with `mode: 'preview'` for analytics exclusion

### Integration Point
- File: `/src/domains/experience/designer/containers/ExperienceDesignerPage.tsx`
- Add Preview button to header actions
- New component: `PreviewModal.tsx` wrapping PreviewShell + runtime

### Alternatives Considered
- **Full-screen route**: Rejected - disrupts editor workflow
- **Inline preview pane**: Rejected - already exists for single-step view; full runtime needs dedicated space

---

## 8. Input Validation in Run Mode

### Decision
Validate user inputs against step configuration (e.g., maxLength, min/max selection) before enabling the Continue button.

### Rationale
- Prevents invalid data from being stored in session
- Provides immediate user feedback
- Step config already defines validation rules (Zod schemas)
- `canProceed` state derived from validation result

### Validation Rules by Step Type
| Step Type | Validation |
|-----------|------------|
| `input.scale` | Value within configured min/max range |
| `input.yesNo` | Boolean value selected |
| `input.multiSelect` | Selection count within min/max |
| `input.shortText` | Length <= maxLength |
| `input.longText` | Length <= maxLength |
| `capture.photo` | Placeholder - always valid |
| `transform.pipeline` | Placeholder - always valid |

---

## 9. Security Rules

### Decision
Implement Firestore security rules as specified in FR-036 through FR-040.

### Rationale
- Client-first architecture requires security at the database level
- Rules enforce access control without server code
- Supports both admin and user-level access patterns

### Rules (from spec)
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

## 10. Edge Case Handling

### Decision
Handle edge cases gracefully with the following approaches:

| Edge Case | Handling |
|-----------|----------|
| Zero steps | Runtime marks as complete immediately, shows "empty experience" message |
| Network errors | Retry session updates, show toast on persistent failure |
| Invalid input types | Zod validation rejects, UI prevents submission |
| Browser close | Preview session abandoned (no cleanup needed) |
| Missing step config | Validation error displayed in preview mode |

### Rationale
- Preview mode is admin-only, so graceful degradation is acceptable
- Session abandonment is expected behavior (no business impact)
- Validation errors provide actionable feedback

---

## Unresolved Items

None. All technical decisions are resolved and aligned with existing patterns.

---

## References

- Session schema: `/src/domains/session/shared/schemas/session.schema.ts`
- Runtime types: `/src/domains/experience/shared/types/runtime.types.ts`
- Hook patterns: `/src/domains/experience/shared/hooks/useCreateExperience.ts`
- PreviewShell: `/src/shared/preview-shell/components/PreviewShell.tsx`
- StepLayout: `/src/domains/experience/steps/renderers/StepLayout.tsx`
- Constitution: `/.specify/memory/constitution.md`
