# **Clementine – Experience Types & Output Definitions (v1.1)**

Clementine supports a modular set of **Experience Types**, each defining a user-facing interaction inside an event flow.
This version includes **AI Context Inputs** — user-provided answers that merge into AI prompts to personalize generated content.

---

# **1. Photo Experience**

### **Description**

User captures or uploads a single photo.

### **Inputs**

- Device camera or upload
- Optional: branding frame overlay

### **Outputs**

1. **Original Photo**
2. **Photo + Frame Overlay**

---

# **2. GIF Experience**

### **Description**

User captures **X photos** (burst mode), compiled into an animated GIF.

### **Inputs**

- Burst image capture (X photos)
- Optional: branding frame

### **Outputs**

1. **GIF**
2. **GIF + Frame Overlay**

---

# **3. Video Experience**

### **Description**

User records a short video clip.

### **Inputs**

- Device camera (video)
- Optional: branding frame

### **Outputs**

1. **Original Video**
2. **Video + Frame Overlay**

---

# **4. AI Photo Experience**

### **Description**

User provides a base photo. Clementine transforms it using an AI model, prompt, and **dynamic user-provided context inputs**.

---

### **Inputs**

#### **A. Base Inputs**

- Captured/uploaded photo
- AI model selection
- Base style prompt
- Optional: reference imagery
- Optional: branding frame

#### **B. AI Context Inputs (NEW)**

Configurable list of user questions that enrich the prompt dynamically.

Example: _“Hobbitify Me” Experience_

**Questions asked to the user:**

- **Pet to hold?** (cat, dog, chicken, none — multiselect)
- **Include a pipe?** (yes/no)
- **Preferred background?** (hobbit barrow, farm fields, river — multiselect)

The runtime merges answers into the final prompt, e.g.:

> “Transform the user into a hobbit. They are holding a cat. Include a wooden pipe. Background: hobbit barrow.”

---

### **Outputs**

1. **AI-Transformed Photo**
2. **AI-Transformed Photo + Frame**

---

# **5. AI GIF Experience**

### **Description**

User captures **X images**, each frame is transformed using AI, enhanced by **context inputs**, and compiled into an animated GIF.

---

### **Inputs**

#### **A. Base Inputs**

- Burst photo set (X frames)
- AI model + base prompt
- Optional reference images
- Optional overlay frame

#### **B. AI Context Inputs (NEW)**

Same mechanism as AI Photo, e.g.:

- “Choose your superhero style”
- “Select power effects: lightning / fire / ice”
- “Pick background: skyline / neon city / desert”

These answers personalize the transformation of **every frame**.

---

### **Outputs**

1. **AI GIF**
2. **AI GIF + Frame**

---

# **6. AI Video Experience**

### **Description**

User provides a single photo → AI generates a synthetic animated video from it, incorporating **user-selected context inputs**.

---

### **Inputs**

#### **A. Base Inputs**

- Base photo
- AI video model
- Video prompt
- Optional reference images
- Optional branding frame

#### **B. AI Context Inputs (NEW)**

Collected before generation, injected into the video prompt.

Example (Hobbitify Video):

- Pet choice → “Character holding a chicken.”
- Pipe? → “Add a smoking pipe with smoke trails.”
- Background → “Scene set near a river.”

---

### **Outputs**

1. **AI Video**
2. **AI Video + Frame**

---

# **7. Survey Experience**

### **Description**

Interactive questionnaire with customizable question types.

### **Inputs**

- List of questions (MCQ, text input, sliders, conditional branching)

### **Outputs**

- **Survey Response JSON**

---

# **8. Wheel of Fortune Experience**

### **Description**

Gamified spinning wheel with customizable sectors and probabilities.

### **Inputs**

- Sector configuration (labels, probability weights, icons)

### **Outputs**

- **Selected Sector Result** (text, reward ID, or structured payload)

---

# ✔ Summary Table (Updated)

| Experience Type      | User Action                | AI Context Inputs? | Outputs                     |
| -------------------- | -------------------------- | ------------------ | --------------------------- |
| **Photo**            | Capture image              | No                 | Photo / Photo + Frame       |
| **GIF**              | Capture burst              | No                 | GIF / GIF + Frame           |
| **Video**            | Record clip                | No                 | Video / Video + Frame       |
| **AI Photo**         | Take photo → AI transform  | **Yes**            | AI Photo / AI Photo + Frame |
| **AI GIF**           | Burst → AI transform → GIF | **Yes**            | AI GIF / AI GIF + Frame     |
| **AI Video**         | Photo → AI video           | **Yes**            | AI Video / AI Video + Frame |
| **Survey**           | Answer questions           | N/A                | Survey response JSON        |
| **Wheel of Fortune** | Spin                       | No                 | Selected sector             |
