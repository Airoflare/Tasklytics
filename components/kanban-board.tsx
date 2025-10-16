"use client"

import type { Task, Status } from "@/lib/types"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd"
import { Badge } from "@/components/ui/badge"
import { Timer, Paperclip } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toZonedTime } from 'date-fns-tz/toZonedTime'
import { useTimezone } from "@/lib/timezone-context"

import type { Task, Status, Priority } from "@/lib/types"

interface KanbanBoardProps {
  tasks: Task[]
  statuses: Status[]
  priorities: Priority[]
  onTaskSelect: (task: Task) => void
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
}

export function KanbanBoard({
  tasks,
  statuses,
  priorities,
  onTaskSelect,
  onTaskUpdate,
}: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const { draggableId, destination } = result
    const newStatusId = destination.droppableId

    onTaskUpdate(draggableId, { statusId: newStatusId })
  }

  const getTasksByStatus = (statusId: string) => {
    return tasks.filter((task) => task.statusId === statusId)
  }

  const { timezone } = useTimezone();

  const formatDateDeadline = (date: string) => {
    const zonedDate = toZonedTime(new Date(date), timezone);
    return formatDistanceToNow(zonedDate, { addSuffix: true });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto h-full">
        <div className="flex gap-4 min-w-max px-4 pb-4">
          {statuses.map((status) => {
            const statusTasks = getTasksByStatus(status.id)
            return (
              <div
                key={status.id}
                className="w-80 flex-shrink-0 bg-[#F6F6F6] dark:bg-[#151515] rounded-lg p-4 h-[calc(100vh-120px)] flex flex-col"
              >
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <h3 className="text-sm font-medium text-[#0A0A0A] dark:text-white">
                    {status.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-[#9E9E9E]">
                    ( {statusTasks.length} )
                  </span>
                </div>

                <Droppable droppableId={status.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-3 overflow-y-auto flex-1 pr-1"
                      style={{ WebkitOverflowScrolling: 'touch', overflowScrolling: 'touch' }}
                    >
                      {statusTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                bg-white dark:bg-[#0A0A0A] rounded-lg cursor-pointer
                                border border-black/5 dark:border-[#262626]
                                hover:bg-black/5 hover:text-[#0A0A0A]
                                dark:hover:bg-white/5 dark:hover:text-[#FAFAFA]
                                shadow-[0_1px_3px_0_#E4E4E4] dark:shadow-none
                                transition-colors p-3
                              `}
                              onClick={() => onTaskSelect(task)}
                            >
                              <h4 className="text-sm font-normal truncate mb-2 ml-2 mt-1 text-[#0A0A0A] dark:text-white">
                                {task.title}
                              </h4>
                              <div className="flex items-center  ml-2 gap-2 text-xs text-gray-500 dark:text-[#9E9E9E] mb-2">
                                {task.deadline && (
                                  <div className="flex items-center gap-1">
                                    <Timer className="w-3.5 h-3.5" />
                                    <span>{formatDateDeadline(task.deadline)}</span>
                                  </div>
                                )}
                                {task.priorityId && (
                                  <Badge
                                    className="flex items-center gap-2 px-1 py-0 rounded-sm text-xs"
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
                                {task.attachments.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{task.attachments.length}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </div>
    </DragDropContext>
  )
}
