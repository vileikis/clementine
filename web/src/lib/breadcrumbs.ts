import type { BreadcrumbItem } from "@/components/shared/Breadcrumbs";

/**
 * Segments used to build breadcrumb trail
 */
export type BreadcrumbSegments = {
  project?: { name: string; id: string };
  event?: { name: string; id: string };
  experience?: { name: string; id: string };
  current?: string;
};

/**
 * Build breadcrumb trail for workspace pages
 *
 * @param company - Company context with slug for URL construction
 * @param segments - Optional segments for nested navigation
 * @returns Array of BreadcrumbItem for use with Breadcrumbs component
 *
 * @example
 * // Project page: Projects > ProjectName
 * buildBreadcrumbs(company, { project: { name: "My Project", id: "abc123" } })
 *
 * @example
 * // Event page: Projects > ProjectName > EventName
 * buildBreadcrumbs(company, {
 *   project: { name: "My Project", id: "abc123" },
 *   event: { name: "Launch Event", id: "evt456" }
 * })
 *
 * @example
 * // Theme page (nested under event): Projects > ProjectName > EventName > Theme
 * buildBreadcrumbs(company, {
 *   project: { name: "My Project", id: "abc123" },
 *   event: { name: "Launch Event", id: "evt456" },
 *   current: "Theme"
 * })
 *
 * @example
 * // Experience page: Experiences > ExperienceName
 * buildBreadcrumbs(company, { experience: { name: "My Flow", id: "exp789" } })
 */
export function buildBreadcrumbs(
  company: { name: string; slug: string },
  segments?: BreadcrumbSegments
): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [];
  const { project, event, experience, current } = segments ?? {};

  // Project path: Projects > ProjectName > (optional Event) > (optional current)
  if (project) {
    crumbs.push({
      label: "Projects",
      href: `/${company.slug}/projects`,
    });
    crumbs.push({
      label: project.name,
      href: `/${company.slug}/${project.id}`,
    });

    // Event is nested under project
    if (event) {
      crumbs.push({
        label: event.name,
        href: `/${company.slug}/${project.id}/${event.id}`,
      });
    }
  }

  // Experience path: Experiences > ExperienceName
  // Note: Experience is a separate path, not nested under project/event
  if (experience) {
    crumbs.push({
      label: "Experiences",
      href: `/${company.slug}/exps`,
    });
    crumbs.push({
      label: experience.name,
      href: `/${company.slug}/exps/${experience.id}`,
    });
  }

  // Current page (last breadcrumb, no link)
  if (current) {
    crumbs.push({ label: current });
  }

  return crumbs;
}
