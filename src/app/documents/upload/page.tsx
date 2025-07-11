"use client";

import { DocumentUpload } from "@/components/documents/document-upload";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DocumentUploadPage() {
  const router = useRouter();

  const handleUploadSuccess = () => {
    // Redirect to documents page after successful upload
    router.push("/documents");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Documents</h1>
          <p className="text-muted-foreground">
            Upload and process documents for your knowledge base
          </p>
        </div>
      </div>

      <DocumentUpload onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}