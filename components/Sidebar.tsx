"use client"

import { LineChart, Settings, PanelLeftClose, PanelLeft, BarChart2Icon, SettingsIcon, CreditCardIcon, LogOut, Lock } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ChatBot } from "@/components/ChatBot"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

const sidebarItems = [
  { name: "Signals", href: "/signals", icon: LineChart, enabled: true },
  { 
    name: "Analytics", 
    href: "/analytics", 
    icon: BarChart2Icon, 
    enabled: false,
    disabledMessage: "Analytics coming soon" 
  },
  { name: "Settings", href: "/settings", icon: SettingsIcon, enabled: true },
  { 
    name: "Billing", 
    href: "/billing", 
    icon: CreditCardIcon, 
    enabled: false,
    disabledMessage: "Billing coming soon" 
  },
]

export function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

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
        <TooltipProvider>
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            const itemContent = (
              <div
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/50",
                  !item.enabled && "opacity-50 cursor-not-allowed",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                {!isCollapsed && (
                  <>
                    {item.name}
                    {!item.enabled && <Lock className="h-3 w-3 ml-auto" />}
                  </>
                )}
              </div>
            )

            return (
              <Tooltip key={item.name} delayDuration={300}>
                <TooltipTrigger asChild>
                  {item.enabled ? (
                    <Link href={item.href}>
                      {itemContent}
                    </Link>
                  ) : (
                    itemContent
                  )}
                </TooltipTrigger>
                {!item.enabled && (
                  <TooltipContent>
                    <p>{item.disabledMessage}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </nav>
      <div className="mt-auto border-t">
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center w-full px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/50",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Sign Out"}
        </button>
        {/* <div className="p-4">
          <ChatBot />
        </div> */}
      </div>
    </div>
  )
}
