/**
 * ShareReadyConfigPanel Component
 *
 * Left panel control interface for customizing share screen properties.
 * Organized into sections: Content (title, description), Share Options, CTA.
 */

import { Download, Link2, Mail } from 'lucide-react'
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
} from 'react-icons/fa6'
import { FaTelegramPlane } from 'react-icons/fa'
import { ctaConfigSchema } from '@clementine/shared'
import {
  CTA_LABEL_MAX_LENGTH,
  SHARE_DESCRIPTION_MAX_LENGTH,
  SHARE_TITLE_MAX_LENGTH,
} from '../constants'
import type {
  ShareOptionsConfig,
  ShareReadyConfig,
} from '@/domains/project-config/shared'
import {
  EditorSection,
  SelectOptionCard,
  TextField,
  TextareaField,
} from '@/shared/editor-controls'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'

export interface ShareReadyConfigPanelProps {
  /** Current share values */
  share: ShareReadyConfig
  /** Current share options values */
  shareOptions: ShareOptionsConfig
  /** Callback when a share content field is updated */
  onShareUpdate: (updates: Partial<ShareReadyConfig>) => void
  /** Callback when a share option is toggled */
  onShareOptionToggle: (field: keyof ShareOptionsConfig) => void
  /** CTA validation error message */
  ctaUrlError?: string | null
  /** Callback when CTA URL loses focus (for validation) */
  onCtaUrlBlur?: () => void
  /** Callback when CTA URL changes (to clear error) */
  onCtaUrlChange?: () => void
  /** Whether controls are disabled (e.g., during save) */
  disabled?: boolean
}

export function ShareReadyConfigPanel({
  share,
  shareOptions,
  onShareUpdate,
  onShareOptionToggle,
  ctaUrlError,
  onCtaUrlBlur,
  onCtaUrlChange,
  disabled = false,
}: ShareReadyConfigPanelProps) {
  // Helper to merge CTA updates with schema defaults
  const handleCtaUpdate = (
    updates: Partial<{ label: string | null; url: string | null }>,
  ) => {
    // Get current CTA or use schema defaults
    const ctaWithDefaults = ctaConfigSchema.parse(share.cta)
    // Merge updates
    const newCta = { ...ctaWithDefaults, ...updates }
    // Update through parent handler
    onShareUpdate({ cta: newCta })
  }
  return (
    <div className="space-y-0">
      {/* Content Section - title, description */}
      <EditorSection title="Content">
        <TextField
          label="Title"
          value={share.title ?? ''}
          onChange={(value) => onShareUpdate({ title: value || null })}
          placeholder="Enter share screen title"
          maxLength={SHARE_TITLE_MAX_LENGTH}
          disabled={disabled}
        />
        <TextareaField
          label="Description"
          value={share.description ?? ''}
          onChange={(value) => onShareUpdate({ description: value || null })}
          placeholder="Optional description"
          maxLength={SHARE_DESCRIPTION_MAX_LENGTH}
          rows={3}
          disabled={disabled}
        />
      </EditorSection>

      {/* Share Options Section - Main Options */}
      <EditorSection title="Main Options">
        <div className="grid grid-cols-2 gap-2">
          <SelectOptionCard
            icon={Download}
            label="Download"
            enabled={shareOptions.download ?? true}
            onClick={() => onShareOptionToggle('download')}
          />
          <SelectOptionCard
            icon={Link2}
            label="Copy Link"
            enabled={shareOptions.copyLink ?? true}
            onClick={() => onShareOptionToggle('copyLink')}
          />
        </div>
      </EditorSection>

      {/* Share Options Section - Social Media */}
      <EditorSection title="Social Media">
        <div className="grid grid-cols-2 gap-2">
          <SelectOptionCard
            icon={Mail}
            label="Email"
            enabled={shareOptions.email ?? false}
            onClick={() => onShareOptionToggle('email')}
          />
          <SelectOptionCard
            icon={FaInstagram}
            label="Instagram"
            enabled={shareOptions.instagram ?? false}
            onClick={() => onShareOptionToggle('instagram')}
          />
          <SelectOptionCard
            icon={FaFacebookF}
            label="Facebook"
            enabled={shareOptions.facebook ?? false}
            onClick={() => onShareOptionToggle('facebook')}
          />
          <SelectOptionCard
            icon={FaLinkedinIn}
            label="LinkedIn"
            enabled={shareOptions.linkedin ?? false}
            onClick={() => onShareOptionToggle('linkedin')}
          />
          <SelectOptionCard
            icon={FaXTwitter}
            label="Twitter"
            enabled={shareOptions.twitter ?? false}
            onClick={() => onShareOptionToggle('twitter')}
          />
          <SelectOptionCard
            icon={FaTiktok}
            label="TikTok"
            enabled={shareOptions.tiktok ?? false}
            onClick={() => onShareOptionToggle('tiktok')}
          />
          <SelectOptionCard
            icon={FaTelegramPlane}
            label="Telegram"
            enabled={shareOptions.telegram ?? false}
            onClick={() => onShareOptionToggle('telegram')}
          />
        </div>
      </EditorSection>

      {/* CTA Section */}
      <EditorSection title="Call to Action">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cta-label">Button Label</Label>
            <Input
              id="cta-label"
              value={share.cta?.label ?? ''}
              onChange={(e) => {
                const value = e.target.value || null
                handleCtaUpdate({ label: value })
              }}
              placeholder="e.g., Visit our website"
              maxLength={CTA_LABEL_MAX_LENGTH}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to hide the button
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cta-url">Button URL</Label>
            <Input
              id="cta-url"
              type="url"
              value={share.cta?.url ?? ''}
              onChange={(e) => {
                const value = e.target.value || null
                handleCtaUpdate({ url: value })
                // Clear error when user types
                onCtaUrlChange?.()
              }}
              onBlur={onCtaUrlBlur}
              placeholder="https://example.com"
              disabled={disabled}
              className={ctaUrlError ? 'border-destructive' : ''}
            />
            {ctaUrlError && (
              <p className="text-xs text-destructive">{ctaUrlError}</p>
            )}
          </div>
        </div>
      </EditorSection>
    </div>
  )
}
