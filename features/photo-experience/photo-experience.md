## 📸 **Photo Experience Tweaks — Feature Description**

### **Goal**

Improve the clarity and usability of the **Photo Experience** configuration by simplifying controls, aligning UI with real user needs, and preparing the experience for scalable AI generation.
The goal is to reduce clutter, streamline decision-making for organizers, and give creators more precision in defining how photos are captured, previewed, and transformed.

---

## **Requirements**

### **1. Remove Capture Options**

- Remove all existing **capture options** from the Photo Experience settings.
- The system will **not** support custom capture modes—always assume simple upload or direct camera capture.
- UI sections that previously depended on “capture options” must be removed or realigned.

---

### **2. Preview Media**

Add support for **preview media** that can be an image, GIF, or video.

**Requirements:**

- Allow users to upload **image, GIF, or video** as preview media.
- Store using the existing fields:

  ```ts
  previewPath?: string;
  previewType?: "image" | "gif" | "video";
  ```

- Display a real-time preview in the UI:
  - For images → show static thumbnail
  - For GIFs → autoplay loop
  - For videos → autoplay muted loop (if possible)
- Allow users to:
  - **Upload**
  - **Replace**
  - **Remove** preview media
- Provide helper text:
  > This media will appear on the guest start screen as a visual preview of the experience.

**Additional Notes:**

- For photo experiences, GIF/video previews may show rotating photos or animated examples.
- No size restrictions change at this stage (inherits from current media upload rules).

---

### **3. Countdown Controls**

Add a new **Countdown Settings** section.

- **Countdown Toggle**

  - On/Off switch to enable or disable countdown before taking a photo

- **Countdown Timer**

  - Numeric input or slider
  - Allowed range: **0 to 10 seconds**
  - If countdown is disabled → timer field is hidden or disabled
  - Default value: 3 seconds (if toggle enabled)

---

### **4. Overlays**

Simplify overlay configuration.

- **Overlay Toggle**

  - On/Off switch to enable or disable frame overlay usage

- **Overlay Behavior**

  - Remove logo overlay support completely
  - Only **one frame overlay** may be uploaded
  - Requirements:

    - upload frame image
    - preview it over sample photo
    - allow replace / remove

---

### **5. AI Transformation Settings**

#### **Reference Images Layout**

- Display reference images **in a horizontal row**, not a vertical column
- If multiple rows are needed (overflow), use responsive wrapping

#### **Aspect Ratio Picker**

- Add a dropdown or segmented control for selecting aspect ratio
- Supported options (to confirm):

  - 1:1
  - 3:4
  - 4:5
  - 9:16
  - 16:9
  - (Optional) Custom?

- This affects both canvas and final output generation

#### **Prompt Guide Link**

- Add a **contextual “Prompt Guide” link** next to the Model Picker
- Each model will have its own link
- For **NanoBanana**, the link should be:

  - `https://ai.google.dev/gemini-api/docs/image-generation#prompt-guide`

- Link opens in new tab
- UI should reflect which model’s guide is shown (dynamic)
