## Brief 2: Lexical Mention Node UX Improvements

**Objective**
Resolve critical cursor hijacking bugs related to Lexical mention nodes and introduce a frictionless way for users to delete mention nodes via mouse interaction.

**Acceptance Criteria: Cursor Fix**

- **Isolated Node Navigation**: When a mention node is the only item on a line, clicking before or after it must successfully focus the cursor. Keyboard arrow navigation must allow the cursor to enter and exit the line smoothly.
- **Inline Node Navigation**: When text exists alongside the mention node, clicking at the end of the node must place the cursor correctly. Keyboard navigation (left/right) must traverse past the mention node without the cursor disappearing or getting stuck.

**Acceptance Criteria: Deletion Feature**

- **Hover State**: Hovering over a mention node must display a close/remove icon at the start of the node.
- **Layout Stability**: The appearance of the close icon must not alter the width or layout of the mention node (recommend using `position: absolute` for the icon).
- **Click to Remove**: Clicking the close icon must instantly delete the entire mention node from the editor.
