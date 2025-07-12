# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Agentic Workflow Dashboard built with Next.js 15 (App Router), providing a web-based management interface for business-specific RAG (Retrieval-Augmented Generation) workflows.

## Essential Commands

### Development
```bash
pnpm dev          # Start development server on http://localhost:3000
pnpm build        # Build for production
pnpm start        # Start production server
```

### Code Quality
```bash
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript type checking
pnpm format       # Format code with Prettier
```

### Testing
```bash
pnpm test         # Run tests with Vitest
pnpm test:ui      # Run tests with interactive UI
pnpm test:coverage # Generate coverage report
```

### Package Management
**IMPORTANT**: This project uses pnpm exclusively. npm/yarn/bun are blocked.
```bash
pnpm install      # Install dependencies
pnpm add <pkg>    # Add new dependency
pnpm add -D <pkg> # Add dev dependency
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router (React Server Components)
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query v5 for server state
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + React Testing Library + MSW for mocking

### Key Architectural Patterns

1. **API Layer**: 
   - All API calls go through `/src/lib/api-client.ts`
   - Hooks in `/src/hooks/api/` use React Query for data fetching
   - Mock handlers in `/src/test/mocks/handlers/` for development/testing

2. **Component Structure**:
   - Base UI components in `/src/components/ui/` (shadcn/ui)
   - Feature components organized by domain (documents/, collections/, etc.)
   - Layout components in `/src/components/layout/`

3. **Error Handling**:
   - Global error boundaries with toast notifications
   - Form validation with Zod schemas
   - API error handling through custom error classes

4. **Routing**:
   - App Router pages in `/src/app/`
   - Each major feature has its own route (analytics, collections, documents, etc.)

### Important Implementation Details

1. **Form Handling**: Always use React Hook Form with Zod validation. Example pattern:
   ```typescript
   const form = useForm<FormData>({
     resolver: zodResolver(formSchema),
     defaultValues: { ... }
   });
   ```

2. **API Integration**: Use the custom hooks in `/src/hooks/api/`. They handle loading states, errors, and caching automatically.

3. **UI Components**: Prefer shadcn/ui components. They're pre-styled and accessible.

4. **Testing**: MSW handlers mock API responses. Add new handlers in `/src/test/mocks/handlers/` for new features.

## Development Guidelines

1. **Type Safety**: TypeScript strict mode is enabled. Always provide proper types.

2. **Component Patterns**: 
   - Use Server Components by default
   - Add "use client" only when needed (forms, interactivity)
   - Keep components small and focused

3. **Styling**: Use Tailwind CSS classes. Custom styles go in component-specific CSS modules if needed.

4. **Data Fetching**: Use the React Query hooks for all data fetching. They provide caching, refetching, and error handling.

5. **File Naming**: 
   - Components: PascalCase (e.g., `DocumentList.tsx`)
   - Utilities: camelCase (e.g., `formatDate.ts`)
   - Types: PascalCase with `.types.ts` extension

## Common Tasks

### Adding a New Page
1. Create directory in `/src/app/` with `page.tsx`
2. Add navigation link in `/src/components/layout/Sidebar.tsx`
3. Create feature components in `/src/components/<feature>/`

### Adding API Integration
1. Define types in `/src/types/`
2. Create API hook in `/src/hooks/api/`
3. Add MSW handler in `/src/test/mocks/handlers/` for testing

### Working with Forms
1. Define Zod schema for validation
2. Use React Hook Form with zodResolver
3. Use shadcn/ui form components for consistent styling

## API Configuration

### REST API Backend
The application communicates with a REST API backend running on `http://localhost:8000`. All API requests are configured through `/src/config/api-config.json`.

### Available API Endpoints

#### Health Monitoring
- `GET /health` - Basic health check
- `GET /health/database` - Database connection status
- `GET /health/database/metrics` - Database performance metrics

#### Document Management
- `GET /documents` - List documents with pagination
- `POST /documents/upload` - Upload new documents
- `GET /documents/{id}` - Get document details
- `DELETE /documents/{id}` - Delete a document
- `GET /documents/search` - Search documents
- `POST /documents/{id}/extract` - Extract text from document

