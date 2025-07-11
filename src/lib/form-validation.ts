import { z } from "zod";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import {
  createValidationError,
  EnhancedError,
  showValidationErrorToast,
  ErrorLogger,
} from "./error-handling";
import { showErrorToast, showSuccessToast } from "./toast-utils";

// Common validation schemas
export const commonValidationSchemas = {
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),

  description: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      "Description must not exceed 500 characters"
    ),

  url: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),

  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-\(\)]+$/.test(val),
      "Please enter a valid phone number"
    ),

  requiredString: (fieldName: string) =>
    z.string().min(1, `${fieldName} is required`),

  optionalString: (maxLength: number = 255) =>
    z
      .string()
      .max(maxLength, `Must not exceed ${maxLength} characters`)
      .optional(),

  positiveNumber: (fieldName: string) =>
    z
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .positive(`${fieldName} must be positive`),
};

// Form validation configuration
export interface FormValidationConfig {
  showToastOnError?: boolean;
  showToastOnSuccess?: boolean;
  successMessage?: string;
  logErrors?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

// Enhanced form validation hook
export function useFormValidation<T extends FieldValues>(
  form: UseFormReturn<T>,
  config: FormValidationConfig = {}
) {
  const {
    showToastOnError = true,
    showToastOnSuccess = false,
    successMessage = "Form submitted successfully",
    logErrors = true,
    validateOnChange = false,
    validateOnBlur = true,
  } = config;

  // Handle form errors with toast integration
  const handleFormError = async (
    error: unknown,
    fieldName?: Path<T>
  ): Promise<void> => {
    let enhancedError: EnhancedError;

    if (error instanceof EnhancedError) {
      enhancedError = error;
    } else if (error instanceof Error) {
      enhancedError = createValidationError(
        error.message,
        fieldName,
        fieldName ? form.getValues(fieldName) : undefined
      );
    } else {
      enhancedError = createValidationError(
        "An unexpected validation error occurred",
        fieldName
      );
    }

    // Log error if enabled
    if (logErrors) {
      await ErrorLogger.getInstance().log(enhancedError, {
        showToast: showToastOnError,
        context: {
          formData: form.getValues(),
          fieldName,
        },
      });
    }

    // Show toast notification if enabled
    if (showToastOnError) {
      if (fieldName) {
        await showValidationErrorToast(
          fieldName as string,
          enhancedError.message
        );
      } else {
        showErrorToast(enhancedError.userMessage || enhancedError.message);
      }
    }
  };

  // Handle successful form submission
  const handleFormSuccess = (message?: string): void => {
    if (showToastOnSuccess) {
      showSuccessToast(message || successMessage);
    }
  };

  // Enhanced form submission handler
  const createSubmitHandler = <TResult>(
    onSubmit: (data: T) => Promise<TResult> | TResult
  ) => {
    return form.handleSubmit(
      async (data: T) => {
        try {
          const result = await onSubmit(data);
          handleFormSuccess();
          return result;
        } catch (error) {
          await handleFormError(error);
          throw error;
        }
      },
      async (errors) => {
        // Handle validation errors
        const firstError = Object.keys(errors)[0] as Path<T>;
        if (firstError && errors[firstError]) {
          const errorObj = errors[firstError];
          const errorMessage =
            typeof errorObj?.message === "string"
              ? errorObj.message
              : "Validation failed";
          await handleFormError(new Error(errorMessage), firstError);
        }
      }
    );
  };

  // Field-level validation with error handling
  const validateField = async (
    fieldName: Path<T>,
    value: any
  ): Promise<boolean> => {
    try {
      const result = await form.trigger(fieldName);
      if (!result) {
        const error = form.formState.errors[fieldName];
        if (error) {
          const errorMessage =
            typeof error.message === "string"
              ? error.message
              : "Validation failed";
          await handleFormError(new Error(errorMessage), fieldName);
        }
      }
      return result;
    } catch (error) {
      await handleFormError(error, fieldName);
      return false;
    }
  };

  // Clear field error and toast
  const clearFieldError = (fieldName: Path<T>): void => {
    form.clearErrors(fieldName);
  };

  // Get field error state
  const getFieldError = (fieldName: Path<T>) => {
    const error = form.formState.errors[fieldName];
    return {
      hasError: !!error,
      message: error?.message,
      isDirty: !!(form.formState.dirtyFields as any)[fieldName],
      isTouched: !!(form.formState.touchedFields as any)[fieldName],
    };
  };

  return {
    handleFormError,
    handleFormSuccess,
    createSubmitHandler,
    validateField,
    clearFieldError,
    getFieldError,
    formState: form.formState,
  };
}

// Form field validation schemas for common use cases
export const formSchemas = {
  // Collection form schema
  collection: z.object({
    name: commonValidationSchemas
      .requiredString("Collection name")
      .min(2, "Collection name must be at least 2 characters")
      .max(100, "Collection name must not exceed 100 characters"),
    description: commonValidationSchemas.description,
  }),

  // Document upload schema
  documentUpload: z.object({
    title: commonValidationSchemas
      .requiredString("Document title")
      .max(200, "Title must not exceed 200 characters"),
    description: commonValidationSchemas.description,
    tags: z
      .array(z.string())
      .optional()
      .refine((tags) => !tags || tags.length <= 10, "Maximum 10 tags allowed"),
    collectionId: z.string().min(1, "Please select a collection"),
  }),

  // User profile schema
  userProfile: z.object({
    firstName: commonValidationSchemas.name,
    lastName: commonValidationSchemas.name,
    email: commonValidationSchemas.email,
    phone: commonValidationSchemas.phone,
    bio: z.string().max(1000, "Bio must not exceed 1000 characters").optional(),
  }),

  // Settings schema
  settings: z.object({
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
      sms: z.boolean(),
    }),
    theme: z.enum(["light", "dark", "system"]),
    language: z.string().min(1, "Please select a language"),
  }),

  // Search schema
  search: z.object({
    query: z
      .string()
      .min(1, "Search query is required")
      .max(200, "Search query is too long"),
    filters: z
      .object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        type: z.string().optional(),
        collection: z.string().optional(),
      })
      .optional(),
  }),

  // API configuration schema
  apiConfig: z.object({
    baseUrl: z.string().url("Please enter a valid URL"),
    timeout: commonValidationSchemas.positiveNumber("Timeout"),
    retries: z.number().min(0).max(5, "Maximum 5 retries allowed"),
    apiKey: z.string().min(1, "API key is required").optional(),
  }),
};

