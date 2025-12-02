# **📄 Clementine — High-Level Roadmap & Refactoring Plan (Phases 0–7)**

**Goal:** Move from legacy Events / Journeys / Steps / ExperiencePicker / AI Presets → to a clean, scalable model centered around **Company → Project → Event → Experience → Steps** with a unified **Experience Engine**.

## DATA Models

- Old features/scalable-arch/old-data-model-v4.md
- New features/scalable-arch/new-data-model-v5.md

## PLanned feature modules

- features/scalable-arch/feature-modules.md

---

## **🎯 Phase 0 — Establish Company Context (Foundation)**

**Purpose:** Make _Company_ the top-level scope for everything.

- Add `/companies` collection.
- Add **companyId** to all top-level entities: Projects, Events, Experiences, AiPresets.
- Introduce **Company Workspace** UI:

  - Company list → select → all views scoped to active company.

- All new data structures and UX start inside this company context.

---

## **🎯 Phase 1 — Refactor Old `experiences` → `aiPresets` (Dormant Library)**

**Purpose:** Free the name “Experience” and park the old AI module.

- Rename old `experiences` to `/aiPresets`.
- Update types & services accordingly.
- Do **not** build UI or use it in flows.
- This preserves future ability to build a preset marketplace, without polluting the MVP.

---

## **🎯 Phase 2 — Journeys → Experiences (New Flow Definitions)**

**Purpose:** Turn legacy journeys into reusable, company-scoped **Experiences**.

- Domain rename: `Journey` → `Experience`.
- Create `/experiences` collection with:

  - `companyId`, `name`, `isPublic`, `previewMedia`, `stepOrder[]`.

- Build **Experience Library** UI inside company workspace.
- Experiences become **top-level flow templates** reusable by events.

---

## **🎯 Phase 3 — Steps Consolidation (Reuse + New AI Step + Remove ExperiencePicker)**

**Purpose:** Normalize all steps and integrate AI into the flow.

- Reuse existing Step types (info, capture, inputs, etc.).
- Add new **`ai-transform`** step:

  - Contains model, prompt, variables, advanced options.
  - AI output fully defined inside the step.

- **Remove legacy `experience-picker` step** entirely.
- Steps now live at: `/experiences/{experienceId}/steps/{stepId}`.
- Add **Test Panel** in editor for `ai-transform` to preview AI results.

---

## **🎯 Phase 4 — Projects (Company-Level Containers)**

**Purpose:** Organize events under long-running projects.

- `/projects` collection (company-scoped).
- Fields: `name`, `sharePath`, `activeEventId`.
- UI: Projects list inside company workspace; open a project to see its events.
- Guest join links point to project → resolve the active event.

---

## **🎯 Phase 5 — Events (Scheduled & Themed Instances)**

**Purpose:** Events are the actual time-bound guest-facing experiences.

- Path: `/projects/{projectId}/events/{eventId}`.
- Fields: `name`, `status`, `startTime`, `endTime`, `theme`.
- **Theme only at event level** (no inheritance for MVP).
- **Scheduling rules:**

  - 1 active event per project at a time.

- UI: Event Editor with theme customization.

---

## **🎯 Phase 6 — Attach Experiences to Events (Simple Linking)**

**Purpose:** Events define which Experiences guests can access.

- Path: `/projects/{projectId}/events/{eventId}/eventExperiences`.
- Each document links: `experienceId` + `isEnabled`.
- No ordering, no overrides in MVP.
- UI: Event Editor → Add Experience (picker from Experience Library).

---

## **🎯 Phase 7 — Experience Engine (Preview + Guest Runtime)**

**Purpose:** A unified engine that powers both admin preview & guest flow.

- Shared runtime that:

  - Loads event theme.
  - Loads selected experience and its steps.
  - Walks through steps sequentially.
  - Handles `ai-transform` execution.
  - Emits callbacks (`onStart`, `onStepChange`, `onComplete`, `onDataUpdate`).

- **Admin Preview**: test whole experience or from a specific step.
- **Guest Runtime**: accessed via project share link → loads active event → loads chosen experience(s).

---

# **🏁 End State After Phase 7**

### **Clean, modern architecture:**

```
Company
  → Projects
      → Events (theme + schedule)
          → EventExperiences (links)
  → Experiences (flows)
      → Steps (including ai-transform)
  → AiPresets (legacy AI library, unused)
```

### **What we gain:**

- Multi-tenant, scalable organization.
- Clear separation between brand-level content (Experiences) and scheduled activations (Events).
- AI fully integrated as a step with local “Test” capability.
- Unified runtime powering admin preview + guest experience.
- Clean naming, no legacy confusion.
