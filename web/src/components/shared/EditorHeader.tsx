import { Button } from "@/components/ui/button";
import { EditorBreadcrumbs, type BreadcrumbItem } from "./EditorBreadcrumbs";

interface EditorHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  onSave: () => void | Promise<void>;
  onExit: () => void;
  saveLabel?: string;
  exitLabel?: string;
}

/**
 * Consistent header for all editor layouts
 * Shows breadcrumbs on left, Save/Exit actions on right
 */
export function EditorHeader({
  breadcrumbs,
  onSave,
  onExit,
  saveLabel = "Save",
  exitLabel = "Exit",
}: EditorHeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Breadcrumbs */}
          <EditorBreadcrumbs items={breadcrumbs} />

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onExit}>
              {exitLabel}
            </Button>
            <Button onClick={onSave}>{saveLabel}</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
