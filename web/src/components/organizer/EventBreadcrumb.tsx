import Link from "next/link";

interface EventBreadcrumbProps {
  eventName: string;
}

/**
 * Breadcrumb navigation showing "Events > [Event name]"
 * Part of Phase 3 (User Story 0) - Base Events UI Navigation Shell
 */
export function EventBreadcrumb({ eventName }: EventBreadcrumbProps) {
  return (
    <nav className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        <li>
          <Link
            href="/events"
            className="hover:text-foreground transition-colors"
          >
            Events
          </Link>
        </li>
        <li aria-hidden="true">&gt;</li>
        <li className="text-foreground font-medium">{eventName}</li>
      </ol>
    </nav>
  );
}