#### Collection Management
- `GET /collections` - List collections
- `POST /collections` - Create new collection
- `GET /collections/{id}` - Get collection details
- `PUT /collections/{id}` - Update collection
- `DELETE /collections/{id}` - Delete collection
- `GET /collections/{id}/documents` - Get documents in collection
- `POST /collections/{id}/documents/{docId}` - Add document to collection
- `DELETE /collections/{id}/documents/{docId}` - Remove document from collection

#### Workflow Management
- `GET /workflows` - List workflows
- `POST /workflows` - Create new workflow
- `GET /workflows/{id}` - Get workflow details
- `PUT /workflows/{id}` - Update workflow
- `DELETE /workflows/{id}` - Delete workflow
- `POST /workflows/{id}/execute` - Execute workflow
- `GET /workflows/{id}/executions` - Get workflow executions
- `GET /workflows/executions/{executionId}` - Get execution status
- `POST /workflows/executions/{executionId}/cancel` - Cancel execution

#### RAG (Retrieval-Augmented Generation)
- `GET /rag/config` - Get RAG configuration
- `PUT /rag/config` - Update RAG configuration
- `POST /rag/query` - Submit RAG query
- `POST /rag/chat` - Chat with RAG system
- `POST /rag/index` - Create new index
- `GET /rag/index/{indexId}/status` - Get indexing status
- `DELETE /rag/index/{indexId}` - Delete index
- `POST /rag/index/{indexId}/rebuild` - Rebuild index

#### Business Metrics
- `GET /business-metrics/summary` - Get metrics summary
- `GET /business-metrics/kpis` - Get KPIs
- `POST /business-metrics/kpis` - Create new KPI
- `PUT /business-metrics/kpis/{id}` - Update KPI
- `DELETE /business-metrics/kpis/{id}` - Delete KPI
- `GET /business-metrics/reports` - Generate reports
- `GET /business-metrics/export` - Export metrics data

### Development & Testing
- **Mock Service Worker (MSW)**: API responses are mocked during development using MSW
- **Bypass Configuration**: MSW is configured to bypass all localhost:3000 requests (Next.js static assets) and only intercept localhost:8000 API requests
- **Error Simulation**: Test endpoints available at `/test/error/{statusCode}` for testing error handling

## Testing Strategy

### Overview
This application uses a comprehensive testing strategy designed to ensure reliability, maintainability, and confidence in deployments. The testing stack includes Vitest, React Testing Library, and Mock Service Worker (MSW) for robust test coverage across all application layers.

### Testing Stack
- **Test Runner**: Vitest (fast, ESM-native alternative to Jest)
- **Component Testing**: React Testing Library with React 19 support
- **DOM Environment**: happy-dom (lightweight, fast DOM implementation)
- **API Mocking**: Mock Service Worker (MSW) v2 for intercepting network requests
- **Coverage**: V8 provider with comprehensive reporting
- **Utilities**: Custom test utilities for React Query integration

### Testing Categories

#### 1. Unit Tests
**Target**: Individual functions, utilities, and isolated components
**Location**: `src/**/__tests__/*.test.{ts,tsx}` or `src/**/*.test.{ts,tsx}`
**Patterns**:
- Pure functions and utilities
- Custom hooks (using `renderHook`)
- Component logic without integration
- Form validation schemas
- API client functions

**Example Structure**:
```typescript
// src/lib/__tests__/api-client.test.ts
describe('ApiClient', () => {
  describe('GET requests', () => {
    it('should handle successful responses', async () => {
      // Test implementation
    });
  });
});
```

#### 2. Integration Tests
**Target**: Component interactions with APIs, state management, and user workflows
**Location**: `src/**/__tests__/*.test.{ts,tsx}`
**Patterns**:
- Components with React Query hooks
- Form submissions with validation
- API interactions through MSW
- Multi-step user workflows
- Error handling scenarios

