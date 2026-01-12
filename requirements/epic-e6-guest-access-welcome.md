# Epic E6: Guest Access & Welcome

> **Epic Series:** Experience System
> **Dependencies:** E3 (Event-Experience Integration)
> **Enables:** E7 (Guest Experience Execution)

---

## 1. Goal

Enable guests to access events via shareable links and see the welcome screen with available experiences.

**This epic delivers:**

- Guest join route (`/join/:projectId`)
- Access validation (project exists, active event exists)
- Guest record creation
- Welcome screen (run mode) with experience picker
- Navigation to experience route with session creation

**This epic does NOT include:**

- Experience execution/runtime (E7)
- Share screen (E8)
- Pregate/preshare flow (E7)

---

## 2. Guest Join Flow

### 2.1 Route: `/join/:projectId`

```
Guest visits /join/abc123
        ↓
┌─────────────────────────────────────┐
│ 1. Validate project exists          │
│ 2. Get activeEventId from project   │
│ 3. Validate event exists & published│
│ 4. Load publishedConfig             │
│ 5. Create/get guest record          │
│ 6. Render welcome screen            │
└─────────────────────────────────────┘
```

### 2.2 Access Validation

| Check | Failure Response |
|-------|------------------|
| Project not found | 404 page |
| No activeEventId | "Coming Soon" page |
| Event not found | 404 page |
| Event not published | "Coming Soon" page |

### 2.3 Guest Record

Created on first visit, stored for session association.

**Path:** `/projects/{projectId}/guests/{guestId}`

```typescript
{
  id: string
  projectId: string
  authUid: string        // Anonymous auth UID
  createdAt: number
}
```

---

## 3. Welcome Screen (Run Mode)

### 3.1 Component

```typescript
interface WelcomeScreenProps {
  mode: 'edit' | 'run'
  config: WelcomeConfig
  experiences: ExperienceCard[]
  layout: 'list' | 'grid'
  onSelectExperience?: (experienceId: string) => void
}
```

### 3.2 Run Mode Behavior

- **Interactive**: Clicking experience triggers navigation
- **Themed**: Uses event theme (colors, fonts)
- **Dynamic**: Shows only enabled experiences

### 3.3 Layout

```
┌─────────────────────────────────────┐
│         [Hero Media]                │
├─────────────────────────────────────┤
│                                     │
│   Welcome to Our Event!             │
│   Choose an experience below        │
│                                     │
│   ┌─────────┐  ┌─────────┐         │
│   │ [thumb] │  │ [thumb] │         │
│   │ Exp 1   │  │ Exp 2   │         │
│   └─────────┘  └─────────┘         │
│                                     │
│   ┌─────────┐                      │
│   │ [thumb] │                      │
│   │ Exp 3   │                      │
│   └─────────┘                      │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Experience Selection

### 4.1 Selection Flow

```
Guest clicks experience card
        ↓
Navigate to /join/:projectId/experience/:experienceId
        ↓
Check URL for sessionId param
        ↓
├─ No sessionId → Create new session
└─ Has sessionId → Load existing session
        ↓
Render experience route (placeholder in E6)
```

### 4.2 Session Creation

When guest selects experience:

```typescript
const session = await createSession({
  workspaceId,
  experienceId,
  mode: 'guest',
  // Guest mode uses published config
})

