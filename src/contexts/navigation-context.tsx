'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface NavigationContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  currentPath: string
  setCurrentPath: (path: string) => void
  breadcrumbs: Breadcrumb[]
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void
}

interface Breadcrumb {
  label: string
  href?: string
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [currentPath, setCurrentPath] = useState('/')
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])

  return (
    <NavigationContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        currentPath,
        setCurrentPath,
        breadcrumbs,
        setBreadcrumbs,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}