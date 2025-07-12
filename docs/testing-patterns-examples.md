# Testing Patterns and Examples

This document provides concrete examples of testing patterns used throughout the UI Miniverse Agentics application. Use these patterns as templates for writing new tests.

## Table of Contents

- [Component Testing Patterns](#component-testing-patterns)
- [API Hook Testing Patterns](#api-hook-testing-patterns)
- [Form Testing Patterns](#form-testing-patterns)
- [Integration Testing Patterns](#integration-testing-patterns)
- [Error Handling Patterns](#error-handling-patterns)
- [Performance Testing Patterns](#performance-testing-patterns)

## Component Testing Patterns

### Basic Component Rendering

```typescript
// Basic component test template
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('should render with default props', () => {
    render(<ComponentName />);
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('should render with custom props', () => {
    const customProps = { title: 'Custom Title', disabled: true };
    render(<ComponentName {...customProps} />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Interactive Component Testing

```typescript
// Component with user interactions
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentCard } from '../DocumentCard';

describe('DocumentCard', () => {
  const mockDocument = {
    id: 'doc-1',
    name: 'Test Document.pdf',
    size: 1024000,
    status: 'completed',
    createdAt: '2024-01-01T00:00:00Z'
  };

  it('should handle selection toggle', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    
    render(
      <DocumentCard 
        document={mockDocument}
        isSelected={false}
        onSelect={onSelect}
      />
    );
    
    const checkbox = screen.getByLabelText(/select/i);
    expect(checkbox).not.toBeChecked();
    
    await user.click(checkbox);
    expect(onSelect).toHaveBeenCalledWith('doc-1', true);
  });
  
  it('should show context menu on right click', async () => {
    const user = userEvent.setup();
    render(<DocumentCard document={mockDocument} />);
    
    const card = screen.getByTestId('document-card');
    await user.pointer({ keys: '[MouseRight]', target: card });
    
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
  });
});
```

### Component with Loading States

```typescript
// Testing loading and error states
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DocumentList } from '../DocumentList';

describe('DocumentList', () => {
  it('should show loading state initially', () => {
    render(<DocumentList loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/loading documents/i)).toBeInTheDocument();
  });
  
  it('should show empty state when no documents', () => {
    render(<DocumentList documents={[]} loading={false} />);
    
    expect(screen.getByText(/no documents found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload first document/i })).toBeInTheDocument();
  });
  
  it('should render document list when data is available', () => {
    const documents = [
      { id: '1', name: 'Doc 1.pdf' },
      { id: '2', name: 'Doc 2.pdf' }
    ];
    
    render(<DocumentList documents={documents} loading={false} />);
    
    expect(screen.getByText('Doc 1.pdf')).toBeInTheDocument();
    expect(screen.getByText('Doc 2.pdf')).toBeInTheDocument();
    expect(screen.getAllByTestId('document-card')).toHaveLength(2);
  });
});
```

## API Hook Testing Patterns

### Basic Hook Testing

```typescript
// API hook test template
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { createTestWrapper } from '../../test/utils/test-utils';
import { useDocuments } from '../useDocuments';

describe('useDocuments', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('should fetch documents successfully', async () => {
    const mockDocuments = [
      { id: '1', name: 'Doc 1.pdf' },
      { id: '2', name: 'Doc 2.pdf' }
    ];

    server.use(
      http.get('/api/documents', () => {
        return HttpResponse.json({
          data: mockDocuments,
          pagination: { page: 1, total: 2 }
        });
      })
    );

    const { result } = renderHook(() => useDocuments(), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data?.data).toEqual(mockDocuments);
  });
  
  it('should handle API errors', async () => {
    server.use(
      http.get('/api/documents', () => {
        return HttpResponse.json(
          { error: 'Server Error' },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useDocuments(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });
});
```

### Mutation Hook Testing

```typescript
// Testing mutation hooks
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUploadDocument } from '../useDocuments';

describe('useUploadDocument', () => {
  it('should upload document successfully', async () => {
    server.use(
      http.post('/api/documents/upload', () => {
        return HttpResponse.json(
          { 
            document: { id: 'new-doc', name: 'uploaded.pdf' },
            message: 'Upload successful' 
          },
          { status: 201 }
        );
      })
    );

    const { result } = renderHook(() => useUploadDocument(), {
      wrapper: createTestWrapper(),
    });

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    result.current.mutate({ file });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.document.name).toBe('uploaded.pdf');
  });
  
  it('should handle upload errors', async () => {
    server.use(
      http.post('/api/documents/upload', () => {
        return HttpResponse.json(
          { error: 'File too large' },
          { status: 413 }
        );
      })
    );

    const { result } = renderHook(() => useUploadDocument(), {
      wrapper: createTestWrapper(),
    });

    const file = new File(['content'], 'huge-file.pdf', { type: 'application/pdf' });
    
    result.current.mutate({ file });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
  });
});
```

### Hook with Parameters Testing

```typescript
// Testing hooks with dynamic parameters
describe('useDocumentSearch', () => {
  it('should not fetch when query is empty', () => {
    const { result } = renderHook(
      () => useDocumentSearch({ query: '', searchFields: ['name'] }),
      { wrapper: createTestWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });
  
  it('should search when query is provided', async () => {
    server.use(
      http.get('/api/documents/search', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('query');
        expect(query).toBe('test document');
        
        return HttpResponse.json({
          documents: [{ id: '1', name: 'test document.pdf' }],
          total: 1
        });
      })
    );

    const { result } = renderHook(
      () => useDocumentSearch({ 
        query: 'test document', 
        searchFields: ['name', 'content'] 
      }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.documents).toHaveLength(1);
    expect(result.current.data?.documents[0].name).toBe('test document.pdf');
  });
});
```

## Form Testing Patterns

### Basic Form Testing

```typescript
// Form component test template
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateCollectionForm } from '../CreateCollectionForm';

describe('CreateCollectionForm', () => {
  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    render(<CreateCollectionForm onSubmit={onSubmit} />);
    
    // Fill out form
    await user.type(screen.getByLabelText(/name/i), 'New Collection');
    await user.type(screen.getByLabelText(/description/i), 'Collection description');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'New Collection',
        description: 'Collection description'
      });
    });
  });
  
  it('should show validation errors for invalid data', async () => {
    const user = userEvent.setup();
    render(<CreateCollectionForm />);
    
    // Submit without filling required fields
    await user.click(screen.getByRole('button', { name: /create/i }));
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });
  
  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<CreateCollectionForm onSubmit={onSubmit} />);
    
    await user.type(screen.getByLabelText(/name/i), 'Test Collection');
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating/i)).toBeInTheDocument();
  });
});
```

### Form Validation Testing

```typescript
// Testing form validation patterns
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentUploadForm } from '../DocumentUploadForm';

