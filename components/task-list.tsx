"use client"

import type { Task, Status, ViewType, Priority } from "@/lib/types"
import { TaskCard } from "./task-card"
import { KanbanBoard } from "./kanban-board"

interface TaskListProps {
  tasks: Task[]
  statuses: Status[]
  priorities: Priority[]
  viewType: ViewType
  onTaskSelect: (task: Task) => void
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  searchQuery: string
  filterOverdue: boolean
  filterDueToday: boolean
  filterDueThisWeek: boolean
  filterPriorityId: string | null
  filterTagIds: string[]
}

export function TaskList({
  tasks,
  statuses,
  priorities,
  viewType,
  onTaskSelect,
  onTaskUpdate,
  searchQuery,
  filterOverdue,
  filterDueToday,
  filterDueThisWeek,
  filterPriorityId,
  filterTagIds,
}: TaskListProps) {
  const displayTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (viewType === "kanban") {
    return (
      <div className="h-full overflow-x-auto">
        <div className="inline-block min-w-full align-top">
          <KanbanBoard tasks={displayTasks} statuses={statuses} priorities={priorities} onTaskSelect={onTaskSelect} onTaskUpdate={onTaskUpdate} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-2">
          {displayTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              status={statuses.find((s) => s.id === task.statusId)}
              priorities={priorities}
              onClick={() => onTaskSelect(task)}
              viewType={viewType}
            />
          ))}
          {displayTasks.length === 0 && (
            <div className="text-center py-12 text-[#737373] dark:text-[#9E9E9E]">
              {(searchQuery || filterOverdue || filterDueToday || filterDueThisWeek || filterPriorityId || filterTagIds.length > 0) ? "No tasks found. Try adjusting your search term or filters." : "No tasks yet. Click the + icon in the top right corner to add your first task!"}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
