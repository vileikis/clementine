# Step Renderer Props Contract

**Feature**: 030-session-runtime-capture
**Date**: 2026-01-15

## Overview

This document defines the contract for step renderer props in run mode. Step renderers must support both edit and run modes via a discriminated `mode` prop.

---

## Base Props Interface

```typescript
interface StepRendererProps {
  /** The step to render */
  step: Step

  /** Rendering mode - edit for designer, run for execution */
  mode: 'edit' | 'run'

  /** Current answer value (run mode only) */
  answer?: unknown

  /** Callback when user provides/updates answer (run mode only) */
  onAnswer?: (value: unknown) => void

  /** Callback when step should advance (run mode only) */
  onSubmit?: () => void

  /** Callback to go back (run mode only) */
  onBack?: () => void

  /** Whether back navigation is available (run mode only) */
  canGoBack?: boolean
}
```

---

## Mode-Specific Behavior

### Edit Mode

In edit mode, renderers display a **preview** of how the step will appear to guests. User input is disabled.

**Active Props**:
- `step` - Step configuration to preview
- `mode` - Set to `'edit'`

**Ignored Props**:
- `answer` - Not applicable
- `onAnswer` - Not applicable
- `onSubmit` - Not applicable
- `onBack` - Not applicable
- `canGoBack` - Not applicable

---

### Run Mode

In run mode, renderers are **interactive**. Users can provide input and navigate.

**Active Props**:
- `step` - Step configuration
- `mode` - Set to `'run'`
- `answer` - Current answer (if any)
- `onAnswer` - Called when user provides/changes input
- `onSubmit` - Called when user clicks Continue
- `onBack` - Called when user clicks Back
- `canGoBack` - Controls Back button visibility

---

## Renderer Implementations

### Info Step

**File**: `InfoStepRenderer.tsx`

**Edit Mode Behavior**:
- Display title, description, media preview
- Non-interactive

**Run Mode Behavior**:
- Display title, description, media
- Show Continue button (always enabled)
- Show Back button if `canGoBack` is true

