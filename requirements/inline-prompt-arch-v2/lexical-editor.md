# Lexical Editor Integration

**Part of**: [Inline Prompt Architecture (v2)](./README.md)

---

## Overview

The Lexical editor provides visual prompt editing with autocomplete for step and media references. Users type `@` to insert mentions, which are rendered as colored pills.

**Visual Example**:
```
"Transform @captureStep into hobbit @petStep. Style: @artStyle"
           [blue pill]              [blue pill]     [green pill]
```

---

## Mention Node Types

### 1. StepMentionNode

Represents a reference to an experience step.

```typescript
import { DecoratorNode, NodeKey } from 'lexical'

class StepMentionNode extends DecoratorNode<JSX.Element> {
  __stepName: string

  constructor(stepName: string, key?: NodeKey) {
    super(key)
    this.__stepName = stepName
  }

  static getType(): string {
    return 'step-mention'
  }

  getStepName(): string {
    return this.__stepName
  }

  // Serialize to storage format
  exportText(): string {
    return `@{step:${this.__stepName}}`
  }

  // Render as blue pill
  decorate(): JSX.Element {
    return (
      <StepMentionPill
        stepName={this.__stepName}
        color="blue"
      />
    )
  }

  // Create from JSON (for deserialization)
  static importJSON(serializedNode: SerializedStepMentionNode): StepMentionNode {
    return $createStepMentionNode(serializedNode.stepName)
  }

  // Export to JSON (for serialization)
  exportJSON(): SerializedStepMentionNode {
    return {
      type: 'step-mention',
      version: 1,
      stepName: this.__stepName,
    }
  }

  // ... other Lexical node methods (clone, updateDOM, etc.)
}

export function $createStepMentionNode(stepName: string): StepMentionNode {
  return new StepMentionNode(stepName)
}

export function $isStepMentionNode(node: any): node is StepMentionNode {
  return node instanceof StepMentionNode
}
```

---

### 2. MediaMentionNode

Represents a reference to refMedia.

```typescript
class MediaMentionNode extends DecoratorNode<JSX.Element> {
  __mediaAssetId: string
  __displayName: string

  constructor(mediaAssetId: string, displayName: string, key?: NodeKey) {
    super(key)
    this.__mediaAssetId = mediaAssetId
    this.__displayName = displayName
  }

  static getType(): string {
    return 'media-mention'
  }

  getMediaAssetId(): string {
    return this.__mediaAssetId
  }

  getDisplayName(): string {
    return this.__displayName
  }

  // Serialize to storage format (mediaAssetId)
  exportText(): string {
    return `@{ref:${this.__mediaAssetId}}`
  }

  // Render as green pill (displayName)
  decorate(): JSX.Element {
    return (
      <MediaMentionPill
        displayName={this.__displayName}
        color="green"
      />
    )
  }

  // Create from JSON
  static importJSON(serializedNode: SerializedMediaMentionNode): MediaMentionNode {
    return $createMediaMentionNode(
      serializedNode.mediaAssetId,
      serializedNode.displayName
    )
  }

  // Export to JSON
  exportJSON(): SerializedMediaMentionNode {
    return {
      type: 'media-mention',
      version: 1,
      mediaAssetId: this.__mediaAssetId,
      displayName: this.__displayName,
    }
  }

  // ... other Lexical node methods
}

export function $createMediaMentionNode(
  mediaAssetId: string,
  displayName: string
): MediaMentionNode {
  return new MediaMentionNode(mediaAssetId, displayName)
}

export function $isMediaMentionNode(node: any): node is MediaMentionNode {
  return node instanceof MediaMentionNode
}
```

---

## Mention Pills (UI Components)

### StepMentionPill

```typescript
interface StepMentionPillProps {
  stepName: string
  color: 'blue'
}

function StepMentionPill({ stepName, color }: StepMentionPillProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium"
      contentEditable={false}
    >
      <span className="text-xs">@</span>
      {stepName}
    </span>
  )
}
```

---

### MediaMentionPill

```typescript
interface MediaMentionPillProps {
  displayName: string
  color: 'green'
}

function MediaMentionPill({ displayName, color }: MediaMentionPillProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-sm font-medium"
      contentEditable={false}
    >
      <span className="text-xs">@</span>
      {displayName}
    </span>
  )
}
```

---

## Autocomplete Configuration

### LexicalMentionConfig