describe('DocumentUploadForm Validation', () => {
  it('should validate file type', async () => {
    const user = userEvent.setup();
    render(<DocumentUploadForm />);
    
    const fileInput = screen.getByLabelText(/select files/i);
    const invalidFile = new File(
      ['content'], 
      'script.js', 
      { type: 'application/javascript' }
    );
    
    await user.upload(fileInput, invalidFile);
    
    expect(screen.getByText(/file type not supported/i)).toBeInTheDocument();
  });
  
  it('should validate file size', async () => {
    const user = userEvent.setup();
    render(<DocumentUploadForm />);
    
    const fileInput = screen.getByLabelText(/select files/i);
    const largeFile = new File(
      [new ArrayBuffer(15 * 1024 * 1024)], // 15MB
      'large-file.pdf',
      { type: 'application/pdf' }
    );
    
    await user.upload(fileInput, largeFile);
    
    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
  });
  
  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<DocumentUploadForm />);
    
    // Upload valid file but don't fill required fields
    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/select files/i), validFile);
    
    // Try to submit without required collection
    await user.click(screen.getByRole('button', { name: /upload/i }));
    
    expect(screen.getByText(/please select a collection/i)).toBeInTheDocument();
  });
});
```

### Complex Form Testing

```typescript
// Multi-step form testing
describe('MultiStepDocumentForm', () => {
  it('should complete multi-step workflow', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    
    render(<MultiStepDocumentForm onComplete={onComplete} />);
    
    // Step 1: File Selection
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
    
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/select files/i), file);
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 2: Metadata
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    
    await user.type(screen.getByLabelText(/title/i), 'Document Title');
    await user.type(screen.getByLabelText(/description/i), 'Document description');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 3: Collection Assignment
    expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    
    await user.click(screen.getByLabelText(/test collection/i));
    await user.click(screen.getByRole('button', { name: /upload/i }));
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({
        file,
        title: 'Document Title',
        description: 'Document description',
        collectionId: 'test-collection-id'
      });
    });
  });
  
  it('should allow going back to previous steps', async () => {
    const user = userEvent.setup();
    render(<MultiStepDocumentForm />);
    
    // Go to step 2
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/select files/i), file);
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Go back to step 1
    await user.click(screen.getByRole('button', { name: /back/i }));
    
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('test.pdf')).toBeInTheDocument();
  });
});
```

## Integration Testing Patterns

### End-to-End Workflow Testing

```typescript
// Complete user workflow test
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentManagement } from '../DocumentManagement';

