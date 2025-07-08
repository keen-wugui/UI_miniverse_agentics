// Base types for common patterns
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Health endpoint interfaces
export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
}

export interface DatabaseHealth {
  status: "connected" | "disconnected" | "error";
  connectionCount: number;
  responseTime: number;
  lastChecked: string;
}

export interface DatabaseMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  maxConnections: number;
  connectionUtilization: number;
  averageResponseTime: number;
  totalQueries: number;
  slowQueries: number;
  errorRate: number;
  tableStats: {
    [tableName: string]: {
      recordCount: number;
      size: string;
      lastUpdated: string;
    };
  };
}

// Document endpoint interfaces
export interface Document extends BaseEntity {
  name: string;
  filename: string;
  contentType: string;
  size: number;
  status: "processing" | "completed" | "failed" | "pending";
  metadata: {
    extractedText?: string;
    pageCount?: number;
    language?: string;
    [key: string]: any;
  };
  collections: string[]; // Collection IDs this document belongs to
  tags: string[];
  uploadedBy?: string;
  processingProgress?: number;
  errorMessage?: string;
}

export interface DocumentUploadRequest {
  file: File;
  name?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  collections?: string[];
}

export interface DocumentUploadResponse {
  document: Document;
  uploadUrl?: string;
  processingJobId?: string;
}

