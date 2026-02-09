import { ProjectConfigDesignerPage } from './ProjectConfigDesignerPage'
import type { TabItem } from '@/domains/navigation'
import { NavTabs } from '@/domains/navigation'

const designerSubTabs: TabItem[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    to: '/workspace/$workspaceSlug/projects/$projectId/designer/welcome',
  },
  {
    id: 'share',
    label: 'Share',
    to: '/workspace/$workspaceSlug/projects/$projectId/designer/share',
  },
  {
    id: 'theme',
    label: 'Theme',
    to: '/workspace/$workspaceSlug/projects/$projectId/designer/theme',
  },
  {
    id: 'settings',
    label: 'Settings',
    to: '/workspace/$workspaceSlug/projects/$projectId/designer/settings',
  },
]

export function ProjectConfigDesignerLayout() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6">
        <NavTabs tabs={designerSubTabs} />
      </div>
      <ProjectConfigDesignerPage />
    </div>
  )
}
