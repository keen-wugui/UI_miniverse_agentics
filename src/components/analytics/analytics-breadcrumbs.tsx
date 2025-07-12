'use client'

import { useEffect, useState } from 'react'
import { useNavigation } from '@/contexts/navigation-context'

export function AnalyticsBreadcrumbs() {
  const [isMounted, setIsMounted] = useState(false)
  const { setBreadcrumbs } = useNavigation()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      setBreadcrumbs([
        { label: 'Dashboard', href: '/' },
        { label: 'Analytics' }
      ])
    }
  }, [setBreadcrumbs, isMounted])

  return null
}