**Example Structure**:
```typescript
// src/hooks/api/__tests__/useHealth.test.tsx
describe('useHealth hooks', () => {
  it('should fetch health status successfully', async () => {
    // Mock API response with MSW
    // Render hook with QueryClient provider
    // Assert loading states and data
  });
});
```

#### 3. Component Tests
**Target**: React components with user interactions and rendering
**Location**: `src/components/**/__tests__/*.test.{ts,tsx}`
**Patterns**:
- User event simulation
- Accessibility testing
- Conditional rendering
- Props validation
- State changes

**Recommended Test Structure**:
```typescript
// src/components/documents/__tests__/DocumentCard.test.tsx
describe('DocumentCard', () => {
  it('should render document information correctly', () => {
    // Render with required props
    // Assert visible elements
  });
  
  it('should handle click events', async () => {
    // Render component
    // Simulate user interaction
    // Assert expected behavior
  });
});
```

#### 4. Page/Route Tests
**Target**: Full page components and routing behavior
**Location**: `src/app/**/__tests__/*.test.{ts,tsx}`
**Patterns**:
- Server component rendering
- Data loading states
- Error boundaries
- Navigation behavior

### Test Configuration

#### Coverage Requirements
- **Minimum Coverage**: 80% across all metrics (lines, functions, branches, statements)
- **Excluded Areas**:
  - `node_modules/`
  - `src/test/` (test utilities)
  - `**/*.d.ts` (type definitions)
  - `**/*.config.*` (configuration files)
  - `src/app/layout.tsx` and `src/app/page.tsx` (Next.js app structure)
  - `src/components/ui/` (shadcn/ui components - pre-tested)

#### Test Environment Setup
```typescript
// src/test/setup.ts includes:
- Jest-DOM matchers for enhanced assertions
- MSW server configuration for API mocking
- Global mocks for DOM APIs (matchMedia, ResizeObserver)
- React Testing Library cleanup
- Console method mocking for cleaner test output
```

### Testing Patterns and Best Practices

#### 1. API Testing with MSW
```typescript
// Mock API responses for consistent testing
server.use(
  http.get(`${baseUrl}/endpoint`, () => {
    return HttpResponse.json(mockData);
  })
);
```

#### 2. React Query Integration
```typescript
// Use custom test utilities for React Query
const { result } = renderHook(() => useCustomHook(), {
  wrapper: createTestWrapper(),
});
```

#### 3. Component Testing
```typescript
// Test user interactions and accessibility
import { render, screen, userEvent } from '../test/utils/test-utils';

test('should submit form with valid data', async () => {
  const user = userEvent.setup();
  render(<Component />);
  
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

#### 4. Error Handling Tests
```typescript
// Test error scenarios and recovery
server.use(
  http.get('/api/endpoint', () => {
    return HttpResponse.json(
      { error: 'Server Error' },
      { status: 500 }
    );
  })
);
```

### Writing New Tests

#### When to Write Tests
1. **Always**: New features, bug fixes, refactored code
2. **API Hooks**: Every new React Query hook
3. **Components**: User-facing components with interactions
4. **Utilities**: Pure functions and business logic
5. **Forms**: Validation logic and submission flows

#### Test File Organization
```
src/
├── components/
│   ├── documents/
│   │   ├── DocumentCard.tsx
│   │   └── __tests__/
│   │       └── DocumentCard.test.tsx
├── hooks/
│   ├── api/
│   │   ├── useDocuments.ts
│   │   └── __tests__/
│   │       └── useDocuments.test.tsx
└── lib/
    ├── utils.ts
    └── __tests__/
        └── utils.test.ts
```

#### Test Naming Conventions
- **Files**: `ComponentName.test.tsx` or `functionName.test.ts`
- **Describe blocks**: Use the component/function name
- **Test cases**: Describe behavior, start with "should"

#### Common Test Scenarios for This Application

1. **Document Management**:
   - File upload with validation
   - Document search and filtering
   - Preview functionality
   - Status updates

2. **Collection Management**:
   - Creating collections
   - Adding/removing documents
   - Collection metadata editing

3. **Health Monitoring**:
   - Real-time metrics display
   - Alert conditions
   - Performance charts

4. **Workflow Execution**:
   - Workflow creation and editing
   - Execution status tracking
   - Error handling

5. **RAG Queries**:
   - Query submission
   - Response formatting
   - Source citations

### Running Tests

#### Development Workflow
```bash
# Run tests in watch mode during development
pnpm test