```typescript
interface LexicalMentionConfig {
  steps: Array<{
    name: string        // Step name (e.g., "captureStep")
    type: string        // Step type (e.g., "capture-photo")
  }>

  refMedia: Array<{
    mediaAssetId: string   // Storage ID
    displayName: string    // Display name
    url: string           // For thumbnail preview
  }>
}
```

### Usage in AI Node Editor

```typescript
<PromptEditor
  value={node.config.prompt}
  onChange={(newPrompt) => updateNode({ prompt: newPrompt })}
  mentions={{
    steps: experience.steps.map(s => ({
      name: s.name,
      type: s.type,
    })),
    refMedia: node.config.refMedia.map(m => ({
      mediaAssetId: m.mediaAssetId,
      displayName: m.displayName || deriveDisplayName(m.filePath),
      url: m.url,
    }))
  }}
/>
```

---

## Autocomplete UI

### MentionAutocomplete Component

```typescript
interface MentionAutocompleteProps {
  query: string
  steps: Array<{ name: string; type: string }>
  refMedia: Array<{ mediaAssetId: string; displayName: string; url: string }>
  onSelect: (type: 'step' | 'refMedia', id: string, displayName?: string) => void
}

function MentionAutocomplete({
  query,
  steps,
  refMedia,
  onSelect
}: MentionAutocompleteProps) {
  const filteredSteps = steps.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  )

  const filteredMedia = refMedia.filter(m =>
    m.displayName.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="autocomplete-menu bg-white border rounded-lg shadow-lg">
      {/* Steps section */}
      {filteredSteps.length > 0 && (
        <div className="section">
          <div className="section-label px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
            Steps
          </div>
          {filteredSteps.map(step => (
            <div
              key={step.name}
              onClick={() => onSelect('step', step.name)}
              className="item px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
            >
              <StepIcon type={step.type} className="w-4 h-4 text-gray-400" />
              <span className="name text-sm">@{step.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* RefMedia section */}
      {filteredMedia.length > 0 && (
        <div className="section">
          <div className="section-label px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
            Media
          </div>
          {filteredMedia.map(media => (
            <div
              key={media.mediaAssetId}
              onClick={() => onSelect('refMedia', media.mediaAssetId, media.displayName)}
              className="item px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
            >
              <img src={media.url} className="thumbnail w-8 h-8 rounded object-cover" />
              <span className="name text-sm">@{media.displayName}</span>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {filteredSteps.length === 0 && filteredMedia.length === 0 && (
        <div className="px-3 py-4 text-sm text-gray-500 text-center">
          No matches found
        </div>
      )}
    </div>
  )
}
```

---

## MentionsPlugin

The plugin handles `@` trigger and autocomplete insertion.

```typescript
interface MentionsPluginProps {
  steps: Array<{ name: string; type: string }>
  refMedia: Array<{ mediaAssetId: string; displayName: string; url: string }>
}

function MentionsPlugin({ steps, refMedia }: MentionsPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [query, setQuery] = useState<string | null>(null)

  // Listen for '@' character
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          setQuery(null)
          return
        }

        const textContent = selection.getTextContent()
        const match = textContent.match(/@(\w*)$/)

        if (match) {
          setQuery(match[1])
        } else {
          setQuery(null)
        }
      })
    })
  }, [editor])

  // Handle selection from autocomplete
  const handleSelect = (
    type: 'step' | 'refMedia',
    id: string,
    displayName?: string
  ) => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      // Remove '@query' text
      // ...

      // Insert appropriate mention node
      if (type === 'step') {
        const node = $createStepMentionNode(id)
        selection.insertNodes([node])
      } else {
        const node = $createMediaMentionNode(id, displayName!)
        selection.insertNodes([node])
      }

      // Add trailing space
      selection.insertText(' ')
    })

    setQuery(null)
  }

  return query !== null ? (
    <MentionAutocomplete
      query={query}
      steps={steps}
      refMedia={refMedia}
      onSelect={handleSelect}
    />
  ) : null
}
```

---

## Serialization & Deserialization

### serializeToPlainText

Converts Lexical EditorState to storage format.

```typescript
/**
 * Serialize Lexical EditorState to plain text with @{type:name} patterns
 */
function serializeToPlainText(editorState: EditorState): string {
  let text = ''

  editorState.read(() => {
    const root = $getRoot()
    text = root.getTextContent()  // Calls exportText() on all nodes
  })

  return text
}
```

**Example**:
```typescript
// Lexical nodes:
// - TextNode("Transform ")
// - StepMentionNode("captureStep")
// - TextNode(" with ")
// - MediaMentionNode("abc123xyz", "artStyle")

// Serialized output:
"Transform @{step:captureStep} with @{ref:abc123xyz}"
```

