/**
 * Unit tests for useEngine hook
 * Tests: Engine initialization, navigation actions, callbacks
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useEngine } from "../hooks/useEngine";
import type { EngineConfig } from "../types";
import type { StepInfo } from "@/features/steps/types";

// ============================================================================
// Test Fixtures
// ============================================================================

/** Create a mock info step */
function createMockInfoStep(
  id: string,
  overrides: Partial<StepInfo> = {}
): StepInfo {
  const now = Date.now();
  return {
    id,
    experienceId: "test-exp",
    type: "info",
    title: `Step ${id}`,
    description: null,
    mediaUrl: null,
    mediaType: null,
    ctaLabel: "Continue",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Create a minimal engine config for testing */
function createTestConfig(
  overrides: Partial<EngineConfig> = {}
): EngineConfig {
  const step1 = createMockInfoStep("step-1");
  const step2 = createMockInfoStep("step-2");
  const step3 = createMockInfoStep("step-3");

  return {
    experienceId: "test-experience",
    steps: [step1, step2, step3],
    stepsOrder: ["step-1", "step-2", "step-3"],
    flowName: "Test Flow",
    persistSession: false,
    allowBack: true,
    allowSkip: false,
    debugMode: false,
    ...overrides,
  };
}

// ============================================================================
// Engine Initialization Tests (T022)
// ============================================================================

describe("useEngine - Initialization", () => {
  it("initializes with first step", async () => {
    const config = createTestConfig();
    const { result } = renderHook(() => useEngine({ config }));

    // Wait for engine to transition from loading to running
    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    expect(result.current.state.currentStepIndex).toBe(0);
    expect(result.current.state.currentStep?.id).toBe("step-1");
    expect(result.current.isReady).toBe(true);
  });

  it("fires onStart callback when engine starts", async () => {
    const onStart = jest.fn();
    const config = createTestConfig({ onStart });

    const { result } = renderHook(() => useEngine({ config }));

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({
        experienceId: "test-experience",
        currentStepIndex: 0,
      })
    );
  });

  it("handles empty steps array by completing immediately", async () => {
    const config = createTestConfig({
      steps: [],
      stepsOrder: [],
    });

    const { result } = renderHook(() => useEngine({ config }));

    await waitFor(() => {
      expect(result.current.state.status).toBe("completed");
    });

    expect(result.current.state.currentStep).toBeNull();
  });

  it("orders steps according to stepsOrder", async () => {
    const step1 = createMockInfoStep("step-1", { title: "First" });
    const step2 = createMockInfoStep("step-2", { title: "Second" });
    const step3 = createMockInfoStep("step-3", { title: "Third" });

    // Steps in different order than stepsOrder
    const config = createTestConfig({
      steps: [step3, step1, step2],
      stepsOrder: ["step-2", "step-3", "step-1"],
    });

    const { result } = renderHook(() => useEngine({ config }));

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    // First step should be step-2 based on stepsOrder
    expect(result.current.state.currentStep?.id).toBe("step-2");
    expect(result.current.state.currentStep?.title).toBe("Second");
  });

  it("provides correct navigation flags on initialization", async () => {
    const config = createTestConfig({
      allowBack: true,
      allowSkip: true,
    });

    const { result } = renderHook(() => useEngine({ config }));

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    // At first step
    expect(result.current.state.canGoBack).toBe(false); // Can't go back from first step
    expect(result.current.state.canGoNext).toBe(true); // Can go forward
    expect(result.current.state.canSkip).toBe(true); // Skip is allowed
    expect(result.current.state.isAutoAdvancing).toBe(false);
  });

  it("initializes session with empty data", async () => {
    const config = createTestConfig();
    const { result } = renderHook(() => useEngine({ config }));

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    expect(result.current.session.data).toEqual({});
    expect(result.current.state.sessionData).toEqual({});
    expect(result.current.state.transformStatus).toEqual({ status: "idle" });
  });
});

// ============================================================================
// Navigation Tests (T028)
// ============================================================================

describe("useEngine - Navigation", () => {
  describe("next()", () => {
    it("advances to next step", async () => {
      const config = createTestConfig();
      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.next();
      });

      expect(result.current.state.currentStepIndex).toBe(1);
      expect(result.current.state.currentStep?.id).toBe("step-2");
    });

    it("fires onStepChange callback with correct payload", async () => {
      const onStepChange = jest.fn();
      const config = createTestConfig({ onStepChange });

      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.next();
      });

      expect(onStepChange).toHaveBeenCalledWith({
        index: 1,
        step: expect.objectContaining({ id: "step-2" }),
        direction: "forward",
        previousIndex: 0,
      });
    });

    it("fires onComplete when advancing past last step", async () => {
      const onComplete = jest.fn();
      const step1 = createMockInfoStep("step-1");

      const config = createTestConfig({
        steps: [step1],
        stepsOrder: ["step-1"],
        onComplete,
      });

      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.next();
      });

      expect(result.current.state.status).toBe("completed");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("debounces rapid navigation calls", async () => {
      const config = createTestConfig();
      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      // Rapid fire navigation
      act(() => {
        result.current.actions.next();
        result.current.actions.next();
        result.current.actions.next();
      });

      // Should only advance once due to debouncing
      expect(result.current.state.currentStepIndex).toBe(1);
    });
  });

  describe("previous()", () => {
    it("navigates to previous step when allowed", async () => {
      const config = createTestConfig({ allowBack: true });
      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      // First go forward
      act(() => {
        result.current.actions.next();
      });

      expect(result.current.state.currentStepIndex).toBe(1);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Then go back
      act(() => {
        result.current.actions.previous();
      });

      expect(result.current.state.currentStepIndex).toBe(0);
    });

    it("does nothing when allowBack is false", async () => {
      const config = createTestConfig({ allowBack: false });
      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      // Go forward first
      act(() => {
        result.current.actions.next();
      });

      expect(result.current.state.currentStepIndex).toBe(1);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Try to go back - should not work
      act(() => {
        result.current.actions.previous();
      });

      expect(result.current.state.currentStepIndex).toBe(1);
    });

    it("does nothing at first step", async () => {
      const config = createTestConfig({ allowBack: true });
      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.previous();
      });

      expect(result.current.state.currentStepIndex).toBe(0);
    });

    it("fires onStepChange with backward direction", async () => {
      const onStepChange = jest.fn();
      const config = createTestConfig({ allowBack: true, onStepChange });

      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.next();
      });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 200));

      act(() => {
        result.current.actions.previous();
      });

      expect(onStepChange).toHaveBeenLastCalledWith({
        index: 0,
        step: expect.objectContaining({ id: "step-1" }),
        direction: "backward",
        previousIndex: 1,
      });
    });
  });

  describe("skip()", () => {
    it("skips current step when allowed", async () => {
      const config = createTestConfig({ allowSkip: true });
      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.skip();
      });

      expect(result.current.state.currentStepIndex).toBe(1);
    });

    it("does nothing when allowSkip is false", async () => {
      const config = createTestConfig({ allowSkip: false });
      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.skip();
      });

      expect(result.current.state.currentStepIndex).toBe(0);
    });

    it("fires onStepChange with skip direction", async () => {
      const onStepChange = jest.fn();
      const config = createTestConfig({ allowSkip: true, onStepChange });

      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.skip();
      });

      expect(onStepChange).toHaveBeenCalledWith({
        index: 1,
        step: expect.objectContaining({ id: "step-2" }),
        direction: "skip",
        previousIndex: 0,
      });
    });
  });

  describe("restart()", () => {
    it("resets to first step", async () => {
      const config = createTestConfig();
      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      // Navigate forward
      act(() => {
        result.current.actions.next();
      });

      expect(result.current.state.currentStepIndex).toBe(1);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Restart
      act(() => {
        result.current.actions.restart();
      });

      expect(result.current.state.currentStepIndex).toBe(0);
      expect(result.current.state.status).toBe("running");
    });

    it("fires onStepChange with restart direction", async () => {
      const onStepChange = jest.fn();
      const config = createTestConfig({ onStepChange });

      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.next();
      });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 200));

      act(() => {
        result.current.actions.restart();
      });

      expect(onStepChange).toHaveBeenLastCalledWith({
        index: 0,
        step: expect.objectContaining({ id: "step-1" }),
        direction: "restart",
        previousIndex: 1,
      });
    });
  });

  describe("goToStep()", () => {
    it("jumps to specific step in debug mode", async () => {
      const config = createTestConfig({ debugMode: true });
      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.goToStep(2);
      });

      expect(result.current.state.currentStepIndex).toBe(2);
      expect(result.current.state.currentStep?.id).toBe("step-3");
    });

    it("does nothing when not in debug mode", async () => {
      const config = createTestConfig({ debugMode: false });
      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.goToStep(2);
      });

      expect(result.current.state.currentStepIndex).toBe(0);
    });

    it("does nothing for invalid index", async () => {
      const config = createTestConfig({ debugMode: true });
      const { result } = renderHook(() => useEngine({ config }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("running");
      });

      act(() => {
        result.current.actions.goToStep(-1);
      });

      expect(result.current.state.currentStepIndex).toBe(0);

      act(() => {
        result.current.actions.goToStep(100);
      });

      expect(result.current.state.currentStepIndex).toBe(0);
    });
  });
});