# Run tests with UI for debugging
pnpm test:ui

# Run tests once (CI/CD)
pnpm test:run

# Generate coverage report
pnpm test:coverage
```

#### Test Performance
- **Target**: Tests should run in under 10 seconds for the full suite
- **Optimization**: Use `happy-dom` instead of `jsdom` for faster DOM operations
- **Parallelization**: Vitest runs tests in parallel by default

### Debugging Tests
1. **Test UI**: Use `pnpm test:ui` for interactive debugging
2. **Console Logging**: Use `console.log` in tests (mocked by default but can be enabled)
3. **MSW Debugging**: Enable request logging in MSW handlers
4. **Coverage Reports**: Check HTML coverage reports for missed test cases

### Integration with CI/CD
- Tests run automatically on every pull request
- Coverage reports are generated and checked against thresholds
- Failed tests block deployments
- Performance tests ensure acceptable response times

## Comprehensive Testing Strategy Documentation

### Testing Philosophy

Our testing strategy is built on the principle of **confidence through comprehensive coverage**. We focus on testing user behavior and business logic rather than implementation details, ensuring that our tests provide real value and catch actual issues that users might encounter.

#### Core Testing Principles

1. **User-Centric Testing**: Tests simulate real user interactions and workflows
2. **Integration Over Isolation**: Prefer integration tests that test multiple components working together
3. **Fail Fast**: Tests should fail quickly and provide clear error messages
4. **Maintainable Tests**: Tests should be easy to read, understand, and maintain
5. **Realistic Data**: Use realistic test data that mirrors production scenarios

### Test Architecture

```
src/
├── components/
│   └── __tests__/          # Component tests
├── hooks/
│   └── api/
│       └── __tests__/      # API hook tests
├── lib/
│   └── __tests__/          # Utility and service tests
├── test/
│   ├── __tests__/
│   │   └── integration/    # Integration tests
│   ├── mocks/              # MSW handlers and mocks
│   ├── utils/              # Test utilities
│   └── setup.ts            # Global test setup
└── app/
    └── __tests__/          # Page-level tests
