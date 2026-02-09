import type { LucideIcon } from 'lucide-react'

interface WipPlaceholderProps {
  icon: LucideIcon
  title: string
  description: string
}

export function WipPlaceholder({
  icon: Icon,
  title,
  description,
}: WipPlaceholderProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-lg bg-muted p-8 text-center">
        <Icon className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
