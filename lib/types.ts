export interface Task {
  id: string
  title: string
  description: string
  statusId: string
  priorityId?: string
  tags: string[]
  attachments: string[]
  deadline?: string
  createdAt: string
  updatedAt: string
}

export type Status = {
  id: string
  name: string
  color: string
  order: number
  createdAt: string
}

export type Tag = {
  id: string
  name: string
  color: string
  createdAt: string
}

export type Priority = {
  id: string
  name: string
  color: string
  order: number
  createdAt: string
}

export type ViewType = "list" | "kanban" | "cards"
