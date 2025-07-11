"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUploadDocument } from "@/hooks/api/useDocuments";
import { useCollections } from "@/hooks/api/useCollections";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  collectionId?: string;
}

interface DocumentUploadProps {
  onUploadSuccess?: () => void;
  defaultCollectionId?: string;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/markdown': ['.md'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 20;

export function DocumentUpload({ onUploadSuccess, defaultCollectionId }: DocumentUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(defaultCollectionId || '');
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();
  const uploadDocumentMutation = useUploadDocument();
  const { data: collectionsResponse } = useCollections();
  const collections = collectionsResponse?.data || [];

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 10MB limit`,
            variant: "destructive",
          });
        } else if (error.code === 'file-invalid-type') {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported file type`,
            variant: "destructive",
          });
        }
      });
    });

    // Add accepted files to upload queue
    const newUploadFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      collectionId: selectedCollectionId || undefined,
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, [selectedCollectionId, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileCollection = (fileId: string, collectionId: string) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, collectionId } : f
    ));
  };

  const uploadSingleFile = async (uploadFile: UploadFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Update status to uploading
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
      ));

      // Simulate progress updates (in real implementation, this would come from the API)
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => prev.map(f => {
          if (f.id === uploadFile.id && f.status === 'uploading') {
            const newProgress = Math.min(f.progress + Math.random() * 30, 95);
            return { ...f, progress: newProgress };
          }
          return f;
        }));
      }, 200);

      // Perform actual upload
      uploadDocumentMutation.mutateAsync({
        file: uploadFile.file,
        collections: uploadFile.collectionId ? [uploadFile.collectionId] : undefined,
      })
      .then(() => {
        clearInterval(progressInterval);
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'success' as const, progress: 100 } : f
        ));
        resolve();
      })
      .catch((error) => {
        clearInterval(progressInterval);
        const errorMessage = error.message || 'Upload failed';
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'error' as const, error: errorMessage } : f
        ));
        reject(error);
      });
    });
  };

  const handleUploadAll = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Upload files one by one to avoid overwhelming the server
      for (const file of pendingFiles) {
        try {
          await uploadSingleFile(file);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      // Show completion toast
      if (successCount > 0) {
        toast({
          title: "Upload completed",
          description: `${successCount} file${successCount !== 1 ? 's' : ''} uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
        onUploadSuccess?.();
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Upload failed",
          description: `${errorCount} file${errorCount !== 1 ? 's' : ''} failed to upload`,
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const clearAll = () => {
    setUploadFiles([]);
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (type.includes('image')) return <Image className="h-4 w-4" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'uploading':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pendingCount = uploadFiles.filter(f => f.status === 'pending').length;
  const uploadingCount = uploadFiles.filter(f => f.status === 'uploading').length;
  const successCount = uploadFiles.filter(f => f.status === 'success').length;
  const errorCount = uploadFiles.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Default Collection Selection */}
      {collections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium min-w-0">Default Collection:</label>
              <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Collection</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dropzone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-blue-500 bg-blue-50" : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Drag & drop files here, or click to select</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports PDF, DOC, DOCX, TXT, MD, XLS, XLSX, JPG, PNG, GIF
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 10MB • Maximum files: {MAX_FILES}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Upload Queue</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-4 text-sm">
                  {pendingCount > 0 && <Badge variant="secondary">{pendingCount} pending</Badge>}
                  {uploadingCount > 0 && <Badge variant="default">{uploadingCount} uploading</Badge>}
                  {successCount > 0 && <Badge variant="default" className="bg-green-100 text-green-800">{successCount} success</Badge>}
                  {errorCount > 0 && <Badge variant="destructive">{errorCount} error</Badge>}
                </div>
                <div className="flex gap-2">
                  {successCount > 0 && (
                    <Button variant="outline" size="sm" onClick={clearCompleted}>
                      Clear Completed
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(uploadFile.file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)}
                      </p>
                    </div>
                  </div>

                  {/* Collection Assignment */}
                  {collections.length > 0 && uploadFile.status === 'pending' && (
                    <Select 
                      value={uploadFile.collectionId || ''} 
                      onValueChange={(value) => updateFileCollection(uploadFile.id, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Collection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Collection</SelectItem>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Progress Bar */}
                  {uploadFile.status === 'uploading' && (
                    <div className="w-24">
                      <Progress value={uploadFile.progress} className="h-2" />
                    </div>
                  )}

                  {/* Status Icon */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(uploadFile.status)}
                    {uploadFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Controls */}
            {pendingCount > 0 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {pendingCount} file{pendingCount !== 1 ? 's' : ''} ready to upload
                </p>
                <Button 
                  onClick={handleUploadAll}
                  disabled={isUploading}
                  className="min-w-[120px]"
                >
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload All
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}