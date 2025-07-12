'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings2, Plus } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function ConfigurationsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RAG Configurations</h1>
          <p className="text-muted-foreground">
            Create and manage RAG configurations with validation, testing, and version tracking.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Configuration
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Management</CardTitle>
          <CardDescription>
            RAG configuration creation, testing, and management interface will be implemented here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center">
              <Settings2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Configuration Interface Coming Soon</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Form-based RAG configuration with validation and testing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}