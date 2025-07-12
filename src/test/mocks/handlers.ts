import { http, HttpResponse } from "msw";
import { apiConfig } from "@/lib/api-client";

// Mock data
const mockHealthResponse = {
  status: "healthy",
  timestamp: new Date().toISOString(),
  version: "1.0.0",
  uptime: 3600,
};

const mockDatabaseHealthResponse = {
  status: "connected",
  connectionCount: 5,
  maxConnections: 100,
  avgResponseTime: 12,
};

const mockDocuments = [
  {
    id: "doc-1",
    name: "Test Document 1",
    filename: "test1.pdf",
    size: 1024000,
    type: "application/pdf",
    status: "completed",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    extractedText: "Sample extracted text...",
    metadata: {
      pages: 10,
      author: "Test Author",
    },
    tags: ["test", "document"],
    collections: [],
    processingProgress: 100,
  },
  {
    id: "doc-2",
    name: "Test Document 2",
    filename: "test2.docx",
    size: 512000,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    status: "processing",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    extractedText: "",
    metadata: {},
    tags: [],
    collections: ["collection-1"],
    processingProgress: 75,
  },
];

const mockCollections = [
  {
    id: "collection-1",
    name: "Test Collection",
    description: "A test collection for documents",
    documentCount: 5,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    tags: ["test"],
    metadata: {},
  },
];