describe('Document Management Workflow', () => {
  it('should complete full document lifecycle', async () => {
    const user = userEvent.setup();
    
    // Setup API mocks
    server.use(
      // Initially empty
      http.get('/api/documents', () => {
        return HttpResponse.json({ data: [], pagination: { total: 0 } });
      }),
      
      // Upload endpoint
      http.post('/api/documents/upload', () => {
        return HttpResponse.json({
          document: { id: 'new-doc', name: 'test.pdf', status: 'processing' }
        });
      }),
      
      // Updated list after upload
      http.get('/api/documents', () => {
        return HttpResponse.json({
          data: [{ id: 'new-doc', name: 'test.pdf', status: 'completed' }],
          pagination: { total: 1 }
        });
      }, { once: true })
    );
    
    render(<DocumentManagement />);
    
    // 1. Verify empty state
    expect(screen.getByText(/no documents found/i)).toBeInTheDocument();
    
    // 2. Upload document
    await user.click(screen.getByText(/upload/i));
    
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload/i);
    await user.upload(fileInput, file);
    
    await user.click(screen.getByRole('button', { name: /upload all/i }));
    
    // 3. Verify upload success
    await waitFor(() => {
      expect(screen.getByText(/upload completed/i)).toBeInTheDocument();
    });
    
    // 4. Verify document appears in list
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
    
    // 5. Search for document
    const searchInput = screen.getByPlaceholderText(/search documents/i);
    await user.type(searchInput, 'test');
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
    
    // 6. Select and delete document
    await user.click(screen.getByLabelText(/select.*test\.pdf/i));
    await user.click(screen.getByRole('button', { name: /delete \(1\)/i }));
    
    // 7. Verify document is deleted
    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument();
    });
  });
});
```

### Component Integration Testing

```typescript
// Testing component integration
describe('DocumentList Integration', () => {
  it('should integrate with search and filters', async () => {
    const user = userEvent.setup();
    
    const documents = [
      { id: '1', name: 'Report.pdf', type: 'application/pdf', status: 'completed' },
      { id: '2', name: 'Image.png', type: 'image/png', status: 'processing' },
      { id: '3', name: 'Spreadsheet.xlsx', type: 'application/vnd.ms-excel', status: 'completed' }
    ];
    
    server.use(
      http.get('/api/documents', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('query');
        const status = url.searchParams.get('status');
        
        let filtered = documents;
        
        if (query) {
          filtered = filtered.filter(doc => 
            doc.name.toLowerCase().includes(query.toLowerCase())
          );
        }
        
        if (status) {
          filtered = filtered.filter(doc => doc.status === status);
        }
        
        return HttpResponse.json({
          data: filtered,
          pagination: { total: filtered.length }
        });
      })
    );
    
    render(<DocumentListWithFilters />);
    
    // Initially shows all documents
    await waitFor(() => {
      expect(screen.getAllByTestId('document-card')).toHaveLength(3);
    });
    
    // Apply search filter
    await user.type(screen.getByPlaceholderText(/search/i), 'report');
    
    await waitFor(() => {
      expect(screen.getAllByTestId('document-card')).toHaveLength(1);
      expect(screen.getByText('Report.pdf')).toBeInTheDocument();
    });
    
    // Clear search and apply status filter
    await user.clear(screen.getByPlaceholderText(/search/i));
    await user.selectOptions(screen.getByLabelText(/status/i), 'completed');
    
    await waitFor(() => {
      expect(screen.getAllByTestId('document-card')).toHaveLength(2);
      expect(screen.getByText('Report.pdf')).toBeInTheDocument();
      expect(screen.getByText('Spreadsheet.xlsx')).toBeInTheDocument();
      expect(screen.queryByText('Image.png')).not.toBeInTheDocument();
    });
  });
});
```

## Error Handling Patterns

### Network Error Testing

```typescript
// Testing network error scenarios
describe('Network Error Handling', () => {
  it('should show error message when API fails', async () => {
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
  
  it('should retry after network error', async () => {
    const user = userEvent.setup();
    let attemptCount = 0;
    
    server.use(
      http.get('/api/documents', () => {
        attemptCount++;
        if (attemptCount === 1) {
          return HttpResponse.error();
        }
        return HttpResponse.json({ data: mockDocuments });
      })
    );
    
    render(<DocumentList />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/error loading/i)).toBeInTheDocument();
    });
    
    // Click retry
    await user.click(screen.getByRole('button', { name: /try again/i }));
    
    // Verify successful retry
    await waitFor(() => {
      expect(screen.queryByText(/error loading/i)).not.toBeInTheDocument();
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
    
    expect(attemptCount).toBe(2);
  });
});
```

### Validation Error Testing

```typescript
// Testing validation error display
describe('Validation Error Handling', () => {
  it('should display field-specific errors', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('/api/collections', () => {
        return HttpResponse.json({
          errors: {
            name: 'Name already exists',
            description: 'Description too long'
          }
        }, { status: 400 });
      })
    );
    
    render(<CreateCollectionForm />);
    
    await user.type(screen.getByLabelText(/name/i), 'Existing Name');
    await user.type(screen.getByLabelText(/description/i), 'A'.repeat(501));
    await user.click(screen.getByRole('button', { name: /create/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Name already exists')).toBeInTheDocument();
      expect(screen.getByText('Description too long')).toBeInTheDocument();
    });
  });
  
  it('should clear errors when user fixes input', async () => {
    const user = userEvent.setup();
    render(<CreateCollectionForm />);
    
    // Trigger validation error
    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    
    // Fix the error
    await user.type(screen.getByLabelText(/name/i), 'Valid Name');
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });
  });
});
```

## Performance Testing Patterns

### Loading State Testing

```typescript
// Testing loading states and performance
describe('Performance and Loading States', () => {
  it('should show loading state during slow API calls', async () => {
    server.use(
      http.get('/api/documents', async () => {
        // Simulate slow response
        await new Promise(resolve => setTimeout(resolve, 1000));
        return HttpResponse.json({ data: mockDocuments });
      })
    );
    
    render(<DocumentList />);
    
    // Should show loading immediately
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/loading documents/i)).toBeInTheDocument();
    
    // Should hide loading after data loads
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(screen.getByText('Test Document')).toBeInTheDocument();
  });
  
  it('should handle rapid state changes', async () => {
    const user = userEvent.setup();
    render(<DocumentFilter />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Rapid typing should debounce
    await user.type(searchInput, 'test document query');
    
    // Should only make one API call after debounce
    await waitFor(() => {
      expect(screen.getByText('1 result')).toBeInTheDocument();
    });
  });
});
```

### Memory Leak Testing

```typescript
// Testing for memory leaks and cleanup
describe('Memory Management', () => {
  it('should cleanup subscriptions on unmount', () => {
    const cleanup = vi.fn();
    
    const TestComponent = () => {
      useEffect(() => {
        const subscription = someService.subscribe();
        return () => {
          cleanup();
          subscription.unsubscribe();
        };
      }, []);
      
      return <div>Test Component</div>;
    };
    
    const { unmount } = render(<TestComponent />);
    
    unmount();
    
    expect(cleanup).toHaveBeenCalled();
  });
  
  it('should cancel pending requests on unmount', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    
    const { unmount } = render(<DocumentList />);
    
    // Unmount before request completes
    unmount();
    
    expect(abortSpy).toHaveBeenCalled();
  });
});
```

These patterns provide a comprehensive foundation for testing all aspects of the UI Miniverse Agentics application. Use them as starting points and adapt them to your specific component and feature requirements.