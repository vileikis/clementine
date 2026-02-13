/**
 * Share Loading Config Panel Component
 *
 * Configuration panel for share screen loading state (shown during AI generation).
 * Allows admins to customize title and description text shown to guests.
 */
import type { ShareLoadingConfig } from '@clementine/shared'
import { Label } from '@/ui-kit/ui/label'
import { Switch } from '@/ui-kit/ui/switch'
import { EditorSection, TextareaField } from '@/shared/editor-controls'

export interface ShareLoadingConfigPanelProps {
  shareLoading: ShareLoadingConfig
  onShareLoadingUpdate: (updates: Partial<ShareLoadingConfig>) => void
  disabled?: boolean
}

/**
 * Panel for configuring loading state content
 * Features title and description fields with help text
 */
export function ShareLoadingConfigPanel({
  shareLoading,
  onShareLoadingUpdate,
  disabled = false,
}: ShareLoadingConfigPanelProps) {
  const emailCapture = shareLoading.emailCapture ?? {
    enabled: false,
    heading: null,
  }

  return (
    <div className="space-y-0">
      {/* Content Section */}
      <EditorSection title="Content">
        <TextareaField
          label="Loading Title"
          value={shareLoading.title ?? ''}
          onChange={(value) => onShareLoadingUpdate({ title: value })}
          placeholder="Creating your experience..."
          rows={2}
          disabled={disabled}
        />
        <TextareaField
          label="Loading Description"
          value={shareLoading.description ?? ''}
          onChange={(value) => onShareLoadingUpdate({ description: value })}
          placeholder="This usually takes 30-60 seconds. Please wait..."
          rows={4}
          disabled={disabled}
        />
      </EditorSection>

      {/* Email Capture Section */}
      <EditorSection title="Email Capture">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-capture-toggle">Get result by email</Label>
            <p className="text-xs text-muted-foreground">
              Let guests enter their email to receive the result
            </p>
          </div>
          <Switch
            id="email-capture-toggle"
            checked={emailCapture.enabled}
            onCheckedChange={(checked) =>
              onShareLoadingUpdate({
                emailCapture: { ...emailCapture, enabled: checked },
              })
            }
            disabled={disabled}
          />
        </div>

        {emailCapture.enabled && (
          <TextareaField
            label="Email Form Heading"
            value={emailCapture.heading ?? ''}
            onChange={(heading) =>
              onShareLoadingUpdate({
                emailCapture: { ...emailCapture, heading },
              })
            }
            placeholder="Get your result by email"
            rows={2}
            disabled={disabled}
          />
        )}
      </EditorSection>
    </div>
  )
}
