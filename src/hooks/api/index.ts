// Health hooks
export * from "./useHealth";

// Document hooks
export * from "./useDocuments";

// Collection hooks
export * from "./useCollections";

// Workflow hooks
export * from "./useWorkflows";

// RAG (Retrieval-Augmented Generation) hooks
export * from "./useRAG";

// Business metrics hooks
export * from "./useBusinessMetrics";

// Re-export types for convenience
export type {
  // Health types
  HealthResponse,
  DatabaseHealthResponse,
  DatabaseMetricsResponse,

  // Document types
  DocumentsResponse,
  DocumentResponse,
  DocumentSearchResponse,
  DocumentUploadRequest,
  DocumentUploadResponse,
  DocumentExtractionResult,
  DocumentSearchRequest,

  // Collection types
  CollectionsResponse,
  CollectionResponse,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  CollectionSearchRequest,
  CollectionSearchResponse,

  // Workflow types
  WorkflowsResponse,
  WorkflowResponse,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ExecuteWorkflowRequest,
  WorkflowExecutionResponse,
  WorkflowExecutionsResponse,
  WorkflowExecutionStatus,

  // RAG types
  RAGQueryRequest,
  RAGQueryResponse,
  RAGConfigResponse,

  // Business metrics types
  BusinessMetricsSummaryResponse,

  // Common types
  PaginationParams,
  BaseEntity,
  ApiError,
} from "@/types/api";
