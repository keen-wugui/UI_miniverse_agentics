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