'use client'

import { Suspense } from 'react'
import { NavigationProvider } from '@/contexts/navigation-context'
import { ErrorBoundary } from './error-boundary'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { MobileSidebar } from './mobile-sidebar'
import { Loading } from './loading'
import { cn } from '@/lib/utils'
import { useNavigation } from '@/contexts/navigation-context'

interface AppLayoutProps {
  children: React.ReactNode
}

function LayoutContent({ children }: AppLayoutProps) {
  const { isCollapsed } = useNavigation()

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center border-b bg-background px-4 md:px-0">
          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileSidebar />
          </div>
          
          {/* Header Content */}
          <div className="flex-1">
            <Header />
          </div>
        </div>

        {/* Page Content */}
        <main 
          className={cn(
            'flex-1 overflow-y-auto transition-all duration-300',
            'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border'
          )}
        >
          <ErrorBoundary>
            <Suspense fallback={<Loading className="h-64" />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <NavigationProvider>
      <LayoutContent>{children}</LayoutContent>
    </NavigationProvider>
  )
}