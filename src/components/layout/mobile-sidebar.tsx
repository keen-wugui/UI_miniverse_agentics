'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  FileText,
  FolderOpen,
  Workflow,
  Settings2,
  BarChart3,
  Settings,
} from 'lucide-react'
import { useState } from 'react'

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'System overview and metrics',
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
    description: 'Document management',
    badge: 'New',
  },
  {
    title: 'Collections',
    href: '/collections',
    icon: FolderOpen,
    description: 'Collection browser',
  },
  {
    title: 'Workflows',
    href: '/workflows',
    icon: Workflow,
    description: 'Workflow management',
  },
  {
    title: 'Configurations',
    href: '/configurations',
    icon: Settings2,
    description: 'RAG configuration',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Reporting and insights',
  },
]

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center border-b px-4">
            <div className="flex-1">
              <h1 className="text-lg font-semibold">UI Miniverse</h1>
              <p className="text-xs text-muted-foreground">Agentic Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )
            })}
          </nav>

          <Separator />

          {/* Settings */}
          <div className="p-4">
            <Link href="/settings" onClick={() => setOpen(false)}>
              <Button
                variant={pathname === '/settings' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}