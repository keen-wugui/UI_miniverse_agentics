'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigation } from '@/contexts/navigation-context'
import { FolderOpen, Plus, Search, Settings } from 'lucide-react'

export default function CollectionsPage() {
  const { setBreadcrumbs } = useNavigation()

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Collections' }
    ])
  }, [setBreadcrumbs])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Organize and manage your document collections with hierarchical structure.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Browser</CardTitle>
          <CardDescription>
            Visual collection management interface will be implemented here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Collections Interface Coming Soon</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Hierarchical collection browser and management tools.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}