import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProviders } from "./providers";
import { AppLayout } from "@/components/layout/app-layout";
import { Toaster } from "@/components/ui/toaster";
import { OfflineAware } from "@/components/ui/offline-indicator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UI Miniverse Agentics",
  description: "Agentic workflow dashboard built with Next.js 2025",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProviders>
          <OfflineAware>
            <AppLayout>{children}</AppLayout>
          </OfflineAware>
          <Toaster />
        </QueryProviders>
      </body>
    </html>
  );
}
