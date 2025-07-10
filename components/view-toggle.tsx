"use client"

import type { ViewType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { List, Kanban } from "lucide-react"

interface ViewToggleProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 dark:border-[#262626] rounded-lg p-1 ac">
      <Button
        size="sm"
        variant={currentView === "list" ? "secondary" : "ghost"}
        onClick={() => onViewChange("list")}
        className={`h-8 px-3 ${currentView === "list" ? 'dark:bg-white/10  dark:text-white text-[#737373] bg-black/10' : 'bg-transparent text-[#737373] hover:text-[#737373]'}`}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant={currentView === "kanban" ? "secondary" : "ghost"}
        onClick={() => onViewChange("kanban")}
        className={`h-8 px-3 ${currentView === "kanban" ? 'dark:bg-white/10  dark:text-white text-[#737373] bg-black/10 hover:text-[#737373]' : 'bg-transparent text-[#737373] hover:text-[#737373]'}`}
      >
        <Kanban className="w-4 h-4" />
      </Button>
    </div>
  )
}
