"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Settings, Fan, Sun, Moon, Star } from "lucide-react"
import { useTheme } from "next-themes"
import type { Status } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"

interface SidebarProps {
  statuses: (Status & { count: number })[]
  selectedStatus: string | null
  onStatusSelect: (statusId: string | null) => void
  hiddenStatuses?: string[]
  onToggleStatusVisibility?: (statusId: string) => void
  appName?: string
  appIcon?: string | null
  onSettingsClick: () => void
}

export function Sidebar({
  statuses,
  selectedStatus,
  onStatusSelect,
  hiddenStatuses = [],
  appName = "Tasklytics",
  appIcon = null,
  onSettingsClick,
}: SidebarProps) {
  const [showHiddenStatuses, setShowHiddenStatuses] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = searchParams.get("page")
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage();

  const visibleStatuses = statuses.filter((status) => !hiddenStatuses.includes(status.id))
  const hiddenStatusList = statuses.filter((status) => hiddenStatuses.includes(status.id))

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <div className="w-72 dark:bg-black border-r border-gray-200 dark:border-gray-900 dark:border-white/10 flex flex-col">
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overflowScrolling: 'touch' }}>
        <div className="p-4">
          <div className="mb-6">
            <div className="space-y-1">
              <div className="w-full justify-between text-left h-auto p-2 flex items-center">
                <div className="flex items-center gap-2">
                  {appIcon ? (
                    <img src={appIcon || "/placeholder.svg"} alt={t("App Icon")} className="w-6 h-6 rounded-full" />
                  ) : (
                    <Fan className="w-4 h-4 text-[#737373] dark:text-[#9E9E9E]" />
                  )}
                  <span className="text-[#737373] dark:text-[#E8E7EA]">{t(appName)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="h-6 w-6 p-0 text-[#737373] hover:text-black hover:bg-black/10 dark:hover:bg-white/30 dark:text-[#E8E7EA]"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className={`w-full justify-between text-left h-auto p-2 dark:border-[#262626] ${currentPage !== "settings" && selectedStatus === null ? "dark:bg-[#151515] dark:border-[#262626] dark:hover:bg-[#151515] hover:bg-black/10 bg-black/10" : ""}`}
                onClick={() => onStatusSelect(null)}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#737373] dark:text-[#9E9E9E]" />
                  <span className="text-[#737373] dark:text-[#E8E7EA]">{t("All Tasks")}</span>
                </div>
                <Badge variant="secondary" className="text-xs text-[#737373] bg-black/10 dark:text-white/50">
                  {statuses.reduce((sum, status) => sum + status.count, 0)}
                </Badge>
              </Button>
            </div>
          </div>

          {/* STATUS SECTION */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-[#737373] dark:text-[#9E9E9E] tracking-wider mb-3">{t("Status")}</h3>
            <div className="space-y-1">
              {/* Visible Statuses */}
              {visibleStatuses.map((status) => (
                <div key={status.id} className="group flex items-center">
                  <Button
                    variant="ghost"
                    className={`flex-1 justify-between text-left h-auto p-2 dark:border-[#262626] ${currentPage !== "settings" && selectedStatus === status.id ? "dark:bg-[#151515] dark:border-[#262626] dark:hover:bg-[#151515] hover:bg-black/10 bg-black/10" : ""}`}
                    onClick={() => onStatusSelect(status.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-[#737373] dark:text-[#E8E7EA] ">{status.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs text-[#737373] bg-black/10 dark:text-white/50 dark:bg-white/10">
                      {status.count}
                    </Badge>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* ADMIN SECTION */}
          <div>
            <h3 className="text-xs font-medium text-[#737373] dark:text-[#9E9E9E] tracking-wider mb-3">{t("Admin")}</h3>
            <div className="space-y-1 ">
              <Button
                variant="ghost"
                className={`w-full justify-start text-left h-auto p-2 dark:border-[#262626] ${currentPage === "settings" ? "dark:bg-[#151515] dark:border-[#262626] dark:hover:bg-[#151515] hover:bg-black/10 bg-black/10" : ""}`}
                onClick={onSettingsClick}
              >
                <Settings className="w-4 h-4 text-[#737373] dark:text-[#9E9E9E]" />
                <span className="text-[#737373] dark:text-[#E8E7EA]">{t("Settings")}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
