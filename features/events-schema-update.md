This is a significant pivot. You are moving from a "Monolithic Event" model (where the event held the content like `welcome` and `ending`) to a **"Router Event"** model (where the Event is just a shell that points to a Journey).

Here is the breakdown of the decisions, the new Zod schema, and the answers to your styling questions.

### 1\. Strategic Decisions & Answers

#### Q: Branding vs. Theme?

**Verdict: Use `theme`.**
While "Branding" implies identity (Logo, Company Name), "Theme" implies UI implementation (Colors, button radiuses, alignment). Since you are defining how the interface _behaves_ (text alignment) and _looks_ (button text colors), `theme` is the correct technical term.

#### Q: Handling Colors (The "Smart Defaults" Approach)

You correctly identified the issue: setting one "Brand Color" breaks accessibility if that color is too light for white text or too dark for black text.

**The Solution:** Use a cascading system.

1.  **`primaryColor`**: The main accent (sliders, active states, borders).
2.  **`button`**: An explicit override object. If not provided, it defaults to `primaryColor`, but allowing it to be separate solves the contrast issue.
3.  **`background`**: Needs to support both Color (fallback/solid) and Image.

---

### 2\. The New Zod Schema

Here is the merged schema. It prioritizes the **v1 Data Model** (Switchboard logic) while keeping necessary administrative fields from your existing setup.

```typescript
import { z } from "zod";

// ==========================================
// 1. THEME & UI CONFIGURATION
// ==========================================

// Shared validation helpers
const hexColor = z.string().regex(/^#[0-9A-F]{6}$/i);
const urlString = z.string().url();

export const eventThemeSchema = z.object({
  // Identity
  logoUrl: urlString.nullable().optional(),
  fontFamily: z.string().optional().default("Inter"), // Default font

  // The "Brand" Anchor
  // Used for focus rings, active states, progress bars, etc.
  primaryColor: hexColor.default("#000000"),

  // Global Text Settings
  text: z
    .object({
      color: hexColor.default("#FFFFFF"),
      // Useful for different vibes (Modern = Left, Elegant = Center)
      alignment: z.enum(["left", "center", "right"]).default("center"),
    })
    .default({}),

  // Button Specifics
  // Allows solving the contrast issue (e.g., Yellow Button requires Black Text)
  button: z
    .object({
      backgroundColor: hexColor.optional(), // If undefined, inherits primaryColor
      textColor: hexColor.default("#FFFFFF"),
      radius: z.enum(["none", "sm", "md", "full"]).default("md"), // nice to have
    })
    .default({}),

  // Background Layering
  background: z
    .object({
      color: hexColor.default("#000000"),
      image: urlString.nullable().optional(),
      // Opacity for an overlay to ensure text readability over the image
      overlayOpacity: z.number().min(0).max(1).default(0.3),
    })
    .default({}),
});

// ==========================================
// 2. EVENT ROOT SCHEMA
// ==========================================

export const eventStatusSchema = z.enum(["draft", "published", "archived"]);

export const eventSchema = z.object({
  // --- Identity & Metadata ---
  id: z.string(),
  ownerId: z.string(), // Replaces companyId, aligns with v1 Doc

  // Internal name for the host dashboard
  name: z.string().min(1).max(200),

  // URL-friendly identifier (formerly joinPath)
  // e.g., "nike-summer-bash" -> clementine.app/e/nike-summer-bash
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/),

  status: eventStatusSchema.default("draft"),

  // --- THE SWITCHBOARD (Crucial for v1 Architecture) ---
  // This is the connection to the Journey system.
  // null = "Waiting for Host" screen
  // string = The specific Journey ID currently live
  activeJourneyId: z.string().nullable().default(null),

  // --- Visuals ---
  theme: eventThemeSchema.default({}),

  // --- Administration ---
  // Kept these as they are useful for scheduling, even if not in the v1 diagram
  publishStartAt: z.number().optional(),
  publishEndAt: z.number().optional(),

  // Legacy/Utility support
  qrPngPath: z.string().optional(),

  // Standard Timestamps
  createdAt: z.number(),
  updatedAt: z.number(),
});

// TypeScript inference
export type Event = z.infer<typeof eventSchema>;
export type EventTheme = z.infer<typeof eventThemeSchema>;
```

---

### 3\. Changes & Migration Notes

Here is how I mapped your requirements to this new structure:

| Feature           | Old Schema            | New Schema                     | Reason                                                                    |
| :---------------- | :-------------------- | :----------------------------- | :------------------------------------------------------------------------ |
| **Content**       | `welcome`, `ending`   | **REMOVED**                    | Content now lives in the `steps` collection.                              |
| **Sharing**       | `share` config        | **REMOVED**                    | Sharing logic will be handled by a specific `result` step in the Journey. |
| **Counters**      | `sessionsCount`, etc. | **REMOVED**                    | Removed as requested.                                                     |
| **Active Flow**   | N/A                   | `activeJourneyId`              | **The most important field.** It tells the app which playlist to run.     |
| **Button Colors** | `buttonColor`         | `theme.button.backgroundColor` | Allows separation from the global `primaryColor`.                         |
| **Text Align**    | N/A                   | `theme.text.alignment`         | Added as requested.                                                       |
