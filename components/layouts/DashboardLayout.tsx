"use client"

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import {Sidebar} from "@/components/Sidebar"
import { useState } from "react"

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden w-full">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar isMobile={false} />
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-1 flex-col md:pl-0">
        {/* Mobile Menu */}
        {/* <div className="block md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="absolute top-4 right-4 z-50 p-0 w-12">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[80%] max-w-[300px] bg-background">
              <Sidebar isMobile={true} />
            </SheetContent>
          </Sheet>
        </div> */}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}