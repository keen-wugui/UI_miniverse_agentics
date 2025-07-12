# Logging System Documentation

This application uses a comprehensive structured logging system built with Pino for high-performance, production-ready logging capabilities.

## Quick Start

### Automatic Logging with Development Server

Logging works automatically when you start the development server:

```bash
pnpm dev
```

**What happens automatically:**
- ✅ Logger initializes and creates `./logs` directory
- ✅ Application startup events are logged
- ✅ API requests/responses are logged with timing
- ✅ Errors are captured with full context
- ✅ Log files rotate daily and clean up automatically

## Log Destinations

### Development Environment (`NODE_ENV=development`)
- **📁 Files**: `./logs/app-YYYY-MM-DD.log`
- **🖥️ Console**: Pretty-printed with colors in terminal
- **🔄 Rotation**: Daily + when file reaches 10MB
- **🗑️ Cleanup**: Files older than 30 days automatically deleted
- **📊 Max Files**: 14 files kept

### Test Environment (`NODE_ENV=test`)
- **📁 Files**: `./logs/test/test-YYYY-MM-DD.log`
- **🖥️ Console**: Disabled for clean test output
- **🔄 Rotation**: Daily + when file reaches 5MB
- **🗑️ Cleanup**: Files older than 7 days
- **📊 Max Files**: 5 files kept

### Staging Environment (`NODE_ENV=staging`)
- **📁 Files**: `/var/log/ui-miniverse-agentics/app-YYYY-MM-DD.log`
- **🖥️ Console**: JSON format to stdout
- **🔄 Rotation**: Daily + when file reaches 50MB
- **🗑️ Cleanup**: Files older than 30 days
- **📊 Max Files**: 30 files kept
- **📦 Compression**: gzip enabled

### Production Environment (`NODE_ENV=production`)
- **📁 Files**: `/var/log/ui-miniverse-agentics/app-YYYY-MM-DD.log`
- **🖥️ Console**: Disabled (file-only logging)
- **🔄 Rotation**: Daily + when file reaches 100MB
- **🗑️ Cleanup**: Files older than 60 days
- **📊 Max Files**: 60 files kept
- **📦 Compression**: gzip enabled

## Log Levels

The system uses standard log levels with environment-specific defaults:

| Level | Development | Test | Staging | Production | Description |
|-------|------------|------|---------|------------|-------------|
| `trace` | ✅ | ❌ | ❌ | ❌ | Very detailed debugging |
| `debug` | ✅ | ❌ | ❌ | ❌ | Debugging information |
| `info` | ✅ | ❌ | ✅ | ❌ | General information |
| `warn` | ✅ | ✅ | ✅ | ✅ | Warning conditions |
| `error` | ✅ | ✅ | ✅ | ✅ | Error conditions |
| `fatal` | ✅ | ✅ | ✅ | ✅ | Fatal errors |

## Log Format

### Console Output (Development)
```
[15:30:00.123] INFO: Application started
    environment: "development"
    timestamp: "2024-07-12T15:30:00.123Z"
```

### File Output (JSON)
```json
{
  "level": "info",
  "time": "2024-07-12T15:30:00.123Z",
  "service": "ui-miniverse-agentics",
  "version": "0.1.0",
  "environment": "development",
  "hostname": "your-machine",
  "msg": "Application started",
  "environment": "development",
  "timestamp": "2024-07-12T15:30:00.123Z"
}
```

## Usage Examples

### Basic Logging

```typescript
import { logger } from '@/lib/logger';

// Basic log levels
logger.info('User logged in', { userId: '123', sessionId: 'abc-def' });
logger.warn('Slow operation detected', { operation: 'file-upload', duration: 3000 });
logger.error('Database connection failed', {
  error: {
    name: 'ConnectionError',
    message: 'Unable to connect',
    code: 'DB_CONNECTION_FAILED'
  }
});
```

### API Logging (Automatic)

API logging happens automatically through the `ApiClient`:

