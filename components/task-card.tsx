"use client"

import { memo } from "react"
import type { Task, Status, ViewType, Priority } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { format } from 'date-fns-tz/format'
import { toZonedTime } from 'date-fns-tz/toZonedTime'
import { useTimezone } from "@/lib/timezone-context"
import { Paperclip, Timer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"

interface TaskCardProps {
  task: Task
  status?: Status
  priorities: Priority[]
  onClick: () => void
  viewType: ViewType
}

export const TaskCard = memo(({
  task,
  status,
  priorities,
  onClick,
  viewType,
}: TaskCardProps) => {
  const { timezone } = useTimezone();
  const { t } = useLanguage();

  const formatDate = (date: string) => {
    const zonedDate = toZonedTime(new Date(date), timezone);
    return formatDistanceToNow(zonedDate, { addSuffix: true });
  };

  const formatDateShort = (date: string) => {
    const zonedDate = toZonedTime(new Date(date), timezone);
    return format(zonedDate, "MMM d", { timeZone: timezone });
  };

  if (viewType === "cards") {
    return (
      <div
        className="group  dark:border-[#262626] rounded-md p-3 cursor-pointer hover:bg-gray-750 transition-colors border border-gray-700 flex flex-col h-full"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          {status && (
            <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: status.color }} />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white mb-2 line-clamp-2">{task.title}</h3>
            {task.description && <p className="text-[#737373] dark:text-[#9E9E9E] text-sm mb-3 line-clamp-3">{task.description}</p>}
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-700 w-full flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-[#737373] dark:text-[#9E9E9E]">
            {task.priorityId && (
              <Badge
                className="flex items-center gap-2 px-1 py-0 rounded-sm text-xs w-fit"
                style={{
                  color: priorities.find(p => p.id === task.priorityId)?.color || '#6b7280',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: priorities.find(p => p.id === task.priorityId)?.color || '#6b7280' }}
                />
                {priorities.find(p => p.id === task.priorityId)?.name}
              </Badge>
            )}
            {task.deadline && (
              <div className="flex items-center gap-1">
                <Timer className="w-4 h-4" />
                <span>{formatDate(task.deadline)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors group text-[#737373] bg-black/5 dark:bg-[#090909] hover:text-black dark:hover:bg-white/5  dark:border-[#262626]/50"
      onClick={onClick}
    >
      {/* Status icon */}
      {status && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />}

      {/* Task title */}
      <div className="flex-1 min-w-0">
        <h3 className="dark:hover:text-white text-[#737373] dark:text-[#E8E7EA] text-sm font-normal transition-colors truncate">{task.title}</h3>
      </div>

      {/* Date */}
      {task.deadline && (
        <div className="flex items-center gap-1 text-xs text-[#737373] dark:text-[#9E9E9E] whitespace-nowrap">
          <Timer className="w-4 h-4" />
          <span>{formatDate(task.deadline)}</span>
        </div>
      )}
      <div className="flex items-center gap-1 text-xs text-[#737373] dark:text-[#9E9E9E] whitespace-nowrap">
          {task.priorityId && (
            <Badge
              className="flex items-center gap-2 px-1 py-0 rounded-sm text-xs w-fit"
              style={{
                color: priorities.find(p => p.id === task.priorityId)?.color || '#6b7280',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: priorities.find(p => p.id === task.priorityId)?.color || '#6b7280' }}
              />
              {priorities.find(p => p.id === task.priorityId)?.name}
            </Badge>
          )}
        </div>
      <div className="flex items-center gap-3 text-xs text-[#737373] dark:text-[#9E9E9E]">
        {/* Attachment count */}
        {task.attachments.length > 0 && (
          <div className="flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            <span>{task.attachments.length}</span>
          </div>
        )}
      </div>
    </div>
  )
})
