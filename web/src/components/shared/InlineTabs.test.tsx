import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { InlineTabs, type TabItem } from "./InlineTabs";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("InlineTabs", () => {
  const mockTabs: TabItem[] = [
    { label: "Events", href: "/company/project/events" },
    { label: "Distribute", href: "/company/project/distribute" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all tabs with correct labels", () => {
    (usePathname as jest.Mock).mockReturnValue("/company/project/events");

    render(<InlineTabs tabs={mockTabs} />);

    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Distribute")).toBeInTheDocument();
  });

  it("marks the active tab based on current pathname", () => {
    (usePathname as jest.Mock).mockReturnValue("/company/project/events");

    render(<InlineTabs tabs={mockTabs} />);

    const eventsLink = screen.getByText("Events").closest("a");
    const distributeLink = screen.getByText("Distribute").closest("a");

    expect(eventsLink).toHaveClass("bg-accent");
    expect(eventsLink).toHaveClass("font-semibold");
    expect(eventsLink).toHaveAttribute("aria-current", "page");

    expect(distributeLink).toHaveClass("text-muted-foreground");
    expect(distributeLink).not.toHaveAttribute("aria-current");
  });

  it("applies custom aria-label when provided", () => {
    (usePathname as jest.Mock).mockReturnValue("/company/project/events");

    render(<InlineTabs tabs={mockTabs} ariaLabel="Custom navigation" />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Custom navigation");
  });

  it("uses default aria-label when not provided", () => {
    (usePathname as jest.Mock).mockReturnValue("/company/project/events");

    render(<InlineTabs tabs={mockTabs} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Section navigation");
  });

  it("applies custom className to container", () => {
    (usePathname as jest.Mock).mockReturnValue("/company/project/events");

    render(<InlineTabs tabs={mockTabs} className="custom-class" />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("custom-class");
  });

  it("renders links with correct hrefs", () => {
    (usePathname as jest.Mock).mockReturnValue("/company/project/events");

    render(<InlineTabs tabs={mockTabs} />);

    const eventsLink = screen.getByText("Events").closest("a");
    const distributeLink = screen.getByText("Distribute").closest("a");

    expect(eventsLink).toHaveAttribute("href", "/company/project/events");
    expect(distributeLink).toHaveAttribute(
      "href",
      "/company/project/distribute"
    );
  });

  it("meets minimum touch target size (44px)", () => {
    (usePathname as jest.Mock).mockReturnValue("/company/project/events");

    render(<InlineTabs tabs={mockTabs} />);

    const eventsLink = screen.getByText("Events").closest("a");

    expect(eventsLink).toHaveClass("min-h-[44px]");
    expect(eventsLink).toHaveClass("min-w-[44px]");
  });

  it("applies hover styles to inactive tabs", () => {
    (usePathname as jest.Mock).mockReturnValue("/company/project/events");

    render(<InlineTabs tabs={mockTabs} />);

    const distributeLink = screen.getByText("Distribute").closest("a");

    expect(distributeLink).toHaveClass("hover:bg-accent");
    expect(distributeLink).toHaveClass("hover:text-accent-foreground");
  });

  it("matches active tab when on nested route", () => {
    (usePathname as jest.Mock).mockReturnValue(
      "/company/project/events/event-123"
    );

    render(<InlineTabs tabs={mockTabs} />);

    const eventsLink = screen.getByText("Events").closest("a");

    expect(eventsLink).toHaveClass("bg-accent");
    expect(eventsLink).toHaveAttribute("aria-current", "page");
  });
});