```typescript
// These are logged automatically:
const response = await apiClient.get('/api/documents');
```

**Generates logs:**
```json
{"level":"info","msg":"API Request: GET /api/documents","method":"GET","url":"/api/documents","correlationId":"1720794600000-abc123"}
{"level":"info","msg":"API Response: 200 GET /api/documents","statusCode":200,"duration":150,"correlationId":"1720794600000-abc123"}
```

### Performance Monitoring

```typescript
// Time an operation
const timer = logger.startTimer('document-processing');

// ... do work ...

// Log completion with metadata
timer({ documentsProcessed: 50, totalSize: '2.5MB' });

// Direct performance logging
logger.logPerformance({
  operation: 'file-upload',
  duration: 1200,
  threshold: 1000, // Logs as warning if over threshold
  metadata: { fileSize: '5MB', fileType: 'pdf' }
});
```

### Context-Specific Logging

```typescript
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

// UI events (debugging)
logger.logUI('Modal opened', {
  modalType: 'document-preview',
  documentId: 'doc-789'
});
```

### Error Handling with Context

```typescript
try {
  await uploadDocument(file);
} catch (error) {
  logger.logError(error as Error, {
    userId: 'user-123',
    operation: 'document-upload',
    fileSize: file.size,
    correlationId: 'upload-456'
  });
}
```

### Correlation ID for Request Tracking

```typescript
const correlationId = logger.generateCorrelationId();

logger.info('Starting document processing', { correlationId });

// ... multiple operations with same correlation ID ...

logger.info('Document validation completed', { 
  correlationId, 
  validationResult: 'passed' 
});

logger.info('Document processing completed', { 
  correlationId,
  processingTime: 1500 
});
```

### Child Logger with Persistent Context

```typescript
// Create logger with persistent user context
const userLogger = logger.child({ userId: '123', userRole: 'admin' });

userLogger.info('Action performed', { action: 'delete-document' });
// Automatically includes userId and userRole in all logs
```

### API Route Example

```typescript
// app/api/documents/route.ts
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const correlationId = logger.generateCorrelationId();
  
  logger.info('API request received', {
    correlationId,
    method: 'GET',
    url: request.url,
  });

  try {
    const documents = await getDocuments();
    
    logger.info('API request completed', {
      correlationId,
      responseTime: 150,
      resultCount: documents.length,
    });
    
    return Response.json(documents);
  } catch (error) {
    logger.logError(error as Error, {
      correlationId,
      context: { apiRoute: '/api/documents' }
    });
    
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

## Security Features

### Automatic Data Redaction

Sensitive data is automatically redacted from logs:

```typescript
// These fields are automatically redacted:
const sensitiveData = {
  password: "secret123",      // → "[REDACTED]"
  token: "jwt-token",         // → "[REDACTED]"
  apiKey: "api-key-123",      // → "[REDACTED]"
  authorization: "Bearer...", // → "[REDACTED]"
  // ... and more
};
```

**Redacted paths:**
- `password`, `token`, `secret`, `key`
- `authorization`, `cookie`, `apiKey`
- `auth.password`, `auth.token`
- `headers.authorization`, `headers.cookie`
- `body.password`, `body.token`

### Header Sanitization

HTTP headers are automatically sanitized in API logs:

```typescript
// Sensitive headers are redacted
const headers = {
  'authorization': '[REDACTED]',
  'cookie': '[REDACTED]',
  'x-api-key': '[REDACTED]',
  'content-type': 'application/json' // Safe headers preserved
};
```

## Log Management

### Viewing Logs

```bash
# View today's logs
cat logs/app-$(date +%Y-%m-%d).log

# Watch logs in real-time
tail -f logs/app-$(date +%Y-%m-%d).log

# Search logs for errors
grep '"level":"error"' logs/app-*.log

# Pretty print JSON logs
cat logs/app-$(date +%Y-%m-%d).log | jq '.'
```

### Log Statistics

```typescript
import { logger } from '@/lib/logger';

