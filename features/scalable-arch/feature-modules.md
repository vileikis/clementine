Here is the **clean, scalable, future-proof feature module organization** for Clementine, with a specific focus on where **Step Renderers**, **Experience Engine**, **Admin Preview**, and **Guest Flow** should live.

This is structured in the same architectural philosophy we’ve been following:

- **Domain-first**
- **Feature modules over global folders**
- **Separation of Admin vs Guest**
- **One shared runtime engine**

Let's go step by step.

# 🧱 **Top-Level Feature Modules**

Your app will have roughly these modules:

```
/companies
/projects
/events
/experiences
/steps
/experience-engine        ← 🔥 new core module
/admin-preview
/guest
/shared
/ui
```

Now let’s break down the important ones.

---

# 🎛️ **1. `/steps` (Step Types + Editor UI)**

This module contains **everything specific to steps**:

### Directory Example:

```
/steps
   /types
   /schemas
   /editors        ← Admin editors for each step
   /fields
   /defaults
```

### This module contains:

- **Type definitions** (`Step`, `StepType`, configs per type)
- **Validation schemas** (Zod)
- **Default config factories**
- **Admin step editors** (UI for editing step properties)

### ❌ This module does _NOT_ contain:

- Step rendering logic
- Step execution logic
- Guest-facing UI

These belong in the Experience Engine.

### Why?

Because **steps are domain objects**, not view logic.
Their job is to **describe what should happen**, not execute it.

---

# 🚀 **2. `/experience-engine` (Core Runtime Layer)**

> **This is where all Step Renderers live.**

This is the shared runtime that powers:

- Admin Preview
- Guest Flow
- Testing inside Experience Editor

### Directory Example:

```
/experience-engine
   /runtime
   /renderers
        info-step.tsx
        capture-step.tsx
        ai-transform-step.tsx
        ...
   /hooks
   /controllers
   /services
```

### This module contains:

#### ✔ Unified Step Renderer Layer

Each step type has ONE renderer:

```
renderers/info-step.tsx
renderers/ai-transform-step.tsx
renderers/upload-step.tsx
...
```

These components **read the step config** and produce UI and behavior.

#### ✔ Experience Orchestrator

Controls:

- Which step is currently active
- When to move to next
- When to handle AI calls
- When to jump into pre-reward survey experience
- When to fire callbacks (analytics)

#### ✔ Session State Handler

Manages:

- Current step ID
- Variables
- Intermediate data
- Survey flags (e.g. surveyCompleted)

#### ✔ Input tracking & onDataUpdate callback

(This is where analytics and guest behavior data flow.)

---

# 🛠️ Why step renderers live in `/experience-engine`

Because:

- They must behave **identically** for Admin Preview & Guest.
- They need runtime logic (e.g. handling AI calls).
- They are UI + logic combined.

`/steps` only defines _what_ the step is, `/experience-engine` defines _how it runs_.

---

# 👩‍💻 **3. `/admin-preview` (Uses Experience Engine)**

Contains:

```
/admin-preview
   /panels
   /views
   preview-wrapper.tsx
```

### What it does:

- Mounts the **Experience Engine in “preview mode”**
- Allows starting from a specific step
- Injects fake session
- Exposes debug info

### What it does **not** do:

- Render steps (Experience Engine does that)
- Store data (all comes from Firestore via `/experiences`)

---

# 📱 **4. `/guest` (Uses Experience Engine)**

Contains:

```
/guest
   /views
   /entry
   guest-app.tsx
```

### What it does:

- Loads active event
- Loads selected experience
- Mounts Experience Engine
- Handles share, download, QR, theme

### What it does _not_ do:

- Step rendering
- Experience orchestration

All rendering is delegated to `/experience-engine`.

---

# 🧩 **5. `/experiences` (Library + Editor)**

Contains:

```
/experiences
   /library-list
   /editor
   /experience-details
```

### What it does:

- Create/edit experience metadata
- Add/remove/reorder steps
- Test an experience (using Admin Preview → Engine)

### What it does not:

- Render actual steps (Experience Engine does that)

---

# 🗂️ **Putting It All Together (Diagram)**

```
/steps (domain, schemas, editors)
     |
     |-- describes what steps are
     v
/experience-engine (runtime)
     |
     |-- renders & runs steps
     |-- controls flow
     |-- session state
     v
/admin-preview (admin usage of engine)
/guest         (guest usage of engine)
```

This gives:

- **One source of truth** for execution
- **One set of renderers** for every environment
- **True WYSIWYG preview**
- **Low coupling**
- **High flexibility for adding new step types**

---

# 🧠 Summary — Where Do Step Renderers Live?

### ✔ Step Definitions → `/steps`

### ✔ Step Editors (admin UI) → `/steps/editors`

### ✔ Step Renderers (runtime) → `/experience-engine/renderers`

### ✔ Step Execution Logic → `/experience-engine/runtime`

### ✔ Previews / Guest flows → `/admin-preview` and `/guest`

This structure is consistent with:

- Shopify Polaris
- Vercel platform
- Superhuman
- Plasmic / Builder.io
- Any modern modular SaaS architecture
