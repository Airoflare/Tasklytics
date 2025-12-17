import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/language-context"
import { TimezoneProvider } from "@/lib/timezone-context"
import { WorkspaceProvider } from "@/lib/workspace-context"

import { AppContentWrapper } from "@/components/app-content-wrapper";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Tasklytics",
    template: "%s"
  },
  description: "A simple task management app that runs entirely on the browser",
  manifest: "/manifest.json"
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/logo.webp" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <script suppressHydrationWarning dangerouslySetInnerHTML={{
          __html: `
            try {
              const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              document.documentElement.setAttribute('data-theme', theme);
              document.documentElement.classList.add(theme);
            } catch (e) {}
          `,
        }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <TimezoneProvider>
              <WorkspaceProvider>
                <AppContentWrapper>
                  {children}
                </AppContentWrapper>
              </WorkspaceProvider>
            </TimezoneProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
