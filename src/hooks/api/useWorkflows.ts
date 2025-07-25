import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, buildUrl } from "@/lib/api-client";
import { apiConfig } from "@/lib/api-client";
import { handleApiError } from "@/lib/error-handling";
import {
  queryKeys,
  cacheStrategies,
  cacheInvalidation,
} from "@/lib/cache-config";
import type {
  WorkflowsResponse,
  Workflow,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ExecuteWorkflowRequest,
  WorkflowExecution,
  WorkflowExecutionsResponse,
  PaginationParams,
} from "@/types/api";

// Workflows list hook
export const useWorkflows = (params?: PaginationParams) => {
  const cacheConfig = cacheStrategies.workflows;

  return useQuery<WorkflowsResponse>({
    queryKey: queryKeys.workflows.list(params),
    queryFn: async (): Promise<WorkflowsResponse> => {
      try {
        const response = await apiClient.get<WorkflowsResponse>(
          apiConfig.endpoints.workflows.list,
          params
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Workflow detail hook
export const useWorkflow = (id: string, enabled: boolean = true) => {
  const cacheConfig = cacheStrategies.workflows;

  return useQuery<Workflow>({
    queryKey: queryKeys.workflows.detail(id),
    queryFn: async (): Promise<Workflow> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.workflows.detail,
          { id }
        );
        const response = await apiClient.get<Workflow>(url);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: enabled && !!id,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Workflow executions hook
export const useWorkflowExecutions = (
  workflowId: string,
  params?: PaginationParams,
  enabled: boolean = true
) => {
  const cacheConfig = cacheStrategies.workflows;

  return useQuery<WorkflowExecutionsResponse>({
    queryKey: queryKeys.workflows.executions.list(workflowId, params),
    queryFn: async (): Promise<WorkflowExecutionsResponse> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.workflows.executions,
          { id: workflowId }
        );
        const response = await apiClient.get<WorkflowExecutionsResponse>(
          url,
          params
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: enabled && !!workflowId,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Workflow execution status hook
export const useWorkflowExecutionStatus = (
  executionId: string,
  enabled: boolean = true
) => {
  const cacheConfig = cacheStrategies.workflows;

  return useQuery<WorkflowExecution>({
    queryKey: queryKeys.workflows.executions.detail("", executionId),
    queryFn: async (): Promise<WorkflowExecution> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.workflows.executionStatus,
          { executionId }
        );
        const response = await apiClient.get<WorkflowExecution>(url);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: enabled && !!executionId,
    // Shorter stale time for execution status to get real-time updates
    staleTime: 5000, // 5 seconds
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: (query) => {
      // Poll more frequently for running workflows
      const data = query.state.data;
      if (data?.status === "running" || data?.status === "pending") {
        return 2000; // Poll every 2 seconds
      }
      return false; // Don't poll for completed/failed workflows
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Create workflow mutation
export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.workflows;

  return useMutation<Workflow, Error, CreateWorkflowRequest>({
    mutationFn: async (
      workflowData: CreateWorkflowRequest
    ): Promise<Workflow> => {
      try {
        const response = await apiClient.post<Workflow>(
          apiConfig.endpoints.workflows.create,
          workflowData
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (data) => {
      // Add the new workflow to lists
      cacheInvalidation.invalidateWorkflows(queryClient);

      // Set the new workflow in cache
      queryClient.setQueryData(
        queryKeys.workflows.detail(data.id),
        data
      );
    },
  });
};

// Update workflow mutation
export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.workflows;

  return useMutation<
    Workflow,
    Error,
    { id: string; updates: UpdateWorkflowRequest }
  >({
    mutationFn: async ({ id, updates }): Promise<Workflow> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.workflows.detail,
          { id }
        );
        const response = await apiClient.patch<Workflow>(url, updates);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (data, { id }) => {
      // Update the specific workflow in cache
      queryClient.setQueryData(queryKeys.workflows.detail(id), data);

      // Invalidate workflow lists to reflect changes
      cacheInvalidation.invalidateWorkflows(queryClient);
    },
  });
};

// Delete workflow mutation
export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.workflows;

  return useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.workflows.delete,
          { id }
        );
        await apiClient.delete(url);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (_, workflowId) => {
      // Remove the specific workflow from cache
      queryClient.removeQueries({
        queryKey: queryKeys.workflows.detail(workflowId),
      });

      // Remove workflow executions
      queryClient.removeQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("workflows") &&
            queryKey.includes("executions") &&
            queryKey.includes(workflowId)
          );
        },
      });

      // Invalidate workflow lists
      cacheInvalidation.invalidateWorkflows(queryClient);
    },
  });
};

// Execute workflow mutation
export const useExecuteWorkflow = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.workflows;

  return useMutation<WorkflowExecution, Error, ExecuteWorkflowRequest>({
    mutationFn: async (
      executeData: ExecuteWorkflowRequest
    ): Promise<WorkflowExecution> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.workflows.execute,
          { id: executeData.input?.workflowId || "" }
        );
        const response = await apiClient.post<WorkflowExecution>(url, {
          input: executeData.input,
        });
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (data, executeData) => {
      // Invalidate workflow executions to show the new execution
      queryClient.invalidateQueries({
        queryKey: queryKeys.workflows.executions.all(executeData.input?.workflowId || ""),
      });

      // Set the execution status in cache
      queryClient.setQueryData(
        queryKeys.workflows.executions.detail("", data.id),
        data
      );
    },
  });
};

// Cancel workflow execution mutation
export const useCancelWorkflowExecution = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.workflows;

  return useMutation<void, Error, string>({
    mutationFn: async (executionId: string): Promise<void> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.workflows.cancelExecution,
          { executionId }
        );
        await apiClient.post(url);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (_, executionId) => {
      // Invalidate execution status to get updated status
      queryClient.invalidateQueries({
        queryKey: queryKeys.workflows.executions.detail("", executionId),
      });

      // Invalidate executions lists that might include this execution
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("workflows") && queryKey.includes("executions")
          );
        },
      });
    },
  });
};

