import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a new QueryClient for each test to ensure test isolation
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

// Test wrapper component that provides QueryClient context
const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  queryClient = createTestQueryClient(),
}) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Custom render function that includes QueryClient provider
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export const customRender = (
  ui: ReactElement,
  { queryClient, ...renderOptions }: CustomRenderOptions = {}
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from React Testing Library
export * from "@testing-library/react";

// Override the default render with our custom render
export { customRender as render };

// Test utilities for common patterns
export const waitForQueryToLoad = async (
  queryClient: QueryClient,
  queryKey: any[]
) => {
  await queryClient.ensureQueryData({
    queryKey,
    queryFn: () => Promise.resolve({}),
  });
};

export const invalidateQueries = (
  queryClient: QueryClient,
  queryKey?: any[]
) => {
  return queryClient.invalidateQueries({ queryKey });
};

export const clearAllQueries = (queryClient: QueryClient) => {
  queryClient.clear();
};
