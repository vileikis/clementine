import { Plug } from 'lucide-react'
import { WipPlaceholder } from '@/shared/components'

export function ConnectPage() {
  return (
    <WipPlaceholder
      icon={Plug}
      title="Connect"
      description="Set up integrations and webhooks to automatically send results to Dropbox, Google Drive, and more."
    />
  )
}
