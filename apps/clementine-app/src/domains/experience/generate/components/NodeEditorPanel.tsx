import type { TransformNode } from '@clementine/shared'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/ui-kit/ui/sheet'

interface NodeEditorPanelProps {
  node: TransformNode | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NodeEditorPanel({
  node,
  open,
  onOpenChange,
}: NodeEditorPanelProps) {
  if (!node) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit AI Image Node</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Placeholder sections - implemented in future phases */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Model Settings</h3>
            <p className="text-sm text-muted-foreground">
              Phase 1e: Model and aspect ratio controls
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Prompt</h3>
            <p className="text-sm text-muted-foreground">
              Phase 1d: Lexical editor with mentions
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Reference Media</h3>
            <p className="text-sm text-muted-foreground">
              Phase 1c: Upload and manage reference media
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Test Run</h3>
            <p className="text-sm text-muted-foreground">
              Phase 1g: Test prompt resolution and generate preview
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
