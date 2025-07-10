"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Sidebar } from "./sidebar"
import type { Status } from "@/lib/types"

interface MobileSidebarProps {
  statuses: (Status & { count: number })[]
  selectedStatus: string | null
  onStatusSelect: (statusId: string | null) => void
  onSettingsClick: () => void
}

export function MobileSidebar({ statuses, selectedStatus, onStatusSelect, onSettingsClick }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-80">
        <Sidebar
          statuses={statuses}
          selectedStatus={selectedStatus}
          onStatusSelect={(statusId) => {
            onStatusSelect(statusId)
            setOpen(false)
          }}
          onSettingsClick={() => {
            onSettingsClick()
            setOpen(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
