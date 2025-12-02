import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string; // Optional link
  isLogo?: boolean; // If true, renders larger (for emoji logo)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Dynamic breadcrumb navigation with "/" separator
 * Used across workspace layouts
 *
 * Mobile: Horizontal scroll with hidden scrollbar for long breadcrumb trails
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto scrollbar-hide">
      <ol className="flex items-center gap-2 text-sm whitespace-nowrap min-w-max">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          const logoClass = item.isLogo ? "text-xl" : "";

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={`text-muted-foreground hover:text-foreground transition-colors ${logoClass}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`${
                    isLast ? "text-foreground font-medium" : "text-muted-foreground"
                  } ${logoClass}`}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <span className="text-muted-foreground" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