export interface DocumentSearchRequest extends SearchParams {
  contentQuery?: string;
  tags?: string[];
  collections?: string[];
  status?: Document["status"][];
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface DocumentExtractionResult {
  documentId: string;
  extractedText: string;
  metadata: {
    pageCount: number;
    wordCount: number;
    language: string;
    confidence: number;
  };
  chunks: {
    id: string;
    text: string;
    pageNumber?: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
}

// Collection endpoint interfaces
export interface Collection extends BaseEntity {
  name: string;
  description?: string;
  documentCount: number;
  totalSize: number;
  tags: string[];
  isPublic: boolean;
  owner?: string;
  permissions: {
    read: string[];
    write: string[];
    admin: string[];
  };
  metadata: Record<string, any>;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

export interface CollectionSearchRequest extends SearchParams {
  tags?: string[];
  isPublic?: boolean;
  owner?: string;
}

export interface CollectionDocumentsResponse
  extends PaginatedResponse<Document> {}

export interface AddDocumentToCollectionRequest {
  collectionId: string;
  documentId: string;
}

// Workflow endpoint interfaces
export interface Workflow extends BaseEntity {
  name: string;
  description?: string;
  status: "draft" | "active" | "paused" | "archived";
  type: "rag_pipeline" | "document_processing" | "data_extraction" | "custom";
  configuration: {
    steps: WorkflowStep[];
    triggers: WorkflowTrigger[];
    schedule?: {
      type: "cron" | "interval";
      expression: string;
    };
  };
  lastRun?: {
    timestamp: string;
    status: "success" | "failed" | "running";
    duration: number;
    errorMessage?: string;
  };
  metrics: {
    totalRuns: number;
    successRate: number;
    averageDuration: number;
    lastSuccessfulRun?: string;
  };
  owner?: string;
  tags: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  configuration: Record<string, any>;
  dependsOn?: string[];
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
  };
}

export interface WorkflowTrigger {
  type: "manual" | "schedule" | "event" | "webhook";
  configuration: Record<string, any>;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  type: Workflow["type"];
  configuration: Workflow["configuration"];
  tags?: string[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  status?: Workflow["status"];
  configuration?: Workflow["configuration"];
  tags?: string[];
}

export interface WorkflowExecution extends BaseEntity {
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  startTime: string;
  endTime?: string;
  duration?: number;
  triggeredBy: {
    type: "manual" | "schedule" | "event" | "webhook";
    userId?: string;
    source?: string;
  };
  steps: {
    stepId: string;
    status: "pending" | "running" | "completed" | "failed" | "skipped";
    startTime?: string;
    endTime?: string;
    output?: any;
    errorMessage?: string;
  }[];
  output?: any;
  errorMessage?: string;
  logs: {
    timestamp: string;
    level: "info" | "warn" | "error" | "debug";
    message: string;
    stepId?: string;
  }[];
}

export interface ExecuteWorkflowRequest {
  input?: Record<string, any>;
  overrides?: {
    stepId: string;
    configuration: Record<string, any>;
  }[];
}

// RAG Configuration interfaces
export interface RAGConfig {
  embeddingModel: {
    provider: "openai" | "huggingface" | "cohere" | "custom";
    modelName: string;
    dimensions: number;
    configuration: Record<string, any>;
  };
  llmModel: {
    provider: "openai" | "anthropic" | "huggingface" | "custom";
    modelName: string;
    configuration: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      [key: string]: any;
    };
  };
  chunking: {
    strategy: "fixed_size" | "semantic" | "recursive" | "custom";
    chunkSize: number;
    chunkOverlap: number;
    configuration: Record<string, any>;
  };
  retrieval: {
    strategy: "similarity" | "mmr" | "hybrid" | "custom";
    topK: number;
    scoreThreshold?: number;
    rerankModel?: {
      provider: string;
      modelName: string;
      configuration: Record<string, any>;
    };
    configuration: Record<string, any>;
  };
  generation: {
    systemPrompt?: string;
    responseFormat: "text" | "json" | "structured";
    maxResponseTokens: number;
    includeSourceCitations: boolean;
    configuration: Record<string, any>;
  };
}

export interface UpdateRAGConfigRequest {
  embeddingModel?: Partial<RAGConfig["embeddingModel"]>;
  llmModel?: Partial<RAGConfig["llmModel"]>;
  chunking?: Partial<RAGConfig["chunking"]>;
  retrieval?: Partial<RAGConfig["retrieval"]>;
  generation?: Partial<RAGConfig["generation"]>;
}

export interface RAGQueryRequest {
  query: string;
  collections?: string[];
  filters?: Record<string, any>;
  maxResults?: number;
  includeMetadata?: boolean;
  overrides?: Partial<RAGConfig>;
}

export interface RAGQueryResponse {
  answer: string;
  sources: {
    documentId: string;
    documentName: string;
    chunkId: string;
    content: string;
    score: number;
    metadata: Record<string, any>;
  }[];
  metadata: {
    queryTime: number;
    retrievalTime: number;
    generationTime: number;
    totalTime: number;
    tokensUsed: {
      prompt: number;
      completion: number;
      total: number;
    };
    modelUsed: {
      embedding: string;
      llm: string;
      rerank?: string;
    };
  };
  conversationId?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  collections?: string[];
  contextWindow?: number;
  overrides?: Partial<RAGConfig>;
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
  sources: RAGQueryResponse["sources"];
  metadata: RAGQueryResponse["metadata"];
}

// Business Metrics interfaces
export interface BusinessMetricsSummary {
  totalDocuments: number;
  totalCollections: number;
  totalWorkflows: number;
  activeUsers: number;
  storageUsed: {
    bytes: number;
    formatted: string;
  };
  queryVolume: {
    total: number;
    thisMonth: number;
    avgPerDay: number;
  };
  systemHealth: {
    status: "healthy" | "warning" | "critical";
    uptime: number;
    lastIncident?: string;
  };
  totalUsers?: number;
  status?: "healthy" | "warning" | "critical";
  alerts?: {
    id: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    timestamp: string;
  }[];
  systemLoad?: number;
  averageResponseTime?: number;
  errorRate?: number;
  uptime?: number;
}

export interface MetricsFilterRequest {
  dateRange?: {
    start: string;
    end: string;
  };
  granularity?: "hour" | "day" | "week" | "month";
  metrics?: string[];
  groupBy?: string[];
}

export interface KPI {
  id: string;
  name: string;
  description?: string;
  value: number;
  unit: string;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  trend?: {
    direction: "up" | "down" | "stable";
    percentage: number;
  };
  category: string;
  lastUpdated: string;
}

export interface CreateKPIRequest {
  name: string;
  description?: string;
  unit: string;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  category: string;
}

export interface UpdateKPIRequest {
  name?: string;
  description?: string;
  unit?: string;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  category?: string;
}

export interface AnalyticsReportRequest {
  dateRange: {
    start: string;
    end: string;
  };
  metrics: string[];
  granularity?: "hour" | "day" | "week" | "month";
  groupBy?: string[];
  filters?: Record<string, any>;
}

export interface AnalyticsReportResponse {
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    name: string;
    value: number;
    unit: string;
    trend?: {
      direction: "up" | "down" | "stable";
      percentage: number;
    };
  }[];
  chartData: {
    timestamp: string;
    values: Record<string, number>;
  }[];
  totalUsers: number;
  totalDocuments: number;
  totalCollections: number;
  totalQueries: number;
  summary: {
    totalValue: number;
    averageValue: number;
    peakValue: number;
    lowValue: number;
  };
}

export interface MetricsExportRequest {
  dateRange: {
    start: string;
    end: string;
  };
  metrics: string[];
  format: "csv" | "json" | "excel";
  includeHeaders?: boolean;
  filters?: Record<string, any>;
}

export interface MetricsExportResponse {
  downloadUrl: string;
  filename: string;
  format: string;
  expiresAt: string;
  fileSize: number;
}

export interface PerformanceMetrics {
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
  };
  throughput: {
    requestsPerSecond: number;
    queriesPerMinute: number;
    documentsProcessedPerHour: number;
  };
  errorRates: {
    overall: number;
    byEndpoint: Record<string, number>;
    byStatusCode: Record<string, number>;
  };
  resourceUtilization: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  averageResponseTime?: number;
  errorRate?: number;
  systemLoad?: number;
}

