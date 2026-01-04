import { Link } from '@tanstack/react-router'
import type { BreadcrumbItem } from './TopNavBar'
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbItem as ShadcnBreadcrumbItem,
} from '@/ui-kit/components/ui/breadcrumb'

interface TopNavBreadcrumbProps {
  items: BreadcrumbItem[]
}

export function TopNavBreadcrumb({ items }: TopNavBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const Icon = item.icon
          const isLast = index === items.length - 1
          const isClickable = !isLast && item.href
          const hasIconLink = Boolean(item.iconHref && Icon)

          return (
            <div key={index} className="contents">
              {/* Separate icon link (if iconHref is provided) */}
              {hasIconLink && Icon && (
                <>
                  <ShadcnBreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={item.iconHref} className="flex-shrink-0">
                        <Icon className="size-4" />
                      </Link>
                    </BreadcrumbLink>
                  </ShadcnBreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}

              {/* Text breadcrumb (clickable or static) */}
              <ShadcnBreadcrumbItem className="min-w-0">
                {isClickable ? (
                  <BreadcrumbLink asChild>
                    <Link
                      to={item.href}
                      className="flex items-center gap-1.5 min-w-0"
                    >
                      {!hasIconLink && Icon && (
                        <Icon className="flex-shrink-0 size-4" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="flex items-center gap-1.5 min-w-0 font-medium">
                    {!hasIconLink && Icon && (
                      <Icon className="flex-shrink-0 size-4" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </BreadcrumbPage>
                )}
              </ShadcnBreadcrumbItem>

              {!isLast && <BreadcrumbSeparator />}
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
