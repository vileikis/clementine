/**
 * AIGenerationToggle Component
 *
 * Switch for enabling/disabling AI generation.
 * When disabled, the experience uses passthrough mode (source image only).
 *
 * @see spec.md - US5 (Toggle AI Generation)
 */
import { Sparkles } from 'lucide-react'

import { Label } from '@/ui-kit/ui/label'
import { Switch } from '@/ui-kit/ui/switch'

export interface AIGenerationToggleProps {
  /** Whether AI generation is enabled */
  value: boolean
  /** Callback when toggle changes */
  onChange: (value: boolean) => void
  /** Whether the toggle is disabled */
  disabled?: boolean
}

/**
 * AIGenerationToggle - Switch for AI generation on/off
 */
export function AIGenerationToggle({
  value,
  onChange,
  disabled,
}: AIGenerationToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="ai-generation-toggle" className="text-sm font-medium">
          AI Generation
        </Label>
      </div>
      <Switch
        id="ai-generation-toggle"
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={value ? 'Disable AI generation' : 'Enable AI generation'}
      />
    </div>
  )
}