// Get log file statistics
const stats = await logger.getLogStats();
console.log(stats);
// {
//   directory: "./logs",
//   totalFiles: 5,
//   totalSize: 52428800,
//   oldestFile: "app-2024-07-08.log.gz",
//   newestFile: "app-2024-07-12.log"
// }
```

### Manual Log Rotation

```typescript
// Trigger manual log rotation
await logger.rotateLogs();

// Flush all pending logs
await logger.flush();
```

## File Structure

```
logs/
├── app-2024-07-12.log      # Today's logs (current)
├── app-2024-07-11.log.gz   # Yesterday's logs (compressed)
├── app-2024-07-10.log.gz   # Older logs (compressed)
├── app-2024-07-09.log.gz   # ...
└── .gitkeep                # Preserves directory in git
```

## Performance Considerations

### Thresholds

The logging system monitors performance and highlights slow operations:

```typescript
export const PERFORMANCE_THRESHOLDS = {
  API_SLOW_REQUEST: 2000,      // 2 seconds
  API_VERY_SLOW_REQUEST: 5000, // 5 seconds
  COMPONENT_RENDER_SLOW: 100,  // 100ms
  COMPONENT_RENDER_VERY_SLOW: 500, // 500ms
} as const;
```

### Log Contexts

Different contexts help organize and filter logs:

```typescript
export const LOG_CONTEXTS = {
  API: "api",
  AUTH: "auth", 
  UI: "ui",
  ERROR: "error",
  PERFORMANCE: "performance",
  BUSINESS_LOGIC: "business",
  SYSTEM: "system",
} as const;
```

## Troubleshooting

### Common Issues

#### 1. No log files created
- **Check**: File logging enabled in config
- **Check**: Permissions on log directory
- **Check**: Available disk space

#### 2. Logs not appearing in development
- **Solution**: Ensure `enableFile: true` in development config
- **Solution**: Check console for initialization errors

#### 3. Large log files
- **Solution**: Logs rotate automatically at configured size
- **Solution**: Adjust `maxSize` in configuration if needed

#### 4. Permission errors in production
- **Solution**: Ensure log directory has write permissions
- **Solution**: Create log directory with proper ownership

### Debug Logger Initialization

```typescript
import { logger } from '@/lib/logger';

// Check if logger is ready
if (logger.isReady()) {
  console.log('Logger is initialized');
} else {
  // Wait for initialization
  await logger.waitForInitialization();
  console.log('Logger initialization complete');
}
```

## Configuration

All logging configuration is centralized in `src/config/logging-config.ts`:

```typescript
export const loggingConfig = {
  development: {
    level: "debug",
    enableConsole: true,
    enableFile: true,
    enablePretty: true,
    file: {
      logDir: "./logs",
      filename: "app-%DATE%.log",
      maxSize: "10M",
      maxFiles: 14,
      datePattern: "YYYY-MM-DD",
      compress: true,
      cleanupOlderThan: "30d",
    }
  }
  // ... other environments
};
```

## Integration Points

### Automatic Integration

The logging system automatically integrates with:

- ✅ **API Client**: All HTTP requests/responses
- ✅ **Error Boundaries**: React component errors
- ✅ **React Query**: Query/mutation errors
- ✅ **Form Validation**: Validation errors
- ✅ **Cache Operations**: Cache warming/clearing

### Manual Integration

Add logging to new features:

```typescript
// In components
import { logger } from '@/lib/logger';

function MyComponent() {
  const handleClick = () => {
    logger.logUI('Button clicked', { 
      component: 'MyComponent',
      action: 'submit' 
    });
  };
}

// In API routes
export async function POST(request: Request) {
  logger.info('API endpoint called', { endpoint: '/api/my-endpoint' });
  // ... implementation
}

// In utilities
export function processData(data: any[]) {
  const timer = logger.startTimer('data-processing');
  
  // ... processing logic
  
  timer({ recordsProcessed: data.length });
}
```

This logging system provides comprehensive observability for your application with minimal configuration and maximum utility! 🚀