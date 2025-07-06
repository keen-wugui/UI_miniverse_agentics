'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useNavigation } from '@/contexts/navigation-context'
import {
  Home,
  FileText,
  FolderOpen,
  Workflow,
  Settings2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

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

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, setIsCollapsed } = useNavigation()

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center border-b px-3">
        {!isCollapsed && (
          <div className="flex-1">
            <h1 className="text-lg font-semibold">UI Miniverse</h1>
            <p className="text-xs text-muted-foreground">Agentic Dashboard</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isCollapsed ? 'px-2' : 'px-3',
                  isActive && 'bg-secondary'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1 text-left">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Settings */}
      <div className="p-2">
        <Link href="/settings">
          <Button
            variant={pathname === '/settings' ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start',
              isCollapsed ? 'px-2' : 'px-3'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="ml-3">Settings</span>}
          </Button>
        </Link>
      </div>
    </div>
  )
}