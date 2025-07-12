#!/usr/bin/env node

// Simple test script for file logging functionality
const { logger } = require('../src/lib/logger.ts');

async function testLogging() {
  console.log('🧪 Testing file logging functionality...');
  
  try {
    // Wait for logger initialization
    await logger.waitForInitialization();
    console.log('✅ Logger initialized');
    
    // Test different log levels
    logger.info('Test info message', { 
      testId: 'logging-test-1',
      timestamp: new Date().toISOString() 
    });
    
    logger.warn('Test warning message', { 
      testId: 'logging-test-2',
      details: 'This is a warning log' 
    });
    
    logger.error('Test error message', {
      error: {
        name: 'TestError',
        message: 'This is a test error',
        code: 'TEST_ERROR'
      },
      context: { testContext: 'file-logging-test' }
    });
    
    // Test API logging
    logger.logApiRequest({
      method: 'GET',
      url: '/api/test',
      correlationId: 'test-correlation-123',
    });
    
    logger.logApiResponse({
      method: 'GET',
      url: '/api/test',
      statusCode: 200,
      duration: 150,
      correlationId: 'test-correlation-123',
    });
    
    // Test performance logging
    const timer = logger.startTimer('test-operation');
    setTimeout(() => {
      timer({ recordsProcessed: 100 });
    }, 100);
    
    // Get log statistics
    setTimeout(async () => {
      const stats = await logger.getLogStats();
      console.log('📊 Log Statistics:', JSON.stringify(stats, null, 2));
      
      // Flush logs
      await logger.flush();
      console.log('✅ Logging test completed');
      
      process.exit(0);
    }, 200);
    
  } catch (error) {
    console.error('❌ Logging test failed:', error);
    process.exit(1);
  }
}

testLogging();