import { useForm } from 'react-hook-form'
import {
  Download,
  Facebook,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  MessageCircle,
  Twitter,
  Video,
} from 'lucide-react'
import { useUpdateShareOptions } from '../hooks/useUpdateShareOptions'
import { SharingOptionCard } from './SharingOptionCard'
import type { ProjectEventFull } from '@/domains/event/shared/schemas'
import { useAutoSave } from '@/shared/forms/hooks/useAutoSave'

interface SharingFormValues {
  downloadEnabled: boolean
  copyLinkEnabled: boolean
  socials: {
    email: boolean
    instagram: boolean
    facebook: boolean
    linkedin: boolean
    twitter: boolean
    tiktok: boolean
    telegram: boolean
  }
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
      downloadEnabled: sharing?.downloadEnabled ?? true,
      copyLinkEnabled: sharing?.copyLinkEnabled ?? true,
      socials: {
        email: sharing?.socials?.email ?? false,
        instagram: sharing?.socials?.instagram ?? false,
        facebook: sharing?.socials?.facebook ?? false,
        linkedin: sharing?.socials?.linkedin ?? false,
        twitter: sharing?.socials?.twitter ?? false,
        tiktok: sharing?.socials?.tiktok ?? false,
        telegram: sharing?.socials?.telegram ?? false,
      },
    },
  })

  const { handleBlur } = useAutoSave({
    form,
    originalValues: sharing ?? {},
    onUpdate: async (updates) => {
      await updateShareOptions.mutateAsync(updates)
    },
    fieldsToCompare: ['downloadEnabled', 'copyLinkEnabled', 'socials'],
    debounceMs: 300,
  })

  const toggleField = (field: keyof SharingFormValues | string) => {
    if (field === 'downloadEnabled' || field === 'copyLinkEnabled') {
      form.setValue(field, !form.watch(field), { shouldDirty: true })
    } else if (field.startsWith('socials.')) {
      const socialField = field.split(
        '.',
      )[1] as keyof SharingFormValues['socials']
      form.setValue(
        `socials.${socialField}`,
        !form.watch(`socials.${socialField}`),
        { shouldDirty: true },
      )
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-semibold">Sharing Options</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure which sharing options are available to guests
        </p>
      </div>

      <form onBlur={handleBlur} className="space-y-6">
        {/* Main Options */}
        <div>
          <h4 className="mb-4 text-lg font-medium">Main Options</h4>
          <div className="flex flex-wrap gap-3">
            <SharingOptionCard
              icon={Download}
              label="Download"
              enabled={form.watch('downloadEnabled')}
              onClick={() => toggleField('downloadEnabled')}
            />
            <SharingOptionCard
              icon={Link2}
              label="Copy Link"
              enabled={form.watch('copyLinkEnabled')}
              onClick={() => toggleField('copyLinkEnabled')}
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
              enabled={form.watch('socials.email')}
              onClick={() => toggleField('socials.email')}
            />
            <SharingOptionCard
              icon={Instagram}
              label="Instagram"
              enabled={form.watch('socials.instagram')}
              onClick={() => toggleField('socials.instagram')}
            />
            <SharingOptionCard
              icon={Facebook}
              label="Facebook"
              enabled={form.watch('socials.facebook')}
              onClick={() => toggleField('socials.facebook')}
            />
            <SharingOptionCard
              icon={Linkedin}
              label="LinkedIn"
              enabled={form.watch('socials.linkedin')}
              onClick={() => toggleField('socials.linkedin')}
            />
            <SharingOptionCard
              icon={Twitter}
              label="Twitter"
              enabled={form.watch('socials.twitter')}
              onClick={() => toggleField('socials.twitter')}
            />
            <SharingOptionCard
              icon={Video}
              label="TikTok"
              enabled={form.watch('socials.tiktok')}
              onClick={() => toggleField('socials.tiktok')}
            />
            <SharingOptionCard
              icon={MessageCircle}
              label="Telegram"
              enabled={form.watch('socials.telegram')}
              onClick={() => toggleField('socials.telegram')}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
