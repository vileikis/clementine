import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CountdownSettings } from "./CountdownSettings";

describe("CountdownSettings Component - User Story 3", () => {
  const mockOnCountdownEnabledChange = jest.fn();
  const mockOnCountdownSecondsChange = jest.fn();

  const defaultProps = {
    countdownEnabled: false,
    countdownSeconds: 3,
    onCountdownEnabledChange: mockOnCountdownEnabledChange,
    onCountdownSecondsChange: mockOnCountdownSecondsChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("T040 - Toggle shows/hides timer input", () => {
    it("hides countdown duration slider when toggle is disabled", () => {
      render(<CountdownSettings {...defaultProps} countdownEnabled={false} />);

      expect(screen.queryByLabelText(/countdown duration/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/set timer duration/i)).not.toBeInTheDocument();
    });

    it("shows countdown duration slider when toggle is enabled", () => {
      render(<CountdownSettings {...defaultProps} countdownEnabled={true} />);

      expect(screen.getByText(/countdown duration/i)).toBeInTheDocument();
      expect(screen.getByText(/set timer duration/i)).toBeInTheDocument();
    });

    it("calls onCountdownEnabledChange when toggle is clicked", async () => {
      render(<CountdownSettings {...defaultProps} countdownEnabled={false} />);
      const user = userEvent.setup();

      // Switch doesn't have an accessible name - find by id instead
      const toggle = screen.getByRole("switch");
      await user.click(toggle);

      expect(mockOnCountdownEnabledChange).toHaveBeenCalledWith(true);
    });

    it("toggle starts in unchecked state when countdownEnabled is false", () => {
      render(<CountdownSettings {...defaultProps} countdownEnabled={false} />);

      const toggle = screen.getByRole("switch");
      expect(toggle).not.toBeChecked();
    });

    it("toggle starts in checked state when countdownEnabled is true", () => {
      render(<CountdownSettings {...defaultProps} countdownEnabled={true} />);

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeChecked();
    });
  });

  describe("T041 - Default value of 3 seconds", () => {
    it("displays 3 seconds when countdownSeconds is 3", () => {
      render(<CountdownSettings {...defaultProps} countdownEnabled={true} countdownSeconds={3} />);

      expect(screen.getByText("3s")).toBeInTheDocument();
    });

    it("displays correct seconds value for any provided value", () => {
      render(<CountdownSettings {...defaultProps} countdownEnabled={true} countdownSeconds={5} />);

      expect(screen.getByText("5s")).toBeInTheDocument();
    });

    it("slider has value of 3 when countdownSeconds is 3", () => {
      render(<CountdownSettings {...defaultProps} countdownEnabled={true} countdownSeconds={3} />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-valuenow", "3");
    });

    it("slider has correct min and max attributes (0-10)", () => {
      render(<CountdownSettings {...defaultProps} countdownEnabled={true} />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-valuemin", "0");
      expect(slider).toHaveAttribute("aria-valuemax", "10");
    });
  });

  describe("Additional functionality", () => {
    it("renders countdown timer heading", () => {
      render(<CountdownSettings {...defaultProps} />);

      expect(screen.getByText("Countdown Timer")).toBeInTheDocument();
    });

    it("disables toggle when disabled prop is true", () => {
      render(<CountdownSettings {...defaultProps} disabled={true} />);

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeDisabled();
    });

    it("disables slider when disabled prop is true", () => {
      render(<CountdownSettings {...defaultProps} countdownEnabled={true} disabled={true} />);

      const slider = screen.getByRole("slider");
      // Radix UI slider uses data-disabled attribute, not aria-disabled
      expect(slider).toHaveAttribute("data-disabled", "");
    });

    it("displays helper text about countdown timer", () => {
      render(<CountdownSettings {...defaultProps} countdownEnabled={true} />);

      expect(screen.getByText(/guests will see a countdown before photo capture/i)).toBeInTheDocument();
    });

    it("supports values at boundaries (0 and 10 seconds)", () => {
      const { rerender } = render(
        <CountdownSettings {...defaultProps} countdownEnabled={true} countdownSeconds={0} />
      );
      expect(screen.getByText("0s")).toBeInTheDocument();

      rerender(
        <CountdownSettings {...defaultProps} countdownEnabled={true} countdownSeconds={10} />
      );
      expect(screen.getByText("10s")).toBeInTheDocument();
    });
  });
});
