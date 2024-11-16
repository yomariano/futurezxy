'use client'
import '../styles/globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "next-themes"
import { cn } from "@/lib/utils"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import MobileNav from "@/components/MobileNav"
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/'

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {isLandingPage ? (
            children
          ) : (
            <DashboardLayout>
              <main className="md:pl-64 pb-16 md:pb-0">
                {children}
              </main>
              <MobileNav />
            </DashboardLayout>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
