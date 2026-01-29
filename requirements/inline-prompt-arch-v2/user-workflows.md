# User Workflows

**Part of**: [Inline Prompt Architecture (v2)](./README.md)

---

## Workflow 1: Create Experience with Inline AI Prompt

**User Goal**: Build new experience with AI transformation

### Steps

#### 1. Create Experience

- Name: "Hobbit Portrait"
- Navigate to experience designer

#### 2. Define Steps

**Add capture step:**
- Step name: `captureStep`
- Type: Photo upload

**Add multiselect step:**
- Step name: `petStep`
- Title: "Choose your companion"
- Options:
  - **Option 1**:
    - Value: "cat"
    - Prompt Fragment: "holding a grumpy cat"
    - Prompt Media: Upload cat image
  - **Option 2**:
    - Value: "dog"
    - Prompt Fragment: "holding a happy dog"
    - Prompt Media: Upload dog image

#### 3. Add AI Image Node to Transform Pipeline

- Click "Add Node" → "AI Image Generation"
- Opens AI node editor

#### 4. Configure AI Node

**Model Settings:**
- Model: "gemini-2.5-pro"
- Aspect Ratio: "3:2"

**RefMedia:**
- Upload "artStyle" image
- Auto-generates displayName: "artStyle"

**Prompt (in Lexical editor):**
1. Type: "Transform @"
2. Autocomplete shows steps
3. Select `@captureStep` (blue pill appears)
4. Type: " into hobbit "
5. Type: "@"
6. Select `@petStep` (blue pill appears)
7. Type: ". Style: @"
8. Select `@artStyle` (green pill appears)

**Result:**
- Display: `"Transform @captureStep into hobbit @petStep. Style: @artStyle"`
- Storage: `"Transform @{step:captureStep} into hobbit @{step:petStep}. Style: @{ref:abc123xyz}"`

#### 5. Test Run

1. Click "Test Run" button
2. Dialog opens with test input form:
   - `captureStep`: Upload test photo
   - `petStep`: Select "cat" from dropdown
3. See resolved prompt:
   - `"Transform <cap789> into hobbit holding a grumpy cat (see <cat123>). Style: <abc123xyz>"`
4. See media preview: 3 images
   - Capture photo (cap789)
   - Cat reference (cat123)
   - Art style (abc123xyz)
5. Validation: All green ✓ (no errors)

#### 6. Publish Experience

- Click "Publish"
- Experience ready for events

---

## Workflow 2: Edit Existing AI Node

**User Goal**: Update prompt in existing experience

### Steps

#### 1. Open Experience

- Navigate to experience designer
- Switch to transform pipeline tab

#### 2. Edit AI Node

- Click on AI Image node card
- Opens editor with current config

#### 3. Update Prompt

- Lexical editor shows: `"Transform @captureStep into hobbit @petStep. Style: @artStyle"`
- Edit: Add "with dramatic lighting" at end
- Mentions remain intact (pills are stable)
- Auto-saves

#### 4. Test Changes

- Click "Test Run"
- Enter test inputs
- Verify resolved prompt looks correct

#### 5. Publish Changes

- Click "Publish" in experience

---

## Workflow 3: Add RefMedia to Existing Node

**User Goal**: Add new reference image to prompt

### Steps

#### 1. Open AI Node Editor

- Navigate to node in transform pipeline
- Click to open editor

#### 2. RefMedia Section

- Click "Add Media"
- Upload image or select from library
- Auto-generated displayName: "overlay" (from fileName)
- Edit displayName: "frameStyle"

#### 3. Update Prompt

- Place cursor in Lexical editor
- Type "@"
- Autocomplete now shows "frameStyle"
- Select `@frameStyle` (green pill appears)
- Prompt now includes new media reference

#### 4. Test and Publish

- Test run to verify
- Publish changes

---

## Workflow 4: Configure Multiselect with AI Options

**User Goal**: Set up AI-aware multiselect options

### Steps

#### 1. Create/Edit Multiselect Step

- Navigate to step editor
- Step type: "Multi-select"

#### 2. Add Option

- Click "Add Option"
- Enter value: "cat"

#### 3. Configure AI Fields

**Prompt Fragment:**
- Label: "Prompt Fragment (optional)"
- Enter: "holding a grumpy cat"
- Help text: "Text to insert when this option is selected"

**Prompt Media:**
- Label: "Prompt Media (optional)"
- Click "Upload"
- Select cat image
- Thumbnail appears

#### 4. Visual Indicator

- Badge shows "AI-enabled" on option card
- Clear visual distinction from basic options

#### 5. Repeat for Other Options

- Add "dog" option
- Set promptFragment: "holding a happy dog"
- Upload dog image

#### 6. Save

- Auto-saves to experience draft

---

## Workflow 5: Test Run with Multiple Inputs

**User Goal**: Preview how prompt resolves with different inputs

### Steps

#### 1. Open Test Run Dialog

- Click "Test Run" on AI node
- Dialog opens

#### 2. Enter Test Inputs

**Form fields generated from prompt:**
- `captureStep` (Photo upload):
  - Upload test selfie
- `petStep` (Dropdown):
  - Select "cat"

#### 3. Real-Time Resolution

- Resolved prompt updates as inputs change:
  - Initial: `"Transform <missing> into hobbit <missing>. Style: <abc123xyz>"`
  - After uploads: `"Transform <cap789> into hobbit holding a grumpy cat (see <cat123>). Style: <abc123xyz>"`

#### 4. Media Preview

