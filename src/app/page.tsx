"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigation } from "@/contexts/navigation-context";

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import {
  Activity,
  FileText,
  FolderOpen,
  Workflow,
  Settings2,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useHealthStatus } from "@/hooks/api/useHealth";
import { useDocuments } from "@/hooks/api/useDocuments";
import { useCollections } from "@/hooks/api/useCollections";
import { useWorkflows } from "@/hooks/api/useWorkflows";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { DocumentUpload } from "@/components/documents/document-upload";

export default function Dashboard() {
  const { setBreadcrumbs } = useNavigation();
  const router = useRouter();
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const { data: healthData, isLoading: isHealthLoading, error: healthError } = useHealthStatus();
  const {
    data: documentsData,
    isLoading: isDocumentsLoading,
    error: documentsError,
    refetch: refetchDocuments,
  } = useDocuments();
  const { data: collectionsData, isLoading: isCollectionsLoading, error: collectionsError } =
    useCollections();
  const { data: workflowsData, isLoading: isWorkflowsLoading, error: workflowsError } = useWorkflows();

  // Set demo mode if any API call fails
  useEffect(() => {
    if (healthError || documentsError || collectionsError || workflowsError) {
      setIsDemoMode(true);
    }
  }, [healthError, documentsError, collectionsError, workflowsError]);

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard" }]);
  }, [setBreadcrumbs]);

  const handleUploadSuccess = () => {
    setIsUploadSheetOpen(false);
    refetchDocuments();
  };

  const renderHealthStatus = () => {
    if (isHealthLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (healthError) {
      return (
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <span className="text-2xl font-bold text-orange-600">Demo Mode</span>
        </div>
      );
    }
    if (healthData?.status === "healthy") {
      return (
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-2xl font-bold text-green-600">Healthy</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="text-2xl font-bold text-red-600">Unhealthy</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to UI Miniverse Agentics
        </h1>
        <p className="text-muted-foreground">
          Your intelligent dashboard for managing agentic workflows and RAG
          systems.
        </p>
      </div>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">Demo Mode Active</h3>
                <p className="text-sm text-orange-700">
                  API backend is not connected. Showing demo data for interface preview.
                  Start your backend server at localhost:8000 to see real data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {renderHealthStatus()}
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isDocumentsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {documentsError ? "24" : (documentsData?.pagination.total ?? 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {documentsError ? "Demo data - connect to API for real data" : "Total documents in the system"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isCollectionsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {collectionsError ? "8" : (collectionsData?.pagination.total ?? 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {collectionsError ? "Demo data - connect to API for real data" : "Total collections created"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Workflows
            </CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isWorkflowsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {workflowsError ? "12" : (workflowsData?.pagination.total ?? 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {workflowsError ? "Demo data - connect to API for real data" : "Total workflows available"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setIsUploadSheetOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload Documents
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push("/collections")}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Create Collection
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push("/rag/configuration")}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Configure RAG
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push("/workflows")}
            >
              <Workflow className="mr-2 h-4 w-4" />
              Run Workflow
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Document processing completed
                  </p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="mt-0.5 h-4 w-4 text-blue-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Workflow execution started
                  </p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Configuration warning</p>
                  <p className="text-xs text-muted-foreground">
                    10 minutes ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Explore the key features of your agentic workflow dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">Analytics</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Monitor system performance and business metrics with interactive
                visualizations.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Settings2 className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Configuration</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage RAG configurations, test settings, and track version
                history.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Workflow className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium">Workflows</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Create, monitor, and optimize automated workflows for document
                processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Sheet open={isUploadSheetOpen} onOpenChange={setIsUploadSheetOpen}>
        <SheetContent className="w-[500px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Upload New Documents</SheetTitle>
            <SheetDescription>
              Select one or more files to upload.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-8">
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