**Props Used**:
| Prop | Used |
|------|------|
| `step` | Yes |
| `mode` | Yes |
| `answer` | No (info steps don't collect data) |
| `onAnswer` | No |
| `onSubmit` | Yes |
| `onBack` | Yes |
| `canGoBack` | Yes |

---

### Input Scale

**File**: `InputScaleRenderer.tsx`

**Edit Mode Behavior**:
- Display question and scale buttons (disabled)
- Show configured min/max labels

**Run Mode Behavior**:
- Display question
- Render clickable scale buttons
- Highlight selected value
- Continue enabled when value selected

**Props Used**:
| Prop | Used |
|------|------|
| `step` | Yes |
| `mode` | Yes |
| `answer` | Yes - `number` |
| `onAnswer` | Yes - `(value: number) => void` |
| `onSubmit` | Yes |
| `onBack` | Yes |
| `canGoBack` | Yes |

**Validation**:
- `answer` must be within `config.min` and `config.max`

---

### Input Yes/No

**File**: `InputYesNoRenderer.tsx`

**Edit Mode Behavior**:
- Display question and Yes/No buttons (disabled)

**Run Mode Behavior**:
- Display question
- Render clickable Yes/No buttons
- Highlight selected option
- Auto-advance on selection (or Continue after selection)

**Props Used**:
| Prop | Used |
|------|------|
| `step` | Yes |
| `mode` | Yes |
| `answer` | Yes - `boolean` |
| `onAnswer` | Yes - `(value: boolean) => void` |
| `onSubmit` | Yes |
| `onBack` | Yes |
| `canGoBack` | Yes |

**Validation**:
- `answer` must be `true` or `false`

---

### Input Multi-Select

**File**: `InputMultiSelectRenderer.tsx`

**Edit Mode Behavior**:
- Display question and options (disabled)
- Show configured single/multi mode

**Run Mode Behavior**:
- Display question
- Render options as checkboxes (multi) or radio buttons (single)
- Track selected options
- Validate min/max selection counts
- Continue enabled when selection is valid

**Props Used**:
| Prop | Used |
|------|------|
| `step` | Yes |
| `mode` | Yes |
| `answer` | Yes - `string[]` (option IDs) |
| `onAnswer` | Yes - `(value: string[]) => void` |
| `onSubmit` | Yes |
| `onBack` | Yes |
| `canGoBack` | Yes |

**Validation**:
- If `config.allowMultiple`:
  - `answer.length >= config.minSelections`
  - `answer.length <= config.maxSelections`
- If not `config.allowMultiple`:
  - `answer.length === 1`

---

### Input Short Text

**File**: `InputShortTextRenderer.tsx`

**Edit Mode Behavior**:
- Display question and placeholder input (disabled)
- Show max length indicator

**Run Mode Behavior**:
- Display question
- Render text input
- Show character count if approaching max
- Validate max length
- Continue enabled when input is valid

**Props Used**:
| Prop | Used |
|------|------|
| `step` | Yes |
| `mode` | Yes |
| `answer` | Yes - `string` |
| `onAnswer` | Yes - `(value: string) => void` |
| `onSubmit` | Yes |
| `onBack` | Yes |
| `canGoBack` | Yes |

**Validation**:
- `answer.length <= config.maxLength`
- If required: `answer.length > 0`

---

### Input Long Text

**File**: `InputLongTextRenderer.tsx`

**Edit Mode Behavior**:
- Display question and placeholder textarea (disabled)
- Show max length indicator

**Run Mode Behavior**:
- Display question
- Render textarea
- Show character count
- Validate max length
- Continue enabled when input is valid

**Props Used**:
| Prop | Used |
|------|------|
| `step` | Yes |
| `mode` | Yes |
| `answer` | Yes - `string` |
| `onAnswer` | Yes - `(value: string) => void` |
| `onSubmit` | Yes |
| `onBack` | Yes |
| `canGoBack` | Yes |

**Validation**:
- `answer.length <= config.maxLength`
- If required: `answer.length > 0`

---

### Capture Photo (Placeholder)

**File**: `CapturePhotoRenderer.tsx`

**Edit Mode Behavior**:
- Display capture configuration preview
- Show instructions if configured

**Run Mode Behavior (Placeholder)**:
- Display "Camera capture" message
- Show configured instructions
- Continue button (always enabled, skips capture)

**Props Used**:
| Prop | Used |
|------|------|
| `step` | Yes |
| `mode` | Yes |
| `answer` | No (placeholder doesn't capture) |
| `onAnswer` | No |
| `onSubmit` | Yes |
| `onBack` | Yes |
| `canGoBack` | Yes |

**Note**: Full camera integration deferred to E5.2

---

### Transform Pipeline (Placeholder)

**File**: `TransformPipelineRenderer.tsx`

**Edit Mode Behavior**:
- Display transform configuration
- Show pipeline stages

**Run Mode Behavior (Placeholder)**:
- Display "Processing..." message
- Continue button (always enabled, skips transform)

**Props Used**:
| Prop | Used |
|------|------|
| `step` | Yes |
| `mode` | Yes |
| `answer` | No (placeholder doesn't process) |
| `onAnswer` | No |
| `onSubmit` | Yes |
| `onBack` | Yes |
| `canGoBack` | Yes |

**Note**: Full transform processing deferred to E9

---

## StepLayout Component

All renderers use `StepLayout` for consistent navigation UI.

```typescript
interface StepLayoutProps {
  children: ReactNode

  /** Called when Continue/Submit is clicked */
  onSubmit?: () => void

  /** Called when Back is clicked */
  onBack?: () => void

  /** Whether Back button should be shown */
  canGoBack?: boolean

  /** Whether Continue button is enabled */
  canProceed?: boolean

  /** Custom continue button text */
  continueLabel?: string
}
```

**Usage**:

```tsx
export function InfoStepRenderer({ step, mode, onSubmit, onBack, canGoBack }: StepRendererProps) {
  if (mode === 'edit') {
    return <InfoEditPreview config={step.config} />
  }

  return (
    <StepLayout
      onSubmit={onSubmit}
      onBack={onBack}
      canGoBack={canGoBack}
      canProceed={true}
    >
      <div className="space-y-4">
        <h2>{step.config.title}</h2>
        <p>{step.config.description}</p>
      </div>
    </StepLayout>
  )
}
```
