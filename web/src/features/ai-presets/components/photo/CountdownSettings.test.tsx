import { render, screen } from "@testing-library/react";
import { CountdownSettings } from "./CountdownSettings";

describe("CountdownSettings Component - Updated for 003-experience-schema", () => {
  const mockOnCountdownSecondsChange = jest.fn();

  const defaultProps = {
    countdownSeconds: 0,
    onCountdownSecondsChange: mockOnCountdownSecondsChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("New Schema Alignment - No Toggle, Direct Value", () => {
    it("always shows countdown duration slider", () => {
      render(<CountdownSettings {...defaultProps} />);

      // Check that slider is always visible
      expect(screen.getByRole("slider")).toBeInTheDocument();
      // Check that label is present
      const label = screen.getByText("Countdown Duration");
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe("LABEL");
    });

    it("displays 'Disabled' when countdownSeconds is 0", () => {
      render(<CountdownSettings {...defaultProps} countdownSeconds={0} />);

      expect(screen.getByText("Disabled")).toBeInTheDocument();
    });

    it("displays seconds value when countdownSeconds > 0", () => {
      render(<CountdownSettings {...defaultProps} countdownSeconds={3} />);

      expect(screen.getByText("3s")).toBeInTheDocument();
    });

    it("slider has value of 0 when countdown is disabled", () => {
      render(<CountdownSettings {...defaultProps} countdownSeconds={0} />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-valuenow", "0");
    });

    it("slider has value of 5 when countdownSeconds is 5", () => {
      render(<CountdownSettings {...defaultProps} countdownSeconds={5} />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-valuenow", "5");
    });
  });

  describe("Slider Behavior", () => {
    it("slider has correct min and max attributes (0-10)", () => {
      render(<CountdownSettings {...defaultProps} />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-valuemin", "0");
      expect(slider).toHaveAttribute("aria-valuemax", "10");
    });

    it("supports values at boundaries (0 and 10 seconds)", () => {
      const { rerender } = render(
        <CountdownSettings {...defaultProps} countdownSeconds={0} />
      );
      expect(screen.getByText("Disabled")).toBeInTheDocument();

      rerender(
        <CountdownSettings {...defaultProps} countdownSeconds={10} />
      );
      expect(screen.getByText("10s")).toBeInTheDocument();
    });

    it("displays correct seconds value for any value", () => {
      render(<CountdownSettings {...defaultProps} countdownSeconds={7} />);

      expect(screen.getByText("7s")).toBeInTheDocument();
    });
  });

  describe("Component Rendering", () => {
    it("renders countdown timer heading", () => {
      render(<CountdownSettings {...defaultProps} />);

      expect(screen.getByText("Countdown Timer")).toBeInTheDocument();
    });

    it("displays helper text about countdown timer", () => {
      render(<CountdownSettings {...defaultProps} />);

      expect(screen.getByText(/set to 0 to disable countdown/i)).toBeInTheDocument();
      expect(screen.getByText(/guests will see a countdown before photo capture/i)).toBeInTheDocument();
    });

    it("disables slider when disabled prop is true", () => {
      render(<CountdownSettings {...defaultProps} disabled={true} />);

      const slider = screen.getByRole("slider");
      // Radix UI slider uses data-disabled attribute, not aria-disabled
      expect(slider).toHaveAttribute("data-disabled", "");
    });
  });
});
