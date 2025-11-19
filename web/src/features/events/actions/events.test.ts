import {
  createEventAction,
  listEventsAction,
} from "./events";
import * as eventsRepository from "../repositories/events";
import * as companiesRepository from "@/features/companies/repositories/companies";
import * as auth from "@/lib/auth";
import type { Event } from "../types/event.types";
import type { Company } from "@/features/companies";

// Mock dependencies
jest.mock("../repositories/events");
jest.mock("@/features/companies/repositories/companies");
jest.mock("@/lib/auth");
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Events Server Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listEventsAction", () => {
    it("returns all events when no filters provided", async () => {
      const mockEvents: Event[] = [
        {
          id: "event-1",
          title: "Event 1",
          brandColor: "#111111",
          showTitleOverlay: true,
          status: "live",
          joinPath: "/join/event-1",
          qrPngPath: "events/event-1/qr/join.png",
          companyId: "company-a",
          createdAt: 2000000000,
          updatedAt: 2000000000,
          shareAllowDownload: true,
          shareAllowSystemShare: true,
          shareAllowEmail: true,
          shareSocials: [],
          surveyEnabled: false,
          surveyRequired: false,
          surveyStepsCount: 0,
          surveyStepsOrder: [],
          surveyVersion: 1,
          experiencesCount: 0,
          sessionsCount: 0,
          readyCount: 0,
          sharesCount: 0,
        },
        {
          id: "event-2",
          title: "Event 2",
          brandColor: "#222222",
          showTitleOverlay: false,
          status: "draft",
          joinPath: "/join/event-2",
          qrPngPath: "events/event-2/qr/join.png",
          companyId: null,
          createdAt: 1000000000,
          updatedAt: 1000000000,
          shareAllowDownload: true,
          shareAllowSystemShare: true,
          shareAllowEmail: true,
          shareSocials: [],
          surveyEnabled: false,
          surveyRequired: false,
          surveyStepsCount: 0,
          surveyStepsOrder: [],
          surveyVersion: 1,
          experiencesCount: 0,
          sessionsCount: 0,
          readyCount: 0,
          sharesCount: 0,
        },
      ];

      jest
        .spyOn(eventsRepository, "listEvents")
        .mockResolvedValue(mockEvents);

      const result = await listEventsAction();

      expect(result.success).toBe(true);
      expect(result.events).toEqual(mockEvents);
      expect(eventsRepository.listEvents).toHaveBeenCalledWith(undefined);
    });

    it("filters events by companyId when provided", async () => {
      const mockEvents: Event[] = [
        {
          id: "event-1",
          title: "Event 1",
          brandColor: "#111111",
          showTitleOverlay: true,
          status: "live",
          joinPath: "/join/event-1",
          qrPngPath: "events/event-1/qr/join.png",
          companyId: "company-a",
          createdAt: 2000000000,
          updatedAt: 2000000000,
          shareAllowDownload: true,
          shareAllowSystemShare: true,
          shareAllowEmail: true,
          shareSocials: [],
          surveyEnabled: false,
          surveyRequired: false,
          surveyStepsCount: 0,
          surveyStepsOrder: [],
          surveyVersion: 1,
          experiencesCount: 0,
          sessionsCount: 0,
          readyCount: 0,
          sharesCount: 0,
        },
      ];

      jest
        .spyOn(eventsRepository, "listEvents")
        .mockResolvedValue(mockEvents);

      const result = await listEventsAction({ companyId: "company-a" });

      expect(result.success).toBe(true);
      expect(result.events).toEqual(mockEvents);
      expect(eventsRepository.listEvents).toHaveBeenCalledWith({
        companyId: "company-a",
      });
      expect(result.events?.[0].companyId).toBe("company-a");
    });

    it("filters events with no company when companyId is null", async () => {
      const mockEvents: Event[] = [
        {
          id: "event-2",
          title: "Event 2",
          brandColor: "#222222",
          showTitleOverlay: false,
          status: "draft",
          joinPath: "/join/event-2",
          qrPngPath: "events/event-2/qr/join.png",
          companyId: null,
          createdAt: 1000000000,
          updatedAt: 1000000000,
          shareAllowDownload: true,
          shareAllowSystemShare: true,
          shareAllowEmail: true,
          shareSocials: [],
          surveyEnabled: false,
          surveyRequired: false,
          surveyStepsCount: 0,
          surveyStepsOrder: [],
          surveyVersion: 1,
          experiencesCount: 0,
          sessionsCount: 0,
          readyCount: 0,
          sharesCount: 0,
        },
      ];

      jest
        .spyOn(eventsRepository, "listEvents")
        .mockResolvedValue(mockEvents);

      const result = await listEventsAction({ companyId: null });

      expect(result.success).toBe(true);
      expect(result.events).toEqual(mockEvents);
      expect(eventsRepository.listEvents).toHaveBeenCalledWith({
        companyId: null,
      });
      expect(result.events?.[0].companyId).toBeNull();
    });

    it("handles errors gracefully", async () => {
      jest
        .spyOn(eventsRepository, "listEvents")
        .mockRejectedValue(new Error("Database error"));

      const result = await listEventsAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });

  describe("createEventAction", () => {
    beforeEach(() => {
      jest.spyOn(auth, "verifyAdminSecret").mockResolvedValue({
        authorized: true,
      });
    });

    it("validates company exists and is active", async () => {
      const mockCompany: Company = {
        id: "company-a",
        name: "Company A",
        status: "active",
        deletedAt: null,
        createdAt: 1000000000,
        updatedAt: 1000000000,
      };

      jest
        .spyOn(companiesRepository, "getCompany")
        .mockResolvedValue(mockCompany);
      jest.spyOn(eventsRepository, "createEvent").mockResolvedValue("event-1");

      const result = await createEventAction({
        title: "Test Event",
        brandColor: "#FF0000",
        showTitleOverlay: true,
        companyId: "company-a",
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("event-1");
      expect(companiesRepository.getCompany).toHaveBeenCalledWith("company-a");
    });

    it("rejects when company not found", async () => {
      jest.spyOn(companiesRepository, "getCompany").mockResolvedValue(null);

      const result = await createEventAction({
        title: "Test Event",
        brandColor: "#FF0000",
        showTitleOverlay: true,
        companyId: "nonexistent",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Company not found");
      expect(eventsRepository.createEvent).not.toHaveBeenCalled();
    });

    it("rejects when company is not active", async () => {
      const mockCompany: Company = {
        id: "company-a",
        name: "Company A",
        status: "deleted",
        deletedAt: Date.now(),
        createdAt: 1000000000,
        updatedAt: 1000000000,
      };

      jest
        .spyOn(companiesRepository, "getCompany")
        .mockResolvedValue(mockCompany);

      const result = await createEventAction({
        title: "Test Event",
        brandColor: "#FF0000",
        showTitleOverlay: true,
        companyId: "company-a",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Company is not active");
      expect(eventsRepository.createEvent).not.toHaveBeenCalled();
    });
  });
});
