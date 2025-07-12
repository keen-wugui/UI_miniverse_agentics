'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigation } from '@/contexts/navigation-context'
import { Settings, User, Bell, Palette, Key, Shield } from 'lucide-react'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const { setBreadcrumbs } = useNavigation()

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Settings' }
    ])
  }, [setBreadcrumbs])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your system configuration and user preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <CardTitle>User Preferences</CardTitle>
            </div>
            <CardDescription>
              Customize your dashboard and personal settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">• Profile management</p>
              <p className="text-sm text-muted-foreground">• Dashboard customization</p>
              <p className="text-sm text-muted-foreground">• Default view configurations</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>
              Theme and display preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">• Light/Dark mode toggle</p>
              <p className="text-sm text-muted-foreground">• Color scheme selection</p>
              <p className="text-sm text-muted-foreground">• Accessibility options</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure alert and notification preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">• Email notifications</p>
              <p className="text-sm text-muted-foreground">• System alerts</p>
              <p className="text-sm text-muted-foreground">• Workflow notifications</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <CardTitle>API Configuration</CardTitle>
            </div>
            <CardDescription>
              Manage API settings and data refresh intervals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">• API endpoint configuration</p>
              <p className="text-sm text-muted-foreground">• Refresh intervals</p>
              <p className="text-sm text-muted-foreground">• Timeout settings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings Interface</CardTitle>
          <CardDescription>
            Settings management interface will be implemented here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Settings Interface Coming Soon</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                System configuration and user preference management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}