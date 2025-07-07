import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useUploadDocument } from "@/hooks/api/useDocuments";

interface DocumentUploadProps {
  onUploadSuccess?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocumentMutation = useUploadDocument();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        await uploadDocumentMutation.mutateAsync({ file });
      }

      window.alert(`${files.length} document(s) have been uploaded.`);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploadSuccess?.();
    } catch (error) {
      console.error(error);
      window.alert("An error occurred while uploading the documents.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          className="flex-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />
        <Button
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Selected files:</h3>
          <ul className="space-y-1 max-h-48 overflow-y-auto rounded-md border p-2">
            {files.map((file, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                {file.name} ({Math.round(file.size / 1024)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export { DocumentUpload };
