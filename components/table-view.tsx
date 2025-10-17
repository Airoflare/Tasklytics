"use client"

import type { Task, Status, Priority, Tag } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { format } from 'date-fns-tz/format'
import { toZonedTime } from 'date-fns-tz/toZonedTime'
import { useTimezone } from "@/lib/timezone-context"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Paperclip } from "lucide-react"

interface TableViewProps {
  tasks: Task[]
  statuses: Status[]
  priorities: Priority[]
  tags: Tag[]
  onTaskSelect: (task: Task) => void
}

export function TableView({
  tasks,
  statuses,
  priorities,
  tags,
  onTaskSelect,
}: TableViewProps) {
  const { timezone } = useTimezone()

  const formatDate = (date: string) => {
    const zonedDate = toZonedTime(new Date(date), timezone)
    return format(zonedDate, "MMM d, yyyy", { timeZone: timezone })
  }

  const getStatusById = (statusId: string) => statuses.find(s => s.id === statusId)
  const getPriorityById = (priorityId: string) => priorities.find(p => p.id === priorityId)
  const getTagsByIds = (tagIds: string[]) => tagIds.map(id => tags.find(t => t.id === id)).filter(Boolean) as Tag[]

  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Title</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[120px]">Priority</TableHead>
            <TableHead className="w-[200px]">Tags</TableHead>
            <TableHead className="w-[120px]">Deadline</TableHead>
            <TableHead className="w-[120px]">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const status = getStatusById(task.statusId)
            const priority = task.priorityId ? getPriorityById(task.priorityId) : null
            const taskTags = getTagsByIds(task.tags)

            return (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onTaskSelect(task)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-2">{task.title}</span>
                    {task.attachments.length > 0 && (
                      <Paperclip className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {status && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-sm">{status.name}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {priority && (
                    <Badge
                      className="flex items-center gap-2 px-2 py-1 text-xs w-fit"
                      style={{ color: priority.color }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: priority.color }}
                      />
                      {priority.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {taskTags.map(tag => (
                      <Badge
                        key={tag.id}
                        className="flex items-center gap-2 px-2 py-1 text-xs"
                        style={{ color: tag.color }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {task.deadline ? formatDate(task.deadline) : "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(task.createdAt)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No tasks found.
        </div>
      )}
    </div>
  )
}