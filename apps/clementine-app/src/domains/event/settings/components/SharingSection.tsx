import { useForm, useWatch } from 'react-hook-form'
import { Download, Link2, Mail } from 'lucide-react'
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
} from 'react-icons/fa6'
import { FaTelegramPlane } from 'react-icons/fa'
import { toast } from 'sonner'
import { useUpdateShareOptions } from '../hooks/useUpdateShareOptions'
import { SharingOptionCard } from './SharingOptionCard'
import type { ProjectEventFull } from '@/domains/event/shared/schemas'
import { useAutoSave } from '@/shared/forms/hooks/useAutoSave'

interface SharingFormValues {
  download: boolean
  copyLink: boolean
  email: boolean
  instagram: boolean
  facebook: boolean
  linkedin: boolean
  twitter: boolean
  tiktok: boolean
  telegram: boolean
}

interface SharingSectionProps {
  event: ProjectEventFull
  projectId: string
  eventId: string
}

export function SharingSection({
  event,
  projectId,
  eventId,
}: SharingSectionProps) {
  const updateShareOptions = useUpdateShareOptions(projectId, eventId)

  const sharing = event.draftConfig?.sharing

  const form = useForm<SharingFormValues>({
    defaultValues: {
      download: sharing?.download ?? true,
      copyLink: sharing?.copyLink ?? true,
      email: sharing?.email ?? false,
      instagram: sharing?.instagram ?? false,
      facebook: sharing?.facebook ?? false,
      linkedin: sharing?.linkedin ?? false,
      twitter: sharing?.twitter ?? false,
      tiktok: sharing?.tiktok ?? false,
      telegram: sharing?.telegram ?? false,
    },
  })

  // Auto-save with toast feedback
  const { triggerSave } = useAutoSave({
    form,
    originalValues: sharing ?? {},
    onUpdate: async (updates) => {
      try {
        await updateShareOptions.mutateAsync(updates)
        toast.success('Sharing options saved')
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to save sharing options'
        toast.error(message)
      }
    },
    fieldsToCompare: [
      'download',
      'copyLink',
      'email',
      'instagram',
      'facebook',
      'linkedin',
      'twitter',
      'tiktok',
      'telegram',
    ],
    debounceMs: 300,
  })

  // Watch form values for rendering
  const formValues = useWatch({ control: form.control })

  // Toggle handler: update form + trigger save
  const toggleField = (field: keyof SharingFormValues) => {
    form.setValue(field, !formValues[field], { shouldDirty: true })
    triggerSave()
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-semibold">Sharing Options</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure which sharing options are available to guests
        </p>
      </div>

      <div className="space-y-6">
        {/* Main Options */}
        <div>
          <h4 className="mb-4 text-lg font-medium">Main Options</h4>
          <div className="flex flex-wrap gap-3">
            <SharingOptionCard
              icon={Download}
              label="Download"
              enabled={formValues.download ?? true}
              onClick={() => toggleField('download')}
            />
            <SharingOptionCard
              icon={Link2}
              label="Copy Link"
              enabled={formValues.copyLink ?? true}
              onClick={() => toggleField('copyLink')}
            />
          </div>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="mb-4 text-lg font-medium">Social Media</h4>
          <div className="flex flex-wrap gap-3">
            <SharingOptionCard
              icon={Mail}
              label="Email"
              enabled={formValues.email ?? false}
              onClick={() => toggleField('email')}
            />
            <SharingOptionCard
              icon={FaInstagram}
              label="Instagram"
              enabled={formValues.instagram ?? false}
              onClick={() => toggleField('instagram')}
            />
            <SharingOptionCard
              icon={FaFacebookF}
              label="Facebook"
              enabled={formValues.facebook ?? false}
              onClick={() => toggleField('facebook')}
            />
            <SharingOptionCard
              icon={FaLinkedinIn}
              label="LinkedIn"
              enabled={formValues.linkedin ?? false}
              onClick={() => toggleField('linkedin')}
            />
            <SharingOptionCard
              icon={FaXTwitter}
              label="Twitter"
              enabled={formValues.twitter ?? false}
              onClick={() => toggleField('twitter')}
            />
            <SharingOptionCard
              icon={FaTiktok}
              label="TikTok"
              enabled={formValues.tiktok ?? false}
              onClick={() => toggleField('tiktok')}
            />
            <SharingOptionCard
              icon={FaTelegramPlane}
              label="Telegram"
              enabled={formValues.telegram ?? false}
              onClick={() => toggleField('telegram')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