const mockWorkflows = [
  {
    id: "workflow-1",
    name: "Test Workflow",
    description: "A test workflow",
    status: "active",
    steps: [
      {
        id: "step-1",
        name: "Extract Text",
        type: "extraction",
        config: {},
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

export const handlers = [
  // Bypass all localhost:3000 requests (Next.js app and static assets)
  http.all('http://localhost:3000/*', ({ request }) => {
    return fetch(request);
  }),

  // Health endpoints
  http.get(`${apiConfig.api.baseUrl}${apiConfig.endpoints.health.base}`, () => {
    return HttpResponse.json(mockHealthResponse);
  }),

  http.get(
    `${apiConfig.api.baseUrl}${apiConfig.endpoints.health.database}`,
    () => {
      return HttpResponse.json(mockDatabaseHealthResponse);
    }
  ),

  http.get(
    `${apiConfig.api.baseUrl}${apiConfig.endpoints.health.databaseMetrics}`,
    () => {
      return HttpResponse.json({
        ...mockDatabaseHealthResponse,
        queriesPerSecond: 150,
        averageQueryTime: 25,
        activeConnections: 12,
      });
    }
  ),

  // Document endpoints
  http.get(
    `${apiConfig.api.baseUrl}${apiConfig.endpoints.documents.list}`,
    ({ request }) => {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");

      return HttpResponse.json({
        data: mockDocuments.slice((page - 1) * limit, page * limit),
        pagination: {
          page,
          limit,
          total: mockDocuments.length,
          totalPages: Math.ceil(mockDocuments.length / limit),
          hasNext: page * limit < mockDocuments.length,
          hasPrev: page > 1,
        },
      });
    }
  ),

  http.get(`${apiConfig.api.baseUrl}/documents/:id`, ({ params }) => {
    const document = mockDocuments.find((doc) => doc.id === params.id);
    if (!document) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(document);
  }),

  http.post(
    `${apiConfig.api.baseUrl}${apiConfig.endpoints.documents.upload}`,
    async ({ request }) => {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      const newDocument = {
        id: `doc-${Date.now()}`,
        name: (formData.get("name") as string) || file.name,
        filename: file.name,
        size: file.size,
        type: file.type,
        status: "processing",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        extractedText: "",
        metadata: {},
        tags: [],
        collections: [],
      };

      return HttpResponse.json(
        {
          document: newDocument,
          message: "Document uploaded successfully",
        },
        { status: 201 }
      );
    }
  ),

  http.delete(`${apiConfig.api.baseUrl}/documents/:id`, ({ params }) => {
    const documentExists = mockDocuments.some((doc) => doc.id === params.id);
    if (!documentExists) {
      return new HttpResponse(null, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Collection endpoints
  http.get(
    `${apiConfig.api.baseUrl}${apiConfig.endpoints.collections.list}`,
    () => {
      return HttpResponse.json({
        data: mockCollections,
        pagination: {
          page: 1,
          limit: 10,
          total: mockCollections.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    }
  ),

  http.get(`${apiConfig.api.baseUrl}/collections/:id`, ({ params }) => {
    const collection = mockCollections.find((col) => col.id === params.id);
    if (!collection) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(collection);
  }),

  http.post(
    `${apiConfig.api.baseUrl}${apiConfig.endpoints.collections.create}`,
    async ({ request }) => {
      const body = (await request.json()) as any;
      const newCollection = {
        id: `collection-${Date.now()}`,
        name: body.name,
        description: body.description || "",
        documentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: body.tags || [],
        metadata: body.metadata || {},
      };

      return HttpResponse.json(newCollection, { status: 201 });
    }
  ),

  // Workflow endpoints
  http.get(
    `${apiConfig.api.baseUrl}${apiConfig.endpoints.workflows.list}`,
    () => {
      return HttpResponse.json({
        data: mockWorkflows,
        pagination: {
          page: 1,
          limit: 10,
          total: mockWorkflows.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    }
  ),

  http.get(
    `${apiConfig.api.baseUrl}${apiConfig.endpoints.workflows.detail.replace(":id", ":id")}`,
    ({ params }) => {
      const workflow = mockWorkflows.find((wf) => wf.id === params.id);
      if (!workflow) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(workflow);
    }
  ),

  http.post(
    `${apiConfig.api.baseUrl}${apiConfig.endpoints.workflows.execute.replace(":id", ":id")}`,
    ({ params }) => {
      const workflow = mockWorkflows.find((wf) => wf.id === params.id);
      if (!workflow) {
        return new HttpResponse(null, { status: 404 });
      }

      const execution = {
        id: `execution-${Date.now()}`,
        workflowId: params.id as string,
        workflowName: workflow.name,
        status: "pending",
        progress: 0,
        startedAt: new Date().toISOString(),
        completedAt: null,
        result: null,
        errorMessage: null,
        logs: [],
      };

      return HttpResponse.json(
        {
          execution,
          message: "Workflow execution started",
        },
        { status: 201 }
      );
    }
  ),

  // RAG endpoints
  http.post(
    `${apiConfig.api.baseUrl}${apiConfig.endpoints.rag.query}`,
    async ({ request }) => {
      const body = (await request.json()) as any;

      return HttpResponse.json({
        queryId: `query-${Date.now()}`,
        response: "This is a mock RAG response based on your query.",
        sources: [
          {
            documentId: "1",
            documentName: "Test Document 1",
            relevanceScore: 0.95,
            excerpt: "Relevant text excerpt from the document...",
          },
        ],
        confidence: 0.85,
        processingTime: 1250,
      });
    }
  ),

  http.get(`${apiConfig.api.baseUrl}${apiConfig.endpoints.rag.config}`, () => {
    return HttpResponse.json({
      embeddingModel: "text-embedding-ada-002",
      llmModel: "gpt-3.5-turbo",
      chunkSize: 1000,
      chunkOverlap: 200,
      retrievalCount: 5,
      temperature: 0.7,
    });
  }),

  // Business metrics endpoints
  http.get(
    `${apiConfig.api.baseUrl}${apiConfig.endpoints.businessMetrics.summary}`,
    () => {
      return HttpResponse.json({
        totalUsers: 1250,
        totalDocuments: 5680,
        totalCollections: 89,
        totalQueries: 15420,
        systemLoad: 0.65,
        averageResponseTime: 185,
        errorRate: 0.02,
        uptime: 99.8,
        status: "healthy",
        alerts: [],
      });
    }
  ),

  // Error simulation endpoints for testing error handling
  http.get(`${apiConfig.api.baseUrl}/test/error/400`, () => {
    return HttpResponse.json(
      { error: "Bad Request", message: "Invalid request parameters" },
      { status: 400 }
    );
  }),

  http.get(`${apiConfig.api.baseUrl}/test/error/401`, () => {
    return HttpResponse.json(
      { error: "Unauthorized", message: "Authentication required" },
      { status: 401 }
    );
  }),

  http.get(`${apiConfig.api.baseUrl}/test/error/500`, () => {
    return HttpResponse.json(
      { error: "Internal Server Error", message: "Something went wrong" },
      { status: 500 }
    );
  }),

  http.get(`${apiConfig.api.baseUrl}/test/timeout`, () => {
    // Simulate a request that never resolves (for timeout testing)
    return new Promise(() => {});
  }),
];
