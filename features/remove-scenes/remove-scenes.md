## 🗑️ **Remove Scene Dependency — Feature Description**

### **Goal**

Fully eliminate the legacy **Scenes** architecture from the Events domain.
Scenes were an early POC structure and are now **deprecated** and replaced entirely by the **Experiences** collection.
This feature removes the scenes subcollection, cleans up unused code, and migrates any scene-level logic to the experience level to ensure a simpler, more maintainable event model.

---

## **Requirements**

### **1. Remove Scenes Subcollection From Firestore**

- Delete the `/events/{eventId}/scenes` subcollection from the data model.
- Ensure **no new writes** to `scenes` are possible.
- Update Firestore rules to block access to the scenes path.
- Remove any scenes-related types, interfaces, and validation schemas.

---

### **2. Migrate Scene Functionality → Experience-Level Fields**

The following data previously stored in scenes must now live within each **experience**:

#### **AI Prompt Fields**

- Move prompt-related configuration to the experience document (or its step configuration depending on the final schema).
- Ensure the experience-level schema supports:

  - aiEnabled
  - aiPrompt
  - aiModel
  - aiReferenceImagePaths

#### **Reference Images**

- Any reference images previously linked to scenes must be:

  - moved under their corresponding experience
  - displayed/edited under the experience editor UI

---

### **3. Remove All Scene-Related Logic From App Code**

Remove or refactor all components that previously relied on scenes, including:

- EventBuilder/EventDesigner logic that loads scenes on initialization
- Guest flow logic that referenced `currentSceneId`
- Any scene-based rendering, navigation, or switching logic
- Old POC-era modules referencing scenes (camera, AI, preview, overlays)
- Firestore query utilities that fetch scenes subcollections
- Admin UI panels or components showing scene lists or editors

**Remove `currentSceneId` from the event schema**
This property becomes fully obsolete.

---

### **4. Update Routing & Builder Logic**

- The Event Designer must no longer reference or rely on scenes to determine:

  - routing structure
  - UI state
  - preview mode
  - default flow

- Experience list becomes the _primary structure_ for building an event.

---

### **5. Clean Up UI & Developer Tools**

- Remove any scene-specific UI panels, routes, or legacy forms.
- Ensure no leftover hidden scene fields appear in:

  - inspector panels
  - preview mode
  - mobile guest screens
  - old demo components

---

### **6. Data Migration / Cleanup ()**

No need to do any data migration.

---

### **7. Acceptance Criteria**

- No reference to “scenes” anywhere in:

  - Firestore
  - Firestore rules
  - Admin UI
  - Guest UI
  - TypeScript types & zod schemas

- Experience-level fields correctly hold all AI-related configuration.
- Event creation and flow logic is solely based on **experiences**.
- Codebase has zero dead imports or unused components referencing scenes.
- QA validation: event loads without errors even when no scenes exist.
