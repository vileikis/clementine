# **📄 PRD #1 — Unified Preview Runtime (Mobile + Desktop)**

_(for Clementine Journey Editor)_

### **Product Area**

Event Designer → Journey Steps Preview

### **Status**

Draft v1

---

# **1. Purpose**

The current preview inside the Journey Editor shows only a simplified, mobile-only rendering of the current step.
We need to upgrade it into a **proper runtime layer** that:

1. Uses the same render engine as the future guest experience
2. Supports **mobile / desktop** view switching
3. Correctly renders all step types via shared components
4. Becomes the foundation for the final guest play engine (PRD #3)

This PRD covers ONLY the preview runtime — not the editor and not the guest experience.

---

# **2. Summary of Change**

We will introduce:

### **✔ A unified “Step Renderer” per step type**

One component per step type, used by:

- Editor
- Preview
- Guest runtime

### **✔ A preview surface with mobile/desktop modes**

Switch via toggle:

- 📱 Mobile (375px width)
- 🖥 Desktop (900px frame)

### **✔ A Preview Runtime Wrapper**

Responsible for:

- Hydrating steps with simulated session data
- Rendering each step with correct props
- Handling transitions between steps (if preview supports full run)

### **✔ Clean separation of Editor UI vs Preview UI**

Editor stays as-is.
Preview becomes a standalone runtime layer.

---

# **3. Goals**

### **Functional**

- Show each step exactly as guests will see it.
- Toggle phone/desktop view instantly.
- Use final guest UI components, not simplified ones.
- Support step-to-step simulation (optional early version: single-step only).

### **Technical**

- Introduce `/runtime/preview` engine for consistent rendering.
- Each step type gets:

  - `EditorComponent`
  - `PreviewComponent`
  - `GuestComponent` (future)

These can initially reuse the same component if possible.

---

# **4. Scope**

### **In Scope**

- Mobile/Desktop view switcher
- Runtime wrapper container
- Step renderer components
- Handling theme application
- Hydrating preview with mock session data
- Ensuring all current step types render properly:

  - Info (title, description, CTA)
  - Experience Picker (selectable experience cards)
  - Capture (mocked camera placeholder)
  - Short Text (single-line input)
  - Long Text (multi-line textarea)
  - Multiple Choice (selectable options)
  - Yes/No (two-button selection)
  - Opinion Scale (numeric scale)
  - Email (email input with validation)
  - Processing (loading animation with rotating messages)
  - Reward (placeholder result with share/download buttons)

### **Out of Scope**

- Real camera access (mock only)
- Actual AI transform calls
- Guest session tracking
- Full multi-step preview navigation (optional v2)

---

# **5. Detailed Requirements**

## **5.1 Preview Layout**

### **Mobile Mode**

- Fixed width: 375px
- Height: 100%
- Centered phone frame
- Scrollable if content exceeds

### **Desktop Mode**

- Fixed width: 900px
- Centered frame
- Scrollable if content exceeds

### **Toggle**

- Floating switcher: “Mobile / Desktop”
- Instant re-render

---

## **5.2 Step Runtime Wrapper**

Applies to **any step**:

```
<PreviewRuntime
   journey={...}
   step={currentStep}
   theme={currentTheme}
   mockSession={true}
/>
```

Responsible for:

- Passing down the step config
- Injecting theme overrides
- Injecting mock session state (e.g., placeholder selfie, sample name)
- Choosing correct PreviewComponent via `step.type`
- Re-rendering in real-time when step configuration changes
- Handling errors gracefully

---

## **5.3 Step Rendering Requirements**

Each step type must have a preview-friendly render:

### Info

- Show title, description, and CTA button
- Use theme background & typography

### Experience Picker

- Show selectable experience cards in configured layout (grid/list/carousel)
- Display experience previews with proper theming

### Capture

- Show a mocked camera placeholder (static image)
- Display capture UI elements
- If GIF/video mode: show frame count indicators
- Respect countdown if configured

### Short Text

- Show single-line input field
- Display placeholder text and validation indicators

### Long Text

- Show multi-line textarea
- Display placeholder and character limit indicator

### Multiple Choice

- Show selectable options in configured format
- Display proper selection state styling

### Yes/No

- Show two buttons with configured labels
- Use theme button styling

### Opinion Scale

- Show numeric scale with min/max labels
- Display proper scale styling

### Email

- Show email input field
- Display validation indicators

### Processing

- Show loading animation
- Display rotating messages as configured

### Reward

- Show placeholder result image
- Display share/download buttons as in guest mode

---

## **5.4 Dependencies for PRD #3 (Guest Runtime)**

This preview engine will become the backbone for:

- Live session state
- Actual camera pipeline
- AI calls
- Analytics events

So the architecture must already be clean, modular, and aligned with runtime patterns.

---

# **6. Technical Requirements**

- All data schemas shared between editor/preview/guest.

- Use Zod-based schema validation.

- Create `/runtime/` folder:

  ```
  runtime/
    engine/
      index.ts
    step-renderers/
      info.tsx
      experience-picker.tsx
      capture.tsx
      short-text.tsx
      long-text.tsx
      multiple-choice.tsx
      yes-no.tsx
      opinion-scale.tsx
      email.tsx
      processing.tsx
      reward.tsx
    preview/
      PreviewRuntime.tsx
      ViewSwitcher.tsx
  ```

- PreviewRuntime must accept:

  - step config
  - theme config
  - mock session
  - optional navigation handler (v2)

---

# **7. Acceptance Criteria**

### **AC1. Mobile/Desktop switch works**

User toggles → preview re-renders correctly.

### **AC2. All 11 step types display correctly**

All step types (Info, Experience Picker, Capture, Short Text, Long Text, Multiple Choice, Yes/No, Opinion Scale, Email, Processing, Reward) render correctly using mock data where necessary.

### **AC3. Preview uses real theme**

Colors, fonts, branding overlays are shown identically to guest mode.

### **AC4. Preview uses shared renderer components**

No special preview-only hacks for layout.

### **AC5. Editor components remain unchanged**

---

# **8. Risks & Mitigations**

| Risk                                                | Mitigation                                             |
| --------------------------------------------------- | ------------------------------------------------------ |
| Step components may diverge between preview & guest | Use shared renderer components with preview-mode flags |
| Camera/GIF/Video preview complexity                 | Use static mocks for preview                           |
| Desktop mode may break vertical layouts             | Add auto-scaling or centered layout                    |
| Processing step logic may require real async        | Always operate in mock mode                            |
