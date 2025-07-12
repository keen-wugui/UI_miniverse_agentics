'use client'

import { useEffect } from 'react'
import { useNavigation } from '@/contexts/navigation-context'

export function WorkflowsBreadcrumbs() {
  const { setBreadcrumbs } = useNavigation()

  useEffect(() => {
    // Only set breadcrumbs on client side to avoid SSR issues
    if (typeof window !== 'undefined') {
      setBreadcrumbs([
        { label: 'Dashboard', href: '/' },
        { label: 'Workflows' }
      ])
    }
  }, [setBreadcrumbs])

  return null
}