```

### Testing Levels

#### 1. Unit Tests (20% of test suite)
**Purpose**: Test individual functions and isolated components
**Scope**: Pure functions, utilities, individual component methods
**Tools**: Vitest, basic React Testing Library

```typescript
// Example: Utility function test
describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
  });
});
```

#### 2. Component Tests (40% of test suite)
**Purpose**: Test individual components with user interactions
**Scope**: Component rendering, user events, state changes, props handling
**Tools**: React Testing Library, MSW, userEvent

```typescript
// Example: Component test
describe('DocumentCard', () => {
  it('should handle file selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    
    render(<DocumentCard document={mockDoc} onSelect={onSelect} />);
    
    await user.click(screen.getByLabelText(/select/i));
    expect(onSelect).toHaveBeenCalledWith(mockDoc.id, true);
  });
});
```

#### 3. Integration Tests (30% of test suite)
**Purpose**: Test complete user workflows and component interactions
**Scope**: End-to-end user scenarios, API integration, complex state management
**Tools**: Full React Testing Library setup, MSW, complete mock environment

```typescript
// Example: Integration test
describe('Document Upload Workflow', () => {
  it('should complete upload process', async () => {
    const user = userEvent.setup();
    render(<DocumentManagement />);
    
    // 1. Open upload dialog
    await user.click(screen.getByText('Upload'));
    
    // 2. Select file
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i);
    await user.upload(input, file);
    
    // 3. Complete upload
    await user.click(screen.getByText('Upload All'));
    
    // 4. Verify success
    await waitFor(() => {
      expect(screen.getByText(/upload completed/i)).toBeInTheDocument();
    });
  });
});
```

#### 4. API Tests (10% of test suite)
**Purpose**: Test API hooks and data layer
**Scope**: Data fetching, mutations, cache management, error handling
**Tools**: React Query testing utilities, MSW

```typescript
// Example: API hook test
describe('useDocuments', () => {
  it('should fetch and cache documents', async () => {
    server.use(
      http.get('/api/documents', () => {
        return HttpResponse.json({ data: mockDocuments });
      })
    );

    const { result } = renderHook(() => useDocuments(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockDocuments);
    });
  });
});
```

### Test Data Management

#### Mock Data Strategy
- **Realistic Data**: Use data that closely resembles production data
- **Consistent Fixtures**: Maintain consistent test data across test files
- **Data Builders**: Use factory functions for creating test data variants

```typescript
// Example: Test data factory
export const createMockDocument = (overrides = {}) => ({
  id: 'doc-1',
  name: 'Test Document.pdf',
  size: 1024000,
  type: 'application/pdf',
  status: 'completed',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Usage in tests
const processingDoc = createMockDocument({ status: 'processing' });
const largeDoc = createMockDocument({ size: 50 * 1024 * 1024 });
```

#### MSW (Mock Service Worker) Configuration
- **Request Interception**: Intercept and mock all API calls
- **Realistic Responses**: Return data that matches API contracts
- **Error Simulation**: Test error scenarios with proper HTTP status codes
- **Request Validation**: Verify request payloads and parameters

```typescript
// Example: MSW handler
export const handlers = [
  http.get('/api/documents', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    
    let documents = mockDocuments;
    if (query) {
      documents = documents.filter(doc => 
        doc.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return HttpResponse.json({
      data: documents,
      pagination: { page: 1, total: documents.length }
    });
  }),
];
```

### Component Testing Patterns

#### User Event Testing
```typescript
// ✅ Good: Test user interactions
test('should filter documents when searching', async () => {
  const user = userEvent.setup();
  render(<DocumentList />);
  
  const searchInput = screen.getByPlaceholderText('Search documents...');
  await user.type(searchInput, 'important');
  
  await waitFor(() => {
    expect(screen.getByText('Important Document')).toBeInTheDocument();
    expect(screen.queryByText('Other Document')).not.toBeInTheDocument();
  });
});

// ❌ Avoid: Testing implementation details
test('should call setSearchQuery when input changes', () => {
  const setSearchQuery = vi.fn();
  render(<SearchInput setSearchQuery={setSearchQuery} />);
  
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
  expect(setSearchQuery).toHaveBeenCalledWith('test');
});
```

#### Form Testing
```typescript
// ✅ Good: Test complete form workflow
test('should create collection with validation', async () => {
  const user = userEvent.setup();
  render(<CreateCollectionForm />);
  
  // Submit without required fields
  await user.click(screen.getByRole('button', { name: /create/i }));
  expect(screen.getByText('Name is required')).toBeInTheDocument();
  
  // Fill form and submit
  await user.type(screen.getByLabelText(/name/i), 'New Collection');
  await user.type(screen.getByLabelText(/description/i), 'Description');
  await user.click(screen.getByRole('button', { name: /create/i }));
  
  await waitFor(() => {
    expect(screen.getByText('Collection created successfully')).toBeInTheDocument();
  });
});
```

#### Accessibility Testing
```typescript
// Test keyboard navigation and screen reader compatibility
test('should be accessible via keyboard', async () => {
  const user = userEvent.setup();
  render(<DocumentCard document={mockDocument} />);
  
  // Tab to interactive elements
  await user.tab();
  expect(screen.getByRole('checkbox')).toHaveFocus();
  
  // Use keyboard to interact
  await user.keyboard('{Space}');
  expect(screen.getByRole('checkbox')).toBeChecked();
  
  // Verify ARIA labels
  expect(screen.getByLabelText(/select document/i)).toBeInTheDocument();
});
```

### Error Testing Patterns

#### Network Error Handling
```typescript
test('should handle network failures gracefully', async () => {
  server.use(
    http.get('/api/documents', () => {
      return HttpResponse.error();
    })
  );
  
  render(<DocumentList />);
  
  await waitFor(() => {
    expect(screen.getByText(/error loading documents/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
```

#### Validation Error Testing
```typescript
test('should display validation errors', async () => {
  const user = userEvent.setup();
  render(<UploadForm />);
  
  // Upload invalid file
  const invalidFile = new File(['content'], 'script.js', { 
    type: 'application/javascript' 
  });
  
  const input = screen.getByLabelText(/upload/i);
  await user.upload(input, invalidFile);
  
  expect(screen.getByText(/file type not supported/i)).toBeInTheDocument();
});
```

### Performance Testing

#### Loading States
```typescript
test('should show loading states during data fetch', async () => {
  // Delay the MSW response
  server.use(
    http.get('/api/documents', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return HttpResponse.json({ data: mockDocuments });
    })
  );
  
  render(<DocumentList />);
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});
```

#### Race Condition Testing
```typescript
test('should handle rapid user interactions', async () => {
  const user = userEvent.setup();
  render(<DocumentList />);
  
  // Rapid selection/deselection
  const checkbox = screen.getByLabelText(/select document/i);
  
  await user.click(checkbox);
  await user.click(checkbox);
  await user.click(checkbox);
  
  // Should end in consistent state
  expect(checkbox).toBeChecked();
});
```

### Test Organization and Maintenance

#### File Naming Conventions
- Test files: `ComponentName.test.tsx`
- Test utilities: `test-utils.ts`
- Mock data: `mock-data.ts`
- MSW handlers: `handlers.ts`

#### Test Structure
```typescript
describe('ComponentName', () => {
  // Group related tests
  describe('Rendering', () => {
    it('should render with default props', () => {});
    it('should render with custom props', () => {});
  });
  
  describe('User Interactions', () => {
    it('should handle click events', () => {});
    it('should handle keyboard events', () => {});
  });
  
  describe('Error States', () => {
    it('should handle loading errors', () => {});
    it('should handle validation errors', () => {});
  });
});
```

#### Setup and Teardown
```typescript
describe('DocumentManagement', () => {
  beforeEach(() => {
    // Reset mocks and server state
    vi.clearAllMocks();
    server.resetHandlers();
  });
  
  afterEach(() => {
    // Cleanup DOM and timers
    cleanup();
    vi.clearAllTimers();
  });
});
```

### Debugging Tests

#### Common Debugging Techniques
1. **Screen Debug**: Use `screen.debug()` to see current DOM
2. **Query Debugging**: Use `screen.logTestingPlaygroundURL()` for query suggestions
3. **User Event Debugging**: Add delays to see interactions
4. **MSW Debugging**: Enable request logging

```typescript
// Debug failing test
test('debug example', async () => {
  render(<Component />);
  
  // See current DOM state
  screen.debug();
  
  // See query suggestions
  screen.logTestingPlaygroundURL();
  
  // Add delay to see user interactions
  const user = userEvent.setup({ delay: 100 });
});
```

#### Test Isolation Issues
- **State Leakage**: Ensure tests don't share state
- **Timer Issues**: Clear timers and async operations
- **MSW Handler Conflicts**: Reset handlers between tests

### Continuous Integration

#### Pre-commit Hooks
```bash
# Run tests before commit
pnpm test:run

# Check coverage thresholds
pnpm test:coverage

# Lint test files
pnpm lint --ext .test.ts,.test.tsx
```

#### CI Pipeline
```yaml
# Example GitHub Actions
- name: Run Tests
  run: pnpm test:run
  
- name: Check Coverage
  run: pnpm test:coverage
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Coverage Goals and Metrics

#### Coverage Thresholds
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

#### Quality Metrics
- **Test Speed**: < 10 seconds for full suite
- **Test Reliability**: < 1% flaky test rate
- **Maintenance**: Tests updated with feature changes

#### Coverage Reports
- **HTML Reports**: Detailed coverage visualization
- **Console Reports**: Quick overview during development
- **CI Reports**: Automated coverage tracking

This comprehensive testing strategy ensures robust, maintainable, and effective testing for the entire application, providing confidence in deployments and feature development.