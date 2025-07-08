import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProviders } from "./providers";
import { AppLayout } from "@/components/layout/app-layout";
import { Toaster } from "@/components/ui/toaster";

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
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </QueryProviders>
      </body>
    </html>
  );
}
