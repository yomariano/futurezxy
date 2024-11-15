"use client"

import { LineChart, Settings, PanelLeftClose, PanelLeft, BarChart2Icon, SettingsIcon, CreditCardIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ChatBot } from "@/components/ChatBot"

const sidebarItems = [
  { name: "Signals", href: "/signals", icon: LineChart },
  { name: "Analytics", href: "/analytics", icon: BarChart2Icon },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
  { name: "Billing", href: "/billing", icon: CreditCardIcon },
]

export function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn("fixed left-0 top-0 bottom-0 w-64 border-r hidden md:block", { "w-16": isCollapsed })}>
      <div className="sticky top-0 z-20 h-16 flex items-center border-b bg-background">
        <div className={cn(
          "flex items-center w-full",
          !isMobile && (isCollapsed ? "px-2 justify-center" : "px-6 justify-between")
        )}>
          {(!isCollapsed || isMobile) && <h1 className="text-xl font-bold">Trading Dashboard</h1>}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!isMobile && (
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
            )}
          </div>
        </div>
      </div>
      <nav className={cn(
        "relative space-y-1 py-4 flex-1",
        !isMobile && (isCollapsed ? "px-2" : "px-3")
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
      <div className="mt-auto p-4 border-t">
        <ChatBot />
      </div>
    </div>
  )
}