---

### deserializeFromPlainText

Converts storage format to Lexical EditorState.

```typescript
/**
 * Deserialize plain text to Lexical EditorState with mention nodes
 */
function deserializeFromPlainText(
  text: string,
  steps: ExperienceStep[],
  refMedia: RefMediaEntry[],
): EditorState {
  const editor = createEditor({
    nodes: [StepMentionNode, MediaMentionNode, /* ... */]
  })

  editor.update(() => {
    const root = $getRoot()
    root.clear()

    const paragraph = $createParagraphNode()

    // Parse text and create nodes
    const parts = parseTextWithMentions(text)

    for (const part of parts) {
      if (part.type === 'text') {
        paragraph.append($createTextNode(part.content))
      } else if (part.type === 'step') {
        paragraph.append($createStepMentionNode(part.stepName))
      } else if (part.type === 'ref') {
        // Lookup displayName from refMedia
        const media = refMedia.find(m => m.mediaAssetId === part.mediaAssetId)
        const displayName = media?.displayName || part.mediaAssetId
        paragraph.append($createMediaMentionNode(part.mediaAssetId, displayName))
      }
    }

    root.append(paragraph)
  })

  return editor.getEditorState()
}
```

---

### parseTextWithMentions

Helper to parse storage format into parts.

```typescript
interface TextPart {
  type: 'text'
  content: string
}

interface StepPart {
  type: 'step'
  stepName: string
}

interface RefPart {
  type: 'ref'
  mediaAssetId: string
}

type ParsedPart = TextPart | StepPart | RefPart

function parseTextWithMentions(text: string): ParsedPart[] {
  const parts: ParsedPart[] = []
  const regex = /@\{(step|ref):([a-zA-Z0-9_-]+)\}/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      })
    }

    // Add mention
    const mentionType = match[1]
    const identifier = match[2]

    if (mentionType === 'step') {
      parts.push({ type: 'step', stepName: identifier })
    } else {
      parts.push({ type: 'ref', mediaAssetId: identifier })
    }

    lastIndex = regex.lastIndex
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    })
  }

  return parts
}
```

---

## PromptEditor Component

Main editor component for AI node prompt.

```typescript
interface PromptEditorProps {
  value: string                     // Storage format
  onChange: (value: string) => void // Returns storage format
  mentions: LexicalMentionConfig
}

function PromptEditor({ value, onChange, mentions }: PromptEditorProps) {
  const initialConfig = {
    namespace: 'PromptEditor',
    nodes: [StepMentionNode, MediaMentionNode],
    onError: (error: Error) => console.error(error),
  }

  const [editorState, setEditorState] = useState(() =>
    deserializeFromPlainText(value, /* steps */, /* refMedia */)
  )

  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState)

    // Serialize and notify parent
    const serialized = serializeToPlainText(newEditorState)
    onChange(serialized)
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-2" />
          }
          placeholder={
            <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
              Type @ to mention steps or media...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <MentionsPlugin steps={mentions.steps} refMedia={mentions.refMedia} />
        <OnChangePlugin onChange={handleChange} />
        <CharacterCountPlugin />
      </div>
    </LexicalComposer>
  )
}
```

---

## Character Count Plugin

Displays character count below editor.

```typescript
function CharacterCountPlugin() {
  const [editor] = useLexicalComposerContext()
  const [count, setCount] = useState(0)

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent()
        setCount(text.length)
      })
    })
  }, [editor])

  return (
    <div className="text-xs text-gray-500 mt-1">
      {count} characters
    </div>
  )
}
```

---

## Code Reuse from AI Presets

### Reusable (~90%)

From `domains/ai-presets/lexical/`:

- ✅ DecoratorNode pattern
- ✅ MentionsPlugin structure
- ✅ Autocomplete UI layout
- ✅ Serialization utilities
- ✅ Smart paste plugin (convert plain @mentions)

### Adaptations Needed

- Change mention types: `text`/`input`/`ref` → `step`/`ref`
- Update autocomplete data source: preset variables → experience steps
- Adjust serialization format: `@{text:var}` → `@{step:stepName}`
- Add displayName lookup for media mentions

**New Location**: `domains/experience/designer/transform/lexical/`

---

## Related Documents

- [Architecture](./architecture.md) - System overview
- [Three-Format System](./three-format-system.md) - Format specifications
- [Data Models](./data-models.md) - Schema definitions
- [User Workflows](./user-workflows.md) - How users interact with editor
