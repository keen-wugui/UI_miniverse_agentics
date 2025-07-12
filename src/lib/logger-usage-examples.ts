// Example usage of the enhanced logger
import { logger } from '@/lib/logger';

// These examples show how to use the logger throughout your application

export const loggerExamples = {
  // Basic logging
  basicUsage: () => {
    logger.info('User logged in', { 
      userId: '123', 
      sessionId: 'abc-def-123' 
    });
    
    logger.warn('Slow API response detected', { 
      endpoint: '/api/documents',
      duration: 3000 
    });
    
    logger.error('Database connection failed', {
      error: {
        name: 'ConnectionError',
        message: 'Unable to connect to database',
        code: 'DB_CONNECTION_FAILED'
      },
      context: { retryAttempt: 3 }
    });
  },

  // API logging (automatic in ApiClient)
  apiLogging: () => {
    // These are called automatically by the ApiClient
    logger.logApiRequest({
      method: 'POST',
      url: '/api/documents',
      correlationId: 'req-123',
    });

    logger.logApiResponse({
      method: 'POST', 
      url: '/api/documents',
      statusCode: 201,
      duration: 250,
      correlationId: 'req-123',
    });
  },

  // Performance monitoring
  performanceLogging: () => {
    // Time an operation
    const timer = logger.startTimer('document-processing');
    
    // ... do some work
    
    // Log completion with metadata
    timer({ documentsProcessed: 50, totalSize: '2.5MB' });

    // Or log performance directly
    logger.logPerformance({
      operation: 'file-upload',
      duration: 1200,
      threshold: 1000, // Will log as warning if over 1 second
      metadata: { fileSize: '5MB', fileType: 'pdf' }
    });
  },

  // Context-specific logging
  contextualLogging: () => {
    // Authentication events
    logger.logAuth('User authentication successful', {
      userId: '123',
      method: 'oauth',
      provider: 'google'
    });

    // Business logic events
    logger.logBusiness('Document collection created', {
      collectionId: 'col-123',
      documentsCount: 15,
      owner: 'user-456'
    });

    // System events
    logger.logSystem('Cache cleared', {
      cacheType: 'query-cache',
      reason: 'memory-pressure'
    });

    // UI events (for debugging)
    logger.logUI('Modal opened', {
      modalType: 'document-preview',
      documentId: 'doc-789'
    });
  },

  // Server-side logging (works in API routes, middleware, server components)
  serverSideExample: async () => {
    // In API routes (/app/api/*)
    logger.info('API route accessed', {
      route: '/api/documents',
      method: 'GET',
      userAgent: 'Mozilla/5.0...'
    });

    // File logging will work here
    const stats = await logger.getLogStats();
    logger.debug('Log statistics', { stats });
  },

  // Error handling with context
  errorHandling: (error: Error, context: Record<string, any>) => {
    logger.logError(error, {
      ...context,
      correlationId: 'error-123',
      userId: 'user-456',
      operation: 'document-upload'
    });
  },

  // Correlation ID usage for request tracking
  correlationExample: () => {
    const correlationId = logger.generateCorrelationId();
    
    logger.info('Starting document processing', { correlationId });
    
    // ... multiple operations with same correlation ID
    
    logger.info('Document validation completed', { 
      correlationId, 
      validationResult: 'passed' 
    });
    
    logger.info('Document processing completed', { 
      correlationId,
      processingTime: 1500 
    });
  }
};

// Child logger with persistent context
export const createUserLogger = (userId: string) => {
  return logger.child({ userId, userContext: true });
};

// Example: API route with logging
export const exampleApiRoute = async (req: Request) => {
  const correlationId = logger.generateCorrelationId();
  
  logger.info('API request received', {
    correlationId,
    method: req.method,
    url: req.url,
  });

  try {
    // ... API logic
    
    logger.info('API request completed successfully', {
      correlationId,
      responseTime: 150,
    });
    
    return Response.json({ success: true });
  } catch (error) {
    logger.logError(error as Error, {
      correlationId,
      context: { apiRoute: '/api/example' }
    });
    
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};