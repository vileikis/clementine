# PRD 1: Experience Management & Library

**Focus:** The "Container." Managing the relationship between Events and Company Experiences.
**Scope:** Viewing the list, creating the object, linking/unlinking, and duplication.
**Out of Scope:** Editing the internal settings (Prompt, Model, Inputs) or Testing.

---

## 1. Executive Summary

This feature establishes the **Company-Level Experience Library**. Within the Event Design Studio, users need a "Database View" to manage which experiences are attached to their event. This phase implements the list view, the "Add" logic, and the data relationship, treating the Experience details as a black box for now.

---

## 2. Data Architecture

> **Reference:** See [data-model-v4.md](../data-model-v4.md) § 2.2 for the full Experience interface definition.

### 2.1 Flat Collection Design

Experiences live in a **flat, top-level collection** named `/experiences`. This is the standard Firestore pattern and provides:

- **Simpler Queries:** Easily query `experiences.where('companyId', '==', '123')` without complex Collection Group queries.
- **Direct Access:** Fetch an experience directly by ID (`db.collection('experiences').doc('id')`) without needing to know which company it belongs to first.
- **Flexibility:** Enables future "Global/System" templates that don't belong to any specific company.

### 2.2 Collection Structure

#### Collection: `/events/{eventId}`

Contains the specific event logic. Holds an array of references to the experiences.

```typescript
// events/{eventId}
{
  id: "evt_123",
  companyId: "comp_abc",
  name: "Summer Festival",
  // ... other event fields from data-model-v4.md

  // The Linkage: Array of Experience IDs attached to this event
  experienceIds: ["exp_001", "exp_002"]
}
```

#### Collection: `/experiences/{experienceId}` (Top Level)

The source of truth for the configuration. Secured by `companyId` (so Company A can't see Company B's experiences).

```typescript
// experiences/{experienceId}
interface Experience {
  id: string;
  companyId: string;        // Owner company (for security/filtering)
  name: string;             // Internal name (e.g., "Cyberpunk Avatar")
  status: "draft" | "active";

  // === PREVIEW ASSETS ===
  // Used for the list view and selection screens
  posterUrl?: string;        // Static thumbnail for list display
  previewMediaUrl?: string;  // Rich media (video/GIF) for hover preview

  // === AI/CAPTURE CONFIGURATION ===
  // (Full spec in data-model-v4.md § 2.2)
  type: "photo" | "video" | "gif";
  inputFields: FieldConfig[];
  captureConfig: { /* ... */ };
  aiConfig: { /* ... */ };

  createdAt: number;
  updatedAt: number;
}
```

### 2.3 Preview Assets (posterUrl vs previewMediaUrl)

Two separate fields serve different UX purposes:

| Field | Purpose | Usage |
|-------|---------|-------|
| `posterUrl` | Static thumbnail image | Default display in lists and grids |
| `previewMediaUrl` | Rich media (video/GIF) | Plays on hover interaction |

**Why both?**

- **Performance:** Don't load 20 videos/GIFs instantly when opening the list. Load static images first.
- **UX "Hover to Play":** Standard pattern (Canva, TikTok filters, etc.):
  - **Default:** Show static image (`posterUrl`)
  - **Hover:** Play the rich media (`previewMediaUrl`)
- **Accuracy:** If the experience is "Slow Motion Video," a static icon doesn't sell it—the preview does.

### 2.4 Storage Destinations

Uses existing storage infrastructure from `@/lib/storage/actions.ts`:

| Asset | Storage Destination | Path Pattern |
|-------|-------------------|--------------|
| `posterUrl` | `experience-preview` | `images/experience-preview/{uuid}.{ext}` |
| `previewMediaUrl` | `experience-preview` | `images/experience-preview/{uuid}.{ext}` |
| Camera overlay | `experience-overlay` | `images/experience-overlay/{uuid}.{ext}` |
| AI reference | `ai-reference` | `images/ai-reference/{uuid}.{ext}` |

---

## 3. Functional Requirements

### 3.1 The Experience List (Design Tab)

**Location:** Event Studio > Design Tab

**Fetching Logic:**
1. Read `event.experienceIds` array from the Event document
2. Fetch those specific docs from the `/experiences` collection
3. Display in grid/list view

**Display:** A grid or list view of all experiences currently linked to this event.

**Card Content:**
- Poster thumbnail (`posterUrl`) with hover-to-play preview (`previewMediaUrl`)
- Title (e.g., "Cyberpunk Avatar")
- Status badge (Active/Draft)
- Output type indicator (Photo/Video/GIF)

**Empty State:** If 0 experiences, show a clear "Add your first Experience" illustration/button.

### 3.2 "Add Experience" Actions

The user initiates creation from the Design Tab.

#### Create New
1. Verify the user's `companyId`
2. Navigate to the Experience Editor page (full window, not a dialog)
3. On save: Create the Experience document in `/experiences` with that `companyId`
4. Push the new Experience ID to `event.experienceIds` array
5. Return to Event Design Tab

#### Link from Library
1. Open a modal showing all Company Experiences (`experiences.where('companyId', '==', userCompanyId)`)
2. Filter out experiences already in `event.experienceIds`
3. User selects one → Add the Reference ID to `event.experienceIds`

#### Duplicate
1. User selects an existing Company Experience
2. Create a deep copy with new ID in `/experiences`
3. Link the new copy to this Event via `event.experienceIds`

### 3.3 "Remove" Actions

#### Unlink
Removes the reference from `event.experienceIds`. The Experience remains in the Company Library and can be linked to other events.

#### Delete
Hard deletes the Experience from `/experiences`. Requires confirmation warning:
> "This will permanently delete this experience and remove it from ALL events where it's linked."

### 3.4 Navigation Stub

**Interaction:** Clicking on an Experience Card.

**Result:** For this phase, navigate to placeholder route `/experiences/{id}` or log the intention. This prepares the entry point for PRD 2 (Experience Editor).

---

## 4. Security Rules

```javascript
// Firestore Security Rules
match /experiences/{experienceId} {
  // Read: User must belong to the same company
  allow read: if request.auth != null
    && resource.data.companyId == request.auth.token.companyId;

  // Create: User can only create for their own company
  allow create: if request.auth != null
    && request.resource.data.companyId == request.auth.token.companyId;

  // Update/Delete: User must own the experience
  allow update, delete: if request.auth != null
    && resource.data.companyId == request.auth.token.companyId;
}
```

---

## 5. Implementation Notes

### Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│  Event Document                                             │
│  /events/{eventId}                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ experienceIds: ["exp_001", "exp_002", "exp_003"]    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ References
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Experiences Collection (Flat, Top-Level)                   │
│  /experiences/{experienceId}                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ exp_001: { companyId, name, posterUrl, aiConfig...}  │  │
│  │ exp_002: { companyId, name, posterUrl, aiConfig...}  │  │
│  │ exp_003: { companyId, name, posterUrl, aiConfig...}  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Decisions

1. **Flat collection over subcollections** — Simpler queries, direct access, future flexibility
2. **`companyId` for security** — Experiences are scoped to companies, not events
3. **Two-step preview assets** — Static poster + rich media for performance and UX
4. **Soft reference via array** — Events link to experiences via ID array, not embedding
