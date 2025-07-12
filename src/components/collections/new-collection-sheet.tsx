"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  EnhancedTextInput,
  EnhancedTextarea,
  FormSubmitButton,
  FormValidationSummary,
} from "@/components/ui/enhanced-form-fields";
import {
  formSchemas,
  CollectionFormData,
  useFormValidation,
} from "@/lib/form-validation";
import { useCreateCollection } from "@/hooks/api/useCollections";
import { Plus, FolderPlus } from "lucide-react";

interface NewCollectionSheetProps {
  onCollectionCreated?: (collection: any) => void;
  trigger?: React.ReactNode;
}

export function NewCollectionSheet({
  onCollectionCreated,
  trigger,
}: NewCollectionSheetProps) {
  const [open, setOpen] = useState(false);
  const createCollectionMutation = useCreateCollection();

  // Form setup with validation
  const form = useForm<CollectionFormData>({
    resolver: zodResolver(formSchemas.collection),
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onChange", // Validate on change for better UX
  });

  // Enhanced form validation with error handling
  const { createSubmitHandler, formState } = useFormValidation(form, {
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Collection created successfully!",
    logErrors: true,
    validateOnChange: true,
    validateOnBlur: true,
  });

  // Submit handler with comprehensive error handling
  const onSubmit = createSubmitHandler(async (data: CollectionFormData) => {
    try {
      // Create collection using the proper hook
      const newCollection = await createCollectionMutation.mutateAsync(data);

      // Notify parent component
      onCollectionCreated?.(newCollection);

      // Reset form and close sheet
      form.reset();
      setOpen(false);

      return newCollection;
    } catch (error) {
      // Error is automatically handled by the form validation system
      throw error;
    }
  });

  // Reset form when sheet opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      form.reset();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create New Collection
          </SheetTitle>
          <SheetDescription>
            Create a new collection to organize your documents and content.
            Collections help you group related items together.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6 mt-6">
            {/* Form validation summary */}
            <FormValidationSummary
              errors={form.formState.errors}
              title="Please fix the following issues:"
            />

            {/* Collection name field */}
            <EnhancedTextInput
              control={form.control}
              name="name"
              label="Collection Name"
              placeholder="Enter collection name..."
              required
              maxLength={100}
              showCharacterCount
              startIcon={<FolderPlus className="h-4 w-4" />}
              description="A unique name for your collection (2-100 characters)"
            />

            {/* Collection description field */}
            <EnhancedTextarea
              control={form.control}
              name="description"
              label="Description"
              placeholder="Describe what this collection contains..."
              rows={4}
              maxLength={500}
              showCharacterCount
              description="Optional description to help others understand the purpose of this collection"
            />

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createCollectionMutation.isPending}
              >
                Cancel
              </Button>
              <FormSubmitButton
                isLoading={createCollectionMutation.isPending}
                disabled={!form.formState.isValid}
                loadingText="Creating..."
              >
                Create Collection
              </FormSubmitButton>
            </div>

            {/* Form debugging info (development only) */}
            {process.env.NODE_ENV === "development" && (
              <details className="text-xs text-muted-foreground border rounded p-3">
                <summary className="cursor-pointer font-medium">
                  Form Debug Info
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      values: form.getValues(),
                      errors: form.formState.errors,
                      isValid: form.formState.isValid,
                      isDirty: form.formState.isDirty,
                      isSubmitting: form.formState.isSubmitting,
                      touchedFields: form.formState.touchedFields,
                      dirtyFields: form.formState.dirtyFields,
                      mutation: {
                        isPending: createCollectionMutation.isPending,
                        isError: createCollectionMutation.isError,
                        error: createCollectionMutation.error?.message,
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            )}
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
