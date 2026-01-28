# Lexical Editor Framework Research (v0.39.0+)

**Date**: 2025-01-27
**Branch**: `043-ai-preset-editor`
**Purpose**: Research foundation for Phase 10 (T066-T076) - Migrating PromptTemplateEditor to Lexical

---

## Executive Summary

This document provides comprehensive research for implementing rich text editing with @mention functionality using the Lexical editor framework (v0.39.0+). The research covers core architecture, custom nodes, plugin implementation, text transformation, serialization, and best practices needed for migrating our contentEditable-based PromptTemplateEditor to Lexical.

**Key Finding**: For mention-like elements (variables, media), we should **extend TextNode** (not DecoratorNode) to maintain proper text selection behavior and performance.

---

## Table of Contents

1. [Core Architecture & Setup](#1-core-architecture--setup)
2. [Custom Nodes for Mentions](#2-custom-nodes-for-mentions)
3. [Mention Plugin Implementation](#3-mention-plugin-implementation)
4. [Smart Paste & Text Transformation](#4-smart-paste--text-transformation)
5. [Serialization & Persistence](#5-serialization--persistence)
6. [Performance & Best Practices](#6-performance--best-practices)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Common Pitfalls & Solutions](#8-common-pitfalls--solutions)
9. [Resources & References](#9-resources--references)

---

## 1. Core Architecture & Setup

### 1.1 LexicalComposer Setup

**Basic Structure:**

```typescript
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

const initialConfig = {
  namespace: 'PromptTemplateEditor',
  theme: editorTheme,
  onError: (error: Error) => {
    console.error(error);
    Sentry.captureException(error);
  },
  nodes: [VariableMentionNode, MediaMentionNode], // Custom nodes
};

function PromptTemplateEditor() {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-input" />}
        placeholder={<div>Write your prompt template...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <MentionsPlugin />
      <SmartPastePlugin />
    </LexicalComposer>
  );
}
```

**Key Configuration Options:**

- **namespace** (required): Unique identifier (e.g., `'PromptTemplateEditor'`)
- **theme**: CSS class mappings for styling
- **onError**: Error handler for graceful recovery
- **nodes**: Array of custom node classes (VariableMentionNode, MediaMentionNode)
- **editable**: Boolean to control edit mode (default: true)

**Important Notes:**

- `initialConfig` is only considered once during first render (uses `useMemo` internally)
- Lexical is **uncontrolled** - avoid passing EditorState back into `Editor.setEditorState()`
- All plugins must be children of `LexicalComposer`

### 1.2 EditorState & Updates

**EditorStates are immutable**. Updates must use `editor.update()`:

```typescript
editor.update(() => {
  // All modifications happen here
  const root = $getRoot();
  const selection = $getSelection();
  // Make changes to nodes
});
```

**Double-Buffering Technique:**

- One state represents what's currently on screen
- Another work-in-progress state represents future changes
- Multiple synchronous updates are batched into a single DOM update

**Read vs Write Operations:**

```typescript
// Writing (modifying state)
editor.update(() => {
  const selection = $getSelection();
  // Modify nodes, selection, etc.
});

// Reading (read-only)
editor.getEditorState().read(() => {
  const root = $getRoot();
  const text = root.getTextContent();
});
```

**Important:** The `$` prefix denotes functions that can **only be called inside** `editor.update()` or `editorState.read()` callbacks.

---

## 2. Custom Nodes for Mentions

### 2.1 Why TextNode Extension (Not DecoratorNode)

**Official Playground Pattern**: The Lexical playground implements MentionNode by **extending TextNode**, not DecoratorNode.

**Decision Matrix:**

| Feature | TextNode Extension | DecoratorNode |
|---------|-------------------|---------------|
| Selection behavior | ✅ Natural text selection | ❌ Selection becomes null |
| Cursor movement | ✅ Proper cursor flow | ❌ Awkward movement |
| Performance | ✅ Lightweight | ⚠️ More overhead (React portals) |
| Text-like inline elements | ✅ Perfect use case | ❌ Not ideal |
| Complex React components | ❌ Limited | ✅ Full React support |
| Copy/paste as text | ✅ Maintains flow | ⚠️ More complex |

**For mentions, variables, and media references**: Use **TextNode extension** for proper text editing behavior.

**For complex embeds (videos, widgets)**: Use **DecoratorNode** for full React component support.

### 2.2 MentionNode Implementation Pattern

**From Lexical Playground:**

```typescript
import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type EditorConfig,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
  TextNode,
} from 'lexical';

export type SerializedMentionNode = Spread<
  {
    mentionName: string;
  },
  SerializedTextNode
>;

export class MentionNode extends TextNode {
  __mention: string;

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mention, node.__text, node.__key);
  }

  static importJSON(serialized: SerializedMentionNode): MentionNode {
    const node = $createMentionNode(serialized.mentionName);
    node.updateFromJSON(serialized);
    return node;
  }

  constructor(mentionName: string, text?: string, key?: NodeKey) {
    super(text ?? mentionName, key);
    this.__mention = mentionName;
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      mentionName: this.__mention,
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.style.cssText = 'background-color: rgba(24, 119, 232, 0.2)';
    dom.className = 'mention';
    dom.spellcheck = false;
    return dom;
  }

  // Mark as text entity for proper handling
  isTextEntity(): true {
    return true;
  }

  // Prevent text insertion at boundaries
  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

export function $createMentionNode(mentionName: string): MentionNode {
  const mentionNode = new MentionNode(mentionName);
  mentionNode.setMode('segmented').toggleDirectionless();
  return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(node: any): node is MentionNode {
  return node instanceof MentionNode;
}
```

**Key Features:**

- `isTextEntity(): true` - Marks as text entity for proper handling
- `canInsertTextBefore/After(): false` - Blocks text insertion at boundaries
- `setMode('segmented')` - Makes mention atomic (select as a unit)
- `toggleDirectionless()` - Bidirectional text support

### 2.3 VariableMentionNode for AI Preset Editor

```typescript
export type SerializedVariableMentionNode = Spread<
  {
    variableId: string;
    variableName: string;
    variableType: 'text' | 'image';
  },
  SerializedTextNode
>;

export class VariableMentionNode extends TextNode {
  __variableId: string;
  __variableName: string;
  __variableType: 'text' | 'image';

  static getType(): string {
    return 'variable-mention';
  }

  static clone(node: VariableMentionNode): VariableMentionNode {
    return new VariableMentionNode(
      node.__variableId,
      node.__variableName,
      node.__variableType,
      node.__text,
      node.__key
    );
  }

  static importJSON(serialized: SerializedVariableMentionNode): VariableMentionNode {
    const node = $createVariableMentionNode(
      serialized.variableId,
      serialized.variableName,
      serialized.variableType
    );
    node.updateFromJSON(serialized);
    return node;
  }

  constructor(
    variableId: string,
    variableName: string,
    variableType: 'text' | 'image',
    text?: string,
    key?: NodeKey
  ) {
    super(text ?? `{${variableName}}`, key);
    this.__variableId = variableId;
    this.__variableName = variableName;
    this.__variableType = variableType;
  }

  exportJSON(): SerializedVariableMentionNode {
    return {
      ...super.exportJSON(),
      variableId: this.__variableId,
      variableName: this.__variableName,
      variableType: this.__variableType,
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = `variable-mention variable-type-${this.__variableType}`;
    dom.style.cssText = `
      background-color: ${this.__variableType === 'text' ? '#e3f2fd' : '#e8f5e9'};
      color: ${this.__variableType === 'text' ? '#1976d2' : '#2e7d32'};
      border-radius: 4px;
      padding: 2px 6px;
      font-family: monospace;
      font-weight: 500;
    `;
    dom.setAttribute('data-variable-id', this.__variableId);
    dom.setAttribute('data-variable-name', this.__variableName);
    dom.setAttribute('data-variable-type', this.__variableType);
    dom.spellcheck = false;
    return dom;
  }

  isTextEntity(): true {
    return true;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  getVariableId(): string {
    return this.__variableId;
  }

  getVariableName(): string {
    return this.__variableName;
  }

  getVariableType(): 'text' | 'image' {
    return this.__variableType;
  }
}

export function $createVariableMentionNode(
  variableId: string,
  variableName: string,
  variableType: 'text' | 'image'
): VariableMentionNode {
  const node = new VariableMentionNode(
    variableId,
    variableName,
    variableType,
    `{${variableName}}`
  );
  node.setMode('segmented').toggleDirectionless();
  return $applyNodeReplacement(node);
}

export function $isVariableMentionNode(node: any): node is VariableMentionNode {
  return node instanceof VariableMentionNode;
}
```

**Color Coding:**
- Text variables: Blue (`#e3f2fd` background, `#1976d2` text)
- Image variables: Green (`#e8f5e9` background, `#2e7d32` text)

### 2.4 MediaMentionNode for AI Preset Editor

```typescript
export type SerializedMediaMentionNode = Spread<
  {
    mediaId: string;
    mediaName: string;
  },
  SerializedTextNode
>;

export class MediaMentionNode extends TextNode {
  __mediaId: string;
  __mediaName: string;

  static getType(): string {
    return 'media-mention';
  }

  static clone(node: MediaMentionNode): MediaMentionNode {
    return new MediaMentionNode(
      node.__mediaId,
      node.__mediaName,
      node.__text,
      node.__key
    );
  }

  static importJSON(serialized: SerializedMediaMentionNode): MediaMentionNode {
    const node = $createMediaMentionNode(
      serialized.mediaId,
      serialized.mediaName
    );
    node.updateFromJSON(serialized);
    return node;
  }

  constructor(
    mediaId: string,
    mediaName: string,
    text?: string,
    key?: NodeKey
  ) {
    super(text ?? `@${mediaName}`, key);
    this.__mediaId = mediaId;
    this.__mediaName = mediaName;
  }

  exportJSON(): SerializedMediaMentionNode {
    return {
      ...super.exportJSON(),
      mediaId: this.__mediaId,
      mediaName: this.__mediaName,
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = 'media-mention';
    dom.style.cssText = `
      background-color: #f3e5f5;
      color: #7b1fa2;
      border-radius: 4px;
      padding: 2px 6px;
      font-family: monospace;
      font-weight: 500;
    `;
    dom.setAttribute('data-media-id', this.__mediaId);
    dom.setAttribute('data-media-name', this.__mediaName);
    dom.spellcheck = false;
    return dom;
  }

  isTextEntity(): true {
    return true;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  getMediaId(): string {
    return this.__mediaId;
  }

  getMediaName(): string {
    return this.__mediaName;
  }
}

export function $createMediaMentionNode(
  mediaId: string,
  mediaName: string
): MediaMentionNode {
  const node = new MediaMentionNode(mediaId, mediaName, `@${mediaName}`);
  node.setMode('segmented').toggleDirectionless();
  return $applyNodeReplacement(node);
}

export function $isMediaMentionNode(node: any): node is MediaMentionNode {
  return node instanceof MediaMentionNode;
}
```

**Color Coding:**
- Media: Purple (`#f3e5f5` background, `#7b1fa2` text)

### 2.5 Event Handling in Custom Nodes

**For click-to-remove functionality:**

```typescript
function MentionClickPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if clicking on mention pill
      if (
        target.classList.contains('variable-mention') ||
        target.classList.contains('media-mention')
      ) {
        editor.update(() => {
          const node = $getNearestNodeFromDOMNode(target);
          if ($isVariableMentionNode(node) || $isMediaMentionNode(node)) {
            // Show tooltip or context menu
            // For hover-to-delete, handle in CSS with ::after pseudo-element
          }
        });
      }
    };

    rootElement?.addEventListener('click', handleClick);
    return () => rootElement?.removeEventListener('click', handleClick);
  }, [editor]);

  return null;
}
```

**Alternative: Use NodeEventPlugin:**

```typescript
import { NodeEventPlugin } from '@lexical/react/LexicalNodeEventPlugin';

<NodeEventPlugin
  nodeType={VariableMentionNode}
  eventType="click"
  eventListener={(event, editor, nodeKey) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isVariableMentionNode(node)) {
        // Handle click
      }
    });
  }}
/>
```

---

## 3. Mention Plugin Implementation

### 3.1 Using LexicalTypeaheadMenuPlugin

**Official pattern from Lexical playground:**

```typescript
import { LexicalTypeaheadMenuPlugin } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { useCallback, useState, useMemo } from 'react';

// Trigger pattern: {variable_name for variables
const VariableTriggerRegex = /\{([a-zA-Z0-9_]*)$/;

type VariableOption = {
  id: string;
  name: string;
  type: 'text' | 'image';
};

export function VariableMentionsPlugin({
  variables,
}: {
  variables: VariableOption[];
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  // Filter options based on search
  const options = useMemo(() => {
    if (!queryString) return variables;

    const search = queryString.toLowerCase();
    return variables.filter(v =>
      v.name.toLowerCase().includes(search)
    );
  }, [queryString, variables]);

  const checkForVariableTrigger = useCallback(
    (text: string) => {
      const match = VariableTriggerRegex.exec(text);

      if (match !== null) {
        const matchingString = match[1];
        return {
          leadOffset: match.index,
          matchingString,
          replaceableString: '{' + matchingString,
        };
      }
      return null;
    },
    []
  );

  const onSelectOption = useCallback(
    (
      selectedOption: VariableOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const mentionNode = $createVariableMentionNode(
          selectedOption.id,
          selectedOption.name,
          selectedOption.type
        );

        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }

        // Add space after mention
        const spaceNode = $createTextNode(' ');
        mentionNode.insertAfter(spaceNode);
        spaceNode.select();

        closeMenu();
      });
    },
    [editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin<VariableOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForVariableTrigger}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current || options.length === 0) {
          return null;
        }

        return createPortal(
          <div className="typeahead-popover mentions-menu">
            <ul role="listbox" aria-label="Variables">
              {options.map((option, index) => (
                <VariableMenuItem
                  key={option.id}
                  index={index}
                  isSelected={selectedIndex === index}
                  onClick={() => {
                    setHighlightedIndex(index);
                    selectOptionAndCleanUp(option);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  option={option}
                />
              ))}
            </ul>
          </div>,
          anchorElementRef.current
        );
      }}
    />
  );
}
```

### 3.2 MenuItem Component with Keyboard Navigation

```typescript
function VariableMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: VariableOption;
}) {
  const ref = useRef<HTMLLIElement>(null);

  // Auto-scroll to selected item
  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <li
      key={option.id}
      tabIndex={-1}
      className={`mention-item ${isSelected ? 'selected' : ''}`}
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      ref={isSelected ? ref : undefined}
    >
      <span className={`mention-icon type-${option.type}`}>
        {option.type === 'text' ? '📝' : '🖼️'}
      </span>
      <span className="mention-text">{option.name}</span>
      <span className="mention-type">{option.type}</span>
    </li>
  );
}
```

**Built-in Keyboard Navigation:**

The `LexicalTypeaheadMenuPlugin` handles:
- **Arrow Up/Down**: Navigate through options
- **Enter**: Select highlighted option
- **Escape**: Close menu
- **Tab**: Select and continue (configurable)

### 3.3 Combined MentionsPlugin (Variables + Media)

```typescript
export function MentionsPlugin({
  variables,
  mediaRegistry,
}: {
  variables: VariableOption[];
  mediaRegistry: MediaOption[];
}): JSX.Element | null {
  return (
    <>
      <VariableMentionsPlugin variables={variables} />
      <MediaMentionsPlugin mediaRegistry={mediaRegistry} />
    </>
  );
}
```

**Separate triggers:**
- Variables: `{variable_name`
- Media: `@media_name`

This allows both to coexist in the same editor.

---

## 4. Smart Paste & Text Transformation

### 4.1 Smart Paste Plugin

**Detect and convert @mention patterns in pasted text:**

```typescript
function SmartPastePlugin({
  variables,
  mediaRegistry,
}: {
  variables: VariableOption[];
  mediaRegistry: MediaOption[];
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const text = clipboardData.getData('text/plain');

        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          // Detect patterns
          const variableRegex = /\{([a-zA-Z0-9_]+)\}/g;
          const mediaRegex = /@([a-zA-Z0-9_]+)/g;

          const parts: Array<TextNode | VariableMentionNode | MediaMentionNode> = [];
          let lastIndex = 0;

          // Find all matches (both variables and media)
          const allMatches: Array<{ index: number; length: number; type: 'variable' | 'media'; name: string }> = [];

          let match;
          while ((match = variableRegex.exec(text)) !== null) {
            allMatches.push({
              index: match.index,
              length: match[0].length,
              type: 'variable',
              name: match[1],
            });
          }

          while ((match = mediaRegex.exec(text)) !== null) {
            allMatches.push({
              index: match.index,
              length: match[0].length,
              type: 'media',
              name: match[1],
            });
          }

          // Sort by index
          allMatches.sort((a, b) => a.index - b.index);

          // Build node array
          for (const match of allMatches) {
            // Add text before match
            if (match.index > lastIndex) {
              const textBefore = text.slice(lastIndex, match.index);
              parts.push($createTextNode(textBefore));
            }

            // Add mention node
            if (match.type === 'variable') {
              const variable = variables.find(v => v.name === match.name);
              if (variable) {
                parts.push($createVariableMentionNode(
                  variable.id,
                  variable.name,
                  variable.type
                ));
              } else {
                // Variable not found, keep as text
                parts.push($createTextNode(`{${match.name}}`));
              }
            } else if (match.type === 'media') {
              const media = mediaRegistry.find(m => m.name === match.name);
              if (media) {
                parts.push($createMediaMentionNode(media.id, media.name));
              } else {
                // Media not found, keep as text
                parts.push($createTextNode(`@${match.name}`));
              }
            }

            lastIndex = match.index + match.length;
          }

          // Add remaining text
          if (lastIndex < text.length) {
            parts.push($createTextNode(text.slice(lastIndex)));
          }

          // Insert all parts
          if (parts.length > 0) {
            selection.insertNodes(parts);
          }
        });

        event.preventDefault();
        return true; // Indicate we handled the paste
      },
      COMMAND_PRIORITY_HIGH, // Higher priority to override default
    );
  }, [editor, variables, mediaRegistry]);

  return null;
}
```

### 4.2 Node Transforms (Alternative Approach)

**Auto-convert text patterns to mentions in real-time:**

```typescript
function MentionTransformPlugin({ variables, mediaRegistry }): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (textNode) => {
      // Only process simple text nodes
      if (!textNode.isSimpleText()) return;

      const text = textNode.getTextContent();

      // Check for variable pattern
      const variableMatch = /\{([a-zA-Z0-9_]+)\}/.exec(text);
      if (variableMatch) {
        const variableName = variableMatch[1];
        const variable = variables.find(v => v.name === variableName);

        if (variable) {
          const startOffset = variableMatch.index;
          const endOffset = startOffset + variableMatch[0].length;

          let targetNode;
          if (startOffset === 0) {
            [targetNode] = textNode.splitText(endOffset);
          } else {
            [, targetNode] = textNode.splitText(startOffset, endOffset);
          }

          const mentionNode = $createVariableMentionNode(
            variable.id,
            variable.name,
            variable.type
          );

          targetNode.replace(mentionNode);
        }
      }
    });
  }, [editor, variables]);

  return null;
}
```

**Note**: Smart paste is preferred over node transforms for mention detection to avoid performance issues with large documents.

---

## 5. Serialization & Persistence

### 5.1 Saving Editor State

**Save entire editor state as JSON:**

```typescript
function savePromptTemplate(editor: LexicalEditor): string {
  const editorState = editor.getEditorState();
  const jsonString = JSON.stringify(editorState);

  return jsonString;
}

// Usage in auto-save
const debouncedSave = useDebouncedCallback(
  (editorState: EditorState) => {
    const json = JSON.stringify(editorState);
    updatePreset({ promptTemplate: json });
  },
  1000
);

return (
  <OnChangePlugin
    onChange={debouncedSave}
    ignoreSelectionChange={true}
  />
);
```

### 5.2 Loading Editor State

**Load from database:**

```typescript
const initialConfig = {
  namespace: 'PromptTemplateEditor',
  editorState: preset.promptTemplate, // JSON string or EditorState
  nodes: [VariableMentionNode, MediaMentionNode],
  // ... other config
};
```

**Or programmatically:**

```typescript
function loadPromptTemplate(editor: LexicalEditor, jsonString: string) {
  try {
    const editorState = editor.parseEditorState(jsonString);
    editor.setEditorState(editorState);
  } catch (error) {
    console.error('Failed to parse editor state:', error);
    Sentry.captureException(error);
  }
}
```

### 5.3 Converting to Plain Text

**Extract plain text with mention syntax:**

```typescript
function serializeToPlainText(editorState: EditorState): string {
  return editorState.read(() => {
    const root = $getRoot();
    let text = '';

    root.getChildren().forEach(node => {
      if ($isParagraphNode(node)) {
        node.getChildren().forEach(child => {
          if ($isVariableMentionNode(child)) {
            text += `{${child.getVariableName()}}`;
          } else if ($isMediaMentionNode(child)) {
            text += `@${child.getMediaName()}`;
          } else if ($isTextNode(child)) {
            text += child.getTextContent();
          }
        });
        text += '\n';
      }
    });

    return text.trim();
  });
}
```

**Parse plain text back to EditorState:**

```typescript
function parseFromPlainText(
  editor: LexicalEditor,
  text: string,
  variables: VariableOption[],
  mediaRegistry: MediaOption[]
): void {
  editor.update(() => {
    const root = $getRoot();
    root.clear();

    const paragraphs = text.split('\n');

    paragraphs.forEach(paragraphText => {
      const paragraph = $createParagraphNode();

      // Parse variables and media
      const variableRegex = /\{([a-zA-Z0-9_]+)\}/g;
      const mediaRegex = /@([a-zA-Z0-9_]+)/g;

      const allMatches: Array<{
        index: number;
        length: number;
        type: 'variable' | 'media';
        name: string;
      }> = [];

      let match;
      while ((match = variableRegex.exec(paragraphText)) !== null) {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          type: 'variable',
          name: match[1],
        });
      }

      while ((match = mediaRegex.exec(paragraphText)) !== null) {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          type: 'media',
          name: match[1],
        });
      }

      allMatches.sort((a, b) => a.index - b.index);

      let lastIndex = 0;
      for (const match of allMatches) {
        // Add text before match
        if (match.index > lastIndex) {
          const textBefore = paragraphText.slice(lastIndex, match.index);
          paragraph.append($createTextNode(textBefore));
        }

        // Add mention node
        if (match.type === 'variable') {
          const variable = variables.find(v => v.name === match.name);
          if (variable) {
            paragraph.append($createVariableMentionNode(
              variable.id,
              variable.name,
              variable.type
            ));
          }
        } else if (match.type === 'media') {
          const media = mediaRegistry.find(m => m.name === match.name);
          if (media) {
            paragraph.append($createMediaMentionNode(media.id, media.name));
          }
        }

        lastIndex = match.index + match.length;
      }

      // Add remaining text
      if (lastIndex < paragraphText.length) {
        paragraph.append($createTextNode(paragraphText.slice(lastIndex)));
      }

      root.append(paragraph);
    });
  });
}
```

---

## 6. Performance & Best Practices

### 6.1 Node Type Decision Matrix

| Use Case | Node Type | Reason |
|----------|-----------|--------|
| **Mentions, variables, tags** | **TextNode** | Maintains selection, proper text flow, lightweight |
| **Block embeds (videos, images)** | **DecoratorNode** | Complex rendering, no text selection needed |
| **Containers (paragraphs, lists)** | **ElementNode** | Can have children, block structure |

**For AI Preset Editor**: Use **TextNode extensions** for both VariableMentionNode and MediaMentionNode.

### 6.2 React Performance Optimization

**Memoize components:**

```typescript
const VariableMenuItem = React.memo(({ option, isSelected, onClick }: Props) => {
  return (
    <li className={isSelected ? 'selected' : ''} onClick={onClick}>
      {option.name}
    </li>
  );
});
```

**Stable callbacks:**

```typescript
const handleCommand = useCallback((payload) => {
  // Handle command
  return true;
}, []); // Empty deps = stable reference

useEffect(() => {
  return editor.registerCommand(
    MY_COMMAND,
    handleCommand,
    COMMAND_PRIORITY_NORMAL
  );
}, [editor, handleCommand]);
```

**Use Lexical hooks:**

```typescript
// Prefer built-in hooks over manual listeners
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';

const isEditable = useLexicalEditable();
```

### 6.3 Auto-Save Pattern

**Debounced auto-save with OnChangePlugin:**

```typescript
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useDebouncedCallback } from 'use-debounce';

function AutoSavePlugin() {
  const updatePreset = useUpdateAIPreset();

  const saveContent = useDebouncedCallback(
    (editorState: EditorState) => {
      const json = JSON.stringify(editorState);
      updatePreset.mutate({ promptTemplate: json });
    },
    1000 // 1 second delay
  );

  return (
    <OnChangePlugin
      onChange={saveContent}
      ignoreSelectionChange={true}
      ignoreHistoryMergeTagChange={true}
    />
  );
}
```

### 6.4 Accessibility

**Editor accessibility:**

```typescript
<ContentEditable
  className="editor-input"
  aria-label="Prompt template editor"
  aria-describedby="editor-help-text"
  role="textbox"
  aria-multiline="true"
/>
```

**Mention menu accessibility:**

```typescript
<ul role="listbox" aria-label="Variable suggestions">
  {options.map((option, index) => (
    <li
      key={option.id}
      role="option"
      aria-selected={index === selectedIndex}
      aria-label={`Variable ${option.name}`}
      tabIndex={-1}
    >
      {option.name}
    </li>
  ))}
</ul>
```

---

## 7. Implementation Roadmap

### Phase 10 Tasks Breakdown

**T066-T067: Research & Setup** ✅ (This document)
- [x] Research Lexical documentation and best practices
- [x] Document DecoratorNode vs TextNode patterns
- [x] Document mention plugin implementation
- [x] Document serialization strategies

**T068: Folder Structure**
```bash
mkdir -p apps/clementine-app/src/domains/ai-presets/lexical/{nodes,plugins,utils}
```

**T069-T070: Custom Nodes** (Can run in parallel)
- Create `VariableMentionNode.tsx` (extends TextNode)
- Create `MediaMentionNode.tsx` (extends TextNode)

**T071: Mentions Plugin**
- Create `MentionsPlugin.tsx` using `LexicalTypeaheadMenuPlugin`
- Implement separate triggers for variables (`{`) and media (`@`)
- Add keyboard navigation support

**T072: Smart Paste Plugin** (Parallel with T073)
- Create `SmartPastePlugin.tsx`
- Detect `{variable}` and `@media` patterns in pasted text
- Convert to mention nodes

**T073: Serialization Utilities** (Parallel with T072)
- Create `serialization.ts`
- Implement JSON ↔ EditorState conversion
- Implement plain text ↔ EditorState conversion (for backward compatibility)

**T074: Refactor PromptTemplateEditor**
- Replace contentEditable with LexicalComposer
- Integrate MentionsPlugin
- Add SmartPastePlugin
- Keep same auto-save behavior
- Maintain same external API

**T075: Barrel Exports**
- Create `lexical/index.ts` with public API exports

**T076: Testing**
- Test @mention autocomplete (variables + media)
- Test smart paste
- Test click-to-remove on pills
- Test serialization/persistence
- Test keyboard navigation
- Test accessibility

---

## 8. Common Pitfalls & Solutions

### 8.1 Selection Issues with DecoratorNodes

**Problem:** Selection becomes `null` when over DecoratorNode.

**Solution:** Use TextNode extension for text-like elements (mentions).

### 8.2 Infinite Transform Loops

**Problem:** Transform keeps marking node as dirty.

**Solution:** Always check current state before modifying:

```typescript
editor.registerNodeTransform(TextNode, (textNode) => {
  // BAD: Always modifies
  // textNode.toggleFormat('bold');

  // GOOD: Check first
  if (!textNode.hasFormat('bold')) {
    textNode.toggleFormat('bold');
  }
});
```

### 8.3 State Updates Outside editor.update()

**Problem:** Error: "Unable to find an active editor state."

**Solution:** Always wrap state modifications:

```typescript
// GOOD
editor.update(() => {
  const node = $getNodeByKey(key);
  node?.remove();
});
```

### 8.4 Cursor Position After Node Insertion

**Problem:** Cursor ends up in wrong position after inserting mention.

**Solution:** Explicitly set selection after insertion:

```typescript
editor.update(() => {
  const mentionNode = $createVariableMentionNode(id, name, type);
  selection.insertNodes([mentionNode]);

  // Add space and move cursor
  const spaceNode = $createTextNode(' ');
  mentionNode.insertAfter(spaceNode);
  spaceNode.select();
});
```

### 8.5 Memory Leaks with Event Listeners

**Problem:** Event listeners not cleaned up.

**Solution:** Use WeakSet and return cleanup functions:

```typescript
const registeredElements = new WeakSet<HTMLElement>();

useEffect(() => {
  return editor.registerMutationListener(MentionNode, (mutations) => {
    for (const [key, mutation] of mutations) {
      if (mutation === 'created') {
        const element = editor.getElementByKey(key);
        if (element && !registeredElements.has(element)) {
          element.addEventListener('click', handleClick);
          registeredElements.add(element);
        }
      }
    }
  });
}, [editor]);
```

---

## 9. Resources & References

### Official Documentation

- [Lexical Documentation](https://lexical.dev/docs/intro)
- [Getting Started with React](https://lexical.dev/docs/getting-started/react)
- [Nodes Concepts](https://lexical.dev/docs/concepts/nodes)
- [Editor State](https://lexical.dev/docs/concepts/editor-state)
- [Serialization & Deserialization](https://lexical.dev/docs/concepts/serialization)
- [Node Transforms](https://lexical.dev/docs/concepts/transforms)
- [Working with DOM Events](https://lexical.dev/docs/concepts/dom-events)
- [React FAQ](https://lexical.dev/docs/react/faq)

### GitHub Resources

- [Lexical GitHub Repository](https://github.com/facebook/lexical)
- [Playground Source Code](https://github.com/facebook/lexical/tree/main/packages/lexical-playground)
- [MentionNode.ts - Playground](https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/nodes/MentionNode.ts)
- [MentionsPlugin - Playground](https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/MentionsPlugin/index.tsx)
- [LexicalTypeaheadMenuPlugin](https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/LexicalTypeaheadMenuPlugin.tsx)

### Third-Party Solutions

- [lexical-beautiful-mentions](https://github.com/sodenn/lexical-beautiful-mentions)
- [lexical-beautiful-mentions docs](https://lexical-beautiful-mentions-docs.vercel.app/)

### Community Resources

- [Lexical state updates - dio.la](https://dio.la/article/lexical-state-updates)
- [Building a Customizable Text Editor with Lexical - Medium](https://medium.com/@kgirishkumar_23110/building-a-customizable-text-editor-with-lexical-65be5a5f169b)

---

## Appendix: Dependencies

**Required packages:**

```bash
pnpm add lexical @lexical/react @lexical/utils --filter clementine-app
```

**Package versions (as of 2025-01-27):**
- `lexical`: ^0.39.0
- `@lexical/react`: ^0.39.0
- `@lexical/utils`: ^0.39.0

**Optional (if using third-party solutions):**
- `lexical-beautiful-mentions`: ^0.1.x

---

## Next Steps

1. ✅ Research complete (T066-T067)
2. Install dependencies (T067)
3. Create folder structure (T068)
4. Implement custom nodes (T069-T070)
5. Build plugins (T071-T072)
6. Add utilities (T073)
7. Refactor PromptTemplateEditor (T074)
8. Test thoroughly (T076)

**Ready for implementation!** This research provides all the foundation needed to migrate PromptTemplateEditor from contentEditable to Lexical with enhanced @mention functionality.
