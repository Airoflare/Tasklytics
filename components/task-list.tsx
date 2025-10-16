"use client"

import type { Task, Status, ViewType, Priority, Tag } from "@/lib/types"
import { TaskCard } from "./task-card"
import { KanbanBoard } from "./kanban-board"

interface TaskListProps {
  tasks: Task[]
  statuses: Status[]
  priorities: Priority[]
  tags: Tag[]
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
  tags,
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
          <KanbanBoard tasks={displayTasks} statuses={statuses} priorities={priorities} tags={tags} onTaskSelect={onTaskSelect} onTaskUpdate={onTaskUpdate} />
        </div>
      </div>
    );
  }

  // Group tasks by status
  const tasksByStatus = displayTasks.reduce((acc, task) => {
    const statusId = task.statusId || 'no-status'
    if (!acc[statusId]) {
      acc[statusId] = []
    }
    acc[statusId].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  // Sort statuses by their order, and include tasks
  const statusGroups = statuses
    .filter(status => tasksByStatus[status.id] && tasksByStatus[status.id].length > 0)
    .map(status => ({
      status,
      tasks: tasksByStatus[status.id]
    }))

  // Handle tasks without status
  const tasksWithoutStatus = tasksByStatus['no-status'] || []
  if (tasksWithoutStatus.length > 0) {
    statusGroups.push({
      status: null,
      tasks: tasksWithoutStatus
    })
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6" style={{ WebkitOverflowScrolling: 'touch', overflowScrolling: 'touch' }}>
        {statusGroups.length > 0 ? (
          <div className="space-y-6">
            {statusGroups.map(({ status, tasks }) => (
              <div key={status?.id || 'no-status'} className="space-y-3">
                {/* Status Header */}
                <div className="flex items-center gap-2 pb-2 pt-1 border-b border-black/5 dark:border-white/5">
                  {status ? (
                    <>
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: status.color }}
                      />
                      <h3 className="text-sm font-medium text-[#737373] dark:text-[#E8E7EA]">
                        {status.name}
                      </h3>
                      <span className="text-xs text-[#737373]/70 dark:text-[#9E9E9E]/70">
                        ({tasks.length})
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-400" />
                      <h3 className="text-sm font-medium text-[#737373] dark:text-[#E8E7EA]">
                        No Status
                      </h3>
                      <span className="text-xs text-[#737373]/70 dark:text-[#9E9E9E]/70">
                        ({tasks.length})
                      </span>
                    </>
                  )}
                </div>

                {/* Tasks in this status */}
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      status={status}
                      priorities={priorities}
                      tags={tags}
                      onClick={() => onTaskSelect(task)}
                      viewType={viewType}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[#737373] dark:text-[#9E9E9E]">
            {(searchQuery || filterOverdue || filterDueToday || filterDueThisWeek || filterPriorityId || filterTagIds.length > 0) ? "No tasks found. Try adjusting your search term or filters." : "No tasks yet. Click the + icon in the top right corner to add your first task!"}
          </div>
        )}
      </div>
    </div>
  )
}
