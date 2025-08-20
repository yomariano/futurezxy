"use client";
import "../styles/globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import MobileNav from "@/components/MobileNav";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FutureZXY" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ServiceWorkerRegistration />
          {isLandingPage ? (
            children
          ) : (
            <DashboardLayout>
              <main className="md:pl-64 pb-16 md:pb-0">{children}</main>
              <MobileNav />
            </DashboardLayout>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
