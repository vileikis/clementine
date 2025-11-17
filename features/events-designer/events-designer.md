## 🎨 **Events Designer — Feature Description**

### **Goal**

Improve the clarity, usability, and navigation of the event creation workflow by:

- Introducing a more intuitive **Events Designer** interface
- Streamlining how experiences are created and managed
- Reducing modal interruptions and enabling a more predictable, URL-driven navigation flow
- Improving the overall mental model: _Designing an event_ rather than _editing content_

This update reduces cognitive load for organizers and creates a more scalable foundation for future builder modules.

---

## **Requirements**

### **1. Terminology & Navigation Updates**

- **Rename** `Content` section → **Design**
- The main left sidebar should **render the Experiences section immediately** (default visible)
- **Remove** the “Experiences” menu item entirely — no longer needed because experiences are always visible

---

### **2. Experience Creation Flow**

- Replace the current **create experience dialog** with an **inline create form** displayed directly on the page
- Inline form should capture:

  - **Experience name** (required, cannot be empty)
  - **Experience type** (required, must be selected before submission)

- Validation:

  - Disable submit unless both name and type are provided

- After successful creation → redirect user to the **experience editor** route

---

### **3. Routing Structure**

Each section of the Event Designer must have its own **dedicated route**, enabling deep linking, better navigation, and browser-native back/forward behavior.

Required routes:

- `/events/:eventId/design/welcome`
  → **Welcome Editor**

- `/events/:eventId/design/experiences/create`
  → **Create Experience (inline form)**

- `/events/:eventId/design/experiences/:experienceId`
  → **Experience Editor**

- `/events/:eventId/design/ending`
  → **Ending Editor**

**Requirements:**

- Navigating between these should not reload the event document
- The sidebar should remain persistent across all design routes
- URL changes must reflect the selected section at all times
