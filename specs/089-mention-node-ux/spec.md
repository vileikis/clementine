# Feature Specification: Lexical Mention Node UX Improvements

**Feature Branch**: `089-mention-node-ux`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "Resolve critical cursor hijacking bugs related to Lexical mention nodes and introduce a frictionless way for users to delete mention nodes via mouse interaction."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Past Isolated Mention Nodes (Priority: P1)

A content creator is building a prompt in the Lexical editor. They have a mention node (e.g., `@Pet Choice`) as the only content on a line. Currently, clicking before or after the mention node fails to place a cursor, and keyboard arrow navigation gets stuck or causes the cursor to disappear. After this fix, the creator can click anywhere on the line outside the mention node to place a cursor, and use arrow keys to smoothly enter and exit the line.

**Why this priority**: This is a critical usability bug. Users cannot reliably position their cursor when mention nodes are the sole content on a line, blocking basic editing workflows.

**Independent Test**: Can be fully tested by inserting a mention node on an empty line and verifying cursor placement via mouse clicks and keyboard navigation.

**Acceptance Scenarios**:

1. **Given** a mention node is the only content on a line, **When** the user clicks before the mention node, **Then** the cursor is placed at the beginning of the line before the mention node.
2. **Given** a mention node is the only content on a line, **When** the user clicks after the mention node, **Then** the cursor is placed at the end of the line after the mention node.
3. **Given** the cursor is on the line above a line containing only a mention node, **When** the user presses the Down arrow key, **Then** the cursor moves to a position on the mention node's line (before or after the node).
4. **Given** the cursor is positioned after a mention node on an isolated line, **When** the user presses the Right arrow key, **Then** the cursor moves to the next line or end of editor without getting stuck.
5. **Given** the cursor is positioned before a mention node on an isolated line, **When** the user presses the Left arrow key, **Then** the cursor moves to the previous line or beginning of editor without getting stuck.

---

### User Story 2 - Navigate Past Inline Mention Nodes (Priority: P1)

A content creator is editing a prompt that contains a mention node surrounded by text (e.g., `Use the @Pet Choice step to generate`). Currently, clicking at the boundary between the mention node and adjacent text fails to place the cursor correctly, and left/right arrow key navigation causes the cursor to disappear or skip positions when traversing the mention node. After this fix, the cursor behaves predictably when navigating around inline mention nodes.

**Why this priority**: Equally critical as isolated node navigation — inline mentions are the most common usage pattern, and broken cursor behavior here disrupts the primary editing workflow.

**Independent Test**: Can be fully tested by inserting a mention node between text segments and verifying cursor placement and keyboard traversal.

**Acceptance Scenarios**:

1. **Given** a mention node is surrounded by text on a line, **When** the user clicks at the right edge of the mention node, **Then** the cursor is placed immediately after the mention node.
2. **Given** a mention node is surrounded by text on a line, **When** the user clicks at the left edge of the mention node, **Then** the cursor is placed immediately before the mention node.
3. **Given** the cursor is positioned in text before a mention node, **When** the user presses the Right arrow key repeatedly, **Then** the cursor moves through the text, traverses past the mention node as a single unit, and continues into the text after it — without disappearing or getting stuck.
4. **Given** the cursor is positioned in text after a mention node, **When** the user presses the Left arrow key repeatedly, **Then** the cursor moves through the text, traverses past the mention node as a single unit, and continues into the text before it — without disappearing or getting stuck.

---

### User Story 3 - Delete Mention Node via Mouse (Priority: P2)

A content creator wants to remove a mention node from their prompt without using keyboard selection. When they hover over a mention node, a small close icon appears at the start of the node. Clicking the icon instantly removes the entire mention node. The appearance of the icon does not shift or resize the mention node.

**Why this priority**: This is a new convenience feature. Users can already delete mention nodes via keyboard (backspace/delete), but a visual affordance for mouse-based removal improves discoverability and reduces friction.

