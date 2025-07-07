"use client";

import { useCompleteHealthCheck } from "@/hooks/api/useHealth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Database,
  Thermometer,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { PerformanceChart } from "@/components/health/performance-chart";

export default function HealthDashboard() {
  const { data, isLoading, isError, isHealthy } = useCompleteHealthCheck();

  const renderStatus = (status: boolean, loading: boolean) => {
    if (loading)
      return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Health Monitoring</h1>

      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 rounded-md border p-4">
              {renderStatus(!isError && isHealthy, isLoading)}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Overall Status
                </p>
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? "Checking..."
                    : isHealthy
                      ? "All systems operational"
                      : "One or more systems have issues"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              {renderStatus(data?.health?.status === "healthy", isLoading)}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">API Service</p>
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? "Checking..."
                    : `Version: ${data?.health?.version}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              {renderStatus(data?.database?.status === "connected", isLoading)}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">Database</p>
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? "Checking..."
                    : `${data?.database?.connectionCount} connections`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : data?.metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Connections</p>
                <p className="font-semibold">{data.metrics.totalConnections}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active Connections</p>
                <p className="font-semibold">
                  {data.metrics.activeConnections}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Idle Connections</p>
                <p className="font-semibold">{data.metrics.idleConnections}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Slow Queries</p>
                <p className="font-semibold">{data.metrics.slowQueries}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg. Response Time</p>
                <p className="font-semibold">
                  {data.metrics.averageResponseTime} ms
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Error Rate</p>
                <p className="font-semibold">{data.metrics.errorRate}%</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No metrics available.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceChart data={[]} title="" dataKey="value" unit="ms" />
          <p className="text-center text-sm text-muted-foreground mt-4">
            Note: Time-series data is not yet available from the API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