// ============================================================================
// Input Update Tests
// ============================================================================

describe("useEngine - Input Updates", () => {
  it("updates session data via updateInput", async () => {
    const config = createTestConfig();
    const { result } = renderHook(() => useEngine({ config }));

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    act(() => {
      result.current.actions.updateInput("step-1", {
        type: "text",
        value: "test input",
      });
    });

    expect(result.current.session.data["step-1"]).toEqual({
      type: "text",
      value: "test input",
    });
  });

  it("fires onDataUpdate callback when data changes", async () => {
    const onDataUpdate = jest.fn();
    const config = createTestConfig({ onDataUpdate });

    const { result } = renderHook(() => useEngine({ config }));

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    act(() => {
      result.current.actions.updateInput("step-1", {
        type: "text",
        value: "hello",
      });
    });

    expect(onDataUpdate).toHaveBeenCalled();
  });
});

// ============================================================================
// Navigation Flags Tests
// ============================================================================

describe("useEngine - Navigation Flags", () => {
  it("updates canGoBack when navigating", async () => {
    const config = createTestConfig({ allowBack: true });
    const { result } = renderHook(() => useEngine({ config }));

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    // At step 0, canGoBack should be false
    expect(result.current.state.canGoBack).toBe(false);

    act(() => {
      result.current.actions.next();
    });

    // At step 1, canGoBack should be true
    expect(result.current.state.canGoBack).toBe(true);
  });

  it("updates canGoNext based on position", async () => {
    const step1 = createMockInfoStep("step-1");
    const step2 = createMockInfoStep("step-2");

    const config = createTestConfig({
      steps: [step1, step2],
      stepsOrder: ["step-1", "step-2"],
    });

    const { result } = renderHook(() => useEngine({ config }));

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    // At step 0, canGoNext should be true
    expect(result.current.state.canGoNext).toBe(true);

    act(() => {
      result.current.actions.next();
    });

    // At last step, canGoNext should be false
    expect(result.current.state.canGoNext).toBe(false);
  });
});
