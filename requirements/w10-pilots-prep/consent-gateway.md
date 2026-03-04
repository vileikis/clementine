The goal here is to create a "Consent Gateway" that is legally bulletproof under GDPR and the EU AI Act, without destroying your conversion rate or ruining the fun vibe of a live event.

Since your platform is dynamic (Brands can mix and match AI generation, raw GIFs, surveys, marketing, and public galleries), your UI needs to be modular. Only show the checkboxes the Brand has actually requested for that specific project.

Here is the exact UI copy and logic you can hand straight to your product designer.

### Step 1: The Age Gate (Screen 1)

As we discussed, this must happen _before_ the camera opens, and it must be asked every time the link is opened to account for device-sharing.

- **Headline:** Welcome to the [Brand Name] Experience! 📸
- **Sub-headline:** Before we start, we need to check your age.
- **Button 1:** "I am 16 or older"
- **Button 2:** "I am under 16"

**The Logic:**

- If they tap **"I am 16 or older"** ➡️ Proceed to Screen 2.
- If they tap **"I am under 16"** ➡️ Show a blocker screen: _"Sorry! You must be 16 or older to use this digital experience."_ Drop a short-lived session cookie so they cannot just hit "back" and try again immediately.

### Step 2: Data Entry & Consent (Screen 2)

This is the critical screen. It combines the mandatory legal permission to process their face with any optional marketing or gallery features the Brand wants.

- **Data Fields (Dynamic):** _ [ Text Input ] Email Address _(Show only if the Brand needs it to send the photo or wants marketing leads)\*
- [ Text Input ] Instagram Handle _(Show only if requested)_

- **Checkbox 1 (MANDATORY): Core Processing & Terms**
- **UI Copy:** ☑️ _"I agree to the [Terms of Use] and [Privacy Policy], and I consent to [Brand Name] and Clementine processing my media and data to create this experience."_
- **Logic:** The "Start Camera" button is disabled until this is checked. The bracketed text must be hyperlinked to your hosted legal pages.

- **Checkbox 2 (OPTIONAL): Brand Marketing (Unbundled)**
- **UI Copy:** 🔲 _"I'd like to receive marketing emails and offers from [Brand Name]."_
- **Logic:** Unchecked by default. If checked, your system flags this user in the CSV export you give to the Brand.

- **Checkbox 3 (OPTIONAL): Public Gallery & Brand Reuse**
- **UI Copy:** 🔲 _"I allow [Brand Name] to display my generated image in the event's public gallery and on their social channels."_
- **Logic:** Unchecked by default. If left unchecked, the user still gets to use the photobooth, but your backend automatically excludes their session ID from the public slideshow feed.

- **The Call to Action Button:**
- **[ START CAMERA ]** _(Activates only when Checkbox 1 is ticked)_

### Step 3: EU AI Act Transparency (The Output Stage)

Because we are operating under the EU AI Act, transparency for generative AI is strictly enforced. Users must know they are interacting with AI, and the output must be recognizable as synthetic.

**How to implement this:**

1. **In the UI (Pre-generation):** If the user selects an AI experience (e.g., `ai.photo`), add a small tooltip or text near the camera button: _"Powered by Generative AI."_
2. **On the Output (Post-generation):** You must apply a small, tasteful watermark (e.g., "AI Generated") to the final image/video, OR embed C2PA metadata into the file indicating it is synthetic. If you just use Vertex AI, Google automatically embeds SynthID digital watermarking, which helps cover your compliance here, but a visible indicator is best practice for consumer trust.

---

### Why this specific flow is a superpower for Clementine:

By keeping the legal checkboxes modular, you give Brands total control. If a Brand just wants a frictionless, anonymous GIF booth, you only show Checkbox 1. If they want a massive data-harvesting campaign, you turn on Checkboxes 2 and 3. In all scenarios, Clementine is legally protected because the UI strictly enforces the separation of mandatory processing vs. optional marketing.
