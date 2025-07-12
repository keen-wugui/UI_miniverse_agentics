# Testing Best Practices Guide

This document outlines the best practices for writing and maintaining tests in the UI Miniverse Agentics application.

## Table of Contents

- [Writing Effective Tests](#writing-effective-tests)
- [Test Organization](#test-organization)
- [Mock Management](#mock-management)
- [Performance Considerations](#performance-considerations)
- [Common Pitfalls](#common-pitfalls)
- [Code Review Guidelines](#code-review-guidelines)

## Writing Effective Tests

### Test What Users Care About

✅ **Good**: Test user workflows and outcomes
```typescript
test('should allow user to upload and search for documents', async () => {
  const user = userEvent.setup();
  render(<DocumentManagement />);
  
  // Upload document
  await user.click(screen.getByText('Upload'));
  const file = new File(['content'], 'my-document.pdf', { type: 'application/pdf' });
  const input = screen.getByLabelText(/upload/i);
  await user.upload(input, file);
  await user.click(screen.getByText('Upload All'));
  
  // Search for uploaded document
  const searchInput = screen.getByPlaceholderText('Search documents...');
  await user.type(searchInput, 'my-document');
  
  await waitFor(() => {
    expect(screen.getByText('my-document.pdf')).toBeInTheDocument();
  });
});
```

❌ **Avoid**: Testing implementation details
```typescript
test('should call uploadDocument when form is submitted', () => {
  const uploadDocument = vi.fn();
  render(<UploadForm uploadDocument={uploadDocument} />);
  
  fireEvent.submit(screen.getByRole('form'));
  expect(uploadDocument).toHaveBeenCalled();
});
```

### Use Descriptive Test Names

✅ **Good**: Clear, descriptive test names
```typescript
describe('DocumentUpload', () => {
  it('should display error message when file exceeds size limit', () => {});
  it('should show progress bar during upload process', () => {});
  it('should disable upload button when no files selected', () => {});
});
```

❌ **Avoid**: Vague or technical test names
```typescript
describe('DocumentUpload', () => {
  it('should work', () => {});
  it('should call onSubmit', () => {});
  it('should render correctly', () => {});
});
```

### Follow the AAA Pattern

Structure tests with **Arrange**, **Act**, **Assert**:

```typescript
test('should create collection with valid data', async () => {
  // Arrange
  const user = userEvent.setup();
  const onSuccess = vi.fn();
  render(<CreateCollectionForm onSuccess={onSuccess} />);
  
  // Act
  await user.type(screen.getByLabelText(/name/i), 'New Collection');
  await user.type(screen.getByLabelText(/description/i), 'Collection description');
  await user.click(screen.getByRole('button', { name: /create/i }));
  
  // Assert
  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Collection',
        description: 'Collection description'
      })
    );
  });
});
```

### Test Edge Cases and Error Scenarios

```typescript
describe('DocumentCard', () => {
  it('should handle missing document data gracefully', () => {
    render(<DocumentCard document={null} />);
    expect(screen.getByText(/no document/i)).toBeInTheDocument();
  });
  
  it('should display processing status for documents being processed', () => {
    const processingDoc = { ...mockDocument, status: 'processing' };
    render(<DocumentCard document={processingDoc} />);
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });
  
  it('should show error state when document fails to load', () => {
    const errorDoc = { ...mockDocument, status: 'error', errorMessage: 'Failed to process' };
    render(<DocumentCard document={errorDoc} />);
    expect(screen.getByText(/failed to process/i)).toBeInTheDocument();
  });
});
```

## Test Organization

### File Structure

Organize tests to mirror your source code structure:

```
src/
├── components/
│   ├── documents/
│   │   ├── DocumentCard.tsx
│   │   ├── DocumentUpload.tsx
│   │   └── __tests__/
│   │       ├── DocumentCard.test.tsx
│   │       └── DocumentUpload.test.tsx
│   └── collections/
│       ├── CollectionForm.tsx
│       └── __tests__/
│           └── CollectionForm.test.tsx
├── hooks/
│   ├── api/
│   │   ├── useDocuments.ts
│   │   └── __tests__/
│   │       └── useDocuments.test.tsx
└── test/
    ├── __tests__/
    │   └── integration/
    │       └── document-workflow.test.tsx
    ├── utils/
    │   ├── test-utils.tsx
    │   └── mock-data.ts
    └── mocks/
        ├── handlers.ts
        └── server.ts
```

### Group Related Tests

```typescript
describe('DocumentManagement', () => {
  describe('Initial Rendering', () => {
    it('should display empty state when no documents exist', () => {});
    it('should show loading spinner while fetching documents', () => {});
  });
  
  describe('Document Operations', () => {
    it('should allow selecting multiple documents', () => {});
    it('should enable bulk delete when documents are selected', () => {});
  });
  
  describe('Search and Filtering', () => {
    it('should filter documents based on search query', () => {});
    it('should combine search with status filters', () => {});
  });
  
  describe('Error Handling', () => {
    it('should display error message when API fails', () => {});
    it('should allow retry after error', () => {});
  });
});
```

### Setup and Teardown

Use consistent setup and teardown patterns:

```typescript
describe('ComponentWithAPI', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset MSW handlers
    server.resetHandlers();
    
    // Setup default API responses
    server.use(
      http.get('/api/documents', () => {
        return HttpResponse.json({ data: mockDocuments });
      })
    );
  });
  
  afterEach(() => {
    // Clean up DOM
    cleanup();
    
    // Clear timers
    vi.clearAllTimers();
  });
});
```

## Mock Management

### Create Reusable Mock Data

```typescript
// test/utils/mock-data.ts
export const createMockDocument = (overrides = {}) => ({
  id: 'doc-1',
  name: 'Test Document.pdf',
  filename: 'test-document.pdf',
  size: 1024000,
  type: 'application/pdf',
  status: 'completed',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  extractedText: 'Sample extracted text...',
  metadata: {},
  tags: [],
  collections: [],
  ...overrides
});

export const createMockCollection = (overrides = {}) => ({
  id: 'collection-1',
  name: 'Test Collection',
  description: 'A test collection',
  documentCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  tags: [],
  metadata: {},
  ...overrides
});

// Usage in tests
const processingDoc = createMockDocument({ status: 'processing' });
const largeDoc = createMockDocument({ size: 50 * 1024 * 1024 });
```

### MSW Handler Best Practices

```typescript
// test/mocks/handlers.ts
export const handlers = [
  // Use realistic response data
  http.get('/api/documents', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const query = url.searchParams.get('query');
    
    let documents = mockDocuments;
    
    // Apply filters like real API
    if (query) {
      documents = documents.filter(doc =>
        doc.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Return paginated response
    return HttpResponse.json({
      data: documents.slice((page - 1) * 20, page * 20),
      pagination: {
        page,
        limit: 20,
        total: documents.length,
        totalPages: Math.ceil(documents.length / 20),
        hasNext: page * 20 < documents.length,
        hasPrev: page > 1
      }
    });
  }),
  
  // Handle different HTTP methods
  http.post('/api/documents/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Validate request
    if (!file || file.size === 0) {
      return HttpResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }
    
    // Return realistic response
    return HttpResponse.json(
      {
        document: createMockDocument({
          name: file.name,
          filename: file.name,
          size: file.size,
          type: file.type
        }),
        message: 'Document uploaded successfully'
      },
      { status: 201 }
    );
  })
];
```

### Mock External Dependencies

```typescript
// Mock heavy dependencies
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => children,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
}));

// Mock date functions for consistent tests
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => '2024-01-01 10:00:00'),
  parseISO: vi.fn((dateStr) => new Date('2024-01-01T10:00:00Z')),
}));
```

## Performance Considerations

### Optimize Test Performance

```typescript
// Use fake timers for time-dependent tests
describe('AutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should auto-save after 5 seconds of inactivity', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<EditableForm />);
    
    await user.type(screen.getByLabelText(/content/i), 'New content');
    
    // Fast-forward time instead of waiting
    vi.advanceTimersByTime(5000);
    
    expect(screen.getByText(/auto-saved/i)).toBeInTheDocument();
  });
});
```

### Minimize Test Overhead

```typescript
// Create lightweight test wrappers
const createLightTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Reuse test setup
const renderWithProviders = (component: React.ReactElement) => {
  return render(component, { wrapper: createLightTestWrapper() });
};
```

### Parallel Test Execution

```typescript
// Ensure tests can run in parallel
describe.concurrent('Independent Tests', () => {
  it('should test feature A', async () => {
    // Test that doesn't depend on shared state
  });
  
  it('should test feature B', async () => {
    // Another independent test
  });
});
```

## Common Pitfalls

### Avoid These Anti-Patterns

#### 1. Testing Implementation Details
```typescript
// ❌ Don't test internal state or methods
test('should set loading state to true', () => {
  const { getByTestId } = render(<Component />);
  expect(getByTestId('loading-state').textContent).toBe('true');
});

// ✅ Test user-visible behavior
test('should show loading spinner while fetching data', () => {
  render(<Component />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

#### 2. Overly Complex Setup
```typescript
// ❌ Don't create overly complex test setup
beforeEach(async () => {
  await setupDatabase();
  await seedTestData();
  await configureAuth();
  await setupWebSockets();
  // ... 50 lines of setup
});

// ✅ Use simple, focused setup
beforeEach(() => {
  server.use(
    http.get('/api/data', () => HttpResponse.json(mockData))
  );
});
```

#### 3. Brittle Selectors
```typescript
// ❌ Don't use fragile selectors
screen.getByTestId('button-component-wrapper-container-div');
wrapper.find('.css-abc123 > div:nth-child(2)');

// ✅ Use semantic selectors
screen.getByRole('button', { name: /save/i });
screen.getByLabelText(/email address/i);
```

#### 4. Shared State Between Tests
```typescript
// ❌ Don't share mutable state
let globalUser = { id: 1, name: 'Test' };

test('should update user', () => {
  globalUser.name = 'Updated';
  // This affects other tests!
});

// ✅ Create fresh state for each test
test('should update user', () => {
  const user = createMockUser({ id: 1, name: 'Test' });
  // Each test gets its own data
});
```

### Debug Failing Tests

```typescript
// Add debugging utilities
test('failing test debug example', async () => {
  render(<Component />);
  
  // See what's actually rendered
  screen.debug();
  
  // Get query suggestions
  screen.logTestingPlaygroundURL();
  
  // Check for elements that might be there
  console.log('Available roles:', screen.getAllByRole('button'));
  
  // Add delays to see user interactions
  const user = userEvent.setup({ delay: 100 });
  await user.click(screen.getByRole('button'));
});
```

## Code Review Guidelines

### Test Review Checklist

When reviewing test code, check for:

#### ✅ Good Test Practices
- [ ] Tests describe user behavior, not implementation
- [ ] Test names clearly explain what is being tested
- [ ] Tests are isolated and don't depend on other tests
- [ ] Edge cases and error scenarios are covered
- [ ] Async operations use proper `waitFor` patterns
- [ ] Mocks are realistic and necessary

#### ❌ Red Flags
- [ ] Tests access component internal state
- [ ] Hard-coded delays or timeouts
- [ ] Tests that require running in specific order
- [ ] Overly complex mock setup
- [ ] Tests that don't actually assert anything meaningful

### Review Comments Examples

```typescript
// 👍 Good feedback
"Consider testing the user workflow instead of the component method"
"This test might be flaky due to timing - consider using waitFor"
"Great edge case coverage! This will catch real user issues"

// 👎 Avoid
"Add more tests"
"This test is wrong"
"Use different syntax"
```

### Integration Test Standards

For integration tests, ensure:

1. **Complete Workflows**: Test end-to-end user journeys
2. **Error Recovery**: Test how users recover from errors
3. **Performance**: Verify acceptable loading times
4. **Accessibility**: Ensure keyboard navigation works

```typescript
// Example integration test standard
test('complete document management workflow', async () => {
  const user = userEvent.setup();
  
  // 1. Initial state
  render(<DocumentManagement />);
  expect(screen.getByText(/no documents/i)).toBeInTheDocument();
  
  // 2. Upload document
  await user.click(screen.getByText('Upload'));
  // ... upload workflow
  
  // 3. Search for document
  await user.type(screen.getByPlaceholderText('Search...'), 'test');
  // ... search workflow
  
  // 4. Select and delete
  await user.click(screen.getByLabelText(/select/i));
  await user.click(screen.getByText('Delete'));
  // ... delete workflow
  
  // 5. Verify final state
  expect(screen.getByText(/no documents/i)).toBeInTheDocument();
});
```

This comprehensive guide ensures that all team members write consistent, reliable, and maintainable tests that provide real value in catching bugs and ensuring application quality.