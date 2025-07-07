# API Change Requests

This document tracks requests for changes to the Business API (external REST API) needed to support UI features.

## Document Management Interface Enhancements
**Status:** Requested  
**Priority:** High  
**Date:** 2024-12-19

### Description
Enhanced document management interface requires several API improvements for advanced filtering, bulk operations, and metadata management.

### Required Changes

#### 1. Enhanced Document Filtering
- **Endpoint:** GET `/api/documents`
- **New Query Parameters:**
  - `fileTypes[]`: Array of file types to filter by (pdf, docx, txt, etc.)
  - `statusFilter[]`: Array of processing statuses to filter by
  - `uploadDateRange`: Object with `start` and `end` date strings
  - `sizeRange`: Object with `min` and `max` byte values
  - `tagsOperator`: Either "AND" or "OR" for tag filtering logic

#### 2. Bulk Operations Support
- **Endpoint:** POST `/api/documents/bulk`
- **Actions Needed:**
  - Bulk delete multiple documents
  - Bulk move documents to collections
  - Bulk reprocess documents
  - Bulk update tags/metadata

#### 3. Document Metadata Update
- **Endpoint:** PATCH `/api/documents/{id}/metadata`
- **Requirements:**
  - Support for partial metadata updates
  - Validation for metadata fields
  - History tracking for metadata changes

#### 4. Document Preview Generation
- **Endpoint:** GET `/api/documents/{id}/preview`
- **Requirements:**
  - Generate preview URLs for various file types
  - Support for thumbnail generation
  - Configurable preview quality/size

### Expected Request/Response Examples

#### Enhanced Filtering Request
```json
GET /api/documents?fileTypes[]=pdf&fileTypes[]=docx&statusFilter[]=completed&uploadDateRange[start]=2024-01-01&uploadDateRange[end]=2024-12-31&sizeRange[min]=1024&sizeRange[max]=10485760&tagsOperator=AND
```

#### Bulk Operations Request
```json
POST /api/documents/bulk
{
  "action": "delete",
  "documentIds": ["doc1", "doc2", "doc3"],
  "options": {
    "permanent": false
  }
}
```

#### Metadata Update Request
```json
PATCH /api/documents/doc123/metadata
{
  "metadata": {
    "category": "financial",
    "department": "accounting",
    "customField1": "value1"
  }
}
```

### Notes
These changes support the comprehensive document management interface implementation in Task 6. Current API hooks in `useDocuments.ts` provide basic functionality but need these enhancements for full feature parity.

---

## Document Upload Progress Tracking
**Status:** Requested  
**Priority:** Medium  
**Date:** 2024-12-19

### Description
Current document upload needs real-time progress tracking and chunked upload support for large files.

### Required Changes

#### 1. Chunked Upload Support
- **Endpoint:** POST `/api/documents/upload/initiate`
- **Purpose:** Initialize chunked upload session
- **Response:** Upload session ID and chunk URLs

#### 2. Upload Progress Tracking
- **Endpoint:** GET `/api/documents/upload/{sessionId}/progress`
- **Purpose:** Real-time upload progress tracking
- **Response:** Progress percentage and status

### Expected Request/Response

#### Initiate Chunked Upload
```json
POST /api/documents/upload/initiate
{
  "filename": "large-document.pdf",
  "fileSize": 52428800,
  "contentType": "application/pdf",
  "chunkSize": 5242880
}

Response:
{
  "sessionId": "upload_123",
  "chunkUrls": [...],
  "totalChunks": 10
}
```

### Notes
Required for drag-and-drop upload component with progress tracking in document management interface. 