navigate(`/join/${projectId}/experience/${experienceId}?session=${session.id}`)
```

### 4.3 Experience Route (Placeholder)

Route exists but shows placeholder:
- "Experience loading..." message
- Session ID displayed (for debugging)
- Full implementation in E7

---

## 5. Data Loading

### 5.1 Project Data

```typescript
// Read from /projects/{projectId}
const project = {
  id: string
  workspaceId: string
  activeEventId: string | null
  // ...
}
```

### 5.2 Event Data

```typescript
// Read from /projects/{projectId}/events/{eventId}
const event = {
  publishedConfig: {
    welcome: WelcomeConfig
    theme: ThemeConfig
    experiences: {
      main: Array<{ experienceId: string; enabled: boolean }>
      // pregate, preshare handled in E7
    }
  }
}
```

### 5.3 Experience Data

```typescript
// For each enabled experience, read published data
// From /workspaces/{workspaceId}/experiences/{experienceId}
const experience = {
  id: string
  name: string
  media: { url: string } | null
  published: { steps: Step[] }
}
```

---

## 6. Error States

### 6.1 404 Page

Shown when project or event not found.

```
┌─────────────────────────────────────┐
│                                     │
│             404                     │
│                                     │
│   This page doesn't exist           │
│                                     │
└─────────────────────────────────────┘
```

### 6.2 Coming Soon Page

Shown when no active event or event not published.

```
┌─────────────────────────────────────┐
│                                     │
│        Coming Soon                  │
│                                     │
│   This experience isn't ready yet.  │
│   Check back soon!                  │
│                                     │
└─────────────────────────────────────┘
```

### 6.3 No Experiences

Shown when event has no enabled experiences.

```
┌─────────────────────────────────────┐
│                                     │
│   Welcome to Our Event!             │
│                                     │
│   No experiences available          │
│   Check back later                  │
│                                     │
└─────────────────────────────────────┘
```

---

## 7. Security

### 7.1 Guest Access Rules

Guests can read:
- `/projects/{projectId}` (project doc)
- `/projects/{projectId}/events/{eventId}` (published fields)
- `/workspaces/{workspaceId}/experiences/{experienceId}` (published field)

Guests can write:
- `/projects/{projectId}/guests/{guestId}` (own doc only)
- `/workspaces/{workspaceId}/sessions/{sessionId}` (own sessions)

### 7.2 Anonymous Auth

Guest accesses trigger anonymous authentication:
- Firebase anonymous auth
- UID stored in guest record
- Session associated with guest

---

## 8. Implementation Phases

### Phase 1: Route & Access Validation

Create join route with project/event validation and error pages.

### Phase 2: Guest Record

Implement anonymous auth and guest record creation.

### Phase 3: Data Loading

Load published event config and experience data for welcome screen.

### Phase 4: Welcome Screen (Run Mode)

Build welcome screen with theme, experience cards, and selection handler.

### Phase 5: Experience Route Shell

Create experience route with session creation and placeholder content.

---

## 9. Acceptance Criteria

### Must Have

- [ ] `/join/:projectId` route works
- [ ] 404 shown for invalid project
- [ ] "Coming Soon" shown for unpublished event
- [ ] Guest record created on first visit
- [ ] Welcome screen shows event title/description
- [ ] Welcome screen shows enabled experiences
- [ ] Experience cards show thumbnail and name
- [ ] Clicking experience navigates to experience route
- [ ] Session created when selecting experience
- [ ] Session ID in URL for experience route

### Nice to Have

- [ ] Loading skeleton during data fetch
- [ ] Smooth animations on experience selection
- [ ] Remember guest across sessions (localStorage)

---

## 10. Technical Notes

### Folder Structure

```
domains/guest/
├── containers/
│   ├── JoinPage.tsx
│   ├── WelcomeScreen.tsx
│   └── ExperiencePage.tsx      # Placeholder
├── components/
│   ├── GuestLayout.tsx
│   ├── ExperienceCard.tsx      # Run mode
│   ├── ErrorPage.tsx
│   └── ComingSoonPage.tsx
├── hooks/
│   ├── useGuestAccess.ts       # Validation logic
│   ├── useGuestRecord.ts
│   └── usePublishedEvent.ts
└── index.ts
```

### Routes

```
app/guest/
├── route.tsx                   # Guest layout
├── join/
│   └── $projectId.tsx          # Welcome screen
│   └── $projectId.experience/
│       └── $experienceId.tsx   # Experience (placeholder)
```

---

## 11. Out of Scope

| Item | Epic |
|------|------|
| Experience runtime execution | E7 |
| Pregate/preshare flow | E7 |
| Share screen | E8 |
| Transform processing | E9 |
