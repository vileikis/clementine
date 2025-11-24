import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string; // Optional link
}

interface EditorBreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Dynamic breadcrumb navigation for editors
 * Used in Journey and Experience editor layouts
 */
export function EditorBreadcrumbs({ items }: EditorBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "text-foreground font-medium" : "text-muted-foreground"}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
