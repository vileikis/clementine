import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type { BreadcrumbItem } from './TopNavBar'

interface TopNavBreadcrumbProps {
  items: BreadcrumbItem[]
}

export function TopNavBreadcrumb({ items }: TopNavBreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {items.map((item, index) => {
        const Icon = item.icon
        const isLast = index === items.length - 1
        const isClickable = !isLast && item.href

        return (
          <div key={index} className="flex items-center gap-2 min-w-0">
            {isClickable ? (
              <Link
                to={item.href}
                className="flex items-center gap-2 min-w-0 hover:text-primary transition-colors"
              >
                {Icon && <Icon className="flex-shrink-0 size-4" />}
                <span className="truncate">{item.label}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                {Icon && <Icon className="flex-shrink-0 size-4" />}
                <span className="truncate font-medium">{item.label}</span>
              </div>
            )}
            {!isLast && (
              <ChevronRight className="flex-shrink-0 size-4 text-muted-foreground" />
            )}
          </div>
        )
      })}
    </div>
  )
}
