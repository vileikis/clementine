# Epic E9: Transform Pipeline (TBD)

> **Epic Series:** Experience System
> **Dependencies:** E5 (Session & Runtime), E7 (Guest Execution)
> **Status:** Future - Scope to be defined

---

## 1. Goal

Enable AI-powered image/video transformation within experiences.

**This epic will deliver:**

- Transform step configuration
- Cloud Function for transform processing
- Async job tracking
- Result handling and display
- Integration with session and runtime

**Current State:**

- Transform step exists as placeholder ("Coming soon")
- Step is selectable in freeform profile
- Run mode shows "Continue" button (no processing)

---

## 2. High-Level Concept

### 2.1 Transform Flow

```
Guest captures photo
        ↓
Transform step begins
        ↓
Upload to Cloud Function
        ↓
AI processing (external API)
        ↓
Result saved to Storage
        ↓
Session updated with resultAssetId
        ↓
Runtime advances to next step
```

### 2.2 Processing Types

Potential transform types (TBD):
- Style transfer
- Background replacement
- Face swap
- AI enhancement
- Custom prompts

---

## 3. Technical Considerations

### 3.1 Cloud Functions

Transform processing runs server-side:
- Firebase Cloud Functions v2
- Triggered by session update or HTTP
- Calls external AI APIs
- Handles timeout and retries

### 3.2 Job Tracking

Track transform job status:

```typescript
{
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number  // 0-100
  resultUrl: string | null
  error: string | null
}
```

### 3.3 Runtime Integration

Runtime waits for transform completion:
- Subscribe to job status
- Show progress indicator
- Auto-advance on completion
- Handle errors gracefully

---

## 4. Placeholder Implementation (Current)

### 4.1 Edit Mode

Shows:
- "AI Processing" title
- "Coming soon" badge
- Placeholder graphic

### 4.2 Run Mode

Shows:
- Processing message
- "Continue" button (skips processing)
- No actual AI integration

---

## 5. Future Scope (To Be Defined)

### Questions to Answer

1. Which AI APIs to integrate?
2. Cost model and rate limiting?
3. Processing time expectations?
4. Fallback for failed transforms?
5. Preview/variation options?

### Dependencies

- Cloud Functions infrastructure
- AI API credentials and budget
- Storage quota for results
- Error handling strategy

---

## 6. Out of Scope for MVP

This epic is explicitly deferred. The transform step exists as a placeholder to:

- Allow freeform profile selection
- Show intent in the UI
- Enable future expansion without schema changes

Full implementation will be scoped separately based on:
- Business requirements
- AI provider selection
- Cost analysis
- User research

---

## 7. Acceptance Criteria (Placeholder)

Current placeholder must:

- [ ] Be selectable in freeform profile experiences
- [ ] Show "Coming soon" in edit mode
- [ ] Allow proceeding in run mode
- [ ] Not block experience completion

Future implementation criteria TBD.
