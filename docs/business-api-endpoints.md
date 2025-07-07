# Business API Endpoints

This document tracks the current state of Business API endpoints available for the UI frontend.

## Base Configuration

- **Base URL:** Configured in `src/config/api-config.json`
- **Authentication:** Bearer token based
- **Response Format:** JSON
- **Pagination:** Cursor-based and offset-based support

## Document Endpoints

### GET /api/documents
**Purpose:** List documents with pagination and basic filtering  
**Parameters:**
- `page?: number` - Page number
- `limit?: number` - Items per page
- `offset?: number` - Offset for cursor pagination
- `query?: string` - Search query
- `sortBy?: string` - Sort field
- `sortOrder?: "asc" | "desc"` - Sort direction

**Response:** `PaginatedResponse<Document>`

### GET /api/documents/{id}
**Purpose:** Get document details by ID  
**Response:** `Document`

### GET /api/documents/search
**Purpose:** Search documents with advanced filters  
**Parameters:**
- `query?: string` - Text search query
- `contentQuery?: string` - Content-based search
- `tags?: string[]` - Filter by tags
- `collections?: string[]` - Filter by collections
- `status?: Document["status"][]` - Filter by processing status
- `dateRange?: { from: string, to: string }` - Date range filter

**Response:** `PaginatedResponse<Document>`

### GET /api/documents/{id}/extract
**Purpose:** Get document extraction results  
**Response:** `DocumentExtractionResult`

### POST /api/documents/upload
**Purpose:** Upload a new document  
**Body:** `FormData` with file and metadata  
**Response:** `DocumentUploadResponse`

### PUT /api/documents/{id}
**Purpose:** Update document metadata  
**Body:** Partial document data  
**Response:** `Document`

### DELETE /api/documents/{id}
**Purpose:** Delete a single document  
**Response:** `void`

### POST /api/documents/bulk-delete
**Purpose:** Delete multiple documents  
**Body:** `{ documentIds: string[] }`  
**Response:** `void`

### GET /api/documents/{id}/processing-status
**Purpose:** Get real-time processing status  
**Response:** Processing status with progress percentage

## Collection Endpoints

### GET /api/collections
**Purpose:** List collections with pagination  
**Response:** `PaginatedResponse<Collection>`

### GET /api/collections/{id}
**Purpose:** Get collection details  
**Response:** `Collection`

### GET /api/collections/{id}/documents
**Purpose:** Get documents in a collection  
**Response:** `PaginatedResponse<Document>`

### POST /api/collections
**Purpose:** Create new collection  
**Response:** `Collection`

### PUT /api/collections/{id}
**Purpose:** Update collection  
**Response:** `Collection`

### DELETE /api/collections/{id}
**Purpose:** Delete collection  
**Response:** `void`

## Workflow Endpoints

### GET /api/workflows
**Purpose:** List workflows  
**Response:** `PaginatedResponse<Workflow>`

### GET /api/workflows/{id}
**Purpose:** Get workflow details  
**Response:** `Workflow`

### POST /api/workflows
**Purpose:** Create new workflow  
**Response:** `Workflow`

### PUT /api/workflows/{id}
**Purpose:** Update workflow  
**Response:** `Workflow`

### DELETE /api/workflows/{id}
**Purpose:** Delete workflow  
**Response:** `void`

### POST /api/workflows/{id}/execute
**Purpose:** Execute workflow  
**Response:** `WorkflowExecution`

### GET /api/workflows/{id}/executions
**Purpose:** Get workflow execution history  
**Response:** `PaginatedResponse<WorkflowExecution>`

## RAG Endpoints

### GET /api/rag/config
**Purpose:** Get current RAG configuration  
**Response:** `RAGConfig`

### PUT /api/rag/config
**Purpose:** Update RAG configuration  
**Response:** `RAGConfig`

### POST /api/rag/query
**Purpose:** Perform RAG query  
**Response:** `RAGQueryResponse`

### POST /api/rag/chat
**Purpose:** Chat with RAG system  
**Response:** `ChatResponse`

## Analytics & Metrics Endpoints

### GET /api/health
**Purpose:** System health check  
**Response:** `HealthStatus`

### GET /api/health/database
**Purpose:** Database health status  
**Response:** `DatabaseHealth`

### GET /api/metrics/business
**Purpose:** Business metrics summary  
**Response:** `BusinessMetricsSummary`

### GET /api/metrics/performance
**Purpose:** System performance metrics  
**Response:** `PerformanceMetrics`

### GET /api/metrics/usage
**Purpose:** Usage statistics  
**Response:** `UsageMetrics`

### GET /api/metrics/cost
**Purpose:** Cost analytics  
**Response:** `CostMetrics`

## Notes

- All endpoints support standard HTTP status codes
- Error responses follow consistent format from `error-handling.ts`
- Caching strategies are implemented in `cache-config.ts`
- React Query hooks are available in `src/hooks/api/` for all endpoints
- Authentication is handled globally by the API client

## Limitations & Enhancement Requests

See `api-change-requests.md` for requested enhancements to support advanced UI features. 