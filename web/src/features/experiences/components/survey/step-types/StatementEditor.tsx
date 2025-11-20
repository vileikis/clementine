"use client";

/**
 * Component: StatementEditor
 *
 * Type-specific editor for statement step (display-only).
 * No configuration needed - statements only display content.
 *
 * Part of 001-survey-experience implementation (Phase 3 - User Story 1).
 */

export function StatementEditor() {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Statement steps display information without collecting input.
      </p>
      <p className="text-sm text-muted-foreground">
        Configure the title and description above to set your statement content.
      </p>
    </div>
  );
}
