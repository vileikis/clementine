import { createCompanyAction, listCompaniesAction, getCompanyAction } from "./companies";
import * as companiesRepo from "../repositories/companies";
import * as auth from "@/lib/auth";

// Mock the repositories and auth module
jest.mock("../repositories/companies");
jest.mock("@/lib/auth");
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Companies Server Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCompanyAction", () => {
    it("creates company successfully with valid input", async () => {
      // Mock auth success
      (auth.verifyAdminSecret as jest.Mock).mockResolvedValue({
        authorized: true,
      });

      // Mock repository success
      (companiesRepo.createCompany as jest.Mock).mockResolvedValue("company-123");

      const result = await createCompanyAction({
        name: "Acme Corp",
      });

      expect(result).toEqual({
        success: true,
        companyId: "company-123",
      });
      expect(companiesRepo.createCompany).toHaveBeenCalledWith({
        name: "Acme Corp",
      });
    });

    it("rejects request when not authenticated", async () => {
      // Mock auth failure
      (auth.verifyAdminSecret as jest.Mock).mockResolvedValue({
        authorized: false,
        error: "Unauthorized",
      });

      const result = await createCompanyAction({
        name: "Acme Corp",
      });

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
      expect(companiesRepo.createCompany).not.toHaveBeenCalled();
    });

    it("validates company name is required", async () => {
      // Mock auth success
      (auth.verifyAdminSecret as jest.Mock).mockResolvedValue({
        authorized: true,
      });

      const result = await createCompanyAction({
        name: "",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("required");
      expect(companiesRepo.createCompany).not.toHaveBeenCalled();
    });

    it("returns error when duplicate company name exists", async () => {
      // Mock auth success
      (auth.verifyAdminSecret as jest.Mock).mockResolvedValue({
        authorized: true,
      });

      // Mock repository throwing duplicate error
      (companiesRepo.createCompany as jest.Mock).mockRejectedValue(
        new Error('Company name "Acme Corp" already exists')
      );

      const result = await createCompanyAction({
        name: "Acme Corp",
      });

      expect(result).toEqual({
        success: false,
        error: 'Company name "Acme Corp" already exists',
      });
    });

    it("validates optional fields", async () => {
      // Mock auth success
      (auth.verifyAdminSecret as jest.Mock).mockResolvedValue({
        authorized: true,
      });

      // Mock repository success
      (companiesRepo.createCompany as jest.Mock).mockResolvedValue("company-456");

      const result = await createCompanyAction({
        name: "Nike Inc",
        brandColor: "invalid-color", // Should fail validation
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("hex color");
      expect(companiesRepo.createCompany).not.toHaveBeenCalled();
    });
  });

  describe("listCompaniesAction", () => {
    it("returns list of companies successfully", async () => {
      const mockCompanies = [
        {
          id: "company-1",
          name: "Acme Corp",
          status: "active" as const,
          deletedAt: null,
          createdAt: 1000000000,
          updatedAt: 1000000000,
        },
        {
          id: "company-2",
          name: "Beta Inc",
          status: "active" as const,
          deletedAt: null,
          createdAt: 2000000000,
          updatedAt: 2000000000,
        },
      ];

      (companiesRepo.listCompanies as jest.Mock).mockResolvedValue(mockCompanies);

      const result = await listCompaniesAction();

      expect(result).toEqual({
        success: true,
        companies: mockCompanies,
      });
    });

    it("returns empty array when no companies exist", async () => {
      (companiesRepo.listCompanies as jest.Mock).mockResolvedValue([]);

      const result = await listCompaniesAction();

      expect(result).toEqual({
        success: true,
        companies: [],
      });
    });

    it("handles repository errors gracefully", async () => {
      (companiesRepo.listCompanies as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const result = await listCompaniesAction();

      expect(result).toEqual({
        success: false,
        error: "Database error",
      });
    });
  });

  describe("getCompanyAction", () => {
    it("returns company when it exists", async () => {
      const mockCompany = {
        id: "company-123",
        name: "Acme Corp",
        status: "active" as const,
        deletedAt: null,
        createdAt: 1000000000,
        updatedAt: 1000000000,
      };

      (companiesRepo.getCompany as jest.Mock).mockResolvedValue(mockCompany);

      const result = await getCompanyAction("company-123");

      expect(result).toEqual({
        success: true,
        company: mockCompany,
      });
      expect(companiesRepo.getCompany).toHaveBeenCalledWith("company-123");
    });

    it("returns error when company not found", async () => {
      (companiesRepo.getCompany as jest.Mock).mockResolvedValue(null);

      const result = await getCompanyAction("nonexistent");

      expect(result).toEqual({
        success: false,
        error: "Company not found",
      });
    });

    it("handles repository errors gracefully", async () => {
      (companiesRepo.getCompany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const result = await getCompanyAction("company-123");

      expect(result).toEqual({
        success: false,
        error: "Database error",
      });
    });
  });
});