Shows 3 thumbnails:
1. **Capture** (from captureStep): Test selfie
2. **Cat** (from petStep option): Cat reference image
3. **Art Style** (from refMedia): Style guide

#### 5. Validation Display

**Status: Valid ✓**
- All required inputs provided
- All references resolved
- No warnings

#### 6. Try Different Selection

- Change petStep to "dog"
- Resolved prompt updates:
  - `"Transform <cap789> into hobbit holding a happy dog (see <dog456>). Style: <abc123xyz>"`
- Media preview updates (dog image replaces cat)

---

## Workflow 6: Handle Validation Errors

**User Goal**: Fix issues before testing

### Steps

#### 1. Missing Required Input

**Scenario**: Forgot to upload capture photo

**Validation Display**:
```
Status: Incomplete ❌
Errors:
- Image required for step 'captureStep'
```

**Action**: Upload test photo → Error clears

#### 2. Undefined Step Reference

**Scenario**: Renamed step but didn't update prompt

**Validation Display**:
```
Status: Invalid ⚠️
Errors:
- Step 'oldStepName' not found
```

**Action**: Edit prompt, replace with correct step

#### 3. DisplayName Collision

**Scenario**: Two refMedia with same displayName

**Validation Display**:
```
Status: Invalid ⚠️
Errors:
- DisplayName 'overlay' is used by multiple media. Names must be unique.
```

**Action**: Edit one displayName to be unique

---

## Workflow 7: Multi-Selection with Multiple Pets

**User Goal**: Allow guests to select multiple companions

### Steps

#### 1. Configure Multiselect Step

- Enable "Allow multiple selections"
- Add options: cat, dog, bird

#### 2. Configure Prompt

- Write: `"Transform @captureStep with @petsStep"`

#### 3. Test Run

**Inputs**:
- Select: cat, dog

**Resolved**:
```
"Transform <cap789> with holding a grumpy cat (see <cat123>), holding a happy dog (see <dog456>)"
```

**Media Preview**: Shows capture + cat + dog images

---

## Workflow 8: Text Input in Prompt

**User Goal**: Add custom text from user input

### Steps

#### 1. Add Text Step

- Step name: `outfitStep`
- Title: "What should they wear?"
- Type: Short text

#### 2. Update Prompt

- Write: `"Person wearing @outfitStep"`

#### 3. Test Run

**Input**:
- Enter: "wizard robes"

**Resolved**:
```
"Person wearing wizard robes"
```

---

## Workflow 9: Copy AI Node to Another Experience

**User Goal**: Reuse prompt configuration

### Steps

#### 1. Open Source Experience

- Navigate to transform pipeline

#### 2. Copy Node (Future Enhancement)

- Click node → "Copy"
- Configuration copied to clipboard

#### 3. Open Target Experience

- Navigate to transform pipeline

#### 4. Paste Node

- Click "Paste Node"
- Node inserted with same config
- RefMedia carried over
- Step references may need updating

---

## Common User Patterns

### Pattern 1: Style Reference Library

Users build refMedia library for consistent branding:

```
refMedia: [
  { displayName: "brandColors" },
  { displayName: "logo" },
  { displayName: "artStyle" }
]

Prompt: "Transform @capture. Brand: @brandColors @logo. Style: @artStyle"
```

### Pattern 2: Option Templates

Users create option sets for common scenarios:

```
Pet options:
- cat: "holding a grumpy cat" + cat image
- dog: "holding a happy dog" + dog image
- bird: "with a colorful parrot" + bird image

Clothing options:
- casual: "wearing casual clothes"
- formal: "wearing formal attire"
- costume: "in a @costumeType costume"
```

### Pattern 3: Layered Prompts

Users combine multiple step inputs:

```
"Transform @capture into @character wearing @outfit in @location setting. Style: @artStyle"
```

---

## Error Recovery Workflows

### Scenario 1: Accidental Step Deletion

**Problem**: Deleted step referenced in prompt

**Recovery**:
1. Validation shows error: "Step 'petStep' not found"
2. User recreates step with same name
3. Error clears automatically

### Scenario 2: RefMedia Upload Failed

**Problem**: Upload interrupted, media not saved

**Recovery**:
1. Validation shows warning: "Media 'abc123xyz' not found"
2. User re-uploads media
3. Existing reference remains valid (mediaAssetId stable)

### Scenario 3: Lost Unsaved Changes

**Problem**: Closed editor without saving

**Recovery**:
- Auto-save prevents data loss
- Changes saved every 2 seconds
- No manual save needed

---

## Best Practices for Users

### 1. Naming Conventions

**Steps**:
- Use descriptive names: `captureStep`, `petStep`, `outfitStep`
- Avoid generic names: `step1`, `input2`

**DisplayNames**:
- Use semantic names: `artStyle`, `brandLogo`, `frameOverlay`
- Keep short and memorable

### 2. Prompt Structure

**Clear structure**:
```
"Transform @capture into @character wearing @outfit. Style: @artStyle"
```

**Not cluttered**:
```
"@capture @character @outfit @artStyle"  // Hard to understand
```

### 3. Test Thoroughly

- Test with real images (not placeholders)
- Try all multiselect options
- Verify media preview shows correct images

### 4. Organize RefMedia

- Use consistent naming scheme
- Group related media (styles, overlays, logos)
- Delete unused media

---

## Related Documents

- [Architecture](./architecture.md) - System overview
- [Lexical Editor](./lexical-editor.md) - Editor implementation
- [Validation](./validation.md) - Error handling and validation rules
- [Resolution Algorithm](./resolution-algorithm.md) - How prompts resolve
