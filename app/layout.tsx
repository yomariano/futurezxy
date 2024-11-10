import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="h-full relative">
          <main>
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