// Hook for real-time workflow execution tracking
export const useWorkflowExecutionTracking = (
  executionId: string,
  enabled: boolean = true
) => {
  const executionStatus = useWorkflowExecutionStatus(executionId, enabled);

  return {
    ...executionStatus,

    // Execution state helpers
    isPending: executionStatus.data?.status === "pending",
    isRunning: executionStatus.data?.status === "running",
    isCompleted: executionStatus.data?.status === "completed",
    isFailed: executionStatus.data?.status === "failed",
    isCancelled: executionStatus.data?.status === "cancelled",

    // Progress and timing information
    duration: executionStatus.data?.duration,

    // Results and error information
    errorMessage: executionStatus.data?.errorMessage,
    logs: executionStatus.data?.logs,

    // Workflow information
    workflowId: executionStatus.data?.workflowId,

    // Whether the execution is still active (and polling should continue)
    isActive:
      executionStatus.data?.status === "running" ||
      executionStatus.data?.status === "pending",
  };
};

// Hook for bulk workflow operations
export const useBulkWorkflowOperations = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.workflows;

  const bulkDelete = useMutation<void, Error, string[]>({
    mutationFn: async (workflowIds: string[]): Promise<void> => {
      try {
        await Promise.all(
          workflowIds.map(async (id) => {
            const url = buildUrl(
              apiConfig.api.baseUrl,
              apiConfig.endpoints.workflows.delete,
              { id }
            );
            return apiClient.delete(url);
          })
        );
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (_, workflowIds) => {
      // Remove all deleted workflows from cache
      workflowIds.forEach((id) => {
        queryClient.removeQueries({ queryKey: queryKeys.workflows.detail(id) });
        queryClient.removeQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              queryKey.includes("workflows") &&
              queryKey.includes("executions") &&
              queryKey.includes(id)
            );
          },
        });
      });

      // Invalidate all workflow-related queries
      cacheInvalidation.invalidateWorkflows(queryClient);
    },
  });

  const bulkExecute = useMutation<WorkflowExecution[], Error, string[]>(
    {
      mutationFn: async (
        workflowIds: string[]
      ): Promise<WorkflowExecution[]> => {
        try {
          const executions = await Promise.all(
            workflowIds.map(async (workflowId) => {
              const url = buildUrl(
                apiConfig.api.baseUrl,
                apiConfig.endpoints.workflows.execute,
                { id: workflowId }
              );
              const response =
                await apiClient.post<WorkflowExecution>(url);
              return response.data;
            })
          );
          return executions;
        } catch (error) {
          throw handleApiError(error);
        }
      },
      retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
      onSuccess: (executions) => {
        // Invalidate execution queries for all affected workflows
        executions.forEach((execution) => {
          const workflowId = execution.workflowId;
          queryClient.invalidateQueries({
            queryKey: queryKeys.workflows.executions.all(workflowId),
          });

          // Set each execution status in cache
          queryClient.setQueryData(
            queryKeys.workflows.executions.detail("", execution.id),
            execution
          );
        });
      },
    }
  );

  return {
    bulkDelete,
    bulkExecute,
  };
};
