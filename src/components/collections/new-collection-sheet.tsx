"use client";

import { useState } from "react";
import { useCreateCollection } from "@/hooks/api/useCollections";
import { Button } from "@/components/ui/button";

interface NewCollectionSheetProps {
  onSuccess: () => void;
}

export function NewCollectionSheet({ onSuccess }: NewCollectionSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createCollectionMutation = useCreateCollection();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await createCollectionMutation.mutateAsync({ name, description });
      onSuccess();
    } catch (error) {
      console.error("Failed to create collection:", error);
      // TODO: Add user-facing error feedback
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder="e.g., Financial Reports"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          placeholder="A brief description of the collection's purpose"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <Button type="submit" disabled={createCollectionMutation.isPending}>
        {createCollectionMutation.isPending
          ? "Creating..."
          : "Create Collection"}
      </Button>
    </form>
  );
}
