"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EditorBreadcrumbs, type BreadcrumbItem } from "./EditorBreadcrumbs";

interface EditorHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  exitUrl: string;
  onSave?: () => void | Promise<void>;
  saveLabel?: string;
  exitLabel?: string;
}

/**
 * Consistent header for all editor layouts
 * Shows breadcrumbs on left, Save/Exit actions on right
 *
 * Self-contained client component that handles navigation
 */
export function EditorHeader({
  breadcrumbs,
  exitUrl,
  onSave,
  saveLabel = "Save",
  exitLabel = "Exit",
}: EditorHeaderProps) {
  const router = useRouter();

  const handleExit = () => {
    router.push(exitUrl);
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    } else {
      // TODO: Implement default save logic in future
      console.log("Save clicked");
    }
  };

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Breadcrumbs */}
          <EditorBreadcrumbs items={breadcrumbs} />

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExit}>
              {exitLabel}
            </Button>
            <Button onClick={handleSave}>{saveLabel}</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
