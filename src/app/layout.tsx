import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryProviders } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UI Miniverse Agentics',
  description: 'Agentic workflow dashboard built with Next.js 15',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProviders>
          {children}
        </QueryProviders>
      </body>
    </html>
  )
} 