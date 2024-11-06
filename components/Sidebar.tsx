"use client"

import { Home, LineChart, Settings, PanelLeftClose, PanelLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"

const sidebarItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Trading Pairs", href: "/dashboard/pairs", icon: LineChart },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn(
      "relative h-full bg-background border-r transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="sticky top-0 z-20 h-16 flex items-center border-b bg-background">
        <div className={cn(
          "flex items-center w-full",
          isCollapsed ? "px-2 justify-center" : "px-6 justify-between"
        )}>
          {!isCollapsed && <h1 className="text-xl font-bold">Trading Dashboard</h1>}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-secondary rounded-md border border-border text-primary"
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-background -z-10" />
      <nav className={cn(
        "relative space-y-1 py-4 flex-1",
        isCollapsed ? "px-2" : "px-3"
      )}>
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-secondary/50",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
              {!isCollapsed && item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