**Independent Test**: Can be fully tested by hovering over a mention node, verifying the close icon appears without layout shift, and clicking it to confirm the node is removed.

**Acceptance Scenarios**:

1. **Given** a mention node exists in the editor, **When** the user hovers their mouse over it, **Then** a close/remove icon appears at the start of the mention node.
2. **Given** a close icon is visible on a mention node, **When** the user moves their mouse away from the mention node, **Then** the close icon disappears.
3. **Given** a close icon is visible on a mention node, **When** the user clicks the close icon, **Then** the entire mention node is instantly removed from the editor content.
4. **Given** a close icon is visible on a mention node, **When** observing the mention node layout, **Then** the width, height, and position of the mention node remain unchanged compared to its non-hovered state.
5. **Given** the editor is in a disabled/read-only state, **When** the user hovers over a mention node, **Then** no close icon is displayed.

---

### Edge Cases

- What happens when a user deletes a mention node that is the only content on a line? The line should remain as an empty paragraph, and the cursor should be placed on that empty line.
- What happens when two mention nodes are adjacent with no space between them? The cursor must be positionable between the two nodes, and each node's close icon must be independently usable.
- What happens when the close icon is clicked during an active text selection? The selection should be cleared, and the mention node should be removed.
- How does the close icon behave when the mention node is in an invalid state (red styling)? The close icon should still appear and function identically.
- What happens on touch devices where hover is not available? The close icon is not displayed on touch; users rely on keyboard-based deletion (existing behavior).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow the cursor to be placed before and after a mention node that is the sole content on a line, via both mouse click and keyboard navigation.
- **FR-002**: The system MUST allow the cursor to traverse past a mention node that is inline with text, via both mouse click and keyboard arrow keys, without the cursor disappearing or becoming stuck.
- **FR-003**: The system MUST display a close/remove icon at the start of a mention node when the user hovers over it.
- **FR-004**: The close icon MUST NOT change the width, height, or position of the mention node — it must be visually overlaid using absolute positioning.
- **FR-005**: Clicking the close icon MUST instantly remove the entire mention node from the editor.
- **FR-006**: The close icon MUST NOT appear when the editor is in a disabled or read-only state.
- **FR-007**: The cursor navigation fix MUST apply to both StepMentionNode and MediaMentionNode types.
- **FR-008**: The close/remove icon MUST apply to both StepMentionNode and MediaMentionNode types (both valid and invalid states).

### Key Entities

- **MentionNode**: An atomic inline element within the Lexical editor representing a reference to either a step or media asset. Has a display name, a type indicator, and a validity state. Appears as a styled pill/badge within the text flow.
- **Close Icon**: A transient visual affordance that appears on hover over a mention node, positioned absolutely at the start of the node, enabling one-click removal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can place a cursor before and after an isolated mention node on the first click attempt, with 100% reliability across all mention node types.
- **SC-002**: Users can navigate past an inline mention node using arrow keys without the cursor disappearing or requiring more than one extra keypress beyond what is expected for a single atomic element.
- **SC-003**: The close icon appears within 150ms of hovering over a mention node and disappears within 150ms of moving away.
- **SC-004**: The mention node's visual dimensions remain identical (zero layout shift) when the close icon is shown versus hidden.
- **SC-005**: Clicking the close icon removes the mention node from the editor content within one interaction — no confirmation dialogs or multi-step process.

## Assumptions

- The cursor navigation bugs are caused by the current node configuration (e.g., `segmented` mode, `canInsertTextBefore`/`canInsertTextAfter` returning `false`) and can be resolved by adjusting the Lexical node setup or adding a cursor-management plugin — without requiring upstream Lexical library changes.
- The close icon will use a small "X" or similar universally recognized icon from the existing icon library (Lucide React).
- Touch device users will continue to use keyboard-based deletion; the hover-triggered close icon is a desktop enhancement only.
- The styling of the close icon will follow the existing design language (Tailwind + inline styles consistent with current mention node styling).
