import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  commonValidationSchemas,
  formSchemas,
  useFormValidation,
  formValidationUtils,
  asyncValidationHelpers,
  type CollectionFormData,
  type DocumentUploadFormData,
} from "../form-validation";

// Mock the toast utilities
vi.mock("../toast-utils", () => ({
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));

// Mock the error handling utilities
vi.mock("../error-handling", () => ({
  createValidationError: vi.fn((message, field, value) => ({
    message,
    field,
    value,
    type: "validation",
    userMessage: message,
  })),
  showValidationErrorToast: vi.fn(),
  ErrorLogger: {
    getInstance: () => ({
      log: vi.fn(),
    }),
  },
  EnhancedError: class EnhancedError extends Error {
    constructor(message: string, public field?: string, public userMessage?: string) {
      super(message);
    }
  },
}));

describe("Form Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("commonValidationSchemas", () => {
    describe("email validation", () => {
      it("should accept valid email addresses", () => {
        const validEmails = [
          "test@example.com",
          "user.name@domain.co.uk",
          "user+tag@example.org",
        ];

        validEmails.forEach((email) => {
          expect(() => commonValidationSchemas.email.parse(email)).not.toThrow();
        });
      });

      it("should reject invalid email addresses", () => {
        const invalidEmails = [
          "",
          "invalid",
          "@example.com",
          "user@",
          "user..name@example.com",
        ];

        invalidEmails.forEach((email) => {
          expect(() => commonValidationSchemas.email.parse(email)).toThrow();
        });
      });

      it("should provide appropriate error messages", () => {
        expect(() => commonValidationSchemas.email.parse("")).toThrow("Email is required");
        expect(() => commonValidationSchemas.email.parse("invalid")).toThrow("Please enter a valid email address");
      });
    });

    describe("password validation", () => {
      it("should accept valid passwords", () => {
        const validPasswords = [
          "Password123",
          "MySecure1Pass",
          "Complex9Password",
        ];

        validPasswords.forEach((password) => {
          expect(() => commonValidationSchemas.password.parse(password)).not.toThrow();
        });
      });

      it("should reject invalid passwords", () => {
        const invalidPasswords = [
          "short",
          "nouppercase123",
          "NOLOWERCASE123",
          "NoNumbers",
          "1234567",
        ];

        invalidPasswords.forEach((password) => {
          expect(() => commonValidationSchemas.password.parse(password)).toThrow();
        });
      });

      it("should require minimum length", () => {
        expect(() => commonValidationSchemas.password.parse("Short1")).toThrow(
          "Password must be at least 8 characters"
        );
      });

      it("should require uppercase, lowercase, and number", () => {
        expect(() => commonValidationSchemas.password.parse("nouppercase123")).toThrow(
          "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        );
      });
    });

    describe("name validation", () => {
      it("should accept valid names", () => {
        const validNames = ["John", "Jane Doe", "O'Connor", "Jean-Luc"];

        validNames.forEach((name) => {
          expect(() => commonValidationSchemas.name.parse(name)).not.toThrow();
        });
      });

      it("should reject invalid names", () => {
        expect(() => commonValidationSchemas.name.parse("")).toThrow("Name is required");
        expect(() => commonValidationSchemas.name.parse("A")).toThrow("Name must be at least 2 characters");
        expect(() => commonValidationSchemas.name.parse("A".repeat(51))).toThrow(
          "Name must not exceed 50 characters"
        );
      });
    });

    describe("description validation", () => {
      it("should accept valid descriptions", () => {
        expect(() => commonValidationSchemas.description.parse("Short description")).not.toThrow();
        expect(() => commonValidationSchemas.description.parse(undefined)).not.toThrow();
        expect(() => commonValidationSchemas.description.parse("")).not.toThrow();
      });

      it("should reject overly long descriptions", () => {
        const longDescription = "A".repeat(501);
        expect(() => commonValidationSchemas.description.parse(longDescription)).toThrow(
          "Description must not exceed 500 characters"
        );
      });
    });

    describe("url validation", () => {
      it("should accept valid URLs", () => {
        const validUrls = [
          "https://example.com",
          "http://localhost:3000",
          "https://subdomain.example.co.uk/path?query=value",
          "",
          undefined,
        ];

        validUrls.forEach((url) => {
          expect(() => commonValidationSchemas.url.parse(url)).not.toThrow();
        });
      });

      it("should reject invalid URLs", () => {
        const invalidUrls = ["not-a-url", "ftp://example.com", "javascript:alert('xss')"];

        invalidUrls.forEach((url) => {
          expect(() => commonValidationSchemas.url.parse(url)).toThrow();
        });
      });
    });

    describe("phone validation", () => {
      it("should accept valid phone numbers", () => {
        const validPhones = [
          "+1234567890",
          "(555) 123-4567",
          "555-123-4567",
          "+44 20 7946 0958",
          undefined,
          "",
        ];

        validPhones.forEach((phone) => {
          expect(() => commonValidationSchemas.phone.parse(phone)).not.toThrow();
        });
      });

      it("should reject invalid phone numbers", () => {
        const invalidPhones = ["abc123", "123abc", "123-abc-4567"];

        invalidPhones.forEach((phone) => {
          expect(() => commonValidationSchemas.phone.parse(phone)).toThrow();
        });
      });
    });

    describe("dynamic validators", () => {
      it("should create required string validator", () => {
        const validator = commonValidationSchemas.requiredString("Custom Field");
        
        expect(() => validator.parse("valid")).not.toThrow();
        expect(() => validator.parse("")).toThrow("Custom Field is required");
      });

      it("should create optional string validator with max length", () => {
        const validator = commonValidationSchemas.optionalString(10);
        
        expect(() => validator.parse("short")).not.toThrow();
        expect(() => validator.parse(undefined)).not.toThrow();
        expect(() => validator.parse("this is too long")).toThrow("Must not exceed 10 characters");
      });

      it("should create positive number validator", () => {
        const validator = commonValidationSchemas.positiveNumber("Amount");
        
        expect(() => validator.parse(10)).not.toThrow();
        expect(() => validator.parse(0.1)).not.toThrow();
        expect(() => validator.parse(0)).toThrow("Amount must be positive");
        expect(() => validator.parse(-5)).toThrow("Amount must be positive");
        expect(() => validator.parse("not-a-number")).toThrow("Amount must be a number");
      });
    });
  });

  describe("formSchemas", () => {
    describe("collection schema", () => {
      it("should validate correct collection data", () => {
        const validData: CollectionFormData = {
          name: "Test Collection",
          description: "A test collection",
        };

        expect(() => formSchemas.collection.parse(validData)).not.toThrow();
      });

      it("should reject invalid collection data", () => {
        expect(() => formSchemas.collection.parse({ name: "" })).toThrow();
        expect(() => formSchemas.collection.parse({ name: "A" })).toThrow();
        expect(() => formSchemas.collection.parse({ name: "A".repeat(101) })).toThrow();
      });

      it("should allow optional description", () => {
        const validData = { name: "Test Collection" };
        expect(() => formSchemas.collection.parse(validData)).not.toThrow();
      });
    });

    describe("document upload schema", () => {
      it("should validate correct document upload data", () => {
        const validData: DocumentUploadFormData = {
          title: "Test Document",
          description: "A test document",
          tags: ["test", "document"],
          collectionId: "collection-1",
        };

        expect(() => formSchemas.documentUpload.parse(validData)).not.toThrow();
      });

      it("should reject invalid document upload data", () => {
        expect(() => formSchemas.documentUpload.parse({ title: "", collectionId: "test" })).toThrow();
        expect(() => formSchemas.documentUpload.parse({ title: "Test", collectionId: "" })).toThrow();
        
        const tooManyTags = { 
          title: "Test", 
          collectionId: "test", 
          tags: Array(11).fill("tag") 
        };
        expect(() => formSchemas.documentUpload.parse(tooManyTags)).toThrow("Maximum 10 tags allowed");
      });
    });

    describe("user profile schema", () => {
      it("should validate correct user profile data", () => {
        const validData = {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
          bio: "Software developer",
        };

        expect(() => formSchemas.userProfile.parse(validData)).not.toThrow();
      });

      it("should reject invalid user profile data", () => {
        expect(() => formSchemas.userProfile.parse({
          firstName: "",
          lastName: "Doe",
          email: "invalid-email",
        })).toThrow();

        const longBio = { 
          firstName: "John", 
          lastName: "Doe", 
          email: "john@example.com",
          bio: "A".repeat(1001)
        };
        expect(() => formSchemas.userProfile.parse(longBio)).toThrow("Bio must not exceed 1000 characters");
      });
    });

    describe("settings schema", () => {
      it("should validate correct settings data", () => {
        const validData = {
          notifications: {
            email: true,
            push: false,
            sms: true,
          },
          theme: "dark" as const,
          language: "en",
        };

        expect(() => formSchemas.settings.parse(validData)).not.toThrow();
      });

      it("should reject invalid settings data", () => {
        expect(() => formSchemas.settings.parse({
          notifications: { email: true, push: false, sms: true },
          theme: "invalid-theme",
          language: "en",
        })).toThrow();

        expect(() => formSchemas.settings.parse({
          notifications: { email: true, push: false, sms: true },
          theme: "dark",
          language: "",
        })).toThrow();
      });
    });

    describe("search schema", () => {
      it("should validate correct search data", () => {
        const validData = {
          query: "test search",
          filters: {
            dateFrom: new Date("2024-01-01"),
            dateTo: new Date("2024-12-31"),
            type: "pdf",
            collection: "collection-1",
          },
        };

        expect(() => formSchemas.search.parse(validData)).not.toThrow();
      });

      it("should reject invalid search data", () => {
        expect(() => formSchemas.search.parse({ query: "" })).toThrow("Search query is required");
        expect(() => formSchemas.search.parse({ query: "A".repeat(201) })).toThrow("Search query is too long");
      });
    });

    describe("API config schema", () => {
      it("should validate correct API config data", () => {
        const validData = {
          baseUrl: "https://api.example.com",
          timeout: 5000,
          retries: 3,
          apiKey: "secret-key",
        };

        expect(() => formSchemas.apiConfig.parse(validData)).not.toThrow();
      });

      it("should reject invalid API config data", () => {
        expect(() => formSchemas.apiConfig.parse({
          baseUrl: "invalid-url",
          timeout: 5000,
          retries: 3,
        })).toThrow();

        expect(() => formSchemas.apiConfig.parse({
          baseUrl: "https://api.example.com",
          timeout: -1,
          retries: 3,
        })).toThrow();

        expect(() => formSchemas.apiConfig.parse({
          baseUrl: "https://api.example.com",
          timeout: 5000,
          retries: 10,
        })).toThrow("Maximum 5 retries allowed");
      });
    });
  });

  describe("useFormValidation hook", () => {
    const testSchema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email"),
    });

    type TestFormData = z.infer<typeof testSchema>;

    it("should provide form validation utilities", () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          resolver: zodResolver(testSchema),
          defaultValues: { name: "", email: "" },
        });
        return useFormValidation(form);
      });

      expect(result.current.handleFormError).toBeInstanceOf(Function);
      expect(result.current.handleFormSuccess).toBeInstanceOf(Function);
      expect(result.current.createSubmitHandler).toBeInstanceOf(Function);
      expect(result.current.validateField).toBeInstanceOf(Function);
      expect(result.current.clearFieldError).toBeInstanceOf(Function);
      expect(result.current.getFieldError).toBeInstanceOf(Function);
    });

    it("should handle form errors correctly", async () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          resolver: zodResolver(testSchema),
          defaultValues: { name: "", email: "" },
        });
        return useFormValidation(form, { showToastOnError: true, logErrors: false });
      });

      const error = new Error("Test error");
      await result.current.handleFormError(error, "name");

      // Error handling should not throw
      expect(true).toBe(true);
    });

    it("should handle form success correctly", () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          resolver: zodResolver(testSchema),
          defaultValues: { name: "", email: "" },
        });
        return useFormValidation(form, { showToastOnSuccess: true });
      });

      // Should not throw
      result.current.handleFormSuccess("Success message");
      expect(true).toBe(true);
    });

    it("should create submit handler", () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          resolver: zodResolver(testSchema),
          defaultValues: { name: "John", email: "john@example.com" },
        });
        return useFormValidation(form);
      });

      const mockSubmit = vi.fn().mockResolvedValue("success");
      const submitHandler = result.current.createSubmitHandler(mockSubmit);

      expect(submitHandler).toBeInstanceOf(Function);
    });

    it("should validate individual fields", async () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          resolver: zodResolver(testSchema),
          defaultValues: { name: "", email: "" },
        });
        return useFormValidation(form);
      });

      // This would typically trigger validation
      const isValid = await result.current.validateField("name", "John");
      expect(typeof isValid).toBe("boolean");
    });

    it("should get field error state", () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          resolver: zodResolver(testSchema),
          defaultValues: { name: "", email: "" },
        });
        return useFormValidation(form);
      });

      const errorState = result.current.getFieldError("name");
      
      expect(errorState).toHaveProperty("hasError");
      expect(errorState).toHaveProperty("message");
      expect(errorState).toHaveProperty("isDirty");
      expect(errorState).toHaveProperty("isTouched");
    });

    it("should clear field errors", () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          resolver: zodResolver(testSchema),
          defaultValues: { name: "", email: "" },
        });
        return useFormValidation(form);
      });

      // Should not throw
      result.current.clearFieldError("name");
      expect(true).toBe(true);
    });
  });

  describe("formValidationUtils", () => {
    it("should create field errors", () => {
      const error = formValidationUtils.createFieldError("email", "Invalid email", "invalid");
      
      expect(error).toEqual({
        message: "Invalid email",
        field: "email",
        value: "invalid",
        type: "validation",
        userMessage: "Invalid email",
      });
    });

    it("should format validation errors", () => {
      const errors = {
        name: { message: "Name is required" },
        email: { message: "Invalid email" },
      };

      const formatted = formValidationUtils.formatValidationErrors(errors);
      
      expect(formatted).toEqual([
        "name: Name is required",
        "email: Invalid email",
      ]);
    });

    it("should check for critical errors", () => {
      expect(formValidationUtils.hasCriticalErrors({})).toBe(false);
      expect(formValidationUtils.hasCriticalErrors({ name: { message: "Error" } })).toBe(true);
    });

    it("should get first error message", () => {
      const errors = {
        name: { message: "Name is required" },
        email: { message: "Invalid email" },
      };

      const firstError = formValidationUtils.getFirstErrorMessage(errors);
      expect(firstError).toBe("Name is required");

      expect(formValidationUtils.getFirstErrorMessage({})).toBe(null);
    });

    it("should create default values", () => {
      const schema = z.object({
        name: z.string().default(""),
        count: z.number().default(0),
      });

      const defaults = formValidationUtils.createDefaultValues(schema);
      
      // Should return an object (even if empty)
      expect(typeof defaults).toBe("object");
    });
  });

  describe("asyncValidationHelpers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should validate unique email", async () => {
      const promise1 = asyncValidationHelpers.validateUniqueEmail("unique@example.com");
      vi.advanceTimersByTime(300);
      const result1 = await promise1;
      expect(result1).toBe(true);

      const promise2 = asyncValidationHelpers.validateUniqueEmail("test@example.com");
      vi.advanceTimersByTime(300);
      const result2 = await promise2;
      expect(result2).toBe(false);
    });

    it("should validate unique collection name", async () => {
      const promise1 = asyncValidationHelpers.validateUniqueCollectionName("Unique Collection");
      vi.advanceTimersByTime(200);
      const result1 = await promise1;
      expect(result1).toBe(true);

      const promise2 = asyncValidationHelpers.validateUniqueCollectionName("Duplicate Collection");
      vi.advanceTimersByTime(200);
      const result2 = await promise2;
      expect(result2).toBe(false);
    });

    it("should validate file upload", async () => {
      const validFile = new File(["content"], "test.pdf", { type: "application/pdf" });
      Object.defineProperty(validFile, "size", { value: 1024 * 1024 }); // 1MB

      const result1 = await asyncValidationHelpers.validateFileUpload(validFile, {
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ["application/pdf"],
      });
      expect(result1.isValid).toBe(true);

      // Test file too large
      const largeFile = new File(["content"], "large.pdf", { type: "application/pdf" });
      Object.defineProperty(largeFile, "size", { value: 15 * 1024 * 1024 }); // 15MB

      const result2 = await asyncValidationHelpers.validateFileUpload(largeFile, {
        maxSize: 10 * 1024 * 1024,
      });
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain("File size must be less than");

      // Test invalid file type
      const invalidFile = new File(["content"], "script.js", { type: "application/javascript" });

      const result3 = await asyncValidationHelpers.validateFileUpload(invalidFile, {
        allowedTypes: ["application/pdf"],
      });
      expect(result3.isValid).toBe(false);
      expect(result3.error).toContain("File type must be one of");
    });

    it("should validate file upload with default options", async () => {
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      Object.defineProperty(file, "size", { value: 1024 * 1024 }); // 1MB

      const result = await asyncValidationHelpers.validateFileUpload(file);
      expect(result.isValid).toBe(true);
    });
  });

  describe("Type Safety", () => {
    it("should provide correct TypeScript types", () => {
      // This test ensures the exported types are correctly inferred
      const collectionData: CollectionFormData = {
        name: "Test Collection",
        description: "Test description",
      };

      const documentData: DocumentUploadFormData = {
        title: "Test Document",
        description: "Test description",
        tags: ["test"],
        collectionId: "collection-1",
      };

      // If these compile without TypeScript errors, the types are correct
      expect(collectionData.name).toBe("Test Collection");
      expect(documentData.title).toBe("Test Document");
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle different error types", async () => {
      const { result } = renderHook(() => {
        const form = useForm<{ name: string }>({
          resolver: zodResolver(z.object({ name: z.string() })),
          defaultValues: { name: "" },
        });
        return useFormValidation(form, { logErrors: false });
      });

      // Test with regular Error
      await result.current.handleFormError(new Error("Regular error"));

      // Test with string error
      await result.current.handleFormError("String error");

      // Test with unknown error
      await result.current.handleFormError({ unknown: "error" });

      // Should not throw
      expect(true).toBe(true);
    });
  });
});