export interface UsageMetrics {
  timeRange: {
    start: string;
    end: string;
  };
  apiCalls: {
    total: number;
    byEndpoint: Record<string, number>;
    byUser: Record<string, number>;
  };
  dataProcessing: {
    documentsProcessed: number;
    bytesProcessed: number;
    averageProcessingTime: number;
  };
  ragQueries: {
    total: number;
    averageResponseTime: number;
    popularCollections: {
      collectionId: string;
      collectionName: string;
      queryCount: number;
    }[];
  };
  trends: {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
  };
}

export interface CostMetrics {
  totalCost: {
    amount: number;
    currency: string;
    period: string;
  };
  breakdown: {
    apiCalls: number;
    storage: number;
    compute: number;
    llmUsage: number;
    embeddingUsage: number;
  };
  trends: {
    daily: Record<string, number>;
    monthly: Record<string, number>;
  };
  projections: {
    nextMonth: number;
    nextQuarter: number;
  };
}

// Common API response types
export type HealthResponse = HealthStatus;
export type DatabaseHealthResponse = DatabaseHealth;
export type DatabaseMetricsResponse = DatabaseMetrics;

export type DocumentsResponse = PaginatedResponse<Document>;
export type DocumentResponse = Document;
export type DocumentSearchResponse = PaginatedResponse<Document>;

export type CollectionsResponse = PaginatedResponse<Collection>;
export type CollectionResponse = Collection;
export type CollectionSearchResponse = PaginatedResponse<Collection>;

export type WorkflowsResponse = PaginatedResponse<Workflow>;
export type WorkflowResponse = Workflow;
export type WorkflowExecutionResponse = WorkflowExecution;
export type WorkflowExecutionsResponse = PaginatedResponse<WorkflowExecution>;

export type RAGConfigResponse = RAGConfig;
export type BusinessMetricsSummaryResponse = BusinessMetricsSummary;
export type BusinessMetricsResponse = BusinessMetricsSummary;
export type KPIResponse = PaginatedResponse<KPI>;
export type PerformanceMetricsResponse = PerformanceMetrics;
export type UsageMetricsResponse = UsageMetrics;
export type CostMetricsResponse = CostMetrics;

// RAG Index types (placeholders)
export interface RAGIndexRequest {
  name: string;
  description?: string;
  collections?: string[];
  configuration?: Record<string, any>;
}

export interface RAGIndexResponse {
  indexId: string;
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  configuration?: Record<string, any>;
}

export interface RAGIndexStatusResponse {
  indexId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  documentsProcessed?: number;
  totalDocuments?: number;
  errorMessage?: string;
  completedAt?: string;
}

export interface RAGGenerateRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  configuration?: Record<string, any>;
}

export interface RAGGenerateResponse {
  text: string;
  tokensUsed: number;
  processingTime: number;
  metadata?: Record<string, any>;
}

export interface RAGSourcesResponse {
  queryId: string;
  sources: Array<{
    documentId: string;
    documentName: string;
    chunkId: string;
    content: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
}

export interface RAGConfigurationResponse {
  indexId: string;
  configuration: RAGConfig;
  status: string;
}
