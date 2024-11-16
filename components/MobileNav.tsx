'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LineChart, Settings } from "lucide-react"

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className={`flex flex-col items-center ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`}>
          <Home size={24} />
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/signals" className={`flex flex-col items-center ${pathname === "/signals" ? "text-primary" : "text-muted-foreground"}`}>
          <LineChart size={24} />
          <span className="text-xs">Signals</span>
        </Link>
        <Link href="/settings" className={`flex flex-col items-center ${pathname === "/settings" ? "text-primary" : "text-muted-foreground"}`}>
          <Settings size={24} />
          <span className="text-xs">Settings</span>
        </Link>
      </div>
    </div>
  )
} 