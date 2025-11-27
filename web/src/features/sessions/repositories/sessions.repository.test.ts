import { db } from "@/lib/firebase/admin";
import type { Session } from "../types";
import {
  startSession,
  saveCapture,
  updateSessionState,
  getSession,
  startJourneySession,
  updateStepIndex,
  saveStepData,
} from "./sessions.repository";

describe("Sessions Repository", () => {
  const mockDb = db as unknown as {
    collection: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("startSession", () => {
    it("creates a new session for an event", async () => {
      const mockEventDoc = {
        exists: true,
      };

      const mockSessionRef = {
        id: "session-456",
        set: jest.fn(),
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        get: jest.fn().mockResolvedValue(mockEventDoc),
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const sessionId = await startSession("event-123");

      expect(sessionId).toBe("session-456");
      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockEventRef.collection).toHaveBeenCalledWith("sessions");

      // Verify session data structure
      const sessionData = mockSessionRef.set.mock.calls[0][0] as Session;
      expect(sessionData).toMatchObject({
        id: "session-456",
        eventId: "event-123",
        state: "created",
      });
      expect(sessionData.createdAt).toBeGreaterThan(0);
      expect(sessionData.updatedAt).toBe(sessionData.createdAt);
    });

    it("throws error when event does not exist", async () => {
      const mockEventDoc = {
        exists: false,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockEventDoc),
        }),
      });

      await expect(startSession("nonexistent")).rejects.toThrow(
        "Event not found"
      );
    });
  });

  describe("saveCapture", () => {
    it("updates session with input image path", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await saveCapture(
        "event-123",
        "session-456",
        "sessions/session-456/input.jpg"
      );

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockEventRef.collection).toHaveBeenCalledWith("sessions");
      expect(mockSessionCollection.doc).toHaveBeenCalledWith("session-456");
      expect(mockUpdate).toHaveBeenCalledWith({
        inputImagePath: "sessions/session-456/input.jpg",
        state: "captured",
        updatedAt: expect.any(Number),
      });
    });
  });

  describe("updateSessionState", () => {
    it("updates session state only", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateSessionState("event-123", "session-456", "transforming");

      expect(mockUpdate).toHaveBeenCalledWith({
        state: "transforming",
        updatedAt: expect.any(Number),
      });
    });

    it("updates session state with result image path", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateSessionState("event-123", "session-456", "ready", {
        resultImagePath: "sessions/session-456/result.jpg",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        state: "ready",
        resultImagePath: "sessions/session-456/result.jpg",
        updatedAt: expect.any(Number),
      });
    });

    it("updates session state with error message", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateSessionState("event-123", "session-456", "error", {
        error: "AI generation failed",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        state: "error",
        error: "AI generation failed",
        updatedAt: expect.any(Number),
      });
    });

    it("updates session state with both result and error", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateSessionState("event-123", "session-456", "ready", {
        resultImagePath: "sessions/session-456/result.jpg",
        error: "Partial error",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        state: "ready",
        resultImagePath: "sessions/session-456/result.jpg",
        error: "Partial error",
        updatedAt: expect.any(Number),
      });
    });
  });

  describe("getSession", () => {
    it("returns session when it exists", async () => {
      const mockSessionData = {
        eventId: "event-123",
        state: "ready",
        inputImagePath: "sessions/session-456/input.jpg",
        resultImagePath: "sessions/session-456/result.jpg",
        createdAt: 1234567890,
        updatedAt: 1234567900,
      };

      const mockSessionDoc = {
        exists: true,
        id: "session-456",
        data: jest.fn().mockReturnValue(mockSessionData),
      };

      const mockSessionRef = {
        get: jest.fn().mockResolvedValue(mockSessionDoc),
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const session = await getSession("event-123", "session-456");

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(session).toEqual({ id: "session-456", ...mockSessionData });
    });

    it("returns null when session does not exist", async () => {
      const mockSessionDoc = {
        exists: false,
      };

      const mockSessionRef = {
        get: jest.fn().mockResolvedValue(mockSessionDoc),
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const session = await getSession("event-123", "nonexistent");

      expect(session).toBeNull();
    });

    it("validates session data with schema", async () => {
      const invalidSessionData = {
        eventId: "event-123",
        state: "invalid-state",
        createdAt: 1234567890,
        updatedAt: 1234567900,
      };

      const mockSessionDoc = {
        exists: true,
        id: "session-456",
        data: jest.fn().mockReturnValue(invalidSessionData),
      };

      const mockSessionRef = {
        get: jest.fn().mockResolvedValue(mockSessionDoc),
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await expect(getSession("event-123", "session-456")).rejects.toThrow();
    });
  });

  // ============================================================================
  // Tests for new journey support functions
  // ============================================================================

  describe("startJourneySession", () => {
    it("creates a new session with journey context", async () => {
      const mockEventDoc = {
        exists: true,
      };

      const mockSessionRef = {
        id: "session-789",
        set: jest.fn(),
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        get: jest.fn().mockResolvedValue(mockEventDoc),
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const sessionId = await startJourneySession("event-123", "journey-456");

      expect(sessionId).toBe("session-789");

      const sessionData = mockSessionRef.set.mock.calls[0][0] as Session;
      expect(sessionData).toMatchObject({
        id: "session-789",
        eventId: "event-123",
        journeyId: "journey-456",
        currentStepIndex: 0,
        data: {},
        state: "created",
      });
    });

    it("throws error when event does not exist", async () => {
      const mockEventDoc = {
        exists: false,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockEventDoc),
        }),
      });

      await expect(startJourneySession("nonexistent", "journey-456")).rejects.toThrow(
        "Event not found"
      );
    });
  });

  describe("updateStepIndex", () => {
    it("updates the current step index", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateStepIndex("event-123", "session-456", 3);

      expect(mockUpdate).toHaveBeenCalledWith({
        currentStepIndex: 3,
        updatedAt: expect.any(Number),
      });
    });
  });

  describe("saveStepData", () => {
    it("saves data for a specific key", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await saveStepData("event-123", "session-456", "selected_experience_id", "exp-001");

      expect(mockUpdate).toHaveBeenCalledWith({
        "data.selected_experience_id": "exp-001",
        updatedAt: expect.any(Number),
      });
    });

    it("saves complex object data", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await saveStepData("event-123", "session-456", "form_response", { email: "test@example.com", name: "Test User" });

      expect(mockUpdate).toHaveBeenCalledWith({
        "data.form_response": { email: "test@example.com", name: "Test User" },
        updatedAt: expect.any(Number),
      });
    });
  });
});