// Type-safe form data extraction
export type CollectionFormData = z.infer<typeof formSchemas.collection>;
export type DocumentUploadFormData = z.infer<typeof formSchemas.documentUpload>;
export type UserProfileFormData = z.infer<typeof formSchemas.userProfile>;
export type SettingsFormData = z.infer<typeof formSchemas.settings>;
export type SearchFormData = z.infer<typeof formSchemas.search>;
export type ApiConfigFormData = z.infer<typeof formSchemas.apiConfig>;

// Form validation utilities
export const formValidationUtils = {
  // Create a validation error for a specific field
  createFieldError: (fieldName: string, message: string, value?: any) => {
    return createValidationError(message, fieldName, value);
  },

  // Format validation errors for display
  formatValidationErrors: (errors: Record<string, any>): string[] => {
    return Object.entries(errors).map(([field, error]) => {
      const message = error.message || error;
      return `${field}: ${message}`;
    });
  },

  // Check if form has critical errors
  hasCriticalErrors: (errors: Record<string, any>): boolean => {
    return Object.keys(errors).length > 0;
  },

  // Extract first error message
  getFirstErrorMessage: (errors: Record<string, any>): string | null => {
    const firstError = Object.values(errors)[0];
    return firstError?.message || firstError || null;
  },

  // Create form default values with proper typing
  createDefaultValues: <T extends Record<string, any>>(
    schema: z.ZodSchema<T>
  ): Partial<T> => {
    try {
      return schema.parse({});
    } catch {
      return {};
    }
  },
};

// Async validation helpers
export const asyncValidationHelpers = {
  // Check if email is unique (example)
  validateUniqueEmail: async (email: string): Promise<boolean> => {
    // This would typically call an API endpoint
    // For now, simulate an async check
    await new Promise((resolve) => setTimeout(resolve, 300));
    return !email.includes("test@example.com"); // Simulate already taken
  },

  // Check if collection name is unique
  validateUniqueCollectionName: async (name: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return !name.toLowerCase().includes("duplicate");
  },

  // Validate file upload
  validateFileUpload: async (
    file: File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
    } = {}
  ): Promise<{ isValid: boolean; error?: string }> => {
    const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options;

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size must be less than ${maxSize / 1024 / 1024}MB`,
      };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type must be one of: ${allowedTypes.join(", ")}`,
      };
    }

    return { isValid: true };
  },
};
