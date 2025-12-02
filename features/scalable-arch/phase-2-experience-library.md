# **📄 PRD — Phase 2: Journeys → Experiences (Experience Library)**

**Status:** Draft (Finalized with adjustments)
**Goal:** Convert legacy **Journeys** into first-class, company-scoped **Experiences**, and introduce the Experience Library UI inside the Company workspace.

---

# **1. Purpose**

Phase 2 transforms the old Journey system into the new **Experience** model:

- Move Journeys from being **event-scoped subcollections** → to a **top-level collection**.
- Make Experiences **company-scoped**, reusable flow definitions.
- Introduce an Experience Library screen for each company.
- Integrate the existing JourneyEditor into the new ExperienceEditor context.

No new functionality is introduced—only structural and naming changes.

Affected feature modules

- src/features/journeys
- src/features/steps

---

# **2. Scope (In-Scope)**

## **2.1 Data model refactor: journeys → experiences**

### **Backend changes**

- Create new top-level `experiences` collection:

  ```
  /experiences/{experienceId}
  ```

- Migrate existing journey documents (formerly under events) into this root collection.

- Update schema to include:

  ```ts
  interface Experience {
    id: string;
    companyId: string; // required
    name: string;
    description?: string | null;
    isPublic?: boolean; // ignored for MVP (no UI)
    previewMedia?: string; // ignored for MVP (no upload UI)
    stepsOrder: string[]; // ordered IDs of steps
    createdAt: number;
    updatedAt: number;
  }
  ```

- Steps should also be moved under:

  ```
  /experiences/{experienceId}/steps/{stepId}
  ```

- Remove any references to old event → journey structure.

### **Domain rename**

- In codebase:

  - `Journey` → `Experience`
  - Rename types, hooks, components, services.
  - Old JourneyEditor → **ExperienceEditor**.

- For transitional safety, a temporary alias is allowed:

  ```ts
  type Experience = Journey;
  ```

---

## **2.2 Frontend: Company-Scoped Experience Library**

### **Company workspace navigation**

Add “**Experiences**” to the company menu/sidebar.

### **Experiences List Screen (root: `/experiences`)**

- Header: **Experiences**
- Show a grid/list of cards:

  - Experience name
  - (Preview media is out of scope → display only if exists)

- Filter:

  - Only experiences where `experience.companyId === activeCompanyId`.

### **Experience Detail Screen (e.g. `/experiences/{id}`)**

Layout:

1. **Header row**

   - Title: `Experience.name`

     - Clickable → opens rename dialog

   - `Preview` button (using new Experience Engine preview later)

     - Only appears if preview is implemented in future phase, but placeholder button allowed.

2. **Main content**

   - Embed the **ExperienceEditor** (formerly JourneyEditor), unchanged except:

     - It now operates on `/experiences/{id}/steps`
     - Remove ExperiencePicker step from UI
     - Standardize terminology in the editor to “Experience” instead of “Journey”

### **Editor modifications (UI only)**

- Replace any old Journey terminology:

  - “Journey Name” → “Experience Name”
  - “Journey Steps” → “Steps”

- Ensure editor loads steps from `experiences/{id}/steps`.

---

# **3. Out of Scope**

(Ensuring clarity for MVP scope)

- 🚫 Public experiences (no UI for toggling public/private)
- 🚫 Preview media upload UI
- 🚫 Public/private switcher
- 🚫 Editing company-level themes
- 🚫 Any event integration (Phase 6)
- 🚫 Removing deprecated ExperiencePicker & AI Capture (handled in Phase 1 / Phase 3)

---

# **4. Technical Notes**

### **4.1 Experience migration**

If journeys were previously under:

```
events/{eventId}/journeys/{journeyId}
```

Steps were under:

```
events/{eventId}/steps/{stepId}
```

Migration plan:

1. Create new `/experiences` root documents.
2. Copy:

   - journey name → experience name
   - description
   - stepsOrder

3. Move steps into `/experiences/{id}/steps`.
4. Assign `companyId` to each new experience (based on event/project/company mapping).
5. Delete old journey paths after validation.

### **4.2 Editor adoption**

- The former JourneyEditor should:

  - Read/write from `/experiences/{experienceId}`.
  - Load steps from `/experiences/{experienceId}/steps`.
  - No structural change required otherwise.

---

# **5. Acceptance Criteria**

- [ ] `/experiences` top-level collection created.
- [ ] All legacy journeys migrated to experiences with valid `companyId`.
- [ ] Steps moved to `/experiences/{id}/steps`.
- [ ] Old event → journey structure removed/unused.
- [ ] Company → Experiences list screen implemented.
- [ ] Experience detail → loads ExperienceEditor.
- [ ] Renaming dialog works.
- [ ] No public/private UI.
- [ ] No preview media upload.
- [ ] No references to journey terminology remain in UI.
- [ ] Deprecated steps hidden from step picker (carried from Phase 1).

---

# **6. Deliverables**

- Updated Firestore structure.
- New Experiences screens.
- ExperienceEditor working with new paths.
- Migration script / manual migration instructions.
- Codebase with consistent terminology: Experience, Step.
