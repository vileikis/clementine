import { buildBreadcrumbs } from "./breadcrumbs";

const mockCompany = {
  name: "Acme Corp",
  slug: "acme",
};

describe("buildBreadcrumbs", () => {
  describe("with no segments", () => {
    it("returns empty array when no segments provided", () => {
      const result = buildBreadcrumbs(mockCompany);
      expect(result).toEqual([]);
    });

    it("returns empty array when segments is undefined", () => {
      const result = buildBreadcrumbs(mockCompany, undefined);
      expect(result).toEqual([]);
    });

    it("returns empty array when segments is empty object", () => {
      const result = buildBreadcrumbs(mockCompany, {});
      expect(result).toEqual([]);
    });
  });

  describe("project path", () => {
    it("builds breadcrumbs for project detail page", () => {
      const result = buildBreadcrumbs(mockCompany, {
        project: { name: "My Project", id: "proj123" },
      });

      expect(result).toEqual([
        { label: "Projects", href: "/acme/projects" },
        { label: "My Project", href: "/acme/proj123" },
      ]);
    });

    it("builds breadcrumbs for project sub-page with current label", () => {
      const result = buildBreadcrumbs(mockCompany, {
        project: { name: "My Project", id: "proj123" },
        current: "Events",
      });

      expect(result).toEqual([
        { label: "Projects", href: "/acme/projects" },
        { label: "My Project", href: "/acme/proj123" },
        { label: "Events" },
      ]);
    });
  });

  describe("event path", () => {
    it("builds breadcrumbs for event detail page", () => {
      const result = buildBreadcrumbs(mockCompany, {
        project: { name: "My Project", id: "proj123" },
        event: { name: "Launch Event", id: "evt456" },
      });

      expect(result).toEqual([
        { label: "Projects", href: "/acme/projects" },
        { label: "My Project", href: "/acme/proj123" },
        { label: "Launch Event", href: "/acme/proj123/evt456" },
      ]);
    });

    it("builds breadcrumbs for event sub-page with current label", () => {
      const result = buildBreadcrumbs(mockCompany, {
        project: { name: "My Project", id: "proj123" },
        event: { name: "Launch Event", id: "evt456" },
        current: "Theme",
      });

      expect(result).toEqual([
        { label: "Projects", href: "/acme/projects" },
        { label: "My Project", href: "/acme/proj123" },
        { label: "Launch Event", href: "/acme/proj123/evt456" },
        { label: "Theme" },
      ]);
    });

    it("ignores event when project is not provided", () => {
      const result = buildBreadcrumbs(mockCompany, {
        event: { name: "Orphan Event", id: "evt789" },
      });

      // Event without project is ignored per data-model.md validation rules
      expect(result).toEqual([]);
    });
  });

  describe("experience path", () => {
    it("builds breadcrumbs for experience detail page", () => {
      const result = buildBreadcrumbs(mockCompany, {
        experience: { name: "My Flow", id: "exp789" },
      });

      expect(result).toEqual([
        { label: "Experiences", href: "/acme/exps" },
        { label: "My Flow", href: "/acme/exps/exp789" },
      ]);
    });

    it("builds breadcrumbs for experience sub-page with current label", () => {
      const result = buildBreadcrumbs(mockCompany, {
        experience: { name: "My Flow", id: "exp789" },
        current: "Settings",
      });

      expect(result).toEqual([
        { label: "Experiences", href: "/acme/exps" },
        { label: "My Flow", href: "/acme/exps/exp789" },
        { label: "Settings" },
      ]);
    });
  });

  describe("current label only", () => {
    it("adds only current page label when no path segments", () => {
      const result = buildBreadcrumbs(mockCompany, {
        current: "Settings",
      });

      expect(result).toEqual([{ label: "Settings" }]);
    });
  });

  describe("edge cases", () => {
    it("handles special characters in project name", () => {
      const result = buildBreadcrumbs(mockCompany, {
        project: { name: "Project & Sons <LLC>", id: "proj123" },
      });

      expect(result[1].label).toBe("Project & Sons <LLC>");
    });

    it("handles company slug with hyphens", () => {
      const result = buildBreadcrumbs(
        { name: "Acme Corp", slug: "acme-corp-ltd" },
        { project: { name: "Test", id: "p1" } }
      );

      expect(result[0].href).toBe("/acme-corp-ltd/projects");
      expect(result[1].href).toBe("/acme-corp-ltd/p1");
    });

    it("handles empty string project name", () => {
      const result = buildBreadcrumbs(mockCompany, {
        project: { name: "", id: "proj123" },
      });

      expect(result[1].label).toBe("");
    });
  });
});
