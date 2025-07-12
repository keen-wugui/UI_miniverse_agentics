import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const correlationId = logger.generateCorrelationId();
  
  try {
    // Wait for logger initialization (includes file logging setup)
    await logger.waitForInitialization();
    
    // Log API request with correlation ID
    logger.info('Test logging API endpoint called', {
      correlationId,
      method: 'GET',
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    // Test different log levels
    logger.debug('Debug message from API', { correlationId, testData: 'debug-info' });
    logger.info('Info message from API', { correlationId, testData: 'info-data' });
    logger.warn('Warning message from API', { correlationId, testData: 'warning-data' });

    // Test performance logging
    const timer = logger.startTimer('test-operation');
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    timer({ operationType: 'api-test', recordsProcessed: 1 });

    // Test API-specific logging
    logger.logApiResponse({
      method: 'GET',
      url: '/api/test-logging',
      statusCode: 200,
      duration: 100,
      correlationId,
    });

    // Get log statistics
    const stats = await logger.getLogStats();

    logger.info('Test logging API completed successfully', {
      correlationId,
      responseTime: 100,
      logStats: stats,
    });

    return NextResponse.json({
      success: true,
      message: 'Logging test completed',
      correlationId,
      logStats: stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.logError(error as Error, {
      correlationId,
      context: { apiRoute: '/api/test-logging' }
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        correlationId,
      },
      { status: 500 }
    );
  }
}