"use client";

import { useState } from "react";
import { useCollections } from "@/hooks/api/useCollections";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { NewCollectionSheet } from "./new-collection-sheet";

export function CollectionManagement() {
  const { data: collectionsData, isLoading, error, refetch } = useCollections();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (error) {
    return <div>Error loading collections.</div>;
  }

  const handleSuccess = () => {
    setIsSheetOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Collections</h2>
          <p className="text-muted-foreground">
            {collectionsData?.pagination?.total ?? 0} collections
          </p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {collectionsData?.data && collectionsData.data.length > 0 ? (
            collectionsData.data.map((collection) => (
              <Card key={collection.id}>
                <CardHeader>
                  <CardTitle>{collection.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {collection.documentCount} documents
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No collections found</p>
            </div>
          )}
        </div>
      )}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create New Collection</SheetTitle>
            <SheetDescription>
              A collection is a way to group related documents.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-8">
            <NewCollectionSheet onCollectionCreated={handleSuccess} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
