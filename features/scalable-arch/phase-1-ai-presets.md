# **📄 PRD — Phase 1: aiPresets Refactor & Legacy Step Stabilization**

### **Status:** Ready for Implementation

### **Goal:** Free the term _Experience_ for the new Experience system, and make the old AI module dormant while keeping all existing flows functional.

See high level plan /Users/iggyvileikis/Projects/@attempt-n2/project-ai-presets/features/scalable-arch/high-level-plan.md

---

# **1. Purpose**

The purpose of Phase 1 is to:

- Refactor the legacy `/experiences` collection into `/aiPresets` (parked for future use).
- Update any existing Step types that depend on the old experiences collection so they **continue to work**, without introducing new functionality.
- Deprecate these steps from the UI so they are **not used in new flows**.
- Maintain full backward compatibility during this transition.

This is a **pure refactor phase**:
No new UX, no behavior changes for guests, no new features.

---

# **2. Scope (In-Scope)**

### **2.1 Rename legacy “experiences” → “aiPresets”**

- Firestore collection rename:

  ```
  /experiences → /aiPresets
  ```

- Update all server/client queries pointing to the old path.
- Update TypeScript interfaces/services:

  - `Experience` → `AiPreset`
  - Update naming only; keep structure as-is.

### **2.2 Update dependent Steps to reference `/aiPresets`**

Two legacy step types rely on old experiences:

1. **ExperiencePicker Step**

   - Currently loads a list of experiences from `/experiences`.
   - Must now load from `/aiPresets`.

2. **Capture Step (AI-dependent variants, if any)**

   - Some Capture configurations may reference experience-based AI configs.
   - Update any such lookup to use `/aiPresets` instead.

**No functional changes** to how these steps work—only the data source changes.

### **2.3 Deprecate ExperiencePicker + Legacy AI Capture**

These steps remain available for existing flows but are **deprecated**:

- Remove from “Add Step” menus.
- Hide in step type pickers.
- Add internal `deprecated: true` marker in config if helpful.
- In the Editor, editing existing steps is allowed; creating new ones is disabled.

### **2.4 Zero-change Guarantee for Guest Runtime**

The runtime should behave exactly the same as before Phase 1.

---

# **3. Out of Scope**

- No changes to new Experience system (Phase 2+).
- No changes to Steps structure or rendering.
- No removal of legacy steps yet (done in Phase 3).
- No new AI functionality.
- No UI changes except **removing the ability to add deprecated steps**.

---

# **4. Technical Notes**

### **4.1 Collection rename strategy**

If direct renaming is complex:

- Create new `/aiPresets` collection.
- Migrate all docs from `/experiences`.
- Keep old `/experiences` empty or redirect reads to `/aiPresets`.

### **4.2 Code changes**

- Update service modules:

  - `getExperienceById` → `getAiPresetById`
  - `listExperiences` → `listAiPresets`

- Update Firestore queries:

  ```ts
  db.collection('experiences') → db.collection('aiPresets')
  ```

### **4.3 Steps to update**

#### **ExperiencePicker Step**

- Must fetch list of aiPresets:

  ```ts
  const presets = db
    .collection("aiPresets")
    .where("companyId", "==", currentCompanyId);
  ```

#### **Capture Step**

If step references experience-defined AI configs:

- Update lookups to:

  ```ts
  db.collection("aiPresets").doc(config.aiPresetId);
  ```

### **4.4 Deprecation**

Remove from creation UI:

```ts
stepTypeOptions = stepTypeOptions.filter((s) => !s.deprecated);
```

---

# **5. Risks & Mitigations**

| Risk                                             | Mitigation                                              |
| ------------------------------------------------ | ------------------------------------------------------- |
| Legacy flows break due to missing paths          | Keep all runtime logic unchanged except collection name |
| Some Capture variants rely on deeper old logic   | Keep current behavior, only update references           |
| Engineers mistakenly create new deprecated steps | Hide in UI; add `deprecated: true` tag                  |

---

# **6. Acceptance Criteria**

- [ ] Old `/experiences` collection is now `/aiPresets`.
- [ ] All existing flows using ExperiencePicker or AI-based Capture steps still work.
- [ ] ExperiencePicker loads from `/aiPresets`.
- [ ] Capture step loads any AI config from `/aiPresets`.
- [ ] Deprecated steps cannot be added in new Experiences.
- [ ] No guest-facing behavior changed.
- [ ] Codebase compiles with no references to old `/experiences` paths.

---

# **7. Deliverables**

- Updated Firestore structure
- Updated step implementations
- Deprecated steps in UI
- Migration script (if needed)
- Internal dev note summarizing deprecation
