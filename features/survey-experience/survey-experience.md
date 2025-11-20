## 1. Step types

We’ll keep only **survey-ish** steps for now, no `info`:

```ts
export type StepType =
  | "multiple-choice"
  | "yes-no"
  | "opinion-scale"
  | "short-text"
  | "long-text"
  | "email"
  | "statement";
```

---

## 2. `StepBase` (nullable instead of optional)

Key changes:

- `label` → **`title`**
- `content` → **`body`**
- Only **one** `ctaLabel`
- All “maybe” fields are **`... | null`**, not optional

```ts
// /events/{eventId}/steps/{stepId}
export interface StepBase {
  id: string;
  eventId: string;
  type: StepType;

  title: string | null; // question / heading
  body: string | null; // description / helper text block

  required: boolean | null; // null = use experience-level / default behaviour
  helperText: string | null; // small hint / explainer
  mediaUrl: string | null; // image/video to show with the step

  // Optional override for main CTA label on this step
  // (e.g. "Submit feedback" on the last step)
  ctaLabel: string | null;

  createdAt: number;
  updatedAt: number;
}
```

Zod shape (just to illustrate intent):

```ts
const StepBaseSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  type: z.enum([
    "multiple-choice",
    "yes-no",
    "opinion-scale",
    "short-text",
    "long-text",
    "email",
    "statement",
  ]),
  title: z.string().nullable(),
  body: z.string().nullable(),
  required: z.boolean().nullable(),
  helperText: z.string().nullable(),
  mediaUrl: z.string().nullable(),
  ctaLabel: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
```

---

## 3. Configs per step type (nullable fields, no CTA in config)

We’ll keep configs focused on **input behaviour**, not CTA.

### 3.1 Multiple choice

```ts
export interface MultipleChoiceConfig {
  options: string[]; // must be non-empty
  allowMultiple: boolean | null;
}
```

### 3.2 Yes / No

```ts
export interface YesNoConfig {
  // Custom labels; if null → default ["Yes", "No"]
  yesLabel: string | null;
  noLabel: string | null;
}
```

### 3.3 Opinion scale

```ts
export interface OpinionScaleConfig {
  minValue: number; // e.g. 1
  maxValue: number; // e.g. 5 or 10
  minLabel: string | null; // e.g. "Not at all likely"
  maxLabel: string | null; // e.g. "Extremely likely"
}
```

### 3.4 Text (short / long)

```ts
export interface TextConfig {
  placeholder: string | null;
  maxLength: number | null; // if null → no explicit limit
}
```

We’ll reuse `TextConfig` for both `"short-text"` and `"long-text"`; UI decides how tall the field is.

### 3.5 Email

```ts
export interface EmailConfig {
  placeholder: string | null;
  validationPattern: string | null; // e.g. custom regex if you ever need it
}
```

### 3.6 Statement (read-only)

No extra config needed; we’ll explicitly set `config: null`.

---

## 4. Final discriminated union

```ts
export type Step =
  | (StepBase & {
      type: "multiple-choice";
      config: MultipleChoiceConfig;
    })
  | (StepBase & {
      type: "yes-no";
      config: YesNoConfig;
    })
  | (StepBase & {
      type: "opinion-scale";
      config: OpinionScaleConfig;
    })
  | (StepBase & {
      type: "short-text";
      config: TextConfig;
    })
  | (StepBase & {
      type: "long-text";
      config: TextConfig;
    })
  | (StepBase & {
      type: "email";
      config: EmailConfig;
    })
  | (StepBase & {
      type: "statement";
      config: null; // explicit, Zod: z.null()
    });
```

### Firestore example

```jsonc
{
  "id": "step_nps",
  "eventId": "event123",
  "type": "opinion-scale",

  "title": "How likely are you to recommend this experience to a friend?",
  "body": null,
  "required": true,
  "helperText": "0 = Not likely, 10 = Very likely",
  "mediaUrl": null,
  "ctaLabel": null,

  "config": {
    "minValue": 0,
    "maxValue": 10,
    "minLabel": "Not likely",
    "maxLabel": "Very likely"
  },

  "createdAt": 1731955200000,
  "updatedAt": 1731955200000
}
```

---

## 5. Behaviour recap

- **Ordering**
  Steps **do not** store any order index.
  Order is defined **only** via:

  ```ts
  SurveyExperience.config.stepsOrder: string[];
  ```

  Runtime:

  1. Load survey experience.
  2. Read `stepsOrder`.
  3. Fetch corresponding steps from `/events/{eventId}/steps/{stepId}`.
  4. Render in that order.

- **CTA label**

  - Default CTA text (e.g. “Next”, “Submit”) comes from the client.
  - `step.ctaLabel` is an optional **override** for that particular step.
  - Many step types (e.g. multiple-choice, yes-no) will simply leave it `null` most of the time.

- **Validation**

  - `required === true` → can’t continue without a valid answer.
  - `required === null` → client can treat as “use default rule” (e.g. default to required for some types).

Absolutely — here’s the **clean, final clarification** to add to the model:

---

# ✅ Add `preEndingExpId` to Event (global pre-result experience)

We will place the **global pre-ending survey reference** directly on the **Event** document.

This field:

```ts
preEndingExpId: string | null;
```

- Must reference an **Experience** of type `"survey"`.
- Controls **which survey experience (if any)** is injected **between capture and ending**.

### 🔧 Event update

```ts
interface Event {
  // ...existing fields...

  /**
   * The ID of a survey experience to run before the global ending screen.
   * Applies ONLY to capture experiences (photo/video/gif/wheel).
   *
   * If null → no pre-ending flow.
   * If participant has already completed this survey → skip automatically.
   */
  preEndingExpId: string | null;
}
```
