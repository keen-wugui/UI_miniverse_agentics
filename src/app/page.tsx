'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigation } from '@/contexts/navigation-context'
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
} from 'lucide-react'

export default function Dashboard() {
  const { setBreadcrumbs } = useNavigation()

  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard' }])
  }, [setBreadcrumbs])

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to UI Miniverse Agentics</h1>
        <p className="text-muted-foreground">
          Your intelligent dashboard for managing agentic workflows and RAG systems.
        </p>
      </div>

      {/* System Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">Healthy</span>
            </div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">+2 new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">3 running now</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Upload Documents
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FolderOpen className="mr-2 h-4 w-4" />
              Create Collection
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings2 className="mr-2 h-4 w-4" />
              Configure RAG
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Workflow className="mr-2 h-4 w-4" />
              Run Workflow
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system events and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Document processing completed</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="mt-0.5 h-4 w-4 text-blue-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Workflow execution started</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Configuration warning</p>
                  <p className="text-xs text-muted-foreground">10 minutes ago</p>
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
                Monitor system performance and business metrics with interactive visualizations.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Settings2 className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Configuration</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage RAG configurations, test settings, and track version history.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Workflow className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium">Workflows</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Create, monitor, and optimize automated workflows for document processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 