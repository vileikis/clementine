# 🗂️ **Event Collection Update — Feature Description**

## 🎯 **Goal**

Refactor the `events` collection to create a more structured, scalable, and readable schema by **grouping related fields into semantic objects**, removing deprecated fields, and aligning the Event Designer UI with the new structure.

This improves maintainability, reduces naming clutter, and provides a clearer mental model for both engineering and creators using the Event Designer.

---

# 📌 **Requirements**

## **1. Schema Refactor (Event Document)**

### **Group Related Fields**

- Move all `welcome*` prefixed fields into a new **`welcome`** object.
- Move all `end*` prefixed fields into a new **`ending`** object.
- Move all `share*` prefixed fields into a new **`share`** object (structure shown below).

### **Introduce New Theme Object**

Add a new **`theme`** object that centralizes event-wide visual customization:

- `buttonColor`
- `buttonTextColor`
- `backgroundColor`
- `backgroundImage`

### **Remove Deprecated Fields**

- ❌ Remove all `survey*` prefixed fields
- ❌ Remove `brandColor`
- ❌ Remove `showTitleOverlay`

### **Preserve Existing Required Fields**

- Ownership + routing fields remain unchanged
- Visibility window fields remain unchanged
- Denormalized counters remain unchanged

---

## **2. Event Designer Updates**

### **Welcome Editor**

- Update the editor to read/write values under:

  ```ts
  event.welcome;
  ```

- Remove legacy read/write from old flat prefixed fields.

### **Ending Editor**

- Update editor to read/write values under:

  ```ts
  event.ending;
  event.share;
  ```

- Remove dependency on previous ending/share prefixed fields.

### **Other Editors**

- Ensure no editor tries to access old flat fields.
- Validate UI binds correctly to nested objects.

---

## **3. Backend & Firestore Updates**

- Update Firestore validation schema to reflect nested objects.
- No need to add any data migrations of existing data in firestore.
- Remove old fields from Firestore rules (deny old prefixed fields).
- Ensure timestamps (`createdAt`, `updatedAt`) remain untouched.

---

## **4. Acceptance Criteria**

- The `events` document uses **only the new grouped fields**.
- Builder UI correctly fetches & updates:

  - `welcome`
  - `ending`
  - `share`
  - `theme`

- No code references deprecated:

  - brandColor
  - showTitleOverlay
  - survey-prefixed fields
  - welcome- prefixed fields
  - end- prefixed fields
  - share- prefixed fields

- All migrations run successfully on dev/staging environments.
- No guest or admin screen breaks related to schema changes.

---

# 🧩 **Updated Schema (Final)**

```ts
interface EventTheme {
  buttonColor?: string;
  buttonTextColor?: string;
  backgroundColor?: string;
  backgroundImage?: string;
}

interface EventWelcome {
  title?: string;
  body?: string;
  ctaLabel?: string;
  backgroundImage?: string;
  backgroundColor?: string;
}

interface EventEnding {
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

interface EventShareConfig {
  allowDownload: boolean;
  allowSystemShare: boolean;
  allowEmail: boolean;
  socials: ShareSocial[];
}

interface Event {
  id: string;
  title: string;
  status: EventStatus;

  // Ownership & routing
  companyId: string | null;
  joinPath: string;
  qrPngPath: string;

  // Visibility window
  publishStartAt?: number;
  publishEndAt?: number;

  // Branding
  theme?: EventTheme;

  // Screens
  welcome?: EventWelcome;
  ending?: EventEnding;
  share: EventShareConfig; // required

  // Counters (denormalized)
  experiencesCount: number;
  sessionsCount: number;
  readyCount: number;
  sharesCount: number;

  createdAt: number;
  updatedAt: number;
}
```
